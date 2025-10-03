/**
 * BalanceGameRenderer - Simplified coordinator for component managers
 * Delegates specific tasks to ElementManager, DragDropHandler, and ResponsiveManager
 * Acts as the main interface between game controller and rendering subsystems
 */
class BalanceGameRenderer {
    constructor(svg, gameController) {
        this.svg = svg;
        this.gameController = gameController;
        
        // Initialize component managers
        this.elementManager = new BalanceElementManager(svg);
        this.dragDropHandler = new BalanceDragDropHandler(svg, this.elementManager, this);
        this.responsiveManager = new BalanceResponsiveManager(this.elementManager, gameController);
        
        // Track last ground hit for physics
        this.lastGroundHit = false;
        
        console.log('BalanceGameRenderer initialized with component architecture');
    }
    
    // ===== SEESAW CREATION AND MANAGEMENT =====
    
    /**
     * Create the complete seesaw system
     */
    createSeesaw() {
        this.elementManager.createSeesaw();
        console.log('Seesaw created via ElementManager');
    }
    
    /**
     * Update seesaw rotation
     */
    updateSeesawRotation(angle) {
        const groundHit = this.elementManager.updateSeesawRotation(angle);
        this.lastGroundHit = groundHit;
        return groundHit;
    }
    
    /**
     * Get weights from both pans
     */
    getWeights() {
        return this.elementManager.getWeights();
    }
    
    // ===== BLOCK CREATION AND MANAGEMENT =====
    
    /**
     * Create a block
     */
    createBlock(number, xPercent, yPercent, color, isFixed = false) {
        return this.elementManager.createBlock(number, xPercent, yPercent, color, isFixed);
    }
    
    /**
     * Update block position
     */
    updateBlockPosition(block, x, y) {
        this.elementManager.updateBlockPosition(block, x, y);
    }
    
    /**
     * Update block position within pan
     */
    updateBlockInPan(block, pan, localX, localY) {
        this.elementManager.updateBlockInPan(block, pan, localX, localY);
    }
    
    /**
     * Create fixed block in pan (for game questions)
     */
    createFixedBlockInPan(value, side) {
        const pan = side === 'left' ? this.elementManager.leftPan : this.elementManager.rightPan;
        if (!pan) {
            console.error('Pan not found for side:', side);
            return null;
        }
        
        const blockDims = getBlockDimensions();
        
        // Place block centered horizontally, 0.5 blocks above pan line
        const localX = 0;
        const localY = -pan.extensionHeight - (blockDims.height / 2);
        
        const block = this.elementManager.createBlock(
            value,
            0, // Temporary x
            0, // Temporary y
            BALANCE_CONFIG.FIXED_BLOCK_COLOR,
            true
        );
        
        // Add to pan
        pan.blocks.push(block);
        block._inPan = pan;
        
        // Store local coordinates
        block.setAttribute('data-local-x', localX);
        block.setAttribute('data-local-y', localY);
        
        // Update block position
        this.elementManager.updateBlockInPan(block, pan, localX, localY);
        
        // Add to pan group
        pan.group.appendChild(block);
        
        console.log(`Created fixed block ${value} in ${side} pan`);
        return block;
    }
    
    /**
     * Clear moveable blocks (keep seesaw)
     */
    clearMoveableBlocks() {
        this.elementManager.clearMoveableBlocks();
        console.log('Cleared moveable blocks');
    }
    
    /**
     * Clear all elements
     */
    clearAll() {
        this.elementManager.clearAll();
        console.log('Cleared all elements');
    }
    
    // ===== DRAG AND DROP =====
    
    /**
     * Check if currently dragging
     */
    isDragging() {
        return this.dragDropHandler.isDraggingBlock();
    }
    
    /**
     * Get currently dragged block
     */
    getDraggedBlock() {
        return this.dragDropHandler.getDraggedBlock();
    }
    
    /**
     * Get all blocks in pans
     */
    getPanBlocks() {
        return this.dragDropHandler.getPanBlocks();
    }
    
