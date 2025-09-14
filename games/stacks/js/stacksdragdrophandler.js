/**
 * StacksDragDropHandler - Handles all drag and drop interactions
 * Manages pointer events, drop validation, block placement, and visual feedback
 */
class StacksDragDropHandler {
    constructor(svg, gameRenderer) {
        this.svg = svg;
        this.gameRenderer = gameRenderer;
        
        // Drag state
        this.draggedElement = null;
        this.dragOffset = { x: 0, y: 0 };
        this.isDragging = false;
        this.hoveredContainer = null;
        
        this.setupEventListeners();
    }
    
    /**
     * Set up unified mouse and touch event listeners
     */
    setupEventListeners() {
        // Unified event handling for mouse and touch
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
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        return { x, y };
    }
    
    /**
     * Handle start of drag operation
     */
    handlePointerStart(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const point = this.getEventPoint(e);
        const blockElement = this.findBlockAtPoint(point);
        
        if (!blockElement) return;
        
        this.isDragging = true;
        this.draggedElement = blockElement;
        blockElement._isDragging = true;
        
        // Calculate drag offset
        this.dragOffset.x = blockElement._centerX - point.x;
        this.dragOffset.y = blockElement._centerY - point.y;
        
        // Visual feedback
        blockElement.style.cursor = 'grabbing';
        blockElement._rect.setAttribute('stroke-width', '4');
        blockElement.classList.add('block-dragging');
        
        // Bring to front
        this.svg.appendChild(blockElement);
        
        // Audio feedback
        if (this.gameRenderer.gameController) {
            this.gameRenderer.gameController.playDragStartSound();
        }
    }
    
    /**
     * Handle drag movement
     */
    handlePointerMove(e) {
        if (!this.isDragging || !this.draggedElement) return;
        
        e.preventDefault();
        const point = this.getEventPoint(e);
        
        // Calculate new position
        const newX = point.x + this.dragOffset.x;
        const newY = point.y + this.dragOffset.y;
        
        // Update block position via element manager
        if (this.gameRenderer.elementManager) {
            this.gameRenderer.elementManager.updateBlockPosition(this.draggedElement, newX, newY);
        }
        
        // Check for hover over containers
        this.handleContainerHover(newX, newY);
    }
    
    /**
     * Handle end of drag operation
     */
    handlePointerEnd(e) {
        if (!this.isDragging || !this.draggedElement) return;
        
        e.preventDefault();
        const point = this.getEventPoint(e);
        
        console.log('=== DRAG END ===');
        console.log('Point:', point);
        
        // Calculate drop position
        const dropX = point.x + this.dragOffset.x;
        const dropY = point.y + this.dragOffset.y;
        
        console.log('Drop position:', dropX, dropY);
        
        // Store dragged element reference BEFORE resetting drag state
        const draggedBlock = this.draggedElement;
        
        // Reset drag state FIRST (but keep reference to block)
        this.resetDragState();
        
        // Then handle the drop with the stored reference
        this.handleDrop(dropX, dropY, draggedBlock);
        
        // Audio feedback
        if (this.gameRenderer.gameController) {
            this.gameRenderer.gameController.playDropSound();
        }
        
        console.log('=== DRAG END COMPLETE ===');
    }
    
    /**
     * Reset all drag-related state and visual effects
     */
    resetDragState() {
        if (this.draggedElement) {
            // Reset visual state
            this.draggedElement.style.cursor = 'grab';
            this.draggedElement._isDragging = false;
            if (this.draggedElement._rect) {
                this.draggedElement._rect.setAttribute('stroke-width', '3');
            }
            this.draggedElement.classList.remove('block-dragging');
        }
        
        // Clear hover effects
        this.clearContainerHover();
        
        // Reset drag state
        this.isDragging = false;
        this.draggedElement = null;
        this.dragOffset = { x: 0, y: 0 };
        
        console.log('Drag state reset');
    }
    
    /**
     * Find block element at given point
     */
    findBlockAtPoint(point) {
        const blocks = this.svg.querySelectorAll('.block');
        
        for (let block of blocks) {
            // Skip completed tower blocks
            if (block.classList.contains('completed-tower')) continue;
            
            const rect = block._rect;
            const x = parseFloat(rect.getAttribute('x'));
            const y = parseFloat(rect.getAttribute('y'));
            const width = parseFloat(rect.getAttribute('width'));
            const height = parseFloat(rect.getAttribute('height'));
            
            // Check if point is inside the block's rectangle
            if (point.x >= x && point.x <= x + width && 
                point.y >= y && point.y <= y + height) {
                return block;
            }
        }
        
        return null;
    }
    
