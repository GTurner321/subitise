/**
 * Drawing Renderer - Enhanced with Point-Based Completion System
 * 
 * PURPOSE: Handles all user drawing interaction and feedback functionality
 * - SVG outline rendering with white fill and grey outline
 * - Point-based completion detection (prevents cheating)
 * - Canvas flooding prevention with auto-reset
 * - Improved visual flash timing (8 seconds, 2 flashes in 1 second)
 * - Mouse/touch event handling for user drawing
 * - Drawing line rendering and path management
 * - Undo functionality and drawing feedback
 * - Immediate completion feedback (500ms delay)
 * 
 * COMPANION FILE: drawlayoutrenderer.js
 * - Contains all layout setup and positioning logic
 * - Handles ButtonBar integration and responsive design
 * - Manages reference number display and drawing area setup
 * - Provides coordinate scaling and bounds calculation utilities
 */

class DrawingRenderer {
    constructor(layoutRenderer) {
        console.log('✏️ DrawingRenderer initializing - enhanced point-based completion system');
        
        // Reference to layout renderer
        this.layoutRenderer = layoutRenderer;
        
        // SVG elements
        this.svg = null;
        this.outlineGroup = null;
        this.drawingGroup = null;
        
        // Drawing state
        this.currentNumber = null;
        this.isDrawing = false;
        this.currentPath = [];
        this.allPaths = [];
        
        // NEW: Point-based completion tracking
        this.completionPoints = [];
        this.coveredCompletionPoints = new Set();
        this.totalCanvasArea = 0;
        this.drawnCanvasArea = 0;
        this.canvasFloodingWarned = false;
        this.canvasResetTimer = null;
        
        // Legacy area tracking (fallback only)
        this.numberBounds = null;
        this.drawnBounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
        
        // Interaction state
        this.isComplete = false;
        this.hintTimer = null;
        this.visualFlashTimer = null;
        this.lastActivityTime = Date.now();
        
        // Event handlers (bound for cleanup)
        this.boundHandlers = {
            startDrawing: this.startDrawing.bind(this),
            continueDrawing: this.continueDrawing.bind(this),
            stopDrawing: this.stopDrawing.bind(this),
            preventContext: this.preventContextMenu.bind(this)
        };
        
        console.log('✏️ DrawingRenderer initialized with point-based completion system');
    }
    
    /**
     * Initialize the drawing system for a specific number
     */
    initializeForNumber(number) {
        console.log(`✏️ Initializing drawing for number ${number} with enhanced completion system`);
        
        if (!this.layoutRenderer || !this.layoutRenderer.isLayoutReady()) {
            console.log('⏳ Layout not ready, deferring drawing initialization');
            setTimeout(() => this.initializeForNumber(number), 100);
            return false;
        }
        
        this.currentNumber = number;
        this.isComplete = false;
        this.resetDrawingState();
        
        // Create SVG canvas
        this.createSVGCanvas();
        
        // Render number outline with white fill and grey outline
        this.renderNumberWithWhiteFillGreyOutline(number);
        
        // NEW: Initialize completion points system
        this.initializeCompletionPoints(number);
        
        // Calculate total canvas area for flooding detection
        this.calculateCanvasArea();
        
        // Setup drawing events
        this.setupDrawingEvents();
        
        // Start hint and flash timers
        this.startHintTimer();
        this.startVisualFlashTimer();
        
        console.log(`✅ Drawing system ready for number ${number} with ${this.completionPoints.length} completion points`);
        return true;
    }
    
    /**
     * NEW: Initialize completion points for current number
     */
    initializeCompletionPoints(number) {
        console.log(`🎯 Initializing completion points for number ${number}`);
        
        // Get completion points from config
        const configPoints = DRAW_CONFIG.getCompletionPoints(number);
        
        if (!configPoints) {
            console.warn(`⚠️ No completion points defined for number ${number}, using fallback area detection`);
            this.completionPoints = [];
            return;
        }
        
        // Scale completion points to match render area
        const drawingBounds = this.layoutRenderer.getDrawingAreaBounds();
        const numberBounds = this.layoutRenderer.getNumberRenderBounds();
        
        if (!drawingBounds || !numberBounds) {
            console.error('❌ Could not get drawing bounds for completion points');
            this.completionPoints = [];
            return;
        }
        
        // Convert completion points to screen coordinates
        const relativeNumberBounds = {
            x: numberBounds.x - drawingBounds.x,
            y: numberBounds.y - drawingBounds.y,
            width: numberBounds.width,
            height: numberBounds.height
        };
        
        this.completionPoints = this.scaleCompletionPointsForSVG(configPoints, relativeNumberBounds);
        this.coveredCompletionPoints.clear();
        
        console.log(`✅ Initialized ${this.completionPoints.length} completion points for number ${number}`);
        
        // Debug: Log point positions if debug mode enabled
        if (DRAW_CONFIG.DEBUG_MODE) {
            console.log('🔍 Completion points:', this.completionPoints);
        }
    }
    
