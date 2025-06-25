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
        
        // Start arrow timeout for initial direction guidance
        this.startArrowTimeout();
        
        console.log('Direction arrow will appear in 4 seconds to show initial direction');
        
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
        
        // Position arrow at 80% of slider width from center
        const arrowDistance = CONFIG.SLIDER_SIZE * 0.8;
        
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
        
        // Calculate rotation angle pointing toward target coordinate
        const angle = (Math.atan2(directionY, directionX) * 180 / Math.PI) + 180;
        
        try {
            // Create arrow group
            this.directionArrow = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            this.directionArrow.setAttribute('class', 'direction-arrow');
            this.directionArrow.setAttribute('transform', `translate(${arrowX}, ${arrowY}) rotate(${angle})`);
            
            // Create arrow path
            const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const arrowSize = CONFIG.ARROW_SIZE;
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
        
        // Must touch WITHIN the red slider circle to start/restart tracing
        if (this.isPointNearSlider(point, false)) {
            console.log('Valid touch within slider circle - starting/restarting drag');
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
            
            console.log('Drag started at coordinate index:', this.currentCoordinateIndex);
        } else {
            console.log('Touch OUTSIDE slider circle - drag not started (must touch red circle to begin/restart)');
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
        
        // Find best position along the path
        const bestPosition = this.findBestSliderPosition(point);
        
        if (bestPosition !== null) {
            // Update slider position - this now keeps green trace synchronized
            this.updateSliderPosition(bestPosition);
        }
    }

    handleEnd(event) {
        if (!this.isDragging) return;
        
        console.log('Drag ended - finger lifted');
        this.isDragging = false;
        
        // Re-enable pulsing animation to show slider is ready for new touch
        if (this.slider) {
            this.addSliderPulseAnimation();
        }
        
        // Start arrow timeout to show direction after inactivity
        this.startArrowTimeout();
        
        // Start stopped movement timeout if near completion
        this.startStoppedMovementTimeout();
        
        console.log('Direction arrow will appear in 4 seconds if no movement. To restart dragging, touch red slider circle.');
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
        
        if (isDuringDrag) {
            return true; // During drag, we're more permissive
        } else {
            // For INITIAL touch, must be within the slider circle
            const sliderRadius = CONFIG.SLIDER_SIZE / 2;
            return distance <= sliderRadius + 5; // Small buffer for easier touching
        }
    }

    addSliderPulseAnimation() {
        if (!this.slider) return;
        
        // Remove any existing animation first
        const existingAnimate = this.slider.querySelector('animate');
        if (existingAnimate) {
            existingAnimate.remove();
        }
        
        // Add pulsing animation to indicate it's ready for interaction
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'r');
        animate.setAttribute('values', `${CONFIG.SLIDER_SIZE / 2};${CONFIG.SLIDER_SIZE / 2 + 3};${CONFIG.SLIDER_SIZE / 2}`);
        animate.setAttribute('dur', '2s');
        animate.setAttribute('repeatCount', 'indefinite');
        
        this.slider.appendChild(animate);
        console.log('Added pulse animation - slider ready for touch');
    }

    findBestSliderPosition(dragPoint) {
        // STRICT CONSECUTIVE MOVEMENT: Red slider can only advance to next segment
        // This prevents linear interpolation between non-consecutive points
        
        let bestCoordIndex = this.currentCoordinateIndex;
        let bestProgress = 0;
        let bestDistance = Infinity;
        
        // CRITICAL: Only look at current segment and the next segment (strict consecutive movement)
        const startIndex = this.currentCoordinateIndex;
        const endIndex = Math.min(this.currentStrokeCoords.length - 2, this.currentCoordinateIndex + 1);
        
        for (let i = startIndex; i <= endIndex; i++) {
            const currentCoord = this.currentStrokeCoords[i];
            const nextCoord = this.currentStrokeCoords[i + 1];
            
            if (!nextCoord) continue;
            
            const segmentX = nextCoord.x - currentCoord.x;
            const segmentY = nextCoord.y - currentCoord.y;
            const segmentLength = Math.sqrt(segmentX * segmentX + segmentY * segmentY);
            
            if (segmentLength === 0) continue;
            
            const dragX = dragPoint.x - currentCoord.x;
            const dragY = dragPoint.y - currentCoord.y;
            
            const dotProduct = (dragX * segmentX + dragY * segmentY) / segmentLength;
            const projectionProgress = Math.max(0, Math.min(segmentLength, dotProduct)) / segmentLength;
            
            const pointX = currentCoord.x + segmentX * projectionProgress;
            const pointY = currentCoord.y + segmentY * projectionProgress;
            
            const distanceToSegment = Math.sqrt(
                Math.pow(dragPoint.x - pointX, 2) + 
                Math.pow(dragPoint.y - pointY, 2)
            );
            
            // Generous tolerance for dragging
            const maxDistance = CONFIG.PATH_TOLERANCE || 50;
            
            if (distanceToSegment <= maxDistance) {
                let isValidPosition = false;
                
                if (i === this.currentCoordinateIndex) {
                    // Current segment - always allow
                    isValidPosition = true;
                } else if (i === this.currentCoordinateIndex + 1) {
                    // Next segment - only allow if there's reasonable forward movement
                    if (projectionProgress >= 0.1) { // At least 10% into next segment
                        isValidPosition = true;
                    }
                }
                
                if (isValidPosition && distanceToSegment < bestDistance) {
                    bestDistance = distanceToSegment;
                    bestCoordIndex = i;
                    bestProgress = projectionProgress;
                }
            }
        }
        
        // Only return position if it's consecutive movement
        if (bestCoordIndex <= this.currentCoordinateIndex + 1 && bestDistance <= (CONFIG.PATH_TOLERANCE || 50)) {
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
        
        // Calculate exact slider position (this is the SOURCE OF TRUTH)
        const sliderX = currentCoord.x + (nextCoord.x - currentCoord.x) * progress;
        const sliderY = currentCoord.y + (nextCoord.y - currentCoord.y) * progress;
        
        // Update slider visual position immediately
        this.slider.setAttribute('cx', sliderX);
        this.slider.setAttribute('cy', sliderY);
        
        console.log(`Red slider at segment ${coordIndex}, ${(progress * 100).toFixed(1)}% = (${sliderX.toFixed(1)}, ${sliderY.toFixed(1)})`);
        
        // Calculate what coordinate index the green trace should fill up to
        let newCoordinateIndex = this.currentCoordinateIndex;
        
        // SPECIAL CASE: If we're at the final segment, allow completion
        const isFinalSegment = coordIndex >= this.currentStrokeCoords.length - 2;
        
        if (isFinalSegment && progress >= 0.95) {
            // At final segment with 95%+ progress - complete the stroke
            newCoordinateIndex = this.currentStrokeCoords.length - 1;
            console.log('🎯 Final segment reached - completing stroke');
        } else if (coordIndex > this.currentCoordinateIndex) {
            // Red slider moved to a new segment ahead
            if (progress >= 0.5) {
                newCoordinateIndex = coordIndex;
            }
        } else if (coordIndex === this.currentCoordinateIndex) {
            // Red slider still in current segment
            if (progress >= 0.95) {
                // Advance to next coordinate when 95% through current segment
                newCoordinateIndex = Math.min(this.currentCoordinateIndex + 1, this.currentStrokeCoords.length - 1);
            }
        }
        
        // SAFETY CHECK: Green trace coordinate can never exceed red slider segment (except at completion)
        if (!isFinalSegment || progress < 0.95) {
            newCoordinateIndex = Math.min(newCoordinateIndex, coordIndex);
            
            // If red slider is in the middle of a segment, green trace should only fill to previous complete segments
            if (progress < 0.95 && coordIndex === newCoordinateIndex && coordIndex > 0) {
                newCoordinateIndex = Math.max(0, coordIndex - 1);
            }
        }
        
        // Update green trace only when coordinate index actually changes
        if (newCoordinateIndex !== this.currentCoordinateIndex) {
            const oldIndex = this.currentCoordinateIndex;
            this.currentCoordinateIndex = newCoordinateIndex;
            
            // Update green trace to match
            this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
            
            console.log(`✅ Green trace: ${oldIndex} → ${this.currentCoordinateIndex} (red slider at segment ${coordIndex}, ${(progress * 100).toFixed(1)}%)`);
            
            this.updateDirectionArrow();
        }
        
        // Complete stroke when we reach the final coordinate
        if (this.currentCoordinateIndex >= this.currentStrokeCoords.length - 1) {
            console.log('🎉 Stroke completed - slider reached final coordinate');
            this.completeCurrentStroke();
        }
    }

    updateDirectionArrow() {
        // Remove current arrow and create new one with updated direction
        if (this.directionArrow) {
            this.removeDirectionArrow();
        }
        
        // Only recreate if we're not actively dragging and have valid coordinates
        if (!this.isDragging && this.currentStrokeCoords && this.currentStrokeCoords.length > 1) {
            setTimeout(() => {
                if (!this.isDragging) { // Double-check we're still not dragging
                    this.createDirectionArrow();
                }
            }, 100);
        }
    }

    stopTracing() {
        this.isTracing = false;
        this.isDragging = false;
        
        console.log('Tracing stopped');
        
        // Re-enable the pulsing animation
        if (this.slider) {
            this.addSliderPulseAnimation();
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