    /**
     * Handle container hover effects during drag
     */
    handleContainerHover(x, y) {
        const containers = this.svg.querySelectorAll('.container');
        let foundHover = false;
        const tolerance = getDragTolerancePx();
        
        containers.forEach(container => {
            const distance = this.getDistanceToContainer(container, x, y);
            
            if (distance < tolerance) {
                if (this.hoveredContainer !== container) {
                    this.clearContainerHover();
                    this.hoveredContainer = container;
                    
                    // Check if container has a block
                    const existingBlock = this.getBlockInContainer(container);
                    if (existingBlock) {
                        this.showSwapPreview(existingBlock);
                    }
                    
                    // Highlight container
                    container.setAttribute('stroke', '#4CAF50');
                    container.setAttribute('stroke-width', '4');
                }
                foundHover = true;
            }
        });
        
        if (!foundHover && this.hoveredContainer) {
            this.clearContainerHover();
        }
    }
    
    /**
     * Clear container hover effects
     */
    clearContainerHover() {
        if (this.hoveredContainer) {
            this.hoveredContainer.setAttribute('stroke', STACKS_CONFIG.CONTAINER_STROKE);
            this.hoveredContainer.setAttribute('stroke-width', STACKS_CONFIG.CONTAINER_STROKE_WIDTH);
            this.hoveredContainer = null;
        }
        
        // Clear any swap previews
        const blocks = this.svg.querySelectorAll('.block');
        blocks.forEach(block => {
            if (block !== this.draggedElement) {
                this.resetBlockTransform(block);
            }
        });
    }
    
    /**
     * Show visual preview of block swap
     */
    showSwapPreview(block) {
        const hoverTransform = vwToPx(STACKS_CONFIG.HOVER_TRANSFORM_PERCENT);
        
        const rect = block._rect;
        const currentX = parseFloat(rect.getAttribute('x'));
        rect.setAttribute('x', currentX + hoverTransform);
        
        const shadow = block._shadow;
        const shadowX = parseFloat(shadow.getAttribute('x'));
        shadow.setAttribute('x', shadowX + hoverTransform);
        
        const text = block._text;
        const textX = parseFloat(text.getAttribute('x'));
        text.setAttribute('x', textX + hoverTransform);
    }
    
    /**
     * Reset block visual transform
     */
    resetBlockTransform(block) {
        const rect = block._rect;
        const shadow = block._shadow;
        const text = block._text;
        
        const centerX = block._centerX;
        const dimensions = block._dimensions;
        
        rect.setAttribute('x', centerX - dimensions.width/2);
        shadow.setAttribute('x', centerX - dimensions.width/2 + 3);
        text.setAttribute('x', centerX);
    }
    
    /**
     * Handle drop operation and determine placement
     */
    handleDrop(x, y, draggedBlock) {
        console.log('=== HANDLE DROP ===');
        console.log('Drop coordinates:', x, y);
        
        // Use the passed draggedBlock reference
        if (!draggedBlock) {
            console.log('No dragged block found');
            return false;
        }
        
        console.log('Dragged block:', draggedBlock.getAttribute('data-number'));
        
        // Check containers for drop
        const containers = this.svg.querySelectorAll('.container.new-tower-element');
        
        console.log('Found', containers.length, 'active containers');
        
        // Check if dropping on a container
        let droppedInContainer = false;
        
        for (let container of containers) {
            const distance = this.getDistanceToContainer(container, x, y);
            const overlapArea = this.calculateOverlapArea(container, x, y, draggedBlock);
            
            console.log('Container', container.getAttribute('data-index'), 'distance:', distance.toFixed(1), 'overlap:', (overlapArea * 100).toFixed(1) + '%');
            
            // Use 50% overlap threshold
            if (overlapArea >= 0.5) {
                console.log('✅ Dropping in container', container.getAttribute('data-index'));
                const existingBlock = this.getBlockInContainer(container);
                const draggedFromContainer = this.getContainerForBlock(draggedBlock);
                
                if (existingBlock) {
                    if (draggedFromContainer) {
                        // Both blocks are in tower - swap them
                        this.swapBlocks(draggedBlock, existingBlock);
                    } else {
                        // Dragged from ground onto tower block - displace the tower block
                        this.displaceBlockToGround(existingBlock);
                        this.placeBlockInContainer(draggedBlock, container);
                    }
                } else {
                    // Empty container - place block
                    this.placeBlockInContainer(draggedBlock, container);
                }
                
                droppedInContainer = true;
                
                // Notify game controller of the move
                console.log('Notifying game controller of move...');
                if (this.gameRenderer.onBlockMoved) {
                    this.gameRenderer.onBlockMoved();
                }
                break;
            }
        }
        
        if (!droppedInContainer) {
            // Place on grass where user dropped it
            console.log('🌱 Not dropped in container, placing on grass');
            this.placeBlockOnGrass(draggedBlock, x, y);
        }
        
        console.log('=== DROP COMPLETE ===');
        return true;
    }
    
