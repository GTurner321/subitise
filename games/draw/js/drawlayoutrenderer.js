/**
 * Draw Layout Renderer - Layout and Positioning System
 * 
 * PURPOSE: Handles all game area setup, positioning, and static visual elements
 * - ButtonBar integration for game area margins and layout
 * - Reference number display (left side red number + text) with proper sizing
 * - Drawing area setup with background, shadows, and positioning
 * - Redo button creation and styling
 * - Coordinate system scaling with maintained aspect ratio (30vh width, 60vh height)
 * - Resize handling and dimension management
 * - UPDATED: Dynamic width calculation for drawing area
 * 
 * COMPANION FILES (2-part drawing system):
 * 
 * 1. drawingrenderer.js
 *    - SVG canvas creation and number outline rendering
 *    - Visual feedback systems (hints, flashing, completion effects)
 *    - Timer management and coordination with interaction handler
 *    - Integration point for complete drawing functionality
 * 
 * 2. drawinginteractionhandler.js
 *    - Mouse/touch event handling for user drawing
 *    - Point-based completion detection (90% requirement)
 *    - Canvas flooding prevention with number render area calculation
 *    - Drawing path management, undo functionality, and state tracking
 */

class DrawLayoutRenderer {
    constructor() {
        console.log('🎨 DrawLayoutRenderer initializing - handling layout and positioning');
        
        // Core elements
        this.gameArea = null;
        this.referenceContainer = null;
        this.drawingContainer = null;
        this.drawingArea = null;
        this.redoButton = null;
        
        // Layout state
        this.gameAreaDimensions = null;
        this.currentNumber = null;
        this.isReady = false;
        
        // Responsive handling
        this.resizeObserver = null;
        this.buttonBarReady = false;
        
        // Drawing area bounds (percentages of game area) - UPDATED for dynamic width
        this.drawingBounds = {
            x: DRAW_CONFIG.LAYOUT.DRAWING_AREA.x,
            y: DRAW_CONFIG.LAYOUT.DRAWING_AREA.y,
            width: DRAW_CONFIG.LAYOUT.DRAWING_AREA.width, // Now can be object or number
            height: DRAW_CONFIG.LAYOUT.DRAWING_AREA.height
        };
        
        // Number render bounds within drawing area - FIXED ASPECT RATIO
        this.numberBounds = {
            x: DRAW_CONFIG.LAYOUT.NUMBER_RENDER.x,
            y: DRAW_CONFIG.LAYOUT.NUMBER_RENDER.y,
            widthVh: DRAW_CONFIG.LAYOUT.NUMBER_RENDER.width, // 30vh
            heightVh: DRAW_CONFIG.LAYOUT.NUMBER_RENDER.height // 60vh
        };
        
        this.setupButtonBarIntegration();
    }
    
    /**
     * Initialize ButtonBar in game-area-only mode with margins
     */
    setupButtonBarIntegration() {
        console.log('🔗 Setting up ButtonBar integration for game area layout');
        
        // Wait for ButtonBar to be available
        const checkButtonBar = () => {
            if (window.ButtonBar && typeof window.ButtonBar.createGameAreaOnly === 'function') {
                console.log('✅ ButtonBar available, creating game area with margins');
                
                // Let ButtonBar decide margins based on screen width (0 margins on mobile)
                window.ButtonBar.createGameAreaOnly({ useMargins: true });
                
                // Register for dimension updates
                window.ButtonBar.addObserver((dimensionData) => {
                    this.handleButtonBarUpdate(dimensionData);
                });
                
                this.buttonBarReady = true;
                this.initializeLayout();
            } else {
                // Retry after short delay
                setTimeout(checkButtonBar, 50);
            }
        };
        
        checkButtonBar();
    }
    
    /**
     * Handle ButtonBar dimension updates
     */
    handleButtonBarUpdate(dimensionData) {
        console.log('📏 ButtonBar dimensions updated:', dimensionData);
        this.updateGameAreaDimensions();
        
        if (this.isReady && this.currentNumber !== null) {
            this.updateAllPositions();
        }
    }
    
    /**
     * Initialize the main layout structure
     */
    initializeLayout() {
        console.log('🏗️ Initializing game layout structure');
        
        // Find game area
        this.gameArea = document.querySelector('.game-area');
        if (!this.gameArea) {
            console.error('❌ Game area not found');
            return false;
        }
        
        // Disable right-click context menus throughout game area
        this.disableContextMenus();
        
        // Create main layout structure
        this.createLayoutStructure();
        
        // Setup resize handling
        this.setupResizeHandling();
        
        // Update dimensions
        this.updateGameAreaDimensions();
        
        this.isReady = true;
        console.log('✅ Layout initialization complete');
        return true;
    }
    
