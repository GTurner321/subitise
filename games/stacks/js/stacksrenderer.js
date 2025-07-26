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
        this.updateSVGDimensions();
        this.startGravityCheck();
    }
    
    startGravityCheck() {
        // Check for floating blocks every 2 seconds and apply gravity
        this.gravityInterval = setInterval(() => {
            this.checkAndApplyGravity();
        }, 2000);
    }
    
    checkAndApplyGravity() {
        // Only check blocks that are not in containers, not being dragged, and not locked
        const groundBlocks = this.svg.querySelectorAll('.block:not(.completed-tower)');
        const grassTop = STACKS_CONFIG.GROUND_Y_MIN_PERCENT;
        const grassBottom = STACKS_CONFIG.GROUND_Y_MAX_PERCENT;
        
        groundBlocks.forEach(block => {
            // Skip if block is in a container, being dragged, locked, or currently animating
            if (block._container || 
                block === this.draggedElement || 
                block._isLocked ||
                block.style.transition ||
                block.classList.contains('new-tower-element')) { // Don't mess with intentionally placed blocks
                return;
            }
            
            const currentYPercent = pxToVh(block._centerY);
            
            // Only apply gravity if block is significantly above the grass area (not just slightly above grass bottom)
            if (currentYPercent < grassTop - 5) { // Must be 5% above grass area to trigger gravity
                console.log('Found truly floating block:', block._number, 'at', currentYPercent + '%, applying gravity');
                // Use a random grass position, not just the bottom
                const grassMidY = grassTop + ((grassBottom - grassTop) * 0.6); // 60% down the grass area
                this.applyGravity(block, block._centerX, grassMidY);
            }
        });
    }
    
    updateSVGDimensions() {
        // Set up SVG to use pixel coordinates directly (1:1 mapping)
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.svg.setAttribute('width', width);
        this.svg.setAttribute('height', height);
        this.svg.removeAttribute('viewBox'); // Remove viewBox for 1:1 pixel mapping
        
        console.log('SVG dimensions updated:', width, 'x', height);
    }
    
    setupEventListeners() {
        // Use unified event handling for both mouse and touch
        this.svg.addEventListener('mousedown', (e) => this.handlePointerStart(e));
        this.svg.addEventListener('touchstart', (e) => this.handlePointerStart(e), { passive: false });
        
        // Global move and end events
        document.addEventListener('mousemove', (e) => this.handlePointerMove(e));
        document.addEventListener('touchmove', (e) => this.handlePointerMove(e), { passive: false });
        
        document.addEventListener('mouseup', (e) => this.handlePointerEnd(e));
        document.addEventListener('touchend', (e) => this.handlePointerEnd(e), { passive: false });
        
        console.log('Event listeners set up on SVG');
    }
    
    getCompletedTowerBounds() {
        const completedBlocks = this.svg.querySelectorAll('.block.completed-tower');
        const bounds = { left: [], right: [] };
        
        completedBlocks.forEach(block => {
            const x = pxToVw(block._centerX);
            const width = pxToVw(block._dimensions.width);
            const centerX = STACKS_CONFIG.TOWER_CENTER_X_PERCENT;
            
            if (x < centerX) {
                // Left side tower
                bounds.left.push({
                    left: x - width/2,
                    right: x + width/2,
                    center: x
                });
            } else if (x > centerX) {
                // Right side tower  
                bounds.right.push({
                    left: x - width/2,
                    right: x + width/2,
                    center: x
                });
            }
        });
        
        console.log('Completed tower bounds:', bounds);
        return bounds;
    }
    
    destroy() {
        // Clean up gravity check interval
        if (this.gravityInterval) {
            clearInterval(this.gravityInterval);
            this.gravityInterval = null;
        }
    }
    
    handleResize() {
        this.updateSVGDimensions();
    }
    
    getEventPoint(e) {
        // Always return pixel coordinates relative to the page
        let clientX, clientY;
        
        if (e.touches && e.touches.length > 0) {
            // For touchstart and touchmove
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            // For touchend - coordinates are in changedTouches
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else if (e.clientX !== undefined && e.clientY !== undefined) {
            // For mouse events
            clientX = e.clientX;
            clientY = e.clientY;
        } else {
            console.error('Unable to get event coordinates from:', e.type, e);
            return { x: 0, y: 0 }; // Fallback
        }
        
        // Since we're using 1:1 pixel mapping, we can use client coordinates directly
        const rect = this.svg.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        console.log('getEventPoint:', {
            eventType: e.type,
            clientX, clientY,
            rectLeft: rect.left, rectTop: rect.top,
            finalX: x, finalY: y
        });
        
        // Validate coordinates
        if (isNaN(x) || isNaN(y)) {
            console.error('NaN coordinates detected:', { x, y, clientX, clientY, rect });
            return { x: 0, y: 0 }; // Fallback
        }
        
        return { x, y };
    }
    
    createBlock(number, xPercent, yPercent, color, isWide = false) {
        // Convert percentage coordinates to pixels
        const x = vwToPx(xPercent);
        const y = vhToPx(yPercent);
        const dimensions = getBlockDimensions(isWide);
        
        console.log(`Creating block ${number}: ${dimensions.width}px × ${dimensions.height}px at (${x}, ${y})`);
        
        // Create group for the block
        const blockGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        blockGroup.setAttribute('class', 'block');
        blockGroup.setAttribute('data-number', number);
        blockGroup.style.cursor = 'grab';
        
        // Block rectangle - square blocks
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
        
        // Block shadow (behind)
        const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        shadow.setAttribute('x', x - dimensions.width/2 + 3);
        shadow.setAttribute('y', y - dimensions.height/2 + 3);
        shadow.setAttribute('width', dimensions.width);
        shadow.setAttribute('height', dimensions.height);
        shadow.setAttribute('fill', 'rgba(0,0,0,0.2)');
        shadow.setAttribute('rx', '8');
        shadow.setAttribute('ry', '8');
        
        // Number text - UPDATED: Larger font size
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        
        // UPDATED: Larger font size with multiplier
        const baseFontSize = Math.min(dimensions.height * 0.5, dimensions.width * 0.4);
        const finalFontSize = baseFontSize * STACKS_CONFIG.BLOCK_FONT_SIZE_MULTIPLIER;
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
        
        console.log('Block created:', number, 'at pixel position:', x, y, 'from percent:', xPercent, yPercent);
        
        return blockGroup;
    }
    
    createContainer(xPercent, yPercent, index, isWide = false) {
        // Convert percentage coordinates to pixels
        const x = vwToPx(xPercent);
        const y = vhToPx(yPercent);
        const dimensions = getBlockDimensions(isWide);
        
        console.log(`Creating container ${index}: at ${xPercent}%, ${yPercent}% = (${x}px, ${y}px)`);
        
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
        container.setAttribute('opacity', '0.8');
        
        // Store position data
        container._centerX = x;
        container._centerY = y;
        container._xPercent = xPercent;
        container._yPercent = yPercent;
        container._index = index;
        container._isWide = isWide;
        
        console.log(`Container ${index} bounds: x=${x - dimensions.width/2}, y=${y - dimensions.height/2}, w=${dimensions.width}, h=${dimensions.height}`);
        
        return container;
    }
    
    createTeddy(xPercent, yPercent, imageUrl) {
        const x = vwToPx(xPercent);
        const y = vhToPx(yPercent);
        const baseSize = vhToPx(STACKS_CONFIG.BLOCK_HEIGHT_PERCENT) * 0.8;
        const size = baseSize * STACKS_CONFIG.TEDDY_SIZE_MULTIPLIER;
        
        console.log('Creating teddy at:', x, y, 'with size:', size, 'and image:', imageUrl);
        
        const teddy = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        teddy.setAttribute('class', 'teddy');
        teddy.setAttribute('x', x - size/2);
        teddy.setAttribute('y', y - size - vhToPx(STACKS_CONFIG.BLOCK_HEIGHT_PERCENT)/2);
        teddy.setAttribute('width', size);
        teddy.setAttribute('height', size);
        
        // Store position data for animation
        teddy._centerX = x;
        teddy._centerY = y - size/2;
        teddy._xPercent = xPercent;
        teddy._yPercent = yPercent;
        teddy._size = size;
        
        // Start hidden to prevent any placeholder flash
        teddy.style.opacity = '0';
        teddy.style.transition = 'opacity 0.5s ease-in';
        
        // Handle successful load
        const handleLoad = () => {
            console.log('Teddy image loaded successfully:', imageUrl);
            setTimeout(() => {
                teddy.style.opacity = '1';
            }, 100);
        };
        
        // Handle load failure
        const handleError = () => {
            console.warn('Teddy image failed to load:', imageUrl, '- using fallback');
            this.createFallbackTeddy(teddy, x, y, size);
        };
        
        // Set up listeners BEFORE setting href
        teddy.addEventListener('load', handleLoad, { once: true });
        teddy.addEventListener('error', handleError, { once: true });
        
        // Use the path directly from config (now fixed with proper absolute paths)
        teddy.setAttribute('href', imageUrl);
        
        return teddy;
    }
    
    createFallbackTeddy(teddyElement, x, y, size) {
        console.log('Creating fallback teddy at:', x, y);
        
        // Remove the image element and create a colored circle instead
        const parent = teddyElement.parentNode;
        if (parent) {
            parent.removeChild(teddyElement);
            
            // Create a simple colored circle as fallback
            const fallbackTeddy = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            fallbackTeddy.setAttribute('class', 'teddy fallback-teddy');
            fallbackTeddy.setAttribute('cx', x);
            fallbackTeddy.setAttribute('cy', y - size/2);
            fallbackTeddy.setAttribute('r', size/3);
            fallbackTeddy.setAttribute('fill', '#8B4513'); // Brown color
            fallbackTeddy.setAttribute('stroke', '#654321');
            fallbackTeddy.setAttribute('stroke-width', '2');
            fallbackTeddy.style.opacity = '1';
            
            // Store position data for animation
            fallbackTeddy._centerX = x;
            fallbackTeddy._centerY = y - size/2;
            fallbackTeddy._xPercent = pxToVw(x);
            fallbackTeddy._yPercent = pxToVh(y - size/2);
            fallbackTeddy._size = size;
            
            // Add a simple face
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
            
            const mouth = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            mouth.setAttribute('d', `M ${x - size/12} ${y - size/2 + size/12} Q ${x} ${y - size/2 + size/8} ${x + size/12} ${y - size/2 + size/12}`);
            mouth.setAttribute('stroke', '#000');
            mouth.setAttribute('stroke-width', '1');
            mouth.setAttribute('fill', 'none');
            
            parent.appendChild(fallbackTeddy);
            parent.appendChild(eye1);
            parent.appendChild(eye2);
            parent.appendChild(mouth);
            
            return fallbackTeddy;
        }
    }
    
    renderTowerWithPositions(blocks, containers, containerPositions, blockPositions, isWide = false) {
        console.log('renderTowerWithPositions called with', blocks.length, 'blocks', containers.length, 'containers');
        
        // Clear only NEW tower elements (not completed towers)
        this.clearNewTowerElements();
        
        // Check if any block in this tower has 3 digits to determine if we need wide blocks
        const hasThreeDigitNumbers = blocks.some(block => block.number >= 100);
        const useWideBlocks = isWide || hasThreeDigitNumbers;
        
        console.log('Tower has 3-digit numbers:', hasThreeDigitNumbers, 'Using wide blocks:', useWideBlocks);
        
        // Render containers using provided positions
        containerPositions.forEach((position, index) => {
            console.log(`Container ${index}: Position = ${position.x}%, ${position.y}%`);
            const containerElement = this.createContainer(position.x, position.y, index, useWideBlocks);
            containerElement.classList.add('new-tower-element');
            
            // Ensure container is properly positioned and visible
            containerElement.style.pointerEvents = 'auto';
            containerElement.style.opacity = '0.8';
            
            this.svg.appendChild(containerElement);
            
            console.log(`Container ${index} created and added to SVG:`, {
                centerX: containerElement._centerX,
                centerY: containerElement._centerY,
                xPercent: containerElement._xPercent,
                yPercent: containerElement._yPercent
            });
        });
        
        // Verify all containers were created
        const createdContainers = this.svg.querySelectorAll('.container.new-tower-element');
        console.log(`✅ Created ${createdContainers.length} containers for ${containerPositions.length} requested`);
        
        // Render blocks using provided positions
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
            
            console.log('Added block', block.number, 'at provided position:', position.x + '%,', position.y + '%');
        });
        
        console.log('Tower render complete with provided positions');
    }
    
    clearNewTowerElements() {
        // Only clear elements that are part of the current game, not completed towers
        const elements = this.svg.querySelectorAll('.new-tower-element');
        elements.forEach(element => element.remove());
    }
    
    clearTower() {
        // Clear everything (used for game reset)
        const elements = this.svg.querySelectorAll('.block, .container, .teddy');
        elements.forEach(element => element.remove());
    }
    
    handlePointerStart(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Pointer start event:', e.type);
        
        const point = this.getEventPoint(e);
        console.log('Pointer start at pixel coordinates:', point);
        
        // Safety check for valid coordinates
        if (isNaN(point.x) || isNaN(point.y)) {
            console.error('Invalid start coordinates, aborting drag');
            return;
        }
        
        // Find the block element that was clicked
        const blockElement = this.findBlockAtPoint(point);
        
        if (!blockElement) {
            console.log('No block found at point');
            return;
        }
        
        console.log('Starting drag on block:', blockElement.getAttribute('data-number'));
        
        this.isDragging = true;
        this.draggedElement = blockElement;
        
        // Calculate drag offset using pixel coordinates
        this.dragOffset.x = blockElement._centerX - point.x;
        this.dragOffset.y = blockElement._centerY - point.y;
        
        console.log('Drag offset:', this.dragOffset);
        
        // Safety check for valid offset
        if (isNaN(this.dragOffset.x) || isNaN(this.dragOffset.y)) {
            console.error('Invalid drag offset calculated, aborting drag');
            this.isDragging = false;
            this.draggedElement = null;
            return;
        }
        
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
        
        // Safety check for valid coordinates
        if (isNaN(point.x) || isNaN(point.y)) {
            console.error('Invalid move coordinates, skipping update');
            return;
        }
        
        // Calculate new position using pixel coordinates
        const newX = point.x + this.dragOffset.x;
        const newY = point.y + this.dragOffset.y;
        
        // Safety check for calculated position
        if (isNaN(newX) || isNaN(newY)) {
            console.error('Invalid calculated position, skipping update');
            return;
        }
        
        // Update block position
        this.updateBlockPosition(this.draggedElement, newX, newY);
        
        // Check for hover over containers
        this.handleContainerHover(newX, newY);
    }
    
    handlePointerEnd(e) {
        if (!this.isDragging || !this.draggedElement) return;
        
        e.preventDefault();
        console.log('handlePointerEnd called, event type:', e.type);
        
        const point = this.getEventPoint(e);
        console.log('Drag end at pixel coordinates:', point);
        
        // Safety check for valid coordinates - if we get fallback coordinates, abort gracefully
        if ((point.x === 0 && point.y === 0) || isNaN(point.x) || isNaN(point.y)) {
            console.warn('Invalid drag end coordinates detected, returning block to safe position');
            
            // Reset visual state first
            this.draggedElement.style.cursor = 'grab';
            this.draggedElement._rect.setAttribute('stroke-width', '3');
            this.draggedElement.classList.remove('block-dragging');
            this.clearContainerHover();
            
            // Return block to a safe ground position
            this.returnBlockToGround(this.draggedElement);
            
            // Reset drag state
            this.isDragging = false;
            this.draggedElement = null;
            this.dragOffset = { x: 0, y: 0 };
            
            this.gameController.playReturnSound();
            return;
        }
        
        // Calculate drop position
        const dropX = point.x + this.dragOffset.x;
        const dropY = point.y + this.dragOffset.y;
        
        console.log('Drop position:', { dropX, dropY }, 'Offset:', this.dragOffset);
        
        // UPDATED: Enforce boundaries to prevent blocks from going off-screen or too high
        const svgBounds = this.svg.getBoundingClientRect();
        const minX = 0;
        const maxX = svgBounds.width;
        const minY = vhToPx(70); // Don't allow blocks above 70% from top
        const maxY = svgBounds.height;
        
        let boundedDropX = Math.max(minX, Math.min(maxX, dropX));
        let boundedDropY = Math.max(minY, Math.min(maxY, dropY));
        
        if (dropX !== boundedDropX || dropY !== boundedDropY) {
            console.log('Drop position bounded from', {dropX, dropY}, 'to', {boundedDropX, boundedDropY});
        }
        
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
        
        console.log('Drag ended, dropped:', dropped);
    }
    
    findBlockAtPoint(point) {
        // Check all blocks to see which one contains this point
        const blocks = this.svg.querySelectorAll('.block');
        
        for (let block of blocks) {
            // Skip completed tower blocks - they should not be draggable
            if (block.classList.contains('completed-tower')) {
                console.log('Skipping completed tower block:', block.getAttribute('data-number'));
                continue;
            }
            
            const rect = block._rect;
            const x = parseFloat(rect.getAttribute('x'));
            const y = parseFloat(rect.getAttribute('y'));
            const width = parseFloat(rect.getAttribute('width'));
            const height = parseFloat(rect.getAttribute('height'));
            
            console.log(`Checking block ${block.getAttribute('data-number')}:`, {
                bounds: { x, y, width, height },
                point: point,
                inside: point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height,
                isCompleted: block.classList.contains('completed-tower')
            });
            
            // Check if point is inside the block's rectangle
            if (point.x >= x && point.x <= x + width && 
                point.y >= y && point.y <= y + height) {
                console.log('✅ Found draggable block at point:', block.getAttribute('data-number'));
                return block;
            }
        }
        
        console.log('❌ No draggable block found at point');
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
        // Check ALL containers, not just new-tower-element ones
        const containers = this.svg.querySelectorAll('.container');
        const tolerance = getDragTolerancePx();
        
        console.log('Handling drop at:', x, y, 'with tolerance:', tolerance);
        console.log('Checking', containers.length, 'containers (all containers, not just new-tower-element)');
        
        // Sort containers by distance to find the closest one
        const containerDistances = Array.from(containers).map(container => ({
            container: container,
            distance: this.getDistanceToContainer(container, x, y)
        })).sort((a, b) => a.distance - b.distance);
        
        // Check if dropping on a container, starting with the closest
        for (let containerData of containerDistances) {
            const container = containerData.container;
            const distance = containerData.distance;
            
            console.log('Container', container.getAttribute('data-index'), 'distance:', distance.toFixed(1));
            
            if (distance < tolerance) {
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
        
        // Check if dropping on another block (not in container) - should return to ground
        const targetBlock = this.findBlockAtPoint({x, y});
        if (targetBlock && targetBlock !== this.draggedElement && !this.getContainerForBlock(targetBlock)) {
            console.log('Dropped on another ground block, returning to ground');
            this.returnBlockToGround(this.draggedElement);
            return false;
        }
        
        // Free placement on grass - place block where user dropped it but apply gravity
        console.log('🌱 Free placement on grass at:', x, y);
        this.placeBlockOnGrass(this.draggedElement, x, y);
        return true;
    }
    
    placeBlockOnGrass(block, x, y) {
        console.log('Placing block', block._number, 'on grass at:', x, y);
        
        // Clear any container association
        block._container = null;
        
        // Convert to percentages for storage
        const xPercent = pxToVw(x);
        
        // Get Y position with perspective from game controller
        const existingGroundPositions = this.gameController.getExistingGroundPositions(block);
        const yPercent = this.gameController.getRandomGroundYWithPerspective(existingGroundPositions, xPercent);
        
        console.log('Adjusted Y position with perspective layering:', yPercent + '%');
        
        // Apply gravity to bring to adjusted grass level
        this.applyGravity(block, x, yPercent);
        
        // Ensure block remains interactive
        block.style.cursor = 'grab';
        block.style.pointerEvents = 'all';
        console.log('Block', block._number, 'placed on grass with perspective at:', xPercent + '%,', yPercent + '%');
    }
    
    applyGravity(block, targetX, targetYPercent) {
        const targetY = vhToPx(targetYPercent);
        const fallDuration = 600; // Slower fall for realism
        
        console.log('Applying gravity: falling from', block._centerY, 'to', targetY);
        
        // Animate the block falling to the ground
        block.style.transition = `all ${fallDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`; // Smooth fall
        this.updateBlockPosition(block, targetX, targetY);
        
        // Update stored coordinates after animation
        setTimeout(() => {
            block.style.transition = '';
            block._xPercent = pxToVw(targetX);
            block._yPercent = targetYPercent;
            console.log('Block settled at:', targetX, targetY);
        }, fallDuration);
    }
    
    swapBlocks(block1, block2) {
        console.log('Swapping blocks:', block1._number, 'and', block2._number);
        
        // Get the container positions for both blocks
        const container1 = this.getContainerForBlock(block1);
        const container2 = this.getContainerForBlock(block2);
        
        if (container1 && container2) {
            // Both blocks are in containers - swap their positions
            const tempX = block1._centerX;
            const tempY = block1._centerY;
            const tempXPercent = block1._xPercent;
            const tempYPercent = block1._yPercent;
            
            // Move block1 to block2's container
            this.placeBlockInContainer(block1, container2);
            
            // Move block2 to block1's original container
            this.placeBlockInContainer(block2, container1);
            
            console.log('Swapped blocks in containers');
        } else {
            console.log('Cannot swap - one or both blocks not in containers');
        }
    }
    
    displaceBlockToGround(block) {
        console.log('Displacing block to ground:', block._number);
        
        // Remove block from its current container
        block._container = null;
        
        // Get displacement position from game controller
        const displacementPos = this.gameController.calculateDisplacementPosition(block);
        
        console.log('Displacing block to position:', displacementPos.x + '%,', displacementPos.y + '%');
        
        // Convert to pixel coordinates
        const groundX = vwToPx(displacementPos.x);
        const groundY = vhToPx(displacementPos.y);
        
        // Animate the block falling to the ground with gravity
        this.animateBlockToPosition(block, groundX, groundY, () => {
            // Update all position tracking
            block._centerX = groundX;
            block._centerY = groundY;
            block._xPercent = displacementPos.x;
            block._yPercent = displacementPos.y;
            block._container = null;
            
            // Ensure block remains interactive and visible
            block.style.opacity = '1';
            block.style.pointerEvents = 'all';
            block.style.cursor = 'grab';
            block.classList.remove('completed-tower');
            block.classList.add('new-tower-element');
            block._isLocked = false;
            
            console.log('Block', block._number, 'displaced and positioned at:', displacementPos.x + '%,', displacementPos.y + '%');
        });
    }
    
    animateBlockToPosition(block, targetX, targetY, callback) {
        const duration = 400; // Slightly longer for better visibility
        
        console.log('Animating block', block._number, 'from', block._centerX, block._centerY, 'to', targetX, targetY);
        
        // Ensure block is not locked before animating
        if (block._isLocked) {
            console.warn('Attempted to animate locked block', block._number, '- unlocking it');
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
            
            // Verify final position
            console.log('Animation complete for block', block._number, 'final position:', block._centerX, block._centerY);
            console.log('Block final state:', {
                opacity: block.style.opacity,
                pointerEvents: block.style.pointerEvents,
                cursor: block.style.cursor,
                isLocked: block._isLocked,
                classes: block.classList.toString()
            });
            
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
        console.log('Returning block to ground:', block._number);
        
        // Clear any container association
        block._container = null;
        
        // Find existing ground blocks to avoid overlap
        const groundBlocks = this.getGroundBlocks().filter(b => b !== block);
        
        // Calculate a good ground position
        let groundXPercent;
        if (groundBlocks.length === 0) {
            // First block on ground - place at center
            groundXPercent = STACKS_CONFIG.TOWER_CENTER_X_PERCENT;
        } else {
            // Find a position that doesn't overlap with existing ground blocks
            groundXPercent = this.findAvailableGroundPosition(groundBlocks);
        }
        
        const groundX = vwToPx(groundXPercent);
        const groundY = vhToPx(STACKS_CONFIG.GROUND_Y_PERCENT);
        
        // Animate the block to the ground
        this.animateBlockToPosition(block, groundX, groundY, () => {
            block._centerX = groundX;
            block._centerY = groundY;
            block._xPercent = groundXPercent;
            block._yPercent = STACKS_CONFIG.GROUND_Y_PERCENT;
        });
    }
    
    findAvailableGroundPosition(existingGroundBlocks) {
        const spreadPercent = STACKS_CONFIG.GROUND_SPREAD_PERCENT;
        const centerPercent = STACKS_CONFIG.TOWER_CENTER_X_PERCENT;
        const blockWidthPercent = STACKS_CONFIG.BLOCK_WIDTH_PERCENT;
        
        // Try to place blocks in a line across the ground area
        const totalBlocks = existingGroundBlocks.length + 1;
        
        if (totalBlocks === 1) {
            return centerPercent;
        }
        
        // Calculate positions for all blocks including the new one
        const startPercent = centerPercent - spreadPercent/2;
        const spacing = spreadPercent / (totalBlocks - 1);
        
        // Find the first available position
        for (let i = 0; i < totalBlocks; i++) {
            const candidatePercent = startPercent + (i * spacing);
            
            // Check if this position is too close to existing blocks
            let tooClose = false;
            for (let existingBlock of existingGroundBlocks) {
                const distance = Math.abs(candidatePercent - existingBlock._xPercent);
                if (distance < blockWidthPercent) {
                    tooClose = true;
                    break;
                }
            }
            
            if (!tooClose) {
                return candidatePercent;
            }
        }
        
        // If all calculated positions are taken, place randomly in the spread area
        return startPercent + Math.random() * spreadPercent;
    }
    
    updateBlockPosition(block, centerX, centerY) {
        // IMPORTANT: Don't move locked elements (completed towers)
        if (block._isLocked) {
            console.log('Attempted to move locked block', block._number, '- ignoring');
            return;
        }
        
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
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        
        // Debug container bounds
        const rect = container.getBoundingClientRect();
        console.log(`Container ${container.getAttribute('data-index')} - Center: (${centerX}, ${centerY}), Drop point: (${x}, ${y}), Distance: ${distance.toFixed(1)}`);
        console.log(`Container bounds:`, rect);
        
        return distance;
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
        
        console.log('Animating tower to target position:', targetXPercent + '%', '(' + targetX + 'px)');
        
        // Only animate blocks that are NOT already completed towers
        const elementsToAnimate = towerBlocks.filter(block => !block.classList.contains('completed-tower'));
        if (teddy && !teddy.classList.contains('completed-tower')) {
            elementsToAnimate.push(teddy);
        }
        
        console.log('Animating', elementsToAnimate.length, 'elements (excluding already completed towers)');
        
        elementsToAnimate.forEach(element => {
            element.style.transition = `all ${duration}ms ease-in-out`;
            
            if (element.classList.contains('block')) {
                const newX = element._centerX + deltaX;
                this.updateBlockPosition(element, newX, element._centerY);
                
                // Mark as completed tower and set opacity
                element.classList.add('completed-tower');
                element.classList.remove('new-tower-element');
                element.style.opacity = STACKS_CONFIG.COMPLETED_TOWER_OPACITY;
                element.style.pointerEvents = 'none'; // Make non-interactive
                element.style.cursor = 'default';
                
                // IMPORTANT: Lock the final position to prevent future movement
                element._isLocked = true;
                element._finalX = newX;
                element._finalY = element._centerY;
                
                console.log('Block', element._number, 'locked at final position:', newX, element._centerY);
                
            } else if (element.classList.contains('teddy')) {
                // Handle teddy animation properly
                const currentTeddyX = parseFloat(element.getAttribute('x'));
                const newTeddyX = currentTeddyX + deltaX;
                element.setAttribute('x', newTeddyX);
                
                // Update stored position data
                element._centerX = element._centerX + deltaX;
                element._xPercent = pxToVw(element._centerX);
                
                // Mark teddy as completed tower element
                element.classList.add('completed-tower');
                element.style.opacity = STACKS_CONFIG.COMPLETED_TOWER_OPACITY;
                
                // Lock teddy position
                element._isLocked = true;
                element._finalX = newTeddyX;
                
                console.log('Teddy locked at final position:', newTeddyX);
            }
        });
        
        // Clear transitions after animation and ensure positions are locked
        setTimeout(() => {
            elementsToAnimate.forEach(element => {
                element.style.transition = '';
                
                // Double-check lock status
                if (element._isLocked) {
                    console.log('Element', element.classList.contains('block') ? element._number : 'teddy', 'confirmed locked');
                }
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
