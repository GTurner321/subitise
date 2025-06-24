class TracePathManager {
    constructor(svg, renderer) {
        this.svg = svg;
        this.renderer = renderer;
        
        // Slider element - only one at a time
        this.slider = null;
        
        // Tracking state
        this.isTracing = false;
        this.currentStroke = 0;
        this.currentCoordinateIndex = 0; // Where GREEN trace has reached
        this.isDragging = false;
        
        // Current stroke data
        this.strokeCoordinates = [];
        this.currentStrokeCoords = [];
        
        this.lastMovementTime = Date.now();
        
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
        this.currentCoordinateIndex = 0; // Start GREEN trace at beginning
        this.isTracing = false;
        this.isDragging = false;
        this.lastMovementTime = Date.now();
        
        // Get coordinates for this stroke
        this.currentStrokeCoords = this.renderer.getStrokeCoordinates(strokeIndex);
        
        if (!this.currentStrokeCoords || this.currentStrokeCoords.length === 0) {
            console.error('No coordinates available for stroke:', strokeIndex);
            return false;
        }
        
        console.log(`Starting stroke ${strokeIndex} with ${this.currentStrokeCoords.length} coordinates`);
        
        // Show red slider at the start position
        this.showSliderAtCurrentPosition();
        
        return true;
    }

    showSliderAtCurrentPosition() {
        // Remove any existing slider
        this.removeSlider();
        
        // Get position where GREEN trace currently ends
        const position = this.currentStrokeCoords[this.currentCoordinateIndex];
        if (!position) {
            console.error('No position available for slider at index:', this.currentCoordinateIndex);
            return;
        }
        
        // Create slider at the current GREEN trace position
        this.createSliderWithArrow(position);
        
        console.log(`Red slider shown at coordinate ${this.currentCoordinateIndex}:`, position);
    }

    createSliderWithArrow(position) {
        // Remove existing slider
        this.removeSlider();
        
        // Create slider group
        this.slider = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.slider.setAttribute('class', 'trace-slider-group');
        this.slider.setAttribute('transform', `translate(${position.x}, ${position.y})`);
        
        // Create main red circle
        const sliderCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        sliderCircle.setAttribute('cx', 0);
        sliderCircle.setAttribute('cy', 0);
        sliderCircle.setAttribute('r', CONFIG.SLIDER_SIZE / 2);
        sliderCircle.setAttribute('fill', CONFIG.SLIDER_COLOR);
        sliderCircle.setAttribute('stroke', 'white');
        sliderCircle.setAttribute('stroke-width', 3);
        sliderCircle.setAttribute('class', 'slider-circle');
        sliderCircle.setAttribute('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))');
        
        // Add pulsing animation
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'r');
        animate.setAttribute('values', `${CONFIG.SLIDER_SIZE / 2};${CONFIG.SLIDER_SIZE / 2 + 3};${CONFIG.SLIDER_SIZE / 2}`);
        animate.setAttribute('dur', '2s');
        animate.setAttribute('repeatCount', 'indefinite');
        animate.setAttribute('class', 'pulse-animation');
        
        sliderCircle.appendChild(animate);
        this.slider.appendChild(sliderCircle);
        
        // Create directional arrow pointing to next coordinate
        this.createDirectionalArrow();
        
        this.svg.appendChild(this.slider);
        
        console.log(`Created slider with directional arrow at:`, position);
    }

    createDirectionalArrow() {
        // Calculate direction to next coordinate point
        const currentPos = this.currentStrokeCoords[this.currentCoordinateIndex];
        const nextIndex = Math.min(this.currentCoordinateIndex + 1, this.currentStrokeCoords.length - 1);
        const nextPos = this.currentStrokeCoords[nextIndex];
        
        if (!currentPos || !nextPos || nextIndex === this.currentCoordinateIndex) {
            // No direction to show (at end) - create a checkmark instead
            this.createCompletionIndicator();
            return;
        }
        
        // Calculate direction vector
        const directionX = nextPos.x - currentPos.x;
        const directionY = nextPos.y - currentPos.y;
        const directionLength = Math.sqrt(directionX * directionX + directionY * directionY);
        
        if (directionLength === 0) return; // No direction
        
        // Calculate rotation angle
        const angle = Math.atan2(directionY, directionX) * 180 / Math.PI;
        
        // Create arrow group
        const arrowGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        arrowGroup.setAttribute('class', 'direction-arrow-embedded');
        arrowGroup.setAttribute('transform', `rotate(${angle})`);
        
        // Create arrow path (pointing right by default)
        const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const arrowSize = 12; // Smaller to fit inside circle
        arrowPath.setAttribute('d', `M -${arrowSize/2} -${arrowSize/3} L ${arrowSize/2} 0 L -${arrowSize/2} ${arrowSize/3} Z`);
        arrowPath.setAttribute('fill', 'white');
        arrowPath.setAttribute('stroke', 'none');
        
        arrowGroup.appendChild(arrowPath);
        this.slider.appendChild(arrowGroup);
        
        console.log(`Created directional arrow pointing ${angle.toFixed(1)}° toward coordinate ${nextIndex}`);
    }

    createCompletionIndicator() {
        // Create checkmark when at end of stroke
        const checkGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        checkGroup.setAttribute('class', 'completion-indicator');
        
        const checkPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        checkPath.setAttribute('d', 'M -6 -1 L -2 3 L 6 -5');
        checkPath.setAttribute('stroke', 'white');
        checkPath.setAttribute('stroke-width', 3);
        checkPath.setAttribute('fill', 'none');
        checkPath.setAttribute('stroke-linecap', 'round');
        checkPath.setAttribute('stroke-linejoin', 'round');
        
        checkGroup.appendChild(checkPath);
        this.slider.appendChild(checkGroup);
        
        console.log('Created completion checkmark indicator');
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
        
        // Check if touch is within the red slider circle
        if (this.isPointNearSlider(point)) {
            console.log('Valid touch within slider circle - starting drag');
            this.isDragging = true;
            this.isTracing = true;
            
            // IMMEDIATELY hide the red slider when dragging starts
            this.removeSlider();
            
            console.log('Red slider hidden - now in free-form tracing mode');
        } else {
            console.log('Touch outside slider circle - drag not started');
        }
    }

    handleMove(event) {
        if (!this.isDragging || !this.isTracing) return;
        
        event.preventDefault();
        const point = this.getEventPoint(event);
        if (!point) return;
        
        // Update movement time
        this.lastMovementTime = Date.now();
        
        // CRITICAL FIX: Update GREEN trace progress independently
        this.updateGreenTraceProgress(point);
    }

    handleEnd(event) {
        if (!this.isDragging) return;
        
        console.log('Drag ended - finger lifted');
        this.isDragging = false;
        this.isTracing = false;
        
        // Show red slider IMMEDIATELY at current GREEN trace position
        this.showSliderAtCurrentPosition();
        
        console.log('Red slider reappeared immediately at current trace position');
    }

    updateGreenTraceProgress(dragPoint) {
        // Find the furthest point along the path that we can reach from drag point
        let bestCoordIndex = this.currentCoordinateIndex;
        let foundValidProgress = false;
        
        // Look ahead along the path to see how far we can extend the GREEN trace
        const lookAheadDistance = 8; // Look up to 8 coordinates ahead
        const maxReachDistance = 80; // Maximum distance finger can be from path point
        
        // Start from current position and look forward
        for (let i = this.currentCoordinateIndex; i < Math.min(this.currentStrokeCoords.length, this.currentCoordinateIndex + lookAheadDistance); i++) {
            const pathPoint = this.currentStrokeCoords[i];
            const distanceToPath = Math.sqrt(
                Math.pow(dragPoint.x - pathPoint.x, 2) + 
                Math.pow(dragPoint.y - pathPoint.y, 2)
            );
            
            // If finger is reasonably close to this path point, we can extend trace to here
            if (distanceToPath <= maxReachDistance) {
                bestCoordIndex = i;
                foundValidProgress = true;
            } else {
                // Stop looking further if we're too far from path
                break;
            }
        }
        
        // Also check backwards movement
        if (!foundValidProgress || bestCoordIndex <= this.currentCoordinateIndex) {
            const backtrackDistance = 5;
            for (let i = this.currentCoordinateIndex; i >= Math.max(0, this.currentCoordinateIndex - backtrackDistance); i--) {
                const pathPoint = this.currentStrokeCoords[i];
                const distanceToPath = Math.sqrt(
                    Math.pow(dragPoint.x - pathPoint.x, 2) + 
                    Math.pow(dragPoint.y - pathPoint.y, 2)
                );
                
                if (distanceToPath <= maxReachDistance) {
                    bestCoordIndex = i;
                    foundValidProgress = true;
                    break;
                }
            }
        }
        
        // Check if drag has strayed too far from path (break connection)
        if (!foundValidProgress) {
            console.log('Drag strayed too far from path - breaking connection');
            this.breakDragConnection();
            return;
        }
        
        // Update GREEN trace if we made progress (forward or backward)
        if (bestCoordIndex !== this.currentCoordinateIndex) {
            const oldIndex = this.currentCoordinateIndex;
            this.currentCoordinateIndex = bestCoordIndex;
            
            // Update the GREEN traced path in the renderer
            this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
            
            if (bestCoordIndex > oldIndex) {
                console.log(`✅ GREEN trace extended from coordinate ${oldIndex} to ${this.currentCoordinateIndex}`);
            } else {
                console.log(`↩️ GREEN trace reduced from coordinate ${oldIndex} to ${this.currentCoordinateIndex}`);
            }
            
            // Check if stroke is complete
            if (this.currentCoordinateIndex >= this.currentStrokeCoords.length - 1) {
                console.log('Stroke completed - GREEN trace reached end!');
                this.completeCurrentStroke();
                return; // Don't continue processing after completion
            }
        }
    }

    // New method: Break drag connection and restore red slider immediately
    breakDragConnection() {
        if (!this.isDragging) return;
        
        console.log('Breaking drag connection - finger strayed too far from path');
        this.isDragging = false;
        this.isTracing = false;
        
        // Show red slider IMMEDIATELY at current GREEN trace position
        this.showSliderAtCurrentPosition();
        
        console.log('Red slider restored immediately due to broken connection');
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
        
        // Get slider position from transform
        const transform = this.slider.getAttribute('transform');
        const match = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
        
        if (!match) return false;
        
        const sliderX = parseFloat(match[1]);
        const sliderY = parseFloat(match[2]);
        
        const distance = Math.sqrt(
            Math.pow(point.x - sliderX, 2) +
            Math.pow(point.y - sliderY, 2)
        );
        
        // Allow touching within slider radius plus buffer
        const sliderRadius = CONFIG.SLIDER_SIZE / 2;
        return distance <= sliderRadius + 10; // 10px buffer
    }

    completeCurrentStroke() {
        console.log(`Completing stroke ${this.currentStroke}`);
        
        this.isTracing = false;
        this.isDragging = false;
        
        // Remove slider immediately when stroke completes
        this.removeSlider();
        
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
