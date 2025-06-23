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
        if (this.isPointNearSlider(point, false)) { // false = not during drag, initial touch
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
        
        // Check if the drag point is still near the slider - if not, stop tracing
        if (!this.isPointNearSlider(point, true)) { // true = during drag
            console.log('Drag moved outside slider area, stopping trace');
            this.stopTracing();
            return;
        }
        
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

    isPointNearSlider(point, isDuringDrag = false) {
        if (!this.slider) return false;
        
        const sliderX = parseFloat(this.slider.getAttribute('cx'));
        const sliderY = parseFloat(this.slider.getAttribute('cy'));
        
        const distance = Math.sqrt(
            Math.pow(point.x - sliderX, 2) +
            Math.pow(point.y - sliderY, 2)
        );
        
        // Different tolerances for initial touch vs during drag
        if (isDuringDrag) {
            // During drag, use a slightly larger area but not too large
            return distance <= CONFIG.SLIDER_SIZE * 1.2;
        } else {
            // For initial touch, use larger area for easier grabbing
            return distance <= CONFIG.SLIDER_SIZE * 1.5;
        }
    }

    tryAdvanceToNextCoordinate(dragPoint) {
        // Find the best position along the entire path where the slider should be
        const bestPosition = this.findBestSliderPosition(dragPoint);
        
        if (bestPosition !== null) {
            this.updateSliderPosition(bestPosition);
        }
    }

    findBestSliderPosition(dragPoint) {
        let bestCoordIndex = this.currentCoordinateIndex;
        let bestProgress = 0;
        let bestDistance = Infinity;
        
        // Check current segment and a few ahead/behind for the closest valid position
        const searchRange = 3; // Look 3 coordinates ahead and behind
        const startIndex = Math.max(0, this.currentCoordinateIndex - searchRange);
        const endIndex = Math.min(this.currentStrokeCoords.length - 2, this.currentCoordinateIndex + searchRange);
        
        for (let i = startIndex; i <= endIndex; i++) {
            const currentCoord = this.currentStrokeCoords[i];
            const nextCoord = this.currentStrokeCoords[i + 1];
            
            // Calculate segment direction
            const segmentX = nextCoord.x - currentCoord.x;
            const segmentY = nextCoord.y - currentCoord.y;
            const segmentLength = Math.sqrt(segmentX * segmentX + segmentY * segmentY);
            
            if (segmentLength === 0) continue; // Skip zero-length segments
            
            // Find closest point on this segment to drag point
            const dragX = dragPoint.x - currentCoord.x;
            const dragY = dragPoint.y - currentCoord.y;
            
            // Project drag vector onto segment
            const dotProduct = (dragX * segmentX + dragY * segmentY) / segmentLength;
            const projectionProgress = Math.max(0, Math.min(segmentLength, dotProduct)) / segmentLength;
            
            // Calculate point on segment
            const pointX = currentCoord.x + segmentX * projectionProgress;
            const pointY = currentCoord.y + segmentY * projectionProgress;
            
            // Calculate distance from drag point to this segment point
            const distanceToSegment = Math.sqrt(
                Math.pow(dragPoint.x - pointX, 2) + 
                Math.pow(dragPoint.y - pointY, 2)
            );
            
            // Check if this is the best position so far and within tolerance
            if (distanceToSegment < bestDistance && distanceToSegment <= CONFIG.PATH_TOLERANCE) {
                // Additional check: if moving forward, ensure there's forward component
                if (i > this.currentCoordinateIndex || 
                    (i === this.currentCoordinateIndex && projectionProgress > 0)) {
                    
                    // Check if drag has forward component for this segment
                    const dragForwardComponent = dotProduct / segmentLength;
                    
                    if (dragForwardComponent >= 0 || i < this.currentCoordinateIndex) {
                        bestDistance = distanceToSegment;
                        bestCoordIndex = i;
                        bestProgress = projectionProgress;
                    }
                } else if (i < this.currentCoordinateIndex) {
                    // Allow backward movement
                    bestDistance = distanceToSegment;
                    bestCoordIndex = i;
                    bestProgress = projectionProgress;
                }
            }
        }
        
        // Only return position if within tolerance and represents valid movement
        if (bestDistance <= CONFIG.PATH_TOLERANCE) {
            return {
                coordIndex: bestCoordIndex,
                progress: bestProgress,
                distance: bestDistance
            };
        }
        
        return null;
    }

    updateSliderPosition(position) {
        const { coordIndex, progress } = position;
        const currentCoord = this.currentStrokeCoords[coordIndex];
        const nextCoord = this.currentStrokeCoords[coordIndex + 1];
        
        // Calculate slider position along the segment
        const sliderX = currentCoord.x + (nextCoord.x - currentCoord.x) * progress;
        const sliderY = currentCoord.y + (nextCoord.y - currentCoord.y) * progress;
        
        // Update slider visual position
        this.slider.setAttribute('cx', sliderX);
        this.slider.setAttribute('cy', sliderY);
        
        // Determine how many complete coordinates we've passed
        let completedCoords = coordIndex;
        if (progress >= 0.95) { // 95% threshold to complete a coordinate
            completedCoords = coordIndex + 1;
        }
        
        // Update current coordinate index if we've advanced
        if (completedCoords !== this.currentCoordinateIndex) {
            this.currentCoordinateIndex = completedCoords;
            
            // Update traced path to show progress
            this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
            
            console.log(`Advanced to coordinate ${this.currentCoordinateIndex} of ${this.currentStrokeCoords.length - 1}`);
            
            // Check if stroke is complete
            if (this.currentCoordinateIndex >= this.currentStrokeCoords.length - 1) {
                this.completeCurrentStroke();
            }
        }
    }

    stopTracing() {
        this.isTracing = false;
        this.isDragging = false;
        
        console.log('Tracing stopped - finger/cursor moved outside slider area');
        
        // Re-enable the pulsing animation to indicate the slider is ready for interaction again
        if (this.slider) {
            // Remove any existing animation first
            const existingAnimate = this.slider.querySelector('animate');
            if (existingAnimate) {
                existingAnimate.remove();
            }
            
            // Add pulsing animation back
            const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
            animate.setAttribute('attributeName', 'r');
            animate.setAttribute('values', `${CONFIG.SLIDER_SIZE / 2};${CONFIG.SLIDER_SIZE / 2 + 3};${CONFIG.SLIDER_SIZE / 2}`);
            animate.setAttribute('dur', '2s');
            animate.setAttribute('repeatCount', 'indefinite');
            
            this.slider.appendChild(animate);
        }
    }
    advanceToCoordinate(newCoordIndex) {
        // This method is now handled by updateSliderPosition
        // Keeping for backward compatibility but functionality moved
    }

    updatePartialProgress(progress) {
        // Handled by updateSliderPosition now
    }

    handleBackwardDrag(dragPoint, backwardDistance) {
        // Handled by findBestSliderPosition now
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