    /**
     * NEW: Scale completion points from config coordinates to SVG coordinates
     */
    scaleCompletionPointsForSVG(points, bounds) {
        const scaleX = bounds.width / DRAW_CONFIG.COORDINATE_SYSTEM.ORIGINAL_WIDTH;
        const scaleY = bounds.height / DRAW_CONFIG.COORDINATE_SYSTEM.ORIGINAL_HEIGHT;
        
        return points.map((point, index) => ({
            id: `point_${index}`,
            x: bounds.x + (point.x * scaleX),
            y: bounds.y + ((DRAW_CONFIG.COORDINATE_SYSTEM.ORIGINAL_HEIGHT - point.y) * scaleY), // Flip Y
            originalX: point.x,
            originalY: point.y
        }));
    }
    
    /**
     * NEW: Calculate total canvas area for flooding detection
     */
    calculateCanvasArea() {
        const drawingBounds = this.layoutRenderer.getDrawingAreaBounds();
        if (drawingBounds) {
            this.totalCanvasArea = drawingBounds.width * drawingBounds.height;
            this.drawnCanvasArea = 0;
            console.log(`📏 Canvas area calculated: ${this.totalCanvasArea.toFixed(0)}px²`);
        }
    }
    
    /**
     * Reset all drawing state
     */
    resetDrawingState() {
        this.isDrawing = false;
        this.currentPath = [];
        this.allPaths = [];
        
        // NEW: Reset completion tracking
        this.completionPoints = [];
        this.coveredCompletionPoints.clear();
        this.drawnCanvasArea = 0;
        this.canvasFloodingWarned = false;
        this.clearCanvasResetTimer();
        
        // Legacy tracking (fallback)
        this.drawnBounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
        
        this.clearHintTimer();
        this.clearVisualFlashTimer();
        this.lastActivityTime = Date.now();
    }
    
    /**
     * Create the SVG canvas for drawing
     */
    createSVGCanvas() {
        const drawingArea = this.layoutRenderer.drawingArea;
        if (!drawingArea) {
            console.error('❌ Drawing area not found');
            return;
        }
        
        // Clear existing content
        drawingArea.innerHTML = '';
        
        // Create SVG element
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.style.cssText = `
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
            overflow: visible;
            pointer-events: auto;
            touch-action: none;
            user-select: none;
        `;
        
        // Create groups for layering
        this.outlineGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.outlineGroup.setAttribute('class', 'outline-group');
        
        this.drawingGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.drawingGroup.setAttribute('class', 'drawing-group');
        
        // Add groups to SVG (outline first, then drawing on top)
        this.svg.appendChild(this.outlineGroup);
        this.svg.appendChild(this.drawingGroup);
        
        // Add SVG to drawing area
        drawingArea.appendChild(this.svg);
        
        console.log('🎨 SVG canvas created with layered groups');
    }
    
