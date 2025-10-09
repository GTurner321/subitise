/**
 * BalanceElementManager - Handles creation and management of SVG elements
 * Creates seesaw, pans, blocks, drop zones, and manages their visual updates
 * UPDATED: All shadows behind all blocks, bar end shadows on ground contact, fixed z-ordering
 */
class BalanceElementManager {
    constructor(svg) {
        this.svg = svg;
        
        // SVG layers for proper z-ordering
        this.shadowLayer = null; // NEW: Dedicated layer for all shadows
        this.blockLayer = null;  // NEW: Layer for all blocks
        
        // SVG elements
        this.seesawGroup = null;
        this.pivot = null;
        this.pivotShadow = null;
        this.bar = null;
        this.leftPan = null;
        this.rightPan = null;
        this.leftConnectionDot = null;
        this.rightConnectionDot = null;
        this.leftExtension = null;
        this.rightExtension = null;
        this.leftBarEndShadow = null;  // NEW: Bar end shadow
        this.rightBarEndShadow = null; // NEW: Bar end shadow
        this.blocks = [];
        
        // Success glow elements
        this.successGlowGroup = null;
        
        // Store pivot position for calculations
        this.pivotX = 0;
        this.pivotY = 0;
        this.barWidth = 0;
        
        // Initialize layers
        this.createLayers();
    }
    
    /**
     * Create layered SVG structure for proper z-ordering
     * NEW: Shadow layer behind everything, then blocks on top
     */
    createLayers() {
        // Shadow layer (bottom - all shadows here)
        this.shadowLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.shadowLayer.setAttribute('class', 'shadow-layer');
        this.svg.appendChild(this.shadowLayer);
        
        // Block layer (top - all blocks here)
        this.blockLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.blockLayer.setAttribute('class', 'block-layer');
        this.svg.appendChild(this.blockLayer);
        
        console.log('SVG layers created: shadows → blocks');
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
        
        // Pivot shadow in shadow layer
        this.pivotShadow = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        this.pivotShadow.setAttribute('cx', pivotX);
        this.pivotShadow.setAttribute('cy', pivotY + 2);
        this.pivotShadow.setAttribute('rx', pivotWidth/2 * 1.2);
        this.pivotShadow.setAttribute('ry', pivotHeight/4);
        this.pivotShadow.setAttribute('fill', 'rgba(0,0,0,0.2)');
        this.pivotShadow.style.filter = 'blur(2px)';
        this.shadowLayer.appendChild(this.pivotShadow);
        
        // Pivot triangle in block layer
        this.pivot = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const points = `${pivotX},${pivotY - pivotHeight} ${pivotX - pivotWidth/2},${pivotY} ${pivotX + pivotWidth/2},${pivotY}`;
        this.pivot.setAttribute('points', points);
        this.pivot.setAttribute('fill', BALANCE_CONFIG.PIVOT_COLOR);
        this.pivot.setAttribute('stroke', BALANCE_CONFIG.PIVOT_STROKE);
        this.pivot.setAttribute('stroke-width', '3');
        this.blockLayer.appendChild(this.pivot);
        
        this.pivotX = pivotX;
        this.pivotY = pivotY - pivotHeight;
        
        // Create bar end shadows (initially hidden, in shadow layer)
        const unitBlockWidth = getBlockDimensions(1).width;
        this.leftBarEndShadow = this.createBarEndShadow(unitBlockWidth);
        this.rightBarEndShadow = this.createBarEndShadow(unitBlockWidth);
        this.shadowLayer.appendChild(this.leftBarEndShadow);
        this.shadowLayer.appendChild(this.rightBarEndShadow);
        
        // Create seesaw group (bar + connection dots) in block layer
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
        this.blockLayer.appendChild(this.seesawGroup);
        
        // Create pans as unified units in block layer
        this.leftPan = this.createPanUnit(-barWidth / 2, 'left');
        this.rightPan = this.createPanUnit(barWidth / 2, 'right');
        
        this.blockLayer.appendChild(this.leftPan.group);
        this.blockLayer.appendChild(this.rightPan.group);
        
        // Create success glow group (initially hidden, behind seesaw)
        this.createSuccessGlowGroup();
        
        console.log('Seesaw system created');
    }
    
