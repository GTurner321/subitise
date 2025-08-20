/**
 * Drawing Interaction Handler - Part 1 of 2
 * 
 * PURPOSE: Handles all user interaction, event management, and drawing mechanics
 * - Mouse/touch event handling for drawing
 * - Drawing line rendering and path management
 * - Point-based completion detection (90% requirement)
 * - Canvas flooding prevention with number render area calculation
 * - Activity tracking and user feedback systems
 * - Undo functionality and drawing state management
 * 
 * COMPANION FILE: drawingrenderer.js
 * - Contains SVG setup, number outline rendering, and visual feedback
 * - Handles timers, hints, flashing, and drawing completion
 * - Manages initialization and cleanup functionality
 */

class DrawingInteractionHandler {
    constructor(layoutRenderer) {
        console.log('🖱️ DrawingInteractionHandler initializing - user interaction and drawing logic');
        
        // Reference to layout renderer
        this.layoutRenderer = layoutRenderer;
        
        // Drawing state
        this.currentNumber = null;
        this.isDrawing = false;
        this.currentPath = [];
        this.allPaths = [];
        this.isComplete = false;
        
        // Point-based completion tracking (ONLY SUCCESS METHOD)
        this.completionPoints = [];
        this.coveredCompletionPoints = new Set();
        
        // Canvas flooding prevention (FIXED to use number render area)
        this.totalCanvasArea = 0;
        this.drawnCanvasArea = 0;
        this.canvasFloodingWarned = false;
        this.canvasResetTimer = null;
        
        // Activity tracking
        this.lastActivityTime = Date.now();
        
        // Event handlers (bound for cleanup)
        this.boundHandlers = {
            startDrawing: this.startDrawing.bind(this),
            continueDrawing: this.continueDrawing.bind(this),
            stopDrawing: this.stopDrawing.bind(this),
            preventContext: this.preventContextMenu.bind(this)
        };
        
        // SVG elements (will be set by DrawingRenderer)
        this.svg = null;
        this.drawingGroup = null;
        
        console.log('✅ DrawingInteractionHandler initialized');
    }
    
    /**
     * Set SVG references from DrawingRenderer
     */
    setSVGReferences(svg, drawingGroup) {
        this.svg = svg;
        this.drawingGroup = drawingGroup;
    }
    
    /**
     * Initialize interaction for a specific number
     */
    initializeForNumber(number) {
        console.log(`🖱️ Initializing interaction for number ${number}`);
        
        this.currentNumber = number;
        this.isComplete = false;
        this.resetInteractionState();
        
        // Initialize completion points system (ONLY SUCCESS METHOD)
        this.initializeCompletionPoints(number);
        
        // FIXED: Calculate canvas area based on NUMBER RENDER bounds
        this.calculateCanvasArea();
        
        // Setup drawing events
        this.setupDrawingEvents();
        
        // Show debug completion points if enabled
        if (window.DEBUG_SHOW_POINTS) {
            // Delay slightly to ensure SVG is ready
            setTimeout(() => {
                this.showDebugCompletionPoints();
            }, 100);
        }
        
        console.log(`✅ Interaction ready for number ${number} with ${this.completionPoints.length} completion points (90% required)`);
        return true;
    }
    
