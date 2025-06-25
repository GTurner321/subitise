class TracePathManager {
    constructor(svg, renderer) {
        this.svg = svg;
        this.renderer = renderer;
        
        // Slider elements - TWO separate systems now
        this.slider = null;              // Real interactive slider (becomes invisible during drag)
        this.frontMarker = null;         // Fake red marker at front of green trace (visible during drag)
        
        // Tracking state
        this.isTracing = false;
        this.currentStroke = 0;
        this.currentCoordinateIndex = 0; // Which coordinate point we're at
        this.isDragging = false;
        
        // Current stroke data
        this.strokeCoordinates = [];
        this.currentStrokeCoords = [];
        
        // Movement tracking for arrow updates
        this.lastMovementTime = Date.now();
        this.lastArrowUpdateIndex = -1; // Track when we last updated arrow
        this.arrowUpdateTimeout = null; // For delayed arrow updates
        
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
        
        // Remove any existing slider and front marker
        this.removeSlider();
        this.removeFrontMarker();
        
        // Create slider with permanent arrow at first coordinate
        const startPoint = this.currentStrokeCoords[0];
        this.createSlider(startPoint);
        
        console.log('Slider created with permanent directional arrow');
        
        return true;
    }

    createSlider(position) {
        // Remove existing slider
        this.removeSlider();
        
        // Create slider group to hold circle and centered arrow
        this.slider = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.slider.setAttribute('class', 'trace-slider-group');
        this.slider.style.zIndex = '100'; // Ensure always on top
        
        // Create slider circle (SAME as before)
        const sliderCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        sliderCircle.setAttribute('cx', position.x);
        sliderCircle.setAttribute('cy', position.y);
        sliderCircle.setAttribute('r', CONFIG.SLIDER_SIZE / 2);
        sliderCircle.setAttribute('fill', CONFIG.SLIDER_COLOR);
        sliderCircle.setAttribute('stroke', 'white');
        sliderCircle.setAttribute('stroke-width', 3);
        sliderCircle.setAttribute('class', 'trace-slider-circle');
        sliderCircle.setAttribute('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))');
        
        // Create arrow INSIDE the center of the slider circle (only at start)
        const arrow = this.createCenteredSliderArrow(position);
        
        // Add both circle and centered arrow to slider group
        this.slider.appendChild(sliderCircle);
        if (arrow) {
            this.slider.appendChild(arrow);
        }
        
        // Add pulsing animation to circle only
        this.addSliderPulseAnimation();
        
        // Ensure slider is added AFTER trace paths (higher z-index)
        this.svg.appendChild(this.slider);
        
        console.log(`Created slider with centered arrow at coordinate ${this.currentCoordinateIndex}:`, position);
    }

    removeSlider() {
        if (this.slider) {
            this.slider.remove();
            this.slider = null;
        }
    }

    createCenteredSliderArrow(position) {
        if (!this.currentStrokeCoords || this.currentStrokeCoords.length < 2) {
            return null;
        }
        
        // Find next coordinate to point toward
        let nextCoordIndex = this.currentCoordinateIndex + 1;
        if (nextCoordIndex >= this.currentStrokeCoords.length) {
            nextCoordIndex = this.currentStrokeCoords.length - 1;
        }
        
        // Don't create arrow if we're at the end
        if (nextCoordIndex === this.currentCoordinateIndex) {
            return null;
        }
        
        const nextCoord = this.currentStrokeCoords[nextCoordIndex];
        if (!nextCoord) {
            return null;
        }
        
        // Calculate direction from current position to next coordinate
        const directionX = nextCoord.x - position.x;
        const directionY = nextCoord.y - position.y;
        const directionLength = Math.sqrt(directionX * directionX + directionY * directionY);
        
        if (directionLength === 0) return null;
        
        // Calculate rotation angle and ADD 180 degrees to flip direction
        const angle = Math.atan2(directionY, directionX) * 180 / Math.PI + 180;
        
        // Create arrow group positioned at CENTER of slider
        const arrowGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        arrowGroup.setAttribute('class', 'slider-centered-arrow');
        arrowGroup.setAttribute('transform', `translate(${position.x}, ${position.y}) rotate(${angle})`);
        
        // Create smaller arrow path that fits inside the circle
        const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const arrowSize = 12; // Smaller to fit inside slider circle
        arrowPath.setAttribute('d', `M -${arrowSize/2} 0 L ${arrowSize/2} ${arrowSize/3} L ${arrowSize/2} ${-arrowSize/3} Z`);
        arrowPath.setAttribute('fill', '#000080'); // Navy blue instead of white
        arrowPath.setAttribute('stroke', 'white');
        arrowPath.setAttribute('stroke-width', 1);
        arrowPath.setAttribute('opacity', '1'); // Full opacity for better visibility
        
        arrowGroup.appendChild(arrowPath);
        
        console.log(`Created centered arrow pointing toward coordinate ${nextCoordIndex}`);
        return arrowGroup;
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
        this.frontMarker.style.zIndex = '101'; // Higher than slider to ensure visibility during drag
        
        // No arrow on front marker - keep it simple during drag
        
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

    scheduleArrowUpdate(position) {
        // Clear any existing timeout
        if (this.arrowUpdateTimeout) {
            clearTimeout(this.arrowUpdateTimeout);
        }
        
        // Schedule arrow update after 1 second of no movement
        this.arrowUpdateTimeout = setTimeout(() => {
            if (!this.isDragging && this.slider) {
                this.updateSliderArrow(position);
                console.log('Arrow updated after movement pause');
            }
        }, 1000);
    }

    updateSliderArrow(position) {
        if (!this.slider) return;
        
        // Only update if we've moved to a significantly different coordinate index
        if (this.lastArrowUpdateIndex === this.currentCoordinateIndex) {
            return; // Skip update - arrow is already correct
        }
        
        // Remove existing centered arrow
        const existingArrow = this.slider.querySelector('.slider-centered-arrow');
        if (existingArrow) {
            existingArrow.remove();
        }
        
        // Create new centered arrow pointing toward next coordinate
        const newArrow = this.createCenteredSliderArrow(position);
        if (newArrow) {
            this.slider.appendChild(newArrow);
            this.lastArrowUpdateIndex = this.currentCoordinateIndex;
            console.log(`Arrow updated for coordinate ${this.currentCoordinateIndex}`);
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
                const sliderCircle = this.slider.querySelector('.trace-slider-circle');
                if (sliderCircle) {
                    const animate = sliderCircle.querySelector('animate');
                    if (animate) {
                        animate.remove();
                    }
                }
            }
            
            // CREATE front marker at current trace position
            const currentCoord = this.currentStrokeCoords[this.currentCoordinateIndex];
            if (currentCoord) {
                this.createFrontMarker(currentCoord);
            }
            
            console.log('🔴 Real slider hidden, 🔴 front marker created at trace position');
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
        
        // SHOW the real slider again at the current coordinate position
        if (this.slider) {
            const currentCoord = this.currentStrokeCoords[this.currentCoordinateIndex];
            if (currentCoord) {
                // Update slider position
                const sliderCircle = this.slider.querySelector('.trace-slider-circle');
                if (sliderCircle) {
                    sliderCircle.setAttribute('cx', currentCoord.x);
                    sliderCircle.setAttribute('cy', currentCoord.y);
                }
                
                // Update arrow after a brief pause (not immediately)
                this.scheduleArrowUpdate(currentCoord);
                
                this.slider.style.opacity = '1';
                this.addSliderPulseAnimation();
            }
        }
        
        // REMOVE the front marker
        this.removeFrontMarker();
        
        console.log('🔴 Real slider restored at coordinate position, 🔴 front marker removed');
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
        
        // Find the circle within the slider group
        const sliderCircle = this.slider.querySelector('.trace-slider-circle');
        if (!sliderCircle) return false;
        
        const sliderX = parseFloat(sliderCircle.getAttribute('cx'));
        const sliderY = parseFloat(sliderCircle.getAttribute('cy'));
        
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
        
        // Find the circle within the slider group
        const sliderCircle = this.slider.querySelector('.trace-slider-circle');
        if (!sliderCircle) return;
        
        // Remove any existing animation first
        const existingAnimate = sliderCircle.querySelector('animate');
        if (existingAnimate) {
            existingAnimate.remove();
        }
        
        // Add pulsing animation to indicate it's ready for interaction
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'r');
        animate.setAttribute('values', `${CONFIG.SLIDER_SIZE / 2};${CONFIG.SLIDER_SIZE / 2 + 3};${CONFIG.SLIDER_SIZE / 2}`);
        animate.setAttribute('dur', '2s');
        animate.setAttribute('repeatCount', 'indefinite');
        
        sliderCircle.appendChild(animate);
        console.log('Added pulse animation - slider ready for touch');
    }

    findBestSliderPosition(dragPoint) {
        // BALANCED APPROACH: Allow slider to move ahead slightly but not jump wildly
        // This enables initial positioning while maintaining the front-edge concept
        
        let bestCoordIndex = this.currentCoordinateIndex;
        let bestProgress = 0;
        let bestDistance = Infinity;
        
        // Allow slider to look ahead by 1-2 segments for initial positioning and smooth dragging
        // But once we're actively tracing, keep it more constrained
        const lookAheadDistance = this.currentCoordinateIndex === 0 ? 3 : 1; // More flexible at start
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
            const oldIndex = this.currentCoordinateIndex;
            this.currentCoordinateIndex = newCoordinateIndex;
            
            // Update green trace to match
            this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
            
            // Schedule arrow update only when we reach a new section
            if (this.currentCoordinateIndex > oldIndex) {
                this.scheduleArrowUpdate({ x: frontMarkerX, y: frontMarkerY });
            }
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
    }

    completeCurrentStroke() {
        console.log(`Completing stroke ${this.currentStroke}`);
        
        this.isTracing = false;
        this.isDragging = false;
        
        // Hide slider and front marker
        if (this.slider) {
            this.slider.style.opacity = '0';
        }
        this.removeFrontMarker();
        
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
        // Remove slider, front marker and clear timeouts
        this.removeSlider();
        this.removeFrontMarker();
        
        // Clear arrow update timeout
        if (this.arrowUpdateTimeout) {
            clearTimeout(this.arrowUpdateTimeout);
            this.arrowUpdateTimeout = null;
        }
        
        this.isTracing = false;
        this.isDragging = false;
        this.currentCoordinateIndex = 0;
        this.currentStrokeCoords = [];
        this.lastArrowUpdateIndex = -1;
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
