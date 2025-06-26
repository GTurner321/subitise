class TracePathManager {
    constructor(svg, renderer) {
        this.svg = svg;
        this.renderer = renderer;
        
        // Slider elements - dual system
        this.slider = null;              // Real interactive slider
        this.frontMarker = null;         // Front marker during drag
        
        // Tracking state
        this.isTracing = false;
        this.currentStroke = 0;
        this.currentCoordinateIndex = 0;
        this.isDragging = false;
        
        // Front marker tracking
        this.frontMarkerCoordIndex = 0;
        this.frontMarkerProgress = 0;
        this.finalFrontMarkerCoordIndex = 0;
        this.finalFrontMarkerProgress = 0;
        
        // Stroke data
        this.currentStrokeCoords = [];
        this.strokeCompletionCoordIndex = 0;
        this.strokeCompletionCoord = null;
        
        // Movement tracking
        this.lastMovementTime = Date.now();
        
        // Stroke end coordinates - exact end points per stroke per number
        this.strokeEndCoordinates = {
            0: [[100, 100]], // Single stroke
            1: [[50, 0]], // Single stroke
            2: [[0, 0], [100, 0]], // Two strokes
            3: [[35, 100], [0, 10]], // Two strokes
            4: [[0, 80], [100, 80], [60, 0]], // Three strokes
            5: [[100, 200], [0, 125], [0, 13]], // Three strokes
            6: [[0, 60]], // Single stroke
            7: [[100, 200], [40, 0]], // Two strokes
            8: [[95, 152.5]], // Single stroke
            9: [[100, 190], [80, 0]] // Two strokes
        };
        
        // Trigger points - when to auto-complete strokes
        this.strokeCompletionTriggers = {
            0: [[99, 80]], // 2 before {x: 100, y: 100}
            1: [[50, 20]], // 2 before {x: 50, y: 0}
            2: [[36, 48], [80, 0]], // 2 before each end point
            3: [[70, 107], [2, 9]], // 2 before each end point
            4: [[18, 152], [80, 80], [60, 30]], // 2 before each end point
            5: [[80, 200], [0, 150], [2, 11]], // 2 before each end point
            6: [[2, 77]], // 2 before {x: 0, y: 60}
            7: [[80, 200], [50, 33]], // 2 before each end point
            8: [[94, 142.5]], // 2 before {x: 95, y: 152.5}
            9: [[98.9, 182], [83, 30]] // 2 before each end point
        };
        
        // Section breaks - when these strokes end, jump to start of next stroke
        this.sectionBreaks = {
            4: [1], // After stroke 1 (second stroke), jump to start of stroke 2
            5: [1]  // After stroke 1 (second stroke), jump to start of stroke 2
        };
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        if (!this.svg) return;
        
        // Mouse and touch events
        this.svg.addEventListener('mousedown', (e) => this.handleStart(e));
        this.svg.addEventListener('mousemove', (e) => this.handleMove(e));
        this.svg.addEventListener('mouseup', (e) => this.handleEnd(e));
        this.svg.addEventListener('mouseleave', (e) => this.handleEnd(e));
        
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
        
        console.log(`Starting stroke ${strokeIndex} with ${this.currentStrokeCoords.length} coordinates`);
        console.log(`First coordinate: [${this.currentStrokeCoords[0].x}, ${this.currentStrokeCoords[0].y}]`);
        
        // Set up stroke completion point
        this.setupStrokeCompletion();
        
        // Remove existing elements
        this.removeSlider();
        this.removeFrontMarker();
        
        // Create slider at start of THIS stroke (important for multi-section numbers)
        const startPoint = this.currentStrokeCoords[0];
        this.createSlider(startPoint);
        
        return true;
    }

    setupStrokeCompletion() {
        // Get current number from game controller
        let currentNumber = null;
        
        if (window.traceGame && typeof window.traceGame.getCurrentNumber === 'function') {
            currentNumber = window.traceGame.getCurrentNumber();
        }
        
        console.log(`Setting up completion for number ${currentNumber}, stroke ${this.currentStroke}`);
        
        if (currentNumber !== null && this.strokeCompletionTriggers[currentNumber]) {
            // Use predefined trigger coordinates
            const triggerCoords = this.strokeCompletionTriggers[currentNumber];
            if (triggerCoords && triggerCoords[this.currentStroke]) {
                const targetTrigger = triggerCoords[this.currentStroke];
                console.log(`Looking for trigger coordinate:`, targetTrigger);
                
                // Find trigger coordinate in path
                const triggerIndex = this.findCoordinateInPath(targetTrigger);
                console.log(`Trigger coordinate found at index:`, triggerIndex);
                
                if (triggerIndex !== -1) {
                    this.strokeCompletionCoordIndex = triggerIndex;
                    this.strokeCompletionCoord = this.currentStrokeCoords[triggerIndex];
                    console.log(`Using trigger at coordinate index ${triggerIndex}:`, this.strokeCompletionCoord);
                    return;
                }
            }
        }
        
        // Fallback: use "2 before end" method
        const totalCoords = this.currentStrokeCoords.length;
        this.strokeCompletionCoordIndex = Math.max(0, totalCoords - 3);
        this.strokeCompletionCoord = this.currentStrokeCoords[this.strokeCompletionCoordIndex];
        console.log(`Using fallback completion at index ${this.strokeCompletionCoordIndex} of ${totalCoords} total coordinates`);
    }

    findCoordinateInPath(targetCoord) {
        const tolerance = 10; // Increased tolerance from 5 to 10
        let closestIndex = -1;
        let closestDistance = Infinity;
        
        console.log(`Searching for coordinate [${targetCoord[0]}, ${targetCoord[1]}] in ${this.currentStrokeCoords.length} coordinates`);
        
        for (let i = 0; i < this.currentStrokeCoords.length; i++) {
            const coord = this.currentStrokeCoords[i];
            const deltaX = Math.abs(coord.x - targetCoord[0]);
            const deltaY = Math.abs(coord.y - targetCoord[1]);
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Log coordinates near the target for debugging
            if (distance < 20) {
                console.log(`Coordinate ${i}: [${coord.x}, ${coord.y}], distance: ${distance.toFixed(2)}`);
            }
            
            if (distance <= tolerance) {
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = i;
                }
            }
        }
        
        if (closestIndex !== -1) {
            console.log(`Found closest match at index ${closestIndex}, distance: ${closestDistance.toFixed(2)}`);
        } else {
            console.log(`No coordinate found within tolerance ${tolerance}`);
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
        if (this.slider) {
            this.slider.remove();
            this.slider = null;
        }
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

    addSliderPulseAnimation() {
        if (!this.slider) return;
        
        const existingAnimate = this.slider.querySelector('animate');
        if (existingAnimate) {
            existingAnimate.remove();
        }
        
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'r');
        animate.setAttribute('values', `${CONFIG.SLIDER_SIZE / 2};${CONFIG.SLIDER_SIZE / 2 + 3};${CONFIG.SLIDER_SIZE / 2}`);
        animate.setAttribute('dur', '2s');
        animate.setAttribute('repeatCount', 'indefinite');
        
        this.slider.appendChild(animate);
    }

    handleStart(event) {
        event.preventDefault();
        
        const point = this.getEventPoint(event);
        if (!point) return;
        
        if (this.isPointNearSlider(point)) {
            this.isDragging = true;
            this.isTracing = true;
            
            // Hide real slider
            if (this.slider) {
                this.slider.style.opacity = '0';
                const animate = this.slider.querySelector('animate');
                if (animate) animate.remove();
            }
            
            // Create front marker
            const currentCoord = this.currentStrokeCoords[this.currentCoordinateIndex];
            if (currentCoord) {
                this.createFrontMarker(currentCoord);
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
        
        this.lastMovementTime = Date.now();
        
        const bestPosition = this.findBestSliderPosition(point);
        if (bestPosition !== null) {
            this.updateTracingProgress(bestPosition);
        }
    }

    handleEnd(event) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        // Store final front marker position
        this.finalFrontMarkerCoordIndex = this.frontMarkerCoordIndex;
        this.finalFrontMarkerProgress = this.frontMarkerProgress;
        
        // Delay showing real slider
        setTimeout(() => {
            if (!this.isDragging && this.slider) {
                const finalPosition = this.getInterpolatedPosition(
                    this.finalFrontMarkerCoordIndex, 
                    this.finalFrontMarkerProgress
                );
                
                if (finalPosition) {
                    this.slider.setAttribute('cx', finalPosition.x);
                    this.slider.setAttribute('cy', finalPosition.y);
                    
                    // Update coordinate index to match front marker
                    this.currentCoordinateIndex = this.finalFrontMarkerCoordIndex;
                    if (this.finalFrontMarkerProgress >= 0.95) {
                        this.currentCoordinateIndex = Math.min(
                            this.currentCoordinateIndex + 1, 
                            this.currentStrokeCoords.length - 1
                        );
                    }
                    
                    this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
                }
                
                // Fade in slider
                this.slider.style.transition = 'opacity 0.25s ease-in';
                this.slider.style.opacity = '1';
                
                setTimeout(() => {
                    if (!this.isDragging) {
                        this.addSliderPulseAnimation();
                    }
                }, 250);
                
                setTimeout(() => {
                    if (this.slider) {
                        this.slider.style.transition = '';
                    }
                }, 300);
            }
        }, 500);
        
        // Remove front marker
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
        
        const scaleX = CONFIG.SVG_WIDTH / rect.width;
        const scaleY = CONFIG.SVG_HEIGHT / rect.height;
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    isPointNearSlider(point) {
        if (!this.slider) return false;
        
        const sliderX = parseFloat(this.slider.getAttribute('cx'));
        const sliderY = parseFloat(this.slider.getAttribute('cy'));
        
        const distance = Math.sqrt(
            Math.pow(point.x - sliderX, 2) +
            Math.pow(point.y - sliderY, 2)
        );
        
        const sliderRadius = CONFIG.SLIDER_SIZE / 2;
        return distance <= sliderRadius + 5;
    }

    findBestSliderPosition(dragPoint) {
        let bestCoordIndex = this.currentCoordinateIndex;
        let bestProgress = 0;
        let bestDistance = Infinity;
        
        const lookAheadDistance = this.currentCoordinateIndex === 0 ? 3 : 2;
        const maxSearchIndex = Math.min(
            this.currentCoordinateIndex + lookAheadDistance, 
            this.currentStrokeCoords.length - 2
        );
        
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
        
        // Calculate front marker position
        const frontMarkerX = currentCoord.x + (nextCoord.x - currentCoord.x) * progress;
        const frontMarkerY = currentCoord.y + (nextCoord.y - currentCoord.y) * progress;
        
        // Update front marker position
        this.updateFrontMarkerPosition({ x: frontMarkerX, y: frontMarkerY });
        
        // Check for stroke completion
        if (this.hasReachedStrokeCompletionPoint(coordIndex, progress)) {
            this.autoCompleteCurrentStroke();
            return;
        }
        
        // Update green trace (conservative)
        let newCoordinateIndex = this.currentCoordinateIndex;
        
        if (coordIndex > this.currentCoordinateIndex) {
            if (progress >= 0.5) {
                newCoordinateIndex = coordIndex;
            }
        } else if (coordIndex === this.currentCoordinateIndex) {
            if (progress >= 0.7) {
                newCoordinateIndex = Math.min(this.currentCoordinateIndex + 1, this.currentStrokeCoords.length - 1);
            }
        }
        
        // Safety check
        newCoordinateIndex = Math.min(newCoordinateIndex, coordIndex);
        
        if (progress < 0.7 && coordIndex === newCoordinateIndex && coordIndex > 0) {
            newCoordinateIndex = Math.max(0, coordIndex - 1);
        }
        
        // Update green trace
        if (newCoordinateIndex !== this.currentCoordinateIndex) {
            this.currentCoordinateIndex = newCoordinateIndex;
            this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
        }
    }

    hasReachedStrokeCompletionPoint(coordIndex, progress) {
        const reached = coordIndex >= this.strokeCompletionCoordIndex && 
                       (coordIndex > this.strokeCompletionCoordIndex || progress >= 0.5);
        
        if (reached) {
            console.log(`Stroke completion triggered! At coordinate ${coordIndex} (target: ${this.strokeCompletionCoordIndex}), progress: ${progress}`);
        }
        
        return reached;
    }

    autoCompleteCurrentStroke() {
        // Complete stroke immediately
        this.currentCoordinateIndex = this.currentStrokeCoords.length - 1;
        
        // Update green trace to show full completion
        this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
        
        // Update front marker to final position
        const finalCoord = this.currentStrokeCoords[this.currentStrokeCoords.length - 1];
        if (finalCoord && this.frontMarker) {
            this.updateFrontMarkerPosition(finalCoord);
        }
        
        // Store final position
        this.finalFrontMarkerCoordIndex = this.currentStrokeCoords.length - 1;
        this.finalFrontMarkerProgress = 1.0;
        
        // Brief pause then complete
        setTimeout(() => {
            this.completeCurrentStroke();
        }, 200);
    }

    completeCurrentStroke() {
        this.isTracing = false;
        this.isDragging = false;
        
        // Hide elements
        if (this.slider) {
            this.slider.style.opacity = '0';
        }
        this.removeFrontMarker();
        
        // Notify renderer
        this.renderer.completeStroke(this.currentStroke);
        
        // Check for more strokes
        const totalStrokes = this.renderer.getStrokeCount();
        
        if (this.currentStroke + 1 < totalStrokes) {
            // Check if this stroke ending requires a section break jump
            const currentNumber = this.getCurrentNumber();
            const needsSectionBreak = this.needsSectionBreakAfterStroke(currentNumber, this.currentStroke);
            
            if (needsSectionBreak) {
                console.log(`Section break after stroke ${this.currentStroke} for number ${currentNumber} - jumping to start of next stroke`);
            }
            
            // Start next stroke (slider will position at start of new stroke automatically)
            setTimeout(() => {
                this.startNewStroke(this.currentStroke + 1);
            }, 300);
        } else {
            // All strokes complete
            setTimeout(() => {
                this.removeSlider();
            }, 300);
            
            this.renderer.completeNumber();
        }
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

    getCurrentNumber() {
        if (window.traceGame && typeof window.traceGame.getCurrentNumber === 'function') {
            return window.traceGame.getCurrentNumber();
        }
        return null;
    }

    needsSectionBreakAfterStroke(currentNumber, strokeIndex) {
        if (!this.sectionBreaks[currentNumber]) {
            return false;
        }
        
        return this.sectionBreaks[currentNumber].includes(strokeIndex);
    }
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
    }

    getCurrentProgress() {
        if (this.currentStrokeCoords.length === 0) return 0;
        return this.currentCoordinateIndex / (this.currentStrokeCoords.length - 1);
    }

    isCurrentlyTracing() {
        return this.isTracing;
    }

    // Debug method
    showCoordinatePoints() {
        if (!CONFIG.DEBUG_MODE || !this.currentStrokeCoords) return;
        
        const existingPoints = this.svg.querySelectorAll('.debug-coord-point');
        existingPoints.forEach(point => point.remove());
        
        this.currentStrokeCoords.forEach((coord, index) => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', coord.x);
            circle.setAttribute('cy', coord.y);
            circle.setAttribute('r', 3);
            circle.setAttribute('fill', index === this.currentCoordinateIndex ? 'red' : 'blue');
            circle.setAttribute('class', 'debug-coord-point');
            
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
