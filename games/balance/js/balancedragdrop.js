/**
 * BalanceDragDropHandler - Handles all drag and drop interactions
 * Manages dragging blocks, drop validation, and pan placement
 * UPDATED: Smart column-based stacking, 6-block height limit, overflow handling, shadows
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
     * UPDATED: Hide shadow when picking up
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
     * UPDATED: Show shadow when placing on ground
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
     */
    checkPanHover(x, y) {
        const leftPan = this.elementManager.leftPan;
        const rightPan = this.elementManager.rightPan;
        
        let foundHover = false;
        
        // Check left pan
        if (leftPan && this.isOverDropZone(x, y, leftPan)) {
            if (this.hoveredPan !== leftPan) {
                this.clearPanHover();
                this.hoveredPan = leftPan;
                leftPan.dropZone.classList.add('hover');
            }
            foundHover = true;
        }
        // Check right pan
        else if (rightPan && this.isOverDropZone(x, y, rightPan)) {
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
     * Check if point is over a pan's drop zone
     */
    isOverDropZone(x, y, pan) {
        const dropZone = pan.dropZone;
        const localX = parseFloat(dropZone.getAttribute('x'));
        const localY = parseFloat(dropZone.getAttribute('y'));
        const width = parseFloat(dropZone.getAttribute('width'));
        const height = parseFloat(dropZone.getAttribute('height'));
        
        // Convert to global coordinates
        const globalX = pan.currentX + localX;
        const globalY = pan.currentY + localY;
        
        // Check if point is inside drop zone
        return x >= globalX && x <= globalX + width && y >= globalY && y <= globalY + height;
    }
    
    /**
     * Try to place block in a pan
     */
    tryPlaceInPan(x, y) {
        const leftPan = this.elementManager.leftPan;
        const rightPan = this.elementManager.rightPan;
        
        // Check left pan first
        if (leftPan && this.isOverDropZone(x, y, leftPan)) {
            return this.placeBlockInPan(this.draggedBlock, leftPan, x);
        }
        
        // Check right pan
        if (rightPan && this.isOverDropZone(x, y, rightPan)) {
            return this.placeBlockInPan(this.draggedBlock, rightPan, x);
        }
        
        return false;
    }
    
    /**
     * Place block in pan with smart column-based stacking
     * UPDATED: Finds first available space in column, max 6 blocks high, overflow handling
     */
    placeBlockInPan(block, pan, dropX) {
        const blockDims = block._dimensions;
        const unitBlockHeight = getBlockDimensions(1).height; // Height of a weight-1 block
        
        // Calculate local x position relative to pan center
        const localX = dropX - pan.currentX;
        
        // Clamp localX to stay within pan bounds
        const maxX = (pan.panDims.width / 2) - (blockDims.width / 2);
        const clampedLocalX = Math.max(-maxX, Math.min(maxX, localX));
        
        // Find the first available position in the column
        const placement = this.findAvailablePositionInColumn(pan, clampedLocalX, blockDims, unitBlockHeight);
        
        if (!placement.canPlace) {
            console.log('❌ Cannot place block - pan full or no space in column');
            return false;
        }
        
        // If this is an overflow placement, try adjacent columns
        if (placement.isOverflow) {
            console.log('⚠️ Column full, searching for alternative position...');
            const altPlacement = this.findAlternativePosition(pan, clampedLocalX, blockDims, unitBlockHeight);
            
            if (!altPlacement.canPlace) {
                console.log('❌ No alternative position found - pan is full');
                return false;
            }
            
            // Use alternative position
            return this.placementBlockAtPosition(block, pan, altPlacement.localX, altPlacement.targetY);
        }
        
        // Place at found position
        return this.placementBlockAtPosition(block, pan, clampedLocalX, placement.targetY);
    }
    
    /**
     * Find first available position in a column (smart stacking)
     * UPDATED: Column-based placement with 6-block height limit
     */
    findAvailablePositionInColumn(pan, localX, blockDims, unitBlockHeight) {
        const maxStackHeight = unitBlockHeight * 6; // 6 unit blocks high
        const panLineY = -pan.extensionHeight;
        
        // Start at pan bottom
        let targetYBase = panLineY;
        
        // Get all blocks sorted by height (bottom to top)
        const sortedBlocks = [...pan.blocks].sort((a, b) => {
            const aY = parseFloat(a.getAttribute('data-local-y'));
            const bY = parseFloat(b.getAttribute('data-local-y'));
            return bY - aY; // Higher Y (lower on screen) first
        });
        
        // Check each existing block for horizontal overlap
        for (const otherBlock of sortedBlocks) {
            const otherDims = otherBlock._dimensions;
            const otherLocalX = parseFloat(otherBlock.getAttribute('data-local-x'));
            const otherLocalY = parseFloat(otherBlock.getAttribute('data-local-y'));
            
            // Calculate horizontal overlap
            const otherLeft = otherLocalX - otherDims.width / 2;
            const otherRight = otherLocalX + otherDims.width / 2;
            const ourLeft = localX - blockDims.width / 2;
            const ourRight = localX + blockDims.width / 2;
            
            const xOverlap = !(ourRight <= otherLeft || ourLeft >= otherRight);
            
            if (xOverlap) {
                // This block is in our column
                const otherTop = otherLocalY - (otherDims.height / 2);
                
                // Check if there's enough space between this block and the next
                const spaceNeeded = blockDims.height;
                const spaceAvailable = targetYBase - otherTop;
                
                if (spaceAvailable >= spaceNeeded) {
                    // Found a gap! Place here
                    targetYBase = otherTop;
                    break;
                } else {
                    // Not enough space, move up to top of this block
                    targetYBase = otherTop;
                }
            }
        }
        
        // Convert base position to center position
        const targetY = targetYBase - (blockDims.height / 2);
        
        // Check if this exceeds max height (6 unit blocks from pan line)
        const heightFromPan = panLineY - targetY - (blockDims.height / 2);
        
        if (heightFromPan > maxStackHeight) {
            console.log(`⚠️ Column exceeds max height: ${heightFromPan.toFixed(1)}px > ${maxStackHeight.toFixed(1)}px`);
            return { canPlace: false, isOverflow: true };
        }
        
        return { canPlace: true, targetY, isOverflow: false };
    }
    
    /**
     * Find alternative position when primary column is full
     * Searches left and right for available space
     */
    findAlternativePosition(pan, preferredX, blockDims, unitBlockHeight) {
        const panWidth = pan.panDims.width;
        const searchIncrement = blockDims.width * 0.5; // Search in half-block increments
        const maxSearchDistance = panWidth / 2;
        
        // Try alternating left and right
        for (let distance = searchIncrement; distance <= maxSearchDistance; distance += searchIncrement) {
            // Try right
            const rightX = preferredX + distance;
            const maxX = (panWidth / 2) - (blockDims.width / 2);
            
            if (rightX <= maxX) {
                const rightPlacement = this.findAvailablePositionInColumn(pan, rightX, blockDims, unitBlockHeight);
                if (rightPlacement.canPlace && !rightPlacement.isOverflow) {
                    console.log(`✓ Found space to the right at x=${rightX.toFixed(1)}`);
                    return { canPlace: true, localX: rightX, targetY: rightPlacement.targetY };
                }
            }
            
            // Try left
            const leftX = preferredX - distance;
            const minX = -(panWidth / 2) + (blockDims.width / 2);
            
            if (leftX >= minX) {
                const leftPlacement = this.findAvailablePositionInColumn(pan, leftX, blockDims, unitBlockHeight);
                if (leftPlacement.canPlace && !leftPlacement.isOverflow) {
                    console.log(`✓ Found space to the left at x=${leftX.toFixed(1)}`);
                    return { canPlace: true, localX: leftX, targetY: leftPlacement.targetY };
                }
            }
        }
        
        return { canPlace: false };
    }
    
    /**
     * Actually place the block at the determined position
     */
    placementBlockAtPosition(block, pan, localX, targetY) {
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
        
        // Show shadow for block in pan
        this.elementManager.showBlockShadow(block);
        
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
     * Collapse blocks in pan when one is removed
     * UPDATED: Uses column-based repositioning
     */
    collapseBlocksInPan(pan, removedBlockY) {
        // Recalculate all block positions using the smart stacking logic
        const blocksToReposition = [...pan.blocks];
        
        blocksToReposition.forEach(block => {
            const blockDims = block._dimensions;
            const localX = parseFloat(block.getAttribute('data-local-x'));
            const unitBlockHeight = getBlockDimensions(1).height;
            
            // Find new position for this block
            const placement = this.findAvailablePositionInColumn(pan, localX, blockDims, unitBlockHeight);
            
            if (placement.canPlace) {
                const oldY = parseFloat(block.getAttribute('data-local-y'));
                
                if (Math.abs(placement.targetY - oldY) > 0.1) {
                    // Animate the fall
                    block.style.transition = 'all 0.3s ease-out';
                    block.setAttribute('data-local-y', placement.targetY);
                    this.elementManager.updateBlockInPan(block, pan, localX, placement.targetY);
                    
                    setTimeout(() => {
                        block.style.transition = '';
                    }, 300);
                }
            }
        });
    }
    
    /**
     * Place block on ground
     * UPDATED: Shows shadow when settled
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
