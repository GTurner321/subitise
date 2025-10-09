/**
 * BalanceDragDropHandler - Handles all drag and drop interactions
 * Manages dragging blocks, drop validation, and pan placement
 * UPDATED: Gravity-based stacking (drop in free space, fall until base touches floor/block),
 * lighter green hover, restricted visual drop zone (3.5 blocks high)
 */
class BalanceDragDropHandler {
    constructor(svg, elementManager, gameRenderer) {
        this.svg = svg;
        this.elementManager = elementManager;
        this.gameRenderer = gameRenderer;
        
        // Drag state
        this.draggedBlock = null;
        this.dragOffset = { x: 0, y: 0 };
        this.isDragging = false;
        this.hoveredPan = null;
        
        this.setupEventListeners();
    }
    
    /**
     * Setup unified mouse and touch event listeners
     */
    setupEventListeners() {
        this.svg.addEventListener('mousedown', (e) => this.handlePointerStart(e));
        this.svg.addEventListener('touchstart', (e) => this.handlePointerStart(e), { passive: false });
        
        document.addEventListener('mousemove', (e) => this.handlePointerMove(e));
        document.addEventListener('touchmove', (e) => this.handlePointerMove(e), { passive: false });
        
        document.addEventListener('mouseup', (e) => this.handlePointerEnd(e));
        document.addEventListener('touchend', (e) => this.handlePointerEnd(e), { passive: false });
    }
    
    /**
     * Get unified event point from mouse or touch events
     */
    getEventPoint(e) {
        let clientX, clientY;
        
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        const rect = this.svg.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }
    
    /**
     * Handle start of drag operation
     */
    handlePointerStart(e) {
        const point = this.getEventPoint(e);
        const block = this.findBlockAtPoint(point);
        
        if (!block) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        this.isDragging = true;
        this.draggedBlock = block;
        
        // Hide shadow when picking up
        this.elementManager.hideBlockShadow(block);
        
        // Remove from pan if it was in one
        if (block._inPan) {
            const pan = block._inPan;
            const index = pan.blocks.indexOf(block);
            if (index > -1) pan.blocks.splice(index, 1);
            
            // Update drop zone state
            this.updateDropZoneState(pan);
            
            // Calculate global position BEFORE removing from pan
            const localX = parseFloat(block.getAttribute('data-local-x') || 0);
            const localY = parseFloat(block.getAttribute('data-local-y') || 0);
            const globalX = pan.currentX + localX;
            const globalY = pan.currentY + localY;
            
            // Remove pan association
            block._inPan = null;
            
            // Move block to main SVG
            this.svg.appendChild(block);
            
            // Update to global coordinates
            this.elementManager.updateBlockPosition(block, globalX, globalY);
            
            // Calculate drag offset AFTER moving to global coordinates
            this.dragOffset.x = globalX - point.x;
            this.dragOffset.y = globalY - point.y;
            
            // Notify game controller
            if (this.gameRenderer && this.gameRenderer.onBlockMoved) {
                this.gameRenderer.onBlockMoved();
            }
        } else {
            // Block on ground - calculate offset normally
            this.dragOffset.x = block._centerX - point.x;
            this.dragOffset.y = block._centerY - point.y;
        }
        
        // Visual feedback
        block.style.cursor = 'grabbing';
        block.classList.add('dragging');
        block._rect.setAttribute('stroke-width', '4');
    }
    
    /**
     * Handle drag movement
     */
    handlePointerMove(e) {
        if (!this.isDragging || !this.draggedBlock) return;
        
        e.preventDefault();
        const point = this.getEventPoint(e);
        
        const newX = point.x + this.dragOffset.x;
        const newY = point.y + this.dragOffset.y;
        
        this.elementManager.updateBlockPosition(this.draggedBlock, newX, newY);
        
        // Check for pan hover
        this.checkPanHover(newX, newY);
    }
    