    /**
     * Create bar end shadow
     * NEW: Shadow appears when bar end touches ground
     */
    createBarEndShadow(unitBlockWidth) {
        const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        shadow.setAttribute('rx', unitBlockWidth/2 * 1.2);
        shadow.setAttribute('ry', unitBlockWidth/4);
        shadow.setAttribute('fill', 'rgba(0,0,0,0.2)');
        shadow.style.filter = 'blur(2px)';
        shadow.style.opacity = '0';
        shadow.style.transition = 'opacity 0.3s ease';
        return shadow;
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
        const blockHeight = getBlockDimensions(1).height;
        
        // Create group for entire pan unit
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'pan-unit');
        
        // Initial position (will be updated)
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
        
        // Store extension reference
        if (side === 'left') {
            this.leftExtension = extension;
        } else {
            this.rightExtension = extension;
        }
        
        // Create drop zone
        const dropZone = this.createDropZone(panDims, extensionHeight, blockHeight);
        group.appendChild(dropZone);
        
        // Pan bottom line
        const panBottom = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        panBottom.setAttribute('x1', -panDims.width / 2);
        panBottom.setAttribute('y1', -extensionHeight);
        panBottom.setAttribute('x2', panDims.width / 2);
        panBottom.setAttribute('y2', -extensionHeight);
        panBottom.setAttribute('stroke', BALANCE_CONFIG.PAN_STROKE);
        panBottom.setAttribute('stroke-width', '3');
        group.appendChild(panBottom);
        
