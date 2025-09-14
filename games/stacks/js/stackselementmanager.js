/**
 * StacksElementManager - Handles SVG element creation and responsive positioning
 * Manages the creation of blocks, containers, and teddies, plus their responsive scaling
 */
class StacksElementManager {
    constructor(svg) {
        this.svg = svg;
        this.gravityInterval = null;
        this.resizeTimeout = null;
        
        this.updateSVGDimensions();
        this.startGravityCheck();
    }
    
    /**
     * Start gravity checking for floating blocks
     */
    startGravityCheck() {
        this.gravityInterval = setInterval(() => {
            this.checkAndApplyGravity();
        }, 3000);
    }
    
    /**
     * Check for blocks floating above grass and apply gravity
     */
    checkAndApplyGravity() {
        const groundBlocks = this.svg.querySelectorAll('.block:not(.completed-tower)');
        const grassTop = 80; // 80% from top = 20% from bottom
        
        groundBlocks.forEach(block => {
            // Skip if block is in container, being dragged, or animating
            if (block._container || 
                block._isDragging || 
                block._isLocked ||
                block.style.transition ||
                block.classList.contains('new-tower-element')) {
                return;
            }
            
            const currentYPercent = block._yPercent; // Use stored percentage
            
            // Apply gravity if block is significantly above grass area
            if (currentYPercent < grassTop - 5) {
                const grassMidY = 85; // 85% from top (middle of grass)
                this.applyGravity(block, block._xPercent, grassMidY);
            }
        });
    }
    
    /**
     * Apply gravity animation to move block to grass level
     */
    applyGravity(block, targetXPercent, targetYPercent) {
        const targetX = vwToPx(targetXPercent);
        const targetY = vhToPx(targetYPercent);
        const fallDuration = 400;
        
        // Animate the block falling to the ground
        block.style.transition = `all ${fallDuration}ms ease-out`;
        this.updateBlockPosition(block, targetX, targetY);
        
        // Clean up transition after animation
        setTimeout(() => {
            block.style.transition = '';
        }, fallDuration);
    }
    
    /**
     * Update SVG dimensions and trigger responsive updates
     */
    updateSVGDimensions() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.svg.setAttribute('width', width);
        this.svg.setAttribute('height', height);
        this.svg.removeAttribute('viewBox');
        
