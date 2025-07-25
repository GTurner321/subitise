class StacksRenderer {
    constructor(svg, gameController) {
        this.svg = svg;
        this.gameController = gameController;
        this.draggedElement = null;
        this.dragOffset = { x: 0, y: 0 };
        this.isDragging = false;
        this.hoveredContainer = null;
        
        console.log('StacksRenderer constructor called with SVG:', svg);
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Global mouse/touch events for drag move and end
        document.addEventListener('mousemove', (e) => this.onDragMove(e));
        document.addEventListener('mouseup', (e) => this.onDragEnd(e));
        
        // Touch events for mobile
        document.addEventListener('touchmove', (e) => this.onDragMove(e));
        document.addEventListener('touchend', (e) => this.onDragEnd(e));
        
        // Prevent default touch behaviors on SVG
        this.svg.addEventListener('touchstart', (e) => e.preventDefault());
        this.svg.addEventListener('touchmove', (e) => e.preventDefault());
    }
    
    createBlock(number, x, y, color, isWide = false) {
        const blockWidth = isWide ? STACKS_CONFIG.BLOCK_WIDTH_WIDE : STACKS_CONFIG.BLOCK_WIDTH;
        const blockHeight = STACKS_CONFIG.BLOCK_HEIGHT;
        
        console.log(`Creating block ${number}: ${blockWidth}px × ${blockHeight}px at (${x}, ${y})`);
        
        // Create group for the block
        const blockGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        blockGroup.setAttribute('class', 'block');
        blockGroup.setAttribute('data-number', number);
        blockGroup.style.cursor = 'grab';
        blockGroup.style.pointerEvents = 'all'; // Ensure it can receive events
        
        // Add invisible larger clickable area for easier interaction
        const clickArea = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        const padding = 20; // Extra clickable area
        clickArea.setAttribute('x', x - blockWidth/2 - padding);
        clickArea.setAttribute('y', y - blockHeight/2 - padding);
        clickArea.setAttribute('width', blockWidth + padding * 2);
        clickArea.setAttribute('height', blockHeight + padding * 2);
        clickArea.setAttribute('fill', 'transparent');
        clickArea.setAttribute('stroke', 'red'); // Temporary - to see the click area
        clickArea.setAttribute('stroke-width', '1');
        clickArea.setAttribute('stroke-dasharray', '2,2');
        clickArea.setAttribute('opacity', '0.3'); // Make it visible for debugging
        clickArea.style.pointerEvents = 'none'; // Let events pass through to group
        
        // Block rectangle
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x - blockWidth/2);
        rect.setAttribute('y', y - blockHeight/2);
        rect.setAttribute('width', blockWidth);
        rect.setAttribute('height', blockHeight);
        rect.setAttribute('fill', color);
        rect.setAttribute('stroke', '#333');
        rect.setAttribute('stroke-width', '3');
        rect.setAttribute('rx', '8');
        rect.setAttribute('ry', '8');
        rect.style.pointerEvents = 'none'; // Let events pass through to group
        
        // Block shadow (behind)
        const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        shadow.setAttribute('x', x - blockWidth/2 + 3);
        shadow.setAttribute('y', y - blockHeight/2 + 3);
        shadow.setAttribute('width', blockWidth);
        shadow.setAttribute('height', blockHeight);
        shadow.setAttribute('fill', 'rgba(0,0,0,0.2)');
        shadow.setAttribute('rx', '8');
        shadow.setAttribute('ry', '8');
        shadow.style.pointerEvents = 'none'; // Let events pass through to group
        
        // Number text
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y + 6); // Slightly offset for better centering
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('font-size', Math.min(blockHeight * 0.4, blockWidth * 0.3));
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('fill', '#000');
        text.style.pointerEvents = 'none'; // Let events pass through to group
        text.textContent = number;
        
        // Add elements in correct order (shadow first, clickArea last for debugging)
        blockGroup.appendChild(shadow);
        blockGroup.appendChild(rect);
        blockGroup.appendChild(text);
        blockGroup.appendChild(clickArea); // Add clickArea last so it's visible
        
        // Store references
        blockGroup._rect = rect;
        blockGroup._text = text;
        blockGroup._shadow = shadow;
        blockGroup._clickArea = clickArea;
        blockGroup._originalX = x;
        blockGroup._originalY = y;
        blockGroup._number = number;
        blockGroup._isWide = isWide;
        
        // Add event listeners directly to the block - use a more comprehensive approach
        const handleMouseDown = (e) => {
            console.log('Mouse down on block', number, 'at client coords:', e.clientX, e.clientY);
            e.preventDefault();
            e.stopPropagation();
            this.onDragStart(e);
        };
        
        const handleTouchStart = (e) => {
            console.log('Touch start on block', number, 'touches:', e.touches.length);
            e.preventDefault();
            e.stopPropagation();
            this.onDragStart(e);
        };
        
        const handleClick = (e) => {
            console.log('Block clicked:', number, 'at client coords:', e.clientX, e.clientY);
            e.preventDefault();
            e.stopPropagation();
        };
        
        // Add multiple event types to ensure we catch interactions
        blockGroup.addEventListener('mousedown', handleMouseDown, { passive: false });
        blockGroup.addEventListener('touchstart', handleTouchStart, { passive: false });
        blockGroup.addEventListener('click', handleClick, { passive: false });
        
        // Also try pointerdown for better cross-platform support
        blockGroup.addEventListener('pointerdown', (e) => {
            console.log('Pointer down on block', number, 'pointer type:', e.pointerType);
            if (e.pointerType === 'mouse') {
                handleMouseDown(e);
            } else if (e.pointerType === 'touch') {
                handleTouchStart(e);
            }
        }, { passive: false });
        
        console.log('Block created with number:', number, 'at position:', x, y, 'size:', blockWidth, 'x', blockHeight);
        
        return blockGroup;
    }
    
    createContainer(x, y, index, isWide = false) {
        const blockWidth = isWide ? STACKS_CONFIG.BLOCK_WIDTH_WIDE : STACKS_CONFIG.BLOCK_WIDTH;
        const blockHeight = STACKS_CONFIG.BLOCK_HEIGHT;
        
        const container = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        container.setAttribute('class', 'container');
        container.setAttribute('data-index', index);
        container.setAttribute('x', x - blockWidth/2);
        container.setAttribute('y', y - blockHeight/2);
        container.setAttribute('width', blockWidth);
        container.setAttribute('height', blockHeight);
        container.setAttribute('fill', STACKS_CONFIG.CONTAINER_COLOR);
        container.setAttribute('stroke', STACKS_CONFIG.CONTAINER_STROKE);
        container.setAttribute('stroke-width', STACKS_CONFIG.CONTAINER_STROKE_WIDTH);
        container.setAttribute('stroke-dasharray', '5,5');
        container.setAttribute('rx', '8');
        container.setAttribute('ry', '8');
        container.setAttribute('opacity', '0.8');
        
        container._centerX = x;
        container._centerY = y;
        container._index = index;
        container._isWide = isWide;
        
        return container;
    }
    
    createTeddy(x, y, imageUrl) {
        const teddy = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        teddy.setAttribute('class', 'teddy');
        
        const size = STACKS_CONFIG.BLOCK_HEIGHT * 0.8;
        teddy.setAttribute('x', x - size/2);
        teddy.setAttribute('y', y - size - STACKS_CONFIG.BLOCK_HEIGHT/2); // Above the top block
        teddy.setAttribute('width', size);
        teddy.setAttribute('height', size);
        teddy.setAttribute('href', imageUrl);
        teddy.style.opacity = '0';
        teddy.style.transition = 'opacity 0.5s ease-in';
        
        // Fade in the teddy
        setTimeout(() => {
            teddy.style.opacity = '1';
        }, 100);
        
        return teddy;
    }
    
    renderTower(blocks, containers, centerX, baseY, isWide = false) {
        const blockHeight = STACKS_CONFIG.BLOCK_HEIGHT;
        
        console.log('renderTower called with blocks:', blocks, 'containers:', containers);
        
        // Clear previous tower elements
        this.clearTower();
        
        // Render containers (bottom to top)
        containers.forEach((container, index) => {
            const y = baseY - (index * blockHeight);
            const containerElement = this.createContainer(centerX, y, index, isWide);
            this.svg.appendChild(containerElement);
            console.log('Added container', index, 'at', centerX, y);
        });
        
        // Render blocks on ground initially
        blocks.forEach((block, index) => {
            const groundX = this.calculateGroundPosition(index, blocks.length);
            const blockElement = this.createBlock(
                block.number, 
                groundX, 
                STACKS_CONFIG.GROUND_Y, 
                block.color,
                isWide
            );
            this.svg.appendChild(blockElement);
            console.log('Added block', block.number, 'at', groundX, STACKS_CONFIG.GROUND_Y);
        });
        
        console.log('Tower render complete. SVG children:', this.svg.children.length);
    }
    
    calculateGroundPosition(index, totalBlocks) {
        const spread = STACKS_CONFIG.GROUND_SPREAD;
        const startX = STACKS_CONFIG.TOWER_CENTER_X - spread/2;
        const spacing = spread / (totalBlocks - 1);
        return startX + (index * spacing);
    }
    
    clearTower() {
        // Remove all blocks, containers, and teddies
        const elements = this.svg.querySelectorAll('.block, .container, .teddy');
        elements.forEach(element => element.remove());
    }
    
    onDragStart(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('onDragStart called, event:', e.type);
        
        // Get the block element directly from the event target
        let blockElement = e.currentTarget;
        if (!blockElement || !blockElement.classList.contains('block')) {
            console.log('No valid block element found');
            return;
        }
        
        console.log('Starting drag on block:', blockElement.getAttribute('data-number'));
        
        const point = this.getEventPoint(e);
        console.log('Drag start at point:', point);
        
        this.isDragging = true;
        this.draggedElement = blockElement;
        
        // Get current position from the text element (most reliable)
        const textElement = blockElement._text;
        const elementX = parseFloat(textElement.getAttribute('x'));
        const elementY = parseFloat(textElement.getAttribute('y')) - 6; // Adjust for text offset
        
        this.dragOffset.x = elementX - point.x;
        this.dragOffset.y = elementY - point.y;
        
        console.log('Drag offset:', this.dragOffset);
        
        // Visual feedback
        blockElement.style.cursor = 'grabbing';
        blockElement._rect.setAttribute('stroke-width', '4');
        blockElement.classList.add('block-dragging');
        
        // Bring to front
        this.svg.appendChild(blockElement);
        
        // Audio feedback for drag start
        this.gameController.playDragStartSound();
        
        console.log('Drag started successfully');
    }
    
    onDragMove(e) {
        if (!this.isDragging || !this.draggedElement) return;
        
        e.preventDefault();
        const point = this.getEventPoint(e);
        
        // Calculate new position
        const newX = point.x + this.dragOffset.x;
        const newY = point.y + this.dragOffset.y;
        
        // Update block position
        this.updateBlockPosition(this.draggedElement, newX, newY);
        
        // Check for hover over containers
        this.handleContainerHover(newX, newY);
    }
    
    onDragEnd(e) {
        if (!this.isDragging || !this.draggedElement) return;
        
        e.preventDefault();
        const point = this.getEventPoint(e);
        
        console.log('Drag end at:', point);
        
        // Calculate drop position
        const dropX = point.x + this.dragOffset.x;
        const dropY = point.y + this.dragOffset.y;
        
        // Try to drop in container or return to ground
        const dropped = this.handleDrop(dropX, dropY);
        
        // Reset visual state
        this.draggedElement.style.cursor = 'grab';
        this.draggedElement._rect.setAttribute('stroke-width', '3');
        this.draggedElement.classList.remove('block-dragging');
        
        // Clear hover effects
        this.clearContainerHover();
        
        // Reset drag state
        this.isDragging = false;
        this.draggedElement = null;
        this.dragOffset = { x: 0, y: 0 };
        
        // Audio feedback
        if (dropped) {
            this.gameController.playDropSound();
        } else {
            this.gameController.playReturnSound();
        }
        
        console.log('Drag ended, dropped:', dropped);
    }
    
    handleContainerHover(x, y) {
        const containers = this.svg.querySelectorAll('.container');
        let foundHover = false;
        
        containers.forEach(container => {
            const distance = this.getDistanceToContainer(container, x, y);
            
            if (distance < STACKS_CONFIG.DRAG_TOLERANCE) {
                if (this.hoveredContainer !== container) {
                    this.clearContainerHover();
                    this.hoveredContainer = container;
                    
                    // Check if container has a block
                    const existingBlock = this.getBlockInContainer(container);
                    if (existingBlock) {
                        // Show swap preview
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
    
    showSwapPreview(block) {
        const rect = block._rect;
        const currentX = parseFloat(rect.getAttribute('x'));
        rect.setAttribute('x', currentX + STACKS_CONFIG.HOVER_TRANSFORM);
        
        const shadow = block._shadow;
        const shadowX = parseFloat(shadow.getAttribute('x'));
        shadow.setAttribute('x', shadowX + STACKS_CONFIG.HOVER_TRANSFORM);
        
        const text = block._text;
        const textX = parseFloat(text.getAttribute('x'));
        text.setAttribute('x', textX + STACKS_CONFIG.HOVER_TRANSFORM);
    }
    
    resetBlockTransform(block) {
        const rect = block._rect;
        const shadow = block._shadow;
        const text = block._text;
        
        const blockWidth = block._isWide ? STACKS_CONFIG.BLOCK_WIDTH_WIDE : STACKS_CONFIG.BLOCK_WIDTH;
        const centerX = block._originalX || parseFloat(text.getAttribute('x'));
        
        rect.setAttribute('x', centerX - blockWidth/2);
        shadow.setAttribute('x', centerX - blockWidth/2 + 3);
        text.setAttribute('x', centerX);
    }
    
    handleDrop(x, y) {
        const containers = this.svg.querySelectorAll('.container');
        
        for (let container of containers) {
            const distance = this.getDistanceToContainer(container, x, y);
            
            if (distance < STACKS_CONFIG.DRAG_TOLERANCE) {
                const existingBlock = this.getBlockInContainer(container);
                
                if (existingBlock) {
                    // Swap blocks
                    this.swapBlocks(this.draggedElement, existingBlock);
                } else {
                    // Place block in empty container
                    this.placeBlockInContainer(this.draggedElement, container);
                }
                
                // Notify game controller of the move
                this.gameController.onBlockMoved();
                return true;
            }
        }
        
        // Return to ground if not dropped in container
        this.returnBlockToGround(this.draggedElement);
        return false;
    }
    
    swapBlocks(block1, block2) {
        // Get the container positions for both blocks
        const container1 = this.getContainerForBlock(block1);
        const container2 = this.getContainerForBlock(block2);
        
        if (container1 && container2) {
            // Swap positions
            this.placeBlockInContainer(block1, container2);
            this.placeBlockInContainer(block2, container1);
        } else if (container2) {
            // Block1 goes to container2, block2 goes to ground
            this.placeBlockInContainer(block1, container2);
            this.returnBlockToGround(block2);
        }
    }
    
    placeBlockInContainer(block, container) {
        const centerX = container._centerX;
        const centerY = container._centerY;
        
        this.updateBlockPosition(block, centerX, centerY);
        block._originalX = centerX;
        block._originalY = centerY;
        block._container = container;
    }
    
    returnBlockToGround(block) {
        // Find a good ground position
        const blocks = this.svg.querySelectorAll('.block');
        const groundBlocks = Array.from(blocks).filter(b => 
            !this.getContainerForBlock(b) && b !== block
        );
        
        const groundX = this.calculateGroundPosition(groundBlocks.length, groundBlocks.length + 1);
        this.updateBlockPosition(block, groundX, STACKS_CONFIG.GROUND_Y);
        
        block._originalX = groundX;
        block._originalY = STACKS_CONFIG.GROUND_Y;
        block._container = null;
    }
    
    updateBlockPosition(block, centerX, centerY) {
        const blockWidth = block._isWide ? STACKS_CONFIG.BLOCK_WIDTH_WIDE : STACKS_CONFIG.BLOCK_WIDTH;
        const blockHeight = STACKS_CONFIG.BLOCK_HEIGHT;
        
        const rect = block._rect;
        const shadow = block._shadow;
        const text = block._text;
        
        rect.setAttribute('x', centerX - blockWidth/2);
        rect.setAttribute('y', centerY - blockHeight/2);
        
        shadow.setAttribute('x', centerX - blockWidth/2 + 3);
        shadow.setAttribute('y', centerY - blockHeight/2 + 3);
        
        text.setAttribute('x', centerX);
        text.setAttribute('y', centerY + 6);
    }
    
    getElementAtPoint(x, y) {
        const elements = document.elementsFromPoint(x, y);
        for (let element of elements) {
            // Check if element is part of a block group
            if (element.classList && element.classList.contains('block')) {
                return element;
            }
            // Check if element is a child of a block group (rect, text, etc.)
            const blockParent = element.closest('.block');
            if (blockParent) {
                return blockParent;
            }
        }
        return null;
    }
    
    getEventPoint(e) {
        const rect = this.svg.getBoundingClientRect();
        
        if (e.touches && e.touches.length > 0) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        } else {
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
    }
    
    getDistanceToContainer(container, x, y) {
        const centerX = container._centerX;
        const centerY = container._centerY;
        return Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    }
    
    getBlockInContainer(container) {
        const blocks = this.svg.querySelectorAll('.block');
        for (let block of blocks) {
            if (block._container === container) {
                return block;
            }
        }
        return null;
    }
    
    getContainerForBlock(block) {
        return block._container || null;
    }
    
    animateCompletedTower(towerBlocks, teddy, targetX, callback) {
        const duration = STACKS_CONFIG.BLOCK_ANIMATION_DURATION;
        
        // Animate all blocks and teddy to new position
        const elements = [...towerBlocks];
        if (teddy) elements.push(teddy);
        
        elements.forEach(element => {
            const currentX = element._originalX || parseFloat(element.getAttribute('x'));
            const deltaX = targetX - STACKS_CONFIG.TOWER_CENTER_X;
            const newX = currentX + deltaX;
            
            element.style.transition = `all ${duration}ms ease-in-out`;
            
            if (element.classList.contains('block')) {
                this.updateBlockPosition(element, newX, element._originalY);
                element._originalX = newX;
            } else if (element.classList.contains('teddy')) {
                const currentTeddyX = parseFloat(element.getAttribute('x'));
                element.setAttribute('x', currentTeddyX + deltaX);
            }
        });
        
        // Clear transitions after animation
        setTimeout(() => {
            elements.forEach(element => {
                element.style.transition = '';
            });
            if (callback) callback();
        }, duration);
    }
    
    getTowerBlocks() {
        const blocks = this.svg.querySelectorAll('.block');
        return Array.from(blocks).filter(block => block._container);
    }
    
    getTeddyElement() {
        return this.svg.querySelector('.teddy');
    }
    
    isValidTowerOrder() {
        const containers = Array.from(this.svg.querySelectorAll('.container')).sort((a, b) => 
            parseFloat(b.getAttribute('y')) - parseFloat(a.getAttribute('y')) // Bottom to top
        );
        
        const towerNumbers = [];
        for (let container of containers) {
            const block = this.getBlockInContainer(container);
            if (block) {
                towerNumbers.push(parseInt(block.getAttribute('data-number')));
            } else {
                return false; // Empty container found
            }
        }
        
        // Check if numbers are in ascending order (bottom to top)
        for (let i = 1; i < towerNumbers.length; i++) {
            if (towerNumbers[i] <= towerNumbers[i-1]) {
                return false;
            }
        }
        
        return true;
    }
    
    getAllBlocks() {
        return Array.from(this.svg.querySelectorAll('.block'));
    }
    
    getAllContainers() {
        return Array.from(this.svg.querySelectorAll('.container'));
    }
    
    highlightCorrectOrder() {
        const blocks = this.getTowerBlocks();
        blocks.forEach(block => {
            block._rect.setAttribute('stroke', '#4CAF50');
            setTimeout(() => {
                block._rect.setAttribute('stroke', '#333');
            }, 1000);
        });
    }
}
