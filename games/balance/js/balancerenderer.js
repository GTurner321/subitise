/**
 * BalanceRenderer - Handles SVG rendering and interactions
 * FIXED: Pan/extension unit, block stacking using BOTTOM of blocks, connection points, no jitter
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
        
        // Connection points (black dots)
        this.leftConnectionDot = null;
        this.rightConnectionDot = null;
        
        // Drag state
        this.draggedBlock = null;
        this.dragOffset = { x: 0, y: 0 };
        this.isDragging = false;
        
        // Track last ground hit for physics
        this.lastGroundHit = false;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.svg.addEventListener('mousedown', (e) => this.handlePointerStart(e));
        this.svg.addEventListener('touchstart', (e) => this.handlePointerStart(e), { passive: false });
        
        document.addEventListener('mousemove', (e) => this.handlePointerMove(e));
        document.addEventListener('touchmove', (e) => this.handlePointerMove(e), { passive: false });
        
        document.addEventListener('mouseup', (e) => this.handlePointerEnd(e));
        document.addEventListener('touchend', (e) => this.handlePointerEnd(e), { passive: false });
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
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }
    
    createSeesaw() {
        // Create pivot triangle
        const pivotHeight = vhToPx(BALANCE_CONFIG.PIVOT_HEIGHT_PERCENT);
        const pivotWidth = pivotHeight * (2 / Math.sqrt(3));
        const pivotX = window.innerWidth / 2;
        const pivotY = vhToPx(BALANCE_CONFIG.PIVOT_Y_PERCENT);
        
        this.pivot = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const points = `${pivotX},${pivotY - pivotHeight} ${pivotX - pivotWidth/2},${pivotY} ${pivotX + pivotWidth/2},${pivotY}`;
        this.pivot.setAttribute('points', points);
        this.pivot.setAttribute('fill', BALANCE_CONFIG.PIVOT_COLOR);
        this.pivot.setAttribute('stroke', BALANCE_CONFIG.PIVOT_STROKE);
        this.pivot.setAttribute('stroke-width', '3');
        this.svg.appendChild(this.pivot);
        
        this.pivotX = pivotX;
        this.pivotY = pivotY - pivotHeight;
        
        // Create seesaw group (bar + connection dots)
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
        
        this.barWidth = barWidth;
        
        // Create connection dots at bar endpoints (in local coordinates of rotating group)
        this.leftConnectionDot = this.createConnectionDot();
        this.leftConnectionDot.setAttribute('cx', -barWidth / 2);
        this.leftConnectionDot.setAttribute('cy', 0);
        this.seesawGroup.appendChild(this.leftConnectionDot);
        
        this.rightConnectionDot = this.createConnectionDot();
        this.rightConnectionDot.setAttribute('cx', barWidth / 2);
        this.rightConnectionDot.setAttribute('cy', 0);
        this.seesawGroup.appendChild(this.rightConnectionDot);
        
        this.seesawGroup.setAttribute('transform', `translate(${this.pivotX},${this.pivotY})`);
        this.svg.appendChild(this.seesawGroup);
        
        // Create pans as unified units
        this.leftPan = this.createPanUnit(-barWidth / 2, 'left');
        this.rightPan = this.createPanUnit(barWidth / 2, 'right');
        
        this.svg.appendChild(this.leftPan.group);
        this.svg.appendChild(this.rightPan.group);
    }
    
    createConnectionDot() {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('r', '5');
        dot.setAttribute('fill', '#000000');
        return dot;
    }
    
    createPanUnit(xOffset, side) {
        const panDims = getPanDimensions();
        const extensionHeight = vhToPx(BALANCE_CONFIG.EXTENSION_HEIGHT_PERCENT);
        
        // Create group for entire pan unit (extension + pan + lips + blocks)
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'pan-unit');
        
        // Calculate initial position
        const initialX = this.pivotX + xOffset;
        const initialY = this.pivotY;
        
        // Vertical extension
        const extension = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        extension.setAttribute('x1', 0);
        extension.setAttribute('y1', 0);
        extension.setAttribute('x2', 0);
        extension.setAttribute('y2', -extensionHeight);
        extension.setAttribute('stroke', BALANCE_CONFIG.SEESAW_COLOR);
        extension.setAttribute('stroke-width', '4');
        group.appendChild(extension);
        
        // Pan bottom line (5 blocks wide)
        const panBottom = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        panBottom.setAttribute('x1', -panDims.width / 2);
        panBottom.setAttribute('y1', -extensionHeight);
        panBottom.setAttribute('x2', panDims.width / 2);
        panBottom.setAttribute('y2', -extensionHeight);
        panBottom.setAttribute('stroke', BALANCE_CONFIG.PAN_STROKE);
        panBottom.setAttribute('stroke-width', '3');
        group.appendChild(panBottom);
        
        // Left lip (reduced height to 0.4 blocks)
        const leftLip = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        leftLip.setAttribute('x1', -panDims.width / 2);
        leftLip.setAttribute('y1', -extensionHeight - panDims.height);
        leftLip.setAttribute('x2', -panDims.width / 2);
        leftLip.setAttribute('y2', -extensionHeight + panDims.lipHeight);
        leftLip.setAttribute('stroke', BALANCE_CONFIG.PAN_STROKE);
        leftLip.setAttribute('stroke-width', '3');
        group.appendChild(leftLip);
        
        // Right lip (reduced height to 0.4 blocks)
        const rightLip = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        rightLip.setAttribute('x1', panDims.width / 2);
        rightLip.setAttribute('y1', -extensionHeight - panDims.height);
        rightLip.setAttribute('x2', panDims.width / 2);
        rightLip.setAttribute('y2', -extensionHeight + panDims.lipHeight);
        rightLip.setAttribute('stroke', BALANCE_CONFIG.PAN_STROKE);
        rightLip.setAttribute('stroke-width', '3');
        group.appendChild(rightLip);
        
        // Set initial transform
        group.setAttribute('transform', `translate(${initialX},${initialY})`);
        
        return {
            group,
            xOffset,
            side,
            currentX: initialX,
            currentY: initialY,
            panDims,
            extensionHeight,
            blocks: [], // Blocks will be children of this group
            bounds: {
                left: initialX - panDims.width / 2,
                right: initialX + panDims.width / 2,
                top: initialY - extensionHeight - panDims.height,
                bottom: initialY - extensionHeight
            }
        };
    }
    
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
    
    updateBlockPosition(block, x, y) {
        if (block._isFixed && block._inPan) return;
        
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
    
    updateBlockInPan(block, pan, localX, localY) {
        const dims = block._dimensions;
        
        // localX and localY represent the CENTER of the block
        block._rect.setAttribute('x', localX - dims.width/2);
        block._rect.setAttribute('y', localY - dims.height/2);
        
        block._shadow.setAttribute('x', localX - dims.width/2 + 3);
        block._shadow.setAttribute('y', localY - dims.height/2 + 3);
        
        block._text.setAttribute('x', localX);
        block._text.setAttribute('y', localY);
    }
    
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
        
        // Remove from pan if it was in one
        if (block._inPan) {
            const pan = block._inPan;
            const index = pan.blocks.indexOf(block);
            if (index > -1) pan.blocks.splice(index, 1);
            block._inPan = null;
            
            // Move block to main SVG (out of pan group) with global coordinates
            const globalX = pan.currentX + parseFloat(block.getAttribute('data-local-x'));
            const globalY = pan.currentY - pan.extensionHeight + parseFloat(block.getAttribute('data-local-y'));
            
            this.updateBlockPosition(block, globalX, globalY);
            this.svg.appendChild(block);
        }
    }
    
    handlePointerMove(e) {
        if (!this.isDragging || !this.draggedBlock) return;
        
        e.preventDefault();
        const point = this.getEventPoint(e);
        
        const newX = point.x + this.dragOffset.x;
        const newY = point.y + this.dragOffset.y;
        
        this.updateBlockPosition(this.draggedBlock, newX, newY);
    }
    
    handlePointerEnd(e) {
        if (!this.isDragging || !this.draggedBlock) return;
        
        e.preventDefault();
        const point = this.getEventPoint(e);
        
        const dropX = point.x + this.dragOffset.x;
        const dropY = point.y + this.dragOffset.y;
        
        const droppedInPan = this.checkPanDrop(this.draggedBlock, dropX, dropY);
        
        if (!droppedInPan) {
            this.placeBlockOnGround(this.draggedBlock, dropX, dropY);
        }
        
        this.draggedBlock.style.cursor = 'grab';
        this.draggedBlock._rect.setAttribute('stroke-width', '3');
        
        this.isDragging = false;
        this.draggedBlock = null;
        
        if (this.gameController) {
            this.gameController.onBlockMoved();
        }
    }
    
    checkPanDrop(block, x, y) {
        if (this.isInPan(x, y, this.leftPan)) {
            this.placeBlockInPan(block, this.leftPan, x);
            return true;
        }
        
        if (this.isInPan(x, y, this.rightPan)) {
            this.placeBlockInPan(block, this.rightPan, x);
            return true;
        }
        
        return false;
    }
    
    isInPan(x, y, pan) {
        return x >= pan.bounds.left && 
               x <= pan.bounds.right && 
               y >= pan.bounds.top && 
               y <= pan.bounds.bottom;
    }
    
    placeBlockInPan(block, pan, dropX) {
        const blockDims = getBlockDimensions();
        
        // Calculate local x position relative to pan center
        const localX = dropX - pan.currentX;
        
        // Find y position: Start at pan bottom
        // Pan bottom is at local y = -extensionHeight
        // Place block CENTER at pan bottom so block sits ON the pan line
        let targetY = -pan.extensionHeight;
        
        // Check all blocks in pan for collision
        for (const otherBlock of pan.blocks) {
            const otherLocalX = parseFloat(otherBlock.getAttribute('data-local-x'));
            const otherLocalY = parseFloat(otherBlock.getAttribute('data-local-y'));
            
            // Check if blocks overlap horizontally
            const xOverlap = Math.abs(localX - otherLocalX) < blockDims.width * 0.9;
            
            if (xOverlap) {
                // This block is below us - stack on top
                // otherLocalY is the center of the other block
                // Top of other block is at: otherLocalY - blockDims.height/2
                // We want our center one block height above that center
                const ourNewCenter = otherLocalY - blockDims.height;
                
                if (ourNewCenter < targetY) {
                    targetY = ourNewCenter;
                }
            }
        }
        
        // Add block to pan
        pan.blocks.push(block);
        block._inPan = pan;
        
        // Store local coordinates
        block.setAttribute('data-local-x', localX);
        block.setAttribute('data-local-y', targetY);
        
        // Update block position in local coordinates
        this.updateBlockInPan(block, pan, localX, targetY);
        
        // Move block to be child of pan group
        pan.group.appendChild(block);
    }
    
    placeBlockOnGround(block, x, y) {
        const grassTop = vhToPx(BALANCE_CONFIG.GRASS_Y_MIN_PERCENT);
        
        if (y < grassTop) {
            y = vhToPx(85);
            
            block.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            this.updateBlockPosition(block, x, y);
            
            setTimeout(() => {
                block.style.transition = '';
            }, 600);
        } else {
            this.updateBlockPosition(block, x, y);
        }
    }
    
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
    
    updateSeesawRotation(angle) {
        if (!this.seesawGroup) return false;
        
        const grassTopY = vhToPx(BALANCE_CONFIG.PIVOT_Y_PERCENT);
        const halfBarWidth = this.barWidth / 2;
        
        let angleRad = (angle * Math.PI) / 180;
        let leftEndX = this.pivotX + (Math.cos(angleRad) * -halfBarWidth);
        let leftEndY = this.pivotY + (Math.sin(angleRad) * -halfBarWidth);
        let rightEndX = this.pivotX + (Math.cos(angleRad) * halfBarWidth);
        let rightEndY = this.pivotY + (Math.sin(angleRad) * halfBarWidth);
        
        let groundHit = false;
        
        if (leftEndY > grassTopY) {
            leftEndY = grassTopY;
            groundHit = true;
        }
        if (rightEndY > grassTopY) {
            rightEndY = grassTopY;
            groundHit = true;
        }
        
        const deltaY = rightEndY - leftEndY;
        const deltaX = rightEndX - leftEndX;
        const actualAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        
        if (this.gameController && this.gameController.physics) {
            this.gameController.physics.setCurrentAngle(actualAngle);
        }
        
        this.seesawGroup.setAttribute('transform', 
            `translate(${this.pivotX},${this.pivotY}) rotate(${actualAngle})`);
        
        // Connection dots rotate with the bar automatically since they're children of seesawGroup
        
        // Smooth pan movement to reduce jitter - only update if change is significant
        const threshold = 0.5; // pixels
        
        if (this.leftPan) {
            const xDiff = Math.abs(leftEndX - this.leftPan.currentX);
            const yDiff = Math.abs(leftEndY - this.leftPan.currentY);
            
            if (xDiff > threshold || yDiff > threshold) {
                this.leftPan.currentX = leftEndX;
                this.leftPan.currentY = leftEndY;
                this.leftPan.group.setAttribute('transform', `translate(${leftEndX},${leftEndY})`);
                
                // Update bounds for drop detection
                this.leftPan.bounds = {
                    left: leftEndX - this.leftPan.panDims.width / 2,
                    right: leftEndX + this.leftPan.panDims.width / 2,
                    top: leftEndY - this.leftPan.extensionHeight - this.leftPan.panDims.height,
                    bottom: leftEndY - this.leftPan.extensionHeight
                };
            }
        }
        
        if (this.rightPan) {
            const xDiff = Math.abs(rightEndX - this.rightPan.currentX);
            const yDiff = Math.abs(rightEndY - this.rightPan.currentY);
            
            if (xDiff > threshold || yDiff > threshold) {
                this.rightPan.currentX = rightEndX;
                this.rightPan.currentY = rightEndY;
                this.rightPan.group.setAttribute('transform', `translate(${rightEndX},${rightEndY})`);
                
                // Update bounds for drop detection
                this.rightPan.bounds = {
                    left: rightEndX - this.rightPan.panDims.width / 2,
                    right: rightEndX + this.rightPan.panDims.width / 2,
                    top: rightEndY - this.rightPan.extensionHeight - this.rightPan.panDims.height,
                    bottom: rightEndY - this.rightPan.extensionHeight
                };
            }
        }
        
        return groundHit;
    }
    
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
    
    clearMoveableBlocks() {
        // Clear blocks from main SVG
        const blocks = this.svg.querySelectorAll('.block:not(.fixed-block)');
        blocks.forEach(block => {
            // Only remove if not in a pan
            if (!block._inPan) {
                block.remove();
            }
        });
        
        // Clear ALL blocks from pans (including fixed grey blocks)
        if (this.leftPan) {
            this.leftPan.blocks.forEach(block => block.remove());
            this.leftPan.blocks = [];
        }
        if (this.rightPan) {
            this.rightPan.blocks.forEach(block => block.remove());
            this.rightPan.blocks = [];
        }
        
        this.blocks = [];
    }
    
    clearAll() {
        this.svg.innerHTML = '';
        this.blocks = [];
        this.seesawGroup = null;
        this.leftPan = null;
        this.rightPan = null;
        this.leftConnectionDot = null;
        this.rightConnectionDot = null;
    }
    
    handleResize() {
        console.log('Resize detected - may need full redraw');
    }
    
    destroy() {
        this.svg.removeEventListener('mousedown', this.handlePointerStart);
        this.svg.removeEventListener('touchstart', this.handlePointerStart);
        
        document.addEventListener('mousemove', this.handlePointerMove);
        document.addEventListener('touchmove', this.handlePointerMove);
        
        document.addEventListener('mouseup', this.handlePointerEnd);
        document.addEventListener('touchend', this.handlePointerEnd);
        
        this.clearAll();
    }
}