    /**
     * Initialize completion points for current number (ONLY SUCCESS METHOD)
     */
    initializeCompletionPoints(number) {
        console.log(`🎯 Initializing completion points for number ${number} - 90% coverage required`);
        
        // Get completion points from config
        const configPoints = DRAW_CONFIG.getCompletionPoints(number);
        
        if (!configPoints || configPoints.length === 0) {
            console.error(`❌ NO completion points defined for number ${number} - GAME CANNOT PROCEED`);
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
        
        console.log(`✅ Initialized ${this.completionPoints.length} completion points for number ${number} - need ${Math.ceil(this.completionPoints.length * 0.9)} points (90%)`);
        
        // Debug: Log point positions if debug mode enabled
        if (DRAW_CONFIG.DEBUG_MODE) {
            console.log('🔍 Completion points:', this.completionPoints);
        }
    }
    
    /**
     * DEBUG: Show completion points as visible dots for testing
     */
    showDebugCompletionPoints() {
        if (!DRAW_CONFIG.DEBUG_MODE && !window.DEBUG_SHOW_POINTS) return;
        
        console.log(`🔍 Showing ${this.completionPoints.length} debug completion points`);
        
        // Remove existing debug dots
        const existingDots = this.drawingGroup.querySelectorAll('.debug-completion-point');
        existingDots.forEach(dot => dot.remove());
        
        // Create debug dots for each completion point
        this.completionPoints.forEach((point, index) => {
            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot.setAttribute('cx', point.x);
            dot.setAttribute('cy', point.y);
            dot.setAttribute('r', 3); // Small radius for visibility
            dot.setAttribute('fill', 'red');
            dot.setAttribute('stroke', 'white');
            dot.setAttribute('stroke-width', 1);
            dot.setAttribute('class', 'debug-completion-point');
            dot.setAttribute('data-point-id', point.id);
            
            // Add to drawing group so it's visible
            this.drawingGroup.appendChild(dot);
        });
        
        console.log(`✅ Debug completion points displayed as red dots`);
    }
    
    /**
     * Scale completion points from config coordinates to SVG coordinates
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
     * FIXED: Calculate canvas area based on NUMBER RENDER bounds (not full drawing area)
     */
    calculateCanvasArea() {
        // Use the number render bounds (where the actual number outline is) instead of full drawing area
        const numberBounds = this.layoutRenderer.getNumberRenderBounds();
        if (numberBounds) {
            this.totalCanvasArea = numberBounds.width * numberBounds.height;
            this.drawnCanvasArea = 0;
            console.log(`📏 Canvas area calculated from number render bounds: ${this.totalCanvasArea.toFixed(0)}px² for flooding detection`);
            console.log(`📐 Number render area: ${numberBounds.width.toFixed(1)}×${numberBounds.height.toFixed(1)}px`);
        } else {
            console.warn('⚠️ Could not get number render bounds for canvas area calculation');
            this.totalCanvasArea = 0;
        }
    }
    
    /**
     * Reset all interaction state
     */
    resetInteractionState() {
        this.isDrawing = false;
        this.currentPath = [];
        this.allPaths = [];
        
        // Reset completion tracking
        this.completionPoints = [];
        this.coveredCompletionPoints.clear();
        this.drawnCanvasArea = 0;
        this.canvasFloodingWarned = false;
        this.clearCanvasResetTimer();
        
        this.lastActivityTime = Date.now();
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
            
            // CRITICAL: Check completion points coverage with line thickness
            this.checkCompletionPointsCoverage(point);
            
            // FIXED: Check canvas flooding using number render area
            this.checkCanvasFlooding(point);
            
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
        
        // CRITICAL: Check if number is complete (ONLY METHOD)
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
        
        // Calculate line thickness as % of game area height
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
     * Check coverage of completion points with line thickness AND visual feedback
     */
    checkCompletionPointsCoverage(drawnPoint) {
        if (!this.completionPoints || this.completionPoints.length === 0) return;
        
        // Calculate line thickness as % of game area height (same as drawing line)
        const lineThickness = (this.layoutRenderer.gameAreaDimensions.height * DRAW_CONFIG.STYLING.DRAWING_LINE_THICKNESS) / 100;
        
        // Use line radius (half thickness) as tolerance - this ensures the thick line overlaps the point
        const tolerance = lineThickness / 2;
        
        this.completionPoints.forEach(completionPoint => {
            const distance = Math.sqrt(
                Math.pow(drawnPoint.x - completionPoint.x, 2) + 
                Math.pow(drawnPoint.y - completionPoint.y, 2)
            );
            
            // Point is covered if ANY part of the thick line touches it
            if (distance <= tolerance) {
                if (!this.coveredCompletionPoints.has(completionPoint.id)) {
                    console.log(`🎯 Completion point ${completionPoint.id} covered! (${this.coveredCompletionPoints.size + 1}/${this.completionPoints.length})`);
                    
                    // DEBUG: Change dot color when covered
                    if (DRAW_CONFIG.DEBUG_MODE || window.DEBUG_SHOW_POINTS) {
                        const debugDot = this.drawingGroup.querySelector(`[data-point-id="${completionPoint.id}"]`);
                        if (debugDot) {
                            debugDot.setAttribute('fill', 'green');
                            debugDot.setAttribute('r', 4); // Slightly larger when covered
                        }
                    }
                }
                this.coveredCompletionPoints.add(completionPoint.id);
            }
        });
    }
    
    /**
     * TEMPORARILY DISABLED: Check canvas flooding using number render area coordinates
     * Canvas flooding prevention is disabled for testing - drawing is unlimited
     */
    checkCanvasFlooding(point) {
        // TEMPORARILY DISABLED - return early to allow unlimited drawing
        console.log('🚫 Canvas flooding check DISABLED for testing');
        return;
        
        // Original code commented out but preserved:
        /*
        if (this.canvasFloodingWarned || !this.totalCanvasArea) return;
        
        // Get number render bounds to check if point is actually within the number area
        const numberBounds = this.layoutRenderer.getNumberRenderBounds();
        const drawingBounds = this.layoutRenderer.getDrawingAreaBounds();
        
        if (!numberBounds || !drawingBounds) return;
        
        // Convert to relative coordinates within drawing area
        const relativeNumberBounds = {
            x: numberBounds.x - drawingBounds.x,
            y: numberBounds.y - drawingBounds.y,
            width: numberBounds.width,
            height: numberBounds.height
        };
        
        // Only count area if the point is within the number render bounds
        const pointInNumberArea = (
            point.x >= relativeNumberBounds.x && 
            point.x <= relativeNumberBounds.x + relativeNumberBounds.width &&
            point.y >= relativeNumberBounds.y && 
            point.y <= relativeNumberBounds.y + relativeNumberBounds.height
        );
        
        if (pointInNumberArea) {
            // Calculate area contribution only for points within the number area
            const lineThickness = (this.layoutRenderer.gameAreaDimensions.height * DRAW_CONFIG.STYLING.DRAWING_LINE_THICKNESS) / 100;
            const pointArea = Math.PI * Math.pow(lineThickness / 2, 2); // Circle area for line cap
            
            this.drawnCanvasArea += pointArea;
            
            // Check if coverage exceeds maximum allowed (should now actually be ~30% of the smaller number area)
            const coveragePercentage = (this.drawnCanvasArea / this.totalCanvasArea) * 100;
            
            if (coveragePercentage > DRAW_CONFIG.STYLING.MAX_CANVAS_COVERAGE) {
                console.warn(`🚨 Canvas flooding detected: ${coveragePercentage.toFixed(1)}% coverage of number render area`);
                this.triggerCanvasFloodingWarning();
            }
        }
        */
    }
    
    /**
     * FIXED: Point-based completion checking with relaxed 90% requirement (18/20 points)
     */
    checkCompletion() {
        if (this.isComplete || this.canvasFloodingWarned) return;
        
        // ONLY use point-based completion - NO fallbacks
        if (this.completionPoints.length === 0) {
            console.error('❌ No completion points available - cannot complete number');
            return;
        }
        
        const totalPoints = this.completionPoints.length;
        const coveredPoints = this.coveredCompletionPoints.size;
        const coverage = totalPoints > 0 ? (coveredPoints / totalPoints) * 100 : 0;
        
        console.log(`🎯 Point coverage: ${coveredPoints}/${totalPoints} (${coverage.toFixed(1)}%)`);
        
        // FIXED: Require 90% of completion points to be covered (18/20 instead of 20/20)
        const requiredCoverage = 90; // Changed from 100% to 90%
        
        if (coverage >= requiredCoverage) {
            console.log(`✅ Point-based completion achieved: ${coveredPoints}/${totalPoints} points covered (${coverage.toFixed(1)}% >= ${requiredCoverage}%)!`);
            this.completeNumber();
        } else {
            const pointsNeeded = Math.ceil((requiredCoverage / 100) * totalPoints) - coveredPoints;
            console.log(`🎯 Need ${pointsNeeded} more points for completion (${requiredCoverage}% requirement)`);
        }
    }
    
    /**
     * Complete the number drawing - notify parent renderer
     */
    completeNumber() {
        console.log(`🎉 Number ${this.currentNumber} completed via POINT-BASED completion with 90% requirement!`);
        
        this.isComplete = true;
        this.removeDrawingEvents();
        
        // Notify parent renderer of completion
        if (this.onCompletionCallback) {
            this.onCompletionCallback(this.currentNumber);
        }
    }
    
    /**
     * Set completion callback for parent renderer
     */
    setCompletionCallback(callback) {
        this.onCompletionCallback = callback;
    }
    
    /**
     * Trigger canvas flooding warning and auto-reset
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
     * Reset canvas due to flooding (same as undo all)
     */
    resetCanvas() {
        console.log('🧹 Resetting canvas (flooding prevention)');
        
        // Clear all drawing state
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
        
        // Re-enable drawing
        this.setupDrawingEvents();
        
        // Notify parent renderer to restart timers
        if (this.onResetCallback) {
            this.onResetCallback();
        }
        
        console.log('✅ Canvas reset complete');
    }
    
    /**
     * Set reset callback for parent renderer
     */
    setResetCallback(callback) {
        this.onResetCallback = callback;
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
        this.recalculatePointCoverage();
        
        // Reset completion state if was complete
        if (this.isComplete) {
            this.isComplete = false;
            this.setupDrawingEvents();
            
            // Notify parent renderer to restart timers
            if (this.onResetCallback) {
                this.onResetCallback();
            }
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
     * Recalculate point coverage from all remaining paths
     */
    recalculatePointCoverage() {
        console.log('🔄 Recalculating point coverage');
        
        // Reset all tracking
        this.coveredCompletionPoints.clear();
        this.drawnCanvasArea = 0;
        
        // Recalculate from all remaining paths
        this.allPaths.forEach(path => {
            path.forEach(point => {
                // Check completion points
                this.checkCompletionPointsCoverage(point);
                
                // Update canvas area (simplified calculation)
                const lineThickness = (this.layoutRenderer.gameAreaDimensions.height * DRAW_CONFIG.STYLING.DRAWING_LINE_THICKNESS) / 100;
                const pointArea = Math.PI * Math.pow(lineThickness / 2, 2);
                this.drawnCanvasArea += pointArea;
            });
        });
        
        console.log(`📊 Recalculated: ${this.coveredCompletionPoints.size}/${this.completionPoints.length} points, ${(this.drawnCanvasArea / this.totalCanvasArea * 100).toFixed(1)}% canvas`);
    }
    
    /**
     * Register user activity
     */
    registerActivity() {
        this.lastActivityTime = Date.now();
        
        // Notify parent renderer of activity
        if (this.onActivityCallback) {
            this.onActivityCallback();
        }
    }
    
    /**
     * Set activity callback for parent renderer
     */
    setActivityCallback(callback) {
        this.onActivityCallback = callback;
    }
    
    /**
     * Clear canvas reset timer
     */
    clearCanvasResetTimer() {
        if (this.canvasResetTimer) {
            clearTimeout(this.canvasResetTimer);
            this.canvasResetTimer = null;
        }
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
        
        const requiredPoints = Math.ceil(this.completionPoints.length * 0.9); // 90% requirement
        
        return {
            currentNumber: this.currentNumber,
            isComplete: this.isComplete,
            pathCount: this.allPaths.length,
            
            // Point-based progress (ONLY SUCCESS METHOD)
            completionPoints: this.completionPoints.length,
            coveredPoints: this.coveredCompletionPoints.size,
            requiredPoints: requiredPoints,
            pointCoverage: pointCoverage,
            completionRequirement: '90%', // Document the relaxed requirement
            
            // Canvas flooding tracking (now uses number render area)
            canvasCoverage: canvasCoverage,
            canvasFloodingWarned: this.canvasFloodingWarned,
            canvasAreaType: 'number_render_bounds' // Document which area is being measured
        };
    }
    
    /**
     * Clear all interaction state
     */
    clear() {
        console.log('🧹 Clearing all interaction state');
        
        this.resetInteractionState();
        this.removeDrawingEvents();
        
        // Clear drawn paths from SVG
        if (this.drawingGroup) {
            this.drawingGroup.innerHTML = '';
        }
    }
    
    /**
     * Destroy the interaction handler and clean up
     */
    destroy() {
        console.log('🗑️ Destroying DrawingInteractionHandler');
        
        this.clear();
        this.clearCanvasResetTimer();
        
        this.layoutRenderer = null;
        this.svg = null;
        this.drawingGroup = null;
        
        console.log('✅ DrawingInteractionHandler destroyed');
    }
}

// Export for global access
console.log('🖱️ DrawingInteractionHandler class defined - user interaction and drawing logic');
