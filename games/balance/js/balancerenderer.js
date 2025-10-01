/**
 * BalanceRenderer - Handles SVG rendering and interactions
 */
class BalanceRenderer {
    constructor(svg, gameController) {
        this.svg = svg;
        this.gameController = gameController;
        
        // SVG elements
        this.seesawGroup = null;
        this.pivot = null;
        this.bar = null;
        this.leftPan = null;
        this.rightPan = null;
        this.blocks = [];
        
        // Drag state
        this.draggedBlock = null;
        this.dragOffset = { x: 0, y: 0 };
        this.isDragging = false;
        
        this.setupEventListeners();
    }
    
    /**
     * Set up drag and drop event listeners
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
     * Get unified event point from mouse or touch
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
     * Initialize seesaw structure
     */
    createSeesaw() {
        // Create pivot (equilateral triangle) - BASE ON TOP OF GRASS
        const pivotHeight = vhToPx(BALANCE_CONFIG.PIVOT_HEIGHT_PERCENT);
        const pivotWidth = pivotHeight * (2 / Math.sqrt(3)); // Equilateral triangle
        const pivotX = window.innerWidth / 2;
        const pivotY = vhToPx(BALANCE_CONFIG.PIVOT_Y_PERCENT); // Top of grass (80%)
        
        // Triangle points - base at pivotY (top of grass), point upward
        this.pivot = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const points = `${pivotX},${pivotY - pivotHeight} ${pivotX - pivotWidth/2},${pivotY} ${pivotX + pivotWidth/2},${pivotY}`;
        this.pivot.setAttribute('points', points);
        this.pivot.setAttribute('fill', BALANCE_CONFIG.PIVOT_COLOR);
        this.pivot.setAttribute('stroke', BALANCE_CONFIG.PIVOT_STROKE);
        this.pivot.setAttribute('stroke-width', '3');
        this.svg.appendChild(this.pivot);
        
        // Store pivot position (top of triangle, not base)
        this.pivotX = pivotX;
        this.pivotY = pivotY - pivotHeight;
        
        // Create seesaw group (for rotating bar only)
        this.seesawGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.seesawGroup.setAttribute('class', 'seesaw-group');
        
        // Create bar
        const barWidth = vwToPx(BALANCE_CONFIG.SEESAW_WIDTH_PERCENT);
        const barThickness = vhToPx(BALANCE_CONFIG.SEESAW_BAR_THICKNESS_PERCENT);
        
        this.bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        this.bar.setAttribute('x', -barWidth / 2);
        this.bar.setAttribute('y', -barThickness / 2);
        this.bar.setAttribute('width', barWidth);
        this.bar.setAttribute('height', barThickness);
        this.bar.setAttribute('fill', BALANCE_CONFIG.SEESAW_COLOR);
        this.bar.setAttribute('rx', '3');
        this.seesawGroup.appendChild(this.bar);
        
        // Store bar endpoints for extension tracking
        this.barWidth = barWidth;
        
        // Set initial transform for bar
        this.seesawGroup.setAttribute('transform', `translate(${this.pivotX},${this.pivotY})`);
        this.svg.appendChild(this.seesawGroup);
        
        // Create pans (separate from rotating bar, stay vertical)
        this.leftPan = this.createPan(-barWidth / 2, 'left');
        this.rightPan = this.createPan(barWidth / 2, 'right');
        
        this.svg.appendChild(this.leftPan.group);
        this.svg.appendChild(this.rightPan.group);
    }
    
    /**
     * Create a pan at the given x position (vertical extensions with visible base and lips)
     */
    createPan(xPos, side) {
        const panDims = getPanDimensions();
        const extensionHeight = vhToPx(BALANCE_CONFIG.EXTENSION_HEIGHT_PERCENT);
        
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'pan-group');
        
        // Store initial position
        const initialX = this.pivotX + xPos;
        const initialY = this.pivotY;
        
        // Vertical extension (stays vertical, doesn't rotate with bar)
        const extension = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        extension.setAttribute('x1', initialX);
        extension.setAttribute('y1', initialY);
        extension.setAttribute('x2', initialX);
        extension.setAttribute('y2', initialY - extensionHeight);
        extension.setAttribute('stroke', BALANCE_CONFIG.SEESAW_COLOR);
        extension.setAttribute('stroke-width', '4');
        group.appendChild(extension);
        
