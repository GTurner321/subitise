/**
 * BalanceResponsiveManager - Handles responsive resizing and screen rotation
 * Maintains element positions and dimensions on viewport changes
 * Similar to stacks game responsive system, adapted for balance game
 */
class BalanceResponsiveManager {
    constructor(elementManager, gameController) {
        this.elementManager = elementManager;
        this.gameController = gameController;
        
        this.resizeTimeout = null;
        this.lastWidth = window.innerWidth;
        this.lastHeight = window.innerHeight;
        
        this.setupOrientationCheck();
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);
        
        // Initial check
        this.checkOrientation();
        
        console.log('BalanceResponsiveManager initialized');
    }
    
    /**
     * Setup orientation checking and rotation overlay
     */
    setupOrientationCheck() {
        // Create rotation overlay if it doesn't exist
        if (!document.getElementById('rotationOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'rotationOverlay';
            overlay.className = 'rotation-overlay hidden';
            overlay.innerHTML = `
                <div class="rotation-message">
                    <i class="fas fa-mobile-alt"></i>
                    <p>Please rotate your device to landscape mode</p>
                </div>
            `;
            document.body.appendChild(overlay);
            console.log('Rotation overlay created');
        }
    }
    
    /**
     * Check device orientation and show/hide rotation message
     */
    checkOrientation() {
        const isPortrait = window.innerHeight > window.innerWidth;
        const isMobile = window.innerWidth < 768;
        const overlay = document.getElementById('rotationOverlay');
        
        if (isPortrait && isMobile) {
            // Show rotation overlay on mobile portrait
            if (overlay) {
                overlay.classList.remove('hidden');
                console.log('Portrait mode detected - showing rotation overlay');
            }
        } else {
            // Hide rotation overlay
            if (overlay) {
                overlay.classList.add('hidden');
            }
        }
    }
    
    /**
     * Handle window resize with debouncing
     */
    handleResize() {
        // Check orientation first
        this.checkOrientation();
        
        // Debounce resize handling
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        this.resizeTimeout = setTimeout(() => {
            this.performResize();
        }, 100);
    }
    
    /**
     * Perform the actual resize operations
     */
    performResize() {
        console.log('=== RESPONSIVE RESIZE ===');
        console.log('Old dimensions:', this.lastWidth, 'x', this.lastHeight);
        console.log('New dimensions:', window.innerWidth, 'x', window.innerHeight);
        
        // Update SVG dimensions
        const svg = this.elementManager.svg;
        if (svg) {
            svg.setAttribute('width', window.innerWidth);
            svg.setAttribute('height', window.innerHeight);
        }
        
        // CRITICAL: Recalculate max ground angle for physics
        if (this.gameController && this.gameController.physics) {
            this.gameController.physics.recalculateMaxGroundAngle();
        }
        
        // Update all element positions based on viewport width changes
        this.updateAllElementPositions();
        
        this.lastWidth = window.innerWidth;
        this.lastHeight = window.innerHeight;
        
        console.log('=== RESIZE COMPLETE ===');
    }
    
    /**
     * Update all element positions to maintain percentage-based layout
     */
    updateAllElementPositions() {
        console.log('Updating all element positions for new viewport');
        
        // Update blocks
        this.updateAllBlocks();
        
        // Update seesaw system
        this.updateSeesawSystem();
        
        // Update pivot
        this.updatePivot();
    }
    
    /**
     * Update all blocks to maintain their percentage positions
     */
    updateAllBlocks() {
        const blocks = this.elementManager.svg.querySelectorAll('.block');
        let groundBlocksUpdated = 0;
        let panBlocksUpdated = 0;
        
        blocks.forEach(block => {
            if (block._inPan) {
                // Block in pan - update via pan system
                const pan = block._inPan;
                const localX = parseFloat(block.getAttribute('data-local-x') || 0);
                const localY = parseFloat(block.getAttribute('data-local-y') || 0);
                
                // Recalculate dimensions
                const blockDims = getBlockDimensions();
                block._dimensions = blockDims;
                
                // Update visual position
                this.elementManager.updateBlockInPan(block, pan, localX, localY);
                panBlocksUpdated++;
            } else if (block._xPercent !== undefined && block._yPercent !== undefined) {
                // Ground block - use stored percentage coordinates
                const newX = vwToPx(block._xPercent);
                const newY = vhToPx(block._yPercent);
                
                // Recalculate dimensions based on new viewport
                const blockDims = getBlockDimensions();
                block._dimensions = blockDims;
                
                // Update position
                this.elementManager.updateBlockPosition(block, newX, newY);
                groundBlocksUpdated++;
            }
        });
        
        console.log(`Updated ${groundBlocksUpdated} ground blocks and ${panBlocksUpdated} pan blocks`);
    }
    
    /**
     * Update seesaw system (bar, pans, pivot)
     */
    updateSeesawSystem() {
        if (!this.elementManager.seesawGroup) {
            console.log('No seesaw to update');
            return;
        }
        
        // Recalculate pivot position
        const pivotHeight = vhToPx(BALANCE_CONFIG.PIVOT_HEIGHT_PERCENT);
        const pivotX = window.innerWidth / 2;
        const pivotY = vhToPx(BALANCE_CONFIG.PIVOT_Y_PERCENT);
        
        this.elementManager.pivotX = pivotX;
        this.elementManager.pivotY = pivotY - pivotHeight;
        
        // Update bar width and thickness
        const barWidth = vwToPx(BALANCE_CONFIG.SEESAW_WIDTH_PERCENT);
        const barThickness = vhToPx(BALANCE_CONFIG.SEESAW_BAR_THICKNESS_PERCENT);
        
        this.elementManager.barWidth = barWidth;
        
        if (this.elementManager.bar) {
            this.elementManager.bar.setAttribute('x', -barWidth / 2);
            this.elementManager.bar.setAttribute('y', -barThickness / 2);
            this.elementManager.bar.setAttribute('width', barWidth);
            this.elementManager.bar.setAttribute('height', barThickness);
        }
        
        // Update connection dots
        if (this.elementManager.leftConnectionDot) {
            this.elementManager.leftConnectionDot.setAttribute('cx', -barWidth / 2);
        }
        if (this.elementManager.rightConnectionDot) {
            this.elementManager.rightConnectionDot.setAttribute('cx', barWidth / 2);
        }
        
        // Update seesaw group transform
        this.elementManager.seesawGroup.setAttribute('transform', 
            `translate(${this.elementManager.pivotX},${this.elementManager.pivotY})`);
        
        // Update pans
        this.updatePans();
        
        // Reapply current rotation angle
        if (this.gameController && this.gameController.physics) {
            const currentAngle = this.gameController.physics.getAngle();
            this.elementManager.updateSeesawRotation(currentAngle);
        }
        
        console.log('Updated seesaw system');
    }
    
    /**
     * Update pan dimensions and positions
     */
    updatePans() {
        const panDims = getPanDimensions();
        const extensionHeight = vhToPx(BALANCE_CONFIG.EXTENSION_HEIGHT_PERCENT);
        const blockHeight = getBlockDimensions().height;
        const lipHeight = blockHeight * 0.4;
        
        // Update left pan
        if (this.elementManager.leftPan) {
            this.updatePan(this.elementManager.leftPan, panDims, extensionHeight, lipHeight, blockHeight);
        }
        
        // Update right pan
        if (this.elementManager.rightPan) {
            this.updatePan(this.elementManager.rightPan, panDims, extensionHeight, lipHeight, blockHeight);
        }
        
        console.log('Updated pans');
    }
    
    /**
     * Update individual pan dimensions
     */
    updatePan(pan, panDims, extensionHeight, lipHeight, blockHeight) {
        pan.panDims = panDims;
        pan.extensionHeight = extensionHeight;
        pan.lipHeight = lipHeight;
        
        // Find and update pan elements
        const children = pan.group.children;
        
        for (let child of children) {
            if (child.tagName === 'line') {
                const x1 = parseFloat(child.getAttribute('x1'));
                const x2 = parseFloat(child.getAttribute('x2'));
                const y1 = parseFloat(child.getAttribute('y1'));
                const y2 = parseFloat(child.getAttribute('y2'));
                
                // Extension line (vertical)
                if (x1 === 0 && x2 === 0 && y1 === 0) {
                    child.setAttribute('y2', -extensionHeight);
                }
                // Pan bottom line (horizontal at top of extension)
                else if (Math.abs(y1 - (-extensionHeight)) < 1 && Math.abs(y2 - (-extensionHeight)) < 1) {
                    child.setAttribute('x1', -panDims.width / 2);
                    child.setAttribute('x2', panDims.width / 2);
                    child.setAttribute('y1', -extensionHeight);
                    child.setAttribute('y2', -extensionHeight);
                }
                // Left lip
                else if (x1 < 0 && x2 < 0) {
                    child.setAttribute('x1', -panDims.width / 2);
                    child.setAttribute('x2', -panDims.width / 2);
                    child.setAttribute('y1', -extensionHeight);
                    child.setAttribute('y2', -extensionHeight - lipHeight);
                }
                // Right lip
                else if (x1 > 0 && x2 > 0) {
                    child.setAttribute('x1', panDims.width / 2);
                    child.setAttribute('x2', panDims.width / 2);
                    child.setAttribute('y1', -extensionHeight);
                    child.setAttribute('y2', -extensionHeight - lipHeight);
                }
            }
            // Update drop zone - FIXED: Use current drop zone height (2.5 blocks)
            else if (child.classList.contains('drop-zone')) {
                const dropZoneHeight = blockHeight * 2.5;
                child.setAttribute('x', -panDims.width / 2);
                child.setAttribute('y', -extensionHeight - dropZoneHeight);
                child.setAttribute('width', panDims.width);
                child.setAttribute('height', dropZoneHeight);
            }
        }
    }
    
    /**
     * Update pivot triangle
     */
    updatePivot() {
        if (!this.elementManager.pivot) return;
        
        const pivotHeight = vhToPx(BALANCE_CONFIG.PIVOT_HEIGHT_PERCENT);
        const pivotWidth = pivotHeight * (2 / Math.sqrt(3));
        const pivotX = window.innerWidth / 2;
        const pivotY = vhToPx(BALANCE_CONFIG.PIVOT_Y_PERCENT);
        
        const points = `${pivotX},${pivotY - pivotHeight} ${pivotX - pivotWidth/2},${pivotY} ${pivotX + pivotWidth/2},${pivotY}`;
        this.elementManager.pivot.setAttribute('points', points);
        
        console.log('Updated pivot');
    }
    
    /**
     * Update block font sizes after resize
     */
    updateBlockFontSizes() {
        const blocks = this.elementManager.svg.querySelectorAll('.block');
        
        blocks.forEach(block => {
            const text = block._text;
            if (text && block._dimensions) {
                const fontSize = Math.min(
                    block._dimensions.height * 0.5, 
                    block._dimensions.width * 0.4
                ) * BALANCE_CONFIG.BLOCK_FONT_SIZE_MULTIPLIER;
                text.setAttribute('font-size', fontSize);
            }
        });
    }
    
    /**
     * Force immediate update (useful after loading or major changes)
     */
    forceUpdate() {
        console.log('Forcing responsive update');
        this.performResize();
    }
    
    /**
     * Get current viewport info
     */
    getViewportInfo() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            isPortrait: window.innerHeight > window.innerWidth,
            isMobile: window.innerWidth < 768,
            aspectRatio: window.innerWidth / window.innerHeight
        };
    }
    
    /**
     * Clean up and destroy the responsive manager
     */
    destroy() {
        window.removeEventListener('resize', this.handleResize);
        
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
        
        // Remove rotation overlay
        const overlay = document.getElementById('rotationOverlay');
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
        
        console.log('BalanceResponsiveManager destroyed');
    }
}