    /**
     * Handle end of drag operation
     */
    handlePointerEnd(e) {
        if (!this.isDragging || !this.draggedBlock) return;
        
        e.preventDefault();
        const point = this.getEventPoint(e);
        
        const dropX = point.x + this.dragOffset.x;
        const dropY = point.y + this.dragOffset.y;
        
        // Try to place in pan
        const placedInPan = this.tryPlaceInPan(dropX, dropY);
        
        if (!placedInPan) {
            // Place on ground with shadow
            this.placeBlockOnGround(this.draggedBlock, dropX, dropY);
        }
        
        // Reset drag state
        this.draggedBlock.style.cursor = 'grab';
        this.draggedBlock.classList.remove('dragging');
        this.draggedBlock._rect.setAttribute('stroke-width', '3');
        
        this.clearPanHover();
        
        this.isDragging = false;
        this.draggedBlock = null;
        
        // Notify game controller
        if (this.gameRenderer && this.gameRenderer.onBlockMoved) {
            this.gameRenderer.onBlockMoved();
        }
    }
    
    /**
     * Check if dragging over a pan and highlight drop zone
     * UPDATED: Uses visual drop zone height (3.5 blocks from pan base)
     */
    checkPanHover(x, y) {
        const leftPan = this.elementManager.leftPan;
        const rightPan = this.elementManager.rightPan;
        
        let foundHover = false;
        
        // Check left pan
        if (leftPan && this.isOverVisualDropZone(x, y, leftPan)) {
            if (this.hoveredPan !== leftPan) {
                this.clearPanHover();
                this.hoveredPan = leftPan;
                leftPan.dropZone.classList.add('hover');
            }
            foundHover = true;
        }
        // Check right pan
        else if (rightPan && this.isOverVisualDropZone(x, y, rightPan)) {
            if (this.hoveredPan !== rightPan) {
                this.clearPanHover();
                this.hoveredPan = rightPan;
                rightPan.dropZone.classList.add('hover');
            }
            foundHover = true;
        }
        
        if (!foundHover && this.hoveredPan) {
            this.clearPanHover();
        }
    }
    
    /**
     * Clear pan hover effects
     */
    clearPanHover() {
        if (this.hoveredPan && this.hoveredPan.dropZone) {
            this.hoveredPan.dropZone.classList.remove('hover');
            this.hoveredPan = null;
        }
    }
    
    /**
     * Check if point is over the VISUAL drop zone (3.5 blocks high from pan base)
     * UPDATED: Uses visual height, not functional height
     */
    isOverVisualDropZone(x, y, pan) {
        const dropZone = pan.dropZone;
        const localX = parseFloat(dropZone.getAttribute('x'));
        const localY = parseFloat(dropZone.getAttribute('y'));
        const width = parseFloat(dropZone.getAttribute('width'));
        const visualHeight = parseFloat(dropZone.getAttribute('height')); // Visual height (3.5 blocks)
        
        // Convert to global coordinates
        const globalX = pan.currentX + localX;
        const globalY = pan.currentY + localY;
        
        // Check if point is inside visual drop zone
        return x >= globalX && x <= globalX + width && y >= globalY && y <= globalY + visualHeight;
    }
    
    /**
     * Check if point is over the FUNCTIONAL drop zone (5.5 blocks high for placement detection)
     */
    isOverFunctionalDropZone(x, y, pan) {
        const dropZone = pan.dropZone;
        const localX = parseFloat(dropZone.getAttribute('x'));
        const width = parseFloat(dropZone.getAttribute('width'));
        const functionalHeight = parseFloat(dropZone.getAttribute('data-functional-height'));
        
        // Functional drop zone extends higher
        const localY = -pan.extensionHeight - functionalHeight;
        
        // Convert to global coordinates
        const globalX = pan.currentX + localX;
        const globalY = pan.currentY + localY;
        
        // Check if point is inside functional drop zone
        return x >= globalX && x <= globalX + width && y >= globalY && y <= globalY + functionalHeight;
    }
    
    /**
     * Try to place block in a pan
     */
    tryPlaceInPan(x, y) {
        const leftPan = this.elementManager.leftPan;
        const rightPan = this.elementManager.rightPan;
        
        // Check left pan first (use functional height for placement)
        if (leftPan && this.isOverFunctionalDropZone(x, y, leftPan)) {
            return this.placeBlockInPan(this.draggedBlock, leftPan, x, y);
        }
        
        // Check right pan (use functional height for placement)
        if (rightPan && this.isOverFunctionalDropZone(x, y, rightPan)) {
            return this.placeBlockInPan(this.draggedBlock, rightPan, x, y);
        }
        
        return false;
    }
    
