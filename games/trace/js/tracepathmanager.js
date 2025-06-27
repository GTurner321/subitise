class TracePathManager {
    constructor(svg, renderer) {
        this.svg = svg;
        this.renderer = renderer;
        
        this.slider = null;
        this.frontMarker = null;
        this.isTracing = false;
        this.currentStroke = 0;
        this.currentCoordinateIndex = 0;
        this.isDragging = false;
        this.frontMarkerCoordIndex = 0;
        this.frontMarkerProgress = 0;
        this.finalFrontMarkerCoordIndex = 0;
        this.finalFrontMarkerProgress = 0;
        this.currentStrokeCoords = [];
        this.strokeCompletionCoordIndex = 0;
        this.strokeCompletionCoord = null;
        this.lastMovementTime = Date.now();
        this.currentNumberForFallback = 0; // Add fallback storage
        
        this.strokeEndCoordinates = {
            0: [[100, 100]],
            1: [[50, 0]],
            2: [[0, 0], [100, 0]],
            3: [[35, 100], [0, 10]],
            4: [[0, 80], [60, 40], [100, 80]], // stroke 1 ends at start of stroke 2 (60,40), but final stroke ends at (100,80)
            5: [[0, 200], [0, 125], [100, 200]], // stroke 0 ends at start of stroke 1 (0,200), but final stroke ends at (100,200)
            6: [[2, 77]],
            7: [[100, 200], [40, 0]],
            8: [[95, 152.5]],
            9: [[100, 190], [80, 0]]
        };
        
        this.strokeCompletionTriggers = {
            0: [[99, 80]],
            1: [[50, 20]],
            2: [[36, 48], [80, 0]],
            3: [[70, 107], [4, 8]],
            4: [[18, 152], [80, 80], [60, 30]],
            5: [[80, 200], [0, 150], [2, 11]],
            6: [[6, 88]],
            7: [[80, 200], [50, 33]],
            8: [[94, 142.5]],
            9: [[98.9, 182], [83, 30]]
        };
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        if (!this.svg) return;
        
        const events = [
            ['mousedown', 'handleStart'],
            ['mousemove', 'handleMove'],
            ['mouseup', 'handleEnd'],
            ['mouseleave', 'handleEnd'],
            ['touchstart', 'handleStart'],
            ['touchmove', 'handleMove'],
            ['touchend', 'handleEnd'],
            ['touchcancel', 'handleEnd']
        ];
        
        events.forEach(([event, handler]) => {
            const options = event.startsWith('touch') ? { passive: false } : undefined;
            this.svg.addEventListener(event, (e) => this[handler](e), options);
        });
    }

    startNewStroke(strokeIndex) {
        this.currentStroke = strokeIndex;
        this.currentCoordinateIndex = 0;
        this.isTracing = false;
        this.isDragging = false;
        this.lastMovementTime = Date.now();
        
        this.frontMarkerCoordIndex = 0;
        this.frontMarkerProgress = 0;
        this.finalFrontMarkerCoordIndex = 0;
        this.finalFrontMarkerProgress = 0;
        
        this.currentStrokeCoords = this.renderer.getStrokeCoordinates(strokeIndex);
        
        if (!this.currentStrokeCoords?.length) return false;
        
        this.setupStrokeCompletion();
        this.removeSlider();
        this.removeFrontMarker();
        this.createSlider(this.currentStrokeCoords[0]);
        
        return true;
    }

    setupStrokeCompletion() {
        const currentNumber = this.getCurrentNumber();
        const triggerCoords = this.strokeCompletionTriggers[currentNumber]?.[this.currentStroke];
        
        console.log(`Setting up stroke completion for number ${currentNumber}, stroke ${this.currentStroke}:`, {
            triggerCoords,
            endCoords: this.strokeEndCoordinates[currentNumber]?.[this.currentStroke]
        });
        
        // Simple fallback completion near end of stroke
        const totalCoords = this.currentStrokeCoords.length;
        this.strokeCompletionCoordIndex = Math.max(0, totalCoords - 3);
        this.strokeCompletionCoord = this.currentStrokeCoords[this.strokeCompletionCoordIndex];
    }

    findCoordinateInPath(targetCoord) {
        const tolerance = 15; // Increased tolerance from 10 to 15
        let closestIndex = -1;
        let closestDistance = Infinity;
        
        for (let i = 0; i < this.currentStrokeCoords.length; i++) {
            const coord = this.currentStrokeCoords[i];
            const distance = Math.sqrt(
                Math.pow(coord.x - targetCoord[0], 2) + 
                Math.pow(coord.y - targetCoord[1], 2)
            );
            
            if (distance <= tolerance && distance < closestDistance) {
                closestDistance = distance;
                closestIndex = i;
            }
        }
        
        return closestIndex;
    }

    createSlider(position) {
        this.removeSlider();
        
        this.slider = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.slider.setAttribute('cx', position.x);
        this.slider.setAttribute('cy', position.y);
        this.slider.setAttribute('r', CONFIG.SLIDER_SIZE / 2);
        this.slider.setAttribute('fill', CONFIG.SLIDER_COLOR);
        this.slider.setAttribute('stroke', 'white');
        this.slider.setAttribute('stroke-width', 3);
        this.slider.setAttribute('class', 'trace-slider');
        this.slider.setAttribute('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))');
        
        this.addSliderPulseAnimation();
        this.svg.appendChild(this.slider);
    }

    removeSlider() {
        this.slider?.remove();
        this.slider = null;
    }

    createFrontMarker(position) {
        this.removeFrontMarker();
        
        this.frontMarker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        this.frontMarker.setAttribute('cx', position.x);
        this.frontMarker.setAttribute('cy', position.y);
        this.frontMarker.setAttribute('r', CONFIG.SLIDER_SIZE / 2);
        this.frontMarker.setAttribute('fill', CONFIG.SLIDER_COLOR);
        this.frontMarker.setAttribute('stroke', 'white');
        this.frontMarker.setAttribute('stroke-width', 3);
        this.frontMarker.setAttribute('class', 'front-marker');
        this.frontMarker.setAttribute('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))');
        
        this.svg.appendChild(this.frontMarker);
    }

    removeFrontMarker() {
        this.frontMarker?.remove();
        this.frontMarker = null;
    }

    updateFrontMarkerPosition(position) {
        if (this.frontMarker) {
            this.frontMarker.setAttribute('cx', position.x);
            this.frontMarker.setAttribute('cy', position.y);
        }
    }

    addSliderPulseAnimation() {
        if (!this.slider) return;
        
        const existingAnimate = this.slider.querySelector('animate');
        existingAnimate?.remove();
        
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'r');
        animate.setAttribute('values', `${CONFIG.SLIDER_SIZE / 2};${(CONFIG.SLIDER_SIZE / 2) + 3};${CONFIG.SLIDER_SIZE / 2}`);
        animate.setAttribute('dur', '2s');
        animate.setAttribute('repeatCount', 'indefinite');
        
        this.slider.appendChild(animate);
    }

    handleStart(event) {
        event.preventDefault();
        
        const point = this.getEventPoint(event);
        if (!point || !this.isPointNearSlider(point)) return;
        
        this.isDragging = true;
        this.isTracing = true;
        
        if (this.slider) {
            this.slider.style.opacity = '0';
            this.slider.querySelector('animate')?.remove();
        }
        
        const currentCoord = this.currentStrokeCoords[this.currentCoordinateIndex];
        if (currentCoord) {
            this.createFrontMarker(currentCoord);
            this.frontMarkerCoordIndex = this.currentCoordinateIndex;
            this.frontMarkerProgress = 0;
        }
    }

    handleMove(event) {
        if (!this.isDragging || !this.isTracing) return;
        
        event.preventDefault();
        const point = this.getEventPoint(event);
        if (!point) return;
        
        this.lastMovementTime = Date.now();
        
        const bestPosition = this.findBestSliderPosition(point);
        if (bestPosition) {
            this.updateTracingProgress(bestPosition);
        }
    }

    handleEnd(event) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.finalFrontMarkerCoordIndex = this.frontMarkerCoordIndex;
        this.finalFrontMarkerProgress = this.frontMarkerProgress;
        
        setTimeout(() => {
            if (!this.isDragging && this.slider) {
                const finalPosition = this.getInterpolatedPosition(
                    this.finalFrontMarkerCoordIndex, 
                    this.finalFrontMarkerProgress
                );
                
                if (finalPosition) {
                    this.slider.setAttribute('cx', finalPosition.x);
                    this.slider.setAttribute('cy', finalPosition.y);
                    
                    this.currentCoordinateIndex = this.finalFrontMarkerCoordIndex;
                    if (this.finalFrontMarkerProgress >= 0.95) {
                        this.currentCoordinateIndex = Math.min(
                            this.currentCoordinateIndex + 1, 
                            this.currentStrokeCoords.length - 1
                        );
                    }
                    
                    this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
                }
                
                this.slider.style.transition = 'opacity 0.25s ease-in';
                this.slider.style.opacity = '1';
                
                setTimeout(() => {
                    if (!this.isDragging) this.addSliderPulseAnimation();
                }, 250);
                
                setTimeout(() => {
                    if (this.slider) this.slider.style.transition = '';
                }, 300);
            }
        }, 500);
        
        setTimeout(() => {
            if (!this.isDragging) this.removeFrontMarker();
        }, 500);
    }

    getEventPoint(event) {
        const rect = this.svg.getBoundingClientRect();
        const isTouch = event.type.startsWith('touch');
        
        if (isTouch && !event.touches.length) return null;
        
        const clientX = isTouch ? event.touches[0].clientX : event.clientX;
        const clientY = isTouch ? event.touches[0].clientY : event.clientY;
        
        return {
            x: (clientX - rect.left) * (CONFIG.SVG_WIDTH / rect.width),
            y: (clientY - rect.top) * (CONFIG.SVG_HEIGHT / rect.height)
        };
    }

    isPointNearSlider(point) {
        if (!this.slider) return false;
        
        const sliderX = parseFloat(this.slider.getAttribute('cx'));
        const sliderY = parseFloat(this.slider.getAttribute('cy'));
        
        const distance = Math.sqrt(
            Math.pow(point.x - sliderX, 2) + Math.pow(point.y - sliderY, 2)
        );
        
        return distance <= CONFIG.SLIDER_SIZE;
    }

    findBestSliderPosition(dragPoint) {
        let bestCoordIndex = this.currentCoordinateIndex;
        let bestProgress = 0;
        let bestDistance = Infinity;
        
        const lookAhead = this.currentCoordinateIndex === 0 ? 5 : 3;
        const maxIndex = Math.min(this.currentCoordinateIndex + lookAhead, this.currentStrokeCoords.length - 2);
        const minIndex = Math.max(0, this.currentCoordinateIndex - 2);
        
        for (let i = minIndex; i <= maxIndex; i++) {
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
                Math.pow(dragPoint.x - pointX, 2) + Math.pow(dragPoint.y - pointY, 2)
            );
            
            const maxDistance = CONFIG.PATH_TOLERANCE || 60;
            
            if (distanceToSegment <= maxDistance && distanceToSegment < bestDistance) {
                bestDistance = distanceToSegment;
                bestCoordIndex = i;
                bestProgress = projectionProgress;
            }
        }
        
        return bestDistance <= (CONFIG.PATH_TOLERANCE || 60) ? {
            coordIndex: bestCoordIndex,
            progress: bestProgress,
            distance: bestDistance
        } : null;
    }

    updateTracingProgress(position) {
        const { coordIndex, progress } = position;
        
        this.frontMarkerCoordIndex = coordIndex;
        this.frontMarkerProgress = progress;
        
        const currentCoord = this.currentStrokeCoords[coordIndex];
        const nextCoord = this.currentStrokeCoords[coordIndex + 1];
        
        const frontMarkerX = currentCoord.x + (nextCoord.x - currentCoord.x) * progress;
        const frontMarkerY = currentCoord.y + (nextCoord.y - currentCoord.y) * progress;
        
        this.updateFrontMarkerPosition({ x: frontMarkerX, y: frontMarkerY });
        
        // Debug: Log progress for number 0
        const currentNumber = this.getCurrentNumber();
        if (currentNumber === 0) {
            console.log(`Number 0 progress: coordIndex=${coordIndex}, progress=${progress.toFixed(2)}, totalCoords=${this.currentStrokeCoords.length}`);
        }
        
        // Check if we've reached the trigger coordinate in the path
        if (this.checkForTriggerAtCurrentCoord(coordIndex)) {
            console.log(`Trigger detected! Calling autoCompleteCurrentStroke()`);
            this.autoCompleteCurrentStroke();
            return;
        }
        
        let newCoordinateIndex = this.currentCoordinateIndex;
        
        if (coordIndex > this.currentCoordinateIndex) {
            if (progress >= 0.5) newCoordinateIndex = coordIndex;
        } else if (coordIndex === this.currentCoordinateIndex && progress >= 0.7) {
            newCoordinateIndex = Math.min(this.currentCoordinateIndex + 1, this.currentStrokeCoords.length - 1);
        }
        
        newCoordinateIndex = Math.min(newCoordinateIndex, coordIndex);
        
        if (progress < 0.7 && coordIndex === newCoordinateIndex && coordIndex > 0) {
            newCoordinateIndex = Math.max(0, coordIndex - 1);
        }
        
        if (newCoordinateIndex !== this.currentCoordinateIndex) {
            this.currentCoordinateIndex = newCoordinateIndex;
            this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
            
            // Debug: Log when we update the coordinate index for number 0
            if (currentNumber === 0) {
                console.log(`Number 0 coordinate index updated to: ${this.currentCoordinateIndex}`);
            }
        }
    }

    checkForTriggerAtCurrentCoord(coordIndex) {
        const currentNumber = this.getCurrentNumber();
        const triggerCoords = this.strokeCompletionTriggers[currentNumber]?.[this.currentStroke];
        
        const currentCoord = this.currentStrokeCoords[coordIndex];
        if (!currentCoord) return false;
        
        // Check if we've reached the specific trigger point
        if (triggerCoords) {
            const triggerMatch = (currentCoord.x === triggerCoords[0]) && 
                                (currentCoord.y === triggerCoords[1]);
            
            if (triggerMatch) {
                console.log(`Trigger reached for number ${currentNumber}, stroke ${this.currentStroke}: (${currentCoord.x}, ${currentCoord.y})`);
                return true;
            }
        }
        
        // Also check if we've reached the final coordinate in the stroke path
        const isLastCoord = coordIndex === this.currentStrokeCoords.length - 1;
        if (isLastCoord) {
            console.log(`Final coordinate reached for number ${currentNumber}, stroke ${this.currentStroke}: (${currentCoord.x}, ${currentCoord.y})`);
            return true;
        }
        
        return false;
    }

    hasReachedStrokeCompletionPoint(coordIndex, progress) {
        const result = coordIndex >= this.strokeCompletionCoordIndex && 
               (coordIndex > this.strokeCompletionCoordIndex || progress >= 0.5);
        
        // Debug logging for ALL numbers to see if triggers are working
        const currentNumber = this.getCurrentNumber();
        if (result) {
            console.log(`Stroke completion triggered for number ${currentNumber}, stroke ${this.currentStroke}:`, {
                coordIndex,
                progress,
                strokeCompletionCoordIndex: this.strokeCompletionCoordIndex,
                triggerCoords: this.strokeCompletionTriggers[currentNumber]?.[this.currentStroke],
                endCoords: this.strokeEndCoordinates[currentNumber]?.[this.currentStroke]
            });
        }
        
        return result;
    }

    autoCompleteCurrentStroke() {
        // First complete the current stroke path
        this.currentCoordinateIndex = this.currentStrokeCoords.length - 1;
        this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
        
        // Move front marker and slider to the defined end point
        const currentNumber = this.getCurrentNumber();
        const endCoords = this.strokeEndCoordinates[currentNumber]?.[this.currentStroke];
        
        if (endCoords) {
            // Update front marker to the defined end position
            if (this.frontMarker) {
                this.updateFrontMarkerPosition({ x: endCoords[0], y: endCoords[1] });
            }
            
            // Update slider position to end coordinates
            if (this.slider) {
                this.slider.setAttribute('cx', endCoords[0]);
                this.slider.setAttribute('cy', endCoords[1]);
            }
            
            console.log(`Moving to end coordinates for number ${currentNumber}, stroke ${this.currentStroke}:`, endCoords);
        } else {
            // Fallback to final coordinate if no end point defined
            const finalCoord = this.currentStrokeCoords[this.currentStrokeCoords.length - 1];
            if (finalCoord) {
                if (this.frontMarker) {
                    this.updateFrontMarkerPosition(finalCoord);
                }
                if (this.slider) {
                    this.slider.setAttribute('cx', finalCoord.x);
                    this.slider.setAttribute('cy', finalCoord.y);
                }
            }
        }
        
        this.finalFrontMarkerCoordIndex = this.currentStrokeCoords.length - 1;
        this.finalFrontMarkerProgress = 1.0;
        
        setTimeout(() => this.completeCurrentStroke(), 200);
    }

    completeCurrentStroke() {
        console.log(`Completing stroke ${this.currentStroke} for number ${this.getCurrentNumber()}`);
        
        this.renderer.completeStroke(this.currentStroke);
        
        const totalStrokes = this.renderer.getStrokeCount();
        console.log(`Total strokes: ${totalStrokes}, current stroke: ${this.currentStroke}`);
        
        if (this.currentStroke + 1 < totalStrokes) {
            // More strokes to go - start next stroke
            console.log('Starting next stroke...');
            this.endCurrentStroke(() => this.startNewStroke(this.currentStroke + 1));
        } else {
            // This was the final stroke - complete the number
            console.log('Final stroke completed - calling renderer.completeNumber()');
            this.endCurrentStroke(() => {
                this.removeSlider();
                this.renderer.completeNumber();
            });
        }
    }

    endCurrentStroke(callback) {
        this.isTracing = false;
        this.isDragging = false;
        
        if (this.slider) this.slider.style.opacity = '0';
        this.removeFrontMarker();
        
        setTimeout(callback, 300);
    }

    // FIXED: Enhanced getCurrentNumber method with multiple fallbacks
    getCurrentNumber() {
        // Check if window.traceGame exists and has getCurrentNumber method
        if (window.traceGame && typeof window.traceGame.getCurrentNumber === 'function') {
            const num = window.traceGame.getCurrentNumber();
            console.log(`getCurrentNumber from window.traceGame: ${num}`);
            return num;
        }
        
        // Fallback - try direct property access
        if (window.traceGame && window.traceGame.currentNumber !== undefined) {
            const num = window.traceGame.currentNumber;
            console.log(`getCurrentNumber from window.traceGame.currentNumber: ${num}`);
            return num;
        }
        
        // Additional fallback - check renderer's currentNumber
        if (this.renderer && this.renderer.currentNumber !== undefined && this.renderer.currentNumber !== null) {
            const num = this.renderer.currentNumber;
            console.log(`getCurrentNumber from renderer: ${num}`);
            return num;
        }
        
        // Final fallback - use stored number
        if (this.currentNumberForFallback !== undefined) {
            const num = this.currentNumberForFallback;
            console.log(`getCurrentNumber from fallback storage: ${num}`);
            return num;
        }
        
        console.log('getCurrentNumber failed - returning 0 as default');
        console.log('window.traceGame:', window.traceGame);
        return 0; // Return 0 instead of null as a safe default
    }

    // NEW: Method to set current number for fallback
    setCurrentNumber(number) {
        this.currentNumberForFallback = number;
        console.log(`PathManager: setCurrentNumber called with ${number}`);
    }

    getInterpolatedPosition(coordIndex, progress) {
        if (coordIndex < 0 || coordIndex >= this.currentStrokeCoords.length - 1) {
            return this.currentStrokeCoords[Math.max(0, Math.min(coordIndex, this.currentStrokeCoords.length - 1))];
        }
        
        const currentCoord = this.currentStrokeCoords[coordIndex];
        const nextCoord = this.currentStrokeCoords[coordIndex + 1];
        
        if (!currentCoord || !nextCoord) return currentCoord || nextCoord;
        
        return {
            x: currentCoord.x + (nextCoord.x - currentCoord.x) * progress,
            y: currentCoord.y + (nextCoord.y - currentCoord.y) * progress
        };
    }

    cleanup() {
        this.removeSlider();
        this.removeFrontMarker();
        this.isTracing = false;
        this.isDragging = false;
        this.currentCoordinateIndex = 0;
        this.currentStrokeCoords = [];
        this.frontMarkerCoordIndex = 0;
        this.frontMarkerProgress = 0;
        this.finalFrontMarkerCoordIndex = 0;
        this.finalFrontMarkerProgress = 0;
    }

    reset() {
        this.cleanup();
        this.currentStroke = 0;
        this.currentNumberForFallback = 0;
    }

    getCurrentProgress() {
        return this.currentStrokeCoords.length === 0 ? 0 : 
               this.currentCoordinateIndex / (this.currentStrokeCoords.length - 1);
    }

    isCurrentlyTracing() {
        return this.isTracing;
    }
}