    /**
     * Calculate overlap area between dragged block and container
     */
    calculateOverlapArea(container, dragX, dragY, draggedBlock) {
        if (!draggedBlock || !draggedBlock._dimensions) return 0;
        
        const dragWidth = draggedBlock._dimensions.width;
        const dragHeight = draggedBlock._dimensions.height;
        
        // Dragged block bounds
        const dragLeft = dragX - dragWidth / 2;
        const dragRight = dragX + dragWidth / 2;
        const dragTop = dragY - dragHeight / 2;
        const dragBottom = dragY + dragHeight / 2;
        
        // Container bounds
        const containerX = container._centerX;
        const containerY = container._centerY;
        const containerWidth = parseFloat(container.getAttribute('width'));
        const containerHeight = parseFloat(container.getAttribute('height'));
        
        const containerLeft = containerX - containerWidth / 2;
        const containerRight = containerX + containerWidth / 2;
        const containerTop = containerY - containerHeight / 2;
        const containerBottom = containerY + containerHeight / 2;
        
        // Calculate overlap rectangle
        const overlapLeft = Math.max(dragLeft, containerLeft);
        const overlapRight = Math.min(dragRight, containerRight);
        const overlapTop = Math.max(dragTop, containerTop);
        const overlapBottom = Math.min(dragBottom, containerBottom);
        
        // Check if there's any overlap
        if (overlapLeft >= overlapRight || overlapTop >= overlapBottom) {
            return 0; // No overlap
        }
        
        // Calculate overlap dimensions
        const overlapWidth = overlapRight - overlapLeft;
        const overlapHeight = overlapBottom - overlapTop;
        
        // Calculate percentage overlap for BOTH width and height
        const widthOverlapPercent = overlapWidth / dragWidth;
        const heightOverlapPercent = overlapHeight / dragHeight;
        
        console.log('Overlap analysis:', {
            widthOverlap: (widthOverlapPercent * 100).toFixed(1) + '%',
            heightOverlap: (heightOverlapPercent * 100).toFixed(1) + '%',
            widthMeets50: widthOverlapPercent >= 0.5,
            heightMeets50: heightOverlapPercent >= 0.5
        });
        
        // Both width AND height must be >= 50% for valid placement
        if (widthOverlapPercent >= 0.5 && heightOverlapPercent >= 0.5) {
            return Math.min(widthOverlapPercent, heightOverlapPercent);
        } else {
            return 0; // Insufficient overlap in either dimension
        }
    }
    
    /**
     * Place block on grass at drop location
     */
    placeBlockOnGrass(block, x, y) {
        console.log('=== PLACE BLOCK ON GRASS ===');
        console.log('Input coordinates (pixels):', x, y);
        
        // Clear any container association
        block._container = null;
        
        // Validate input coordinates
        if (isNaN(x) || isNaN(y) || x === undefined || y === undefined) {
            console.error('Invalid coordinates for placeBlockOnGrass:', x, y);
            // Use safe fallback position
            x = window.innerWidth * 0.5;
            y = window.innerHeight * 0.85;
            console.log('Using fallback position (pixels):', x, y);
        }
        
        // Convert pixels to percentages
        let finalXPercent = (x * 100) / window.innerWidth;
        let finalYPercent = (y * 100) / window.innerHeight;
        
        console.log('Converted to percentages:', finalXPercent.toFixed(1), finalYPercent.toFixed(1));
        
        // Apply gravity if dropped above grass (grass starts at 80% from top)
        const grassTop = 80;
        
        if (finalYPercent < grassTop) {
            // Dropped above grass - apply gravity animation to bring to grass
            console.log('Block dropped above grass, applying gravity animation');
            finalYPercent = 85; // 85% from top (middle of grass area)
            
            // Convert to pixels for animation
            const finalX = (finalXPercent * window.innerWidth) / 100;
            const finalY = (finalYPercent * window.innerHeight) / 100;
            
            console.log('Gravity animation to:', finalXPercent.toFixed(1), finalYPercent.toFixed(1));
            
            // Animate the fall
            block.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            
            if (this.gameRenderer.elementManager) {
                this.gameRenderer.elementManager.updateBlockPosition(block, finalX, finalY);
            }
            
            // Store final position after animation
            setTimeout(() => {
                block.style.transition = '';
                console.log('Gravity animation complete');
            }, 600);
            
        } else {
            console.log('Block dropped in grass area, using drop position');
            
            // Convert final percentages back to pixels for SVG positioning
            const finalX = (finalXPercent * window.innerWidth) / 100;
            const finalY = (finalYPercent * window.innerHeight) / 100;
            
            // Apply positioning immediately
            if (this.gameRenderer.elementManager) {
                this.gameRenderer.elementManager.updateBlockPosition(block, finalX, finalY);
            }
        }
        
        // Ensure block remains interactive
        block.style.cursor = 'grab';
        block.style.pointerEvents = 'all';
        
        console.log('Block placed successfully - stored as %:', finalXPercent.toFixed(1), finalYPercent.toFixed(1));
        console.log('=== PLACE BLOCK COMPLETE ===');
    }
    