    /**
     * Place block in pan with gravity-based placement
     * UPDATED: Forgiving placement - tries shift left/right, then half-block higher if no edge space
     */
    placeBlockInPan(block, pan, dropX, dropY) {
        const blockDims = block._dimensions;
        
        // Calculate local position relative to pan
        const localX = dropX - pan.currentX;
        const localY = dropY - pan.currentY;
        
        // Clamp localX to stay within pan bounds
        const maxX = (pan.panDims.width / 2) - (blockDims.width / 2);
        const clampedLocalX = Math.max(-maxX, Math.min(maxX, localX));
        
        // Check if this position overlaps with any existing block
        const hasOverlap = this.checkOverlapAtPosition(pan, clampedLocalX, localY, blockDims);
        
        if (hasOverlap) {
            console.log('⚠️ Overlap detected at drop position, trying forgiving placement...');
            
            // UPDATED: Try three strategies in order:
            // 1. Shift half-block to the right (if space on right edge)
            // 2. Shift half-block to the left (if space on left edge)
            // 3. Shift half-block higher (if no edge space available)
            
            const halfBlockWidth = blockDims.width / 2;
            const halfBlockHeight = blockDims.height / 2;
            
            // Check which side has space (no overlap at drop position)
            const canShiftLeft = this.canShiftToSide(pan, clampedLocalX, localY, blockDims, -halfBlockWidth);
            const canShiftRight = this.canShiftToSide(pan, clampedLocalX, localY, blockDims, halfBlockWidth);
            
            let adjustedX = clampedLocalX;
            let adjustedY = localY;
            
            if (canShiftRight) {
                adjustedX = clampedLocalX + halfBlockWidth;
                console.log('✓ Shifting half-block to the RIGHT');
            } else if (canShiftLeft) {
                adjustedX = clampedLocalX - halfBlockWidth;
                console.log('✓ Shifting half-block to the LEFT');
            } else {
                // No space on edges, try shifting half-block higher
                adjustedY = localY - halfBlockHeight;
                console.log('✓ No edge space - shifting half-block HIGHER');
                
                // Check if higher position still overlaps
                const stillOverlaps = this.checkOverlapAtPosition(pan, clampedLocalX, adjustedY, blockDims);
                if (stillOverlaps) {
                    console.log('❌ Still overlaps even when higher - falling to ground');
                    return false;
                }
            }
            
            // Try placement at adjusted position
            return this.tryPlacementAtPosition(block, pan, adjustedX, adjustedY, blockDims);
        }
        
        // No overlap, proceed with normal placement
        return this.tryPlacementAtPosition(block, pan, clampedLocalX, localY, blockDims);
    }
    
    /**
     * Check if block can shift to the side without overlap
     */
    canShiftToSide(pan, localX, localY, blockDims, shiftAmount) {
        const shiftedX = localX + shiftAmount;
        
        // Check if shifted position is within pan bounds
        const maxX = (pan.panDims.width / 2) - (blockDims.width / 2);
        if (shiftedX < -maxX || shiftedX > maxX) {
            return false;
        }
        
        // Check if shifted position has overlap
        return !this.checkOverlapAtPosition(pan, shiftedX, localY, blockDims);
    }
    
    /**
     * Try to place block at given X,Y position
     * UPDATED: Now accepts Y position for higher placement attempts
     */
    tryPlacementAtPosition(block, pan, localX, localY, blockDims) {
        // Find the resting position using gravity (starting from localY, not drop position)
        const restingY = this.findRestingPositionFrom(pan, localX, localY, blockDims);
        
        if (restingY === null) {
            console.log('❌ Cannot place block - no valid resting position found');
            return false;
        }
        
        // Check if resting position would exceed height limit (6 unit blocks)
        const unitBlockHeight = getBlockDimensions(1).height;
        const maxStackHeight = unitBlockHeight * 6;
        const panLineY = -pan.extensionHeight;
        const heightFromPan = panLineY - (restingY - blockDims.height / 2);
        
        if (heightFromPan > maxStackHeight) {
            console.log(`❌ Cannot place block - would exceed max height: ${heightFromPan.toFixed(1)}px > ${maxStackHeight.toFixed(1)}px`);
            return false;
        }
        
        // Place block at resting position
        return this.placeBlockAtPosition(block, pan, localX, restingY);
    }
    
