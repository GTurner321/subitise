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
        
        // End coordinates for each stroke of each number (scaled to 0-100, 0-200 coordinate system)
        // For multi-stroke numbers, intermediate strokes end at the START of the next stroke
        this.strokeEndCoordinates = {
            0: [[100, 100]], // Single stroke - ends at start
            1: [[50, 0]], // Single stroke - ends at top
            2: [[0, 0], [100, 0]], // Two conceptual parts but single stroke - ends at top right
            3: [[35, 100], [0, 10]], // Two conceptual parts but single stroke - ends at top left
            4: [[0, 80], [60, 40], [100, 80]], // Three strokes: L-shape ends at (0,80), horizontal ends at start of vertical (60,40), vertical ends at (100,80)
            5: [[0, 200], [0, 125], [100, 200]], // Three strokes: top line ends at (0,200), vertical ends at start of curve (0,125), curve ends at (100,200)
            6: [[2, 77]], // Single stroke - ends near left middle
            7: [[100, 200], [40, 0]], // Two conceptual parts but single stroke - ends at bottom left
            8: [[95, 152.5]], // Single stroke - ends near right middle
            9: [[100, 190], [80, 0]] // Two conceptual parts but single stroke - ends at bottom
        };
        
        // Trigger points for stroke completion (when these coordinates are reached, complete the stroke)
        this.strokeCompletionTriggers = {
            0: [[99, 80]], // Near the end of the oval
            1: [[50, 20]], // Near the top
            2: [[36, 48], [80, 0]], // Near the diagonal turn, then at the end
            3: [[70, 107], [4, 8]], // Near the middle bump, then at the end
            4: [[18, 152], [80, 80], [60, 30]], // End of L-shape, end of horizontal, end of vertical
            5: [[80, 200], [0, 150], [2, 11]], // End of top line, partway down vertical, end of curve
            6: [[6, 88]], // Near the end of the 6
            7: [[80, 200], [50, 33]], // End of top line, partway down diagonal
            8: [[94, 142.5]], // Near the end of the 8
            9: [[98.9, 182], [83, 30]] // Near the circle end, end of tail
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
        const currentNumber = this.getCurrentNumber();
        const totalStrokes = this.renderer.getStrokeCount();
        
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
        
        this.currentStrokeCoords = this.renderer.getStrokeCoordinates(strokeIndex);
        
        if (!this.currentStrokeCoords?.length) {
            console.error(`❌ No coordinates found for stroke ${strokeIndex} of number ${currentNumber}`);
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
            endCoords: this.strokeEndCoordinates[currentNumber]?.[this.currentStroke]
        });
        
        // Set completion near end of stroke as fallback
        const totalCoords = this.currentStrokeCoords.length;
        this.strokeCompletionCoordIndex = Math.max(0, totalCoords - 5); // Earlier detection
        this.strokeCompletionCoord = this.currentStrokeCoords[this.strokeCompletionCoordIndex];
    }

    findCoordinateInPath(targetCoord) {
        const tolerance = 20; // Increased tolerance
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
        console.log('Slider created and added to SVG');
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
        console.log('handleStart called', event.type);
        event.preventDefault();
        
        const point = this.getEventPoint(event);
        console.log('Event point:', point);
        
        if (!point || !this.isPointNearSlider(point)) {
            console.log('Point not near slider or point is null');
            return;
        }
        
        console.log('Starting drag/trace');
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
        
        const lookAhead = this.currentCoordinateIndex === 0 ? 8 : 5; // Increased look ahead
        const maxIndex = Math.min(this.currentCoordinateIndex + lookAhead, this.currentStrokeCoords.length - 2);
        const minIndex = Math.max(0, this.currentCoordinateIndex - 3); // Increased look back
        
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
        
        // PRIORITY: Check for trigger completion FIRST
        if (this.checkForTriggerAtCurrentCoord(coordIndex)) {
            console.log(`🎯 TRIGGER DETECTED at coordIndex=${coordIndex}! Calling autoCompleteCurrentStroke()`);
            this.autoCompleteCurrentStroke();
            return;
        }
        
        // Update coordinate index based on progress
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
        
        // Final safety check: if we're at the very end with high progress, force completion
        if (coordIndex === this.currentStrokeCoords.length - 1 && progress >= 0.95) {
            console.log(`🔚 FORCING COMPLETION (final coord) - coordIndex=${coordIndex}, progress=${progress.toFixed(2)}`);
            this.autoCompleteCurrentStroke();
            return;
        }
    }

    checkForTriggerAtCurrentCoord(coordIndex) {
        const currentNumber = this.getCurrentNumber();
        const triggerCoords = this.strokeCompletionTriggers[currentNumber]?.[this.currentStroke];
        
        const currentCoord = this.currentStrokeCoords[coordIndex];
        if (!currentCoord) return false;
        
        // Check if we've reached the specific trigger point
        if (triggerCoords) {
            // Scale the trigger coordinates the same way the stroke coordinates are scaled
            const scaleX = CONFIG.NUMBER_RECT_WIDTH / 100;
            const scaleY = CONFIG.NUMBER_RECT_HEIGHT / 200;
            const offsetX = CONFIG.NUMBER_CENTER_X - CONFIG.NUMBER_RECT_WIDTH / 2;
            const offsetY = CONFIG.NUMBER_CENTER_Y - CONFIG.NUMBER_RECT_HEIGHT / 2;
            
            const scaledTriggerX = offsetX + (triggerCoords[0] * scaleX);
            const scaledTriggerY = offsetY + ((200 - triggerCoords[1]) * scaleY);
            
            // INCREASED tolerance for better trigger detection
            const tolerance = 30; // Increased from 15 to 30
            const xMatch = Math.abs(currentCoord.x - scaledTriggerX) <= tolerance;
            const yMatch = Math.abs(currentCoord.y - scaledTriggerY) <= tolerance;
            
            if (xMatch && yMatch) {
                console.log(`✅ TRIGGER REACHED for number ${currentNumber}, stroke ${this.currentStroke}: (${currentCoord.x.toFixed(1)}, ${currentCoord.y.toFixed(1)}) matches trigger (${scaledTriggerX.toFixed(1)}, ${scaledTriggerY.toFixed(1)})`);
                return true;
            }
            
            // DEBUG: Log when we're close but not quite there
            const distance = Math.sqrt(Math.pow(currentCoord.x - scaledTriggerX, 2) + Math.pow(currentCoord.y - scaledTriggerY, 2));
            if (distance <= tolerance * 1.5 && coordIndex % 5 === 0) { // Log every 5th coordinate when close
                console.log(`🔍 CLOSE TO TRIGGER for number ${currentNumber}, stroke ${this.currentStroke}: distance=${distance.toFixed(1)}, tolerance=${tolerance}`);
                console.log(`   Current: (${currentCoord.x.toFixed(1)}, ${currentCoord.y.toFixed(1)}) Target: (${scaledTriggerX.toFixed(1)}, ${scaledTriggerY.toFixed(1)})`);
            }
        }
        
        // Also check if we've reached the final coordinate in the stroke path (fallback)
        const isLastCoord = coordIndex === this.currentStrokeCoords.length - 1;
        if (isLastCoord) {
            console.log(`✅ FINAL COORDINATE reached for number ${currentNumber}, stroke ${this.currentStroke}: (${currentCoord.x.toFixed(1)}, ${currentCoord.y.toFixed(1)})`);
            return true;
        }
        
        return false;
    }

    autoCompleteCurrentStroke() {
        // First complete the current stroke path
        this.currentCoordinateIndex = this.currentStrokeCoords.length - 1;
        this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
        
        const currentNumber = this.getCurrentNumber();
        const totalStrokes = this.renderer.getStrokeCount();
        const isLastStroke = (this.currentStroke + 1) >= totalStrokes;
        
        console.log(`autoCompleteCurrentStroke: number=${currentNumber}, stroke=${this.currentStroke}/${totalStrokes-1}, isLastStroke=${isLastStroke}`);
        
        // Move to the appropriate end position based on strokeEndCoordinates
        const endCoords = this.strokeEndCoordinates[currentNumber]?.[this.currentStroke];
        
        if (endCoords) {
            // Scale the end coordinates to match the display coordinate system
            const scaleX = CONFIG.NUMBER_RECT_WIDTH / 100;
            const scaleY = CONFIG.NUMBER_RECT_HEIGHT / 200;
            const offsetX = CONFIG.NUMBER_CENTER_X - CONFIG.NUMBER_RECT_WIDTH / 2;
            const offsetY = CONFIG.NUMBER_CENTER_Y - CONFIG.NUMBER_RECT_HEIGHT / 2;
            
            const targetX = offsetX + (endCoords[0] * scaleX);
            const targetY = offsetY + ((200 - endCoords[1]) * scaleY);
            
            console.log(`Moving to end coords for number ${currentNumber}, stroke ${this.currentStroke}:`);
            console.log(`Raw end coords: (${endCoords[0]}, ${endCoords[1]}) → Scaled: (${targetX.toFixed(1)}, ${targetY.toFixed(1)})`);
            
            // Update front marker to the end position
            if (this.frontMarker) {
                this.updateFrontMarkerPosition({ x: targetX, y: targetY });
            }
            
            // Update slider position to end coordinates
            if (this.slider) {
                this.slider.setAttribute('cx', targetX);
                this.slider.setAttribute('cy', targetY);
            }
        } else {
            // Fallback to final coordinate if no end point defined
            const finalCoord = this.currentStrokeCoords[this.currentStrokeCoords.length - 1];
            if (finalCoord) {
                console.log(`No end coords defined, using final stroke coord: (${finalCoord.x.toFixed(1)}, ${finalCoord.y.toFixed(1)})`);
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
        
        const totalStrokes = this.renderer.getStrokeCount();
        console.log(`Total strokes for number ${currentNumber}: ${totalStrokes}, completed stroke: ${this.currentStroke}`);
        
        // Check if this was the final stroke
        const isLastStroke = (this.currentStroke + 1) >= totalStrokes;
        
        if (!isLastStroke) {
            // More strokes to go - start next stroke
            const nextStroke = this.currentStroke + 1;
            console.log(`Moving to next stroke: ${nextStroke} (${nextStroke + 1}/${totalStrokes})`);
            this.endCurrentStroke(() => {
                // ENSURE the next stroke coordinates are available before starting
                if (this.startNewStroke(nextStroke)) {
                    console.log(`✅ Successfully started stroke ${nextStroke}`);
                } else {
                    console.error(`❌ Failed to start stroke ${nextStroke}, attempting recovery`);
                    // Force re-render to ensure all stroke coordinates are available
                    this.renderer.renderNumber(currentNumber);
                    setTimeout(() => this.startNewStroke(nextStroke), 100);
                }
            });
        } else {
            // This was the final stroke - complete the number
            console.log(`✅ ALL STROKES COMPLETED for number ${currentNumber} - calling renderer.completeNumber()`);
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

    // Enhanced getCurrentNumber method with multiple fallbacks
    getCurrentNumber() {
        // Check if window.traceGame exists and has getCurrentNumber method
        if (window.traceGame && typeof window.traceGame.getCurrentNumber === 'function') {
            const num = window.traceGame.getCurrentNumber();
            return num;
        }
        
        // Fallback - try direct property access
        if (window.traceGame && window.traceGame.currentNumber !== undefined) {
            const num = window.traceGame.currentNumber;
            return num;
        }
        
        // Additional fallback - check renderer's currentNumber
        if (this.renderer && this.renderer.currentNumber !== undefined && this.renderer.currentNumber !== null) {
            const num = this.renderer.currentNumber;
            return num;
        }
        
        // Final fallback - use stored number
        if (this.currentNumberForFallback !== undefined) {
            const num = this.currentNumberForFallback;
            return num;
        }
        
        console.warn('getCurrentNumber failed - returning 0 as default');
        return 0; // Return 0 as a safe default
    }

    // Method to set current number for fallback
    setCurrentNumber(number) {
        this.currentNumberForFallback = number;
        console.log(`PathManager: setCurrentNumber called with ${number}`);
    }

    // Method to move to next stroke
    moveToNextStroke() {
        const totalStrokes = this.renderer.getStrokeCount();
        const nextStroke = this.currentStroke + 1;
        
        console.log(`moveToNextStroke called: current=${this.currentStroke}, next=${nextStroke}, total=${totalStrokes}`);
        
        if (nextStroke < totalStrokes) {
            return this.startNewStroke(nextStroke);
        } else {
            console.log('No more strokes to move to');
            return false;
        }
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
