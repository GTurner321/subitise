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
        this.currentNumberForFallback = 0;
        
        // CORRECTED: Based on your original file - these are the CONCEPTUAL stroke endpoints
        // Numbers 2 and 3 ARE multi-stroke conceptually even though they're single paths
        this.strokeEndCoordinates = {
            0: [[100, 100]], // Single conceptual stroke
            1: [[50, 0]], // Single conceptual stroke
            2: [[0, 0], [100, 0]], // TWO conceptual strokes: curve ends at (0,0), line ends at (100,0)
            3: [[35, 100], [0, 10]], // TWO conceptual strokes: curves end at (35,100), final curve ends at (0,10)
            4: [[0, 80], [60, 40], [100, 80]], // THREE strokes: L-shape, connection, vertical
            5: [[0, 200], [0, 125], [100, 200]], // THREE strokes: horizontal, vertical, curve
            6: [[2, 77]], // Single conceptual stroke
            7: [[100, 200], [40, 0]], // TWO conceptual strokes: horizontal, diagonal
            8: [[95, 152.5]], // Single conceptual stroke
            9: [[100, 190], [80, 0]] // TWO conceptual strokes: circle, tail
        };
        
        // CORRECTED: Trigger points that match the coordinate paths (unscaled 0-100, 0-200 system)
        this.strokeCompletionTriggers = {
            0: [[99, 80]], // Near the end but not at start
            1: [[50, 20]], // Near the top
            2: [[36, 48], [80, 0]], // End of curve, end of horizontal line
            3: [[70, 107], [4, 8]], // End of middle section, end of final curve
            4: [[18, 152], [80, 80], [60, 30]], // End of L-shape, end of horizontal, end of vertical
            5: [[80, 200], [0, 150], [2, 11]], // End of horizontal, partway down vertical, end of curve
            6: [[6, 88]], // Near the end
            7: [[80, 200], [50, 33]], // End of horizontal, end of diagonal
            8: [[94, 142.5]], // Near the end
            9: [[98.9, 182], [83, 30]] // End of circle, end of tail
        };
        
        // CORRECTED: Number of conceptual strokes (matches trigger/end coordinate arrays)
        this.strokeCounts = {
            0: 1, 1: 1, 2: 2, 3: 2, 4: 3, 5: 3, 6: 1, 7: 2, 8: 1, 9: 2
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

    // Use our internal stroke count, not CONFIG
    getStrokeCount() {
        const currentNumber = this.getCurrentNumber();
        return this.strokeCounts[currentNumber] || 1;
    }

    startNewStroke(strokeIndex) {
        const currentNumber = this.getCurrentNumber();
        const totalStrokes = this.getStrokeCount();
        
        console.log(`🎯 Starting stroke ${strokeIndex} for number ${currentNumber} (${strokeIndex + 1}/${totalStrokes})`);
        
        this.currentStroke = strokeIndex;
        this.currentCoordinateIndex = 0;
        this.isTracing = false;
        this.isDragging = false;
        this.lastMovementTime = Date.now();
        
        this.frontMarkerCoordIndex = 0;
        this.frontMarkerProgress = 0;
        this.finalFrontMarkerCoordIndex = 0;
        this.finalFrontMarkerProgress = 0;
        
        // For multi-stroke conceptual numbers (2,3,7,9), we always use stroke 0 coordinates 
        // since they're single paths split conceptually
        const coordStrokeIndex = (currentNumber === 2 || currentNumber === 3 || currentNumber === 7 || currentNumber === 9) ? 0 : strokeIndex;
        this.currentStrokeCoords = this.renderer.getStrokeCoordinates(coordStrokeIndex);
        
        if (!this.currentStrokeCoords?.length) {
            console.error(`❌ No coordinates found for stroke ${coordStrokeIndex} of number ${currentNumber}`);
            return false;
        }
        
        console.log(`✅ Stroke ${strokeIndex} has ${this.currentStrokeCoords.length} coordinates`);
        
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
            endCoords: this.strokeEndCoordinates[currentNumber]?.[this.currentStroke],
            totalStrokes: this.getStrokeCount()
        });
        
        // Set completion near end of stroke as fallback
        const totalCoords = this.currentStrokeCoords.length;
        this.strokeCompletionCoordIndex = Math.max(0, totalCoords - 3);
        this.strokeCompletionCoord = this.currentStrokeCoords[this.strokeCompletionCoordIndex];
    }

    createSlider(position) {
        console.log('Creating slider at position:', position);
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
        
        // Check for trigger coordinate match using SCALED coordinates
        if (this.checkForTriggerAtCurrentCoord(coordIndex)) {
            console.log(`🎯 Trigger detected! Calling autoCompleteCurrentStroke()`);
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
        }
        
        // Force completion if at the very end
        if (coordIndex === this.currentStrokeCoords.length - 1 && progress >= 0.95) {
            console.log(`🔚 Forcing completion at final coordinate`);
            this.autoCompleteCurrentStroke();
            return;
        }
    }

    // CORRECTED: Convert scaled coordinates back to 0-100, 0-200 system for comparison
    checkForTriggerAtCurrentCoord(coordIndex) {
        const currentNumber = this.getCurrentNumber();
        const triggerCoords = this.strokeCompletionTriggers[currentNumber]?.[this.currentStroke];
        
        const currentCoord = this.currentStrokeCoords[coordIndex];
        if (!currentCoord || !triggerCoords) return false;
        
        // Convert scaled coordinate back to 0-100, 0-200 system
        const scaleX = CONFIG.NUMBER_RECT_WIDTH / 100;
        const scaleY = CONFIG.NUMBER_RECT_HEIGHT / 200;
        const offsetX = CONFIG.NUMBER_CENTER_X - CONFIG.NUMBER_RECT_WIDTH / 2;
        const offsetY = CONFIG.NUMBER_CENTER_Y - CONFIG.NUMBER_RECT_HEIGHT / 2;
        
        const unscaledX = (currentCoord.x - offsetX) / scaleX;
        const unscaledY = 200 - ((currentCoord.y - offsetY) / scaleY);
        
        // Check for exact match (within 1 unit tolerance)
        const targetX = triggerCoords[0];
        const targetY = triggerCoords[1];
        
        const xMatch = Math.abs(unscaledX - targetX) <= 1;
        const yMatch = Math.abs(unscaledY - targetY) <= 1;
        
        // Don't trigger on start if start equals end (like number 0)
        if (coordIndex === 0) {
            const endCoords = this.strokeEndCoordinates[currentNumber]?.[this.currentStroke];
            if (endCoords && Math.abs(targetX - endCoords[0]) <= 1 && Math.abs(targetY - endCoords[1]) <= 1) {
                console.log(`🚫 Skipping trigger at start for number ${currentNumber} (start == end)`);
                return false;
            }
        }
        
        if (xMatch && yMatch) {
            console.log(`✅ TRIGGER MATCH for number ${currentNumber}, stroke ${this.currentStroke}: (${unscaledX.toFixed(1)}, ${unscaledY.toFixed(1)}) matches (${targetX}, ${targetY})`);
            return true;
        }
        
        // Also check if we've reached the final coordinate
        const isLastCoord = coordIndex === this.currentStrokeCoords.length - 1;
        if (isLastCoord) {
            console.log(`✅ Final coordinate reached for number ${currentNumber}, stroke ${this.currentStroke}`);
            return true;
        }
        
        return false;
    }

    autoCompleteCurrentStroke() {
        // First complete the current stroke path
        this.currentCoordinateIndex = this.currentStrokeCoords.length - 1;
        this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
        
        const currentNumber = this.getCurrentNumber();
        const endCoords = this.strokeEndCoordinates[currentNumber]?.[this.currentStroke];
        
        if (endCoords) {
            // CORRECTED: Scale the end coordinates properly for display
            const scaleX = CONFIG.NUMBER_RECT_WIDTH / 100;
            const scaleY = CONFIG.NUMBER_RECT_HEIGHT / 200;
            const offsetX = CONFIG.NUMBER_CENTER_X - CONFIG.NUMBER_RECT_WIDTH / 2;
            const offsetY = CONFIG.NUMBER_CENTER_Y - CONFIG.NUMBER_RECT_HEIGHT / 2;
            
            const scaledX = offsetX + (endCoords[0] * scaleX);
            const scaledY = offsetY + ((200 - endCoords[1]) * scaleY);
            
            console.log(`Moving to end coords for number ${currentNumber}, stroke ${this.currentStroke}: (${endCoords[0]}, ${endCoords[1]}) → (${scaledX.toFixed(1)}, ${scaledY.toFixed(1)})`);
            
            // Update front marker to the scaled end position
            if (this.frontMarker) {
                this.updateFrontMarkerPosition({ x: scaledX, y: scaledY });
            }
            
            // Update slider position to scaled end coordinates
            if (this.slider) {
                this.slider.setAttribute('cx', scaledX);
                this.slider.setAttribute('cy', scaledY);
            }
        } else {
            // Fallback to final coordinate
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
        const currentNumber = this.getCurrentNumber();
        console.log(`Completing stroke ${this.currentStroke} for number ${currentNumber}`);
        
        this.renderer.completeStroke(this.currentStroke);
        
        const totalStrokes = this.getStrokeCount(); // Use our internal count
        console.log(`Total strokes: ${totalStrokes}, current stroke: ${this.currentStroke}`);
        
        if (this.currentStroke + 1 < totalStrokes) {
            // More strokes to go - start next conceptual stroke
            const nextStroke = this.currentStroke + 1;
            console.log(`Starting next conceptual stroke: ${nextStroke}`);
            this.endCurrentStroke(() => this.startNewStroke(nextStroke));
        } else {
            // This was the final stroke - complete the number
            console.log(`✅ All conceptual strokes completed - calling renderer.completeNumber()`);
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

    getCurrentNumber() {
        // Check if window.traceGame exists and has getCurrentNumber method
        if (window.traceGame && typeof window.traceGame.getCurrentNumber === 'function') {
            return window.traceGame.getCurrentNumber();
        }
        
        // Fallback - try direct property access
        if (window.traceGame && window.traceGame.currentNumber !== undefined) {
            return window.traceGame.currentNumber;
        }
        
        // Additional fallback - check renderer's currentNumber
        if (this.renderer && this.renderer.currentNumber !== undefined && this.renderer.currentNumber !== null) {
            return this.renderer.currentNumber;
        }
        
        // Final fallback - use stored number
        if (this.currentNumberForFallback !== undefined) {
            return this.currentNumberForFallback;
        }
        
        console.warn('getCurrentNumber failed - returning 0 as default');
        return 0;
    }

    // Method to set current number for fallback
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