        // CRITICAL: Update all existing elements when dimensions change
        this.updateAllElementPositions();
    }
    
    /**
     * Handle resize events with debouncing
     */
    handleResize() {
        // Debounce resize handling
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        this.resizeTimeout = setTimeout(() => {
            this.updateSVGDimensions();
        }, 100);
    }
    
    /**
     * Update all elements to maintain their percentage positions after resize
     */
    updateAllElementPositions() {
        // Update all blocks
        const blocks = this.svg.querySelectorAll('.block');
        blocks.forEach(block => {
            if (block._xPercent !== undefined && block._yPercent !== undefined) {
                this.updateBlockPositionFromPercent(block);
            }
        });
        
        // Update all containers
        const containers = this.svg.querySelectorAll('.container');
        containers.forEach(container => {
            if (container._xPercent !== undefined && container._yPercent !== undefined) {
                this.updateContainerPositionFromPercent(container);
            }
        });
        
        // Update all teddies
        const teddies = this.svg.querySelectorAll('.teddy');
        teddies.forEach(teddy => {
            if (teddy._xPercent !== undefined && teddy._yPercent !== undefined) {
                this.updateTeddyPositionFromPercent(teddy);
            }
        });
    }
    
    /**
     * Update block position from its stored percentage coordinates
     */
    updateBlockPositionFromPercent(block) {
        const newX = vwToPx(block._xPercent);
        const newY = vhToPx(block._yPercent);
        
        // Update pixel coordinates
        block._centerX = newX;
        block._centerY = newY;
        
        // Recalculate dimensions for new screen size
        const isWide = block._isWide || false;
        block._dimensions = getBlockDimensions(isWide);
        
        // Update visual position
        this.updateBlockVisualPosition(block);
    }
    
    /**
     * Update visual position without changing stored coordinates
     */
    updateBlockVisualPosition(block) {
        const dimensions = block._dimensions;
        const centerX = block._centerX;
        const centerY = block._centerY;
        
        const rect = block._rect;
        const shadow = block._shadow;
        const text = block._text;
        
        rect.setAttribute('x', centerX - dimensions.width/2);
        rect.setAttribute('y', centerY - dimensions.height/2);
        rect.setAttribute('width', dimensions.width);
        rect.setAttribute('height', dimensions.height);
        
        shadow.setAttribute('x', centerX - dimensions.width/2 + 3);
        shadow.setAttribute('y', centerY - dimensions.height/2 + 3);
        shadow.setAttribute('width', dimensions.width);
        shadow.setAttribute('height', dimensions.height);
        
        text.setAttribute('x', centerX);
        text.setAttribute('y', centerY);
        
        // Update font size for new dimensions
        const baseFontSize = Math.min(dimensions.height * 0.5, dimensions.width * 0.4);
        const finalFontSize = block._isWide ? baseFontSize : baseFontSize * STACKS_CONFIG.BLOCK_FONT_SIZE_MULTIPLIER;
        text.setAttribute('font-size', finalFontSize);
    }
    
    /**
     * Update container position from percentage coordinates
     */
    updateContainerPositionFromPercent(container) {
        const newX = vwToPx(container._xPercent);
        const newY = vhToPx(container._yPercent);
        
        container._centerX = newX;
        container._centerY = newY;
        
        const isWide = container._isWide || false;
        const dimensions = getBlockDimensions(isWide);
        
        container.setAttribute('x', newX - dimensions.width/2);
        container.setAttribute('y', newY - dimensions.height/2);
        container.setAttribute('width', dimensions.width);
        container.setAttribute('height', dimensions.height);
    }
    
    /**
     * Update teddy position from percentage coordinates
     */
    updateTeddyPositionFromPercent(teddy) {
        const newX = vwToPx(teddy._xPercent);
        const newY = vhToPx(teddy._yPercent);
        
        teddy._centerX = newX;
        teddy._centerY = newY;
        
        // Recalculate teddy size
        const baseSize = vhToPx(STACKS_CONFIG.BLOCK_HEIGHT_PERCENT) * 0.8;
        const size = baseSize * STACKS_CONFIG.TEDDY_SIZE_MULTIPLIER;
        teddy._size = size;
        
        if (teddy.tagName === 'image') {
            // Image teddy
            teddy.setAttribute('x', newX - size/2);
            teddy.setAttribute('y', newY - size - vhToPx(STACKS_CONFIG.BLOCK_HEIGHT_PERCENT)/2);
            teddy.setAttribute('width', size);
            teddy.setAttribute('height', size);
        } else if (teddy.tagName === 'g') {
            // Fallback teddy group - update all child elements
            const children = teddy.children;
            for (let child of children) {
                if (child.tagName === 'circle') {
                    const radius = size/3;
                    child.setAttribute('cx', newX);
                    child.setAttribute('cy', newY - size/2);
                    child.setAttribute('r', radius);
                }
            }
        }
    }
    
    /**
     * Create a game block with number, position, and color
     */
    createBlock(number, xPercent, yPercent, color, isWide = false) {
        // Convert percentage coordinates to pixels
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
        
        // Store references and positions (BOTH pixels AND percentages)
        blockGroup._rect = rect;
        blockGroup._text = text;
        blockGroup._shadow = shadow;
        blockGroup._centerX = x;
        blockGroup._centerY = y;
        blockGroup._xPercent = xPercent; // KEEP percentage coordinates
        blockGroup._yPercent = yPercent;
        blockGroup._number = number;
        blockGroup._isWide = isWide;
        blockGroup._dimensions = dimensions;
        
        return blockGroup;
    }
    
    /**
     * Create a container (dashed outline for block placement)
     */
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
        container.setAttribute('opacity', STACKS_CONFIG.CONTAINER_OPACITY);
        
        // Store position data (BOTH pixels AND percentages)
        container._centerX = x;
        container._centerY = y;
        container._xPercent = xPercent; // KEEP percentage coordinates
        container._yPercent = yPercent;
        container._index = index;
        container._isWide = isWide;
        
        return container;
    }
    
    /**
     * Create a teddy bear image element
     */
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
        
        // Store position data (BOTH pixels AND percentages)
        teddy._centerX = x;
        teddy._centerY = y - size/2;
        teddy._xPercent = xPercent; // KEEP percentage coordinates
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
    
    /**
     * Create fallback teddy if image fails to load
     */
    createFallbackTeddy(teddyElement, x, y, size) {
        const parent = teddyElement.parentNode;
        if (parent) {
            parent.removeChild(teddyElement);
            
            const fallbackGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            fallbackGroup.setAttribute('class', 'teddy fallback-teddy');
            
            // Store position data (BOTH pixels AND percentages)
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
    
    /**
     * Update block position maintaining both pixel and percentage coordinates
     */
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
        
        // Update stored position (BOTH pixels AND percentages)
        block._centerX = centerX;
        block._centerY = centerY;
        block._xPercent = pxToVw(centerX);
        block._yPercent = pxToVh(centerY);
    }
    
    /**
     * Animate block to a specific position
     */
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
        this.updateBlockPosition(block, targetX, targetY); // Now stores percentages
        
        setTimeout(() => {
            block.style.transition = '';
            if (callback) callback();
        }, duration);
    }
    
    /**
     * Clear all elements marked as new tower elements
     */
    clearNewTowerElements() {
        const elements = this.svg.querySelectorAll('.new-tower-element');
        elements.forEach(element => element.remove());
    }
    
    /**
     * Clear all elements from the SVG
     */
    clearAllElements() {
        const elements = this.svg.querySelectorAll('.block, .container, .teddy');
        elements.forEach(element => element.remove());
    }
    
    /**
     * Get all blocks currently in the SVG
     */
    getAllBlocks() {
        return Array.from(this.svg.querySelectorAll('.block'));
    }
    
    /**
     * Get all containers currently in the SVG
     */
    getAllContainers() {
        return Array.from(this.svg.querySelectorAll('.container'));
    }
    
    /**
     * Get all teddies currently in the SVG
     */
    getAllTeddies() {
        return Array.from(this.svg.querySelectorAll('.teddy'));
    }
    
    /**
     * Clean up and destroy the element manager
     */
    destroy() {
        if (this.gravityInterval) {
            clearInterval(this.gravityInterval);
            this.gravityInterval = null;
        }
        
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
    }
}
