/**
 * Drawing Renderer - Part 2 of 2
 * 
 * PURPOSE: Handles all user drawing interaction and feedback functionality
 * - SVG outline rendering with grey border and white fill
 * - Pulsing hint animation after 5 seconds of inactivity
 * - Mouse/touch event handling for user drawing
 * - Drawing line rendering and path management
 * - Coverage detection and completion validation
 * - Undo functionality and drawing feedback
 * - Drawing progress monitoring and hints
 * 
 * COMPANION FILE: drawlayoutrenderer.js
 * - Contains all layout setup and positioning logic
 * - Handles ButtonBar integration and responsive design
 * - Manages reference number display and drawing area setup
 * - Provides coordinate scaling and bounds calculation utilities
 */

class DrawingRenderer {
    constructor(layoutRenderer) {
        console.log('✏️ DrawingRenderer initializing - handling drawing interactions');
        
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
        this.coveredPoints = new Set();
        this.numberBounds = null;
        this.drawnBounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
        
        // Interaction state
        this.isComplete = false;
        this.hintTimer = null;
        this.lastActivityTime = Date.now();
        this.pulseAnimation = null;
        
        // Event handlers (bound for cleanup)
        this.boundHandlers = {
            startDrawing: this.startDrawing.bind(this),
            continueDrawing: this.continueDrawing.bind(this),
            stopDrawing: this.stopDrawing.bind(this),
            preventContext: this.preventContextMenu.bind(this)
        };
        
        console.log('✏️ DrawingRenderer initialized, waiting for layout');
    }
    
    /**
     * Initialize the drawing system for a specific number
     */
    initializeForNumber(number) {
        console.log(`✏️ Initializing drawing for number ${number}`);
        
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
        
        // Render number outline with new method
        this.renderNumberOutlineWithFill(number);
        
        // Setup drawing events
        this.setupDrawingEvents();
        
        // Start hint timer
        this.startHintTimer();
        
        console.log(`✅ Drawing system ready for number ${number}`);
        return true;
    }
    
    /**
     * Reset all drawing state
     */
    resetDrawingState() {
        this.isDrawing = false;
        this.currentPath = [];
        this.allPaths = [];
        this.coveredPoints.clear();
        this.drawnBounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
        this.clearHintTimer();
        this.stopPulseAnimation();
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
     * Render the number outline with grey border and white fill
     */
    renderNumberOutlineWithFill(number) {
        if (!this.outlineGroup) return;
        
        console.log(`🔤 Rendering filled outline for number ${number}`);
        
        // Clear existing outlines
        this.outlineGroup.innerHTML = '';
        
        // Get number configuration
        const numberConfig = DRAW_CONFIG.STROKE_DEFINITIONS[number];
        if (!numberConfig || !numberConfig.strokes) {
            console.error(`❌ No stroke definition for number ${number}`);
            return;
        }
        
        // Calculate outline thickness (6% of game area height)
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
        
        // Render each stroke with new fill method
        numberConfig.strokes.forEach((stroke, strokeIndex) => {
            if (stroke.coordinates) {
                const scaledCoords = this.scaleCoordinatesForSVG(stroke.coordinates, relativeNumberBounds);
                const pathData = this.createPathData(scaledCoords);
                
                // Create outline path with grey border and white fill
                const outlinePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                outlinePath.setAttribute('d', pathData);
                outlinePath.setAttribute('stroke', DRAW_CONFIG.STYLING.OUTLINE_COLOR); // Grey border
                outlinePath.setAttribute('stroke-width', outlineThickness);
                outlinePath.setAttribute('stroke-linecap', 'round');
                outlinePath.setAttribute('stroke-linejoin', 'round');
                outlinePath.setAttribute('fill', 'white'); // White fill
                outlinePath.setAttribute('class', `outline-stroke-${strokeIndex}`);
                
                // Add subtle drop shadow for depth
                outlinePath.style.filter = 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.1))';
                
                this.outlineGroup.appendChild(outlinePath);
                
                console.log(`📝 Rendered filled outline stroke ${strokeIndex} with ${scaledCoords.length} points`);
            }
        });
        
        // Store number bounds for coverage detection
        this.numberBounds = this.layoutRenderer.calculateNumberBounds(number);
        
        console.log(`✅ Number ${number} filled outline rendered with ${numberConfig.strokes.length} strokes`);
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
        if (this.isComplete) return;
        
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
        if (!this.isDrawing || this.isComplete) return;
        
        event.preventDefault();
        
