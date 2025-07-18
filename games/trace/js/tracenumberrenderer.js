class TraceNumberRenderer {
    constructor() {
        this.svg = null;
        this.currentNumber = null;
        this.currentStroke = 0;
        this.container = null;
        this.scaledCoordinates = [];
        this.handleResize = null;
    }

    initialize(containerId) {
        console.log('Initializing renderer with container:', containerId);
        
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Container not found:', containerId);
            return false;
        }
        
        console.log('Container found:', this.container);
        this.createSVG();
        
        // Add window resize handler for dynamic dimensions
        this.handleResize = () => {
            if (this.svg) {
                this.updateSVGDimensions();
                // Re-render current number if one is displayed
                if (this.currentNumber !== null) {
                    this.renderNumber(this.currentNumber);
                }
            }
        };
        window.addEventListener('resize', this.handleResize);
        
        console.log('SVG created:', this.svg);
        return true;
    }

    createSVG() {
        // Clear existing content
        this.container.innerHTML = '';
        
        // Create main SVG element
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.updateSVGDimensions();
        this.svg.setAttribute('class', 'trace-svg');
        
        console.log('Created SVG element:', this.svg);
        
        // Add background for debug purposes
        if (CONFIG.DEBUG_MODE) {
            const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            background.setAttribute('width', CONFIG.SVG_WIDTH);
            background.setAttribute('height', CONFIG.SVG_HEIGHT);
            background.setAttribute('fill', 'rgba(0,0,255,0.1)');
            this.svg.appendChild(background);
            console.log('Added debug background');
        }
        
        this.container.appendChild(this.svg);
        console.log('SVG added to container');
    }

    updateSVGDimensions() {
        // Update SVG dimensions dynamically using CONFIG getters
        this.svg.setAttribute('viewBox', `0 0 ${CONFIG.SVG_WIDTH} ${CONFIG.SVG_HEIGHT}`);
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        console.log(`SVG dimensions updated: ${CONFIG.SVG_WIDTH} x ${CONFIG.SVG_HEIGHT}`);
    }

    renderNumber(number) {
        if (number < 0 || number > 9) {
            console.error('Invalid number:', number);
            return false;
        }
        
        this.currentNumber = number;
        this.currentStroke = 0;
        this.clearSVG();
        this.scaledCoordinates = [];
        
        const numberConfig = CONFIG.STROKE_DEFINITIONS[number];
        if (!numberConfig || !numberConfig.strokes) {
            console.error('No stroke definition found for number:', number);
            return false;
        }
        
        console.log(`Rendering number ${number} with ${numberConfig.strokes.length} stroke(s)`);
        
        try {
            // Process and scale all coordinates first
            this.processCoordinates(numberConfig.strokes);
            
            // Create the visible number outline with improved layering
            this.createNumberOutline(numberConfig.strokes);
            
            console.log(`Successfully rendered number ${number}`);
            return true;
        } catch (error) {
            console.error('Error rendering number:', number, error);
            return false;
        }
    }

    processCoordinates(strokes) {
        strokes.forEach((stroke, strokeIndex) => {
            if (stroke.type === 'coordinates' && stroke.coordinates) {
                const scaledCoords = this.scaleCoordinates(stroke.coordinates);
                this.scaledCoordinates[strokeIndex] = scaledCoords;
                console.log(`Processed ${scaledCoords.length} coordinates for stroke ${strokeIndex}`);
            }
        });
    }

    scaleCoordinates(coordinates) {
        console.log('=== scaleCoordinates called ===');
        console.log('Input coordinates length:', coordinates ? coordinates.length : 'null');
        
        if (!coordinates || coordinates.length === 0) {
            console.error('No coordinates provided to scaleCoordinates');
            return [];
        }
        
        // Validate coordinates
        for (let i = 0; i < coordinates.length; i++) {
            const coord = coordinates[i];
            if (!coord || typeof coord.x === 'undefined' || typeof coord.y === 'undefined') {
                console.error(`Invalid coordinate at index ${i}:`, coord);
                return [];
            }
        }
        
        // Scale coordinates to fit in the centered number rectangle using dynamic CONFIG
        const scaleX = CONFIG.NUMBER_RECT_WIDTH / 100;  // 120px / 100 = 1.2
        const scaleY = CONFIG.NUMBER_RECT_HEIGHT / 200; // 200px / 200 = 1.0
        const offsetX = CONFIG.NUMBER_CENTER_X - CONFIG.NUMBER_RECT_WIDTH / 2; // Dynamic center
        const offsetY = CONFIG.NUMBER_CENTER_Y - CONFIG.NUMBER_RECT_HEIGHT / 2; // Dynamic center
        
        console.log('Scaling factors:', { scaleX, scaleY, offsetX, offsetY });
        console.log('Screen dimensions:', { width: CONFIG.SVG_WIDTH, height: CONFIG.SVG_HEIGHT });
        console.log('Number center:', { x: CONFIG.NUMBER_CENTER_X, y: CONFIG.NUMBER_CENTER_Y });
        
        const scaledCoords = coordinates.map((coord, index) => {
            const scaledX = offsetX + (coord.x * scaleX);
            // Flip Y coordinate: SVG Y increases downward, coordinates Y increases upward
            const scaledY = offsetY + ((200 - coord.y) * scaleY);
            
            // Log first few coordinates for debugging
            if (index < 3) {
                console.log(`Coord ${index}: (${coord.x}, ${coord.y}) → (${scaledX}, ${scaledY})`);
            }
            
            return { x: scaledX, y: scaledY };
        });
        
        console.log('=== Scaled coordinates generated ===');
        console.log('Scaled coordinates length:', scaledCoords.length);
        
        return scaledCoords;
    }

    createNumberOutline(strokes) {
        // Check if this number has multiple strokes that need proper layering
        const hasMultipleStrokes = strokes.length > 1;
        
        if (hasMultipleStrokes) {
            this.createMultiStrokeOutline(strokes);
        } else {
            this.createSingleStrokeOutline(strokes);
        }
        
        // Add debug rectangle if in debug mode
        if (CONFIG.DEBUG_MODE) {
            this.addDebugRectangle();
        }
    }

    createSingleStrokeOutline(strokes) {
        // For single stroke numbers, use the original method
        strokes.forEach((stroke, strokeIndex) => {
            if (stroke.type === 'coordinates' && this.scaledCoordinates[strokeIndex]) {
                const coords = this.scaledCoordinates[strokeIndex];
                
                // Create path data from coordinates
                let pathData = '';
                coords.forEach((coord, index) => {
                    if (index === 0) {
                        pathData += `M ${coord.x} ${coord.y}`;
                    } else {
                        pathData += ` L ${coord.x} ${coord.y}`;
                    }
                });
                
                // Layer 1: Thick black outline (increased to 30px for full screen)
                const thickOutlinePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                thickOutlinePath.setAttribute('d', pathData);
                thickOutlinePath.setAttribute('stroke', CONFIG.OUTLINE_COLOR);
                thickOutlinePath.setAttribute('stroke-width', '30');
                thickOutlinePath.setAttribute('fill', 'none');
                thickOutlinePath.setAttribute('stroke-linecap', 'round');
                thickOutlinePath.setAttribute('stroke-linejoin', 'round');
                thickOutlinePath.setAttribute('class', `thick-outline-stroke-${strokeIndex}`);
                this.svg.appendChild(thickOutlinePath);
                
                // Layer 2: White interior (increased to 20px for full screen) - creates the "channel" to fill
                const whiteInteriorPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                whiteInteriorPath.setAttribute('d', pathData);
                whiteInteriorPath.setAttribute('stroke', 'white');
                whiteInteriorPath.setAttribute('stroke-width', '20');
                whiteInteriorPath.setAttribute('fill', 'none');
                whiteInteriorPath.setAttribute('stroke-linecap', 'round');
                whiteInteriorPath.setAttribute('stroke-linejoin', 'round');
                whiteInteriorPath.setAttribute('class', `white-interior-stroke-${strokeIndex}`);
                this.svg.appendChild(whiteInteriorPath);
                
                console.log(`Created layered outline for stroke ${strokeIndex} with ${coords.length} points`);
            }
        });
    }

    createMultiStrokeOutline(strokes) {
        // For multi-stroke numbers: create ALL black outlines first, then ALL white interiors
        // This prevents any black lines from showing through connections between strokes
        
        const allPathData = [];
        
        // Collect all path data first
        strokes.forEach((stroke, strokeIndex) => {
            if (stroke.type === 'coordinates' && this.scaledCoordinates[strokeIndex]) {
                const coords = this.scaledCoordinates[strokeIndex];
                
                let pathData = '';
                coords.forEach((coord, index) => {
                    if (index === 0) {
                        pathData += `M ${coord.x} ${coord.y}`;
                    } else {
                        pathData += ` L ${coord.x} ${coord.y}`;
                    }
                });
                
                allPathData.push({ pathData, strokeIndex });
            }
        });
        
        // First pass: Create all black outlines
        allPathData.forEach(({ pathData, strokeIndex }) => {
            const thickOutlinePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            thickOutlinePath.setAttribute('d', pathData);
            thickOutlinePath.setAttribute('stroke', CONFIG.OUTLINE_COLOR);
            thickOutlinePath.setAttribute('stroke-width', '30');
            thickOutlinePath.setAttribute('fill', 'none');
            thickOutlinePath.setAttribute('stroke-linecap', 'round');
            thickOutlinePath.setAttribute('stroke-linejoin', 'round');
            thickOutlinePath.setAttribute('class', `thick-outline-stroke-${strokeIndex}`);
            this.svg.appendChild(thickOutlinePath);
        });
        
        // Second pass: Create all white interiors
        allPathData.forEach(({ pathData, strokeIndex }) => {
            const whiteInteriorPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            whiteInteriorPath.setAttribute('d', pathData);
            whiteInteriorPath.setAttribute('stroke', 'white');
            whiteInteriorPath.setAttribute('stroke-width', '20');
            whiteInteriorPath.setAttribute('fill', 'none');
            whiteInteriorPath.setAttribute('stroke-linecap', 'round');
            whiteInteriorPath.setAttribute('stroke-linejoin', 'round');
            whiteInteriorPath.setAttribute('class', `white-interior-stroke-${strokeIndex}`);
            this.svg.appendChild(whiteInteriorPath);
        });
        
        console.log(`Created proper layered outline for multi-stroke number with ${allPathData.length} strokes`);
    }

    addDebugRectangle() {
        const debugRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        debugRect.setAttribute('x', CONFIG.NUMBER_CENTER_X - CONFIG.NUMBER_RECT_WIDTH/2);
        debugRect.setAttribute('y', CONFIG.NUMBER_CENTER_Y - CONFIG.NUMBER_RECT_HEIGHT/2);
        debugRect.setAttribute('width', CONFIG.NUMBER_RECT_WIDTH);
        debugRect.setAttribute('height', CONFIG.NUMBER_RECT_HEIGHT);
        debugRect.setAttribute('stroke', 'red');
        debugRect.setAttribute('stroke-width', 1);
        debugRect.setAttribute('fill', 'none');
        debugRect.setAttribute('stroke-dasharray', '5,5');
        debugRect.setAttribute('class', 'debug-rectangle');
        
        this.svg.appendChild(debugRect);
    }

    // Get scaled coordinates for a specific stroke
    getStrokeCoordinates(strokeIndex) {
        return this.scaledCoordinates[strokeIndex] || [];
    }

    // Get the start point for a stroke
    getStrokeStartPoint(strokeIndex) {
        const coords = this.getStrokeCoordinates(strokeIndex);
        return coords.length > 0 ? coords[0] : null;
    }

    // Get total number of strokes for current number
    getStrokeCount() {
        const numberConfig = CONFIG.STROKE_DEFINITIONS[this.currentNumber];
        return numberConfig ? numberConfig.strokes.length : 0;
    }

    // Create a traced path element for showing progress
    createTracedPath(strokeIndex, progressCoordIndex) {
        const coords = this.getStrokeCoordinates(strokeIndex);
        if (!coords || coords.length === 0 || progressCoordIndex < 0) {
            return null;
        }
        
        // Create path from start to current progress point
        const endIndex = Math.min(progressCoordIndex + 1, coords.length);
        const progressCoords = coords.slice(0, endIndex);
        
        let pathData = '';
        progressCoords.forEach((coord, index) => {
            if (index === 0) {
                pathData += `M ${coord.x} ${coord.y}`;
            } else {
                pathData += ` L ${coord.x} ${coord.y}`;
            }
        });
        
        // Remove existing traced path for this stroke
        const existingPath = this.svg.querySelector(`.traced-path-${strokeIndex}`);
        if (existingPath) {
            existingPath.remove();
        }
        
        // Create new traced path (increased to 24px for full screen to fill the channel nicely)
        const tracedPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tracedPath.setAttribute('d', pathData);
        tracedPath.setAttribute('stroke', CONFIG.FILL_COLOR);
        tracedPath.setAttribute('stroke-width', '24'); // 24px to fill the 20px white channel with slight overlap
        tracedPath.setAttribute('fill', 'none');
        tracedPath.setAttribute('stroke-linecap', 'round');
        tracedPath.setAttribute('stroke-linejoin', 'round');
        tracedPath.setAttribute('class', `traced-path-${strokeIndex}`);
        
        // FIXED: Insert traced path before sliders AND balloons to ensure both stay on top
        const overlayElements = this.svg.querySelectorAll('.trace-slider, .direction-arrow, .balloon-group');
        if (overlayElements.length > 0) {
            this.svg.insertBefore(tracedPath, overlayElements[0]);
        } else {
            this.svg.appendChild(tracedPath);
        }
        
        return tracedPath;
    }

    // Update traced path for current progress
    updateTracingProgress(strokeIndex, coordinateIndex) {
        this.createTracedPath(strokeIndex, coordinateIndex);
    }

    // Complete a stroke by showing the full traced path
    completeStroke(strokeIndex) {
        const coords = this.getStrokeCoordinates(strokeIndex);
        if (coords && coords.length > 0) {
            this.createTracedPath(strokeIndex, coords.length - 1);
        }
        
        console.log(`Stroke ${strokeIndex} completed for number ${this.currentNumber}`);
        
        // Just increment the stroke counter
        this.currentStroke++;
    }

    areAllStrokesComplete() {
        const totalStrokes = this.getStrokeCount();
        
        // Check if all strokes have traced paths
        for (let i = 0; i < totalStrokes; i++) {
            const tracedPath = this.svg.querySelector(`.traced-path-${i}`);
            if (!tracedPath) {
                console.log(`Stroke ${i} not complete - no traced path found`);
                return false;
            }
        }
        
        console.log(`All ${totalStrokes} strokes are complete`);
        return true;
    }

    completeNumber() {
        console.log(`Number ${this.currentNumber} fully completed!`);
        
        // Add completion effect with dynamic positioning
        this.addCompletionEffect();
    }

    addCompletionEffect() {
        // Create a group for the completion effect
        const effectGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        effectGroup.setAttribute('class', 'completion-effect');
        
        // Add stars around the number using dynamic center positioning
        const starPositions = [
            { x: CONFIG.NUMBER_CENTER_X - 100, y: CONFIG.NUMBER_CENTER_Y - 100 },
            { x: CONFIG.NUMBER_CENTER_X + 100, y: CONFIG.NUMBER_CENTER_Y - 100 },
            { x: CONFIG.NUMBER_CENTER_X + 120, y: CONFIG.NUMBER_CENTER_Y },
            { x: CONFIG.NUMBER_CENTER_X + 100, y: CONFIG.NUMBER_CENTER_Y + 100 },
            { x: CONFIG.NUMBER_CENTER_X - 100, y: CONFIG.NUMBER_CENTER_Y + 100 },
            { x: CONFIG.NUMBER_CENTER_X - 120, y: CONFIG.NUMBER_CENTER_Y }
        ];
        
        starPositions.forEach((pos, index) => {
            const star = this.createStar(pos.x, pos.y);
            star.style.animationDelay = `${index * 0.1}s`;
            effectGroup.appendChild(star);
        });
        
        this.svg.appendChild(effectGroup);
        
        // Remove effect after animation
        setTimeout(() => {
            if (effectGroup.parentNode) {
                effectGroup.parentNode.removeChild(effectGroup);
            }
        }, 2000);
    }

    createStar(x, y) {
        const star = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        star.setAttribute('x', x);
        star.setAttribute('y', y);
        star.setAttribute('text-anchor', 'middle');
        star.setAttribute('dominant-baseline', 'middle');
        star.setAttribute('font-size', '30'); // Larger for full screen
        star.setAttribute('fill', '#FFD700');
        star.setAttribute('class', 'completion-star');
        star.textContent = '✨';
        
        return star;
    }

    getCurrentStroke() {
        return this.currentStroke;
    }

    isNumberComplete() {
        return this.areAllStrokesComplete();
    }

    clearSVG() {
        // Clear all paths and elements except the SVG itself
        while (this.svg.firstChild) {
            this.svg.removeChild(this.svg.firstChild);
        }
    }

    reset() {
        this.currentNumber = null;
        this.currentStroke = 0;
        this.scaledCoordinates = [];
        if (this.svg) {
            this.clearSVG();
        }
    }

    // Clean up method for proper resource management
    destroy() {
        if (this.handleResize) {
            window.removeEventListener('resize', this.handleResize);
            this.handleResize = null;
        }
        this.reset();
    }
}
