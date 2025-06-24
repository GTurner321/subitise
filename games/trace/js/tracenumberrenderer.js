class TraceNumberRenderer {
    constructor() {
        // Core rendering state
        this.svg = null;
        this.currentNumber = null;
        this.currentStroke = 0;
        this.completedStrokes = new Set();
        
        // Paint system state
        this.paintProgress = {};
        this.paintLayers = {}; // Background paint layers for each stroke
        
        // Number elements from existing config rendering
        this.strokeElements = {};
        
        console.log('TraceNumberRenderer initialized for paint-fill system');
    }

    initialize(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container not found:', containerId);
            return false;
        }

        // Create SVG element
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('class', 'trace-svg');
        this.svg.setAttribute('viewBox', `0 0 ${CONFIG.SVG_WIDTH} ${CONFIG.SVG_HEIGHT}`);
        this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        
        // Add to container
        container.appendChild(this.svg);
        
        console.log('SVG renderer initialized successfully');
        return true;
    }

    renderNumber(number) {
        if (!this.svg) {
            console.error('SVG not initialized');
            return false;
        }

        // Clear previous number
        this.clearSVG();
        
        // Reset state
        this.currentNumber = number;
        this.currentStroke = 0;
        this.completedStrokes.clear();
        this.paintProgress = {};
        this.strokeElements = {};
        this.paintLayers = {};

        // Get number data from CONFIG (your existing system)
        const numberData = CONFIG.NUMBER_PATHS[number];
        if (!numberData || !numberData.strokes) {
            console.error('No path data found for number in CONFIG:', number);
            return false;
        }

        // Create paint background layers FIRST (behind number)
        this.createPaintBackgroundLayers(numberData);
        
        // Render the number using YOUR existing config structure
        this.renderNumberFromConfig(numberData, number);
        
        console.log(`Number ${number} rendered successfully with paint system`);
        return true;
    }

    createPaintBackgroundLayers(numberData) {
        // Create background group for paint (behind the number outline)
        const paintBackgroundGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        paintBackgroundGroup.setAttribute('class', 'paint-background-layers');
        paintBackgroundGroup.setAttribute('id', `paint-bg-${this.currentNumber}`);
        
        // Create a paint layer for each stroke
        numberData.strokes.forEach((stroke, strokeIndex) => {
            const paintLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            paintLayer.setAttribute('class', `paint-layer-${strokeIndex}`);
            paintLayer.setAttribute('id', `paint-layer-${this.currentNumber}-${strokeIndex}`);
            
            this.paintLayers[strokeIndex] = paintLayer;
            paintBackgroundGroup.appendChild(paintLayer);
        });
        
        this.svg.appendChild(paintBackgroundGroup);
        console.log('Paint background layers created');
    }

    renderNumberFromConfig(numberData, number) {
        // Create the main number group (this will go ON TOP of paint layers)
        const numberGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        numberGroup.setAttribute('class', `number-outline-group number-${number}`);
        numberGroup.setAttribute('id', `number-${number}`);

        // Render each stroke using your existing CONFIG structure
        numberData.strokes.forEach((stroke, strokeIndex) => {
            this.renderStrokeFromConfig(stroke, strokeIndex, numberGroup);
        });

        this.svg.appendChild(numberGroup);
        console.log('Number rendered from CONFIG with', numberData.strokes.length, 'strokes');
    }

    renderStrokeFromConfig(strokeData, strokeIndex, parentGroup) {
        // Create stroke group
        const strokeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        strokeGroup.setAttribute('class', `stroke-${strokeIndex}`);
        
        // Create the BLACK outline path (from your config)
        const blackPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        blackPath.setAttribute('d', strokeData.path);
        blackPath.setAttribute('fill', 'none');
        blackPath.setAttribute('stroke', strokeData.color || CONFIG.OUTLINE_COLOR || '#000000');
        blackPath.setAttribute('stroke-width', strokeData.width || CONFIG.OUTLINE_WIDTH || 30);
        blackPath.setAttribute('stroke-linecap', 'round');
        blackPath.setAttribute('stroke-linejoin', 'round');
        blackPath.setAttribute('class', 'stroke-outline-black');
        
        // Create the WHITE overlay path (creates the "hole" effect)
        const whitePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        whitePath.setAttribute('d', strokeData.path);
        whitePath.setAttribute('fill', 'none');
        whitePath.setAttribute('stroke', 'white');
        whitePath.setAttribute('stroke-width', (strokeData.width || CONFIG.OUTLINE_WIDTH || 30) - 10); // Slightly thinner
        whitePath.setAttribute('stroke-linecap', 'round');
        whitePath.setAttribute('stroke-linejoin', 'round');
        whitePath.setAttribute('class', 'stroke-outline-white');
        
        // Add paths to stroke group
        strokeGroup.appendChild(blackPath);
        strokeGroup.appendChild(whitePath);
        
        // Store references for the paint system
        this.strokeElements[strokeIndex] = {
            group: strokeGroup,
            blackPath: blackPath,
            whitePath: whitePath,
            pathString: strokeData.path,
            coordinates: strokeData.coordinates || this.generateCoordinatesFromPath(strokeData.path)
        };
        
        parentGroup.appendChild(strokeGroup);
    }

    generateCoordinatesFromPath(pathString) {
        // Basic path coordinate extraction - you may want to enhance this
        // This extracts coordinate points from the path for the slider system
        const coordinates = [];
        const pathCommands = pathString.match(/[MLCQZmlcqz][^MLCQZmlcqz]*/g);
        
        if (pathCommands) {
            pathCommands.forEach(command => {
                const coords = command.slice(1).trim().split(/[\s,]+/).map(parseFloat);
                for (let i = 0; i < coords.length; i += 2) {
                    if (!isNaN(coords[i]) && !isNaN(coords[i + 1])) {
                        coordinates.push({ x: coords[i], y: coords[i + 1] });
                    }
                }
            });
        }
        
        return coordinates;
    }

    // ================================
    // PAINT SYSTEM METHODS
    // ================================

    // Get stroke data for paint system
    getStrokeForPainting(strokeIndex) {
        const strokeElement = this.strokeElements[strokeIndex];
        if (!strokeElement) {
            console.error(`Stroke ${strokeIndex} not found`);
            return null;
        }
        
        return {
            pathElement: strokeElement.whitePath, // The white path defines the paintable area
            paintLayer: this.paintLayers[strokeIndex], // Where paint goes
            coordinates: strokeElement.coordinates, // For slider positioning
            pathString: strokeElement.pathString
        };
    }

    // Add finger paint at a position (40px width as requested)
    addFingerPaint(strokeIndex, position) {
        const paintLayer = this.paintLayers[strokeIndex];
        if (!paintLayer) {
            console.error(`Paint layer ${strokeIndex} not found`);
            return;
        }

        // Create paint circle (40px diameter = finger width)
        const paintCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        paintCircle.setAttribute('cx', position.x);
        paintCircle.setAttribute('cy', position.y);
        paintCircle.setAttribute('r', 20); // 40px diameter
        paintCircle.setAttribute('fill', CONFIG.TRACE_COLOR || '#4CAF50');
        paintCircle.setAttribute('opacity', 0.8);
        paintCircle.setAttribute('class', 'finger-paint');
        
        // Add smooth animation
        paintCircle.setAttribute('opacity', 0);
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'opacity');
        animate.setAttribute('values', '0;0.8');
        animate.setAttribute('dur', '0.2s');
        animate.setAttribute('fill', 'freeze');
        paintCircle.appendChild(animate);
        
        paintLayer.appendChild(paintCircle);
        
        // Update progress
        this.updatePaintProgress(strokeIndex);
        
        console.log(`Added finger paint at (${position.x}, ${position.y}) for stroke ${strokeIndex}`);
    }

    // Check if position is valid for painting (inside the white path area)
    isValidPaintPosition(strokeIndex, position) {
        const strokeData = this.getStrokeForPainting(strokeIndex);
        if (!strokeData) return false;
        
        // Use SVG hit testing to check if point is inside the white stroke path
        const point = this.svg.createSVGPoint();
        point.x = position.x;
        point.y = position.y;
        
        // Check if point is near the white path (within finger width)
        const pathElement = strokeData.pathElement;
        const pathLength = pathElement.getTotalLength();
        
        // Sample points along the path and check distance
        for (let i = 0; i <= pathLength; i += 5) {
            const pathPoint = pathElement.getPointAtLength(i);
            const distance = Math.sqrt(
                Math.pow(position.x - pathPoint.x, 2) + 
                Math.pow(position.y - pathPoint.y, 2)
            );
            
            if (distance <= 25) { // Within finger radius + small buffer
                return true;
            }
        }
        
        return false;
    }

    // Check if paint position is connected to existing paint
    isPaintConnected(strokeIndex, position) {
        const paintLayer = this.paintLayers[strokeIndex];
        if (!paintLayer) return false;
        
        const existingPaint = paintLayer.querySelectorAll('.finger-paint');
        if (existingPaint.length === 0) {
            // First paint - check if near start point
            return this.isNearStartPoint(strokeIndex, position);
        }
        
        // Check if position is within finger width of existing paint
        for (const paintCircle of existingPaint) {
            const paintX = parseFloat(paintCircle.getAttribute('cx'));
            const paintY = parseFloat(paintCircle.getAttribute('cy'));
            const distance = Math.sqrt(
                Math.pow(position.x - paintX, 2) + 
                Math.pow(position.y - paintY, 2)
            );
            
            if (distance <= 45) { // Overlap distance for continuous paint
                return true;
            }
        }
        
        return false;
    }

    isNearStartPoint(strokeIndex, position) {
        const strokeData = this.getStrokeForPainting(strokeIndex);
        if (!strokeData || !strokeData.coordinates || strokeData.coordinates.length === 0) {
            return false;
        }
        
        const startPoint = strokeData.coordinates[0];
        const distance = Math.sqrt(
            Math.pow(position.x - startPoint.x, 2) + 
            Math.pow(position.y - startPoint.y, 2)
        );
        
        return distance <= 30; // Within slider radius
    }

    // Update paint progress for a stroke
    updatePaintProgress(strokeIndex) {
        const paintLayer = this.paintLayers[strokeIndex];
        if (!paintLayer) return 0;
        
        const paintCircles = paintLayer.querySelectorAll('.finger-paint');
        const strokeData = this.getStrokeForPainting(strokeIndex);
        
        if (!strokeData || !strokeData.pathElement) return 0;
        
        // Estimate coverage based on paint circles vs path length
        const pathLength = strokeData.pathElement.getTotalLength();
        const paintCoverage = paintCircles.length * 40; // Each circle covers ~40px
        const completion = Math.min(paintCoverage / pathLength, 1.0);
        
        this.paintProgress[strokeIndex] = completion;
        
        console.log(`Stroke ${strokeIndex} paint progress: ${(completion * 100).toFixed(1)}%`);
        
        // Check for completion
        if (completion >= 0.7) { // 70% coverage = complete
            this.completeStroke(strokeIndex);
        }
        
        return completion;
    }

    // Complete a stroke
    completeStroke(strokeIndex) {
        if (this.completedStrokes.has(strokeIndex)) return;
        
        console.log(`Stroke ${strokeIndex} completed via painting!`);
        
        this.completedStrokes.add(strokeIndex);
        
        // Visual completion effect
        this.addStrokeCompletionEffect(strokeIndex);
        
        // Change outline color to indicate completion
        const strokeElement = this.strokeElements[strokeIndex];
        if (strokeElement && strokeElement.blackPath) {
            strokeElement.blackPath.setAttribute('stroke', CONFIG.COMPLETE_COLOR || '#4CAF50');
        }
        
        // Check if entire number is complete
        if (this.completedStrokes.size >= this.getStrokeCount()) {
            setTimeout(() => {
                this.completeNumber();
            }, 500);
        }
    }

    addStrokeCompletionEffect(strokeIndex) {
        const strokeElement = this.strokeElements[strokeIndex];
        if (!strokeElement) return;
        
        const bbox = strokeElement.group.getBBox();
        const centerX = bbox.x + bbox.width / 2;
        const centerY = bbox.y + bbox.height / 2;
        
        // Create sparkle effect
        const sparkleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        sparkleGroup.setAttribute('class', 'stroke-completion-sparkle');
        sparkleGroup.setAttribute('transform', `translate(${centerX}, ${centerY})`);
        
        // Add sparkle stars
        for (let i = 0; i < 5; i++) {
            const sparkle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            const angle = (i / 5) * Math.PI * 2;
            const distance = 30 + Math.random() * 20;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            sparkle.setAttribute('cx', x);
            sparkle.setAttribute('cy', y);
            sparkle.setAttribute('r', 5);
            sparkle.setAttribute('fill', '#FFD700');
            sparkle.setAttribute('opacity', 0);
            
            const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
            animate.setAttribute('attributeName', 'opacity');
            animate.setAttribute('values', '0;1;0');
            animate.setAttribute('dur', '1s');
            animate.setAttribute('begin', `${i * 0.2}s`);
            
            sparkle.appendChild(animate);
            sparkleGroup.appendChild(sparkle);
        }
        
        this.svg.appendChild(sparkleGroup);
        
        setTimeout(() => sparkleGroup.remove(), 2000);
    }

    completeNumber() {
        console.log(`Number ${this.currentNumber} completed!`);
        
        // Trigger completion callback if set
        if (typeof this.onNumberComplete === 'function') {
            this.onNumberComplete();
        }
    }

    // ================================
    // UTILITY METHODS
    // ================================

    getStrokeCount() {
        return Object.keys(this.strokeElements).length;
    }

    getCurrentStroke() {
        return this.currentStroke;
    }

    isStrokeComplete(strokeIndex) {
        return this.completedStrokes.has(strokeIndex);
    }

    getPaintCompletion(strokeIndex) {
        return this.paintProgress[strokeIndex] || 0;
    }

    clearSVG() {
        if (!this.svg) return;
        
        while (this.svg.firstChild) {
            this.svg.removeChild(this.svg.firstChild);
        }
    }

    reset() {
        this.clearSVG();
        this.currentNumber = null;
        this.currentStroke = 0;
        this.completedStrokes.clear();
        this.paintProgress = {};
        this.strokeElements = {};
        this.paintLayers = {};
        
        console.log('Renderer reset complete');
    }
}

// Make available globally
window.TraceNumberRenderer = TraceNumberRenderer;
