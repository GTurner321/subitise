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
        
        // Start arrow timeout
        this.startArrowTimeout();
        
        return true;
    }

    createSlider(position) {
        // Remove existing slider
        this.removeSlider();
        
        // Create new slider circle (no speed limitations)
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
        if (this.directionArrow || !this.currentStrokeCoords || this.currentStrokeCoords.length < 2 || !this.slider) {
            return;
        }
        
        // Get current slider position
        const sliderX = parseFloat(this.slider.getAttribute('cx'));
        const sliderY = parseFloat(this.slider.getAttribute('cy'));
        
        // Validate slider position
        if (isNaN(sliderX) || isNaN(sliderY)) {
            console.warn('Invalid slider position, cannot create direction arrow');
            return;
        }
        
        // Find the next coordinate point ahead from current position
        let nextCoordIndex = this.currentCoordinateIndex + 1;
        let targetCoordIndex = this.currentCoordinateIndex + 2;
        
        // Ensure we have valid coordinates
        if (nextCoordIndex >= this.currentStrokeCoords.length) {
            nextCoordIndex = this.currentStrokeCoords.length - 1;
        }
        if (targetCoordIndex >= this.currentStrokeCoords.length) {
            targetCoordIndex = this.currentStrokeCoords.length - 1;
        }
        
        // Don't create arrow if we're at the end
        if (nextCoordIndex === targetCoordIndex) {
            return;
        }
        
        const nextCoord = this.currentStrokeCoords[nextCoordIndex];
        const targetCoord = this.currentStrokeCoords[targetCoordIndex];
        
        if (!nextCoord || !targetCoord) {
            console.warn('Invalid coordinates for arrow creation');
            return;
        }
        
        // Calculate direction from next coordinate to target coordinate
        const directionX = targetCoord.x - nextCoord.x;
        const directionY = targetCoord.y - nextCoord.y;
        const directionLength = Math.sqrt(directionX * directionX + directionY * directionY);
        
        if (directionLength === 0) return; // No direction to show
        
        // Position arrow at 80% of slider width from center (slider radius is 50%)
        const sliderRadius = CONFIG.SLIDER_SIZE / 2;
        const arrowDistance = CONFIG.SLIDER_SIZE * 0.8; // 80% of slider width from center
        
        // Calculate direction from slider center to next coordinate
        const toNextX = nextCoord.x - sliderX;
        const toNextY = nextCoord.y - sliderY;
        const toNextLength = Math.sqrt(toNextX * toNextX + toNextY * toNextY);
        
        let arrowX, arrowY;
        
        if (toNextLength > arrowDistance) {
            // Next coordinate is far enough - position arrow partway to it
            const normalizedX = toNextX / toNextLength;
            const normalizedY = toNextY / toNextLength;
            arrowX = sliderX + normalizedX * arrowDistance;
            arrowY = sliderY + normalizedY * arrowDistance;
        } else {
            // Next coordinate is close - position arrow at the next coordinate
            arrowX = nextCoord.x;
            arrowY = nextCoord.y;
        }
        
        // Calculate rotation angle pointing toward target coordinate (add 180 to flip)
        const angle = (Math.atan2(directionY, directionX) * 180 / Math.PI) + 180;
        
        try {
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
            if (this.slider && this.slider.parentNode) {
                this.svg.insertBefore(this.directionArrow, this.slider);
            } else {
                this.svg.appendChild(this.directionArrow);
            }
            
            console.log(`Created direction arrow at (${arrowX.toFixed(1)}, ${arrowY.toFixed(1)}) pointing toward coordinate ${targetCoordIndex}`);
        } catch (error) {
            console.error('Error creating direction arrow:', error);
            this.directionArrow = null;
        }
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
        
        // Convert to SVG coordinates using dynamic CONFIG dimensions
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
        // STRICT PATH FOLLOWING: Only allow movement along current segment and immediate next segment
        let bestCoordIndex = this.currentCoordinateIndex;
        let bestProgress = 0;
        let bestDistance = Infinity;
        
        // Only look at current segment and one segment ahead (no jumping around)
        const startIndex = this.currentCoordinateIndex;
        const endIndex = Math.min(this.currentStrokeCoords.length - 2, this.currentCoordinateIndex + 1);
        
        for (let i = startIndex; i <= endIndex; i++) {
            const currentCoord = this.currentStrokeCoords[i];
            const nextCoord = this.currentStrokeCoords[i + 1];
            
            if (!nextCoord) continue;
            
            // Calculate segment direction and length
            const segmentX = nextCoord.x - currentCoord.x;
            const segmentY = nextCoord.y - currentCoord.y;
            const segmentLength = Math.sqrt(segmentX * segmentX + segmentY * segmentY);
            
            if (segmentLength === 0) continue;
            
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
            
            // STRICT RULES: Only allow forward progress or staying in place
            let isValidPosition = false;
            
            if (i === this.currentCoordinateIndex) {
                // Current segment - always allow
                isValidPosition = true;
            } else if (i === this.currentCoordinateIndex + 1) {
                // Next segment - only allow if we've completed current segment AND drag is forward
                const currentSegmentComplete = this.currentCoordinateIndex >= i - 1;
                if (currentSegmentComplete && dotProduct >= 0) {
                    isValidPosition = true;
                }
            }
            
            if (isValidPosition && distanceToSegment < bestDistance && distanceToSegment <= CONFIG.PATH_TOLERANCE) {
                bestDistance = distanceToSegment;
                bestCoordIndex = i;
                bestProgress = projectionProgress;
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
        
        // Calculate exact slider position along the segment (linear interpolation)
        const sliderX = currentCoord.x + (nextCoord.x - currentCoord.x) * progress;
        const sliderY = currentCoord.y + (nextCoord.y - currentCoord.y) * progress;
        
        // CRITICAL FIX: Calculate coordinate index based on path distance, not segments
        // This ensures slider and green trace are perfectly synchronized
        
        // Calculate total distance along path from start to current slider position
        let totalDistanceToSlider = 0;
        
        // Add distances for all completed segments
        for (let i = 0; i < coordIndex; i++) {
            const segStart = this.currentStrokeCoords[i];
            const segEnd = this.currentStrokeCoords[i + 1];
            if (segEnd) {
                const segmentDist = Math.sqrt(
                    Math.pow(segEnd.x - segStart.x, 2) + 
                    Math.pow(segEnd.y - segStart.y, 2)
                );
                totalDistanceToSlider += segmentDist;
            }
        }
        
        // Add partial distance for current segment
        const currentSegmentDist = Math.sqrt(
            Math.pow(nextCoord.x - currentCoord.x, 2) + 
            Math.pow(nextCoord.y - currentCoord.y, 2)
        );
        totalDistanceToSlider += currentSegmentDist * progress;
        
        // Calculate which coordinate index corresponds to this distance
        let newCoordinateIndex = 0;
        let accumulatedDistance = 0;
        
        for (let i = 0; i < this.currentStrokeCoords.length - 1; i++) {
            const segStart = this.currentStrokeCoords[i];
            const segEnd = this.currentStrokeCoords[i + 1];
            const segmentDist = Math.sqrt(
                Math.pow(segEnd.x - segStart.x, 2) + 
                Math.pow(segEnd.y - segStart.y, 2)
            );
            
            if (accumulatedDistance + segmentDist >= totalDistanceToSlider) {
                // We're in this segment
                newCoordinateIndex = i;
                break;
            }
            
            accumulatedDistance += segmentDist;
            newCoordinateIndex = i + 1; // Completed this coordinate
        }
        
        // Ensure we don't go backwards
        newCoordinateIndex = Math.max(newCoordinateIndex, this.currentCoordinateIndex);
        
        // Update slider visual position EXACTLY to calculated position
        this.slider.setAttribute('cx', sliderX);
        this.slider.setAttribute('cy', sliderY);
        
        // Update coordinate index only if it changed
        if (newCoordinateIndex !== this.currentCoordinateIndex) {
            this.currentCoordinateIndex = newCoordinateIndex;
            
            // Update traced path - this should now be perfectly in sync with slider
            this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
            
            console.log(`Slider-trace synchronized: coordinate ${this.currentCoordinateIndex}, slider at (${sliderX.toFixed(1)}, ${sliderY.toFixed(1)})`);
        }
        
        // Check if stroke is complete
        if (this.currentCoordinateIndex >= this.currentStrokeCoords.length - 1) {
            this.completeCurrentStroke();
        }
    }

    updateDirectionArrow() {
        // Remove current arrow and create new one with updated direction
        if (this.directionArrow) {
            this.removeDirectionArrow();
            // Only recreate if we're not actively dragging and have valid coordinates
            if (!this.isDragging && this.currentStrokeCoords && this.currentStrokeCoords.length > 1) {
                setTimeout(() => {
                    this.createDirectionArrow();
                }, 100);
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