    /**
     * Disable right-click context menus throughout the game
     */
    disableContextMenus() {
        console.log('🚫 Disabling context menus for touch-friendly interaction');
        
        // Disable on game area and body
        [this.gameArea, document.body].forEach(element => {
            if (element) {
                element.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                });
                
                // Also disable drag events that might interfere
                element.addEventListener('dragstart', (e) => {
                    e.preventDefault();
                    return false;
                });
            }
        });
    }
    
    /**
     * Create the main layout structure
     */
    createLayoutStructure() {
        console.log('🏗️ Creating layout structure');
        
        // Clear existing content
        this.gameArea.innerHTML = `
            <!-- Rainbow container -->
            <div class="rainbow-container" id="rainbowContainer"></div>
            
            <!-- Reference container (left side) -->
            <div class="reference-container">
                <div class="reference-number" id="referenceNumber"></div>
                <div class="reference-text" id="referenceText"></div>
            </div>
            
            <!-- Drawing area container (right side) -->
            <div class="drawing-area-container">
                <div class="drawing-area" id="drawingArea"></div>
                <button class="redo-button" id="redoButton">
                    <i class="fas fa-undo"></i>
                </button>
            </div>
        `;
        
        // Get references to created elements
        this.referenceContainer = this.gameArea.querySelector('.reference-container');
        this.drawingContainer = this.gameArea.querySelector('.drawing-area-container');
        this.drawingArea = document.getElementById('drawingArea');
        this.redoButton = document.getElementById('redoButton');
        
        // Setup redo button
        this.setupRedoButton();
    }
    
    /**
     * Setup redo button styling and basic functionality
     */
    setupRedoButton() {
        if (!this.redoButton) return;
        
        console.log('🔄 Setting up redo button');
        
        // Add click handler (the actual undo logic will be in DrawingRenderer)
        this.redoButton.addEventListener('click', () => {
            if (window.drawingRenderer && typeof window.drawingRenderer.undoLastStroke === 'function') {
                window.drawingRenderer.undoLastStroke();
            }
        });
        
        // Add touch handler for mobile
        this.redoButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (window.drawingRenderer && typeof window.drawingRenderer.undoLastStroke === 'function') {
                window.drawingRenderer.undoLastStroke();
            }
        });
    }
    
    /**
     * Update game area dimensions and calculate layout metrics
     */
    updateGameAreaDimensions() {
        if (!this.gameArea) return;
        
        // Force reflow to get accurate dimensions
        this.gameArea.offsetHeight;
        
        const rect = this.gameArea.getBoundingClientRect();
        
        // Validate dimensions
        if (rect.width < 50 || rect.height < 50) {
            console.log('⏳ Game area dimensions not ready, retrying...');
            setTimeout(() => this.updateGameAreaDimensions(), 100);
            return;
        }
        
        this.gameAreaDimensions = {
            width: rect.width,
            height: rect.height,
            left: rect.left,
            top: rect.top
        };
        
        console.log('📏 Game area dimensions updated:', this.gameAreaDimensions);
        
        // Update CSS custom properties for responsive sizing
        document.documentElement.style.setProperty('--game-area-width', `${rect.width}px`);
        document.documentElement.style.setProperty('--game-area-height', `${rect.height}px`);
    }
    
    /**
     * Setup responsive resize handling
     */
    setupResizeHandling() {
        console.log('📱 Setting up resize handling');
        
        // Use ResizeObserver for efficient resize tracking
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                this.handleResize();
            });
            
            if (this.gameArea) {
                this.resizeObserver.observe(this.gameArea);
            }
        } else {
            // Fallback to window resize
            window.addEventListener('resize', () => {
                this.handleResize();
            });
        }
    }
    
    /**
     * Handle resize events with debouncing
     */
    handleResize() {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        this.resizeTimeout = setTimeout(() => {
            console.log('🔄 Handling resize event');
            this.updateGameAreaDimensions();
            
            if (this.isReady && this.currentNumber !== null) {
                this.updateAllPositions();
            }
        }, 100);
    }
    
    /**
     * Display a number on the left side and setup drawing area
     */
    displayNumber(number) {
        console.log(`🔢 Displaying number ${number} in layout`);
        
        if (!this.isReady || !this.gameAreaDimensions) {
            console.log('⏳ Layout not ready, deferring number display');
            setTimeout(() => this.displayNumber(number), 100);
            return false;
        }
        
        this.currentNumber = number;
        
        // Display reference number on left
        this.displayReferenceNumber(number);
        
        // Setup drawing area for this number
        this.setupDrawingAreaForNumber(number);
        
        // Update all positions
        this.updateAllPositions();
        
        console.log(`✅ Number ${number} layout complete`);
        return true;
    }
    
    /**
     * Display the reference number and text on the left side with proper sizing
     */
    displayReferenceNumber(number) {
        const referenceNumber = document.getElementById('referenceNumber');
        const referenceText = document.getElementById('referenceText');
        
        if (!referenceNumber || !referenceText) {
            console.error('❌ Reference elements not found');
            return;
        }
        
        // Set number content
        referenceNumber.textContent = number.toString();
        referenceText.textContent = DRAW_CONFIG.getNumberWord(number);
        
        console.log(`📝 Reference number ${number} (${DRAW_CONFIG.getNumberWord(number)}) displayed`);
    }
    
    /**
     * Setup the drawing area background and styling for a specific number
     */
    setupDrawingAreaForNumber(number) {
        if (!this.drawingArea) return;
        
        console.log(`🎨 Setting up drawing area for number ${number}`);
        
        // Clear any existing content
        this.drawingArea.innerHTML = '';
        
        // The actual number outline will be created by DrawingRenderer
        // This just sets up the container styling
        
        console.log(`✅ Drawing area ready for number ${number}`);
    }
    
    /**
     * Update all element positions based on current dimensions
     */
    updateAllPositions() {
        if (!this.gameAreaDimensions) return;
        
        console.log('📐 Updating all element positions');
        
        this.updateReferencePositions();
        this.updateDrawingAreaPosition();
        this.updateRedoButtonPosition();
    }
    
    /**
     * Update reference number and text positions with improved sizing
     */
    updateReferencePositions() {
        const referenceNumber = document.getElementById('referenceNumber');
        const referenceText = document.getElementById('referenceText');
        
        if (!referenceNumber || !referenceText || !this.gameAreaDimensions) return;
        
        const { width, height } = this.gameAreaDimensions;
        
        // Calculate positions
        const numberX = (width * DRAW_CONFIG.LAYOUT.REFERENCE_NUMBER.x) / 100;
        const numberY = (height * DRAW_CONFIG.LAYOUT.REFERENCE_NUMBER.y) / 100;
        const textX = (width * DRAW_CONFIG.LAYOUT.REFERENCE_TEXT.x) / 100;
        const textY = (height * DRAW_CONFIG.LAYOUT.REFERENCE_TEXT.y) / 100;
        
        // Calculate font sizes - IMPROVED SIZING
        const numberFontSize = (height * 25) / 100; // Increased from 20% to 25%
        const textFontSize = (height * 8) / 100; // Reduced from 12% to 8%
        
        // Apply positioning and styling for number
        referenceNumber.style.cssText = `
            position: absolute;
            left: ${numberX}px;
            top: ${numberY}px;
            transform: translate(-50%, -50%);
            font-size: ${numberFontSize}px;
            font-family: ${DRAW_CONFIG.STYLING.REFERENCE_FONT};
            font-weight: ${DRAW_CONFIG.STYLING.REFERENCE_FONT_WEIGHT};
            color: ${DRAW_CONFIG.STYLING.REFERENCE_COLOR};
            text-align: center;
            line-height: 1;
            z-index: 10;
            pointer-events: none;
            user-select: none;
            margin-bottom: ${height * 0.02}px;
        `;
        
        // Apply positioning and styling for text with more space above
        const adjustedTextY = textY + (height * 0.04); // Add 4% space above text
        referenceText.style.cssText = `
            position: absolute;
            left: ${textX}px;
            top: ${adjustedTextY}px;
            transform: translate(-50%, -50%);
            font-size: ${textFontSize}px;
            font-family: ${DRAW_CONFIG.STYLING.REFERENCE_FONT};
            font-weight: ${DRAW_CONFIG.STYLING.REFERENCE_FONT_WEIGHT};
            color: ${DRAW_CONFIG.STYLING.REFERENCE_COLOR};
            text-align: center;
            line-height: 1;
            z-index: 10;
            pointer-events: none;
            user-select: none;
        `;
        
        console.log(`📍 Reference elements positioned: number at (${numberX}, ${numberY}), text at (${textX}, ${adjustedTextY})`);
        console.log(`📏 Font sizes: number ${numberFontSize}px, text ${textFontSize}px`);
    }
    
    /**
     * Update drawing area position and styling - UPDATED for dynamic width
     */
    updateDrawingAreaPosition() {
        if (!this.drawingArea || !this.gameAreaDimensions) return;
        
        const { width, height } = this.gameAreaDimensions;
        
        // Calculate drawing area dimensions and position
        const areaX = (width * this.drawingBounds.x) / 100;
        const areaY = (height * this.drawingBounds.y) / 100;
        
        // UPDATED: Calculate dynamic width based on new config format
        let areaWidth;
        if (typeof this.drawingBounds.width === 'object') {
            // New dynamic calculation: basePercent of width + heightPercent of height
            const baseWidth = (width * this.drawingBounds.width.basePercent) / 100;
            const heightComponent = (height * this.drawingBounds.width.heightPercent) / 100;
            areaWidth = baseWidth + heightComponent;
            
            console.log(`📐 Dynamic width calculation: ${this.drawingBounds.width.basePercent}% of width (${baseWidth.toFixed(1)}px) + ${this.drawingBounds.width.heightPercent}% of height (${heightComponent.toFixed(1)}px) = ${areaWidth.toFixed(1)}px`);
        } else {
            // Legacy: simple percentage of width
            areaWidth = (width * this.drawingBounds.width) / 100;
            console.log(`📐 Legacy width calculation: ${this.drawingBounds.width}% of width = ${areaWidth.toFixed(1)}px`);
        }
        
        const areaHeight = (height * this.drawingBounds.height) / 100;
        
        // Apply styling with subtle shadow and semi-transparent background
        this.drawingArea.style.cssText = `
            position: absolute;
            left: ${areaX}px;
            top: ${areaY}px;
            width: ${areaWidth}px;
            height: ${areaHeight}px;
            background: ${DRAW_CONFIG.STYLING.DRAWING_AREA_BACKGROUND};
            box-shadow: ${DRAW_CONFIG.STYLING.DRAWING_AREA_SHADOW};
            border-radius: 1vh;
            z-index: 5;
            overflow: hidden;
            touch-action: none;
            user-select: none;
        `;
        
        console.log(`🎨 Drawing area positioned at (${areaX}, ${areaY}) with dynamic size ${areaWidth.toFixed(1)}×${areaHeight}px`);
    }
    
    /**
     * Update redo button position
     */
    updateRedoButtonPosition() {
        if (!this.redoButton || !this.gameAreaDimensions) return;
        
        const { width, height } = this.gameAreaDimensions;
        
        // Calculate button position and size
        const buttonX = (width * DRAW_CONFIG.LAYOUT.REDO_BUTTON.x) / 100;
        const buttonY = (height * DRAW_CONFIG.LAYOUT.REDO_BUTTON.y) / 100;
        const buttonSize = (width * DRAW_CONFIG.LAYOUT.REDO_BUTTON.size) / 100;
        
        // Apply styling similar to audio button from main.css
        this.redoButton.style.cssText = `
            position: absolute;
            left: ${buttonX}px;
            top: ${buttonY}px;
            transform: translate(-50%, -50%);
            width: ${buttonSize}px;
            height: ${buttonSize}px;
            min-width: 44px;
            min-height: 44px;
            border-radius: 50%;
            background: rgba(64, 64, 64, 0.9);
            color: white;
            border: none;
            font-size: ${buttonSize * 0.4}px;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 15;
            display: flex;
            align-items: center;
            justify-content: center;
            touch-action: manipulation;
            user-select: none;
        `;
        
        console.log(`🔄 Redo button positioned at (${buttonX}, ${buttonY}) with size ${buttonSize}px`);
    }
    
    /**
     * Get the drawing area bounds in pixels for the drawing renderer - UPDATED for dynamic width
     */
    getDrawingAreaBounds() {
        if (!this.gameAreaDimensions) return null;
        
        const { width, height } = this.gameAreaDimensions;
        
        // Calculate dynamic width
        let areaWidth;
        if (typeof this.drawingBounds.width === 'object') {
            const baseWidth = (width * this.drawingBounds.width.basePercent) / 100;
            const heightComponent = (height * this.drawingBounds.width.heightPercent) / 100;
            areaWidth = baseWidth + heightComponent;
        } else {
            areaWidth = (width * this.drawingBounds.width) / 100;
        }
        
        return {
            x: (width * this.drawingBounds.x) / 100,
            y: (height * this.drawingBounds.y) / 100,
            width: areaWidth,
            height: (height * this.drawingBounds.height) / 100
        };
    }
    
    /**
     * Get the number render bounds maintaining proper 1:2 aspect ratio (30vh:60vh)
     */
    getNumberRenderBounds() {
        if (!this.gameAreaDimensions) return null;
        
        const { width, height } = this.gameAreaDimensions;
        
        // FIXED: Calculate width from viewport height to maintain aspect ratio
        const renderHeight = (height * this.numberBounds.heightVh) / 100; // 60% of game area height
        const renderWidth = (height * this.numberBounds.widthVh) / 100; // 30% of game area HEIGHT (not width)
        
        // Position at 55% from left (maintaining the x position)
        const renderX = (width * this.numberBounds.x) / 100;
        const renderY = (height * this.numberBounds.y) / 100;
        
        console.log(`📐 Number render bounds: (${renderX}, ${renderY}) ${renderWidth}×${renderHeight} - maintaining 1:2 aspect ratio`);
        
        return {
            x: renderX,
            y: renderY,
            width: renderWidth,
            height: renderHeight
        };
    }
    
    /**
     * Scale coordinates from the config coordinate system to the number render area
     */
    scaleCoordinatesForRendering(coordinates) {
        const renderBounds = this.getNumberRenderBounds();
        if (!renderBounds || !coordinates) return [];
        
        const scaleX = renderBounds.width / DRAW_CONFIG.COORDINATE_SYSTEM.ORIGINAL_WIDTH;
        const scaleY = renderBounds.height / DRAW_CONFIG.COORDINATE_SYSTEM.ORIGINAL_HEIGHT;
        
        return coordinates.map(coord => ({
            x: renderBounds.x + (coord.x * scaleX),
            y: renderBounds.y + ((DRAW_CONFIG.COORDINATE_SYSTEM.ORIGINAL_HEIGHT - coord.y) * scaleY) // Flip Y
        }));
    }
    
    /**
     * Calculate the actual bounds of a number for coverage detection
     */
    calculateNumberBounds(number) {
        const bounds = DRAW_CONFIG.calculateNumberBounds(number);
        if (!bounds) return null;
        
        const renderBounds = this.getNumberRenderBounds();
        if (!renderBounds) return null;
        
        const scaleX = renderBounds.width / DRAW_CONFIG.COORDINATE_SYSTEM.ORIGINAL_WIDTH;
        const scaleY = renderBounds.height / DRAW_CONFIG.COORDINATE_SYSTEM.ORIGINAL_HEIGHT;
        
        return {
            minX: renderBounds.x + (bounds.minX * scaleX),
            maxX: renderBounds.x + (bounds.maxX * scaleX),
            minY: renderBounds.y + ((DRAW_CONFIG.COORDINATE_SYSTEM.ORIGINAL_HEIGHT - bounds.maxY) * scaleY),
            maxY: renderBounds.y + ((DRAW_CONFIG.COORDINATE_SYSTEM.ORIGINAL_HEIGHT - bounds.minY) * scaleY)
        };
    }
    
    /**
     * Clear the current display
     */
    clear() {
        console.log('🧹 Clearing layout display');
        
        this.currentNumber = null;
        
        // Clear reference display
        const referenceNumber = document.getElementById('referenceNumber');
        const referenceText = document.getElementById('referenceText');
        
        if (referenceNumber) referenceNumber.textContent = '';
        if (referenceText) referenceText.textContent = '';
        
        // Clear drawing area
        if (this.drawingArea) {
            this.drawingArea.innerHTML = '';
        }
    }
    
    /**
     * Check if the layout is ready for use
     */
    isLayoutReady() {
        return this.isReady && this.buttonBarReady && this.gameAreaDimensions;
    }
    
    /**
     * Destroy the layout renderer and clean up resources
     */
    destroy() {
        console.log('🗑️ Destroying DrawLayoutRenderer');
        
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        
        // Remove from ButtonBar observers
        if (window.ButtonBar) {
            window.ButtonBar.removeObserver(this.handleButtonBarUpdate);
        }
        
        this.clear();
        this.isReady = false;
        
        console.log('✅ DrawLayoutRenderer destroyed');
    }
}

// Create global instance
console.log('🎨 DrawLayoutRenderer class defined, ready for instantiation');
