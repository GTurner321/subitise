class TraceNumberRenderer {
    constructor() {
        this.svg = null;
        this.currentNumber = null;
        this.numberPaths = [];
        this.tracingPaths = [];
        this.currentStroke = 0;
        this.container = null;
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
        
        console.log('SVG created:', this.svg);
        return true;
    }

    createSVG() {
        // Clear existing content
        this.container.innerHTML = '';
        
        // Create main SVG element
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('viewBox', `0 0 ${CONFIG.SVG_WIDTH} ${CONFIG.SVG_HEIGHT}`);
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
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

    renderNumber(number) {
        if (number < 0 || number > 9) {
            console.error('Invalid number:', number);
            return false;
        }
        
        this.currentNumber = number;
        this.currentStroke = 0;
        this.clearSVG();
        
        const numberConfig = CONFIG.STROKE_DEFINITIONS[number];
        if (!numberConfig || !numberConfig.strokes) {
            console.error('No stroke definition found for number:', number);
            return false;
        }
        
        console.log(`Rendering number ${number} with ${numberConfig.strokes.length} stroke(s)`);
        
        try {
            // Create the number outline (solid border, empty inside)
            this.createNumberOutline(number);
            
            // Create tracing paths for each stroke
            this.createTracingPaths(numberConfig.strokes);
            
            // Show start point for first stroke
            this.showStartPoint(0);
            
            console.log(`Successfully rendered number ${number}`);
            return true;
        } catch (error) {
            console.error('Error rendering number:', number, error);
            return false;
        }
    }

    createNumberOutline(number) {
        const numberConfig = CONFIG.STROKE_DEFINITIONS[number];
        
        // Create a group for the complete number outline
        const outlineGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        outlineGroup.setAttribute('class', 'number-outline');
        
        // Combine all strokes into one path for the outline
        numberConfig.strokes.forEach((stroke, index) => {
            // Create solid outline path - empty inside, ready to be filled
            const outlinePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            outlinePath.setAttribute('d', stroke.path);
            outlinePath.setAttribute('stroke', CONFIG.OUTLINE_COLOR); // Dark solid outline
            outlinePath.setAttribute('stroke-width', CONFIG.OUTLINE_WIDTH);
            outlinePath.setAttribute('fill', 'none'); // Empty inside - ready to be filled by tracing
            outlinePath.setAttribute('stroke-linecap', 'round');
            outlinePath.setAttribute('stroke-linejoin', 'round');
            outlinePath.setAttribute('class', `outline-stroke-${index}`);
            
            outlineGroup.appendChild(outlinePath);
        });
        
        this.svg.appendChild(outlineGroup);
        
        // Add debug rectangle if in debug mode
        if (CONFIG.DEBUG_MODE) {
            this.addDebugRectangle();
        }
    }

    addDebugRectangle() {
        // Show the number rectangle bounds for debugging
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

    createTracingPaths(strokes) {
        this.tracingPaths = [];
        
        strokes.forEach((stroke, index) => {
            let pathData;
            
            // Handle different stroke types
            if (stroke.type === 'coordinates') {
                pathData = this.coordinatesToPath(stroke.coordinates);
            } else {
                pathData = stroke.path;
            }
            
            // Create invisible path for collision detection - much thicker for coordinate precision
            const invisiblePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            invisiblePath.setAttribute('d', pathData);
            invisiblePath.setAttribute('stroke', 'transparent');
            // For coordinate-based paths, use much thicker collision detection
            const collisionWidth = stroke.type === 'coordinates' ? CONFIG.PATH_TOLERANCE * 4 : CONFIG.PATH_TOLERANCE * 2;
            invisiblePath.setAttribute('stroke-width', collisionWidth);
            invisiblePath.setAttribute('fill', 'none');
            invisiblePath.setAttribute('class', `invisible-path-${index}`);
            invisiblePath.setAttribute('pointer-events', 'stroke');
            
            // Create visible tracing path (will be filled as user traces)
            const tracingPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            tracingPath.setAttribute('d', pathData);
            tracingPath.setAttribute('stroke', CONFIG.FILL_COLOR);
            tracingPath.setAttribute('stroke-width', CONFIG.PATH_WIDTH);
            tracingPath.setAttribute('fill', 'none');
            tracingPath.setAttribute('stroke-linecap', 'round');
            tracingPath.setAttribute('stroke-linejoin', 'round');
            tracingPath.setAttribute('class', `tracing-path-${index}`);
            
            // Initially hidden (will be revealed as user traces)
            const pathLength = this.getPathLength(tracingPath);
            tracingPath.setAttribute('stroke-dasharray', pathLength);
            tracingPath.setAttribute('stroke-dashoffset', pathLength);
            
            // Store path data
            this.tracingPaths.push({
                invisible: invisiblePath,
                visible: tracingPath,
                length: pathLength,
                progress: 0,
                completed: false,
                strokeData: stroke
            });
            
            // Add to SVG (invisible paths first, then visible)
            this.svg.appendChild(invisiblePath);
            this.svg.appendChild(tracingPath);
        });
    }

    coordinatesToPath(coordinates) {
        if (!coordinates || coordinates.length === 0) return '';
        
        // Scale coordinates to fit in the number rectangle (120x200 centered at 200,200)
        // Your coordinates: 0-100 range, with (0,0) at bottom-left
        // SVG coordinates: (0,0) at top-left, so we need to flip Y
        const scaleX = CONFIG.NUMBER_RECT_WIDTH / 100;  // 120px / 100 = 1.2
        const scaleY = CONFIG.NUMBER_RECT_HEIGHT / 200; // 200px / 200 = 1.0
        const offsetX = CONFIG.NUMBER_CENTER_X - CONFIG.NUMBER_RECT_WIDTH / 2; // 140
        const offsetY = CONFIG.NUMBER_CENTER_Y - CONFIG.NUMBER_RECT_HEIGHT / 2; // 100
        
        let pathData = '';
        
        coordinates.forEach((coord, index) => {
            const scaledX = offsetX + (coord.x * scaleX);
            // Flip Y coordinate: SVG Y increases downward, your coords Y increases upward
            const scaledY = offsetY + ((200 - coord.y) * scaleY);
            
            if (index === 0) {
                pathData += `M ${scaledX} ${scaledY}`;
            } else {
                pathData += ` L ${scaledX} ${scaledY}`;
            }
        });
        
        return pathData;
    }

    getPathLength(pathElement) {
        // Temporarily add to DOM to measure if not already there
        const wasInDOM = pathElement.parentNode;
        if (!wasInDOM) {
            this.svg.appendChild(pathElement);
        }
        
        const length = pathElement.getTotalLength();
        
        if (!wasInDOM) {
            this.svg.removeChild(pathElement);
        }
        
        return length;
    }

    showStartPoint(strokeIndex) {
        if (strokeIndex >= this.tracingPaths.length) return;
        
        // Remove any existing start point
        const existingStartPoint = this.svg.querySelector('.start-point');
        if (existingStartPoint) {
            existingStartPoint.remove();
        }
        
        if (!CONFIG.SHOW_START_POINTS) return;
        
        const stroke = this.tracingPaths[strokeIndex];
        const startPoint = stroke.strokeData.startPoint;
        
        // Create start point indicator
        const startCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        startCircle.setAttribute('cx', startPoint.x);
        startCircle.setAttribute('cy', startPoint.y);
        startCircle.setAttribute('r', CONFIG.SLIDER_SIZE / 2);
        startCircle.setAttribute('fill', CONFIG.SLIDER_COLOR);
        startCircle.setAttribute('stroke', 'white');
        startCircle.setAttribute('stroke-width', 3);
        startCircle.setAttribute('class', 'start-point');
        
        // Add pulsing animation
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'r');
        animate.setAttribute('values', `${CONFIG.SLIDER_SIZE / 2};${CONFIG.SLIDER_SIZE / 2 + 5};${CONFIG.SLIDER_SIZE / 2}`);
        animate.setAttribute('dur', '1.5s');
        animate.setAttribute('repeatCount', 'indefinite');
        
        startCircle.appendChild(animate);
        this.svg.appendChild(startCircle);
    }

    updateTracingProgress(strokeIndex, progress) {
        if (strokeIndex >= this.tracingPaths.length) return;
        
        const tracingPath = this.tracingPaths[strokeIndex];
        const progressLength = tracingPath.length * progress;
        const dashOffset = tracingPath.length - progressLength;
        
        tracingPath.visible.setAttribute('stroke-dashoffset', dashOffset);
        tracingPath.progress = progress;
        
        // Check if stroke is complete
        if (progress >= 0.95) { // 95% threshold for completion
            this.completeStroke(strokeIndex);
        }
    }

    completeStroke(strokeIndex) {
        if (strokeIndex >= this.tracingPaths.length) return;
        
        const tracingPath = this.tracingPaths[strokeIndex];
        if (tracingPath.completed) return;
        
        // Fully reveal the path
        tracingPath.visible.setAttribute('stroke-dashoffset', 0);
        tracingPath.completed = true;
        tracingPath.progress = 1;
        
        console.log(`Stroke ${strokeIndex} completed for number ${this.currentNumber}`);
        
        // Check if all strokes are complete
        if (this.areAllStrokesComplete()) {
            this.completeNumber();
        } else {
            // Move to next stroke
            this.currentStroke++;
            this.showStartPoint(this.currentStroke);
        }
    }

    areAllStrokesComplete() {
        return this.tracingPaths.every(path => path.completed);
    }

    completeNumber() {
        console.log(`Number ${this.currentNumber} fully completed!`);
        
        // Remove start point
        const startPoint = this.svg.querySelector('.start-point');
        if (startPoint) {
            startPoint.remove();
        }
        
        // Add completion effect
        this.addCompletionEffect();
    }

    addCompletionEffect() {
        // Create a group for the completion effect
        const effectGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        effectGroup.setAttribute('class', 'completion-effect');
        
        // Add stars or sparkles around the number
        const starPositions = [
            { x: 100, y: 100 }, { x: 300, y: 100 },
            { x: 350, y: 200 }, { x: 300, y: 300 },
            { x: 100, y: 300 }, { x: 50, y: 200 }
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
        star.setAttribute('font-size', '24');
        star.setAttribute('fill', '#FFD700');
        star.setAttribute('class', 'completion-star');
        star.textContent = '✨';
        
        return star;
    }

    getCurrentStroke() {
        return this.currentStroke;
    }

    getCurrentStrokeData() {
        if (this.currentStroke >= this.tracingPaths.length) return null;
        return this.tracingPaths[this.currentStroke];
    }

    getStrokeProgress(strokeIndex) {
        if (strokeIndex >= this.tracingPaths.length) return 0;
        return this.tracingPaths[strokeIndex].progress;
    }

    isNumberComplete() {
        return this.areAllStrokesComplete();
    }

    clearSVG() {
        // Clear all paths and elements except the SVG itself
        while (this.svg.firstChild) {
            this.svg.removeChild(this.svg.firstChild);
        }
        this.numberPaths = [];
        this.tracingPaths = [];
    }

    reset() {
        this.currentNumber = null;
        this.currentStroke = 0;
        if (this.svg) {
            this.clearSVG();
        }
    }

    // Debug methods
    highlightInvisiblePaths() {
        if (!CONFIG.DEBUG_MODE) return;
        
        this.tracingPaths.forEach((path, index) => {
            path.invisible.setAttribute('stroke', 'rgba(255,0,0,0.3)');
            path.invisible.setAttribute('stroke-width', CONFIG.PATH_TOLERANCE);
        });
    }

    showPathDirections() {
        if (!CONFIG.DEBUG_MODE) return;
        
        this.tracingPaths.forEach((path, index) => {
            const pathElement = path.visible;
            const pathLength = path.length;
            
            // Add direction arrows along the path
            for (let i = 0; i < pathLength; i += 50) {
                const point = pathElement.getPointAtLength(i);
                const nextPoint = pathElement.getPointAtLength(Math.min(i + 10, pathLength));
                
                const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x);
                const arrow = this.createDirectionArrow(point.x, point.y, angle);
                this.svg.appendChild(arrow);
            }
        });
    }

    createDirectionArrow(x, y, angle) {
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const size = 8;
        const points = `0,0 ${size},-${size/2} ${size/2},0 ${size},${size/2}`;
        
        arrow.setAttribute('points', points);
        arrow.setAttribute('fill', 'blue');
        arrow.setAttribute('transform', `translate(${x},${y}) rotate(${angle * 180 / Math.PI})`);
        arrow.setAttribute('class', 'debug-arrow');
        
        return arrow;
    }
}