    /**
     * Place block in container
     */
    placeBlockInContainer(block, container) {
        console.log('=== PLACE BLOCK IN CONTAINER ===');
        console.log('Placing block', block.getAttribute('data-number'), 'in container', container.getAttribute('data-index'));
        
        const centerX = container._centerX;
        const centerY = container._centerY;
        
        console.log('Container center:', centerX, centerY);
        
        // Update position via element manager
        if (this.gameRenderer.elementManager) {
            this.gameRenderer.elementManager.updateBlockPosition(block, centerX, centerY);
        }
        block._container = container;
        
        console.log('Block placed in container, new position:', centerX, centerY);
        console.log('=== PLACE IN CONTAINER COMPLETE ===');
    }
    
    /**
     * Swap positions of two blocks
     */
    swapBlocks(block1, block2) {
        // Get the container positions for both blocks
        const container1 = this.getContainerForBlock(block1);
        const container2 = this.getContainerForBlock(block2);
        
        if (container1 && container2) {
            // Move block1 to block2's container
            this.placeBlockInContainer(block1, container2);
            
            // Move block2 to block1's original container
            this.placeBlockInContainer(block2, container1);
        }
    }
    
    /**
     * Displace block from container to ground
     */
    displaceBlockToGround(block) {
        // Remove block from its current container
        block._container = null;
        
        // Simple displacement - place near tower on grass
        const centerX = 50; // Tower center
        const side = Math.random() < 0.5 ? -1 : 1; // Left or right
        const x = centerX + (side * (10 + Math.random() * 10)); // 10-20% away
        const y = 85; // Middle of grass area
        
        // Convert to pixel coordinates
        const groundX = (x * window.innerWidth) / 100;
        const groundY = (y * window.innerHeight) / 100;
        
        console.log('Displacing block to:', x, y, '% =', groundX, groundY, 'px');
        
        // Animate the block to the ground
        if (this.gameRenderer.elementManager) {
            this.gameRenderer.elementManager.animateBlockToPosition(block, groundX, groundY, () => {
                block._container = null;
                
                // Ensure block remains interactive
                block.style.opacity = '1';
                block.style.pointerEvents = 'all';
                block.style.cursor = 'grab';
                block.classList.remove('completed-tower');
                block.classList.add('new-tower-element');
                block._isLocked = false;
            });
        }
    }
    
    /**
     * Get distance from point to container center
     */
    getDistanceToContainer(container, x, y) {
        const centerX = container._centerX;
        const centerY = container._centerY;
        return Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    }
    
    /**
     * Get block currently in container
     */
    getBlockInContainer(container) {
        const blocks = this.svg.querySelectorAll('.block');
        for (let block of blocks) {
            if (block._container === container) {
                return block;
            }
        }
        return null;
    }
    
    /**
     * Get container for block
     */
    getContainerForBlock(block) {
        return block._container || null;
    }
    
    /**
     * Get all blocks not in containers (ground blocks)
     */
    getGroundBlocks() {
        const blocks = this.svg.querySelectorAll('.block');
        return Array.from(blocks).filter(block => !this.getContainerForBlock(block));
    }
    
    /**
     * Get all blocks currently in tower containers
     */
    getTowerBlocks() {
        const blocks = this.svg.querySelectorAll('.block');
        return Array.from(blocks).filter(block => block._container);
    }
    
    /**
     * Check if currently dragging
     */
    isDraggingBlock() {
        return this.isDragging;
    }
    
    /**
     * Get currently dragged element
     */
    getDraggedElement() {
        return this.draggedElement;
    }
    
    /**
     * Clean up and destroy the drag drop handler
     */
    destroy() {
        // Remove event listeners
        this.svg.removeEventListener('mousedown', this.handlePointerStart);
        this.svg.removeEventListener('touchstart', this.handlePointerStart);
        
        document.removeEventListener('mousemove', this.handlePointerMove);
        document.removeEventListener('touchmove', this.handlePointerMove);
        
        document.removeEventListener('mouseup', this.handlePointerEnd);
        document.removeEventListener('touchend', this.handlePointerEnd);
        
        // Clear drag state
        this.resetDragState();
    }
}