        // Lips
        const lipHeight = blockHeight * 0.48;
        const leftLip = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        leftLip.setAttribute('x1', -panDims.width / 2);
        leftLip.setAttribute('y1', -extensionHeight);
        leftLip.setAttribute('x2', -panDims.width / 2);
        leftLip.setAttribute('y2', -extensionHeight - lipHeight);
        leftLip.setAttribute('stroke', BALANCE_CONFIG.PAN_STROKE);
        leftLip.setAttribute('stroke-width', '3');
        group.appendChild(leftLip);
        
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
            dropZone: dropZone,
            extension: extension,
            panBottom: panBottom,
            bounds: {
                left: initialX - panDims.width / 2,
                right: initialX + panDims.width / 2,
                top: initialY - extensionHeight - panDims.height,
                bottom: initialY - extensionHeight
            }
        };
    }
    
    /**
     * Create drop zone rectangle for pan
     */
    createDropZone(panDims, extensionHeight, blockHeight) {
        const dropZone = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        dropZone.setAttribute('class', 'drop-zone');
        
        // Visual height: 3.5 blocks
        const visualHeight = vhToPx(9.6) * 3.5;
        
        dropZone.setAttribute('x', -panDims.width / 2);
        dropZone.setAttribute('y', -extensionHeight - visualHeight);
        dropZone.setAttribute('width', panDims.width);
        dropZone.setAttribute('height', visualHeight);
        dropZone.setAttribute('rx', '8');
        dropZone.setAttribute('ry', '8');
        
        // Store functional height for collision detection (5.5 blocks)
        dropZone.setAttribute('data-functional-height', blockHeight * 5.5);
        
        return dropZone;
    }
    
    /**
     * Create a game block with shadow
     * UPDATED: Shadow goes in shadow layer, block goes in block layer
     */
    createBlock(number, xPercent, yPercent, color, isFixed = false) {
        const x = vwToPx(xPercent);
        const y = vhToPx(yPercent);
        const dimensions = getBlockDimensions(number);
        
        const blockGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        blockGroup.setAttribute('class', isFixed ? 'block fixed-block' : 'block');
        blockGroup.setAttribute('data-number', number);
        blockGroup.setAttribute('data-weight', number);
        if (!isFixed) blockGroup.style.cursor = 'grab';
        
        // Shadow - created separately in shadow layer
        const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        shadow.setAttribute('class', 'block-shadow');
        shadow.setAttribute('cx', x);
        shadow.setAttribute('cy', y + dimensions.height/2 + 3);
        shadow.setAttribute('rx', dimensions.width/2 * 1.2); // 120% of block width
        shadow.setAttribute('ry', dimensions.height/4);
        shadow.setAttribute('fill', 'rgba(0,0,0,0.2)');
        shadow.style.opacity = isFixed ? '0' : '1'; // Ground blocks visible, pan blocks hidden
        shadow.style.transition = 'opacity 0.3s ease-in';
        shadow.style.filter = 'blur(2px)';
        
        // Add shadow to shadow layer
        this.shadowLayer.appendChild(shadow);
        
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
        blockGroup._dimensions = dimensions;
        blockGroup._isFixed = isFixed;
        blockGroup._inPan = null;
        blockGroup._weight = number;
        
        return blockGroup;
    }
    
    /**
     * Update block position (pixel coordinates)
     * UPDATED: Better z-ordering by base position with horizontal overlap check
     */
    updateBlockPosition(block, x, y) {
        if (block._isFixed && block._inPan) return;
        
        const dims = block._dimensions;
        
        block._rect.setAttribute('x', x - dims.width/2);
        block._rect.setAttribute('y', y - dims.height/2);
        
        block._shadow.setAttribute('cx', x);
        block._shadow.setAttribute('cy', y + dims.height/2 + 3);
        
        block._text.setAttribute('x', x);
        block._text.setAttribute('y', y);
        
        block._centerX = x;
        block._centerY = y;
        
        // Update percentage coordinates for responsive
        block._xPercent = pxToVw(x);
        block._yPercent = pxToVh(y);
        
        // Update z-ordering for ground blocks
        if (!block._inPan) {
            this.updateGroundBlockZOrdering();
        }
    }
    
    /**
     * Show shadow for a block (when it settles on ground)
     */
    showBlockShadow(block) {
        if (block._shadow && !block._inPan) {
            block._shadow.style.opacity = '1';
        }
    }
    
    /**
     * Hide shadow for a block (when picked up or in pan)
     */
    hideBlockShadow(block) {
        if (block._shadow) {
            block._shadow.style.opacity = '0';
        }
    }
    
    /**
     * Update z-ordering for ground blocks based on BASE position
     * FIXED: Only reorders blocks that actually overlap horizontally
     */
    updateGroundBlockZOrdering() {
        const groundBlocks = Array.from(this.blockLayer.querySelectorAll('.block')).filter(b => !b._inPan);
        
        // Sort by base position, but only affect overlapping blocks
        groundBlocks.sort((a, b) => {
            const aBase = a._centerY + (a._dimensions.height / 2);
            const bBase = b._centerY + (b._dimensions.height / 2);
            
            // Check for horizontal overlap
            const aLeft = a._centerX - a._dimensions.width / 2;
            const aRight = a._centerX + a._dimensions.width / 2;
            const bLeft = b._centerX - b._dimensions.width / 2;
            const bRight = b._centerX + b._dimensions.width / 2;
            
            const xOverlap = !(aRight <= bLeft || aLeft >= bRight);
            
            // Only apply z-ordering if blocks overlap horizontally
            if (xOverlap) {
                return aBase - bBase; // Lower base (higher Y) = appears in front
            }
            
            return 0; // No change if no overlap
        });
        
        // Re-append in sorted order
        groundBlocks.forEach(block => {
            this.blockLayer.appendChild(block);
        });
    }
    
    /**
     * Update block position within pan (local coordinates)
     */
    updateBlockInPan(block, pan, localX, localY) {
        const dims = block._dimensions;
        
        // Update block elements
        block._rect.setAttribute('x', localX - dims.width/2);
        block._rect.setAttribute('y', localY - dims.height/2);
        
        block._text.setAttribute('x', localX);
        block._text.setAttribute('y', localY);
        
        // Update shadow position (in global shadow layer)
        const globalX = pan.currentX + localX;
        const globalY = pan.currentY + localY;
        block._shadow.setAttribute('cx', globalX);
        block._shadow.setAttribute('cy', globalY + dims.height/2 + 3);
        
        // Remove transform from block group
        block.removeAttribute('transform');
        
        // Store the center position for reference
        block._centerX = localX;
        block._centerY = localY;
        
        // Hide shadow for blocks in pans
        this.hideBlockShadow(block);
    }
    
    /**
     * Update seesaw rotation and pan positions
     * UPDATED: Shows/hides bar end shadows when touching ground
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
        let leftTouchingGround = false;
        let rightTouchingGround = false;
        
        // Ground detection
        if (leftEndY >= grassTopY || rightEndY >= grassTopY) {
            groundHit = true;
            
            // Check which end is touching
            if (leftEndY >= grassTopY) leftTouchingGround = true;
            if (rightEndY >= grassTopY) rightTouchingGround = true;
            
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
        
        // Update bar end shadows
        if (this.leftBarEndShadow) {
            this.leftBarEndShadow.setAttribute('cx', leftEndX);
            this.leftBarEndShadow.setAttribute('cy', grassTopY + 2);
            this.leftBarEndShadow.style.opacity = leftTouchingGround ? '1' : '0';
        }
        
        if (this.rightBarEndShadow) {
            this.rightBarEndShadow.setAttribute('cx', rightEndX);
            this.rightBarEndShadow.setAttribute('cy', grassTopY + 2);
            this.rightBarEndShadow.style.opacity = rightTouchingGround ? '1' : '0';
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
     * Create success glow group for balance achievement
     */
    createSuccessGlowGroup() {
        this.successGlowGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.successGlowGroup.setAttribute('class', 'success-glow-group');
        this.successGlowGroup.style.opacity = '0';
        this.successGlowGroup.style.pointerEvents = 'none';
        
        // Insert before seesaw group so glow appears behind
        this.blockLayer.insertBefore(this.successGlowGroup, this.seesawGroup);
    }
    
    /**
     * Trigger success glow animation
     */
    flashBalanceSuccess() {
        if (!this.successGlowGroup) return;
        
        // Clear existing glow elements
        this.successGlowGroup.innerHTML = '';
        
        const elementsToGlow = [
            { element: this.pivot, type: 'polygon' },
            { element: this.bar, type: 'rect', parent: this.seesawGroup },
            { element: this.leftExtension, type: 'line', pan: this.leftPan },
            { element: this.rightExtension, type: 'line', pan: this.rightPan },
            { element: this.leftPan?.panBottom, type: 'line', pan: this.leftPan },
            { element: this.rightPan?.panBottom, type: 'line', pan: this.rightPan }
        ];
        
        elementsToGlow.forEach(({ element, type, parent, pan }) => {
            if (!element) return;
            
            // Create glow clone
            const glow = element.cloneNode(true);
            glow.removeAttribute('class');
            
            // Calculate glow width (6x original)
            let originalWidth = 4;
            if (type === 'rect') {
                originalWidth = parseFloat(element.getAttribute('height'));
            } else if (type === 'line') {
                originalWidth = parseFloat(element.getAttribute('stroke-width'));
            } else if (type === 'polygon') {
                originalWidth = parseFloat(element.getAttribute('stroke-width')) || 3;
            }
            
            const glowWidth = originalWidth * 6;
            
            // Style the glow
            glow.setAttribute('stroke', 'rgba(76, 175, 80, 0.6)');
            glow.setAttribute('fill', 'none');
            
            if (type === 'polygon') {
                glow.setAttribute('stroke-width', glowWidth);
                glow.setAttribute('stroke-linejoin', 'round');
            } else if (type === 'rect') {
                glow.setAttribute('stroke-width', glowWidth);
                glow.setAttribute('fill', 'none');
            } else if (type === 'line') {
                glow.setAttribute('stroke-width', glowWidth);
                glow.setAttribute('stroke-linecap', 'round');
            }
            
            // Apply correct transform
            if (parent === this.seesawGroup) {
                glow.setAttribute('transform', this.seesawGroup.getAttribute('transform'));
            } else if (pan) {
                glow.setAttribute('transform', pan.group.getAttribute('transform'));
            }
            
            this.successGlowGroup.appendChild(glow);
        });
        
        // Animation: fade in (0.5s) → hold (2s) → fade out (1.5s)
        this.successGlowGroup.style.transition = 'opacity 0.5s ease-in';
        this.successGlowGroup.style.opacity = '1';
        
        setTimeout(() => {
            this.successGlowGroup.style.transition = 'opacity 1.5s ease-out';
            this.successGlowGroup.style.opacity = '0';
        }, 2500);
        
        console.log('✅ Balance success glow triggered');
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
        // Clear blocks from block layer
        const blocks = this.blockLayer.querySelectorAll('.block');
        blocks.forEach(block => {
            if (!block._inPan) {
                // Also remove shadow
                if (block._shadow && block._shadow.parentNode) {
                    block._shadow.parentNode.removeChild(block._shadow);
                }
                block.remove();
            }
        });
        
        // Clear ALL blocks from pans
        if (this.leftPan) {
            this.leftPan.blocks.forEach(block => {
                // Remove shadow
                if (block._shadow && block._shadow.parentNode) {
                    block._shadow.parentNode.removeChild(block._shadow);
                }
                block.remove();
            });
            this.leftPan.blocks = [];
        }
        if (this.rightPan) {
            this.rightPan.blocks.forEach(block => {
                // Remove shadow
                if (block._shadow && block._shadow.parentNode) {
                    block._shadow.parentNode.removeChild(block._shadow);
                }
                block.remove();
            });
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
        this.leftExtension = null;
        this.rightExtension = null;
        this.pivotShadow = null;
        this.leftBarEndShadow = null;
        this.rightBarEndShadow = null;
        this.successGlowGroup = null;
        this.shadowLayer = null;
        this.blockLayer = null;
        
        // Recreate layers
        this.createLayers();
    }
    
    /**
     * Destroy and cleanup
     */
    destroy() {
        this.clearAll();
    }
}
