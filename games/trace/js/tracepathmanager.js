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
        
        // NEW: Auto progression trigger points - first coordinate triggers jump to second coordinate
        this.autoProgressionTriggers = {
            0: [{ trigger: [96, 61], jumpTo: [100, 100] }],
            1: [{ trigger: [50, 30], jumpTo: [50, 0] }],
            2: [{ trigger: [27, 36], jumpTo: [0, 0] }],
            3: [{ trigger: [50, 101], jumpTo: [35, 100] }],
            4: [
                { trigger: [9, 116], jumpTo: [0, 80] },
                { trigger: [80, 80], jumpTo: [100, 80] },
                { trigger: [100, 80], jumpTo: [60, 140], sectionBreak: true }, // Section break for stroke 2
                { trigger: [60, 30], jumpTo: [60, 0] }
            ],
            5: [
                { trigger: [80, 200], jumpTo: [100, 200] },
                { trigger: [100, 200], jumpTo: [0, 200], sectionBreak: true }, // Section break for stroke 2
                { trigger: [0, 140], jumpTo: [0, 125] },
                { trigger: [15, 4], jumpTo: [0, 13] }
            ],
            6: [{ trigger: [25, 112], jumpTo: [0, 60] }],
            7: [
                { trigger: [80, 200], jumpTo: [100, 200] },
                { trigger: [50, 33], jumpTo: [40, 0] }
            ],
            8: [{ trigger: [70, 110], jumpTo: [95, 152.5] }],
            9: [
                { trigger: [95.9, 158], jumpTo: [100, 190] },
                { trigger: [82, 20], jumpTo: [80, 0] }
            ]
        };
        
        // NEW: Mandatory progression points for sharp corners
        this.mandatoryProgressions = {
            2: [
                { 
                    coordinate: [0, 0], 
                    forwardTo: [10, 0], 
                    backwardTo: [9, 12] 
                }
            ],
            3: [
                { 
                    coordinate: [35, 100], 
                    forwardTo: [40, 99.9], 
                    backwardTo: [40, 100.1] 
                }
            ],
            4: [
                { 
                    coordinate: [0, 80], 
                    forwardTo: [10, 80], 
                    backwardTo: [3, 92] 
                }
            ],
            7: [
                { 
                    coordinate: [100, 200], 
                    forwardTo: [95, 183], 
                    backwardTo: [90, 200] 
                }
            ],
            9: [
                { 
                    coordinate: [100, 190], 
                    forwardTo: [99, 182], 
                    backwardTo: [98.9, 182] 
                }
            ]
        };
        
        // Updated stroke end coordinates
        this.strokeEndCoordinates = {
            0: [[100, 100]],
            1: [[50, 0]],
            2: [[0, 0], [100, 0]],
            3: [[35, 100], [0, 10]],
            4: [[0, 80], [60, 140], [60, 0]], 
            5: [[0, 200], [0, 125], [0, 13]], 
            6: [[2, 77]],
            7: [[100, 200], [40, 0]],
            8: [[95, 152.5]],
            9: [[100, 190], [80, 0]]
        };
        
        // Updated stroke completion triggers
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
        
        this.frontMarkerCoordIndex = 0;
        this.frontMarkerProgress = 0;
        this.finalFrontMarkerCoordIndex = 0;
        this.finalFrontMarkerProgress = 0;
        
        this.currentStrokeCoords = this.renderer.getStrokeCoordinates(strokeIndex);
        
        if (!this.currentStrokeCoords || this.currentStrokeCoords.length === 0) {
            return false;
        }
        
        this.setupStrokeCompletion();
        this.removeSlider();
        this.removeFrontMarker();
        
        const startPoint = this.currentStrokeCoords[0];
        
        // Reset the trace line to the start of the new stroke
        this.renderer.updateTracingProgress(this.currentStroke, 0);
        
        this.createSlider(startPoint);
        
        return true;
    }

    setupStrokeCompletion() {
        let currentNumber = null;
        
        if (window.traceGame && typeof window.traceGame.getCurrentNumber === 'function') {
            currentNumber = window.traceGame.getCurrentNumber();
        }
        
        if (currentNumber !== null && this.strokeCompletionTriggers[currentNumber]) {
            const triggerCoords = this.strokeCompletionTriggers[currentNumber];
            if (triggerCoords && triggerCoords[this.currentStroke]) {
                const targetTrigger = triggerCoords[this.currentStroke];
                const triggerIndex = this.findCoordinateInPath(targetTrigger);
                
                if (triggerIndex !== -1) {
                    this.strokeCompletionCoordIndex = triggerIndex;
                    this.strokeCompletionCoord = this.currentStrokeCoords[triggerIndex];
                    return;
                }
            }
        }
        
        const totalCoords = this.currentStrokeCoords.length;
        this.strokeCompletionCoordIndex = Math.max(0, totalCoords - 3);
        this.strokeCompletionCoord = this.currentStrokeCoords[this.strokeCompletionCoordIndex];
    }

    findCoordinateInPath(targetCoord) {
        const tolerance = 10;
        let closestIndex = -1;
        let closestDistance = Infinity;
        
        for (let i = 0; i < this.currentStrokeCoords.length; i++) {
            const coord = this.currentStrokeCoords[i];
            const deltaX = Math.abs(coord.x - targetCoord[0]);
            const deltaY = Math.abs(coord.y - targetCoord[1]);
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance <= tolerance && distance < closestDistance) {
                closestDistance = distance;
                closestIndex = i;
            }
        }
        
        return closestIndex;
    }

    // NEW: Find coordinate index by original coordinate values (before scaling)
    findOriginalCoordinateIndex(targetCoord) {
        const currentNumber = this.getCurrentNumber();
        if (currentNumber === null) return -1;
        
        const numberConfig = CONFIG.STROKE_DEFINITIONS[currentNumber];
        if (!numberConfig || !numberConfig.strokes[this.currentStroke]) return -1;
        
        const originalCoords = numberConfig.strokes[this.currentStroke].coordinates;
        if (!originalCoords) return -1;
        
        const tolerance = 1.0; // Very tight tolerance for exact matches
        
        for (let i = 0; i < originalCoords.length; i++) {
            const coord = originalCoords[i];
            const deltaX = Math.abs(coord.x - targetCoord[0]);
            const deltaY = Math.abs(coord.y - targetCoord[1]);
            
            if (deltaX <= tolerance && deltaY <= tolerance) {
                return i;
            }
        }
        
        return -1;
    }

    // NEW: Check if current position triggers auto progression
    checkAutoProgression(coordIndex) {
        const currentNumber = this.getCurrentNumber();
        if (currentNumber === null) return null;
        
        const triggers = this.autoProgressionTriggers[currentNumber];
        if (!triggers) return null;
        
        // Get original coordinate for the current position
        const numberConfig = CONFIG.STROKE_DEFINITIONS[currentNumber];
        if (!numberConfig || !numberConfig.strokes[this.currentStroke]) return null;
        
        const originalCoords = numberConfig.strokes[this.currentStroke].coordinates;
        if (!originalCoords || coordIndex >= originalCoords.length) return null;
        
        const currentOriginalCoord = originalCoords[coordIndex];
        
        // Check if current coordinate exactly matches any trigger
        for (const trigger of triggers) {
            const deltaX = Math.abs(currentOriginalCoord.x - trigger.trigger[0]);
            const deltaY = Math.abs(currentOriginalCoord.y - trigger.trigger[1]);
            
            // Must be exact match - user has traced to this coordinate
            if (deltaX <= 1.0 && deltaY <= 1.0) {
                // Find the target coordinate index
                const targetIndex = this.findOriginalCoordinateIndex(trigger.jumpTo);
                if (targetIndex !== -1) {
                    return {
                        targetIndex: targetIndex,
                        sectionBreak: trigger.sectionBreak || false
                    };
                }
            }
        }
        
        return null;
    }

    // NEW: Check mandatory progression for sharp corners
    checkMandatoryProgression(coordIndex, isMovingForward) {
        const currentNumber = this.getCurrentNumber();
        if (currentNumber === null) return null;
        
        const progressions = this.mandatoryProgressions[currentNumber];
        if (!progressions) return null;
        
        // Get original coordinate for the current position
        const numberConfig = CONFIG.STROKE_DEFINITIONS[currentNumber];
        if (!numberConfig || !numberConfig.strokes[this.currentStroke]) return null;
        
        const originalCoords = numberConfig.strokes[this.currentStroke].coordinates;
        if (!originalCoords || coordIndex >= originalCoords.length) return null;
        
        const currentOriginalCoord = originalCoords[coordIndex];
        
        // Check if current coordinate matches any mandatory progression point
        for (const progression of progressions) {
            const deltaX = Math.abs(currentOriginalCoord.x - progression.coordinate[0]);
            const deltaY = Math.abs(currentOriginalCoord.y - progression.coordinate[1]);
            
            if (deltaX <= 1.0 && deltaY <= 1.0) {
                const targetCoord = isMovingForward ? progression.forwardTo : progression.backwardTo;
                const targetIndex = this.findOriginalCoordinateIndex(targetCoord);
                
                if (targetIndex !== -1) {
                    return targetIndex;
                }
            }
        }
        
        return null;
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
        animate.setAttribute('values', CONFIG.SLIDER_SIZE / 2 + ';' + (CONFIG.SLIDER_SIZE / 2 + 3) + ';' + CONFIG.SLIDER_SIZE / 2);
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
            
            if (this.slider) {
                this.slider.style.opacity = '0';
                const animate = this.slider.querySelector('animate');
                if (animate) animate.remove();
            }
            
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
        
        const lookAheadDistance = this.currentCoordinateIndex === 0 ? 5 : 3;
        const maxSearchIndex = Math.min(
            this.currentCoordinateIndex + lookAheadDistance, 
            this.currentStrokeCoords.length - 2
        );
        
        const minSearchIndex = Math.max(0, this.currentCoordinateIndex - 2);
        
        for (let i = minSearchIndex; i <= maxSearchIndex; i++) {
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
            
            const maxDistance = CONFIG.PATH_TOLERANCE || 60;
            
            if (distanceToSegment <= maxDistance && distanceToSegment < bestDistance) {
                bestDistance = distanceToSegment;
                bestCoordIndex = i;
                bestProgress = projectionProgress;
            }
        }
        
        if (bestDistance <= (CONFIG.PATH_TOLERANCE || 60)) {
            return {
                coordIndex: bestCoordIndex,
                progress: bestProgress,
                distance: bestDistance
            };
        }
        
        return null;
    }

    updateTracingProgress(position) {
        const coordIndex = position.coordIndex;
        const progress = position.progress;
        
        this.frontMarkerCoordIndex = coordIndex;
        this.frontMarkerProgress = progress;
        
        const currentCoord = this.currentStrokeCoords[coordIndex];
        const nextCoord = this.currentStrokeCoords[coordIndex + 1];
        
        const frontMarkerX = currentCoord.x + (nextCoord.x - currentCoord.x) * progress;
        const frontMarkerY = currentCoord.y + (nextCoord.y - currentCoord.y) * progress;
        
        this.updateFrontMarkerPosition({ x: frontMarkerX, y: frontMarkerY });
        
        // Check for stroke completion first
        if (this.hasReachedStrokeCompletionPoint(coordIndex, progress)) {
            this.autoCompleteCurrentStroke();
            return;
        }
        
        let newCoordinateIndex = this.currentCoordinateIndex;
        
        // Determine movement direction
        const isMovingForward = coordIndex > this.currentCoordinateIndex || 
                               (coordIndex === this.currentCoordinateIndex && progress >= 0.7);
        
        // Normal progression logic
        if (coordIndex > this.currentCoordinateIndex) {
            if (progress >= 0.5) {
                newCoordinateIndex = coordIndex;
            }
        } else if (coordIndex === this.currentCoordinateIndex) {
            if (progress >= 0.7) {
                newCoordinateIndex = Math.min(this.currentCoordinateIndex + 1, this.currentStrokeCoords.length - 1);
            }
        }
        
        newCoordinateIndex = Math.min(newCoordinateIndex, coordIndex);
        
        if (progress < 0.7 && coordIndex === newCoordinateIndex && coordIndex > 0) {
            newCoordinateIndex = Math.max(0, coordIndex - 1);
        }
        
        // Update coordinate index if changed
        if (newCoordinateIndex !== this.currentCoordinateIndex) {
            this.currentCoordinateIndex = newCoordinateIndex;
            this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
            
            // Check for auto progression triggers ONLY when we reach a new coordinate exactly
            const autoProgression = this.checkAutoProgression(this.currentCoordinateIndex);
            if (autoProgression) {
                console.log(`Auto progression triggered: jumping from coordinate ${this.currentCoordinateIndex} to index ${autoProgression.targetIndex}`);
                this.jumpToCoordinate(autoProgression.targetIndex, autoProgression.sectionBreak);
                return;
            }
            
            // Check for mandatory progression at sharp corners ONLY when we reach a new coordinate exactly
            const mandatoryTarget = this.checkMandatoryProgression(this.currentCoordinateIndex, isMovingForward);
            if (mandatoryTarget !== null) {
                console.log(`Mandatory progression triggered: jumping from coordinate ${this.currentCoordinateIndex} to index ${mandatoryTarget}`);
                this.jumpToCoordinate(mandatoryTarget, false);
                return;
            }
        }
    }

    // NEW: Jump to a specific coordinate index
    jumpToCoordinate(targetIndex, isSectionBreak = false) {
        if (targetIndex < 0 || targetIndex >= this.currentStrokeCoords.length) return;
        
        this.currentCoordinateIndex = targetIndex;
        this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
        
        // Update front marker position
        const targetCoord = this.currentStrokeCoords[targetIndex];
        if (targetCoord && this.frontMarker) {
            this.updateFrontMarkerPosition(targetCoord);
            this.frontMarkerCoordIndex = targetIndex;
            this.frontMarkerProgress = 0;
        }
        
        // Update slider position
        if (this.slider && targetCoord) {
            this.slider.setAttribute('cx', targetCoord.x);
            this.slider.setAttribute('cy', targetCoord.y);
        }
        
        // If this is a section break, handle stroke completion
        if (isSectionBreak) {
            setTimeout(() => {
                this.completeCurrentStroke();
            }, 300);
        }
    }

    hasReachedStrokeCompletionPoint(coordIndex, progress) {
        return coordIndex >= this.strokeCompletionCoordIndex && 
               (coordIndex > this.strokeCompletionCoordIndex || progress >= 0.5);
    }

    autoCompleteCurrentStroke() {
        this.currentCoordinateIndex = this.currentStrokeCoords.length - 1;
        this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
        
        const finalCoord = this.currentStrokeCoords[this.currentStrokeCoords.length - 1];
        if (finalCoord && this.frontMarker) {
            this.updateFrontMarkerPosition(finalCoord);
        }
        
        this.finalFrontMarkerCoordIndex = this.currentStrokeCoords.length - 1;
        this.finalFrontMarkerProgress = 1.0;
        
        setTimeout(() => {
            this.completeCurrentStroke();
        }, 200);
    }

    completeCurrentStroke() {
        this.isTracing = false;
        this.isDragging = false;
        
        if (this.slider) {
            this.slider.style.opacity = '0';
        }
        this.removeFrontMarker();
        
        this.renderer.completeStroke(this.currentStroke);
        
        const totalStrokes = this.renderer.getStrokeCount();
        
        if (this.currentStroke + 1 < totalStrokes) {
            setTimeout(() => {
                this.startNewStroke(this.currentStroke + 1);
            }, 300);
        } else {
            setTimeout(() => {
                this.removeSlider();
            }, 300);
            
            this.renderer.completeNumber();
        }
    }

    getCurrentNumber() {
        if (window.traceGame && typeof window.traceGame.getCurrentNumber === 'function') {
            return window.traceGame.getCurrentNumber();
        }
        return null;
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

    // Force move to next stroke position
    moveToNextStroke() {
        const totalStrokes = this.renderer.getStrokeCount();
        if (this.currentStroke + 1 < totalStrokes) {
            this.startNewStroke(this.currentStroke + 1);
        }
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
    }

    getCurrentProgress() {
        if (this.currentStrokeCoords.length === 0) return 0;
        return this.currentCoordinateIndex / (this.currentStrokeCoords.length - 1);
    }

    isCurrentlyTracing() {
        return this.isTracing;
    }
}
