/**
 * BalanceElementManager - Handles creation and management of SVG elements
 * Creates seesaw, pans, blocks, drop zones, and manages their visual updates
 */
class BalanceElementManager {
    constructor(svg) {
        this.svg = svg;
        
        // SVG elements
        this.seesawGroup = null;
        this.pivot = null;
        this.bar = null;
        this.leftPan = null;
        this.rightPan = null;
        this.leftConnectionDot = null;
        this.rightConnectionDot = null;
        this.blocks = [];
        
        // Store pivot position for calculations
        this.pivotX = 0;
        this.pivotY = 0;
        this.barWidth = 0;
    }
    
    /**
     * Create the complete seesaw system
     */
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
        
        // Create connection dots at bar endpoints (elbow joints)
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
        
        console.log('Seesaw system created');
    }
    
    /**
     * Create connection dot (elbow joint)
     */
    createConnectionDot() {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('r', '5');
        dot.setAttribute('fill', '#000000');
        return dot;
    }
    
    /**
     * Create a pan unit (extension + pan bottom + lips + drop zone)
     */
    createPanUnit(xOffset, side) {
        const panDims = getPanDimensions();
        const extensionHeight = vhToPx(BALANCE_CONFIG.EXTENSION_HEIGHT_PERCENT);
        const blockHeight = getBlockDimensions().height;
        
        // Create group for entire pan unit
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'pan-unit');
        
        // Initial position (will be updated)
        const initialX = this.pivotX + xOffset;
        const initialY = this.pivotY;
        
        // Vertical extension - starts at (0,0) which is the elbow/bar endpoint
        const extension = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        extension.setAttribute('x1', 0);
        extension.setAttribute('y1', 0);
        extension.setAttribute('x2', 0);
        extension.setAttribute('y2', -extensionHeight);
        extension.setAttribute('stroke', BALANCE_CONFIG.SEESAW_COLOR);
        extension.setAttribute('stroke-width', '4');
        group.appendChild(extension);
        
        // NEW: Create drop zone FIRST (so it appears behind other elements)
        const dropZone = this.createDropZone(panDims, extensionHeight, blockHeight);
        group.appendChild(dropZone);
        
        // Pan bottom line (5 blocks wide) at top of extension
        const panBottom = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        panBottom.setAttribute('x1', -panDims.width / 2);
        panBottom.setAttribute('y1', -extensionHeight);
        panBottom.setAttribute('x2', panDims.width / 2);
        panBottom.setAttribute('y2', -extensionHeight);
        panBottom.setAttribute('stroke', BALANCE_CONFIG.PAN_STROKE);
        panBottom.setAttribute('stroke-width', '3');
        group.appendChild(panBottom);
        
        // Left lip - 0.4 blocks high
        const lipHeight = blockHeight * 0.4;
        const leftLip = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        leftLip.setAttribute('x1', -panDims.width / 2);
        leftLip.setAttribute('y1', -extensionHeight);
        leftLip.setAttribute('x2', -panDims.width / 2);
        leftLip.setAttribute('y2', -extensionHeight - lipHeight);
        leftLip.setAttribute('stroke', BALANCE_CONFIG.PAN_STROKE);
        leftLip.setAttribute('stroke-width', '3');
        group.appendChild(leftLip);
        
        // Right lip - 0.4 blocks high
        const rightLip = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        rightLip.setAttribute('x1', panDims.width / 2);
        rightLip.setAttribute('y1', -extensionHeight);
        rightLip.setAttribute('x2', panDims.width / 2);
        rightLip.setAttribute('y2', -extensionHeight - lipHeight);
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
            lipHeight,
            blocks: [],
            dropZone: dropZone, // Store reference to drop zone
            bounds: {
                left: initialX - panDims.width / 2,
                right: initialX + panDims.width / 2,
                top: initialY - extensionHeight - panDims.height,
                bottom: initialY - extensionHeight
            }
        };
    }
    
    /**
     * NEW: Create drop zone rectangle for pan
     */
    createDropZone(panDims, extensionHeight, blockHeight) {
        const dropZone = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        dropZone.setAttribute('class', 'drop-zone');
        
        // Position: centered horizontally, starts at pan bottom line
        dropZone.setAttribute('x', -panDims.width / 2);
        dropZone.setAttribute('y', -extensionHeight - (blockHeight * 2)); // 2 blocks high
        dropZone.setAttribute('width', panDims.width);
        dropZone.setAttribute('height', blockHeight * 2);
        dropZone.setAttribute('rx', '8');
        dropZone.setAttribute('ry', '8');
        
        return dropZone;
    }
    
    /**
     * Create a game block
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
        
        // Store references and positions (BOTH pixels AND percentages for responsive)
        blockGroup._rect = rect;
        blockGroup._text = text;
        blockGroup._shadow = shadow;
        blockGroup._centerX = x;
        blockGroup._centerY = y;
        blockGroup._xPercent = xPercent;
        blockGroup._yPercent = yPercent;
        blockGroup._dimensions = dimensions;
        blockGroup._isFixed = isFixed;
        blockGroup._inPan = null;
        
        return blockGroup;
    }
    
    /**
     * Update block position (pixel coordinates)
     */
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
        
        // Update percentage coordinates for responsive
        block._xPercent = pxToVw(x);
        block._yPercent = pxToVh(y);
    }
    
    /**
     * Update block position within pan (local coordinates)
     */
    updateBlockInPan(block, pan, localX, localY) {
        const dims = block._dimensions;
        
        block._rect.setAttribute('x', localX - dims.width/2);
        block._rect.setAttribute('y', localY - dims.height/2);
        
        block._shadow.setAttribute('x', localX - dims.width/2 + 3);
        block._shadow.setAttribute('y', localY - dims.height/2 + 3);
        
        block._text.setAttribute('x', localX);
        block._text.setAttribute('y', localY);
    }
    
    /**
     * Update seesaw rotation and pan positions
     */
    updateSeesawRotation(angle) {
        if (!this.seesawGroup) return false;
        
        const grassTopY = vhToPx(BALANCE_CONFIG.PIVOT_Y_PERCENT);
        const halfBarWidth = this.barWidth / 2;
        
        // Calculate endpoint positions
        let angleRad = (angle * Math.PI) / 180;
        let leftEndX = this.pivotX + (Math.cos(angleRad) * -halfBarWidth);
        let leftEndY = this.pivotY + (Math.sin(angleRad) * -halfBarWidth);
        let rightEndX = this.pivotX + (Math.cos(angleRad) * halfBarWidth);
        let rightEndY = this.pivotY + (Math.sin(angleRad) * halfBarWidth);
        
        let groundHit = false;
        let actualAngle = angle;
        
        // Check if endpoints would penetrate ground
        if (leftEndY > grassTopY || rightEndY > grassTopY) {
            groundHit = true;
            
            const leftLimitSin = (grassTopY - this.pivotY) / -halfBarWidth;
            const rightLimitSin = (grassTopY - this.pivotY) / halfBarWidth;
            
            const leftLimitSinClamped = Math.max(-1, Math.min(1, leftLimitSin));
            const rightLimitSinClamped = Math.max(-1, Math.min(1, rightLimitSin));
            
            const leftLimitAngle = Math.asin(leftLimitSinClamped);
            const rightLimitAngle = Math.asin(rightLimitSinClamped);
            
            if (angle > 0) {
                actualAngle = Math.min(angle, rightLimitAngle) * (180 / Math.PI);
            } else {
                actualAngle = Math.max(angle, leftLimitAngle) * (180 / Math.PI);
            }
            
            // Recalculate endpoints with clamped angle
            angleRad = (actualAngle * Math.PI) / 180;
            leftEndX = this.pivotX + (Math.cos(angleRad) * -halfBarWidth);
            leftEndY = this.pivotY + (Math.sin(angleRad) * -halfBarWidth);
            rightEndX = this.pivotX + (Math.cos(angleRad) * halfBarWidth);
            rightEndY = this.pivotY + (Math.sin(angleRad) * halfBarWidth);
        }
        
        // Rotate bar and connection dots
        this.seesawGroup.setAttribute('transform', 
            `translate(${this.pivotX},${this.pivotY}) rotate(${actualAngle})`);
        
        // Position pans at endpoints
        if (this.leftPan) {
            this.leftPan.currentX = leftEndX;
            this.leftPan.currentY = leftEndY;
            this.leftPan.group.setAttribute('transform', `translate(${leftEndX},${leftEndY})`);
            
            this.leftPan.bounds = {
                left: leftEndX - this.leftPan.panDims.width / 2,
                right: leftEndX + this.leftPan.panDims.width / 2,
                top: leftEndY - this.leftPan.extensionHeight - this.leftPan.panDims.height,
                bottom: leftEndY - this.leftPan.extensionHeight
            };
        }
        
        if (this.rightPan) {
            this.rightPan.currentX = rightEndX;
            this.rightPan.currentY = rightEndY;
            this.rightPan.group.setAttribute('transform', `translate(${rightEndX},${rightEndY})`);
            
            this.rightPan.bounds = {
                left: rightEndX - this.rightPan.panDims.width / 2,
                right: rightEndX + this.rightPan.panDims.width / 2,
                top: rightEndY - this.rightPan.extensionHeight - this.rightPan.panDims.height,
                bottom: rightEndY - this.rightPan.extensionHeight
            };
        }
        
        return groundHit;
    }
    
    /**
     * Get weights from both pans
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
     * Clear all moveable blocks (keep seesaw)
     */
    clearMoveableBlocks() {
        // Clear blocks from main SVG
        const blocks = this.svg.querySelectorAll('.block');
        blocks.forEach(block => {
            if (!block._inPan) {
                block.remove();
            }
        });
        
        // Clear ALL blocks from pans
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
    
    /**
     * Clear everything
     */
    clearAll() {
        this.svg.innerHTML = '';
        this.blocks = [];
        this.seesawGroup = null;
        this.leftPan = null;
        this.rightPan = null;
        this.leftConnectionDot = null;
        this.rightConnectionDot = null;
    }
    
    /**
     * Destroy and cleanup
     */
    destroy() {
        this.clearAll();
    }
}