    /**
     * Get all blocks on ground
     */
    getGroundBlocks() {
        return this.dragDropHandler.getGroundBlocks();
    }
    
    // ===== GAME CALLBACKS =====
    
    /**
     * Called when a block is moved (by drag/drop handler)
     */
    onBlockMoved() {
        // Notify game controller
        if (this.gameController && this.gameController.onBlockMoved) {
            this.gameController.onBlockMoved();
        }
    }
    
    // ===== RESPONSIVE HANDLING =====
    
    /**
     * Handle resize events
     */
    handleResize() {
        // Handled automatically by ResponsiveManager
        console.log('Resize event - ResponsiveManager handling');
    }
    
    /**
     * Force responsive update
     */
    forceResponsiveUpdate() {
        this.responsiveManager.forceUpdate();
    }
    
    /**
     * Get viewport information
     */
    getViewportInfo() {
        return this.responsiveManager.getViewportInfo();
    }
    
    // ===== PROPERTY ACCESS =====
    
    /**
     * Get left pan reference
     */
    get leftPan() {
        return this.elementManager.leftPan;
    }
    
    /**
     * Get right pan reference
     */
    get rightPan() {
        return this.elementManager.rightPan;
    }
    
    /**
     * Get seesaw group reference
     */
    get seesawGroup() {
        return this.elementManager.seesawGroup;
    }
    
    /**
     * Get pivot reference
     */
    get pivot() {
        return this.elementManager.pivot;
    }
    
    /**
     * Get bar reference
     */
    get bar() {
        return this.elementManager.bar;
    }
    
    /**
     * Get all blocks array
     */
    get blocks() {
        return this.elementManager.blocks;
    }
    
    // ===== UTILITY METHODS =====
    
    /**
     * Find block at point (useful for debugging)
     */
    findBlockAtPoint(point) {
        return this.dragDropHandler.findBlockAtPoint(point);
    }
    
    /**
     * Get all blocks in the game
     */
    getAllBlocks() {
        return Array.from(this.svg.querySelectorAll('.block'));
    }
    
    /**
     * Get game statistics
     */
    getGameStats() {
        const allBlocks = this.getAllBlocks();
        const panBlocks = this.getPanBlocks();
        const groundBlocks = this.getGroundBlocks();
        const weights = this.getWeights();
        
        return {
            totalBlocks: allBlocks.length,
            panBlocks: panBlocks.length,
            groundBlocks: groundBlocks.length,
            leftWeight: weights.left,
            rightWeight: weights.right,
            isDragging: this.isDragging(),
            viewport: this.getViewportInfo()
        };
    }
    
    /**
     * Debug: Log current game state
     */
    debugGameState() {
        const stats = this.getGameStats();
        console.log('=== GAME STATE DEBUG ===');
        console.log('Total blocks:', stats.totalBlocks);
        console.log('Pan blocks:', stats.panBlocks);
        console.log('Ground blocks:', stats.groundBlocks);
        console.log('Left weight:', stats.leftWeight);
        console.log('Right weight:', stats.rightWeight);
        console.log('Is dragging:', stats.isDragging);
        console.log('Viewport:', stats.viewport);
        console.log('=== END DEBUG ===');
    }
    
    /**
     * Clean up and destroy all managers
     */
    destroy() {
        console.log('Destroying BalanceGameRenderer and all managers');
        
        // Destroy in reverse order of creation
        if (this.responsiveManager) {
            this.responsiveManager.destroy();
            this.responsiveManager = null;
        }
        
        if (this.dragDropHandler) {
            this.dragDropHandler.destroy();
            this.dragDropHandler = null;
        }
        
        if (this.elementManager) {
            this.elementManager.destroy();
            this.elementManager = null;
        }
        
        // Clear SVG
        if (this.svg) {
            this.svg.innerHTML = '';
        }
        
        console.log('BalanceGameRenderer destroyed');
    }
}
