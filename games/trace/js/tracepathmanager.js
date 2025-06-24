class TracePathManager {
    constructor(svg, renderer) {
        this.svg = svg;
        this.renderer = renderer;
        
        // Paint system state
        this.isPainting = false;
        this.currentStroke = 0;
        this.startPosition = { x: 0, y: 0 }; // Current coordinate position
        this.currentCoordinateIndex = 0; // Which coordinate we're at
        
        // Red slider
        this.slider = null;
        
        // Paint brush settings
        this.fingerWidth = 40; // 40px finger width as requested
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        if (!this.svg) return;
        
        // Mouse events
        this.svg.addEventListener('mousedown', (e) => this.handleStart(e));
        this.svg.addEventListener('mousemove', (e) => this.handleMove(e));
        this.svg.addEventListener('mouseup', (e) => this.handleEnd(e));
        this.svg.addEventListener('mouseleave', (e) => this.handleEnd(e));
        
        // Touch events
        this.svg.addEventListener('touchstart', (e) => this.handleStart(e), { passive: false });
        this.svg.addEventListener('touchmove', (e) => this.handleMove(e), { passive: false });
        this.svg.addEventListener('touchend', (e) => this.handleEnd(e));
        this.svg.addEventListener('touchcancel', (e) => this.handleEnd(e));
    }

    startNewStroke(strokeIndex) {
        this.currentStroke = strokeIndex;
        this.isPainting = false;
        
        console.log(`Starting paint-fill for stroke ${strokeIndex}`);
        
        // Get stroke data from renderer
        const strokeData = this.renderer.getStrokeForPainting(strokeIndex);
        if (!strokeData) {
            console.error('Could not get stroke data for painting:', strokeIndex);
            return false;
        }
        
        // Find first unpainted coordinate (this is where slider should appear)
        const firstUnpainted = this.renderer.getFirstUnpaintedCoordinate(strokeIndex);
        if (!firstUnpainted) {
            console.log('All coordinates already painted for stroke', strokeIndex);
            return false;
        }
        
        this.startPosition = firstUnpainted.coordinate;
        this.currentCoordinateIndex = firstUnpainted.index;
        
        // Show red slider at first unpainted coordinate
        this.showStartSlider();
        
        console.log(`Stroke ${strokeIndex} ready. Slider at coordinate ${firstUnpainted.index}:`, this.startPosition);
        return true;
    }

    showStartSlider() {
        this.removeSlider();
        
        // Create red slider at start position
        this.slider = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.slider.setAttribute('class', 'paint-start-slider');
        this.slider.setAttribute('transform', `translate(${this.startPosition.x}, ${this.startPosition.y})`);
        
        // Red circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', 0);
        circle.setAttribute('cy', 0);
        circle.setAttribute('r', CONFIG.SLIDER_SIZE / 2);
        circle.setAttribute('fill', CONFIG.SLIDER_COLOR);
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', 3);
        circle.setAttribute('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))');
        
        // Pulsing animation
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'r');
        animate.setAttribute('values', `${CONFIG.SLIDER_SIZE / 2};${CONFIG.SLIDER_SIZE / 2 + 3};${CONFIG.SLIDER_SIZE / 2}`);
        animate.setAttribute('dur', '2s');
        animate.setAttribute('repeatCount', 'indefinite');
        
        circle.appendChild(animate);
        this.slider.appendChild(circle);
        
        // Paint brush icon
        const brushIcon = this.createBrushIcon();
        this.slider.appendChild(brushIcon);
        
        // Fade in animation
        this.slider.setAttribute('opacity', '0');
        const fadeIn = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        fadeIn.setAttribute('attributeName', 'opacity');
        fadeIn.setAttribute('values', '0;1');
        fadeIn.setAttribute('dur', '0.5s');
        fadeIn.setAttribute('fill', 'freeze');
        this.slider.appendChild(fadeIn);
        
        this.svg.appendChild(this.slider);
        
        console.log('Start slider created at:', this.startPosition);
    }

    createBrushIcon() {
        const brushGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        brushGroup.setAttribute('class', 'brush-icon');
        
        // Simple brush shape
        const brush = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        brush.setAttribute('d', 'M -6 -8 L 6 -8 L 4 8 L -4 8 Z M -2 8 L 2 8 L 1 12 L -1 12 Z');
        brush.setAttribute('fill', 'white');
        brush.setAttribute('stroke', 'none');
        
        brushGroup.appendChild(brush);
        return brushGroup;
    }

    removeSlider() {
        if (this.slider) {
            this.slider.remove();
            this.slider = null;
        }
    }

    handleStart(event) {
        event.preventDefault();
        
        const point = this.getEventPoint(event);
        if (!point) return;
        
        // Check if starting near the red slider
        if (this.isPointNearSlider(point)) {
            console.log('Starting paint from red slider');
            this.isPainting = true;
            this.removeSlider(); // Hide slider immediately when painting starts
            
            // Add first paint at the starting position
            this.addPaintAtPosition(point);
        } else {
            console.log('Must start painting from red slider');
        }
    }

    handleMove(event) {
        if (!this.isPainting) return;
        
        event.preventDefault();
        const point = this.getEventPoint(event);
        if (!point) return;
        
        // Check if point is valid for painting
        if (this.canPaintAt(point)) {
            this.addPaintAtPosition(point);
        } else {
            // Stop painting if we go outside valid area or lose connection
            console.log('Paint moved outside valid area - stopping');
            this.handleEnd(event);
        }
    }

    handleEnd(event) {
        if (!this.isPainting) return;
        
        console.log('Paint ended');
        this.isPainting = false;
        
        // Check if stroke is complete
        const completion = this.renderer.getPaintCompletion(this.currentStroke);
        
        if (completion >= 0.7) {
            // Stroke is complete - renderer will handle completion
            console.log('Stroke completed through painting!');
        } else {
            // Show slider again for continuation at furthest painted point
            setTimeout(() => {
                this.showContinuationSlider();
            }, 300);
        }
    }

    canPaintAt(point) {
        // Check if point is inside the stroke area
        if (!this.renderer.isValidPaintPosition(this.currentStroke, point)) {
            return false;
        }
        
        // Check if point is connected to existing paint or start point
        return this.renderer.isPaintConnected(this.currentStroke, point);
    }

    addPaintAtPosition(point) {
        // Add finger paint through renderer
        this.renderer.addFingerPaint(this.currentStroke, point);
        
        console.log(`Added paint at (${point.x.toFixed(1)}, ${point.y.toFixed(1)})`);
    }

    showContinuationSlider() {
        // Find the first unpainted coordinate (not the furthest painted!)
        const firstUnpainted = this.renderer.getFirstUnpaintedCoordinate(this.currentStroke);
        
        if (!firstUnpainted) {
            // All coordinates painted - stroke should be complete
            console.log('All coordinates painted - stroke complete');
            return;
        }
        
        // Update start position to first unpainted coordinate
        this.startPosition = firstUnpainted.coordinate;
        this.currentCoordinateIndex = firstUnpainted.index;
        this.showStartSlider();
        
        console.log(`Continuation slider at first unpainted coordinate ${firstUnpainted.index}:`, this.startPosition);
    }

    moveToNextStroke() {
        const nextStroke = this.currentStroke + 1;
        const totalStrokes = this.renderer.getStrokeCount();
        
        if (nextStroke < totalStrokes) {
            setTimeout(() => {
                this.startNewStroke(nextStroke);
            }, 500);
            return true;
        }
        return false;
    }

    // Utility methods
    getEventPoint(event) {
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
        
        const scaleX = CONFIG.SVG_WIDTH / rect.width;
        const scaleY = CONFIG.SVG_HEIGHT / rect.height;
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    isPointNearSlider(point) {
        if (!this.slider) return false;
        
        const distance = Math.sqrt(
            Math.pow(point.x - this.startPosition.x, 2) +
            Math.pow(point.y - this.startPosition.y, 2)
        );
        
        return distance <= CONFIG.SLIDER_SIZE / 2 + 10;
    }

    cleanup() {
        this.removeSlider();
        this.isPainting = false;
    }

    reset() {
        this.cleanup();
        this.currentStroke = 0;
    }

    getCurrentProgress() {
        return this.renderer.getPaintCompletion(this.currentStroke);
    }

    isCurrentlyTracing() {
        return this.isPainting;
    }
}    startNewStroke(strokeIndex) {
        this.currentStroke = strokeIndex;
        this.isPainting = false;
        
        console.log(`Starting paint-fill for stroke ${strokeIndex}`);
        
        // Get stroke data from renderer
        const strokeData = this.renderer.getStrokeForPainting(strokeIndex);
        if (!strokeData) {
            console.error('Could not get stroke data for painting:', strokeIndex);
            return false;
        }
        
        // Find start position (first coordinate)
        if (strokeData.coordinates && strokeData.coordinates.length > 0) {
            this.startPosition = strokeData.coordinates[0];
        } else {
            // Fallback: get start from path
            const pathElement = strokeData.pathElement;
            if (pathElement) {
                const startPoint = pathElement.getPointAtLength(0);
                this.startPosition = { x: startPoint.x, y: startPoint.y };
            }
        }
        
        // Show red slider at start position
        this.showStartSlider();
        
        console.log(`Stroke ${strokeIndex} ready for painting. Start position:`, this.startPosition);
        return true;
    }

    showStartSlider() {
        this.removeSlider();
        
        // Create red slider at start position
        this.slider = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.slider.setAttribute('class', 'paint-start-slider');
        this.slider.setAttribute('transform', `translate(${this.startPosition.x}, ${this.startPosition.y})`);
        
        // Red circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', 0);
        circle.setAttribute('cy', 0);
        circle.setAttribute('r', CONFIG.SLIDER_SIZE / 2);
        circle.setAttribute('fill', CONFIG.SLIDER_COLOR);
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', 3);
        circle.setAttribute('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))');
        
        // Pulsing animation
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'r');
        animate.setAttribute('values', `${CONFIG.SLIDER_SIZE / 2};${CONFIG.SLIDER_SIZE / 2 + 3};${CONFIG.SLIDER_SIZE / 2}`);
        animate.setAttribute('dur', '2s');
        animate.setAttribute('repeatCount', 'indefinite');
        
        circle.appendChild(animate);
        this.slider.appendChild(circle);
        
        // Paint brush icon
        const brushIcon = this.createBrushIcon();
        this.slider.appendChild(brushIcon);
        
        // Fade in animation
        this.slider.setAttribute('opacity', '0');
        const fadeIn = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        fadeIn.setAttribute('attributeName', 'opacity');
        fadeIn.setAttribute('values', '0;1');
        fadeIn.setAttribute('dur', '0.5s');
        fadeIn.setAttribute('fill', 'freeze');
        this.slider.appendChild(fadeIn);
        
        this.svg.appendChild(this.slider);
        
        console.log('Start slider created at:', this.startPosition);
    }

    createBrushIcon() {
        const brushGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        brushGroup.setAttribute('class', 'brush-icon');
        
        // Simple brush shape
        const brush = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        brush.setAttribute('d', 'M -6 -8 L 6 -8 L 4 8 L -4 8 Z M -2 8 L 2 8 L 1 12 L -1 12 Z');
        brush.setAttribute('fill', 'white');
        brush.setAttribute('stroke', 'none');
        
        brushGroup.appendChild(brush);
        return brushGroup;
    }

    removeSlider() {
        if (this.slider) {
            this.slider.remove();
            this.slider = null;
        }
    }

    handleStart(event) {
        event.preventDefault();
        
        const point = this.getEventPoint(event);
        if (!point) return;
        
        // Check if starting near the red slider
        if (this.isPointNearSlider(point)) {
            console.log('Starting paint from red slider');
            this.isPainting = true;
            this.removeSlider(); // Hide slider immediately when painting starts
            
            // Add first paint at the starting position
            this.addPaintAtPosition(point);
        } else {
            console.log('Must start painting from red slider');
        }
    }

    handleMove(event) {
        if (!this.isPainting) return;
        
        event.preventDefault();
        const point = this.getEventPoint(event);
        if (!point) return;
        
        // Check if point is valid for painting
        if (this.canPaintAt(point)) {
            this.addPaintAtPosition(point);
        } else {
            // Stop painting if we go outside valid area or lose connection
            console.log('Paint moved outside valid area - stopping');
            this.handleEnd(event);
        }
    }

    handleEnd(event) {
        if (!this.isPainting) return;
        
        console.log('Paint ended');
        this.isPainting = false;
        
        // Check if stroke is complete
        const completion = this.renderer.getPaintCompletion(this.currentStroke);
        
        if (completion >= 0.7) {
            // Stroke is complete - renderer will handle completion
            console.log('Stroke completed through painting!');
        } else {
            // Show slider again for continuation at furthest painted point
            setTimeout(() => {
                this.showContinuationSlider();
            }, 300);
        }
    }

    canPaintAt(point) {
        // Check if point is inside the stroke area
        if (!this.renderer.isValidPaintPosition(this.currentStroke, point)) {
            return false;
        }
        
        // Check if point is connected to existing paint or start point
        return this.renderer.isPaintConnected(this.currentStroke, point);
    }

    addPaintAtPosition(point) {
        // Add finger paint through renderer
        this.renderer.addFingerPaint(this.currentStroke, point);
        
        console.log(`Added paint at (${point.x.toFixed(1)}, ${point.y.toFixed(1)})`);
    }

    showContinuationSlider() {
        // Find the furthest painted point and show slider there
        const paintLayer = this.renderer.paintLayers[this.currentStroke];
        if (!paintLayer) {
            this.showStartSlider();
            return;
        }
        
        const paintCircles = paintLayer.querySelectorAll('.finger-paint');
        if (paintCircles.length === 0) {
            this.showStartSlider();
            return;
        }
        
        // Find furthest point from start
        let furthestPoint = this.startPosition;
        let maxDistance = 0;
        
        paintCircles.forEach(circle => {
            const x = parseFloat(circle.getAttribute('cx'));
            const y = parseFloat(circle.getAttribute('cy'));
            const distance = Math.sqrt(
                Math.pow(x - this.startPosition.x, 2) + 
                Math.pow(y - this.startPosition.y, 2)
            );
            
            if (distance > maxDistance) {
                maxDistance = distance;
                furthestPoint = { x, y };
            }
        });
        
        // Update start position and show slider
        this.startPosition = furthestPoint;
        this.showStartSlider();
        
        console.log('Continuation slider shown at furthest paint point:', furthestPoint);
    }

    moveToNextStroke() {
        const nextStroke = this.currentStroke + 1;
        const totalStrokes = this.renderer.getStrokeCount();
        
        if (nextStroke < totalStrokes) {
            setTimeout(() => {
                this.startNewStroke(nextStroke);
            }, 500);
            return true;
        }
        return false;
    }

    // Utility methods
    getEventPoint(event) {
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
        
        const scaleX = CONFIG.SVG_WIDTH / rect.width;
        const scaleY = CONFIG.SVG_HEIGHT / rect.height;
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    isPointNearSlider(point) {
        if (!this.slider) return false;
        
        const distance = Math.sqrt(
            Math.pow(point.x - this.startPosition.x, 2) +
            Math.pow(point.y - this.startPosition.y, 2)
        );
        
        return distance <= CONFIG.SLIDER_SIZE / 2 + 10;
    }

    cleanup() {
        this.removeSlider();
        this.isPainting = false;
    }

    reset() {
        this.cleanup();
        this.currentStroke = 0;
    }

    getCurrentProgress() {
        return this.renderer.getPaintCompletion(this.currentStroke);
    }

    isCurrentlyTracing() {
        return this.isPainting;
    }
}
