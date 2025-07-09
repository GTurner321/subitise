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
        this.lastMovementTime = Date.now();
        
        // Jump definitions: trigger coordinate -> target coordinate
        this.jumpDefinitions = {
            0: [
                { trigger: [96, 61], jumpTo: [100, 100], isNewSection: false }
            ],
            1: [
                { trigger: [50, 30], jumpTo: [50, 0], isNewSection: false }
            ],
            2: [
                { trigger: [27, 36], jumpTo: [0, 0], isNewSection: false }
            ],
            3: [
                { trigger: [50, 101], jumpTo: [35, 100], isNewSection: false }
            ],
            4: [
                { trigger: [9, 116], jumpTo: [0, 80], isNewSection: false }, // Additional jump condition
                { trigger: [80, 80], jumpTo: [100, 80], isNewSection: false },
                { trigger: [100, 80], jumpTo: [60, 140], isNewSection: true }, // Start of new section
                { trigger: [60, 30], jumpTo: [60, 0], isNewSection: false }
            ],
            5: [
                { trigger: [80, 200], jumpTo: [100, 200], isNewSection: false },
                { trigger: [100, 200], jumpTo: [0, 200], isNewSection: true }, // Start of new section
                { trigger: [0, 140], jumpTo: [0, 125], isNewSection: false },
                { trigger: [15, 4], jumpTo: [0, 13], isNewSection: false }
            ],
            6: [
                { trigger: [25, 112], jumpTo: [0, 60], isNewSection: false }
            ],
            7: [
                { trigger: [80, 200], jumpTo: [100, 200], isNewSection: false },
                { trigger: [50, 33], jumpTo: [40, 0], isNewSection: false }
            ],
            8: [
                { trigger: [70, 110], jumpTo: [95, 152.5], isNewSection: false }
            ],
            9: [
                { trigger: [95.9, 158], jumpTo: [100, 190], isNewSection: false },
                { trigger: [82, 20], jumpTo: [80, 0], isNewSection: false }
            ]
        };
        
        // Mandatory progressions for sharp angle turns
        // These ensure smooth progression at corner points to prevent getting stuck
        this.mandatoryProgressions = {
            2: [
                { 
                    cornerPoint: [0, 0], 
                    forwardTo: [10, 0], 
                    backwardTo: [9, 12] 
                }
            ],
            3: [
                { 
                    cornerPoint: [35, 100], 
                    forwardTo: [40, 99.9], 
                    backwardTo: [40, 100.1] 
                }
            ],
            4: [
                { 
                    cornerPoint: [0, 80], 
                    forwardTo: [10, 80], 
                    backwardTo: [3, 92] 
                }
            ],
            7: [
                { 
                    cornerPoint: [100, 200], 
                    forwardTo: [95, 183], 
                    backwardTo: [90, 200] 
                }
            ],
            9: [
                { 
                    cornerPoint: [100, 190], 
                    forwardTo: [99, 182], 
                    backwardTo: [98.9, 182] 
                }
            ]
        };
        
        // Track which jumps have been triggered to avoid repeating them
        this.triggeredJumps = new Set();
        
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
        
        // Reset triggered jumps for new stroke
        this.triggeredJumps.clear();
        
        this.currentStrokeCoords = this.renderer.getStrokeCoordinates(strokeIndex);
        
        if (!this.currentStrokeCoords || this.currentStrokeCoords.length === 0) {
            console.error(`No coordinates found for stroke ${strokeIndex}`);
            return false;
        }
        
        console.log(`Starting stroke ${strokeIndex} with ${this.currentStrokeCoords.length} coordinates`);
        
        this.removeSlider();
        this.removeFrontMarker();
        
        const startPoint = this.currentStrokeCoords[0];
        
        // Reset the trace line to the start of the new stroke
        this.renderer.updateTracingProgress(this.currentStroke, 0);
        
        this.createSlider(startPoint);
        
        return true;
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
        
        const lookAheadDistance = this.currentCoordinateIndex === 0 ? 8 : 5;
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
        
        // Apply mandatory progression rules for sharp corners
        const mandatoryResult = this.checkMandatoryProgression(bestCoordIndex, bestProgress, dragPoint);
        if (mandatoryResult) {
            return mandatoryResult;
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

    checkMandatoryProgression(coordIndex, progress, dragPoint) {
        const currentNumber = this.getCurrentNumber();
        if (!this.mandatoryProgressions[currentNumber]) return null;
        
        const currentPosition = this.getInterpolatedPosition(coordIndex, progress);
        if (!currentPosition) return null;
        
        // Check each mandatory progression for this number
        for (const progression of this.mandatoryProgressions[currentNumber]) {
            const scaledCorner = this.scaleTargetCoordinate(progression.cornerPoint);
            
            // Check if we're near the corner point
            const distanceToCorner = Math.sqrt(
                Math.pow(currentPosition.x - scaledCorner.x, 2) + 
                Math.pow(currentPosition.y - scaledCorner.y, 2)
            );
            
            const cornerTolerance = 15;
            
            if (distanceToCorner <= cornerTolerance) {
                // Determine if user is trying to go forward or backward
                const cornerIndex = this.findClosestCoordinateIndex(scaledCorner);
                
                if (cornerIndex !== -1) {
                    // Check drag direction relative to the path
                    const isMovingForward = this.isDragDirectionForward(dragPoint, cornerIndex);
                    
                    if (isMovingForward) {
                        // Force progression to forward coordinate
                        const scaledForward = this.scaleTargetCoordinate(progression.forwardTo);
                        const forwardIndex = this.findClosestCoordinateIndex(scaledForward);
                        
                        if (forwardIndex !== -1) {
                            console.log(`Mandatory forward progression from ${progression.cornerPoint} to ${progression.forwardTo}`);
                            return {
                                coordIndex: forwardIndex,
                                progress: 0,
                                distance: 0,
                                mandatory: true
                            };
                        }
                    } else {
                        // Force progression to backward coordinate
                        const scaledBackward = this.scaleTargetCoordinate(progression.backwardTo);
                        const backwardIndex = this.findClosestCoordinateIndex(scaledBackward);
                        
                        if (backwardIndex !== -1) {
                            console.log(`Mandatory backward progression from ${progression.cornerPoint} to ${progression.backwardTo}`);
                            return {
                                coordIndex: backwardIndex,
                                progress: 0,
                                distance: 0,
                                mandatory: true
                            };
                        }
                    }
                }
            }
        }
        
        return null;
    }

    isDragDirectionForward(dragPoint, cornerIndex) {
        // Determine if the drag direction is forward or backward along the path
        if (cornerIndex === 0) return true; // At start, can only go forward
        if (cornerIndex >= this.currentStrokeCoords.length - 1) return false; // At end, can only go backward
        
        const cornerCoord = this.currentStrokeCoords[cornerIndex];
        const prevCoord = this.currentStrokeCoords[cornerIndex - 1];
        const nextCoord = this.currentStrokeCoords[cornerIndex + 1];
        
        if (!cornerCoord || !prevCoord || !nextCoord) return true;
        
        // Calculate vectors from corner to previous and next points
        const toPrev = {
            x: prevCoord.x - cornerCoord.x,
            y: prevCoord.y - cornerCoord.y
        };
        
        const toNext = {
            x: nextCoord.x - cornerCoord.x,
            y: nextCoord.y - cornerCoord.y
        };
        
        // Calculate vector from corner to drag point
        const toDrag = {
            x: dragPoint.x - cornerCoord.x,
            y: dragPoint.y - cornerCoord.y
        };
        
        // Calculate dot products to see which direction is closer
        const dotPrev = toDrag.x * toPrev.x + toDrag.y * toPrev.y;
        const dotNext = toDrag.x * toNext.x + toDrag.y * toNext.y;
        
        // If closer to next direction, it's forward
        return dotNext > dotPrev;
    } segmentY);
            
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
        
        // Apply mandatory progression rules for sharp corners
        const mandatoryResult = this.checkMandatoryProgression(bestCoordIndex, bestProgress, dragPoint);
        if (mandatoryResult) {
            return mandatoryResult;
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

    checkMandatoryProgression(coordIndex, progress, dragPoint) {
        const currentNumber = this.getCurrentNumber();
        if (!this.mandatoryProgressions[currentNumber]) return null;
        
        const currentPosition = this.getInterpolatedPosition(coordIndex, progress);
        if (!currentPosition) return null;
        
        // Check each mandatory progression for this number
        for (const progression of this.mandatoryProgressions[currentNumber]) {
            const scaledCorner = this.scaleTargetCoordinate(progression.cornerPoint);
            
            // Check if we're near the corner point
            const distanceToCorner = Math.sqrt(
                Math.pow(currentPosition.x - scaledCorner.x, 2) + 
                Math.pow(currentPosition.y - scaledCorner.y, 2)
            );
            
            const cornerTolerance = 15;
            
            if (distanceToCorner <= cornerTolerance) {
                // Determine if user is trying to go forward or backward
                const cornerIndex = this.findClosestCoordinateIndex(scaledCorner);
                
                if (cornerIndex !== -1) {
                    // Check drag direction relative to the path
                    const isMovingForward = this.isDragDirectionForward(dragPoint, cornerIndex);
                    
                    if (isMovingForward) {
                        // Force progression to forward coordinate
                        const scaledForward = this.scaleTargetCoordinate(progression.forwardTo);
                        const forwardIndex = this.findClosestCoordinateIndex(scaledForward);
                        
                        if (forwardIndex !== -1) {
                            console.log(`Mandatory forward progression from ${progression.cornerPoint} to ${progression.forwardTo}`);
                            return {
                                coordIndex: forwardIndex,
                                progress: 0,
                                distance: 0,
                                mandatory: true
                            };
                        }
                    } else {
                        // Force progression to backward coordinate
                        const scaledBackward = this.scaleTargetCoordinate(progression.backwardTo);
                        const backwardIndex = this.findClosestCoordinateIndex(scaledBackward);
                        
                        if (backwardIndex !== -1) {
                            console.log(`Mandatory backward progression from ${progression.cornerPoint} to ${progression.backwardTo}`);
                            return {
                                coordIndex: backwardIndex,
                                progress: 0,
                                distance: 0,
                                mandatory: true
                            };
                        }
                    }
                }
            }
        }
        
        return null;
    }

    isDragDirectionForward(dragPoint, cornerIndex) {
        // Determine if the drag direction is forward or backward along the path
        if (cornerIndex === 0) return true; // At start, can only go forward
        if (cornerIndex >= this.currentStrokeCoords.length - 1) return false; // At end, can only go backward
        
        const cornerCoord = this.currentStrokeCoords[cornerIndex];
        const prevCoord = this.currentStrokeCoords[cornerIndex - 1];
        const nextCoord = this.currentStrokeCoords[cornerIndex + 1];
        
        if (!cornerCoord || !prevCoord || !nextCoord) return true;
        
        // Calculate vectors from corner to previous and next points
        const toPrev = {
            x: prevCoord.x - cornerCoord.x,
            y: prevCoord.y - cornerCoord.y
        };
        
        const toNext = {
            x: nextCoord.x - cornerCoord.x,
            y: nextCoord.y - cornerCoord.y
        };
        
        // Calculate vector from corner to drag point
        const toDrag = {
            x: dragPoint.x - cornerCoord.x,
            y: dragPoint.y - cornerCoord.y
        };
        
        // Calculate dot products to see which direction is closer
        const dotPrev = toDrag.x * toPrev.x + toDrag.y * toPrev.y;
        const dotNext = toDrag.x * toNext.x + toDrag.y * toNext.y;
        
        // If closer to next direction, it's forward
        return dotNext > dotPrev;
    } segmentY);
            
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
        
        if (!nextCoord) return;
        
        const frontMarkerX = currentCoord.x + (nextCoord.x - currentCoord.x) * progress;
        const frontMarkerY = currentCoord.y + (nextCoord.y - currentCoord.y) * progress;
        
        this.updateFrontMarkerPosition({ x: frontMarkerX, y: frontMarkerY });
        
        // Check for jump triggers
        const jumpTriggered = this.checkForJumpTriggers(coordIndex, progress);
        if (jumpTriggered) {
            return; // Jump handling will take over
        }
        
        // Update the trace line progress
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
        
        newCoordinateIndex = Math.min(newCoordinateIndex, coordIndex);
        
        if (progress < 0.7 && coordIndex === newCoordinateIndex && coordIndex > 0) {
            newCoordinateIndex = Math.max(0, coordIndex - 1);
        }
        
        if (newCoordinateIndex !== this.currentCoordinateIndex) {
            this.currentCoordinateIndex = newCoordinateIndex;
            this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
        }
        
        // Check if we've reached the end of the path
        if (this.currentCoordinateIndex >= this.currentStrokeCoords.length - 3) {
            setTimeout(() => {
                this.completeCurrentStroke();
            }, 200);
        }
    }

    checkForJumpTriggers(coordIndex, progress) {
        const currentNumber = this.getCurrentNumber();
        if (!this.jumpDefinitions[currentNumber]) return false;
        
        const currentPosition = this.getInterpolatedPosition(coordIndex, progress);
        if (!currentPosition) return false;
        
        // Check each jump definition for this number
        for (let i = 0; i < this.jumpDefinitions[currentNumber].length; i++) {
            const jumpDef = this.jumpDefinitions[currentNumber][i];
            const jumpKey = `${currentNumber}-${i}`;
            
            // Skip if this jump was already triggered
            if (this.triggeredJumps.has(jumpKey)) continue;
            
            // Convert trigger coordinate to scaled coordinate system
            const scaledTrigger = this.scaleTargetCoordinate(jumpDef.trigger);
            
            // Check if we're close enough to the trigger point
            const distance = Math.sqrt(
                Math.pow(currentPosition.x - scaledTrigger.x, 2) + 
                Math.pow(currentPosition.y - scaledTrigger.y, 2)
            );
            
            const triggerTolerance = 25; // Tolerance for trigger detection
            
            if (distance <= triggerTolerance) {
                console.log(`Jump triggered for number ${currentNumber}: ${jumpDef.trigger} -> ${jumpDef.jumpTo}`);
                this.triggeredJumps.add(jumpKey);
                this.executeJump(jumpDef);
                return true;
            }
        }
        
        return false;
    }

    executeJump(jumpDef) {
        const scaledJumpTo = this.scaleTargetCoordinate(jumpDef.jumpTo);
        
        // Find the coordinate index closest to the jump target
        const targetIndex = this.findClosestCoordinateIndex(scaledJumpTo);
        
        if (targetIndex !== -1) {
            if (jumpDef.isNewSection) {
                console.log(`Jumping to new section at coordinate ${jumpDef.jumpTo}`);
                // For new sections, move the slider and reset tracing from that point
                this.currentCoordinateIndex = targetIndex;
                this.renderer.updateTracingProgress(this.currentStroke, targetIndex);
                
                // Move slider to new position
                if (this.slider) {
                    this.slider.setAttribute('cx', scaledJumpTo.x);
                    this.slider.setAttribute('cy', scaledJumpTo.y);
                }
                
                // Update front marker if it exists
                if (this.frontMarker) {
                    this.updateFrontMarkerPosition(scaledJumpTo);
                    this.frontMarkerCoordIndex = targetIndex;
                    this.frontMarkerProgress = 0;
                }
            } else {
                console.log(`Auto-completing to coordinate ${jumpDef.jumpTo}`);
                // For regular jumps, auto-complete the trace to the target point
                this.currentCoordinateIndex = targetIndex;
                this.renderer.updateTracingProgress(this.currentStroke, targetIndex);
                
                // Continue tracing from the new position
                if (this.frontMarker) {
                    this.updateFrontMarkerPosition(scaledJumpTo);
                    this.frontMarkerCoordIndex = targetIndex;
                    this.frontMarkerProgress = 0;
                }
            }
        }
    }

    findClosestCoordinateIndex(targetPosition) {
        let closestIndex = -1;
        let closestDistance = Infinity;
        
        for (let i = 0; i < this.currentStrokeCoords.length; i++) {
            const coord = this.currentStrokeCoords[i];
            const distance = Math.sqrt(
                Math.pow(coord.x - targetPosition.x, 2) + 
                Math.pow(coord.y - targetPosition.y, 2)
            );
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = i;
            }
        }
        
        return closestIndex;
    }

    scaleTargetCoordinate(originalCoord) {
        // Use the same scaling logic as the renderer
        const scaleX = CONFIG.NUMBER_RECT_WIDTH / 100;
        const scaleY = CONFIG.NUMBER_RECT_HEIGHT / 200;
        const offsetX = CONFIG.NUMBER_CENTER_X - CONFIG.NUMBER_RECT_WIDTH / 2;
        const offsetY = CONFIG.NUMBER_CENTER_Y - CONFIG.NUMBER_RECT_HEIGHT / 2;
        
        const scaledX = offsetX + (originalCoord[0] * scaleX);
        const scaledY = offsetY + ((200 - originalCoord[1]) * scaleY); // Flip Y coordinate
        
        return { x: scaledX, y: scaledY };
    }

    completeCurrentStroke() {
        console.log(`Completing stroke ${this.currentStroke}`);
        
        this.isTracing = false;
        this.isDragging = false;
        
        if (this.slider) {
            this.slider.style.opacity = '0';
        }
        this.removeFrontMarker();
        
        // Mark the stroke as complete in the renderer
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
            
            console.log(`All strokes completed for number ${this.getCurrentNumber()}`);
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
        this.triggeredJumps.clear();
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