        const point = this.getEventPoint(event);
        if (point) {
            this.currentPath.push(point);
            this.updateCurrentDrawingPath();
            this.checkCoverage(point);
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
     * Check coverage of drawn point against number outline
     */
    checkCoverage(point) {
        if (!this.numberBounds) return;
        
        // Get all outline coordinates for coverage checking
        const numberConfig = DRAW_CONFIG.STROKE_DEFINITIONS[this.currentNumber];
        if (!numberConfig) return;
        
        const tolerance = DRAW_CONFIG.STYLING.DRAWING_TOLERANCE;
        const drawingBounds = this.layoutRenderer.getDrawingAreaBounds();
        const numberRenderBounds = this.layoutRenderer.getNumberRenderBounds();
        
        if (!drawingBounds || !numberRenderBounds) return;
        
        // Convert point to global coordinates for comparison
        const globalPoint = {
            x: drawingBounds.x + point.x,
            y: drawingBounds.y + point.y
        };
        
        // Check against all stroke coordinates
        numberConfig.strokes.forEach((stroke, strokeIndex) => {
            if (stroke.coordinates) {
                const scaledCoords = this.layoutRenderer.scaleCoordinatesForRendering(stroke.coordinates);
                
                scaledCoords.forEach((coord, coordIndex) => {
                    const distance = Math.sqrt(
                        Math.pow(globalPoint.x - coord.x, 2) + 
                        Math.pow(globalPoint.y - coord.y, 2)
                    );
                    
                    if (distance <= tolerance) {
                        const pointKey = `${strokeIndex}-${coordIndex}`;
                        this.coveredPoints.add(pointKey);
                    }
                });
            }
        });
    }
    
    /**
     * Update drawn bounds for coverage calculation
     */
    updateDrawnBounds(point) {
        const drawingBounds = this.layoutRenderer.getDrawingAreaBounds();
        if (!drawingBounds) return;
        
        // Convert to global coordinates
        const globalX = drawingBounds.x + point.x;
        const globalY = drawingBounds.y + point.y;
        
        this.drawnBounds.minX = Math.min(this.drawnBounds.minX, globalX);
        this.drawnBounds.maxX = Math.max(this.drawnBounds.maxX, globalX);
        this.drawnBounds.minY = Math.min(this.drawnBounds.minY, globalY);
        this.drawnBounds.maxY = Math.max(this.drawnBounds.maxY, globalY);
    }
    
    /**
     * Check if the number drawing is complete
     */
    checkCompletion() {
        if (this.isComplete || !this.numberBounds) return;
        
        // Calculate coverage percentages
        const widthCoverage = this.calculateWidthCoverage();
        const heightCoverage = this.calculateHeightCoverage();
        
        console.log(`📊 Coverage: ${widthCoverage}% width, ${heightCoverage}% height`);
        
        // Check if both width and height requirements are met
        if (widthCoverage >= DRAW_CONFIG.STYLING.COVERAGE_WIDTH_REQUIRED && 
            heightCoverage >= DRAW_CONFIG.STYLING.COVERAGE_HEIGHT_REQUIRED) {
            
            this.completeNumber();
        }
    }
    
    /**
     * Calculate width coverage percentage
     */
    calculateWidthCoverage() {
        if (!this.numberBounds || this.drawnBounds.minX === Infinity) return 0;
        
        const numberWidth = this.numberBounds.maxX - this.numberBounds.minX;
        const drawnWidth = this.drawnBounds.maxX - this.drawnBounds.minX;
        
        if (numberWidth === 0) return 100;
        
        // Check if drawn area spans the required width
        const overlapLeft = Math.max(this.drawnBounds.minX, this.numberBounds.minX);
        const overlapRight = Math.min(this.drawnBounds.maxX, this.numberBounds.maxX);
        const overlapWidth = Math.max(0, overlapRight - overlapLeft);
        
        return (overlapWidth / numberWidth) * 100;
    }
    
    /**
     * Calculate height coverage percentage
     */
    calculateHeightCoverage() {
        if (!this.numberBounds || this.drawnBounds.minY === Infinity) return 0;
        
        const numberHeight = this.numberBounds.maxY - this.numberBounds.minY;
        const drawnHeight = this.drawnBounds.maxY - this.drawnBounds.minY;
        
        if (numberHeight === 0) return 100;
        
        // Check if drawn area spans the required height
        const overlapTop = Math.max(this.drawnBounds.minY, this.numberBounds.minY);
        const overlapBottom = Math.min(this.drawnBounds.maxY, this.numberBounds.maxY);
        const overlapHeight = Math.max(0, overlapBottom - overlapTop);
        
        return (overlapHeight / numberHeight) * 100;
    }
    
    /**
     * Complete the number drawing
     */
    completeNumber() {
        console.log(`🎉 Number ${this.currentNumber} completed!`);
        
        this.isComplete = true;
        this.clearHintTimer();
        this.stopPulseAnimation();
        this.removeDrawingEvents();
        
        // Trigger completion callback
        if (window.drawGameController && typeof window.drawGameController.onNumberComplete === 'function') {
            setTimeout(() => {
                window.drawGameController.onNumberComplete(this.currentNumber);
            }, DRAW_CONFIG.TIMING.COMPLETION_DELAY);
        }
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
        this.recalculateCoverage();
        
        // Reset completion state if was complete
        if (this.isComplete) {
            this.isComplete = false;
            this.setupDrawingEvents();
            this.startHintTimer();
        }
        
        this.registerActivity();
    }
    
    /**
     * Recalculate coverage from all remaining paths
     */
    recalculateCoverage() {
        this.coveredPoints.clear();
        this.drawnBounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
        
        // Recalculate coverage for all remaining paths
        this.allPaths.forEach(path => {
            path.forEach(point => {
                this.checkCoverage(point);
                this.updateDrawnBounds(point);
            });
        });
        
        console.log('🔄 Coverage recalculated');
    }
    
    /**
     * Register user activity and reset hint timer
     */
    registerActivity() {
        this.lastActivityTime = Date.now();
        this.clearHintTimer();
        this.stopPulseAnimation();
        this.startHintTimer();
    }
    
    /**
     * Start hint timer (5 seconds instead of 10)
     */
    startHintTimer() {
        if (this.isComplete) return;
        
        this.clearHintTimer();
        
        this.hintTimer = setTimeout(() => {
            this.showPulsingHint();
        }, 5000); // Changed from 10 seconds to 5 seconds
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
     * Show pulsing hint with audio
     */
    showPulsingHint() {
        if (this.isComplete) return;
        
        console.log('💡 Showing pulsing hint');
        
        // Play audio hint
        if (window.AudioSystem && window.AudioSystem.speakText) {
            const hints = DRAW_CONFIG.AUDIO.HINTS;
            const hintMessages = [
                hints.KEEP_DRAWING,
                hints.FOLLOW_OUTLINE,
                hints.TRY_DIFFERENT_PATH
            ];
            
            const randomHint = hintMessages[Math.floor(Math.random() * hintMessages.length)];
            window.AudioSystem.speakText(randomHint);
        }
        
        // Start visual pulsing animation
        this.startPulseAnimation();
    }
    
    /**
     * Start the pulsing animation (pulse twice)
     */
    startPulseAnimation() {
        if (!this.outlineGroup) return;
        
        this.stopPulseAnimation(); // Stop any existing animation
        
        const outlinePaths = this.outlineGroup.querySelectorAll('path');
        let pulseCount = 0;
        const maxPulses = 2;
        
        const doPulse = () => {
            if (pulseCount >= maxPulses || this.isComplete) {
                this.stopPulseAnimation();
                return;
            }
            
            // Pulse animation: change opacity and add glow
            outlinePaths.forEach(path => {
                // Add CSS animation class
                path.style.animation = 'pulseHint 1s ease-in-out';
                path.style.filter = 'drop-shadow(0 0 8px #FF6B6B)';
            });
            
            // Reset after pulse
            setTimeout(() => {
                outlinePaths.forEach(path => {
                    path.style.animation = '';
                    path.style.filter = 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.1))';
                });
                
                pulseCount++;
                
                // Schedule next pulse after short delay
                if (pulseCount < maxPulses) {
                    this.pulseAnimation = setTimeout(doPulse, 500);
                }
            }, 1000);
        };
        
        // Add CSS animation keyframes if not already added
        this.addPulseAnimationCSS();
        
        // Start pulsing
        doPulse();
    }
    
