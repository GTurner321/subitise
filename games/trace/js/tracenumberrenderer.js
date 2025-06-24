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
        
        // Number elements with mask system
        this.strokeElements = {};
        this.strokeMasks = {}; // SVG masks for each stroke
        
        console.log('TraceNumberRenderer initialized with SVG mask system');
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
        
        // Create defs section for masks
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        this.svg.appendChild(defs);
        
        // Add to container
        container.appendChild(this.svg);
        
        console.log('SVG renderer initialized with mask system');
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
        this.strokeMasks = {};
        this.paintLayers = {};

        // Get number data from CONFIG (your existing system)
        const numberData = CONFIG.NUMBER_PATHS[number];
        if (!numberData || !numberData.strokes) {
            console.error('No path data found for number in CONFIG:', number);
            return false;
        }

        // Create the layered structure with masks
        this.createNumberWithMasks(numberData, number);
        
        console.log(`Number ${number} rendered with mask system - ${numberData.strokes.length} strokes`);
        return true;
    }

    createNumberWithMasks(numberData, number) {
        // Create paint background group (bottom layer)
        const paintBackgroundGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        paintBackgroundGroup.setAttribute('class', 'paint-background-layers');
        paintBackgroundGroup.setAttribute('id', `paint-bg-${number}`);
        
        // Create number outline group (top layer with masks)
        const numberOutlineGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        numberOutlineGroup.setAttribute('class', `number-outline-group number-${number}`);
        numberOutlineGroup.setAttribute('id', `number-${number}`);

        // Process each stroke
        numberData.strokes.forEach((stroke, strokeIndex) => {
            // Initialize paint tracking for this stroke
            this.initializePaintTracking(strokeIndex);
            
            // Create mask for this stroke
            this.createStrokeMask(stroke, strokeIndex, number);
            
            // Create paint layer for this stroke (background)
            this.createPaintLayer(strokeIndex, paintBackgroundGroup);
            
            // Create masked outline for this stroke (foreground)
            this.createMaskedStroke(stroke, strokeIndex, numberOutlineGroup);
        });

        // Add layers to SVG in correct order
        this.svg.appendChild(paintBackgroundGroup); // Paint behind
        this.svg.appendChild(numberOutlineGroup);   // Masked outline on top

        console.log('Number created with coordinate-based paint tracking');
    }

    createStrokeMask(strokeData, strokeIndex, number) {
        const defs = this.svg.querySelector('defs');
        
        // Create mask element
        const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
        mask.setAttribute('id', `stroke-mask-${number}-${strokeIndex}`);
        
        // Black background - everything hidden by default
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        background.setAttribute('width', '100%');
        background.setAttribute('height', '100%');
        background.setAttribute('fill', 'black');
        
        // White stroke path - creates the "holes" where content shows through
        const holePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        holePath.setAttribute('d', strokeData.path);
        holePath.setAttribute('fill', 'none');
        holePath.setAttribute('stroke', 'white');
        holePath.setAttribute('stroke-width', (strokeData.width || CONFIG.OUTLINE_WIDTH || 30) - 10); // Slightly thinner than outline
        holePath.setAttribute('stroke-linecap', 'round');
        holePath.setAttribute('stroke-linejoin', 'round');
        
        mask.appendChild(background);
        mask.appendChild(holePath);
        defs.appendChild(mask);
        
        // Store mask reference
        this.strokeMasks[strokeIndex] = mask;
        
        console.log(`Created mask for stroke ${strokeIndex}`);
    }

    createPaintLayer(strokeIndex, parentGroup) {
        // Create paint layer that will show through the mask holes
        const paintLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        paintLayer.setAttribute('class', `paint-layer-${strokeIndex}`);
        paintLayer.setAttribute('id', `paint-layer-${this.currentNumber}-${strokeIndex}`);
        
        this.paintLayers[strokeIndex] = paintLayer;
        parentGroup.appendChild(paintLayer);
        
        console.log(`Created paint layer for stroke ${strokeIndex}`);
    }

    createMaskedStroke(strokeData, strokeIndex, parentGroup) {
        // Create stroke group
        const strokeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        strokeGroup.setAttribute('class', `stroke-${strokeIndex}`);
        
        // Create the black outline path with mask applied
        const blackOutline = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        blackOutline.setAttribute('d', strokeData.path);
        blackOutline.setAttribute('fill', 'none');
        blackOutline.setAttribute('stroke', strokeData.color || CONFIG.OUTLINE_COLOR || '#000000');
        blackOutline.setAttribute('stroke-width', strokeData.width || CONFIG.OUTLINE_WIDTH || 30);
        blackOutline.setAttribute('stroke-linecap', 'round');
        blackOutline.setAttribute('stroke-linejoin', 'round');
        blackOutline.setAttribute('class', 'stroke-outline-masked');
        
        // Apply the mask to create holes
        blackOutline.setAttribute('mask', `url(#stroke-mask-${this.currentNumber}-${strokeIndex})`);
        
        strokeGroup.appendChild(blackOutline);
        
        // Store references for the paint system
        this.strokeElements[strokeIndex] = {
            group: strokeGroup,
            maskedOutline: blackOutline,
            pathString: strokeData.path,
            coordinates: strokeData.coordinates || this.generateCoordinatesFromPath(strokeData.path)
        };
        
        parentGroup.appendChild(strokeGroup);
        
        console.log(`Created masked stroke ${strokeIndex}`);
    }

    generateCoordinatesFromPath(pathString) {
        // Extract coordinate points from the path for the slider system
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
    // COORDINATE-BASED PAINT SYSTEM
    // ================================

    // Track which coordinate points have been painted
    initializePaintTracking(strokeIndex) {
        if (!this.paintedCoordinates) {
            this.paintedCoordinates = {};
        }
        this.paintedCoordinates[strokeIndex] = new Set();
    }

    // Check if a coordinate point has been painted
    isCoordinatePainted(strokeIndex, coordinateIndex) {
        if (!this.paintedCoordinates || !this.paintedCoordinates[strokeIndex]) {
            return false;
        }
        return this.paintedCoordinates[strokeIndex].has(coordinateIndex);
    }

    // Mark coordinate points as painted based on paint position
    markCoordinatesAsPainted(strokeIndex, paintPosition) {
        const strokeData = this.getStrokeForPainting(strokeIndex);
        if (!strokeData || !strokeData.coordinates) return;

        // Check which coordinate points are within paint radius
        strokeData.coordinates.forEach((coord, index) => {
            const distance = Math.sqrt(
                Math.pow(paintPosition.x - coord.x, 2) + 
                Math.pow(paintPosition.y - coord.y, 2)
            );
            
            // If coordinate is within paint circle radius (20px), mark as painted
            if (distance <= 20) {
                this.paintedCoordinates[strokeIndex].add(index);
                console.log(`Coordinate ${index} marked as painted for stroke ${strokeIndex}`);
            }
        });
    }

    // Find the first unpainted coordinate in the sequence
    getFirstUnpaintedCoordinate(strokeIndex) {
        const strokeData = this.getStrokeForPainting(strokeIndex);
        if (!strokeData || !strokeData.coordinates) return null;

        // Find first coordinate that hasn't been painted
        for (let i = 0; i < strokeData.coordinates.length; i++) {
            if (!this.isCoordinatePainted(strokeIndex, i)) {
                return {
                    coordinate: strokeData.coordinates[i],
                    index: i
                };
            }
        }
        
        // All coordinates painted
        return null;
    }

    // Check if position is inside a mask hole (visible area)
    isInsideMaskHole(strokeIndex, position) {
        // Create a test circle at the position
        const testCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        testCircle.setAttribute('cx', position.x);
        testCircle.setAttribute('cy', position.y);
        testCircle.setAttribute('r', 20);
        testCircle.setAttribute('fill', 'red');
        testCircle.setAttribute('opacity', 0); // Invisible test
        
        // Apply the same mask to see if it would be visible
        testCircle.setAttribute('mask', `url(#stroke-mask-${this.currentNumber}-${strokeIndex})`);
        
        this.svg.appendChild(testCircle);
        
        // Check if the circle has any visible area
        const bbox = testCircle.getBBox();
        const isVisible = bbox.width > 0 && bbox.height > 0;
        
        // Clean up test circle
        testCircle.remove();
        
        return isVisible;
    }

    // Get stroke data for paint system
    getStrokeForPainting(strokeIndex) {
        const strokeElement = this.strokeElements[strokeIndex];
        if (!strokeElement) {
            console.error(`Stroke ${strokeIndex} not found`);
            return null;
        }
        
        return {
            paintLayer: this.paintLayers[strokeIndex], // Where paint goes (shows through mask holes)
            coordinates: strokeElement.coordinates, // For slider positioning
            pathString: strokeElement.pathString,
            maskedOutline: strokeElement.maskedOutline // The masked outline path
        };
    }

    // Add finger paint at a position (40px width as requested)
    addFingerPaint(strokeIndex, position) {
        const paintLayer = this.paintLayers[strokeIndex];
        if (!paintLayer) {
            console.error(`Paint layer ${strokeIndex} not found`);
            return;
        }

        // Only paint if position is visible through mask holes
        if (!this.isInsideMaskHole(strokeIndex, position)) {
            console.log('Paint position not visible through mask - skipping');
            return;
        }

        // Create paint circle (40px diameter = finger width)
        const paintCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        paintCircle.setAttribute('cx', position.x);
        paintCircle.setAttribute('cy', position.y);
        paintCircle.setAttribute('r', 20); // 40px diameter
        paintCircle.setAttribute('fill', CONFIG.TRACE_COLOR || '#4CAF50');
        paintCircle.setAttribute('opacity', 0.9);
        paintCircle.setAttribute('class', 'finger-paint');
        
        // Add smooth drop animation
        paintCircle.setAttribute('opacity', 0);
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'opacity');
        animate.setAttribute('values', '0;0.9');
        animate.setAttribute('dur', '0.2s');
        animate.setAttribute('fill', 'freeze');
        paintCircle.appendChild(animate);
        
        paintLayer.appendChild(paintCircle);
        
        // Mark coordinates as painted
        this.markCoordinatesAsPainted(strokeIndex, position);
        
        // Update progress
        this.updatePaintProgress(strokeIndex);
        
        console.log(`Added visible finger paint at (${position.x}, ${position.y})`);
    }

    // Check if position is valid for painting (near stroke path AND visible)
    isValidPaintPosition(strokeIndex, position) {
        // Must be both near the stroke path AND visible through mask holes
        return this.isNearStrokePath(strokeIndex, position) && 
               this.isInsideMaskHole(strokeIndex, position);
    }

    // Check if position is near the stroke path
    isNearStrokePath(strokeIndex, position) {
        const strokeData = this.getStrokeForPainting(strokeIndex);
        if (!strokeData) return false;
        
        // Create a temporary path element to test against
        const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tempPath.setAttribute('d', strokeData.pathString);
        this.svg.appendChild(tempPath);
        
        const pathLength = tempPath.getTotalLength();
        let isValid = false;
        
        // Check if position is within finger width of the path
        for (let i = 0; i <= pathLength; i += 5) {
            const pathPoint = tempPath.getPointAtLength(i);
            const distance = Math.sqrt(
                Math.pow(position.x - pathPoint.x, 2) + 
                Math.pow(position.y - pathPoint.y, 2)
            );
            
            if (distance <= 25) { // Within finger radius + buffer
                isValid = true;
                break;
            }
        }
        
        // Clean up temp path
        tempPath.remove();
        
        return isValid;
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
        
        // Check if position is within connection distance of existing paint
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

    // Update paint progress based on coordinate completion
    updatePaintProgress(strokeIndex) {
        const strokeData = this.getStrokeForPainting(strokeIndex);
        if (!strokeData || !strokeData.coordinates) return 0;
        
        const totalCoordinates = strokeData.coordinates.length;
        const paintedCoordinates = this.paintedCoordinates[strokeIndex]?.size || 0;
        const completion = totalCoordinates > 0 ? paintedCoordinates / totalCoordinates : 0;
        
        this.paintProgress[strokeIndex] = completion;
        
        console.log(`Stroke ${strokeIndex} progress: ${paintedCoordinates}/${totalCoordinates} coordinates (${(completion * 100).toFixed(1)}%)`);
        
        // Check for completion (80% of coordinates painted)
        if (completion >= 0.8) {
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
        if (strokeElement && strokeElement.maskedOutline) {
            strokeElement.maskedOutline.setAttribute('stroke', CONFIG.COMPLETE_COLOR || '#4CAF50');
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
        
        // Keep defs but remove everything else
        const children = Array.from(this.svg.children);
        children.forEach(child => {
            if (child.tagName !== 'defs') {
                child.remove();
            }
        });
        
        // Clear masks from defs
        const defs = this.svg.querySelector('defs');
        if (defs) {
            const masks = defs.querySelectorAll('[id^="stroke-mask-"]');
            masks.forEach(mask => mask.remove());
        }
    }

    reset() {
        this.clearSVG();
        this.currentNumber = null;
        this.currentStroke = 0;
        this.completedStrokes.clear();
        this.paintProgress = {};
        this.strokeElements = {};
        this.strokeMasks = {};
        this.paintLayers = {};
        this.paintedCoordinates = {}; // Reset coordinate tracking
        
        console.log('Coordinate-based renderer reset complete');
    }

    destroy() {
        if (this.svg) {
            this.svg.remove();
            this.svg = null;
        }
        this.reset();
    }

    // ================================
    // DEBUG METHODS
    // ================================

    showMaskInfo() {
        if (!CONFIG.DEBUG_MODE) return;
        
        console.log('Mask System Debug Info:');
        console.log('- Stroke Masks:', Object.keys(this.strokeMasks));
        console.log('- Paint Layers:', Object.keys(this.paintLayers));
        console.log('- Layer Order: Paint Background (bottom) → Masked Outlines (top)');
        console.log('- Paint shows through white mask holes in black outline');
    }

    logState() {
        console.log('Mask-Based Renderer State:', {
            currentNumber: this.currentNumber,
            currentStroke: this.currentStroke,
            completedStrokes: Array.from(this.completedStrokes),
            paintProgress: this.paintProgress,
            strokeCount: this.getStrokeCount(),
            maskCount: Object.keys(this.strokeMasks).length
        });
    }
}

// Make available globally
window.TraceNumberRenderer = TraceNumberRenderer;