        // Pan base - VISIBLE bottom line only (5 blocks wide)
        const panY = initialY - extensionHeight - panDims.height;
        const panBottom = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        panBottom.setAttribute('x1', initialX - panDims.width / 2);
        panBottom.setAttribute('y1', panY + panDims.height);
        panBottom.setAttribute('x2', initialX + panDims.width / 2);
        panBottom.setAttribute('y2', panY + panDims.height);
        panBottom.setAttribute('stroke', BALANCE_CONFIG.PAN_STROKE);
        panBottom.setAttribute('stroke-width', '3');
        group.appendChild(panBottom);
        
        // Left lip
        const leftLip = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        leftLip.setAttribute('x1', initialX - panDims.width / 2);
        leftLip.setAttribute('y1', panY);
        leftLip.setAttribute('x2', initialX - panDims.width / 2);
        leftLip.setAttribute('y2', panY + panDims.height + panDims.lipHeight);
        leftLip.setAttribute('stroke', BALANCE_CONFIG.PAN_STROKE);
        leftLip.setAttribute('stroke-width', '3');
        group.appendChild(leftLip);
        
        // Right lip
        const rightLip = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        rightLip.setAttribute('x1', initialX + panDims.width / 2);
        rightLip.setAttribute('y1', panY);
        rightLip.setAttribute('x2', initialX + panDims.width / 2);
        rightLip.setAttribute('y2', panY + panDims.height + panDims.lipHeight);
        rightLip.setAttribute('stroke', BALANCE_CONFIG.PAN_STROKE);
        rightLip.setAttribute('stroke-width', '3');
        group.appendChild(rightLip);
        
        // Store element references
        group._extension = extension;
        group._panBottom = panBottom;
        group._leftLip = leftLip;
        group._rightLip = rightLip;
        
