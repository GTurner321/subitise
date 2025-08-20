/**
 * Drawing Renderer - Part 2 of 2
 * 
 * PURPOSE: Handles SVG setup, number outline rendering, and visual feedback systems
 * - SVG canvas creation and number outline rendering with white fill and grey outline
 * - Visual feedback systems (hints, flashing, completion effects)
 * - Timer management for hints and visual cues
 * - Integration with DrawingInteractionHandler for complete drawing system
 * - Initialization, coordination, and cleanup functionality
 * 
 * COMPANION FILE: drawinginteractionhandler.js
 * - Contains all user interaction and event handling logic
 * - Handles mouse/touch events, drawing mechanics, and completion detection
 * - Manages point-based completion and canvas flooding prevention
 * - Provides undo functionality and drawing state management
 */

class DrawingRenderer {
    constructor(layoutRenderer) {
        console.log('✏️ DrawingRenderer initializing - SVG rendering and visual feedback');
        
        // Reference to layout renderer
        this.layoutRenderer = layoutRenderer;
        
        // Create interaction handler
        this.interactionHandler = new DrawingInteractionHandler(layoutRenderer);
        
        // SVG elements
        this.svg = null;
        this.outlineGroup = null;
        this.drawingGroup = null;
        
        // Current state
        this.currentNumber = null;
        this.isComplete = false;
        
        // Timer management
        this.hintTimer = null;
        this.visualFlashTimer = null;
        
        // Set up callbacks from interaction handler
        this.setupInteractionCallbacks();
        
        console.log('✅ DrawingRenderer initialized with interaction handler');
    }
    
    /**
     * Setup callbacks from interaction handler
     */
    setupInteractionCallbacks() {
        this.interactionHandler.setCompletionCallback((number) => {
            this.handleNumberCompletion(number);
        });
        
        this.interactionHandler.setResetCallback(() => {
            this.handleReset();
        });
        
        this.interactionHandler.setActivityCallback(() => {
            this.handleActivity();
        });
    }
    