    /**
     * Check if a block at given position overlaps with any existing blocks
     */
    checkOverlapAtPosition(pan, localX, localY, blockDims) {
        const blockLeft = localX - blockDims.width / 2;
        const blockRight = localX + blockDims.width / 2;
        const blockTop = localY - blockDims.height / 2;
        const blockBottom = localY + blockDims.height / 2;
        
        for (const otherBlock of pan.blocks) {
            const otherDims = otherBlock._dimensions;
            const otherLocalX = parseFloat(otherBlock.getAttribute('data-local-x'));
            const otherLocalY = parseFloat(otherBlock.getAttribute('data-local-y'));
            
            const otherLeft = otherLocalX - otherDims.width / 2;
            const otherRight = otherLocalX + otherDims.width / 2;
            const otherTop = otherLocalY - otherDims.height / 2;
            const otherBottom = otherLocalY + otherDims.height / 2;
            
            // Check for overlap
            const xOverlap = !(blockRight <= otherLeft || blockLeft >= otherRight);
            const yOverlap = !(blockBottom <= otherTop || blockTop >= otherBottom);
            
            if (xOverlap && yOverlap) {
                return true; // Overlap detected
            }
        }
        
        return false; // No overlap
    }
    
    /**
     * Find resting position for block using gravity, starting from a given Y position
     * UPDATED: Allows starting from higher positions (for forgiving placement)
     * Block falls until its base touches either the pan floor or the top of another block
     */
    findRestingPositionFrom(pan, localX, startY, blockDims) {
        const panLineY = -pan.extensionHeight;
        
        // Start at the given Y position (or pan bottom if startY is lower)
        let restingYBase = Math.min(startY + blockDims.height / 2, panLineY);
        
        // Check all existing blocks
        for (const otherBlock of pan.blocks) {
            const otherDims = otherBlock._dimensions;
            const otherLocalX = parseFloat(otherBlock.getAttribute('data-local-x'));
            const otherLocalY = parseFloat(otherBlock.getAttribute('data-local-y'));
            
            // Check if blocks overlap horizontally
            const blockLeft = localX - blockDims.width / 2;
            const blockRight = localX + blockDims.width / 2;
            const otherLeft = otherLocalX - otherDims.width / 2;
            const otherRight = otherLocalX + otherDims.width / 2;
            
            const xOverlap = !(blockRight <= otherLeft || blockLeft >= otherRight);
            
            if (xOverlap) {
                // This block is in our vertical path
                const otherTop = otherLocalY - otherDims.height / 2;
                
                // If this block's top is higher than our current resting base, rest on it
                if (otherTop < restingYBase) {
                    restingYBase = otherTop;
                }
            }
        }
        
        // Convert base position to center position
        const restingY = restingYBase - (blockDims.height / 2);
        
        console.log(`Found resting position from Y=${startY.toFixed(1)}: base=${restingYBase.toFixed(1)}, center=${restingY.toFixed(1)}`);
        
        return restingY;
    }
    
    /**
     * Find resting position for block using gravity (legacy method, uses pan bottom as start)
     * Block falls until its base touches either the pan floor or the top of another block
     */
    findRestingPosition(pan, localX, blockDims) {
        const panLineY = -pan.extensionHeight;
        return this.findRestingPositionFrom(pan, localX, panLineY, blockDims);
    }
    
    /**
     * Actually place the block at the determined position
     */
    placeBlockAtPosition(block, pan, localX, targetY) {
        // Add block to pan
        pan.blocks.push(block);
        block._inPan = pan;
        
        // Store local coordinates
        block.setAttribute('data-local-x', localX);
        block.setAttribute('data-local-y', targetY);
        
        // Move block to pan group BEFORE updating position
        pan.group.appendChild(block);
        
        // Update block position
        this.elementManager.updateBlockInPan(block, pan, localX, targetY);
        
        // Hide shadow for block in pan
        this.elementManager.hideBlockShadow(block);
        
        // Update drop zone state
        this.updateDropZoneState(pan);
        
        console.log(`✓ Block weight=${block._weight} placed in ${pan.side} pan at (${localX.toFixed(1)}, ${targetY.toFixed(1)})`);
        
        return true;
    }
    