    /**
     * Render the number with white fill and grey outline
     */
    renderNumberWithWhiteFillGreyOutline(number) {
        if (!this.outlineGroup) return;
        
        console.log(`🔤 Rendering white number with grey outline for number ${number}`);
        
        // Clear existing outlines
        this.outlineGroup.innerHTML = '';
        
        // Get number configuration
        const numberConfig = DRAW_CONFIG.STROKE_DEFINITIONS[number];
        if (!numberConfig || !numberConfig.strokes) {
            console.error(`❌ No stroke definition for number ${number}`);
            return;
        }
        
        // Calculate outline thickness
        const outlineThickness = (this.layoutRenderer.gameAreaDimensions.height * DRAW_CONFIG.STYLING.OUTLINE_THICKNESS) / 100;
        
        // Get drawing area bounds for coordinate conversion
        const drawingBounds = this.layoutRenderer.getDrawingAreaBounds();
        const numberBounds = this.layoutRenderer.getNumberRenderBounds();
        
        if (!drawingBounds || !numberBounds) {
            console.error('❌ Could not get drawing bounds');
            return;
        }
        
        // Convert coordinates relative to drawing area
        const relativeNumberBounds = {
            x: numberBounds.x - drawingBounds.x,
            y: numberBounds.y - drawingBounds.y,
            width: numberBounds.width,
            height: numberBounds.height
        };
        
        // Set SVG viewBox to match drawing area
        this.svg.setAttribute('viewBox', `0 0 ${drawingBounds.width} ${drawingBounds.height}`);
        
        // Render each stroke with layered approach: ALL grey outlines first, then ALL white fills
        const greyPaths = [];
        const whitePaths = [];
        
        // Create all grey outline paths and white fill paths
        numberConfig.strokes.forEach((stroke, strokeIndex) => {
            if (stroke.coordinates) {
                const scaledCoords = this.scaleCoordinatesForSVG(stroke.coordinates, relativeNumberBounds);
                const pathData = this.createPathData(scaledCoords);
                
                // Grey outline (thicker stroke)
                const outlinePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                outlinePath.setAttribute('d', pathData);
                outlinePath.setAttribute('stroke', DRAW_CONFIG.STYLING.OUTLINE_COLOR);
                outlinePath.setAttribute('stroke-width', outlineThickness);
                outlinePath.setAttribute('stroke-linecap', 'round');
                outlinePath.setAttribute('stroke-linejoin', 'round');
                outlinePath.setAttribute('fill', 'none');
                outlinePath.setAttribute('class', `outline-stroke-${strokeIndex}-border`);
                
                greyPaths.push(outlinePath);
                
                // White fill (thinner stroke)
                const fillPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                fillPath.setAttribute('d', pathData);
                fillPath.setAttribute('stroke', DRAW_CONFIG.STYLING.WHITE_FILL_COLOR);
                fillPath.setAttribute('stroke-width', outlineThickness * DRAW_CONFIG.STYLING.WHITE_FILL_RATIO);
                fillPath.setAttribute('stroke-linecap', 'round');
                fillPath.setAttribute('stroke-linejoin', 'round');
                fillPath.setAttribute('fill', 'none');
                fillPath.setAttribute('class', `outline-stroke-${strokeIndex}-fill`);
                
                whitePaths.push(fillPath);
                
                console.log(`📝 Prepared layered stroke ${strokeIndex}: grey outline (${outlineThickness}px) + white fill (${(outlineThickness * DRAW_CONFIG.STYLING.WHITE_FILL_RATIO).toFixed(1)}px)`);
            }
        });
        
        // Add all grey paths first, then all white paths on top
        greyPaths.forEach(path => this.outlineGroup.appendChild(path));
        whitePaths.forEach(path => this.outlineGroup.appendChild(path));
        
        // Store number bounds for legacy fallback
        this.numberBounds = this.layoutRenderer.calculateNumberBounds(number);
        
        console.log(`✅ Number ${number} rendered with white fill and grey outline using ${numberConfig.strokes.length} strokes`);
    }
    
    /**
     * Scale coordinates from config system to SVG coordinate system
     */
    scaleCoordinatesForSVG(coordinates, bounds) {
        const scaleX = bounds.width / DRAW_CONFIG.COORDINATE_SYSTEM.ORIGINAL_WIDTH;
        const scaleY = bounds.height / DRAW_CONFIG.COORDINATE_SYSTEM.ORIGINAL_HEIGHT;
        
        return coordinates.map(coord => ({
            x: bounds.x + (coord.x * scaleX),
            y: bounds.y + ((DRAW_CONFIG.COORDINATE_SYSTEM.ORIGINAL_HEIGHT - coord.y) * scaleY) // Flip Y
        }));
    }
    
    /**
     * Create SVG path data from coordinates
     */
    createPathData(coordinates) {
        if (!coordinates || coordinates.length === 0) return '';
        
        let pathData = `M ${coordinates[0].x} ${coordinates[0].y}`;
        
        for (let i = 1; i < coordinates.length; i++) {
            pathData += ` L ${coordinates[i].x} ${coordinates[i].y}`;
        }
        
        return pathData;
    }
    
    /**
     * Setup drawing event listeners
     */
    setupDrawingEvents() {
        if (!this.svg) return;
        
        console.log('🖱️ Setting up drawing event listeners');
        
        // Remove existing listeners
        this.removeDrawingEvents();
        
        // Mouse events
        this.svg.addEventListener('mousedown', this.boundHandlers.startDrawing);
        this.svg.addEventListener('mousemove', this.boundHandlers.continueDrawing);
        this.svg.addEventListener('mouseup', this.boundHandlers.stopDrawing);
        this.svg.addEventListener('mouseleave', this.boundHandlers.stopDrawing);
        
        // Touch events
        this.svg.addEventListener('touchstart', this.boundHandlers.startDrawing, { passive: false });
        this.svg.addEventListener('touchmove', this.boundHandlers.continueDrawing, { passive: false });
        this.svg.addEventListener('touchend', this.boundHandlers.stopDrawing);
        this.svg.addEventListener('touchcancel', this.boundHandlers.stopDrawing);
        
        // Prevent context menu on SVG
        this.svg.addEventListener('contextmenu', this.boundHandlers.preventContext);
        
        console.log('✅ Drawing events setup complete');
    }
    
