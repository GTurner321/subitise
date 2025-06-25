createDirectionArrow() {
        // Don't create arrow if we don't have enough coordinates or if slider doesn't exist
        if (!this.slider || !this.currentStrokeCoords || this.currentStrokeCoords.length < 2) {
            return;
        }
        
        // Don't create if we're at the end of the stroke
        if (this.currentCoordinateIndex >= this.currentStrokeCoords.length - 1) {
            return;
        }
        
        // Get current slider position (last completed coordinate)
        const currentCoord = this.currentStrokeCoords[this.currentCoordinateIndex];
        const nextCoord = this.currentStrokeCoords[this.currentCoordinateIndex + 1];
        
        if (!currentCoord || !nextCoord) {
            return;
        }
        
        // Calculate direction from current to next coordinate
        const directionX = nextCoord.x - currentCoord.x;
        const directionY = nextCoord.y - currentCoord.y;
        const directionLength = Math.sqrt(directionX * directionX + directionY * directionY);
        
        if (directionLength === 0) return; // No direction to show
        
        // Position arrow slightly offset from slider center (so it's visible on top)
        const arrowOffset = (CONFIG.SLIDER_SIZE || 30) * 0.6; // 60% of slider radius
        const normalizedX = directionX / directionLength;
        const normalizedY = directionY / directionLength;
        
        const arrowX = currentCoord.x + normalizedX * arrowOffset;
        const arrowY = currentCoord.y + normalizedY * arrowOffset;
        
        // Calculate rotation angle pointing toward next coordinate
        const angle = Math.atan2(directionY, directionX) * 180 / Math.PI;
        
        try {
            // Remove existing arrow first
            this.removeDirectionArrow();
            
            // Create arrow group
            this.directionArrow = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            this.directionArrow.setAttribute('class', 'direction-arrow');
            this.directionArrow.setAttribute('transform', `translate(${arrowX}, ${arrowY}) rotate(${angle})`);
            
            // Create arrow path (pointing right, will be rotated)
            const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const arrowSize = (CONFIG.ARROW_SIZE || 12);
            arrowPath.setAttribute('d', `M 0 0 L ${arrowSize} ${arrowSize/3} L ${arrowSize} ${-arrowSize/3} Z`);
            arrowPath.setAttribute('fill', CONFIG.ARROW_COLOR || '#4CAF50');
            arrowPath.setAttribute('stroke', 'white');
            arrowPath.setAttribute('stroke-width', 1.5);
            arrowPath.setAttribute('filter', 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))');
            
            this.directionArrow.appendChild(arrowPath);
            
            // Add pulsing animation in sync with slider (2 second duration)
            const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
            animate.setAttribute('attributeName', 'opacity');
            animate.setAttribute('values', '1;0.4;1');
            animate.setAttribute('dur', '2s');
            animate.setAttribute('repeatCount', 'indefinite');
            
            this.directionArrow.appendChild(animate);
            
            // Add to SVG (below slider to ensure slider stays on top)
            this.svg.appendChild(this.directionArrow);
            
            console.log(`Created direction arrow pointing from coord ${this.currentCoordinateIndex} to ${this.currentCoordinateIndex + 1}`);
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
        
        // Set new timeout to show arrow after 2 seconds of inactivity
        this.arrowTimeout = setTimeout(() => {
            if (!this.isTracing && !this.isDragging) {
                this.createDirectionArrow();
            }
        }, 2000); // 2 second delay
    }

    resetArrowTimeout() {
        this.removeDirectionArrow();
        this.startArrowTimeout();
        this.lastMovementTime = Date.now();
    }class TracePathManager {
    constructor(svg, renderer) {
        this.svg = svg;
        this.renderer = renderer;
        
        // Slider elements - TWO separate systems
        this.slider = null;              // Real interactive slider (becomes invisible during drag)
        this.frontMarker = null;         // Fake red marker at front of green trace (visible during drag)
        this.directionArrow = null;      // Separate direction arrow (appears after inactivity)
        
        // Tracking state
        this.isTracing = false;
        this.currentStroke = 0;
        this.currentCoordinateIndex = 0; // Which coordinate point we're at
        this.isDragging = false;
        
        // Current stroke data
        this.strokeCoordinates = [];
        this.currentStrokeCoords = [];
        
        // Movement tracking
        this.lastMovementTime = Date.now();
        
        // Arrow timing
        this.arrowTimeout = null;
        
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
        
        // Remove any existing slider, front marker, and direction arrow
        this.removeSlider();
        this.removeFrontMarker();
        this.removeDirectionArrow();
        
        // Create simple slider at first coordinate
        const startPoint = this.currentStrokeCoords[0];
        this.createSlider(startPoint);
        
        // Start arrow timeout for direction guidance
        this.startArrowTimeout();
        
        console.log('Simple slider created at start position, direction arrow will appear after 2 seconds');
        
        return true;
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
        this.slider.style.zIndex = '1000'; // Very high z-index to ensure always on top
        
        // Add pulsing animation
        this.addSliderPulseAnimation();
        
        // Ensure slider is added AFTER trace paths (higher z-index)
        this.svg.appendChild(this.slider);
        
        console.log(`Created simple slider at coordinate ${this.currentCoordinateIndex}:`, position);
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
        this.frontMarker.style.zIndex = '1001'; // Even higher than slider
        
        this.svg.appendChild(this.frontMarker);
        
        console.log(`Created front marker at:`, position);
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
            console.log('Valid touch within slider circle - starting/restarting drag');
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
            
            // HIDE and remove direction arrow when starting to trace
            this.removeDirectionArrow();
            if (this.arrowTimeout) {
                clearTimeout(this.arrowTimeout);
                this.arrowTimeout = null;
            }
            
            // CREATE front marker at current trace position
            const currentCoord = this.currentStrokeCoords[this.currentCoordinateIndex];
            if (currentCoord) {
                this.createFrontMarker(currentCoord);
            }
            
            console.log('🔴 Real slider hidden, direction arrow removed, 🔴 front marker created at trace position');
        } else {
            console.log('Touch OUTSIDE slider circle - drag not started (must touch red circle to begin/restart)');
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
        
        console.log('Drag ended - finger lifted');
        this.isDragging = false;
        
        // Delay showing the real slider by 500ms to avoid jarring catch-up movement
        setTimeout(() => {
            // Only proceed if we haven't started dragging again
            if (!this.isDragging && this.slider) {
                const currentCoord = this.currentStrokeCoords[this.currentCoordinateIndex];
                if (currentCoord) {
                    // Update slider position (while still invisible)
                    this.slider.setAttribute('cx', currentCoord.x);
                    this.slider.setAttribute('cy', currentCoord.y);
                    
                    // Fade in over 250ms
                    this.slider.style.transition = 'opacity 0.25s ease-in';
                    this.slider.style.opacity = '1';
                    
                    // Add pulsing animation after fade completes
                    setTimeout(() => {
                        if (!this.isDragging) { // Double-check we're still not dragging
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
            }
        }, 500); // Half second delay
        
        // REMOVE the front marker immediately (but keep it visible until slider fades in)
        setTimeout(() => {
            if (!this.isDragging) { // Only remove if we haven't started dragging again
                this.removeFrontMarker();
            }
        }, 500); // Remove at same time as slider appears
        
        // Start arrow timeout after slider reappears
        setTimeout(() => {
            if (!this.isDragging) {
                this.startArrowTimeout();
            }
        }, 500);
        
        console.log('🔴 Real slider will fade in after 500ms delay, 🔴 front marker will be removed then, arrow timeout will start');
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
        // SIMPLE APPROACH: Basic position finding without complex direction logic
        
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
        const currentCoord = this.currentStrokeCoords[coordIndex];
        const nextCoord = this.currentStrokeCoords[coordIndex + 1];
        
        // Calculate front marker position (at the drag point projection)
        const frontMarkerX = currentCoord.x + (nextCoord.x - currentCoord.x) * progress;
        const frontMarkerY = currentCoord.y + (nextCoord.y - currentCoord.y) * progress;
        
        // UPDATE FRONT MARKER POSITION immediately (this is what user sees during drag)
        this.updateFrontMarkerPosition({ x: frontMarkerX, y: frontMarkerY });
        
        // Calculate what coordinate index the green trace should fill up to
        let newCoordinateIndex = this.currentCoordinateIndex;
        
        // SPECIAL CASE: If we're at the final segment, allow completion
        const isFinalSegment = coordIndex >= this.currentStrokeCoords.length - 2;
        
        if (isFinalSegment && progress >= 0.95) {
            // At final segment with 95%+ progress - complete the stroke
            newCoordinateIndex = this.currentStrokeCoords.length - 1;
        } else if (coordIndex > this.currentCoordinateIndex) {
            // Front marker moved to a new segment ahead
            if (progress >= 0.5) {
                newCoordinateIndex = coordIndex;
            }
        } else if (coordIndex === this.currentCoordinateIndex) {
            // Front marker still in current segment
            if (progress >= 0.95) {
                // Advance to next coordinate when 95% through current segment
                newCoordinateIndex = Math.min(this.currentCoordinateIndex + 1, this.currentStrokeCoords.length - 1);
            }
        }
        
        // SAFETY CHECK: Green trace coordinate can never exceed front marker segment (except at completion)
        if (!isFinalSegment || progress < 0.95) {
            newCoordinateIndex = Math.min(newCoordinateIndex, coordIndex);
            
            // If front marker is in the middle of a segment, green trace should only fill to previous complete segments
            if (progress < 0.95 && coordIndex === newCoordinateIndex && coordIndex > 0) {
                newCoordinateIndex = Math.max(0, coordIndex - 1);
            }
        }
        
        // Update green trace only when coordinate index actually changes
        if (newCoordinateIndex !== this.currentCoordinateIndex) {
            this.currentCoordinateIndex = newCoordinateIndex;
            
            // Update green trace to match
            this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
        }
        
        // Complete stroke when we reach the final coordinate
        if (this.currentCoordinateIndex >= this.currentStrokeCoords.length - 1) {
            this.completeCurrentStroke();
        }
    }

    stopTracing() {
        this.isTracing = false;
        this.isDragging = false;
        
        console.log('Tracing stopped');
        
        // Show real slider and remove front marker
        if (this.slider) {
            this.slider.style.opacity = '1';
            this.addSliderPulseAnimation();
        }
        this.removeFrontMarker();
        
        // Start arrow timeout for direction guidance
        this.startArrowTimeout();
    }

    completeCurrentStroke() {
        console.log(`Completing stroke ${this.currentStroke}`);
        
        this.isTracing = false;
        this.isDragging = false;
        
        // Hide slider, front marker, and direction arrow
        if (this.slider) {
            this.slider.style.opacity = '0';
        }
        this.removeFrontMarker();
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
        // Remove slider, front marker and direction arrow
        this.removeSlider();
        this.removeFrontMarker();
        this.removeDirectionArrow();
        
        // Clear arrow timeout
        if (this.arrowTimeout) {
            clearTimeout(this.arrowTimeout);
            this.arrowTimeout = null;
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
