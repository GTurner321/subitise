class TracePathManager {
    constructor(svg, renderer) {
        this.svg = svg;
        this.renderer = renderer;
        
        // Slider and arrow elements
        this.slider = null;
        this.arrow = null;
        
        // Tracking state
        this.isTracing = false;
        this.currentStroke = 0;
        this.currentProgress = 0;
        this.currentCoordinateIndex = 0; // NEW: Track which coordinate we're at
        this.lastValidPosition = null;
        this.isDragging = false;
        
        // Coordinate tracking for strict progression
        this.coordinatePoints = []; // Array of actual coordinate positions
        this.coordinateTolerance = 25; // How close you need to be to a coordinate
        
        // Touch/mouse handling
        this.touchStartTime = 0;
        this.lastTouchPosition = null;
        
        // Path calculation cache
        this.pathElementCache = null;
        this.pathLengthCache = null;
        
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
        console.log(`Starting new stroke ${strokeIndex}`);
        
        this.currentStroke = strokeIndex;
        this.currentProgress = 0;
        this.currentCoordinateIndex = 0; // Start at first coordinate
        this.isTracing = false;
        this.isDragging = false;
        
        const strokeData = this.renderer.getCurrentStrokeData();
        if (!strokeData) {
            console.error('No stroke data available for stroke:', strokeIndex);
            return false;
        }
        
        // Cache the path element and length for performance
        this.pathElementCache = strokeData.visible;
        this.pathLengthCache = strokeData.length;
        
        // FIXED: Build coordinate points array for strict progression
        this.buildCoordinatePoints(strokeData.strokeData);
        
        // Remove any existing slider to prevent duplicates
        this.removeSlider();
        
        // Create slider at start position
        this.createSlider(strokeData.strokeData.startPoint);
        
        // Create direction arrow
        this.createArrow();
        this.updateArrowPosition(0);
        
        console.log(`Started stroke ${strokeIndex} with ${this.coordinatePoints.length} coordinate points`);
        return true;
    }

    buildCoordinatePoints(strokeData) {
        this.coordinatePoints = [];
        
        // All strokes are now coordinate-based
        const scaleX = CONFIG.NUMBER_RECT_WIDTH / 100;
        const scaleY = CONFIG.NUMBER_RECT_HEIGHT / 200;
        const offsetX = CONFIG.NUMBER_CENTER_X - CONFIG.NUMBER_RECT_WIDTH / 2;
        const offsetY = CONFIG.NUMBER_CENTER_Y - CONFIG.NUMBER_RECT_HEIGHT / 2;
        
        // Start with the start point
        this.coordinatePoints.push({
            x: strokeData.startPoint.x,
            y: strokeData.startPoint.y,
            index: 0
        });
        
        // Add each coordinate
        strokeData.coordinates.forEach((coord, index) => {
            const scaledX = offsetX + (coord.x * scaleX);
            const scaledY = offsetY + ((200 - coord.y) * scaleY);
            this.coordinatePoints.push({
                x: scaledX,
                y: scaledY,
                index: index + 1
            });
        });
        
        console.log('Built coordinate points:', this.coordinatePoints.length);
    }

    removeSlider() {
        if (this.slider) {
            this.slider.remove();
            this.slider = null;
        }
    }

    createSlider(startPoint) {
        // Remove existing slider first
        this.removeSlider();
        
        // Create new slider circle
        this.slider = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.slider.setAttribute('cx', startPoint.x);
        this.slider.setAttribute('cy', startPoint.y);
        this.slider.setAttribute('r', CONFIG.SLIDER_SIZE / 2);
        this.slider.setAttribute('fill', CONFIG.SLIDER_COLOR);
        this.slider.setAttribute('stroke', 'white');
        this.slider.setAttribute('stroke-width', 3);
        this.slider.setAttribute('class', 'trace-slider');
        this.slider.setAttribute('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))');
        
        // Add subtle pulsing animation to indicate it's interactive
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'r');
        animate.setAttribute('values', `${CONFIG.SLIDER_SIZE / 2};${CONFIG.SLIDER_SIZE / 2 + 3};${CONFIG.SLIDER_SIZE / 2}`);
        animate.setAttribute('dur', '2s');
        animate.setAttribute('repeatCount', 'indefinite');
        
        this.slider.appendChild(animate);
        this.svg.appendChild(this.slider);
        
        // Store initial position
        this.lastValidPosition = { x: startPoint.x, y: startPoint.y };
        
        console.log('Created slider at:', startPoint);
    }

    createArrow() {
        // Remove existing arrow
        if (this.arrow) {
            this.arrow.remove();
        }
        
        // Create arrow group
        this.arrow = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.arrow.setAttribute('class', 'direction-arrow');
        
        // Create arrow polygon (pointing right initially)
        const arrowShape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const size = CONFIG.ARROW_SIZE;
        arrowShape.setAttribute('points', `0,-${size/2} ${size},0 0,${size/2} ${size/3},0`);
        arrowShape.setAttribute('fill', CONFIG.ARROW_COLOR);
        arrowShape.setAttribute('stroke', 'white');
        arrowShape.setAttribute('stroke-width', 1);
        arrowShape.setAttribute('filter', 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))');
        
        this.arrow.appendChild(arrowShape);
        this.svg.appendChild(arrowShape);
    }

    updateArrowPosition(progress) {
        if (!this.arrow || !this.pathElementCache) return;
        
        // Calculate position ahead of current progress
        const arrowProgress = Math.min(progress + (CONFIG.ARROW_OFFSET / this.pathLengthCache), 1);
        const arrowPoint = this.pathElementCache.getPointAtLength(arrowProgress * this.pathLengthCache);
        
        // Calculate direction by looking slightly ahead
        const lookAheadProgress = Math.min(arrowProgress + (5 / this.pathLengthCache), 1);
        const lookAheadPoint = this.pathElementCache.getPointAtLength(lookAheadProgress * this.pathLengthCache);
        
        // Calculate angle
        const angle = Math.atan2(lookAheadPoint.y - arrowPoint.y, lookAheadPoint.x - arrowPoint.x);
        const angleDegrees = angle * (180 / Math.PI);
        
        // Position and rotate arrow
        this.arrow.setAttribute('transform', 
            `translate(${arrowPoint.x}, ${arrowPoint.y}) rotate(${angleDegrees})`);
        
        // Hide arrow if we're near the end
        if (progress > 0.9) {
            this.arrow.style.opacity = '0.3';
        } else {
            this.arrow.style.opacity = '1';
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
            this.touchStartTime = Date.now();
            this.lastTouchPosition = point;
            
            // Remove the pulsing animation when user starts tracing
            const slider = this.slider.querySelector('animate');
            if (slider) {
                slider.remove();
            }
            
            // Hide the arrow once tracing starts
            if (this.arrow) {
                this.arrow.style.opacity = '0';
            }
            
            console.log('Started tracing at:', point);
        }
    }

    handleMove(event) {
        if (!this.isDragging || !this.isTracing) return;
        
        event.preventDefault();
        const point = this.getEventPoint(event);
        if (!point) return;
        
        this.lastTouchPosition = point;
        
        // FIXED: Check strict coordinate progression
        const nextCoordinateResult = this.checkNextCoordinate(point);
        
        if (nextCoordinateResult.canMove) {
            this.updateSliderPosition(nextCoordinateResult.position);
            this.updateProgress();
        }
    }

    checkNextCoordinate(dragPoint) {
        // Get current slider position
        const currentPos = {
            x: parseFloat(this.slider.getAttribute('cx')),
            y: parseFloat(this.slider.getAttribute('cy'))
        };
        
        // Calculate drag vector
        const dragVector = {
            x: dragPoint.x - currentPos.x,
            y: dragPoint.y - currentPos.y
        };
        
        // If at the last coordinate, check if we can complete
        if (this.currentCoordinateIndex >= this.coordinatePoints.length - 1) {
            return {
                canMove: false,
                position: currentPos,
                completed: true
            };
        }
        
        // Get next coordinate point
        const nextCoord = this.coordinatePoints[this.currentCoordinateIndex + 1];
        const directionVector = {
            x: nextCoord.x - currentPos.x,
            y: nextCoord.y - currentPos.y
        };
        
        // Calculate the dot product to see if we're moving in the right direction
        const dotProduct = dragVector.x * directionVector.x + dragVector.y * directionVector.y;
        
        // Only allow movement if there's a positive component in the right direction
        if (dotProduct <= 0) {
            // Allow backward movement to undo progress
            return this.checkBackwardMovement(dragPoint, currentPos);
        }
        
        // Calculate how far we can move toward the next coordinate
        const directionLength = Math.sqrt(directionVector.x * directionVector.x + directionVector.y * directionVector.y);
        const dragLength = Math.sqrt(dragVector.x * dragVector.x + dragVector.y * dragVector.y);
        
        if (directionLength === 0) {
            return { canMove: false, position: currentPos };
        }
        
        // Normalize direction vector
        const normalizedDirection = {
            x: directionVector.x / directionLength,
            y: directionVector.y / directionLength
        };
        
        // Project drag vector onto direction vector
        const projectionLength = Math.min(dotProduct / directionLength, directionLength);
        
        // Calculate new position
        const newPosition = {
            x: currentPos.x + normalizedDirection.x * projectionLength,
            y: currentPos.y + normalizedDirection.y * projectionLength
        };
        
        // Check if we've reached the next coordinate
        const distanceToNext = Math.sqrt(
            Math.pow(newPosition.x - nextCoord.x, 2) + 
            Math.pow(newPosition.y - nextCoord.y, 2)
        );
        
        if (distanceToNext <= this.coordinateTolerance) {
            // Snap to the coordinate and advance
            this.currentCoordinateIndex++;
            console.log(`Reached coordinate ${this.currentCoordinateIndex}/${this.coordinatePoints.length - 1}`);
            
            return {
                canMove: true,
                position: { x: nextCoord.x, y: nextCoord.y },
                advancedCoordinate: true
            };
        }
        
        return {
            canMove: true,
            position: newPosition
        };
    }

    checkBackwardMovement(dragPoint, currentPos) {
        // Allow backward movement to undo progress
        if (this.currentCoordinateIndex <= 0) {
            return { canMove: false, position: currentPos };
        }
        
        // Get previous coordinate
        const prevCoord = this.coordinatePoints[this.currentCoordinateIndex - 1];
        const backwardVector = {
            x: prevCoord.x - currentPos.x,
            y: prevCoord.y - currentPos.y
        };
        
        const dragVector = {
            x: dragPoint.x - currentPos.x,
            y: dragPoint.y - currentPos.y
        };
        
        // Check if drag is toward previous coordinate
        const dotProduct = dragVector.x * backwardVector.x + dragVector.y * backwardVector.y;
        
        if (dotProduct > 0) {
            // Moving backward - allow it and potentially undo coordinate
            const backwardLength = Math.sqrt(backwardVector.x * backwardVector.x + backwardVector.y * backwardVector.y);
            const dragLength = Math.sqrt(dragVector.x * dragVector.x + dragVector.y * dragVector.y);
            
            if (backwardLength > 0) {
                const normalizedBackward = {
                    x: backwardVector.x / backwardLength,
                    y: backwardVector.y / backwardLength
                };
                
                const projectionLength = Math.min(dotProduct / backwardLength, backwardLength);
                const newPosition = {
                    x: currentPos.x + normalizedBackward.x * projectionLength,
                    y: currentPos.y + normalizedBackward.y * projectionLength
                };
                
                // Check if we've gone back to previous coordinate
                const distanceToPrev = Math.sqrt(
                    Math.pow(newPosition.x - prevCoord.x, 2) + 
                    Math.pow(newPosition.y - prevCoord.y, 2)
                );
                
                if (distanceToPrev <= this.coordinateTolerance) {
                    this.currentCoordinateIndex--;
                    console.log(`Moved back to coordinate ${this.currentCoordinateIndex}`);
                    return {
                        canMove: true,
                        position: { x: prevCoord.x, y: prevCoord.y },
                        movedBackward: true
                    };
                }
                
                return {
                    canMove: true,
                    position: newPosition
                };
            }
        }
        
        return { canMove: false, position: currentPos };
    }

    updateSliderPosition(position) {
        if (!this.slider) return;
        
        this.slider.setAttribute('cx', position.x);
        this.slider.setAttribute('cy', position.y);
        this.lastValidPosition = position;
    }

    updateProgress() {
        // Calculate progress based on current coordinate index
        const progress = this.currentCoordinateIndex / (this.coordinatePoints.length - 1);
        this.currentProgress = progress;
        
        // Update renderer with progress
        this.renderer.updateTracingProgress(this.currentStroke, progress);
        
        // Update arrow position
        this.updateArrowPosition(progress);
        
        // Check for stroke completion
        if (this.currentCoordinateIndex >= this.coordinatePoints.length - 1) {
            this.completeCurrentStroke();
        }
    }

    handleEnd(event) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        console.log('Ended tracing. Progress:', this.currentProgress, 'Coordinate:', this.currentCoordinateIndex);
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
        if (!this.slider || !this.lastValidPosition) return false;
        
        const distance = Math.sqrt(
            Math.pow(point.x - this.lastValidPosition.x, 2) +
            Math.pow(point.y - this.lastValidPosition.y, 2)
        );
        
        return distance <= CONFIG.SLIDER_SIZE;
    }

    completeCurrentStroke() {
        console.log(`Completing stroke ${this.currentStroke}`);
        
        this.isTracing = false;
        this.isDragging = false;
        
        // Hide slider and arrow for current stroke
        if (this.slider) {
            this.slider.style.opacity = '0';
        }
        if (this.arrow) {
            this.arrow.style.opacity = '0';
        }
        
        // Remove slider and arrow after fade
        setTimeout(() => {
            this.removeSlider();
            if (this.arrow) {
                this.arrow.remove();
                this.arrow = null;
            }
        }, 300);
        
        // Notify renderer of completion
        this.renderer.completeStroke(this.currentStroke);
    }

    moveToNextStroke() {
        const nextStroke = this.currentStroke + 1;
        if (nextStroke < this.renderer.tracingPaths.length) {
            this.startNewStroke(nextStroke);
            return true;
        }
        return false;
    }

    getCurrentProgress() {
        return this.currentProgress;
    }

    isCurrentlyTracing() {
        return this.isTracing;
    }

    cleanup() {
        // Remove all created elements
        this.removeSlider();
        if (this.arrow) {
            this.arrow.remove();
            this.arrow = null;
        }
        
        this.isTracing = false;
        this.isDragging = false;
        this.currentProgress = 0;
        this.currentCoordinateIndex = 0;
        this.lastValidPosition = null;
        this.coordinatePoints = [];
    }

    reset() {
        this.cleanup();
        this.currentStroke = 0;
        this.pathElementCache = null;
        this.pathLengthCache = null;
    }

    // Debug methods
    showCoordinatePoints() {
        if (!CONFIG.DEBUG_MODE) return;
        
        // Remove existing debug points
        const existing = this.svg.querySelectorAll('.debug-coordinate');
        existing.forEach(el => el.remove());
        
        this.coordinatePoints.forEach((coord, index) => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', coord.x);
            circle.setAttribute('cy', coord.y);
            circle.setAttribute('r', 5);
            circle.setAttribute('fill', index === this.currentCoordinateIndex ? 'red' : 'blue');
            circle.setAttribute('stroke', 'white');
            circle.setAttribute('stroke-width', 1);
            circle.setAttribute('class', 'debug-coordinate');
            
            // Add number label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', coord.x);
            text.setAttribute('y', coord.y - 10);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '10');
            text.setAttribute('fill', 'black');
            text.setAttribute('class', 'debug-coordinate');
            text.textContent = index;
            
            this.svg.appendChild(circle);
            this.svg.appendChild(text);
        });
    }

    highlightToleranceArea(point) {
        if (!CONFIG.DEBUG_MODE) return;
        
        // Remove existing tolerance indicator
        const existing = this.svg.querySelector('.tolerance-indicator');
        if (existing) existing.remove();
        
        // Create tolerance area circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', point.x);
        circle.setAttribute('cy', point.y);
        circle.setAttribute('r', this.coordinateTolerance);
        circle.setAttribute('fill', 'rgba(255,255,0,0.2)');
        circle.setAttribute('stroke', 'yellow');
        circle.setAttribute('stroke-width', 1);
        circle.setAttribute('class', 'tolerance-indicator');
        
        this.svg.appendChild(circle);
    }
}
