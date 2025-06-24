class TracePathManager {
    constructor(svg, renderer) {
        this.svg = svg;
        this.renderer = renderer;
        
        // Paint system state
        this.isPainting = false;
        this.currentStroke = 0;
        this.paintedArea = new Set(); // Track painted pixels/areas
        this.paintMask = null; // SVG mask for painted areas
        this.startPoint = { x: 0, y: 0 }; // Where painting must begin
        
        // Red slider
        this.slider = null;
        
        // Paint brush settings
        this.brushSize = 12; // Size of paint brush
        this.paintColor = '#4CAF50'; // Green paint color
        
        // Current stroke bounds for hit detection
        this.strokeBounds = null;
        this.strokePath = null; // The actual path element we're painting
        
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
        this.paintedArea.clear();
        
        console.log(`Starting paint-fill for stroke ${strokeIndex}`);
        
        // Get the stroke path element and its start point
        this.setupStrokeForPainting(strokeIndex);
        
        // Show red slider at start point
        this.showStartSlider();
        
        return true;
    }

    setupStrokeForPainting(strokeIndex) {
        // Get the white path element that we'll be "painting over"
        this.strokePath = this.renderer.getStrokePathElement(strokeIndex);
        
        if (!this.strokePath) {
            console.error('Could not find stroke path element for index:', strokeIndex);
            return;
        }
        
        // Get stroke bounds for hit detection
        this.strokeBounds = this.strokePath.getBBox();
        
        // Find the start point of this stroke
        const pathData = this.strokePath.getAttribute('d');
        const startMatch = pathData.match(/M\s*([0-9.-]+)[,\s]+([0-9.-]+)/);
        
        if (startMatch) {
            this.startPoint = {
                x: parseFloat(startMatch[1]),
                y: parseFloat(startMatch[2])
            };
        } else {
            // Fallback to top-left of bounds
            this.startPoint = {
                x: this.strokeBounds.x + 10,
                y: this.strokeBounds.y + 10
            };
        }
        
        // Create paint mask for this stroke
        this.createPaintMask();
        
        console.log(`Stroke ${strokeIndex} setup complete. Start point:`, this.startPoint);
    }

    createPaintMask() {
        // Remove existing paint mask
        this.removePaintMask();
        
        // Create a mask that will reveal green paint only inside the number outline
        const defs = this.svg.querySelector('defs') || this.createDefs();
        
        // Create mask element
        const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
        mask.setAttribute('id', `paint-mask-${this.currentStroke}`);
        
        // White background (everything hidden by default)
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        background.setAttribute('width', '100%');
        background.setAttribute('height', '100%');
        background.setAttribute('fill', 'black');
        
        // Use the white stroke path as the mask (white = visible, black = hidden)
        const maskPath = this.strokePath.cloneNode(true);
        maskPath.setAttribute('fill', 'white');
        maskPath.setAttribute('stroke', 'black');
        maskPath.setAttribute('stroke-width', this.strokePath.getAttribute('stroke-width'));
        
        mask.appendChild(background);
        mask.appendChild(maskPath);
        defs.appendChild(mask);
        
        // Create the paint group that will hold our green paint
        this.paintGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.paintGroup.setAttribute('class', `paint-group-${this.currentStroke}`);
        this.paintGroup.setAttribute('mask', `url(#paint-mask-${this.currentStroke})`);
        
        this.svg.appendChild(this.paintGroup);
        
        console.log('Paint mask created for stroke', this.currentStroke);
    }

    createDefs() {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        this.svg.insertBefore(defs, this.svg.firstChild);
        return defs;
    }

    showStartSlider() {
        this.removeSlider();
        
        // Create red slider at start point
        this.slider = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.slider.setAttribute('class', 'paint-start-slider');
        this.slider.setAttribute('transform', `translate(${this.startPoint.x}, ${this.startPoint.y})`);
        
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
        
        // Paint brush icon in center
        const brushIcon = this.createBrushIcon();
        this.slider.appendChild(brushIcon);
        
        this.svg.appendChild(this.slider);
        
        console.log('Start slider created at:', this.startPoint);
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
            this.removeSlider(); // Hide slider when painting starts
            
            // Add starting point to painted area
            this.addPaintAt(point);
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
            this.addPaintAt(point);
        } else {
            // Stop painting if we go outside valid area
            console.log('Paint moved outside valid area - stopping');
            this.handleEnd(event);
        }
    }

    handleEnd(event) {
        if (!this.isPainting) return;
        
        console.log('Paint ended');
        this.isPainting = false;
        
        // Check if stroke is complete
        if (this.isStrokeComplete()) {
            console.log('Stroke completed through painting!');
            this.completeCurrentStroke();
        } else {
            // Show slider again for continuation
            setTimeout(() => {
                this.showContinuationSlider();
            }, 300);
        }
    }

    canPaintAt(point) {
        // Check if point is inside the stroke bounds
        if (!this.isPointInStrokeBounds(point)) {
            return false;
        }
        
        // Check if point is connected to existing paint or start point
        if (this.paintedArea.size === 0) {
            // First paint - must be near start point
            return this.isPointNear(point, this.startPoint, this.brushSize);
        } else {
            // Must be connected to existing painted area
            return this.isPointConnectedToPaint(point);
        }
    }

    isPointInStrokeBounds(point) {
        if (!this.strokeBounds) return false;
        
        return point.x >= this.strokeBounds.x - this.brushSize &&
               point.x <= this.strokeBounds.x + this.strokeBounds.width + this.brushSize &&
               point.y >= this.strokeBounds.y - this.brushSize &&
               point.y <= this.strokeBounds.y + this.strokeBounds.height + this.brushSize;
    }

    isPointConnectedToPaint(point) {
        // Check if point is within brush size of any existing painted area
        for (const paintedPoint of this.paintedArea) {
            const [x, y] = paintedPoint.split(',').map(Number);
            if (this.isPointNear(point, { x, y }, this.brushSize * 1.5)) {
                return true;
            }
        }
        return false;
    }

    addPaintAt(point) {
        // Add point to painted area set
        const key = `${Math.round(point.x)},${Math.round(point.y)}`;
        this.paintedArea.add(key);
        
        // Create visible paint circle
        const paintCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        paintCircle.setAttribute('cx', point.x);
        paintCircle.setAttribute('cy', point.y);
        paintCircle.setAttribute('r', this.brushSize / 2);
        paintCircle.setAttribute('fill', this.paintColor);
        paintCircle.setAttribute('opacity', 0.8);
        paintCircle.setAttribute('class', 'paint-dot');
        
        this.paintGroup.appendChild(paintCircle);
        
        // Update completion percentage
        this.updateCompletionPercentage();
    }

    updateCompletionPercentage() {
        // Estimate completion based on painted area coverage
        const strokeArea = this.strokeBounds.width * this.strokeBounds.height;
        const paintedPixels = this.paintedArea.size * (this.brushSize * this.brushSize);
        const completion = Math.min(paintedPixels / strokeArea, 1.0);
        
        // Notify renderer of progress
        this.renderer.updatePaintProgress(this.currentStroke, completion);
        
        if (completion >= 0.8) { // 80% coverage = complete
            return true;
        }
        return false;
    }

    isStrokeComplete() {
        // Check if we've painted enough of the stroke area
        return this.updateCompletionPercentage();
    }

    showContinuationSlider() {
        // Find the furthest painted point and show slider there
        let furthestPoint = this.startPoint;
        let maxDistance = 0;
        
        for (const paintedPoint of this.paintedArea) {
            const [x, y] = paintedPoint.split(',').map(Number);
            const distance = Math.sqrt(
                Math.pow(x - this.startPoint.x, 2) + 
                Math.pow(y - this.startPoint.y, 2)
            );
            
            if (distance > maxDistance) {
                maxDistance = distance;
                furthestPoint = { x, y };
            }
        }
        
        // Update start point and show slider
        this.startPoint = furthestPoint;
        this.showStartSlider();
        
        console.log('Continuation slider shown at furthest paint point:', furthestPoint);
    }

    completeCurrentStroke() {
        console.log(`Completing stroke ${this.currentStroke} through painting`);
        
        this.isPainting = false;
        this.removeSlider();
        
        // Notify renderer
        this.renderer.completeStroke(this.currentStroke);
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
        
        return this.isPointNear(point, this.startPoint, CONFIG.SLIDER_SIZE / 2 + 10);
    }

    isPointNear(point1, point2, threshold) {
        const distance = Math.sqrt(
            Math.pow(point1.x - point2.x, 2) +
            Math.pow(point1.y - point2.y, 2)
        );
        return distance <= threshold;
    }

    removePaintMask() {
        // Remove existing paint group
        if (this.paintGroup) {
            this.paintGroup.remove();
            this.paintGroup = null;
        }
        
        // Remove existing mask
        const existingMask = this.svg.querySelector(`#paint-mask-${this.currentStroke}`);
        if (existingMask) {
            existingMask.remove();
        }
    }

    cleanup() {
        this.removeSlider();
        this.removePaintMask();
        this.isPainting = false;
        this.paintedArea.clear();
    }

    reset() {
        this.cleanup();
        this.currentStroke = 0;
    }

    // Debug method
    showStrokeBounds() {
        if (!CONFIG.DEBUG_MODE || !this.strokeBounds) return;
        
        const boundsRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        boundsRect.setAttribute('x', this.strokeBounds.x);
        boundsRect.setAttribute('y', this.strokeBounds.y);
        boundsRect.setAttribute('width', this.strokeBounds.width);
        boundsRect.setAttribute('height', this.strokeBounds.height);
        boundsRect.setAttribute('fill', 'none');
        boundsRect.setAttribute('stroke', 'red');
        boundsRect.setAttribute('stroke-width', 2);
        boundsRect.setAttribute('class', 'debug-bounds');
        
        this.svg.appendChild(boundsRect);
    }

    getCurrentProgress() {
        const strokeArea = this.strokeBounds ? this.strokeBounds.width * this.strokeBounds.height : 1;
        const paintedPixels = this.paintedArea.size * (this.brushSize * this.brushSize);
        return Math.min(paintedPixels / strokeArea, 1.0);
    }

    isCurrentlyTracing() {
        return this.isPainting;
    }
}
