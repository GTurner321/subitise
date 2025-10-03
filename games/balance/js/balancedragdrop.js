/**
 * BalanceDragDropHandler - Handles all drag and drop interactions
 * Manages dragging blocks, drop validation, and pan placement
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
        
        // FIXED: Allow dragging fixed blocks too (grey blocks in pans)
        
        e.preventDefault();
        e.stopPropagation();
        
        this.isDragging = true;
        this.draggedBlock = block;
        
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
            
            console.log('Removed block from pan, now at global position:', globalX, globalY);
            
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
        
        console.log('Started dragging block', block.getAttribute('data-number'));
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
        
        console.log('=== DROP EVENT ===');
        console.log('Block:', this.draggedBlock.getAttribute('data-number'));
        console.log('Drop position:', dropX, dropY);
        
        // Try to place in pan
        const placedInPan = this.tryPlaceInPan(dropX, dropY);
        
        if (!placedInPan) {
            // Place on ground
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
        
        console.log('=== DROP COMPLETE ===');
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
        // Get drop zone in global coordinates
        const dropZone = pan.dropZone;
        const localX = parseFloat(dropZone.getAttribute('x'));
        const localY = parseFloat(dropZone.getAttribute('y'));
        const width = parseFloat(dropZone.getAttribute('width'));
        const height = parseFloat(dropZone.getAttribute('height'));
        
        // Convert to global coordinates
        const globalX = pan.currentX + localX;
        const globalY = pan.currentY + localY;
        
        // Check if point is inside drop zone
        const isInside = x >= globalX && 
                        x <= globalX + width && 
                        y >= globalY && 
                        y <= globalY + height;
        
        return isInside;
    }
    
    /**
     * Try to place block in a pan
     */
    tryPlaceInPan(x, y) {
        const leftPan = this.elementManager.leftPan;
        const rightPan = this.elementManager.rightPan;
        
        // Check left pan first
        if (leftPan && this.isOverDropZone(x, y, leftPan)) {
            console.log('Attempting to place in LEFT pan');
            return this.placeBlockInPan(this.draggedBlock, leftPan, x);
        }
        
        // Check right pan
        if (rightPan && this.isOverDropZone(x, y, rightPan)) {
            console.log('Attempting to place in RIGHT pan');
            return this.placeBlockInPan(this.draggedBlock, rightPan, x);
        }
        
        console.log('Not over any drop zone');
        return false;
    }
    
    /**
     * Place block in pan - FIXED: Messy stacking, blocks fall straight down
     */
    placeBlockInPan(block, pan, dropX) {
        const blockDims = getBlockDimensions();
        
        // Calculate local x position relative to pan center (keep exact drop position)
        const localX = dropX - pan.currentX;
        
        // Clamp localX to stay within pan bounds (with some margin)
        const maxX = (pan.panDims.width / 2) - (blockDims.width / 2);
        const clampedLocalX = Math.max(-maxX, Math.min(maxX, localX));
        
        // Start at pan bottom: block center 0.5 blocks ABOVE the pan line
        let targetY = -pan.extensionHeight - (blockDims.height / 2);
        
        // FIXED: Check collision - block falls straight down until it hits something
        // Sort blocks by Y position (bottom to top) to check in order
        const sortedBlocks = [...pan.blocks].sort((a, b) => {
            const aY = parseFloat(a.getAttribute('data-local-y'));
            const bY = parseFloat(b.getAttribute('data-local-y'));
            return bY - aY; // Higher Y (lower on screen) first
        });
        
        for (const otherBlock of sortedBlocks) {
            const otherLocalX = parseFloat(otherBlock.getAttribute('data-local-x'));
            const otherLocalY = parseFloat(otherBlock.getAttribute('data-local-y'));
            
            // Check if blocks overlap horizontally (any overlap counts)
            const otherLeft = otherLocalX - blockDims.width / 2;
            const otherRight = otherLocalX + blockDims.width / 2;
            const ourLeft = clampedLocalX - blockDims.width / 2;
            const ourRight = clampedLocalX + blockDims.width / 2;
            
            const xOverlap = !(ourRight <= otherLeft || ourLeft >= otherRight);
            
            if (xOverlap) {
                // This block is in our vertical path
                const otherTop = otherLocalY - blockDims.height / 2;
                const potentialBottom = targetY + blockDims.height / 2;
                
                // FIXED: If we would pass through this block, rest on top of it
                if (potentialBottom >= otherTop) {
                    // Place exactly on top of the other block
                    targetY = otherLocalY - blockDims.height;
                    console.log(`Stacking on block at Y=${otherLocalY.toFixed(1)}, new Y=${targetY.toFixed(1)}`);
                }
            }
        }
        
        console.log(`Placing block at local position: (${clampedLocalX.toFixed(1)}, ${targetY.toFixed(1)})`);
        
        // Add block to pan
        pan.blocks.push(block);
        block._inPan = pan;
        
        // Store local coordinates
        block.setAttribute('data-local-x', clampedLocalX);
        block.setAttribute('data-local-y', targetY);
        
        // Update block position
        this.elementManager.updateBlockInPan(block, pan, clampedLocalX, targetY);
        
        // Move to pan group
        pan.group.appendChild(block);
        
        // Update drop zone state
        this.updateDropZoneState(pan);
        
        console.log('Block placed successfully in pan');
        return true;
    }
    
    /**
     * Update drop zone visual state based on occupancy
     */
    updateDropZoneState(pan) {
        if (!pan || !pan.dropZone) return;
        
        if (pan.blocks.length > 0) {
            pan.dropZone.classList.add('occupied');
        } else {
            pan.dropZone.classList.remove('occupied');
        }
    }
    
    /**
     * NEW: Collapse blocks in pan when one is removed
     * Makes blocks above the removed block fall down to fill gaps
     */
    collapseBlocksInPan(pan, removedBlockY) {
        const blockDims = getBlockDimensions();
        
        // Find all blocks that were ABOVE the removed block
        const blocksAbove = pan.blocks.filter(block => {
            const blockY = parseFloat(block.getAttribute('data-local-y'));
            return blockY < removedBlockY; // Lower Y = higher on screen
        });
        
        if (blocksAbove.length === 0) {
            console.log('No blocks above removed block');
            return;
        }
        
        console.log(`Found ${blocksAbove.length} blocks above removed block, recalculating positions`);
        
        // For each block above, recalculate its position as if freshly dropped
        blocksAbove.forEach(block => {
            const localX = parseFloat(block.getAttribute('data-local-x'));
            
            // Start at pan bottom
            let newY = -pan.extensionHeight - (blockDims.height / 2);
            
            // Check all OTHER blocks for collision (exclude this block)
            const otherBlocks = pan.blocks.filter(b => b !== block);
            
            // Sort by Y position (bottom to top)
            const sortedBlocks = otherBlocks.sort((a, b) => {
                const aY = parseFloat(a.getAttribute('data-local-y'));
                const bY = parseFloat(b.getAttribute('data-local-y'));
                return bY - aY;
            });
            
            for (const otherBlock of sortedBlocks) {
                const otherLocalX = parseFloat(otherBlock.getAttribute('data-local-x'));
                const otherLocalY = parseFloat(otherBlock.getAttribute('data-local-y'));
                
                // Check horizontal overlap
                const otherLeft = otherLocalX - blockDims.width / 2;
                const otherRight = otherLocalX + blockDims.width / 2;
                const ourLeft = localX - blockDims.width / 2;
                const ourRight = localX + blockDims.width / 2;
                
                const xOverlap = !(ourRight <= otherLeft || ourLeft >= otherRight);
                
                if (xOverlap) {
                    const otherTop = otherLocalY - blockDims.height / 2;
                    const potentialBottom = newY + blockDims.height / 2;
                    
                    if (potentialBottom >= otherTop) {
                        newY = otherLocalY - blockDims.height;
                    }
                }
            }
            
            // Update block position if it changed
            const oldY = parseFloat(block.getAttribute('data-local-y'));
            if (Math.abs(newY - oldY) > 0.1) {
                console.log(`Block falling from Y=${oldY.toFixed(1)} to Y=${newY.toFixed(1)}`);
                
                // Animate the fall
                block.style.transition = 'all 0.3s ease-out';
                block.setAttribute('data-local-y', newY);
                this.elementManager.updateBlockInPan(block, pan, localX, newY);
                
                setTimeout(() => {
                    block.style.transition = '';
                }, 300);
            }
        });
    }
    
    /**
     * Place block on ground
     */
    placeBlockOnGround(block, x, y) {
        const grassTop = vhToPx(BALANCE_CONFIG.GRASS_Y_MIN_PERCENT);
        
        // Apply gravity if dropped above grass
        if (y < grassTop) {
            console.log('Block above grass, applying gravity');
            y = vhToPx(85); // Middle of grass area
            
            block.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            this.elementManager.updateBlockPosition(block, x, y);
            
            setTimeout(() => {
                block.style.transition = '';
            }, 600);
        } else {
            console.log('Placing block on ground at drop position');
            this.elementManager.updateBlockPosition(block, x, y);
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
        
        // Check blocks in reverse order (top to bottom in DOM)
        const blockArray = Array.from(blocks).reverse();
        
        for (let block of blockArray) {
            const rect = block._rect;
            if (!rect) continue;
            
            let x, y, width, height;
            
            // FIXED: Handle blocks in pans (use global coordinates)
            if (block._inPan) {
                const pan = block._inPan;
                const localX = parseFloat(block.getAttribute('data-local-x') || 0);
                const localY = parseFloat(block.getAttribute('data-local-y') || 0);
                const dims = block._dimensions;
                
                // Convert local to global coordinates
                const globalCenterX = pan.currentX + localX;
                const globalCenterY = pan.currentY + localY;
                
                x = globalCenterX - dims.width / 2;
                y = globalCenterY - dims.height / 2;
                width = dims.width;
                height = dims.height;
            } else {
                // Ground blocks - use rect attributes directly
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