    /**
     * Update drop zone visual state
     */
    updateDropZoneState(pan) {
        if (!pan || !pan.dropZone) return;
        // Drop zone always ready for drops (no dimming)
    }
    
    /**
     * Place block on ground with shadow
     */
    placeBlockOnGround(block, x, y) {
        const grassTop = vhToPx(BALANCE_CONFIG.GRASS_Y_MIN_PERCENT);
        
        // Apply gravity if dropped above grass
        if (y < grassTop) {
            y = vhToPx(85); // Middle of grass area
            
            block.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            this.elementManager.updateBlockPosition(block, x, y);
            
            // Show shadow after settling
            setTimeout(() => {
                block.style.transition = '';
                this.elementManager.showBlockShadow(block);
            }, 600);
        } else {
            this.elementManager.updateBlockPosition(block, x, y);
            // Show shadow immediately for ground placement
            setTimeout(() => {
                this.elementManager.showBlockShadow(block);
            }, 100);
        }
        
        // Ensure block is in main SVG
        if (block.parentNode !== this.svg) {
            this.svg.appendChild(block);
        }
    }
    
    /**
     * Find block at given point
     */
    findBlockAtPoint(point) {
        const blocks = this.svg.querySelectorAll('.block');
        const blockArray = Array.from(blocks).reverse();
        
        for (let block of blockArray) {
            const rect = block._rect;
            if (!rect) continue;
            
            let x, y, width, height;
            
            if (block._inPan) {
                const pan = block._inPan;
                const localX = parseFloat(block.getAttribute('data-local-x') || 0);
                const localY = parseFloat(block.getAttribute('data-local-y') || 0);
                const dims = block._dimensions;
                
                const globalCenterX = pan.currentX + localX;
                const globalCenterY = pan.currentY + localY;
                
                x = globalCenterX - dims.width / 2;
                y = globalCenterY - dims.height / 2;
                width = dims.width;
                height = dims.height;
            } else {
                x = parseFloat(rect.getAttribute('x'));
                y = parseFloat(rect.getAttribute('y'));
                width = parseFloat(rect.getAttribute('width'));
                height = parseFloat(rect.getAttribute('height'));
            }
            
            if (point.x >= x && point.x <= x + width && 
                point.y >= y && point.y <= y + height) {
                return block;
            }
        }
        
        return null;
    }
    
    /**
     * Get all blocks currently in pans
     */
    getPanBlocks() {
        const blocks = [];
        
        if (this.elementManager.leftPan) {
            blocks.push(...this.elementManager.leftPan.blocks);
        }
        if (this.elementManager.rightPan) {
            blocks.push(...this.elementManager.rightPan.blocks);
        }
        
        return blocks;
    }
    
    /**
     * Get all blocks on ground
     */
    getGroundBlocks() {
        const blocks = this.svg.querySelectorAll('.block');
        return Array.from(blocks).filter(block => !block._inPan);
    }
    
    /**
     * Check if currently dragging
     */
    isDraggingBlock() {
        return this.isDragging;
    }
    
    /**
     * Get currently dragged block
     */
    getDraggedBlock() {
        return this.draggedBlock;
    }
    
    /**
     * Clean up and destroy
     */
    destroy() {
        this.svg.removeEventListener('mousedown', this.handlePointerStart);
        this.svg.removeEventListener('touchstart', this.handlePointerStart);
        
        document.removeEventListener('mousemove', this.handlePointerMove);
        document.removeEventListener('touchmove', this.handlePointerMove);
        
        document.removeEventListener('mouseup', this.handlePointerEnd);
        document.removeEventListener('touchend', this.handlePointerEnd);
        
        this.clearPanHover();
        this.isDragging = false;
        this.draggedBlock = null;
    }
}
