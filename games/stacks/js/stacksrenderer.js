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
        // Only check blocks that are not in containers and not being dragged
        const groundBlocks = this.svg.querySelectorAll('.block:not(.completed-tower)');
        const groundLevel = STACKS_CONFIG.GROUND_Y_MAX_PERCENT;
        
        groundBlocks.forEach(block => {
            // Skip if block is in a container or being dragged
            if (block._container || block === this.draggedElement) return;
            
            const currentYPercent = pxToVh(block._centerY);
            
            // If block is floating above ground level, apply gravity
            if (currentYPercent < groundLevel - 1) { // 1% tolerance
                console.log('Found floating block:', block._number, 'at', currentYPercent + '%, applying gravity');
                this.applyGravity(block, block._centerX, groundLevel);
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
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        // Since we're using 1:1 pixel mapping, we can use client coordinates directly
        const rect = this.svg.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
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
        
        // Block rectangle - UPDATED: Square blocks
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
        
        // Number text - UPDATED: Larger font, better centering
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y); // CHANGED: Removed +6 offset for better vertical centering
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central'); // CHANGED: Better vertical centering
        text.setAttribute('font-size', Math.min(dimensions.height * 0.5, dimensions.width * 0.4)); // CHANGED: Larger font
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
        const size = vhToPx(STACKS_CONFIG.BLOCK_HEIGHT_PERCENT) * 0.8;
        
        console.log('Creating teddy at:', x, y, 'with image:', imageUrl);
        
        const teddy = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        teddy.setAttribute('class', 'teddy');
        teddy.setAttribute('x', x - size/2);
        teddy.setAttribute('y', y - size - vhToPx(STACKS_CONFIG.BLOCK_HEIGHT_PERCENT)/2);
        teddy.setAttribute('width', size);
        teddy.setAttribute('height', size);
        
        // Try different image path formats
        const possiblePaths = [
            imageUrl,                                    // Original path
            imageUrl.replace('subitise/', ''),          // Remove subitise/ prefix
            `../${imageUrl}`,                           // Try parent directory
            `../../${imageUrl}`,                        // Try grandparent directory
            imageUrl.replace('subitise/', 'games/subitise/') // Try games prefix
        ];
        
        let pathIndex = 0;
        
        const tryNextPath = () => {
            if (pathIndex < possiblePaths.length) {
                const currentPath = possiblePaths[pathIndex];
                console.log(`Trying teddy image path ${pathIndex + 1}/${possiblePaths.length}:`, currentPath);
                teddy.setAttribute('href', currentPath);
                pathIndex++;
            } else {
                console.error('All teddy image paths failed for:', imageUrl);
                // Create a fallback colored circle instead
                this.createFallbackTeddy(teddy, x, y, size);
            }
        };
        
        // Handle image load error
        teddy.addEventListener('error', () => {
            console.warn('Teddy image failed to load:', teddy.getAttribute('href'));
            tryNextPath();
        });
        
        // Handle image load success
        teddy.addEventListener('load', () => {
            console.log('Teddy image loaded successfully:', teddy.getAttribute('href'));
        });
        
        teddy.style.opacity = '0';
        teddy.style.transition = 'opacity 0.5s ease-in';
        
        // Start with first path
        tryNextPath();
        
        // Fade in the teddy
        setTimeout(() => {
            teddy.style.opacity = '1';
        }, 100);
        
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
    
    renderTower(blocks, containers, centerXPercent = null, baseYPercent = null, isWide = false) {
        // Use percentage-based positioning throughout
        const centerX = centerXPercent || STACKS_CONFIG.TOWER_CENTER_X_PERCENT;
        const baseY = baseYPercent || STACKS_CONFIG.TOWER_BASE_Y_PERCENT;
        const blockHeightPercent = STACKS_CONFIG.BLOCK_HEIGHT_PERCENT;
        
        console.log('renderTower called with', blocks.length, 'blocks', containers.length, 'containers');
        console.log('Tower center:', centerX, '% base Y:', baseY, '% block height:', blockHeightPercent, '%');
        
        // Clear only NEW tower elements (not completed towers)
        this.clearNewTowerElements();
        
        // Render containers (bottom to top) using percentage positioning
        containers.forEach((container, index) => {
            const yPercent = baseY - (index * blockHeightPercent);
            console.log(`Container ${index}: baseY=${baseY} - (${index} * ${blockHeightPercent}) = ${yPercent}%`);
            const containerElement = this.createContainer(centerX, yPercent, index, isWide);
            containerElement.classList.add('new-tower-element'); // Mark as new
            this.svg.appendChild(containerElement);
        });
        
        // Render blocks randomly on ground avoiding tower area
        blocks.forEach((block, index) => {
            const groundPos = generateRandomGroundPosition();
            const blockElement = this.createBlock(
                block.number, 
                groundPos.x, 
                groundPos.y, 
                block.color,
                block.isWide || isWide
            );
            blockElement.classList.add('new-tower-element'); // Mark as new
            this.svg.appendChild(blockElement);
            console.log('Added block', block.number, 'at random position:', groundPos.x + '%,', groundPos.y + '%');
        });
        
        console.log('Tower render complete. SVG children:', this.svg.children.length);
        console.log('Containers in DOM:', this.svg.querySelectorAll('.container').length);
        console.log('Blocks in DOM:', this.svg.querySelectorAll('.block').length);
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
        
        // Calculate new position using pixel coordinates
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
        
        console.log('Drag end at pixel coordinates:', point);
        
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
    
    findBlockAtPoint(point) {
        // Check all blocks to see which one contains this point
        const blocks = this.svg.querySelectorAll('.block');
        
        for (let block of blocks) {
            const rect = block._rect;
            const x = parseFloat(rect.getAttribute('x'));
            const y = parseFloat(rect.getAttribute('y'));
            const width = parseFloat(rect.getAttribute('width'));
            const height = parseFloat(rect.getAttribute('height'));
            
            console.log(`Checking block ${block.getAttribute('data-number')}:`, {
                bounds: { x, y, width, height },
                point: point,
                inside: point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height
            });
            
            // Check if point is inside the block's rectangle
            if (point.x >= x && point.x <= x + width && 
                point.y >= y && point.y <= y + height) {
                console.log('✅ Found block at point:', block.getAttribute('data-number'));
                return block;
            }
        }
        
        console.log('❌ No block found at point');
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
        const containers = this.svg.querySelectorAll('.container.new-tower-element'); // Only check current tower containers
        const tolerance = getDragTolerancePx();
        
        console.log('Handling drop at:', x, y, 'with tolerance:', tolerance);
        console.log('Checking', containers.length, 'containers');
        
        // Check if dropping on a container
        for (let container of containers) {
            const distance = this.getDistanceToContainer(container, x, y);
            console.log('Container', container.getAttribute('data-index'), 'distance:', distance);
            
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
        const yPercent = pxToVh(y);
        
        // Check if block is above ground - if so, apply gravity
        const groundLevel = STACKS_CONFIG.GROUND_Y_MAX_PERCENT;
        
        if (yPercent < groundLevel) {
            // Block is in the air - apply gravity to bring it down to ground level
            console.log('Block is in air at', yPercent + '%, applying gravity to', groundLevel + '%');
            this.applyGravity(block, x, groundLevel);
        } else {
            // Block is already at ground level - place directly
            this.updateBlockPosition(block, x, vhToPx(groundLevel));
            block._xPercent = xPercent;
            block._yPercent = groundLevel;
        }
        
        // Ensure block remains interactive
        block.style.cursor = 'grab';
        block.style.pointerEvents = 'all';
        console.log('Block', block._number, 'placed on grass and remains interactive');
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
        
        // Find a random position on the ground near the tower
        const groundBlocks = this.getGroundBlocks();
        const baseXPercent = STACKS_CONFIG.TOWER_CENTER_X_PERCENT;
        
        // Create some randomness around the tower area
        const randomOffset = (Math.random() - 0.5) * 20; // ±10% of viewport width
        const newXPercent = Math.max(10, Math.min(90, baseXPercent + randomOffset));
        
        const groundX = vwToPx(newXPercent);
        const groundY = vhToPx(STACKS_CONFIG.GROUND_Y_PERCENT);
        
        // Animate the block falling to the ground
        this.animateBlockToPosition(block, groundX, groundY, () => {
            block._centerX = groundX;
            block._centerY = groundY;
            block._xPercent = newXPercent;
            block._yPercent = STACKS_CONFIG.GROUND_Y_PERCENT;
            block._container = null;
        });
    }
    
    animateBlockToPosition(block, targetX, targetY, callback) {
        const duration = 300;
        
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
        const dimensions = block._dimensions;
        
        const rect = block._rect;
        const shadow = block._shadow;
        const text = block._text;
        
        rect.setAttribute('x', centerX - dimensions.width/2);
        rect.setAttribute('y', centerY - dimensions.height/2);
        
        shadow.setAttribute('x', centerX - dimensions.width/2 + 3);
        shadow.setAttribute('y', centerY - dimensions.height/2 + 3);
        
        text.setAttribute('x', centerX);
        text.setAttribute('y', centerY); // CHANGED: Removed +6 offset for better centering
        
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
        
        // Mark blocks as completed and set opacity
        const elements = [...towerBlocks];
        if (teddy) elements.push(teddy);
        
        elements.forEach(element => {
            element.style.transition = `all ${duration}ms ease-in-out`;
            
            if (element.classList.contains('block')) {
                const newX = element._centerX + deltaX;
                this.updateBlockPosition(element, newX, element._centerY);
                
                // Mark as completed tower and set opacity
                element.classList.add('completed-tower');
                element.classList.remove('new-tower-element');
                element.style.opacity = STACKS_CONFIG.COMPLETED_TOWER_OPACITY;
                
            } else if (element.classList.contains('teddy')) {
                const currentTeddyX = parseFloat(element.getAttribute('x'));
                element.setAttribute('x', currentTeddyX + deltaX);
                
                // Mark teddy as completed tower element
                element.classList.add('completed-tower');
                element.style.opacity = STACKS_CONFIG.COMPLETED_TOWER_OPACITY;
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