        return {
            group,
            xOffset: xPos, // Offset from pivot on bar
            side,
            currentX: initialX,
            currentY: panY, // Top of pan
            bounds: {
                left: initialX - panDims.width / 2,
                right: initialX + panDims.width / 2,
                top: panY,
                bottom: panY + panDims.height
            },
            blocks: []
        };
    }
    
    /**
     * Create a block element
     */
    createBlock(number, xPercent, yPercent, color, isFixed = false) {
        const x = vwToPx(xPercent);
        const y = vhToPx(yPercent);
        const dimensions = getBlockDimensions();
        
        const blockGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        blockGroup.setAttribute('class', isFixed ? 'block fixed-block' : 'block');
        blockGroup.setAttribute('data-number', number);
        blockGroup.setAttribute('data-weight', number);
        if (!isFixed) blockGroup.style.cursor = 'grab';
        
        // Shadow
        const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        shadow.setAttribute('x', x - dimensions.width/2 + 3);
        shadow.setAttribute('y', y - dimensions.height/2 + 3);
        shadow.setAttribute('width', dimensions.width);
        shadow.setAttribute('height', dimensions.height);
        shadow.setAttribute('fill', 'rgba(0,0,0,0.2)');
        shadow.setAttribute('rx', '8');
        
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
        
        // Number text
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        const fontSize = Math.min(dimensions.height * 0.5, dimensions.width * 0.4) * BALANCE_CONFIG.BLOCK_FONT_SIZE_MULTIPLIER;
        text.setAttribute('font-size', fontSize);
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('fill', isFixed ? BALANCE_CONFIG.FIXED_BLOCK_TEXT : '#000');
        text.textContent = number;
        
        blockGroup.appendChild(shadow);
        blockGroup.appendChild(rect);
        blockGroup.appendChild(text);
        
        // Store references
        blockGroup._rect = rect;
        blockGroup._text = text;
        blockGroup._shadow = shadow;
        blockGroup._centerX = x;
        blockGroup._centerY = y;
        blockGroup._dimensions = dimensions;
        blockGroup._isFixed = isFixed;
        blockGroup._inPan = null;
        
        return blockGroup;
    }
    
    /**
     * Update block position
     */
    updateBlockPosition(block, x, y) {
        if (block._isFixed && block._inPan) return; // Don't move fixed blocks in pans
        
        const dims = block._dimensions;
        
        block._rect.setAttribute('x', x - dims.width/2);
        block._rect.setAttribute('y', y - dims.height/2);
        
        block._shadow.setAttribute('x', x - dims.width/2 + 3);
        block._shadow.setAttribute('y', y - dims.height/2 + 3);
        
        block._text.setAttribute('x', x);
        block._text.setAttribute('y', y);
        
        block._centerX = x;
        block._centerY = y;
    }
    
    /**
     * Handle pointer start (drag begin)
     */
    handlePointerStart(e) {
        const point = this.getEventPoint(e);
        const block = this.findBlockAtPoint(point);
        
        if (!block || block._isFixed) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        this.isDragging = true;
        this.draggedBlock = block;
        
        this.dragOffset.x = block._centerX - point.x;
        this.dragOffset.y = block._centerY - point.y;
        
        block.style.cursor = 'grabbing';
        block._rect.setAttribute('stroke-width', '4');
        
        // Bring to front
        this.svg.appendChild(block);
    }
    
    /**
     * Handle pointer move (dragging)
     */
    handlePointerMove(e) {
        if (!this.isDragging || !this.draggedBlock) return;
        
        e.preventDefault();
        const point = this.getEventPoint(e);
        
        const newX = point.x + this.dragOffset.x;
        const newY = point.y + this.dragOffset.y;
        
        this.updateBlockPosition(this.draggedBlock, newX, newY);
    }
    
    /**
     * Handle pointer end (drop)
     */
    handlePointerEnd(e) {
        if (!this.isDragging || !this.draggedBlock) return;
        
        e.preventDefault();
        const point = this.getEventPoint(e);
        
        const dropX = point.x + this.dragOffset.x;
        const dropY = point.y + this.dragOffset.y;
        
        // Check if dropped in a pan
        const droppedInPan = this.checkPanDrop(this.draggedBlock, dropX, dropY);
        
        if (!droppedInPan) {
            // Place on ground with gravity
            this.placeBlockOnGround(this.draggedBlock, dropX, dropY);
        }
        
        // Reset drag state
        this.draggedBlock.style.cursor = 'grab';
        this.draggedBlock._rect.setAttribute('stroke-width', '3');
        
        this.isDragging = false;
        this.draggedBlock = null;
        
        // Notify game controller
        if (this.gameController) {
            this.gameController.onBlockMoved();
        }
    }
    
    /**
     * Check if block is dropped in a pan
     */
    checkPanDrop(block, x, y) {
        // Check left pan
        if (this.isInPan(x, y, this.leftPan)) {
            this.placeBlockInPan(block, this.leftPan, 'left');
            return true;
        }
        
        // Check right pan
        if (this.isInPan(x, y, this.rightPan)) {
            this.placeBlockInPan(block, this.rightPan, 'right');
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if point is in pan bounds
     */
    isInPan(x, y, pan) {
        return x >= pan.bounds.left && 
               x <= pan.bounds.right && 
               y >= pan.bounds.top && 
               y <= pan.bounds.bottom;
    }
    
    /**
     * Place block in pan
     */
    placeBlockInPan(block, pan, side) {
        // Remove from previous pan
        if (block._inPan) {
            const prevPan = block._inPan;
            const index = prevPan.blocks.indexOf(block);
            if (index > -1) prevPan.blocks.splice(index, 1);
        }
        
        // Add to new pan
        if (!pan.blocks) pan.blocks = [];
        pan.blocks.push(block);
        block._inPan = pan;
        block._panSide = side;
        
        // Calculate position in pan
        this.arrangeBlocksInPan(pan);
    }
    
    /**
     * Arrange blocks in pan (place horizontally if space, stack if overlapping)
     */
    arrangeBlocksInPan(pan) {
        if (!pan.blocks || pan.blocks.length === 0) return;
        
        const blockDims = getBlockDimensions();
        const panBottom = pan.bounds.bottom;
        const panLeft = pan.bounds.left;
        const panRight = pan.bounds.right;
        
        // Track occupied horizontal spaces at each height level
        const occupiedSpaces = []; // Array of {x, width, height} for each block
        
        pan.blocks.forEach((block) => {
            const blockWidth = blockDims.width;
            const blockHeight = blockDims.height;
            
            // Try to find a horizontal position on the bottom first
            let targetX = pan.currentX;
            let targetY = panBottom - blockHeight / 2;
            let placed = false;
            
            // Check all possible horizontal positions at each height level
            for (let level = 0; level < pan.blocks.length; level++) {
                const levelY = panBottom - blockHeight / 2 - (level * blockHeight);
                
                // Try different horizontal positions across the pan width
                const positions = [];
                const panWidth = panRight - panLeft;
                const numPositions = Math.floor(panWidth / blockWidth);
                
                for (let i = 0; i < numPositions; i++) {
                    const testX = panLeft + blockWidth / 2 + (i * blockWidth);
                    positions.push(testX);
                }
                
                // Check each position for overlap
                for (let testX of positions) {
                    let hasOverlap = false;
                    
                    // Check if this position overlaps with any existing blocks
                    for (let occupied of occupiedSpaces) {
                        const xOverlap = Math.abs(testX - occupied.x) < blockWidth * 0.9; // 90% overlap threshold
                        const yOverlap = Math.abs(levelY - occupied.y) < blockHeight * 0.9;
                        
                        if (xOverlap && yOverlap) {
                            hasOverlap = true;
                            break;
                        }
                    }
                    
                    if (!hasOverlap) {
                        // Found a free spot
                        targetX = testX;
                        targetY = levelY;
                        placed = true;
                        break;
                    }
                }
                
                if (placed) break;
            }
            
            // Place the block
            this.updateBlockPosition(block, targetX, targetY);
            
            // Record this block's occupied space
            occupiedSpaces.push({
                x: targetX,
                y: targetY,
                width: blockWidth,
                height: blockHeight
            });
        });
    }
    
    /**
     * Place block on ground with gravity
     */
    placeBlockOnGround(block, x, y) {
        // Remove from pan if it was in one
        if (block._inPan) {
            const pan = block._inPan;
            const index = pan.blocks.indexOf(block);
            if (index > -1) pan.blocks.splice(index, 1);
            block._inPan = null;
            block._panSide = null;
        }
        
        // Apply gravity if above grass
        const grassTop = vhToPx(BALANCE_CONFIG.GRASS_Y_MIN_PERCENT);
        
        if (y < grassTop) {
            y = vhToPx(85); // Middle of grass
            
            block.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            this.updateBlockPosition(block, x, y);
            
            setTimeout(() => {
                block.style.transition = '';
            }, 600);
        } else {
            this.updateBlockPosition(block, x, y);
        }
    }
    
    /**
     * Find block at point
     */
    findBlockAtPoint(point) {
        const blocks = this.svg.querySelectorAll('.block:not(.fixed-block)');
        
        for (let block of blocks) {
            const rect = block._rect;
            const x = parseFloat(rect.getAttribute('x'));
            const y = parseFloat(rect.getAttribute('y'));
            const width = parseFloat(rect.getAttribute('width'));
            const height = parseFloat(rect.getAttribute('height'));
            
            if (point.x >= x && point.x <= x + width && 
                point.y >= y && point.y <= y + height) {
                return block;
            }
        }
        
        return null;
    }
    
    /**
     * Update seesaw rotation and pan positions with grass collision detection
     */
    updateSeesawRotation(angle) {
        if (!this.seesawGroup) return;
        
        const grassTopY = vhToPx(BALANCE_CONFIG.PIVOT_Y_PERCENT); // 80% from top
        const halfBarWidth = this.barWidth / 2;
        
        // Calculate endpoint positions from physics angle
        let angleRad = (angle * Math.PI) / 180;
        let leftEndX = this.pivotX + (Math.cos(angleRad) * -halfBarWidth);
        let leftEndY = this.pivotY + (Math.sin(angleRad) * -halfBarWidth);
        let rightEndX = this.pivotX + (Math.cos(angleRad) * halfBarWidth);
        let rightEndY = this.pivotY + (Math.sin(angleRad) * halfBarWidth);
        
        // Track if we hit ground for bounce physics
        let groundHit = false;
        
        // Clamp endpoints to grass level
        if (leftEndY > grassTopY) {
            leftEndY = grassTopY;
            groundHit = true;
        }
        if (rightEndY > grassTopY) {
            rightEndY = grassTopY;
            groundHit = true;
        }
        
        // Recalculate actual angle from clamped positions
        const deltaY = rightEndY - leftEndY;
        const deltaX = rightEndX - leftEndX;
        const actualAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        
        // Update physics with actual angle (feedback loop)
        if (this.gameController && this.gameController.physics) {
            this.gameController.physics.setCurrentAngle(actualAngle);
        }
        
        // Rotate the bar to actual angle
        this.seesawGroup.setAttribute('transform', 
            `translate(${this.pivotX},${this.pivotY}) rotate(${actualAngle})`);
        
        const extensionHeight = vhToPx(BALANCE_CONFIG.EXTENSION_HEIGHT_PERCENT);
        const panDims = getPanDimensions();
        
        // Update left pan and extension
        if (this.leftPan) {
            const panTopY = leftEndY - extensionHeight;
            
            this.leftPan.currentX = leftEndX;
            this.leftPan.currentY = panTopY;
            
            // Update extension (vertical)
            const ext = this.leftPan.group._extension;
            if (ext) {
                ext.setAttribute('x1', leftEndX);
                ext.setAttribute('y1', leftEndY);
                ext.setAttribute('x2', leftEndX);
                ext.setAttribute('y2', leftEndY - extensionHeight);
            }
            
            // Update pan bottom line
            const panBottom = this.leftPan.group._panBottom;
            if (panBottom) {
                panBottom.setAttribute('x1', leftEndX - panDims.width / 2);
                panBottom.setAttribute('y1', leftEndY - extensionHeight + panDims.height);
                panBottom.setAttribute('x2', leftEndX + panDims.width / 2);
                panBottom.setAttribute('y2', leftEndY - extensionHeight + panDims.height);
            }
            
            // Update left lip
            const leftLip = this.leftPan.group._leftLip;
            if (leftLip) {
                leftLip.setAttribute('x1', leftEndX - panDims.width / 2);
                leftLip.setAttribute('y1', panTopY);
                leftLip.setAttribute('x2', leftEndX - panDims.width / 2);
                leftLip.setAttribute('y2', panTopY + panDims.height + panDims.lipHeight);
            }
            
            // Update right lip
            const rightLip = this.leftPan.group._rightLip;
            if (rightLip) {
                rightLip.setAttribute('x1', leftEndX + panDims.width / 2);
                rightLip.setAttribute('y1', panTopY);
                rightLip.setAttribute('x2', leftEndX + panDims.width / 2);
                rightLip.setAttribute('y2', panTopY + panDims.height + panDims.lipHeight);
            }
            
            // Update bounds
            this.leftPan.bounds = {
                left: leftEndX - panDims.width / 2,
                right: leftEndX + panDims.width / 2,
                top: panTopY,
                bottom: panTopY + panDims.height
            };
            
            // Move blocks with pan
            this.updateBlocksInPan(this.leftPan);
        }
        
        // Update right pan and extension
        if (this.rightPan) {
            const panTopY = rightEndY - extensionHeight;
            
            this.rightPan.currentX = rightEndX;
            this.rightPan.currentY = panTopY;
            
            // Update extension (vertical)
            const ext = this.rightPan.group._extension;
            if (ext) {
                ext.setAttribute('x1', rightEndX);
                ext.setAttribute('y1', rightEndY);
                ext.setAttribute('x2', rightEndX);
                ext.setAttribute('y2', rightEndY - extensionHeight);
            }
            
            // Update pan bottom line
            const panBottom = this.rightPan.group._panBottom;
            if (panBottom) {
                panBottom.setAttribute('x1', rightEndX - panDims.width / 2);
                panBottom.setAttribute('y1', rightEndY - extensionHeight + panDims.height);
                panBottom.setAttribute('x2', rightEndX + panDims.width / 2);
                panBottom.setAttribute('y2', rightEndY - extensionHeight + panDims.height);
            }
            
            // Update left lip
            const leftLip = this.rightPan.group._leftLip;
            if (leftLip) {
                leftLip.setAttribute('x1', rightEndX - panDims.width / 2);
                leftLip.setAttribute('y1', panTopY);
                leftLip.setAttribute('x2', rightEndX - panDims.width / 2);
                leftLip.setAttribute('y2', panTopY + panDims.height + panDims.lipHeight);
            }
            
            // Update right lip
            const rightLip = this.rightPan.group._rightLip;
            if (rightLip) {
                rightLip.setAttribute('x1', rightEndX + panDims.width / 2);
                rightLip.setAttribute('y1', panTopY);
                rightLip.setAttribute('x2', rightEndX + panDims.width / 2);
                rightLip.setAttribute('y2', panTopY + panDims.height + panDims.lipHeight);
            }
            
            // Update bounds
            this.rightPan.bounds = {
                left: rightEndX - panDims.width / 2,
                right: rightEndX + panDims.width / 2,
                top: panTopY,
                bottom: panTopY + panDims.height
            };
            
            // Move blocks with pan
            this.updateBlocksInPan(this.rightPan);
        }
        
        return groundHit; // Return whether we hit grass for physics bounce
    }
    
    /**
     * Update positions of blocks in a pan (move with pan)
     */
    updateBlocksInPan(pan) {
        if (!pan.blocks || pan.blocks.length === 0) return;
        
        const blockDims = getBlockDimensions();
        const panBottom = pan.bounds.bottom;
        
        pan.blocks.forEach((block, index) => {
            const x = pan.currentX;
            const y = panBottom - blockDims.height/2 - (index * blockDims.height);
            
            this.updateBlockPosition(block, x, y);
        });
    }
    
    /**
     * Get weights on each side
     */
    getWeights() {
        let leftWeight = 0;
        let rightWeight = 0;
        
        if (this.leftPan && this.leftPan.blocks) {
            leftWeight = this.leftPan.blocks.reduce((sum, block) => 
                sum + parseInt(block.getAttribute('data-weight')), 0);
        }
        
        if (this.rightPan && this.rightPan.blocks) {
            rightWeight = this.rightPan.blocks.reduce((sum, block) => 
                sum + parseInt(block.getAttribute('data-weight')), 0);
        }
        
        return { left: leftWeight, right: rightWeight };
    }
    
    /**
     * Create teddy bear
     */
    createTeddy(xPercent, yPercent, imageUrl) {
        const x = vwToPx(xPercent);
        const y = vhToPx(yPercent);
        const baseSize = vhToPx(BALANCE_CONFIG.BLOCK_HEIGHT_PERCENT) * 0.8;
        const size = baseSize * BALANCE_CONFIG.TEDDY_SIZE_MULTIPLIER;
        
        const teddy = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        teddy.setAttribute('class', 'teddy');
        teddy.setAttribute('x', x - size/2);
        teddy.setAttribute('y', y - size);
        teddy.setAttribute('width', size);
        teddy.setAttribute('height', size);
        teddy.setAttribute('href', imageUrl);
        
        teddy.style.opacity = '0';
        teddy.style.transition = 'opacity 0.5s ease-in';
        
        setTimeout(() => {
            teddy.style.opacity = '1';
        }, BALANCE_CONFIG.TEDDY_APPEAR_DELAY);
        
        return teddy;
    }
    
    /**
     * Clear all moveable blocks
     */
    clearMoveableBlocks() {
        const blocks = this.svg.querySelectorAll('.block:not(.fixed-block)');
        blocks.forEach(block => block.remove());
        this.blocks = [];
    }
    
    /**
     * Clear everything
     */
    clearAll() {
        this.svg.innerHTML = '';
        this.blocks = [];
        this.seesawGroup = null;
        this.leftPan = null;
        this.rightPan = null;
    }
    
    /**
     * Handle resize
     */
    handleResize() {
        // Would need to recalculate and redraw everything
        // For now, just log that resize happened
        console.log('Resize detected - may need full redraw');
    }
    
    /**
     * Destroy renderer
     */
    destroy() {
        this.svg.removeEventListener('mousedown', this.handlePointerStart);
        this.svg.removeEventListener('touchstart', this.handlePointerStart);
        
        document.removeEventListener('mousemove', this.handlePointerMove);
        document.removeEventListener('touchmove', this.handlePointerMove);
        
        document.removeEventListener('mouseup', this.handlePointerEnd);
        document.removeEventListener('touchend', this.handlePointerEnd);
        
        this.clearAll();
    }
}
