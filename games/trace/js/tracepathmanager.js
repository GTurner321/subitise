class TracePathManager {
    constructor(svg, renderer) {
        this.svg = svg;
        this.renderer = renderer;
        
        // Slider elements - TWO separate systems
        this.slider = null;              // Real interactive slider (becomes invisible during drag)
        this.frontMarker = null;         // Fake red marker at front of green trace (visible during drag)
        
        // Tracking state
        this.isTracing = false;
        this.currentStroke = 0;
        this.currentCoordinateIndex = 0; // Which coordinate point we're at (green trace position)
        this.isDragging = false;
        
        // Front marker tracking (separate from green trace)
        this.frontMarkerCoordIndex = 0;
        this.frontMarkerProgress = 0;
        this.finalFrontMarkerCoordIndex = 0;
        this.finalFrontMarkerProgress = 0;
        
        // Current stroke data
        this.strokeCoordinates = [];
        this.currentStrokeCoords = [];
        
        // Movement tracking
        this.lastMovementTime = Date.now();
        
        // Stroke completion coordinates - end points for each stroke per number
        this.strokeEndCoordinates = {
            0: [], // Single stroke - will be calculated
            1: [], // Single stroke - will be calculated
            2: [[0, 0], [100, 0]], // Two strokes
            3: [[35, 100], [0, 10]], // Two strokes
            4: [[0, 80], [100, 80], [60, 0]], // Three strokes
            5: [[100, 200], [0, 125], [0, 13]], // Three strokes
            6: [], // Single stroke - will be calculated
            7: [[100, 200], [40, 0]], // Two strokes
            8: [], // Single stroke - will be calculated
            9: [[100, 190], [80, 0]] // Two strokes
        };
        
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
        
        // Reset front marker tracking
        this.frontMarkerCoordIndex = 0;
        this.frontMarkerProgress = 0;
        this.finalFrontMarkerCoordIndex = 0;
        this.finalFrontMarkerProgress = 0;
        
        // Get coordinates for this stroke
        this.currentStrokeCoords = this.renderer.getStrokeCoordinates(strokeIndex);
        
        if (!this.currentStrokeCoords || this.currentStrokeCoords.length === 0) {
            console.error('No coordinates available for stroke:', strokeIndex);
            return false;
        }
        
        // Calculate stroke completion coordinate (2 before end)
        this.calculateStrokeCompletionCoordinate();
        
        // Remove any existing slider and front marker
        this.removeSlider();
        this.removeFrontMarker();
        
        // Create simple slider at first coordinate
        const startPoint = this.currentStrokeCoords[0];
        this.createSlider(startPoint);
        
        return true;
    }

    calculateStrokeCompletionCoordinate() {
        // Calculate the coordinate index that represents "2 before end"
        const totalCoords = this.currentStrokeCoords.length;
        
        if (totalCoords >= 3) {
            // For strokes with 3+ coordinates, completion is at index (length - 3)
            this.strokeCompletionCoordIndex = totalCoords - 3;
        } else if (totalCoords === 2) {
            // For very short strokes, completion is at first coordinate
            this.strokeCompletionCoordIndex = 0;
        } else {
            // Single coordinate stroke (shouldn't happen, but handle gracefully)
            this.strokeCompletionCoordIndex = 0;
        }
        
        // Store the actual coordinate for reference
        this.strokeCompletionCoord = this.currentStrokeCoords[this.strokeCompletionCoordIndex];
    }

    createSlider(position) {
        // Remove existing slider
        this.removeSlider();
        
        // Create simple slider circle
        this.slider = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.slider.setAttribute('cx', position.x);
        this.slider.setAttribute('cy', position.y);
        this.slider.setAttribute('r', CONFIG.SLIDER_SIZE / 2);
        this.slider.setAttribute('fill', CONFIG.SLIDER_COLOR);
        this.slider.setAttribute('stroke', 'white');
        this.slider.setAttribute('stroke-width', 3);
        this.slider.setAttribute('class', 'trace-slider');
        this.slider.setAttribute('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))');
        this.slider.style.zIndex = '1000';
        
        // Add pulsing animation
        this.addSliderPulseAnimation();
        
        // Ensure slider is added AFTER trace paths (higher z-index)
        this.svg.appendChild(this.slider);
    }

    removeSlider() {
        if (this.slider) {
            this.slider.remove();
            this.slider = null;
        }
    }

    createFrontMarker(position) {
        // Remove existing front marker
        this.removeFrontMarker();
        
        // Create new front marker circle (looks identical to slider but separate)
        this.frontMarker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.frontMarker.setAttribute('cx', position.x);
        this.frontMarker.setAttribute('cy', position.y);
        this.frontMarker.setAttribute('r', CONFIG.SLIDER_SIZE / 2);
        this.frontMarker.setAttribute('fill', CONFIG.SLIDER_COLOR);
        this.frontMarker.setAttribute('stroke', 'white');
        this.frontMarker.setAttribute('stroke-width', 3);
        this.frontMarker.setAttribute('class', 'front-marker');
        this.frontMarker.setAttribute('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))');
        this.frontMarker.style.zIndex = '1001';
        
        this.svg.appendChild(this.frontMarker);
    }

    removeFrontMarker() {
        if (this.frontMarker) {
            this.frontMarker.remove();
            this.frontMarker = null;
        }
    }

    updateFrontMarkerPosition(position) {
        if (this.frontMarker) {
            this.frontMarker.setAttribute('cx', position.x);
            this.frontMarker.setAttribute('cy', position.y);
        }
    }

    handleStart(event) {
        event.preventDefault();
        
        const point = this.getEventPoint(event);
        if (!point) return;
        
        // Must touch WITHIN the red slider circle to start/restart tracing
        if (this.isPointNearSlider(point, false)) {
            this.isDragging = true;
            this.isTracing = true;
            
            // HIDE the real slider during dragging
            if (this.slider) {
                this.slider.style.opacity = '0';
                // Remove pulsing animation
                const animate = this.slider.querySelector('animate');
                if (animate) {
                    animate.remove();
                }
            }
            
            // CREATE front marker at current trace position
            const currentCoord = this.currentStrokeCoords[this.currentCoordinateIndex];
            if (currentCoord) {
                this.createFrontMarker(currentCoord);
                // Initialize front marker tracking
                this.frontMarkerCoordIndex = this.currentCoordinateIndex;
                this.frontMarkerProgress = 0;
            }
        }
    }

    handleMove(event) {
        if (!this.isDragging || !this.isTracing) return;
        
        event.preventDefault();
        const point = this.getEventPoint(event);
        if (!point) return;
        
        // Update movement time
        this.lastMovementTime = Date.now();
        
        // Find best position along the path for the drag point
        const bestPosition = this.findBestSliderPosition(point);
        
        if (bestPosition !== null) {
            // Update the tracing progress based on drag position
            this.updateTracingProgress(bestPosition);
        }
    }

    handleEnd(event) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        // Store the final front marker position (KEY FIX!)
        this.finalFrontMarkerCoordIndex = this.frontMarkerCoordIndex;
        this.finalFrontMarkerProgress = this.frontMarkerProgress;
        
        // Delay showing the real slider by 500ms to avoid jarring catch-up movement
        setTimeout(() => {
            // Only proceed if we haven't started dragging again
            if (!this.isDragging && this.slider) {
                // Position slider at final front marker position (NOT green trace position)
                const finalPosition = this.getInterpolatedPosition(this.finalFrontMarkerCoordIndex, this.finalFrontMarkerProgress);
                
                if (finalPosition) {
                    // Update slider position to front marker's final position
                    this.slider.setAttribute('cx', finalPosition.x);
                    this.slider.setAttribute('cy', finalPosition.y);
                    
                    // Update currentCoordinateIndex to match front marker position
                    this.currentCoordinateIndex = this.finalFrontMarkerCoordIndex;
                    if (this.finalFrontMarkerProgress >= 0.95) {
                        this.currentCoordinateIndex = Math.min(this.currentCoordinateIndex + 1, this.currentStrokeCoords.length - 1);
                    }
                    
                    // Update green trace to match new coordinate index
                    this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
                }
                
                // Fade in over 250ms
                this.slider.style.transition = 'opacity 0.25s ease-in';
                this.slider.style.opacity = '1';
                
                // Add pulsing animation after fade completes
                setTimeout(() => {
                    if (!this.isDragging) {
                        this.addSliderPulseAnimation();
                    }
                }, 250);
                
                // Reset transition after animation completes
                setTimeout(() => {
                    if (this.slider) {
                        this.slider.style.transition = '';
                    }
                }, 300);
            }
        }, 500);
        
        // REMOVE the front marker immediately (but keep it visible until slider fades in)
        setTimeout(() => {
            if (!this.isDragging) {
                this.removeFrontMarker();
            }
        }, 500);
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
    }

    findBestSliderPosition(dragPoint) {
        let bestCoordIndex = this.currentCoordinateIndex;
        let bestProgress = 0;
        let bestDistance = Infinity;
        
        // Allow slider to look ahead by 1-2 segments for smooth dragging
        const lookAheadDistance = this.currentCoordinateIndex === 0 ? 3 : 2;
        const maxSearchIndex = Math.min(this.currentCoordinateIndex + lookAheadDistance, this.currentStrokeCoords.length - 2);
        
        for (let i = this.currentCoordinateIndex; i <= maxSearchIndex; i++) {
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
            
            const maxDistance = CONFIG.PATH_TOLERANCE || 50;
            
            if (distanceToSegment <= maxDistance && distanceToSegment < bestDistance) {
                bestDistance = distanceToSegment;
                bestCoordIndex = i;
                bestProgress = projectionProgress;
            }
        }
        
        // Return best position found within tolerance
        if (bestDistance <= (CONFIG.PATH_TOLERANCE || 50)) {
            return {
                coordIndex: bestCoordIndex,
                progress: bestProgress,
                distance: bestDistance
            };
        }
        
        return null;
    }

    updateTracingProgress(position) {
        const { coordIndex, progress } = position;
        
        // Update front marker tracking
        this.frontMarkerCoordIndex = coordIndex;
        this.frontMarkerProgress = progress;
        
        const currentCoord = this.currentStrokeCoords[coordIndex];
        const nextCoord = this.currentStrokeCoords[coordIndex + 1];
        
        // Calculate front marker position (at the drag point projection)
        const frontMarkerX = currentCoord.x + (nextCoord.x - currentCoord.x) * progress;
        const frontMarkerY = currentCoord.y + (nextCoord.y - currentCoord.y) * progress;
        
        // UPDATE FRONT MARKER POSITION immediately (this is what user sees during drag)
        this.updateFrontMarkerPosition({ x: frontMarkerX, y: frontMarkerY });
        
        // CHECK FOR STROKE COMPLETION - using coordinate-based completion
        if (this.hasReachedStrokeCompletionPoint(coordIndex, progress)) {
            this.autoCompleteCurrentStroke();
            return;
        }
        
        // Calculate what coordinate index the green trace should fill up to (CONSERVATIVE)
        let newCoordinateIndex = this.currentCoordinateIndex;
        
        if (coordIndex > this.currentCoordinateIndex) {
            // Front marker moved to a new segment ahead
            if (progress >= 0.5) {
                newCoordinateIndex = coordIndex;
            }
        } else if (coordIndex === this.currentCoordinateIndex) {
            // Front marker still in current segment
            if (progress >= 0.7) {
                // Advance to next coordinate when 70% through current segment
                newCoordinateIndex = Math.min(this.currentCoordinateIndex + 1, this.currentStrokeCoords.length - 1);
            }
        }
        
        // SAFETY CHECK: Green trace coordinate can never exceed front marker segment
        newCoordinateIndex = Math.min(newCoordinateIndex, coordIndex);
        
        // If front marker is in the middle of a segment, green trace should only fill to previous complete segments
        if (progress < 0.7 && coordIndex === newCoordinateIndex && coordIndex > 0) {
            newCoordinateIndex = Math.max(0, coordIndex - 1);
        }
        
        // Update green trace only when coordinate index actually changes
        if (newCoordinateIndex !== this.currentCoordinateIndex) {
            this.currentCoordinateIndex = newCoordinateIndex;
            
            // Update green trace to match
            this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
        }
    }

    hasReachedStrokeCompletionPoint(coordIndex, progress) {
        // Check if we've reached the completion coordinate (2 before end)
        if (coordIndex >= this.strokeCompletionCoordIndex) {
            // If we're at the completion coordinate with good progress, or past it
            if (coordIndex > this.strokeCompletionCoordIndex || progress >= 0.5) {
                return true;
            }
        }
        return false;
    }

    autoCompleteCurrentStroke() {
        // Complete this stroke immediately
        this.currentCoordinateIndex = this.currentStrokeCoords.length - 1;
        
        // Update green trace to show full completion
        this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
        
        // Update front marker to final position
        const finalCoord = this.currentStrokeCoords[this.currentStrokeCoords.length - 1];
        if (finalCoord && this.frontMarker) {
            this.updateFrontMarkerPosition(finalCoord);
        }
        
        // Store final position for slider positioning
        this.finalFrontMarkerCoordIndex = this.currentStrokeCoords.length - 1;
        this.finalFrontMarkerProgress = 1.0;
        
        // Brief pause to show completion, then advance
        setTimeout(() => {
            this.completeCurrentStroke();
        }, 200);
    }

    getInterpolatedPosition(coordIndex, progress) {
        if (coordIndex < 0 || coordIndex >= this.currentStrokeCoords.length - 1) {
            return this.currentStrokeCoords[Math.max(0, Math.min(coordIndex, this.currentStrokeCoords.length - 1))];
        }
        
        const currentCoord = this.currentStrokeCoords[coordIndex];
        const nextCoord = this.currentStrokeCoords[coordIndex + 1];
        
        if (!currentCoord || !nextCoord) {
            return currentCoord || nextCoord;
        }
        
        return {
            x: currentCoord.x + (nextCoord.x - currentCoord.x) * progress,
            y: currentCoord.y + (nextCoord.y - currentCoord.y) * progress
        };
    }

    stopTracing() {
        this.isTracing = false;
        this.isDragging = false;
        
        // Show real slider and remove front marker
        if (this.slider) {
            this.slider.style.opacity = '1';
            this.addSliderPulseAnimation();
        }
        this.removeFrontMarker();
    }

    completeCurrentStroke() {
        this.isTracing = false;
        this.isDragging = false;
        
        // Hide slider and front marker
        if (this.slider) {
            this.slider.style.opacity = '0';
        }
        this.removeFrontMarker();
        
        // Notify renderer of stroke completion
        this.renderer.completeStroke(this.currentStroke);
        
        // Check if there are more strokes
        const totalStrokes = this.renderer.getStrokeCount();
        
        if (this.currentStroke + 1 < totalStrokes) {
            // Auto-advance to next stroke after brief delay
            setTimeout(() => {
                this.startNewStroke(this.currentStroke + 1);
            }, 300);
        } else {
            // All strokes complete - remove slider completely
            setTimeout(() => {
                this.removeSlider();
            }, 300);
            
            // Notify renderer that the entire number is complete
            this.renderer.completeNumber();
        }
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
        // Remove slider and front marker
        this.removeSlider();
        this.removeFrontMarker();
        
        this.isTracing = false;
        this.isDragging = false;
        this.currentCoordinateIndex = 0;
        this.currentStrokeCoords = [];
        
        // Reset front marker tracking
        this.frontMarkerCoordIndex = 0;
        this.frontMarkerProgress = 0;
        this.finalFrontMarkerCoordIndex = 0;
        this.finalFrontMarkerProgress = 0;
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
