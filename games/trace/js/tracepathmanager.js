class TracePathManager {
    constructor(svg, renderer) {
        this.svg = svg;
        this.renderer = renderer;
        
        // Slider element - only one at a time
        this.slider = null;
        this.directionArrow = null;
        
        // Tracking state
        this.isTracing = false;
        this.currentStroke = 0;
        this.currentCoordinateIndex = 0; // Which coordinate point we're at
        this.isDragging = false;
        this.lastSliderPosition = { x: 0, y: 0 };
        this.lastUpdateTime = Date.now();
        
        // Current stroke data
        this.strokeCoordinates = [];
        this.currentStrokeCoords = [];
        
        // Arrow timing
        this.arrowTimeout = null;
        this.lastMovementTime = Date.now();
        this.stoppedMovementTimeout = null;
        
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
        this.lastMovementTime = Date.now();
        this.lastUpdateTime = Date.now();
        
        // Get coordinates for this stroke
        this.currentStrokeCoords = this.renderer.getStrokeCoordinates(strokeIndex);
        
        if (!this.currentStrokeCoords || this.currentStrokeCoords.length === 0) {
            console.error('No coordinates available for stroke:', strokeIndex);
            return false;
        }
        
        console.log(`Starting stroke ${strokeIndex} with ${this.currentStrokeCoords.length} coordinates`);
        
        // Remove any existing slider and arrow
        this.removeSlider();
        this.removeDirectionArrow();
        
        // Create slider at first coordinate
        const startPoint = this.currentStrokeCoords[0];
        this.createSlider(startPoint);
        
        // Initialize slider position tracking
        this.lastSliderPosition = { x: startPoint.x, y: startPoint.y };
        
        // Start arrow timeout
        this.startArrowTimeout();
        
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

    createDirectionArrow() {
        if (this.directionArrow || !this.currentStrokeCoords || this.currentStrokeCoords.length < 2) {
            return;
        }
        
        // Get current position and next few positions to determine direction
        const currentIndex = Math.min(this.currentCoordinateIndex, this.currentStrokeCoords.length - 2);
        const nextIndex = Math.min(currentIndex + 1, this.currentStrokeCoords.length - 1);
        
        // Look ahead a bit more for smoother direction
        const lookAheadIndex = Math.min(currentIndex + 3, this.currentStrokeCoords.length - 1);
        
        const currentPos = this.currentStrokeCoords[currentIndex];
        const targetPos = this.currentStrokeCoords[lookAheadIndex];
        
        // Calculate direction vector
        const dx = targetPos.x - currentPos.x;
        const dy = targetPos.y - currentPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return; // No direction to show
        
        // Normalize direction and calculate arrow position
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        
        // Position arrow ahead of slider in the direction of movement
        const arrowDistance = CONFIG.ARROW_OFFSET;
        const arrowX = currentPos.x + normalizedDx * arrowDistance;
        const arrowY = currentPos.y + normalizedDy * arrowDistance;
        
        // Calculate rotation angle for the direction of movement (add 180 degrees to flip)
        const angle = (Math.atan2(dy, dx) * 180 / Math.PI) + 180;
        
        // Create arrow group
        this.directionArrow = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.directionArrow.setAttribute('class', 'direction-arrow');
        this.directionArrow.setAttribute('transform', `translate(${arrowX}, ${arrowY}) rotate(${angle})`);
        
        // Create arrow path (pointing right by default, rotation handles direction)
        const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const arrowSize = CONFIG.ARROW_SIZE;
        // Arrow points forward in direction of movement
        arrowPath.setAttribute('d', `M 0 0 L ${arrowSize} ${arrowSize/2} L ${arrowSize} ${-arrowSize/2} Z`);
        arrowPath.setAttribute('fill', CONFIG.ARROW_COLOR);
        arrowPath.setAttribute('stroke', 'white');
        arrowPath.setAttribute('stroke-width', 2);
        arrowPath.setAttribute('filter', 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))');
        
        this.directionArrow.appendChild(arrowPath);
        
        // Add flashing animation
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'opacity');
        animate.setAttribute('values', '1;0.3;1');
        animate.setAttribute('dur', '1.5s');
        animate.setAttribute('repeatCount', 'indefinite');
        
        this.directionArrow.appendChild(animate);
        
        // Insert before slider to keep slider on top
        if (this.slider) {
            this.svg.insertBefore(this.directionArrow, this.slider);
        } else {
            this.svg.appendChild(this.directionArrow);
        }
        
        console.log(`Created direction arrow at (${arrowX}, ${arrowY}) with angle ${angle}° pointing away from slider`);
    }

    removeDirectionArrow() {
        if (this.directionArrow) {
            this.directionArrow.remove();
            this.directionArrow = null;
        }
    }

    startArrowTimeout() {
        // Clear existing timeout
        if (this.arrowTimeout) {
            clearTimeout(this.arrowTimeout);
        }
        
        // Set new timeout to show arrow after inactivity
        this.arrowTimeout = setTimeout(() => {
            if (!this.isTracing && !this.isDragging) {
                this.createDirectionArrow();
            }
        }, CONFIG.ARROW_TIMEOUT);
    }

    resetArrowTimeout() {
        this.removeDirectionArrow();
        this.startArrowTimeout();
        this.lastMovementTime = Date.now();
        
        // Also reset stopped movement timeout
        this.resetStoppedMovementTimeout();
    }

    startStoppedMovementTimeout() {
        // Only start if we're near the end and not already tracing
        if (this.isNearCompletion() && !this.isTracing) {
            this.stoppedMovementTimeout = setTimeout(() => {
                if (!this.isTracing && !this.isDragging && this.isNearCompletion()) {
                    console.log('Auto-completing due to stopped movement near end');
                    this.autoCompleteFromNearEnd();
                }
            }, CONFIG.STOPPED_MOVEMENT_TIMEOUT);
        }
    }

    resetStoppedMovementTimeout() {
        if (this.stoppedMovementTimeout) {
            clearTimeout(this.stoppedMovementTimeout);
            this.stoppedMovementTimeout = null;
        }
    }

    isNearCompletion() {
        const totalCoords = this.currentStrokeCoords.length;
        const remainingCoords = totalCoords - 1 - this.currentCoordinateIndex;
        // Near completion if within 2 coordinates of the end
        return remainingCoords <= 2 && remainingCoords > 0;
    }

    autoCompleteFromNearEnd() {
        // Complete the current stroke if we're near the end
        if (this.isNearCompletion()) {
            console.log('Auto-completing stroke from near end position');
            this.currentCoordinateIndex = this.currentStrokeCoords.length - 1;
            this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
            this.completeCurrentStroke();
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
            
            // Hide direction arrow when starting to trace
            this.removeDirectionArrow();
            if (this.arrowTimeout) {
                clearTimeout(this.arrowTimeout);
                this.arrowTimeout = null;
            }
            
            console.log('Started tracing at coordinate index:', this.currentCoordinateIndex);
        }
    }

    handleMove(event) {
        if (!this.isDragging || !this.isTracing) return;
        
        event.preventDefault();
        const point = this.getEventPoint(event);
        if (!point) return;
        
        // Update movement time and reset timeouts
        this.lastMovementTime = Date.now();
        this.resetStoppedMovementTimeout();
        
        // Check if the finger is still within acceptable distance of the slider
        // This is more forgiving than before - finger can be further from slider
        if (!this.isPointNearSlider(point, true)) { // true = during drag
            console.log('Drag moved too far from slider, stopping trace');
            this.stopTracing();
            return;
        }
        
        // Try to advance to the next coordinate
        this.tryAdvanceToNextCoordinate(point);
    }

    handleEnd(event) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        // Start arrow timeout again if not tracing
        if (!this.isTracing) {
            this.startArrowTimeout();
        }
        
        // Start stopped movement timeout if near completion
        this.startStoppedMovementTimeout();
        
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
            // During drag, use the configurable drag tolerance (increased)
            return distance <= CONFIG.SLIDER_DRAG_TOLERANCE;
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
        
        // Check current segment and next segment only (no skipping ahead)
        const maxLookAhead = 1; // Only current and next segment
        const startIndex = this.currentCoordinateIndex;
        const endIndex = Math.min(this.currentStrokeCoords.length - 2, this.currentCoordinateIndex + maxLookAhead);
        
        for (let i = startIndex; i <= endIndex; i++) {
            const currentCoord = this.currentStrokeCoords[i];
            const nextCoord = this.currentStrokeCoords[i + 1];
            
            if (!nextCoord) continue; // Skip if no next coordinate
            
            // Calculate segment direction
            const segmentX = nextCoord.x - currentCoord.x;
            const segmentY = nextCoord.y - currentCoord.y;
            const segmentLength = Math.sqrt(segmentX * segmentX + segmentY * segmentY);
            
            if (segmentLength === 0) continue; // Skip zero-length segments
            
            // Find closest point on this line segment to drag point
            const dragX = dragPoint.x - currentCoord.x;
            const dragY = dragPoint.y - currentCoord.y;
            
            // Project drag vector onto segment
            const dotProduct = (dragX * segmentX + dragY * segmentY);
            const projectionLength = dotProduct / segmentLength;
            const projectionProgress = Math.max(0, Math.min(segmentLength, projectionLength)) / segmentLength;
            
            // Calculate the actual point on the line segment
            const pointX = currentCoord.x + segmentX * projectionProgress;
            const pointY = currentCoord.y + segmentY * projectionProgress;
            
            // Calculate distance from drag point to this point on the segment
            const distanceToSegment = Math.sqrt(
                Math.pow(dragPoint.x - pointX, 2) + 
                Math.pow(dragPoint.y - pointY, 2)
            );
            
            // Check if this is within tolerance and represents valid movement
            if (distanceToSegment <= CONFIG.PATH_TOLERANCE) {
                // For forward movement: ensure we're moving in the right direction
                if (i > this.currentCoordinateIndex) {
                    // Moving to next segment - require forward component
                    if (projectionLength >= 0 && distanceToSegment < bestDistance) {
                        bestDistance = distanceToSegment;
                        bestCoordIndex = i;
                        bestProgress = projectionProgress;
                    }
                } else if (i === this.currentCoordinateIndex) {
                    // Current segment - allow movement but prefer forward
                    if (distanceToSegment < bestDistance) {
                        bestDistance = distanceToSegment;
                        bestCoordIndex = i;
                        bestProgress = projectionProgress;
                    }
                }
            }
        }
        
        // Only return position if within tolerance
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
        
        if (!currentCoord || !nextCoord) {
            console.error('Invalid coordinates for segment:', coordIndex);
            return;
        }
        
        // Calculate slider position along the linear segment between coordinates
        // This keeps the slider ON THE PATH but allows smooth movement between points
        const sliderX = currentCoord.x + (nextCoord.x - currentCoord.x) * progress;
        const sliderY = currentCoord.y + (nextCoord.y - currentCoord.y) * progress;
        
        // Apply speed limiting if needed
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = currentTime;
        
        // Get current slider position
        const currentX = parseFloat(this.slider.getAttribute('cx')) || this.lastSliderPosition.x;
        const currentY = parseFloat(this.slider.getAttribute('cy')) || this.lastSliderPosition.y;
        
        // Calculate distance to desired position
        const deltaX = sliderX - currentX;
        const deltaY = sliderY - currentY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Apply speed limit
        const maxDistance = CONFIG.MAX_SLIDER_SPEED * deltaTime;
        let finalX = sliderX;
        let finalY = sliderY;
        
        if (distance > maxDistance && maxDistance > 0) {
            // Limit movement to max speed
            const ratio = maxDistance / distance;
            finalX = currentX + deltaX * ratio;
            finalY = currentY + deltaY * ratio;
        }
        
        // Update slider visual position (on the path, between coordinates)
        this.slider.setAttribute('cx', finalX);
        this.slider.setAttribute('cy', finalY);
        this.lastSliderPosition = { x: finalX, y: finalY };
        
        // Determine coordinate completion based on progress through segment
        let completedCoords = coordIndex;
        if (progress >= 0.85) { // 85% through segment = coordinate completed
            completedCoords = coordIndex + 1;
        }
        
        // Update current coordinate index if we've advanced
        if (completedCoords > this.currentCoordinateIndex) {
            // Ensure we don't skip coordinates - only advance by 1 at a time
            const newCoordinateIndex = this.currentCoordinateIndex + 1;
            
            if (newCoordinateIndex === completedCoords && newCoordinateIndex < this.currentStrokeCoords.length) {
                this.currentCoordinateIndex = newCoordinateIndex;
                
                // Update traced path to show progress
                this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
                
                console.log(`Advanced to coordinate ${this.currentCoordinateIndex} of ${this.currentStrokeCoords.length - 1} at progress ${(progress * 100).toFixed(1)}%`);
                
                // Check if stroke is complete
                if (this.currentCoordinateIndex >= this.currentStrokeCoords.length - 1) {
                    this.completeCurrentStroke();
                }
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
        
        // Start arrow timeout again
        this.startArrowTimeout();
        
        // Start stopped movement timeout if near completion
        this.startStoppedMovementTimeout();
    }

    completeCurrentStroke() {
        console.log(`Completing stroke ${this.currentStroke}`);
        
        this.isTracing = false;
        this.isDragging = false;
        
        // Hide slider and arrow for current stroke
        if (this.slider) {
            this.slider.style.opacity = '0';
        }
        this.removeDirectionArrow();
        
        // Clear arrow timeout
        if (this.arrowTimeout) {
            clearTimeout(this.arrowTimeout);
            this.arrowTimeout = null;
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
        // Remove slider and arrow
        this.removeSlider();
        this.removeDirectionArrow();
        
        // Clear timeouts
        if (this.arrowTimeout) {
            clearTimeout(this.arrowTimeout);
            this.arrowTimeout = null;
        }
        
        if (this.stoppedMovementTimeout) {
            clearTimeout(this.stoppedMovementTimeout);
            this.stoppedMovementTimeout = null;
        }
        
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