    /**
     * Initialize the drawing system for a specific number
     */
    initializeForNumber(number) {
        console.log(`✏️ Initializing drawing renderer for number ${number}`);
        
        if (!this.layoutRenderer || !this.layoutRenderer.isLayoutReady()) {
            console.log('⏳ Layout not ready, deferring drawing initialization');
            setTimeout(() => this.initializeForNumber(number), 100);
            return false;
        }
        
        this.currentNumber = number;
        this.isComplete = false;
        
        // Create SVG canvas
        this.createSVGCanvas();
        
        // Render number outline with white fill and grey outline
        this.renderNumberWithWhiteFillGreyOutline(number);
        
        // Initialize interaction handler
        this.interactionHandler.setSVGReferences(this.svg, this.drawingGroup);
        this.interactionHandler.initializeForNumber(number);
        
        // Start hint and flash timers
        this.startHintTimer();
        this.startVisualFlashTimer();
        
        console.log(`✅ Drawing renderer ready for number ${number}`);
        return true;
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
        
        // Calculate outline thickness (% of game area height)
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
     * Handle number completion from interaction handler
     */
    handleNumberCompletion(number) {
        console.log(`🎉 Number ${number} completion handled by renderer`);
        
        this.isComplete = true;
        this.clearHintTimer();
        this.clearVisualFlashTimer();
        
        // Immediate completion feedback (500ms delay)
        setTimeout(() => {
            // Play completion sound effect
            if (window.AudioSystem) {
                window.AudioSystem.playCompletionSound();
            }
            
            // Trigger completion callback after admire time
            if (window.drawGameController && typeof window.drawGameController.onNumberComplete === 'function') {
                setTimeout(() => {
                    window.drawGameController.onNumberComplete(number);
                }, DRAW_CONFIG.TIMING.COMPLETION_ADMIRE_TIME);
            }
        }, DRAW_CONFIG.TIMING.COMPLETION_IMMEDIATE_DELAY);
    }
    
    /**
     * Handle reset from interaction handler
     */
    handleReset() {
        console.log('🔄 Reset handled by renderer - restarting timers');
        
        if (!this.isComplete) {
            this.startHintTimer();
            this.startVisualFlashTimer();
        }
    }
    
    /**
     * Handle activity from interaction handler
     */
    handleActivity() {
        this.clearHintTimer();
        this.clearVisualFlashTimer();
        
        // Only restart timers if not complete
        if (!this.isComplete) {
            this.startHintTimer();
            this.startVisualFlashTimer();
        }
    }
    
    /**
     * Start hint timer (20 seconds for audio hints)
     */
    startHintTimer() {
        if (this.isComplete) return;
        
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
        if (this.isComplete) return;
        
        console.log('💡 Showing audio hint');
        
        if (window.AudioSystem && window.AudioSystem.speakText) {
            let hintMessage;
            
            const progress = this.interactionHandler.getProgress();
            if (progress.pathCount === 0) {
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
     * Start visual flash timer (8 seconds, improved timing)
     */
    startVisualFlashTimer() {
        if (this.isComplete) return;
        
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
     * Enhanced visual flash (2 flashes: off-on, off-on in 1 second total)
     */
    showVisualFlash() {
        if (this.isComplete || !this.outlineGroup) return;
        
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
                if (this.isComplete) return; // Stop if state changed
                
                greyOutlinePaths.forEach(path => {
                    path.style.opacity = visible ? '1' : '0';
                });
                
                console.log(`Flash step: ${visible ? 'ON' : 'OFF'} at ${time}ms - applied to ${greyOutlinePaths.length} grey paths`);
            }, time);
        });
        
        // Restart flash timer for next cycle after sequence completes
        setTimeout(() => {
            if (!this.isComplete) {
                console.log('🔄 Restarting visual flash timer');
                this.startVisualFlashTimer();
            }
        }, DRAW_CONFIG.TIMING.VISUAL_FLASH_DURATION + 200); // Small buffer after flash sequence
    }
    
    /**
     * Undo the last drawn stroke (delegates to interaction handler)
     */
    undoLastStroke() {
        this.interactionHandler.undoLastStroke();
    }
    
    /**
     * Clear all drawing
     */
    clear() {
        console.log('🧹 Clearing all drawing');
        
        this.currentNumber = null;
        this.isComplete = false;
        
        this.clearHintTimer();
        this.clearVisualFlashTimer();
        
        if (this.interactionHandler) {
            this.interactionHandler.clear();
        }
        
        if (this.drawingGroup) {
            this.drawingGroup.innerHTML = '';
        }
        
        if (this.outlineGroup) {
            this.outlineGroup.innerHTML = '';
        }
    }
    
    /**
     * Get current drawing progress (delegates to interaction handler)
     */
    getProgress() {
        if (this.interactionHandler) {
            return this.interactionHandler.getProgress();
        }
        
        return {
            currentNumber: this.currentNumber,
            isComplete: this.isComplete,
            pathCount: 0,
            completionPoints: 0,
            coveredPoints: 0,
            requiredPoints: 0,
            pointCoverage: 0,
            completionRequirement: '90%',
            canvasCoverage: 0,
            canvasFloodingWarned: false,
            canvasAreaType: 'number_render_bounds'
        };
    }
    
    /**
     * Check if the drawing is complete
     */
    isDrawingComplete() {
        return this.isComplete;
    }
    
    /**
     * Get the current number being drawn
     */
    getCurrentNumber() {
        return this.currentNumber;
    }
    
    /**
     * Destroy the drawing renderer and clean up
     */
    destroy() {
        console.log('🗑️ Destroying DrawingRenderer');
        
        this.clear();
        
        if (this.interactionHandler) {
            this.interactionHandler.destroy();
        }
        
        if (this.svg && this.svg.parentNode) {
            this.svg.parentNode.removeChild(this.svg);
        }
        
        this.layoutRenderer = null;
        this.interactionHandler = null;
        this.svg = null;
        this.outlineGroup = null;
        this.drawingGroup = null;
        
        console.log('✅ DrawingRenderer destroyed');
    }
}

// Export for global access
console.log('✏️ DrawingRenderer class defined - SVG rendering and visual feedback');
