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
        this.container = document.getElementById(containerId);
        if (!this.container) {
            return false;
        }
        
        this.createSVG();
        
        this.handleResize = () => {
            if (this.svg) {
                this.updateSVGDimensions();
                if (this.currentNumber !== null) {
                    this.renderNumber(this.currentNumber);
                }
            }
        };
        window.addEventListener('resize', this.handleResize);
        
        return true;
    }

    createSVG() {
        this.container.innerHTML = '';
        
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.updateSVGDimensions();
        this.svg.setAttribute('class', 'trace-svg');
        
        if (CONFIG.DEBUG_MODE) {
            const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            background.setAttribute('width', CONFIG.SVG_WIDTH);
            background.setAttribute('height', CONFIG.SVG_HEIGHT);
            background.setAttribute('fill', 'rgba(0,0,255,0.1)');
            this.svg.appendChild(background);
        }
        
        this.container.appendChild(this.svg);
    }

    updateSVGDimensions() {
        this.svg.setAttribute('viewBox', `0 0 ${CONFIG.SVG_WIDTH} ${CONFIG.SVG_HEIGHT}`);
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
    }

    renderNumber(number) {
        if (number < 0 || number > 9) {
            return false;
        }
        
        this.currentNumber = number;
        this.currentStroke = 0;
        this.clearSVG();
        this.scaledCoordinates = [];
        
        const numberConfig = CONFIG.STROKE_DEFINITIONS[number];
        if (!numberConfig || !numberConfig.strokes) {
            return false;
        }
        
        try {
            this.processCoordinates(numberConfig.strokes);
            this.createNumberOutline(numberConfig.strokes);
            return true;
        } catch (error) {
            return false;
        }
    }

    processCoordinates(strokes) {
        strokes.forEach((stroke, strokeIndex) => {
            if (stroke.type === 'coordinates' && stroke.coordinates) {
                const scaledCoords = this.scaleCoordinates(stroke.coordinates);
                this.scaledCoordinates[strokeIndex] = scaledCoords;
            }
        });
    }

    scaleCoordinates(coordinates) {
        if (!coordinates || coordinates.length === 0) {
            return [];
        }
        
        for (let i = 0; i < coordinates.length; i++) {
            const coord = coordinates[i];
            if (!coord || typeof coord.x === 'undefined' || typeof coord.y === 'undefined') {
                return [];
            }
        }
        
        const scaleX = CONFIG.NUMBER_RECT_WIDTH / 100;
        const scaleY = CONFIG.NUMBER_RECT_HEIGHT / 200;
        const offsetX = CONFIG.NUMBER_CENTER_X - CONFIG.NUMBER_RECT_WIDTH / 2;
        const offsetY = CONFIG.NUMBER_CENTER_Y - CONFIG.NUMBER_RECT_HEIGHT / 2;
        
        const scaledCoords = coordinates.map((coord) => {
            const scaledX = offsetX + (coord.x * scaleX);
            const scaledY = offsetY + ((200 - coord.y) * scaleY);
            
            return { x: scaledX, y: scaledY };
        });
        
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
        
        if (CONFIG.DEBUG_MODE) {
            this.addDebugRectangle();
        }
    }

    createSingleStrokeOutline(strokes) {
        // For single stroke numbers, use the original method
        strokes.forEach((stroke, strokeIndex) => {
            if (stroke.type === 'coordinates' && this.scaledCoordinates[strokeIndex]) {
                const coords = this.scaledCoordinates[strokeIndex];
                const pathData = this.createPathData(coords);
                
                // Layer 1: Thick black outline
                const thickOutlinePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                thickOutlinePath.setAttribute('d', pathData);
                thickOutlinePath.setAttribute('stroke', CONFIG.OUTLINE_COLOR);
                thickOutlinePath.setAttribute('stroke-width', '30');
                thickOutlinePath.setAttribute('fill', 'none');
                thickOutlinePath.setAttribute('stroke-linecap', 'round');
                thickOutlinePath.setAttribute('stroke-linejoin', 'round');
                thickOutlinePath.setAttribute('class', `thick-outline-stroke-${strokeIndex}`);
                this.svg.appendChild(thickOutlinePath);
                
                // Layer 2: White interior
                const whiteInteriorPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                whiteInteriorPath.setAttribute('d', pathData);
                whiteInteriorPath.setAttribute('stroke', 'white');
                whiteInteriorPath.setAttribute('stroke-width', '20');
                whiteInteriorPath.setAttribute('fill', 'none');
                whiteInteriorPath.setAttribute('stroke-linecap', 'round');
                whiteInteriorPath.setAttribute('stroke-linejoin', 'round');
                whiteInteriorPath.setAttribute('class', `white-interior-stroke-${strokeIndex}`);
                this.svg.appendChild(whiteInteriorPath);
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
                const pathData = this.createPathData(coords);
                allPathData.push({ pathData, strokeIndex });
            }
        });
        
        // FIRST PASS: Create ALL black outlines for the entire number
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
        
        // SECOND PASS: Create ALL white interiors for the entire number
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
    }

    createPathData(coords) {
        let pathData = '';
        coords.forEach((coord, index) => {
            if (index === 0) {
                pathData += `M ${coord.x} ${coord.y}`;
            } else {
                pathData += ` L ${coord.x} ${coord.y}`;
            }
        });
        return pathData;
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

    getStrokeCoordinates(strokeIndex) {
        return this.scaledCoordinates[strokeIndex] || [];
    }

    getStrokeStartPoint(strokeIndex) {
        const coords = this.getStrokeCoordinates(strokeIndex);
        return coords.length > 0 ? coords[0] : null;
    }

    getStrokeCount() {
        const numberConfig = CONFIG.STROKE_DEFINITIONS[this.currentNumber];
        return numberConfig ? numberConfig.strokes.length : 0;
    }

    createTracedPath(strokeIndex, progressCoordIndex) {
        const coords = this.getStrokeCoordinates(strokeIndex);
        if (!coords || coords.length === 0 || progressCoordIndex < 0) {
            return null;
        }
        
        const endIndex = Math.min(progressCoordIndex + 1, coords.length);
        const progressCoords = coords.slice(0, endIndex);
        
        const pathData = this.createPathData(progressCoords);
        
        const existingPath = this.svg.querySelector(`.traced-path-${strokeIndex}`);
        if (existingPath) {
            existingPath.remove();
        }
        
        const tracedPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tracedPath.setAttribute('d', pathData);
        tracedPath.setAttribute('stroke', CONFIG.FILL_COLOR);
        tracedPath.setAttribute('stroke-width', '24');
        tracedPath.setAttribute('fill', 'none');
        tracedPath.setAttribute('stroke-linecap', 'round');
        tracedPath.setAttribute('stroke-linejoin', 'round');
        tracedPath.setAttribute('class', `traced-path-${strokeIndex}`);
        
        const overlayElements = this.svg.querySelectorAll('.trace-slider, .direction-arrow, .balloon-group');
        if (overlayElements.length > 0) {
            this.svg.insertBefore(tracedPath, overlayElements[0]);
        } else {
            this.svg.appendChild(tracedPath);
        }
        
        return tracedPath;
    }

    updateTracingProgress(strokeIndex, coordinateIndex) {
        this.createTracedPath(strokeIndex, coordinateIndex);
    }

    completeStroke(strokeIndex) {
        const coords = this.getStrokeCoordinates(strokeIndex);
        if (coords && coords.length > 0) {
            this.createTracedPath(strokeIndex, coords.length - 1);
        }
        
        this.currentStroke++;
    }

    areAllStrokesComplete() {
        const totalStrokes = this.getStrokeCount();
        
        for (let i = 0; i < totalStrokes; i++) {
            const tracedPath = this.svg.querySelector(`.traced-path-${i}`);
            if (!tracedPath) {
                return false;
            }
        }
        
        return true;
    }

    completeNumber() {
        this.addCompletionEffect();
    }

    addCompletionEffect() {
        const effectGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        effectGroup.setAttribute('class', 'completion-effect');
        
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
        star.setAttribute('font-size', '30');
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

    destroy() {
        if (this.handleResize) {
            window.removeEventListener('resize', this.handleResize);
            this.handleResize = null;
        }
        this.reset();
    }
}