    /**
     * Remove drawing event listeners
     */
    removeDrawingEvents() {
        if (!this.svg) return;
        
        // Mouse events
        this.svg.removeEventListener('mousedown', this.boundHandlers.startDrawing);
        this.svg.removeEventListener('mousemove', this.boundHandlers.continueDrawing);
        this.svg.removeEventListener('mouseup', this.boundHandlers.stopDrawing);
        this.svg.removeEventListener('mouseleave', this.boundHandlers.stopDrawing);
        
        // Touch events
        this.svg.removeEventListener('touchstart', this.boundHandlers.startDrawing);
        this.svg.removeEventListener('touchmove', this.boundHandlers.continueDrawing);
        this.svg.removeEventListener('touchend', this.boundHandlers.stopDrawing);
        this.svg.removeEventListener('touchcancel', this.boundHandlers.stopDrawing);
        
        // Context menu
        this.svg.removeEventListener('contextmenu', this.boundHandlers.preventContext);
    }
    
    /**
     * Prevent context menu
     */
    preventContextMenu(event) {
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
    
    /**
     * Start drawing
     */
    startDrawing(event) {
        if (this.isComplete || this.canvasFloodingWarned) return;
        
        event.preventDefault();
        this.isDrawing = true;
        this.currentPath = [];
        
        const point = this.getEventPoint(event);
        if (point) {
            this.currentPath.push(point);
            this.createNewDrawingPath();
            this.updateDrawnBounds(point);
            this.registerActivity();
        }
        
        console.log('✏️ Started drawing');
    }
    
    /**
     * Continue drawing
     */
    continueDrawing(event) {
        if (!this.isDrawing || this.isComplete || this.canvasFloodingWarned) return;
        
        event.preventDefault();
        
        const point = this.getEventPoint(event);
        if (point) {
            this.currentPath.push(point);
            this.updateCurrentDrawingPath();
            
            // NEW: Check completion points coverage
            this.checkCompletionPointsCoverage(point);
            
            // NEW: Check canvas flooding
            this.checkCanvasFlooding(point);
            
            this.updateDrawnBounds(point);
            this.registerActivity();
        }
    }
    
    /**
     * Stop drawing
     */
    stopDrawing(event) {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        
        if (this.currentPath.length > 0) {
            this.allPaths.push([...this.currentPath]);
            this.currentPath = [];
        }
        
        // Check if number is complete
        this.checkCompletion();
        
        console.log('✋ Stopped drawing');
    }
    
    /**
     * Get point coordinates from mouse/touch event
     */
    getEventPoint(event) {
        if (!this.svg) return null;
        
        const rect = this.svg.getBoundingClientRect();
        let clientX, clientY;
        
        if (event.type.startsWith('touch')) {
            if (event.touches.length === 0) return null;
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }
        
        // Convert to SVG coordinates
        const drawingBounds = this.layoutRenderer.getDrawingAreaBounds();
        if (!drawingBounds) return null;
        
        const x = ((clientX - rect.left) / rect.width) * drawingBounds.width;
        const y = ((clientY - rect.top) / rect.height) * drawingBounds.height;
        
        return { x, y };
    }
    
    /**
     * Create a new drawing path element
     */
    createNewDrawingPath() {
        if (!this.drawingGroup || this.currentPath.length === 0) return;
        
        const lineThickness = (this.layoutRenderer.gameAreaDimensions.height * DRAW_CONFIG.STYLING.DRAWING_LINE_THICKNESS) / 100;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('stroke', DRAW_CONFIG.STYLING.DRAWING_LINE_COLOR);
        path.setAttribute('stroke-width', lineThickness);
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('fill', 'none');
        path.setAttribute('class', 'user-drawing-path');
        
        this.drawingGroup.appendChild(path);
        this.updateCurrentDrawingPath();
    }
    
    /**
     * Update the current drawing path
     */
    updateCurrentDrawingPath() {
        if (!this.drawingGroup || this.currentPath.length === 0) return;
        
        const pathElement = this.drawingGroup.querySelector('.user-drawing-path:last-child');
        if (!pathElement) return;
        
        const pathData = this.createPathData(this.currentPath);
        pathElement.setAttribute('d', pathData);
    }
    
    /**
     * NEW: Check coverage of completion points
     */
    checkCompletionPointsCoverage(drawnPoint) {
        if (!this.completionPoints || this.completionPoints.length === 0) return;
        
        const tolerance = DRAW_CONFIG.STYLING.POINT_TOLERANCE;
        
        this.completionPoints.forEach(completionPoint => {
            const distance = Math.sqrt(
                Math.pow(drawnPoint.x - completionPoint.x, 2) + 
                Math.pow(drawnPoint.y - completionPoint.y, 2)
            );
            
            if (distance <= tolerance) {
                this.coveredCompletionPoints.add(completionPoint.id);
            }
        });
    }
    
    /**
     * NEW: Check if canvas is being flooded with drawing
     */
    checkCanvasFlooding(point) {
        if (this.canvasFloodingWarned || !this.totalCanvasArea) return;
        
        // Estimate drawn area by calculating area contribution of this point
        const lineThickness = (this.layoutRenderer.gameAreaDimensions.height * DRAW_CONFIG.STYLING.DRAWING_LINE_THICKNESS) / 100;
        const pointArea = Math.PI * Math.pow(lineThickness / 2, 2); // Circle area for line cap
        
        this.drawnCanvasArea += pointArea;
        
        // Check if coverage exceeds maximum allowed
        const coveragePercentage = (this.drawnCanvasArea / this.totalCanvasArea) * 100;
        
        if (coveragePercentage > DRAW_CONFIG.STYLING.MAX_CANVAS_COVERAGE) {
            console.warn(`🚨 Canvas flooding detected: ${coveragePercentage.toFixed(1)}% coverage`);
            this.triggerCanvasFloodingWarning();
        }
    }
    
    /**
     * NEW: Trigger canvas flooding warning and auto-reset
     */
    triggerCanvasFloodingWarning() {
        if (this.canvasFloodingWarned) return;
        
        this.canvasFloodingWarned = true;
        console.log('⚠️ Canvas flooding warning triggered');
        
        // Stop drawing immediately
        this.isDrawing = false;
        this.removeDrawingEvents();
        
        // Play warning audio
        if (window.AudioSystem) {
            window.AudioSystem.speakText(DRAW_CONFIG.AUDIO.WARNINGS.TOO_MUCH_AREA);
        }
        
        // Start 5-second countdown to reset
        this.canvasResetTimer = setTimeout(() => {
            console.log('🔄 Auto-resetting canvas due to flooding');
            this.resetCanvas();
        }, DRAW_CONFIG.STYLING.CANVAS_RESET_WARNING_TIME);
    }
    
    /**
     * NEW: Reset canvas due to flooding (same as undo all)
     */
    resetCanvas() {
        console.log('🧹 Resetting canvas (flooding prevention)');
        
        // Clear all drawing
        this.allPaths = [];
        this.currentPath = [];
        this.drawnCanvasArea = 0;
        this.canvasFloodingWarned = false;
        this.clearCanvasResetTimer();
        
        // Clear drawn paths from SVG
        if (this.drawingGroup) {
            this.drawingGroup.innerHTML = '';
        }
        
        // Reset completion tracking
        this.coveredCompletionPoints.clear();
        this.drawnBounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
        
        // Re-enable drawing
        this.setupDrawingEvents();
        this.startHintTimer();
        this.startVisualFlashTimer();
        
        console.log('✅ Canvas reset complete');
    }
    
    /**
     * NEW: Clear canvas reset timer
     */
    clearCanvasResetTimer() {
        if (this.canvasResetTimer) {
            clearTimeout(this.canvasResetTimer);
            this.canvasResetTimer = null;
        }
    }
    
    /**
     * NEW: Enhanced completion checking with point-based system
     */
    checkCompletion() {
        if (this.isComplete || this.canvasFloodingWarned) return;
        
        // Use point-based completion if available
        if (this.completionPoints.length > 0) {
            this.checkPointBasedCompletion();
        } else {
            // Fallback to area-based completion
            this.checkAreaBasedCompletion();
        }
    }
    
    /**
     * NEW: Point-based completion checking
     */
    checkPointBasedCompletion() {
        const totalPoints = this.completionPoints.length;
        const coveredPoints = this.coveredCompletionPoints.size;
        const coverage = totalPoints > 0 ? (coveredPoints / totalPoints) * 100 : 0;
        
        console.log(`🎯 Point coverage: ${coveredPoints}/${totalPoints} (${coverage.toFixed(1)}%)`);
        
        // Require 100% of completion points to be covered
        if (coverage >= DRAW_CONFIG.STYLING.POINT_COVERAGE_REQUIRED) {
            console.log(`✅ Point-based completion achieved: ${coverage.toFixed(1)}%`);
            this.completeNumber();
        }
    }
    
    /**
     * NEW: Fallback area-based completion (legacy method)
     */
    checkAreaBasedCompletion() {
        if (!this.numberBounds) return;
        
        const widthCoverage = this.calculateWidthCoverage();
        const heightCoverage = this.calculateHeightCoverage();
        
        console.log(`📊 Fallback area coverage: ${widthCoverage.toFixed(1)}% width, ${heightCoverage.toFixed(1)}% height`);
        
        // Relaxed completion criteria for fallback: 90% coverage required
        if (widthCoverage >= 90 && heightCoverage >= 90) {
            console.log(`✅ Area-based completion achieved: ${widthCoverage.toFixed(1)}% width, ${heightCoverage.toFixed(1)}% height`);
            this.completeNumber();
        }
    }
    
    /**
     * Calculate width coverage percentage (legacy fallback)
     */
    calculateWidthCoverage() {
        if (!this.numberBounds || this.drawnBounds.minX === Infinity) return 0;
        
        const numberWidth = this.numberBounds.maxX - this.numberBounds.minX;
        if (numberWidth === 0) return 100;
        
        const marginTolerance = numberWidth * 0.05;
        const adjustedNumberMinX = this.numberBounds.minX + marginTolerance;
        const adjustedNumberMaxX = this.numberBounds.maxX - marginTolerance;
        
        const overlapLeft = Math.max(this.drawnBounds.minX, adjustedNumberMinX);
        const overlapRight = Math.min(this.drawnBounds.maxX, adjustedNumberMaxX);
        const overlapWidth = Math.max(0, overlapRight - overlapLeft);
        const targetWidth = adjustedNumberMaxX - adjustedNumberMinX;
        
        return Math.min(100, (overlapWidth / targetWidth) * 100);
    }
    
    /**
     * Calculate height coverage percentage (legacy fallback)
     */
    calculateHeightCoverage() {
        if (!this.numberBounds || this.drawnBounds.minY === Infinity) return 0;
        
        const numberHeight = this.numberBounds.maxY - this.numberBounds.minY;
        if (numberHeight === 0) return 100;
        
        const marginTolerance = numberHeight * 0.05;
        const adjustedNumberMinY = this.numberBounds.minY + marginTolerance;
        const adjustedNumberMaxY = this.numberBounds.maxY - marginTolerance;
        
        const overlapTop = Math.max(this.drawnBounds.minY, adjustedNumberMinY);
        const overlapBottom = Math.min(this.drawnBounds.maxY, adjustedNumberMaxY);
        const overlapHeight = Math.max(0, overlapBottom - overlapTop);
        const targetHeight = adjustedNumberMaxY - adjustedNumberMinY;
        
        return Math.min(100, (overlapHeight / targetHeight) * 100);
    }
    
    /**
     * Update drawn bounds for legacy area coverage
     */
    updateDrawnBounds(point) {
        const drawingBounds = this.layoutRenderer.getDrawingAreaBounds();
        if (!drawingBounds) return;
        
        const globalX = drawingBounds.x + point.x;
        const globalY = drawingBounds.y + point.y;
        
        this.drawnBounds.minX = Math.min(this.drawnBounds.minX, globalX);
        this.drawnBounds.maxX = Math.max(this.drawnBounds.maxX, globalX);
        this.drawnBounds.minY = Math.min(this.drawnBounds.minY, globalY);
        this.drawnBounds.maxY = Math.max(this.drawnBounds.maxY, globalY);
    }
    
    /**
     * Complete the number drawing with immediate feedback
     */
    completeNumber() {
        console.log(`🎉 Number ${this.currentNumber} completed!`);
        
        this.isComplete = true;
        this.clearHintTimer();
        this.clearVisualFlashTimer();
        this.clearCanvasResetTimer();
        this.removeDrawingEvents();
        
        // NEW: Immediate completion feedback (500ms delay)
        setTimeout(() => {
            // Play completion sound effect
            if (window.AudioSystem) {
                window.AudioSystem.playCompletionSound();
            }
            
            // Trigger completion callback after admire time
            if (window.drawGameController && typeof window.drawGameController.onNumberComplete === 'function') {
                setTimeout(() => {
                    window.drawGameController.onNumberComplete(this.currentNumber);
                }, DRAW_CONFIG.TIMING.COMPLETION_ADMIRE_TIME);
            }
        }, DRAW_CONFIG.TIMING.COMPLETION_IMMEDIATE_DELAY);
    }
    
    /**
     * Undo the last drawn stroke
     */
    undoLastStroke() {
        if (this.allPaths.length === 0) {
            console.log('🚫 No strokes to undo');
            return;
        }
        
        console.log('↶ Undoing last stroke');
        
        // Remove last path from data
        this.allPaths.pop();
        
        // Remove last path from SVG
        const userPaths = this.drawingGroup.querySelectorAll('.user-drawing-path');
        if (userPaths.length > 0) {
            userPaths[userPaths.length - 1].remove();
        }
        
        // Recalculate coverage
        this.recalculateAllCoverage();
        
        // Reset completion state if was complete
        if (this.isComplete) {
            this.isComplete = false;
            this.setupDrawingEvents();
            this.startHintTimer();
            this.startVisualFlashTimer();
        }
        
        // Reset flooding warning if active
        if (this.canvasFloodingWarned) {
            this.canvasFloodingWarned = false;
            this.clearCanvasResetTimer();
            this.setupDrawingEvents();
        }
        
        this.registerActivity();
    }
    
    /**
     * NEW: Recalculate all coverage from remaining paths
     */
    recalculateAllCoverage() {
        console.log('🔄 Recalculating all coverage');
        
        // Reset all tracking
        this.coveredCompletionPoints.clear();
        this.drawnBounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
        this.drawnCanvasArea = 0;
        
        // Recalculate from all remaining paths
        this.allPaths.forEach(path => {
            path.forEach(point => {
                // Check completion points
                this.checkCompletionPointsCoverage(point);
                
                // Update area tracking
                this.updateDrawnBounds(point);
                
                // Update canvas area (simplified calculation)
                const lineThickness = (this.layoutRenderer.gameAreaDimensions.height * DRAW_CONFIG.STYLING.DRAWING_LINE_THICKNESS) / 100;
                const pointArea = Math.PI * Math.pow(lineThickness / 2, 2);
                this.drawnCanvasArea += pointArea;
            });
        });
        
        console.log(`📊 Recalculated: ${this.coveredCompletionPoints.size}/${this.completionPoints.length} points, ${(this.drawnCanvasArea / this.totalCanvasArea * 100).toFixed(1)}% canvas`);
    }
    
    /**
     * Register user activity and reset timers
     */
    registerActivity() {
        this.lastActivityTime = Date.now();
        this.clearHintTimer();
        this.clearVisualFlashTimer();
        
        // Only restart timers if not complete and not flooding warned
        if (!this.isComplete && !this.canvasFloodingWarned) {
            this.startHintTimer();
            this.startVisualFlashTimer();
        }
    }
    
    /**
     * Start hint timer (20 seconds for audio hints)
     */
    startHintTimer() {
        if (this.isComplete || this.canvasFloodingWarned) return;
        
        this.clearHintTimer();
        
        this.hintTimer = setTimeout(() => {
            this.showAudioHint();
        }, DRAW_CONFIG.TIMING.HINT_DELAY);
    }
    
    /**
     * Clear hint timer
     */
    clearHintTimer() {
        if (this.hintTimer) {
            clearTimeout(this.hintTimer);
            this.hintTimer = null;
        }
    }
    
    /**
     * Show audio hint based on drawing progress
     */
    showAudioHint() {
        if (this.isComplete || this.canvasFloodingWarned) return;
        
        console.log('💡 Showing audio hint');
        
        if (window.AudioSystem && window.AudioSystem.speakText) {
            let hintMessage;
            
            if (this.allPaths.length === 0) {
                // Nothing drawn yet
                hintMessage = DRAW_CONFIG.AUDIO.HINTS.DRAW_INSIDE;
            } else {
                // Something has been drawn
                hintMessage = DRAW_CONFIG.AUDIO.HINTS.KEEP_DRAWING_COMPLETE;
            }
            
            window.AudioSystem.speakText(hintMessage);
        }
        
        // Restart the hint timer for next hint
        this.startHintTimer();
    }
    
    /**
     * NEW: Start visual flash timer (8 seconds, improved timing)
     */
    startVisualFlashTimer() {
        if (this.isComplete || this.canvasFloodingWarned) return;
        
        this.clearVisualFlashTimer();
        
        this.visualFlashTimer = setTimeout(() => {
            this.showVisualFlash();
        }, DRAW_CONFIG.TIMING.VISUAL_FLASH_DELAY);
    }
    
    /**
     * Clear visual flash timer
     */
    clearVisualFlashTimer() {
        if (this.visualFlashTimer) {
            clearTimeout(this.visualFlashTimer);
            this.visualFlashTimer = null;
        }
    }
    
    /**
     * NEW: Enhanced visual flash (2 flashes: off-on, off-on in 1 second total)
     */
    showVisualFlash() {
        if (this.isComplete || this.canvasFloodingWarned || !this.outlineGroup) return;
        
        console.log('✨ Starting visual flash sequence - 2 flashes in 1 second');
        
        // Target ONLY the grey outline paths (not the white fill paths)
        const greyOutlinePaths = this.outlineGroup.querySelectorAll('path[class*="-border"]');
        
        console.log(`Found ${greyOutlinePaths.length} grey outline paths to flash`);
        
        if (greyOutlinePaths.length === 0) {
            console.warn('⚠️ No grey outline paths found for flashing');
            this.startVisualFlashTimer();
            return;
        }
        
        // Flash sequence: 2 complete flashes in 1 second total
        // Flash 1: off (0ms) -> on (250ms) = 250ms duration
        // Flash 2: off (500ms) -> on (750ms) = 250ms duration  
        // Final: ensure visible (1000ms)
        
        const flashSequence = [
            { time: 0, visible: false },     // Flash 1: OFF
            { time: 250, visible: true },    // Flash 1: ON
            { time: 500, visible: false },   // Flash 2: OFF
            { time: 750, visible: true },    // Flash 2: ON
            { time: 1000, visible: true }    // Ensure visible at end
        ];
        
        flashSequence.forEach(({ time, visible }) => {
            setTimeout(() => {
                if (this.isComplete || this.canvasFloodingWarned) return; // Stop if state changed
                
                greyOutlinePaths.forEach(path => {
                    path.style.opacity = visible ? '1' : '0';
                });
                
                console.log(`Flash step: ${visible ? 'ON' : 'OFF'} at ${time}ms - applied to ${greyOutlinePaths.length} grey paths`);
            }, time);
        });
        
        // Restart flash timer for next cycle after sequence completes
        setTimeout(() => {
            if (!this.isComplete && !this.canvasFloodingWarned) {
                console.log('🔄 Restarting visual flash timer');
                this.startVisualFlashTimer();
            }
        }, DRAW_CONFIG.TIMING.VISUAL_FLASH_DURATION + 200); // Small buffer after flash sequence
    }
    
    /**
     * Clear all drawing
     */
    clear() {
        console.log('🧹 Clearing all drawing');
        
        this.resetDrawingState();
        
        if (this.drawingGroup) {
            this.drawingGroup.innerHTML = '';
        }
        
        if (this.outlineGroup) {
            this.outlineGroup.innerHTML = '';
        }
        
        this.removeDrawingEvents();
    }
    
    /**
     * Get current drawing progress for debugging
     */
    getProgress() {
        const pointCoverage = this.completionPoints.length > 0 
            ? (this.coveredCompletionPoints.size / this.completionPoints.length) * 100 
            : 0;
        
        const canvasCoverage = this.totalCanvasArea > 0 
            ? (this.drawnCanvasArea / this.totalCanvasArea) * 100 
            : 0;
        
        return {
            currentNumber: this.currentNumber,
            isComplete: this.isComplete,
            pathCount: this.allPaths.length,
            
            // NEW: Point-based progress
            completionPoints: this.completionPoints.length,
            coveredPoints: this.coveredCompletionPoints.size,
            pointCoverage: pointCoverage,
            
            // NEW: Canvas flooding tracking
            canvasCoverage: canvasCoverage,
            canvasFloodingWarned: this.canvasFloodingWarned,
            
            // Legacy area coverage (fallback)
            widthCoverage: this.calculateWidthCoverage(),
            heightCoverage: this.calculateHeightCoverage()
        };
    }
    
    /**
     * Destroy the drawing renderer and clean up
     */
    destroy() {
        console.log('🗑️ Destroying DrawingRenderer');
        
        this.clear();
        this.removeDrawingEvents();
        this.clearHintTimer();
        this.clearVisualFlashTimer();
        this.clearCanvasResetTimer();
        
        if (this.svg && this.svg.parentNode) {
            this.svg.parentNode.removeChild(this.svg);
        }
        
        this.layoutRenderer = null;
        this.svg = null;
        this.outlineGroup = null;
        this.drawingGroup = null;
        
        console.log('✅ DrawingRenderer destroyed');
    }
}

// Export for global access
console.log('✏️ DrawingRenderer class defined with enhanced point-based completion system');
