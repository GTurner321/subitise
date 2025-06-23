class TracePathManager {
    constructor(svg, renderer) {
        this.svg = svg;
        this.renderer = renderer;
        
        // Slider element - only one at a time
        this.slider = null;
        
        // Tracking state
        this.isTracing = false;
        this.currentStroke = 0;
        this.currentCoordinateIndex = 0; // Which coordinate point we're at
        this.isDragging = false;
        
        // Current stroke data
        this.strokeCoordinates = [];
        this.currentStrokeCoords = [];
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        if (!this.svg) return;
        
        // Mouse events (for desktop testing)
        this.svg.addEventListener('mousedown', (e) => this.handleStart(e));
        this.svg.addEventListener('mousemove', (e) => this.handleMove(e));
        this.svg.addEventListener('mouseup', (e) => this.handleEnd(e));
        this.svg.addEventListener('mouseleave', (e) => this.handleEnd(e));
        
        // Touch events (for mobile)
        this.svg.addEventListener('touchstart', (e) => this.handleStart(e), { passive: false });
        this.svg.addEventListener('touchmove', (e) => this.handleMove(e), { passive: false });
        this.svg.addEventListener('touchend', (e) => this.handleEnd(e));
        this.svg.addEventListener('touchcancel', (e) => this.handleEnd(e));
    }

    startNewStroke(strokeIndex) {
        this.currentStroke = strokeIndex;
        this.currentCoordinateIndex = 0;
        this.isTracing = false;
        this.isDragging = false;
        
        // Get coordinates for this stroke
        this.currentStrokeCoords = this.renderer.getStrokeCoordinates(strokeIndex);
        
        if (!this.currentStrokeCoords || this.currentStrokeCoords.length === 0) {
            console.error('No coordinates available for stroke:', strokeIndex);
            return false;
        }
        
        console.log(`Starting stroke ${strokeIndex} with ${this.currentStrokeCoords.length} coordinates`);
        
        // Remove any existing slider
        this.removeSlider();
        
        // Create slider at first coordinate
        const startPoint = this.currentStrokeCoords[0];
        this.createSlider(startPoint);
        
        return true;
    }

    createSlider(position) {
        // Remove existing slider
        this.removeSlider();
        
        // Create new slider circle
        this.slider = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.slider.setAttribute('cx', position.x);
        this.slider.setAttribute('cy', position.y);
        this.slider.setAttribute('r', CONFIG.SLIDER_SIZE / 2);
        this.slider.setAttribute('fill', CONFIG.SLIDER_COLOR);
        this.slider.setAttribute('stroke', 'white');
        this.slider.setAttribute('stroke-width', 3);
        this.slider.setAttribute('class', 'trace-slider');
        this.slider.setAttribute('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))');
        
        // Add pulsing animation to indicate it's interactive
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'r');
        animate.setAttribute('values', `${CONFIG.SLIDER_SIZE / 2};${CONFIG.SLIDER_SIZE / 2 + 3};${CONFIG.SLIDER_SIZE / 2}`);
        animate.setAttribute('dur', '2s');
        animate.setAttribute('repeatCount', 'indefinite');
        
        this.slider.appendChild(animate);
        this.svg.appendChild(this.slider);
        
        console.log(`Created slider at coordinate ${this.currentCoordinateIndex}:`, position);
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
        
        // Check if touch/click started near the slider
        if (this.isPointNearSlider(point)) {
            this.isDragging = true;
            this.isTracing = true;
            
            // Remove the pulsing animation when user starts tracing
            const animate = this.slider.querySelector('animate');
            if (animate) {
                animate.remove();
            }
            
            console.log('Started tracing at coordinate index:', this.currentCoordinateIndex);
        }
    }

    handleMove(event) {
        if (!this.isDragging || !this.isTracing) return;
        
        event.preventDefault();
        const point = this.getEventPoint(event);
        if (!point) return;
        
        // Try to advance to the next coordinate
        this.tryAdvanceToNextCoordinate(point);
    }

    handleEnd(event) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        console.log('Ended tracing at coordinate index:', this.currentCoordinateIndex);
    }

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
        
        // Convert to SVG coordinates
        const scaleX = CONFIG.SVG_WIDTH / rect.width;
        const scaleY = CONFIG.SVG_HEIGHT / rect.height;
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    isPointNearSlider(point) {
        if (!this.slider) return false;
        
        const sliderX = parseFloat(this.slider.getAttribute('cx'));
        const sliderY = parseFloat(this.slider.getAttribute('cy'));
        
        const distance = Math.sqrt(
            Math.pow(point.x - sliderX, 2) +
            Math.pow(point.y - sliderY, 2)
        );
        
        return distance <= CONFIG.SLIDER_SIZE;
    }

    tryAdvanceToNextCoordinate(dragPoint) {
        // Check if we've reached the end of coordinates
        if (this.currentCoordinateIndex >= this.currentStrokeCoords.length - 1) {
            // Stroke is complete
            this.completeCurrentStroke();
            return;
        }
        
        const currentCoord = this.currentStrokeCoords[this.currentCoordinateIndex];
        const nextCoord = this.currentStrokeCoords[this.currentCoordinateIndex + 1];
        
        // Calculate direction vector from current to next coordinate
        const directionX = nextCoord.x - currentCoord.x;
        const directionY = nextCoord.y - currentCoord.y;
        const directionLength = Math.sqrt(directionX * directionX + directionY * directionY);
        
        if (directionLength === 0) {
            // Duplicate coordinates, advance immediately
            this.advanceToCoordinate(this.currentCoordinateIndex + 1);
            return;
        }
        
        // Normalize direction vector
        const directionUnitX = directionX / directionLength;
        const directionUnitY = directionY / directionLength;
        
        // Calculate drag vector from current coordinate to drag point
        const dragX = dragPoint.x - currentCoord.x;
        const dragY = dragPoint.y - currentCoord.y;
        
        // Calculate dot product to see how much the drag is in the direction of movement
        const dotProduct = dragX * directionUnitX + dragY * directionUnitY;
        
        // Calculate distance from drag point to the line between current and next coordinate
        const dragLength = Math.sqrt(dragX * dragX + dragY * dragY);
        const projectionLength = Math.abs(dotProduct);
        const perpendicularDistance = Math.sqrt(Math.max(0, dragLength * dragLength - projectionLength * projectionLength));
        
        // Check if drag is within tolerance and in correct direction
        const withinTolerance = perpendicularDistance <= CONFIG.PATH_TOLERANCE;
        const correctDirection = dotProduct > 0; // Positive means drag is in forward direction
        const reachedNext = projectionLength >= directionLength; // Dragged far enough to reach next coordinate
        
        if (withinTolerance && correctDirection) {
            if (reachedNext) {
                // Advanced far enough to reach the next coordinate
                this.advanceToCoordinate(this.currentCoordinateIndex + 1);
            } else {
                // Move slider along the line proportionally to how far we've dragged
                const progress = Math.min(projectionLength / directionLength, 1);
                const intermediateX = currentCoord.x + directionX * progress;
                const intermediateY = currentCoord.y + directionY * progress;
                
                // Update slider position
                this.slider.setAttribute('cx', intermediateX);
                this.slider.setAttribute('cy', intermediateY);
                
                // Update traced path to show partial progress
                this.updatePartialProgress(progress);
            }
        } else if (withinTolerance && dotProduct < 0) {
            // Dragging backwards - allow going back to previous coordinates
            this.handleBackwardDrag(dragPoint, Math.abs(dotProduct));
        }
        // If not within tolerance or wrong direction, don't move slider
    }

    advanceToCoordinate(newCoordIndex) {
        if (newCoordIndex >= this.currentStrokeCoords.length) {
            this.completeCurrentStroke();
            return;
        }
        
        this.currentCoordinateIndex = newCoordIndex;
        const newCoord = this.currentStrokeCoords[newCoordIndex];
        
        // Move slider to exact coordinate position
        this.slider.setAttribute('cx', newCoord.x);
        this.slider.setAttribute('cy', newCoord.y);
        
        // Update traced path to show progress up to this coordinate
        this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
        
        console.log(`Advanced to coordinate ${this.currentCoordinateIndex} of ${this.currentStrokeCoords.length - 1}`);
        
        // Check if stroke is complete
        if (this.currentCoordinateIndex >= this.currentStrokeCoords.length - 1) {
            this.completeCurrentStroke();
        }
    }

    updatePartialProgress(progress) {
        // For now, we only update on full coordinate completion
        // This could be enhanced to show intermediate progress
    }

    handleBackwardDrag(dragPoint, backwardDistance) {
        // Allow dragging backward to previous coordinates
        if (this.currentCoordinateIndex > 0) {
            const currentCoord = this.currentStrokeCoords[this.currentCoordinateIndex];
            const prevCoord = this.currentStrokeCoords[this.currentCoordinateIndex - 1];
            
            const distanceToPrev = Math.sqrt(
                Math.pow(prevCoord.x - currentCoord.x, 2) +
                Math.pow(prevCoord.y - currentCoord.y, 2)
            );
            
            // If dragged back far enough, go to previous coordinate
            if (backwardDistance >= distanceToPrev * 0.5) { // 50% threshold
                this.currentCoordinateIndex--;
                const prevCoord = this.currentStrokeCoords[this.currentCoordinateIndex];
                
                // Move slider to previous coordinate
                this.slider.setAttribute('cx', prevCoord.x);
                this.slider.setAttribute('cy', prevCoord.y);
                
                // Update traced path
                this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
                
                console.log(`Moved back to coordinate ${this.currentCoordinateIndex}`);
            }
        }
    }

    completeCurrentStroke() {
        console.log(`Completing stroke ${this.currentStroke}`);
        
        this.isTracing = false;
        this.isDragging = false;
        
        // Hide slider for current stroke
        if (this.slider) {
            this.slider.style.opacity = '0';
        }
        
        // Remove slider after fade
        setTimeout(() => {
            this.removeSlider();
        }, 300);
        
        // Notify renderer of completion
        this.renderer.completeStroke(this.currentStroke);
    }

    moveToNextStroke() {
        const nextStroke = this.currentStroke + 1;
        const totalStrokes = this.renderer.getStrokeCount();
        
        if (nextStroke < totalStrokes) {
            // Small delay before starting next stroke
            setTimeout(() => {
                this.startNewStroke(nextStroke);
            }, 500);
            return true;
        }
        return false;
    }

    getCurrentProgress() {
        if (this.currentStrokeCoords.length === 0) return 0;
        return this.currentCoordinateIndex / (this.currentStrokeCoords.length - 1);
    }

    isCurrentlyTracing() {
        return this.isTracing;
    }

    cleanup() {
        // Remove slider
        this.removeSlider();
        
        this.isTracing = false;
        this.isDragging = false;
        this.currentCoordinateIndex = 0;
        this.currentStrokeCoords = [];
    }

    reset() {
        this.cleanup();
        this.currentStroke = 0;
    }

    // Debug methods
    showCoordinatePoints() {
        if (!CONFIG.DEBUG_MODE || !this.currentStrokeCoords) return;
        
        // Remove existing debug points
        const existingPoints = this.svg.querySelectorAll('.debug-coord-point');
        existingPoints.forEach(point => point.remove());
        
        this.currentStrokeCoords.forEach((coord, index) => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', coord.x);
            circle.setAttribute('cy', coord.y);
            circle.setAttribute('r', 3);
            circle.setAttribute('fill', index === this.currentCoordinateIndex ? 'red' : 'blue');
            circle.setAttribute('class', 'debug-coord-point');
            
            // Add coordinate index as text
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', coord.x + 5);
            text.setAttribute('y', coord.y - 5);
            text.setAttribute('font-size', '10');
            text.setAttribute('fill', 'black');
            text.setAttribute('class', 'debug-coord-point');
            text.textContent = index;
            
            this.svg.appendChild(circle);
            this.svg.appendChild(text);
        });
    }
}