    /**
     * Stop the pulsing animation
     */
    stopPulseAnimation() {
        if (this.pulseAnimation) {
            clearTimeout(this.pulseAnimation);
            this.pulseAnimation = null;
        }
        
        // Reset all outline paths to normal state
        if (this.outlineGroup) {
            const outlinePaths = this.outlineGroup.querySelectorAll('path');
            outlinePaths.forEach(path => {
                path.style.animation = '';
                path.style.filter = 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.1))';
            });
        }
    }
    
    /**
     * Add CSS animation for pulsing hint
     */
    addPulseAnimationCSS() {
        // Check if animation already exists
        if (document.querySelector('#pulse-hint-animation')) return;
        
        const style = document.createElement('style');
        style.id = 'pulse-hint-animation';
        style.textContent = `
            @keyframes pulseHint {
                0%, 100% {
                    opacity: 1;
                    transform: scale(1);
                }
                50% {
                    opacity: 0.7;
                    transform: scale(1.05);
                }
            }
        `;
        
        document.head.appendChild(style);
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
        return {
            currentNumber: this.currentNumber,
            isComplete: this.isComplete,
            pathCount: this.allPaths.length,
            coveredPoints: this.coveredPoints.size,
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
        this.stopPulseAnimation();
        
        if (this.svg && this.svg.parentNode) {
            this.svg.parentNode.removeChild(this.svg);
        }
        
        // Remove animation CSS
        const animationStyle = document.querySelector('#pulse-hint-animation');
        if (animationStyle) {
            animationStyle.remove();
        }
        
        this.layoutRenderer = null;
        this.svg = null;
        this.outlineGroup = null;
        this.drawingGroup = null;
        
        console.log('✅ DrawingRenderer destroyed');
    }
}

// Export for global access
console.log('✏️ DrawingRenderer class defined, ready for instantiation');
