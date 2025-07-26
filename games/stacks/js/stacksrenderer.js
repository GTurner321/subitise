class StacksRenderer {
    constructor(svg, gameController) {
        this.svg = svg;
        this.gameController = gameController;
        this.draggedElement = null;
        this.dragOffset = { x: 0, y: 0 };
        this.isDragging = false;
        this.hoveredContainer = null;
        
        this.setupEventListeners();
        this.updateSVGDimensions();
        this.startGravityCheck();
    }
    
    startGravityCheck() {
        // Check for floating blocks every 3 seconds
        this.gravityInterval = setInterval(() => {
            this.checkAndApplyGravity();
        }, 3000);
    }
    
    checkAndApplyGravity() {
        const groundBlocks = this.svg.querySelectorAll('.block:not(.completed-tower)');
        const grassTop = STACKS_CONFIG.GRASS_Y_MIN_PERCENT;
        
        groundBlocks.forEach(block => {
            // Skip if block is in container, being dragged, or animating
            if (block._container || 
                block === this.draggedElement || 
                block._isLocked ||
                block.style.transition ||
                block.classList.contains('new-tower-element')) {
                return;
            }
            
            const currentYPercent = pxToVh(block._centerY);
            
            // Apply gravity if block is significantly above grass area
            if (currentYPercent < grassTop - 5) {
                const grassMidY = STACKS_CONFIG.GRASS_Y_PERCENT;
                this.applyGravity(block, block._centerX, grassMidY);
            }
        });
    }
    
    updateSVGDimensions() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.svg.setAttribute('width', width);
        this.svg.setAttribute('height', height);
        this.svg.removeAttribute('viewBox');
    }
    
    setupEventListeners() {
        // Unified event handling for mouse and touch
        this.svg.addEventListener('mousedown', (e) => this.handlePointerStart(e));
        this.svg.addEventListener('touchstart', (e) => this.handlePointerStart(e), { passive: false });
        
        document.addEventListener('mousemove', (e) => this.handlePointerMove(e));
        document.addEventListener('touchmove', (e) => this.handlePointerMove(e), { passive: false });
        
        document.addEventListener('mouseup', (e) => this.handlePointerEnd(e));
        document.addEventListener('touchend', (e) => this.handlePointerEnd(e), { passive: false });
    }
    
    destroy() {
        if (this.gravityInterval) {
            clearInterval(this.gravityInterval);
            this.gravityInterval = null;
        }
    }
    
    handleResize() {
        this.updateSVGDimensions();
    }
    
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
    
    createBlock(number, xPercent, yPercent, color, isWide = false) {
        const x = vwToPx(xPercent);
        const y = vhToPx(yPercent);
        const dimensions = getBlockDimensions(isWide);
        
        // Create group for the block
        const blockGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        blockGroup.setAttribute('class', 'block');
        blockGroup.setAttribute('data-number', number);
        blockGroup.style.cursor = 'grab';
        
        // Block shadow
        const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        shadow.setAttribute('x', x - dimensions.width/2 + 3);
        shadow.setAttribute('y', y - dimensions.height/2 + 3);
        shadow.setAttribute('width', dimensions.width);
        shadow.setAttribute('height', dimensions.height);
        shadow.setAttribute('fill', 'rgba(0,0,0,0.2)');
        shadow.setAttribute('rx', '8');
        shadow.setAttribute('ry', '8');
        
        // Block rectangle
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x - dimensions.width/2);
        rect.setAttribute('y', y - dimensions.height/2);
        rect.setAttribute('width', dimensions.width);
        rect.setAttribute('height', dimensions.height);
        rect.setAttribute('fill', color);
        rect.setAttribute('stroke', '#333');
        rect.setAttribute('stroke-width', '3');
        rect.setAttribute('rx', '8');
        rect.setAttribute('ry', '8');
        
        // Number text
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        
        const baseFontSize = Math.min(dimensions.height * 0.5, dimensions.width * 0.4);
        const finalFontSize = isWide ? baseFontSize : baseFontSize * STACKS_CONFIG.BLOCK_FONT_SIZE_MULTIPLIER;
        text.setAttribute('font-size', finalFontSize);
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('fill', '#000');
        text.textContent = number;
        
        // Add elements in correct order
        blockGroup.appendChild(shadow);
        blockGroup.appendChild(rect);
        blockGroup.appendChild(text);
        
        // Store references and positions
        blockGroup._rect = rect;
        blockGroup._text = text;
        blockGroup._shadow = shadow;
        blockGroup._centerX = x;
        blockGroup._centerY = y;
        blockGroup._xPercent = xPercent;
        blockGroup._yPercent = yPercent;
        blockGroup._number = number;
        blockGroup._isWide = isWide;
        blockGroup._dimensions = dimensions;
        
        return blockGroup;
    }
    
    createContainer(xPercent, yPercent, index, isWide = false) {
        const x = vwToPx(xPercent);
        const y = vhToPx(yPercent);
        const dimensions = getBlockDimensions(isWide);
        
        const container = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        container.setAttribute('class', 'container');
        container.setAttribute('data-index', index);
        container.setAttribute('x', x - dimensions.width/2);
        container.setAttribute('y', y - dimensions.height/2);
        container.setAttribute('width', dimensions.width);
        container.setAttribute('height', dimensions.height);
        container.setAttribute('fill', STACKS_CONFIG.CONTAINER_COLOR);
        container.setAttribute('stroke', STACKS_CONFIG.CONTAINER_STROKE);
        container.setAttribute('stroke-width', STACKS_CONFIG.CONTAINER_STROKE_WIDTH);
        container.setAttribute('stroke-dasharray', '5,5');
        container.setAttribute('rx', '8');
        container.setAttribute('ry', '8');
        container.setAttribute('opacity', STACKS_CONFIG.CONTAINER_OPACITY); // FIXED: Use config opacity
        
        // Store position data
        container._centerX = x;
        container._centerY = y;
        container._xPercent = xPercent;
        container._yPercent = yPercent;
        container._index = index;
        container._isWide = isWide;
        
        return container;
    }
    
    createTeddy(xPercent, yPercent, imageUrl) {
        const x = vwToPx(xPercent);
        const y = vhToPx(yPercent);
        const baseSize = vhToPx(STACKS_CONFIG.BLOCK_HEIGHT_PERCENT) * 0.8;
        const size = baseSize * STACKS_CONFIG.TEDDY_SIZE_MULTIPLIER;
        
        const teddy = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        teddy.setAttribute('class', 'teddy');
        teddy.setAttribute('x', x - size/2);
        teddy.setAttribute('y', y - size - vhToPx(STACKS_CONFIG.BLOCK_HEIGHT_PERCENT)/2);
        teddy.setAttribute('width', size);
        teddy.setAttribute('height', size);
        
        // Store position data
        teddy._centerX = x;
        teddy._centerY = y - size/2;
        teddy._xPercent = xPercent;
        teddy._yPercent = yPercent;
        teddy._size = size;
        
        // Start hidden
        teddy.style.opacity = '0';
        teddy.style.transition = 'opacity 0.5s ease-in';
        
        const handleLoad = () => {
            setTimeout(() => {
                teddy.style.opacity = '1';
            }, 100);
        };
        
        const handleError = () => {
            this.createFallbackTeddy(teddy, x, y, size);
        };
        
        teddy.addEventListener('load', handleLoad, { once: true });
        teddy.addEventListener('error', handleError, { once: true });
        
        teddy.setAttribute('href', imageUrl);
        
        return teddy;
    }
    
    createFallbackTeddy(teddyElement, x, y, size) {
        const parent = teddyElement.parentNode;
        if (parent) {
            parent.removeChild(teddyElement);
            
            const fallbackGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            fallbackGroup.setAttribute('class', 'teddy fallback-teddy');
            
            // Store position data
            fallbackGroup._centerX = x;
            fallbackGroup._centerY = y - size/2;
            fallbackGroup._xPercent = pxToVw(x);
            fallbackGroup._yPercent = pxToVh(y - size/2);
            fallbackGroup._size = size;
            
            // Create simple bear shape
            const fallbackTeddy = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            fallbackTeddy.setAttribute('cx', x);
            fallbackTeddy.setAttribute('cy', y - size/2);
            fallbackTeddy.setAttribute('r', size/3);
            fallbackTeddy.setAttribute('fill', '#8B4513');
            fallbackTeddy.setAttribute('stroke', '#654321');
            fallbackTeddy.setAttribute('stroke-width', '2');
            
            // Add eyes
            const eye1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            eye1.setAttribute('cx', x - size/8);
            eye1.setAttribute('cy', y - size/2 - size/12);
            eye1.setAttribute('r', size/20);
            eye1.setAttribute('fill', '#000');
            
            const eye2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            eye2.setAttribute('cx', x + size/8);
            eye2.setAttribute('cy', y - size/2 - size/12);
            eye2.setAttribute('r', size/20);
            eye2.setAttribute('fill', '#000');
            
            fallbackGroup.appendChild(fallbackTeddy);
            fallbackGroup.appendChild(eye1);
            fallbackGroup.appendChild(eye2);
            
            fallbackGroup.style.opacity = '1';
            parent.appendChild(fallbackGroup);
            
            return fallbackGroup;
        }
    }
    
    renderTowerWithPositions(blocks, containers, containerPositions, blockPositions, isWide = false) {
        // Clear only NEW tower elements
        this.clearNewTowerElements();
        
        // Check if we need wide blocks
        const hasThreeDigitNumbers = blocks.some(block => block.number >= 100);
        const useWideBlocks = isWide || hasThreeDigitNumbers;
        
        // Render containers
        containerPositions.forEach((position, index) => {
            const containerElement = this.createContainer(position.x, position.y, index, useWideBlocks);
            containerElement.classList.add('new-tower-element');
            containerElement.style.pointerEvents = 'auto';
            containerElement.style.opacity = '0.8';
            this.svg.appendChild(containerElement);
        });
        
        // Render blocks
        blockPositions.forEach((position, index) => {
            const block = blocks[index];
            const blockElement = this.createBlock(
                block.number, 
                position.x, 
                position.y, 
                block.color,
                useWideBlocks
            );
            blockElement.classList.add('new-tower-element');
            this.svg.appendChild(blockElement);
        });
    }
    
    clearNewTowerElements() {
        const elements = this.svg.querySelectorAll('.new-tower-element');
        elements.forEach(element => element.remove());
    }
    
    clearTower() {
        const elements = this.svg.querySelectorAll('.block, .container, .teddy');
        elements.forEach(element => element.remove());
    }
    
    handlePointerStart(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const point = this.getEventPoint(e);
        const blockElement = this.findBlockAtPoint(point);
        
        if (!blockElement) return;
        
        this.isDragging = true;
        this.draggedElement = blockElement;
        
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
        this.gameController.playDragStartSound();
    }
    
    handlePointerMove(e) {
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
    
    handlePointerEnd(e) {
        if (!this.isDragging || !this.draggedElement) return;
        
        e.preventDefault();
        const point = this.getEventPoint(e);
        
        // Calculate drop position
        const dropX = point.x + this.dragOffset.x;
        const dropY = point.y + this.dragOffset.y;
        
        // Enforce screen boundaries
        const svgBounds = this.svg.getBoundingClientRect();
        const boundedDropX = Math.max(0, Math.min(svgBounds.width, dropX));
        const boundedDropY = Math.max(0, Math.min(svgBounds.height, dropY));
        
        // Try to drop in container or place on grass
        const dropped = this.handleDrop(boundedDropX, boundedDropY);
        
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
    }
    
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
    
    handleDrop(x, y) {
        // Check containers with improved overlap detection
        const containers = this.svg.querySelectorAll('.container.new-tower-element');
        const tolerance = getDragTolerancePx();
        
        console.log('Handle drop at:', x, y, 'checking', containers.length, 'containers');
        
        // Sort containers by overlap area to find the best match
        const containerDistances = Array.from(containers).map(container => ({
            container: container,
            distance: this.getDistanceToContainer(container, x, y),
            overlapArea: this.calculateOverlapArea(container, x, y)
        })).sort((a, b) => b.overlapArea - a.overlapArea);
        
        // Check if dropping on a container
        for (let containerData of containerDistances) {
            const container = containerData.container;
            const distance = containerData.distance;
            const overlapArea = containerData.overlapArea;
            
            console.log('Container', container.getAttribute('data-index'), 'distance:', distance.toFixed(1), 'overlap:', (overlapArea * 100).toFixed(1) + '%');
            
            if (overlapArea >= STACKS_CONFIG.DROP_OVERLAP_THRESHOLD || distance < tolerance) {
                console.log('✅ Dropping in container', container.getAttribute('data-index'));
                const existingBlock = this.getBlockInContainer(container);
                const draggedFromContainer = this.getContainerForBlock(this.draggedElement);
                
                if (existingBlock) {
                    if (draggedFromContainer) {
                        // Both blocks are in tower - swap them
                        this.swapBlocks(this.draggedElement, existingBlock);
                    } else {
                        // Dragged from ground onto tower block - displace the tower block
                        this.displaceBlockToGround(existingBlock);
                        this.placeBlockInContainer(this.draggedElement, container);
                    }
                } else {
                    // Empty container - place block
                    this.placeBlockInContainer(this.draggedElement, container);
                }
                
                // Notify game controller of the move
                this.gameController.onBlockMoved();
                return true;
            }
        }
        
        // FIXED: Not dropping on container - place on grass where user dropped it
        console.log('🌱 Placing block on grass at user drop position');
        this.placeBlockOnGrass(this.draggedElement, x, y);
        return true; // Return true - user successfully placed block
    }
    
    calculateOverlapArea(container, dragX, dragY) {
        const draggedBlock = this.draggedElement;
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
        
        // Calculate overlap area as percentage of dragged block area
        const overlapWidth = overlapRight - overlapLeft;
        const overlapHeight = overlapBottom - overlapTop;
        const overlapArea = overlapWidth * overlapHeight;
        const draggedBlockArea = dragWidth * dragHeight;
        
        return overlapArea / draggedBlockArea;
    }
    
    placeBlockOnGrass(block, x, y) {
        // Clear any container association
        block._container = null;
        
        // Convert to percentages
        const xPercent = pxToVw(x);
        const yPercent = pxToVh(y);
        
        // For user-placed blocks, use the new overlap positioning
        const existingBlocks = this.getGroundBlocks().filter(b => b !== block).map(b => ({
            x: b._xPercent,
            y: b._yPercent
        }));
        
        const adjustedPos = generateUserPlacedGroundPosition(existingBlocks);
        
        // Apply gravity to bring to adjusted grass level
        this.applyGravity(block, vwToPx(adjustedPos.x), adjustedPos.y);
        
        // Ensure block remains interactive
        block.style.cursor = 'grab';
        block.style.pointerEvents = 'all';
    }
    
    applyGravity(block, targetX, targetYPercent) {
        const targetY = vhToPx(targetYPercent);
        const fallDuration = 400;
        
        // Animate the block falling to the ground
        block.style.transition = `all ${fallDuration}ms ease-out`;
        this.updateBlockPosition(block, targetX, targetY);
        
        // Update stored coordinates after animation
        setTimeout(() => {
            block.style.transition = '';
            block._xPercent = pxToVw(targetX);
            block._yPercent = targetYPercent;
        }, fallDuration);
    }
    
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
    
    displaceBlockToGround(block) {
        // Remove block from its current container
        block._container = null;
        
        // Get existing blocks for overlap detection
        const existingBlocks = this.getGroundBlocks().filter(b => b !== block).map(b => ({
            x: b._xPercent,
            y: b._yPercent
        }));
        
        // Use displaced block positioning (close to tower with overlap handling)
        const displacementPos = generateDisplacedBlockPosition(existingBlocks);
        
        // FIXED: Convert to pixel coordinates using proper calculation
        const groundX = (displacementPos.x * window.innerWidth) / 100;
        const groundY = (displacementPos.y * window.innerHeight) / 100;
        
        console.log('Displacing block to:', displacementPos.x, displacementPos.y, '% =', groundX, groundY, 'px');
        
        // Animate the block to the ground
        this.animateBlockToPosition(block, groundX, groundY, () => {
            block._centerX = groundX;
            block._centerY = groundY;
            block._xPercent = displacementPos.x;
            block._yPercent = displacementPos.y;
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
    
    animateBlockToPosition(block, targetX, targetY, callback) {
        const duration = 400;
        
        // Ensure block is not locked before animating
        if (block._isLocked) {
            block._isLocked = false;
        }
        
        // Make sure block is visible and interactive
        block.style.opacity = '1';
        block.style.pointerEvents = 'all';
        block.style.cursor = 'grab';
        block.classList.remove('completed-tower');
        block.classList.add('new-tower-element');
        
        block.style.transition = `all ${duration}ms ease-out`;
        this.updateBlockPosition(block, targetX, targetY);
        
        setTimeout(() => {
            block.style.transition = '';
            if (callback) callback();
        }, duration);
    }
    
    getGroundBlocks() {
        const blocks = this.svg.querySelectorAll('.block');
        return Array.from(blocks).filter(block => !this.getContainerForBlock(block));
    }
    
    placeBlockInContainer(block, container) {
        const centerX = container._centerX;
        const centerY = container._centerY;
        
        this.updateBlockPosition(block, centerX, centerY);
        block._centerX = centerX;
        block._centerY = centerY;
        block._xPercent = container._xPercent;
        block._yPercent = container._yPercent;
        block._container = container;
    }
    
    returnBlockToGround(block) {
        // Clear any container association
        block._container = null;
        
        // FIXED: Use displaced block positioning for pulled blocks
        const existingBlocks = this.getGroundBlocks().filter(b => b !== block).map(b => ({
            x: b._xPercent,
            y: b._yPercent
        }));
        
        // Use displaced positioning (close to tower with overlap handling)
        const groundPos = generateDisplacedBlockPosition(existingBlocks);
        
        // FIXED: Convert to pixel coordinates properly
        const groundX = (groundPos.x * window.innerWidth) / 100;
        const groundY = (groundPos.y * window.innerHeight) / 100;
        
        console.log('Returning block to ground at:', groundPos.x, groundPos.y, '% =', groundX, groundY, 'px');
        
        // Animate the block to the ground
        this.animateBlockToPosition(block, groundX, groundY, () => {
            block._centerX = groundX;
            block._centerY = groundY;
            block._xPercent = groundPos.x;
            block._yPercent = groundPos.y;
        });
    }
    
    updateBlockPosition(block, centerX, centerY) {
        // Don't move locked elements (completed towers)
        if (block._isLocked) return;
        
        const dimensions = block._dimensions;
        
        const rect = block._rect;
        const shadow = block._shadow;
        const text = block._text;
        
        rect.setAttribute('x', centerX - dimensions.width/2);
        rect.setAttribute('y', centerY - dimensions.height/2);
        
        shadow.setAttribute('x', centerX - dimensions.width/2 + 3);
        shadow.setAttribute('y', centerY - dimensions.height/2 + 3);
        
        text.setAttribute('x', centerX);
        text.setAttribute('y', centerY);
        
        // Update stored position and percentages
        block._centerX = centerX;
        block._centerY = centerY;
        block._xPercent = pxToVw(centerX);
        block._yPercent = pxToVh(centerY);
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
    
    animateCompletedTower(towerBlocks, teddy, targetXPercent, callback) {
        const duration = STACKS_CONFIG.BLOCK_ANIMATION_DURATION;
        const targetX = vwToPx(targetXPercent);
        const currentCenterX = vwToPx(STACKS_CONFIG.TOWER_CENTER_X_PERCENT);
        const deltaX = targetX - currentCenterX;
        
        // Only animate blocks that are NOT already completed towers
        const elementsToAnimate = towerBlocks.filter(block => !block.classList.contains('completed-tower'));
        if (teddy && !teddy.classList.contains('completed-tower')) {
            elementsToAnimate.push(teddy);
        }
        
        elementsToAnimate.forEach(element => {
            element.style.transition = `all ${duration}ms ease-in-out`;
            
            if (element.classList.contains('block')) {
                const newX = element._centerX + deltaX;
                this.updateBlockPosition(element, newX, element._centerY);
                
                // Mark as completed tower
                element.classList.add('completed-tower');
                element.classList.remove('new-tower-element');
                element.style.opacity = STACKS_CONFIG.COMPLETED_TOWER_OPACITY;
                element.style.pointerEvents = 'none';
                element.style.cursor = 'default';
                
                // Lock the final position
                element._isLocked = true;
                element._finalX = newX;
                element._finalY = element._centerY;
                
            } else if (element.classList.contains('teddy')) {
                // Handle both image teddies and fallback teddy groups
                if (element.tagName === 'image') {
                    const currentTeddyX = parseFloat(element.getAttribute('x'));
                    const newTeddyX = currentTeddyX + deltaX;
                    element.setAttribute('x', newTeddyX);
                    
                    element._centerX = element._centerX + deltaX;
                    element._xPercent = pxToVw(element._centerX);
                } else if (element.tagName === 'g') {
                    // Fallback teddy group - move all child elements
                    const newCenterX = element._centerX + deltaX;
                    
                    // Update all child elements
                    const children = element.children;
                    for (let child of children) {
                        if (child.tagName === 'circle') {
                            const currentX = parseFloat(child.getAttribute('cx'));
                            child.setAttribute('cx', currentX + deltaX);
                        }
                    }
                    
                    element._centerX = newCenterX;
                    element._xPercent = pxToVw(newCenterX);
                }
                
                // Mark teddy as completed tower element
                element.classList.add('completed-tower');
                element.style.opacity = STACKS_CONFIG.COMPLETED_TOWER_OPACITY;
                element._isLocked = true;
                element._finalX = element._centerX;
            }
        });
        
        // Clear transitions after animation
        setTimeout(() => {
            elementsToAnimate.forEach(element => {
                element.style.transition = '';
            });
            if (callback) callback();
        }, duration);
    }
    
    getTowerBlocks() {
        const blocks = this.svg.querySelectorAll('.block');
        return Array.from(blocks).filter(block => block._container);
    }
    
    getAllBlocks() {
        return Array.from(this.svg.querySelectorAll('.block'));
    }
    
    getAllContainers() {
        return Array.from(this.svg.querySelectorAll('.container'));
    }
    
    isValidTowerOrder() {
        const containers = Array.from(this.svg.querySelectorAll('.container.new-tower-element')).sort((a, b) => 
            parseFloat(b.getAttribute('y')) - parseFloat(a.getAttribute('y')) // Bottom to top
        );
        
        console.log('Checking tower order for', containers.length, 'containers');
        
        const towerNumbers = [];
        for (let container of containers) {
            const block = this.getBlockInContainer(container);
            if (block) {
                towerNumbers.push(parseInt(block.getAttribute('data-number')));
                console.log('Container has block:', block.getAttribute('data-number'));
            } else {
                console.log('Empty container found - tower not complete');
                return false; // Empty container found
            }
        }
        
        console.log('Tower numbers (bottom to top):', towerNumbers);
        
        // Check if numbers are in ascending order (bottom to top)
        for (let i = 1; i < towerNumbers.length; i++) {
            if (towerNumbers[i] <= towerNumbers[i-1]) {
                console.log('Numbers not in ascending order at position', i);
                return false;
            }
        }
        
        console.log('✅ Tower is valid and complete!');
        return true;
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
