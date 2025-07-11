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
        
        // Enhanced slider interaction area
        this.sliderInteractionRadius = CONFIG.SLIDER_SIZE * 1.5; // 1.5x larger hit area
        
        // Direction arrow functionality
        this.directionArrow = null;
        this.arrowTimeout = null;
        this.idleThreshold = 2000; // 2 seconds of inactivity
        this.arrowDistance = 15; // 15 pixels from circle edge
        this.arrowLength = 30; // 30 pixels long
        
        // Faster catch-up animation for the red circle
        this.catchUpSpeed = 12; // Higher = faster catch-up
        this.animationFrameId = null;
        this.targetPosition = null;
        this.isAnimatingCatchUp = false;
        
        // Auto progression trigger points
        this.autoProgressionTriggers = {
            0: [{ trigger: [96, 61], jumpTo: [100, 100] }],
            1: [{ trigger: [50, 30], jumpTo: [50, 0] }],
            2: [{ trigger: [27, 36], jumpTo: [0, 0] }],
            3: [{ trigger: [50, 101], jumpTo: [35, 100] }],
            4: [
                { trigger: [9, 116], jumpTo: [0, 80] },
                { trigger: [80, 80], jumpTo: [100, 80] },
                { trigger: [100, 80], jumpTo: [60, 140], sectionBreak: true },
                { trigger: [60, 30], jumpTo: [60, 0] }
            ],
            5: [
                { trigger: [80, 200], jumpTo: [100, 200] },
                { trigger: [100, 200], jumpTo: [0, 200], sectionBreak: true },
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
        
        // Mandatory progression points for sharp corners
        this.mandatoryProgressions = {
            2: [{ coordinate: [0, 0], forwardTo: [10, 0], backwardTo: [9, 12] }],
            3: [{ coordinate: [35, 100], forwardTo: [40, 99.9], backwardTo: [40, 100.1] }],
            4: [{ coordinate: [0, 80], forwardTo: [10, 80], backwardTo: [3, 92] }],
            7: [{ coordinate: [100, 200], forwardTo: [95, 183], backwardTo: [90, 200] }],
            9: [{ coordinate: [100, 190], forwardTo: [99, 182], backwardTo: [98.9, 182] }]
        };
        
        // Stroke end coordinates
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
        
        // Stroke completion triggers
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
        this.stopCatchUpAnimation();
        
        const startPoint = this.currentStrokeCoords[0];
        this.renderer.updateTracingProgress(this.currentStroke, 0);
        
        setTimeout(() => {
            this.createSlider(startPoint);
            this.startArrowTimer(); // Start the arrow timer for new stroke
        }, 100);
        
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

    findOriginalCoordinateIndex(targetCoord, searchFromIndex = 0) {
        const currentNumber = this.getCurrentNumber();
        if (currentNumber === null) return -1;
        
        const numberConfig = CONFIG.STROKE_DEFINITIONS[currentNumber];
        if (!numberConfig || !numberConfig.strokes[this.currentStroke]) return -1;
        
        const originalCoords = numberConfig.strokes[this.currentStroke].coordinates;
        if (!originalCoords) return -1;
        
        const tolerance = 1.0;
        
        for (let i = searchFromIndex; i < originalCoords.length; i++) {
            const coord = originalCoords[i];
            const deltaX = Math.abs(coord.x - targetCoord[0]);
            const deltaY = Math.abs(coord.y - targetCoord[1]);
            
            if (deltaX <= tolerance && deltaY <= tolerance) {
                return i;
            }
        }
        
        return -1;
    }

    checkAutoProgression(coordIndex) {
        const currentNumber = this.getCurrentNumber();
        if (currentNumber === null) return null;
        
        const triggers = this.autoProgressionTriggers[currentNumber];
        if (!triggers) return null;
        
        const numberConfig = CONFIG.STROKE_DEFINITIONS[currentNumber];
        if (!numberConfig || !numberConfig.strokes[this.currentStroke]) return null;
        
        const originalCoords = numberConfig.strokes[this.currentStroke].coordinates;
        if (!originalCoords || coordIndex >= originalCoords.length) return null;
        
        const currentOriginalCoord = originalCoords[coordIndex];
        
        for (const trigger of triggers) {
            const deltaX = Math.abs(currentOriginalCoord.x - trigger.trigger[0]);
            const deltaY = Math.abs(currentOriginalCoord.y - trigger.trigger[1]);
            
            if (deltaX <= 1.0 && deltaY <= 1.0) {
                if (trigger.sectionBreak) {
                    return {
                        targetIndex: -1,
                        sectionBreak: true,
                        nextStrokeStart: trigger.jumpTo
                    };
                } else {
                    const targetIndex = this.findOriginalCoordinateIndex(trigger.jumpTo, coordIndex + 1);
                    if (targetIndex !== -1) {
                        return {
                            targetIndex: targetIndex,
                            sectionBreak: false
                        };
                    }
                }
            }
        }
        
        return null;
    }

    checkMandatoryProgression(coordIndex, isMovingForward) {
        const currentNumber = this.getCurrentNumber();
        if (currentNumber === null) return null;
        
        const progressions = this.mandatoryProgressions[currentNumber];
        if (!progressions) return null;
        
        const numberConfig = CONFIG.STROKE_DEFINITIONS[currentNumber];
        if (!numberConfig || !numberConfig.strokes[this.currentStroke]) return null;
        
        const originalCoords = numberConfig.strokes[this.currentStroke].coordinates;
        if (!originalCoords || coordIndex >= originalCoords.length) return null;
        
        const currentOriginalCoord = originalCoords[coordIndex];
        
        for (const progression of progressions) {
            const deltaX = Math.abs(currentOriginalCoord.x - progression.coordinate[0]);
            const deltaY = Math.abs(currentOriginalCoord.y - progression.coordinate[1]);
            
            if (deltaX <= 1.0 && deltaY <= 1.0) {
                const targetCoord = isMovingForward ? progression.forwardTo : progression.backwardTo;
                const searchFromIndex = isMovingForward ? coordIndex + 1 : 0;
                const targetIndex = this.findOriginalCoordinateIndex(targetCoord, searchFromIndex);
                
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

    // Direction Arrow System
    startArrowTimer() {
        this.clearArrowTimer();
        this.arrowTimeout = setTimeout(() => {
            if (!this.isDragging && this.slider && this.currentStrokeCoords.length > 0) {
                this.showDirectionArrow();
            }
        }, this.idleThreshold);
    }

    clearArrowTimer() {
        if (this.arrowTimeout) {
            clearTimeout(this.arrowTimeout);
            this.arrowTimeout = null;
        }
        this.removeDirectionArrow();
    }

    showDirectionArrow() {
        if (this.isDragging || !this.slider) {
            return; // Don't show arrow if dragging or no slider
        }

        // Get current position
        const currentPos = this.currentStrokeCoords[this.currentCoordinateIndex];
        if (!currentPos) return;

        // Calculate target position - try to get 5 coordinates ahead, but use what's available
        let targetIndex = this.currentCoordinateIndex + 5;
        const maxIndex = this.currentStrokeCoords.length - 1;
        
        // If we don't have 5 coordinates left, use the last coordinate
        if (targetIndex > maxIndex) {
            targetIndex = maxIndex;
        }
        
        // Only skip showing arrow if we're literally at the very last coordinate
        if (this.currentCoordinateIndex >= maxIndex) {
            return;
        }

        const targetPos = this.currentStrokeCoords[targetIndex];
        if (!targetPos) return;

        // Calculate direction vector from current to target position
        const deltaX = targetPos.x - currentPos.x;
        const deltaY = targetPos.y - currentPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance === 0) return; // Avoid division by zero

        // Normalize direction vector
        const dirX = deltaX / distance;
        const dirY = deltaY / distance;

        // Get slider position
        const sliderX = parseFloat(this.slider.getAttribute('cx'));
        const sliderY = parseFloat(this.slider.getAttribute('cy'));
        const sliderRadius = CONFIG.SLIDER_SIZE / 2;

        // Calculate arrow start position (15px from circle edge)
        const arrowStartX = sliderX + (dirX * (sliderRadius + this.arrowDistance));
        const arrowStartY = sliderY + (dirY * (sliderRadius + this.arrowDistance));

        // Calculate arrow end position (30px further along the line)
        const arrowEndX = arrowStartX + (dirX * this.arrowLength);
        const arrowEndY = arrowStartY + (dirY * this.arrowLength);

        // Create the arrow
        this.createDirectionArrow(arrowStartX, arrowStartY, arrowEndX, arrowEndY);
    }

    createDirectionArrow(startX, startY, endX, endY) {
        this.removeDirectionArrow();

        // Create arrow group
        const arrowGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        arrowGroup.setAttribute('class', 'direction-arrow');

        // Calculate angle for arrowhead
        const angle = Math.atan2(endY - startY, endX - startX);
        const arrowHeadLength = 16; // Larger arrowhead for fatter arrow
        const arrowHeadAngle = Math.PI / 6; // 30 degrees

        // Main arrow line with thicker white outline + lighter blue fill
        const arrowLineOutline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        arrowLineOutline.setAttribute('x1', startX);
        arrowLineOutline.setAttribute('y1', startY);
        arrowLineOutline.setAttribute('x2', endX);
        arrowLineOutline.setAttribute('y2', endY);
        arrowLineOutline.setAttribute('stroke', 'white');
        arrowLineOutline.setAttribute('stroke-width', '20'); // Thicker white outline
        arrowLineOutline.setAttribute('stroke-linecap', 'round');
        arrowLineOutline.setAttribute('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))');

        const arrowLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        arrowLine.setAttribute('x1', startX);
        arrowLine.setAttribute('y1', startY);
        arrowLine.setAttribute('x2', endX);
        arrowLine.setAttribute('y2', endY);
        arrowLine.setAttribute('stroke', '#3b82f6'); // Lighter blue (was #1e3a8a)
        arrowLine.setAttribute('stroke-width', '14');
        arrowLine.setAttribute('stroke-linecap', 'round');

        // Arrowhead (left side) with thicker white outline + lighter blue fill
        const arrowHead1Outline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        const head1X = endX - arrowHeadLength * Math.cos(angle - arrowHeadAngle);
        const head1Y = endY - arrowHeadLength * Math.sin(angle - arrowHeadAngle);
        arrowHead1Outline.setAttribute('x1', endX);
        arrowHead1Outline.setAttribute('y1', endY);
        arrowHead1Outline.setAttribute('x2', head1X);
        arrowHead1Outline.setAttribute('y2', head1Y);
        arrowHead1Outline.setAttribute('stroke', 'white');
        arrowHead1Outline.setAttribute('stroke-width', '20'); // Thicker white outline
        arrowHead1Outline.setAttribute('stroke-linecap', 'round');

        const arrowHead1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        arrowHead1.setAttribute('x1', endX);
        arrowHead1.setAttribute('y1', endY);
        arrowHead1.setAttribute('x2', head1X);
        arrowHead1.setAttribute('y2', head1Y);
        arrowHead1.setAttribute('stroke', '#3b82f6'); // Lighter blue
        arrowHead1.setAttribute('stroke-width', '14');
        arrowHead1.setAttribute('stroke-linecap', 'round');

        // Arrowhead (right side) with thicker white outline + lighter blue fill
        const arrowHead2Outline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        const head2X = endX - arrowHeadLength * Math.cos(angle + arrowHeadAngle);
        const head2Y = endY - arrowHeadLength * Math.sin(angle + arrowHeadAngle);
        arrowHead2Outline.setAttribute('x1', endX);
        arrowHead2Outline.setAttribute('y1', endY);
        arrowHead2Outline.setAttribute('x2', head2X);
        arrowHead2Outline.setAttribute('y2', head2Y);
        arrowHead2Outline.setAttribute('stroke', 'white');
        arrowHead2Outline.setAttribute('stroke-width', '20'); // Thicker white outline
        arrowHead2Outline.setAttribute('stroke-linecap', 'round');

        const arrowHead2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        arrowHead2.setAttribute('x1', endX);
        arrowHead2.setAttribute('y1', endY);
        arrowHead2.setAttribute('x2', head2X);
        arrowHead2.setAttribute('y2', head2Y);
        arrowHead2.setAttribute('stroke', '#3b82f6'); // Lighter blue
        arrowHead2.setAttribute('stroke-width', '14');
        arrowHead2.setAttribute('stroke-linecap', 'round');

        // Add all parts to group (outlines first, then fills)
        arrowGroup.appendChild(arrowLineOutline);
        arrowGroup.appendChild(arrowHead1Outline);
        arrowGroup.appendChild(arrowHead2Outline);
        arrowGroup.appendChild(arrowLine);
        arrowGroup.appendChild(arrowHead1);
        arrowGroup.appendChild(arrowHead2);

        // Add entrance animation
        arrowGroup.style.opacity = '0';
        arrowGroup.style.transform = 'scale(0.5)';
        arrowGroup.style.transition = 'all 0.3s ease-out';
        arrowGroup.style.transformOrigin = `${startX}px ${startY}px`;

        // Add to SVG
        this.svg.appendChild(arrowGroup);
        this.directionArrow = arrowGroup;

        // Trigger entrance animation
        setTimeout(() => {
            if (this.directionArrow) {
                this.directionArrow.style.opacity = '1';
                this.directionArrow.style.transform = 'scale(1)';
            }
        }, 50);

        // Add soft pulse animation synchronized with red circle (same 2s timing)
        const pulseAnimation = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        pulseAnimation.setAttribute('attributeName', 'transform');
        pulseAnimation.setAttribute('type', 'scale');
        pulseAnimation.setAttribute('values', '1;1.05;1'); // Softer pulse (1.05 instead of 1.1)
        pulseAnimation.setAttribute('dur', '2s'); // Same 2s timing as red circle
        pulseAnimation.setAttribute('repeatCount', 'indefinite');
        arrowGroup.appendChild(pulseAnimation);
    }

    removeDirectionArrow() {
        if (this.directionArrow) {
            this.directionArrow.remove();
            this.directionArrow = null;
        }
    }

    // Enhanced catch-up animation system
    startCatchUpAnimation(targetPosition) {
        this.stopCatchUpAnimation();
        this.targetPosition = targetPosition;
        this.isAnimatingCatchUp = true;
        
        if (this.slider) {
            this.slider.style.opacity = '0';
            const animate = this.slider.querySelector('animate');
            if (animate) animate.remove();
        }
        
        this.animateCatchUp();
    }

    animateCatchUp() {
        if (!this.isAnimatingCatchUp || !this.slider || !this.targetPosition) {
            return;
        }

        const currentX = parseFloat(this.slider.getAttribute('cx'));
        const currentY = parseFloat(this.slider.getAttribute('cy'));
        
        const deltaX = this.targetPosition.x - currentX;
        const deltaY = this.targetPosition.y - currentY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // If we're close enough, snap to target and finish
        if (distance < 2) {
            this.slider.setAttribute('cx', this.targetPosition.x);
            this.slider.setAttribute('cy', this.targetPosition.y);
            this.finishCatchUpAnimation();
            return;
        }
        
        // Move towards target with easing
        const speed = Math.min(distance * 0.2, this.catchUpSpeed);
        const moveX = (deltaX / distance) * speed;
        const moveY = (deltaY / distance) * speed;
        
        this.slider.setAttribute('cx', currentX + moveX);
        this.slider.setAttribute('cy', currentY + moveY);
        
        this.animationFrameId = requestAnimationFrame(() => this.animateCatchUp());
    }

    finishCatchUpAnimation() {
        this.stopCatchUpAnimation();
        
        if (this.slider) {
            this.slider.style.transition = 'opacity 0.25s ease-in';
            this.slider.style.opacity = '1';
            
            setTimeout(() => {
                if (!this.isDragging && this.slider) {
                    this.addSliderPulseAnimation();
                    this.startArrowTimer(); // Start arrow timer after animation finishes
                }
            }, 250);
            
            setTimeout(() => {
                if (this.slider) {
                    this.slider.style.transition = '';
                }
            }, 300);
        }
    }

    stopCatchUpAnimation() {
        this.isAnimatingCatchUp = false;
        this.targetPosition = null;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

handleStart(event) {
    event.preventDefault();
    
    const point = this.getEventPoint(event);
    if (!point) return;
    
    const nearSlider = this.isPointNearSlider(point);

    if (nearSlider) {
        // Call the game controller's handleFirstTouch method for audio activation
        if (window.traceGame && typeof window.traceGame.handleFirstTouch === 'function') {
            window.traceGame.handleFirstTouch();
        }
        
        this.isDragging = true;
        this.isTracing = true;
        this.stopCatchUpAnimation();
        this.clearArrowTimer(); // Hide arrow when starting to drag
        
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
        this.clearArrowTimer(); // Reset arrow timer on movement
        
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
        
        // Use the new catch-up animation system
        setTimeout(() => {
            if (!this.isDragging && this.slider) {
                const finalPosition = this.getInterpolatedPosition(
                    this.finalFrontMarkerCoordIndex, 
                    this.finalFrontMarkerProgress
                );
                
                if (finalPosition) {
                    this.currentCoordinateIndex = this.finalFrontMarkerCoordIndex;
                    if (this.finalFrontMarkerProgress >= 0.95) {
                        this.currentCoordinateIndex = Math.min(
                            this.currentCoordinateIndex + 1, 
                            this.currentStrokeCoords.length - 1
                        );
                    }
                    
                    this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
                    
                    // Start smooth catch-up animation instead of instant positioning
                    this.startCatchUpAnimation(finalPosition);
                }
            }
        }, 100); // Reduced delay for faster response
        
        setTimeout(() => {
            if (!this.isDragging) {
                this.removeFrontMarker();
                this.startArrowTimer(); // Restart arrow timer after drag ends
            }
        }, 200); // Reduced delay
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
        
        // Use the enhanced interaction radius (1.5x larger)
        return distance <= this.sliderInteractionRadius;
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
        
        if (this.hasReachedStrokeCompletionPoint(coordIndex, progress)) {
            this.autoCompleteCurrentStroke();
            return;
        }
        
        let newCoordinateIndex = this.currentCoordinateIndex;
        
        const isMovingForward = coordIndex > this.currentCoordinateIndex || 
                               (coordIndex === this.currentCoordinateIndex && progress >= 0.7);
        
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
            
            // Restart arrow timer when coordinate index changes (user has made progress)
            this.startArrowTimer();
            
            const autoProgression = this.checkAutoProgression(this.currentCoordinateIndex);
            if (autoProgression) {
                this.completeTraceUpTo(autoProgression.targetIndex, autoProgression.sectionBreak);
                return;
            }
            
            const mandatoryTarget = this.checkMandatoryProgression(this.currentCoordinateIndex, isMovingForward);
            if (mandatoryTarget !== null) {
                this.completeTraceUpTo(mandatoryTarget, false);
                return;
            }
        }
    }

    completeTraceUpTo(targetIndex, isSectionBreak = false) {
        if (isSectionBreak) {
            this.currentCoordinateIndex = this.currentStrokeCoords.length - 1;
            this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
            
            const finalCoord = this.currentStrokeCoords[this.currentStrokeCoords.length - 1];
            if (finalCoord && this.frontMarker) {
                this.updateFrontMarkerPosition(finalCoord);
                this.frontMarkerCoordIndex = this.currentStrokeCoords.length - 1;
                this.frontMarkerProgress = 1.0;
            }
            
            setTimeout(() => {
                this.completeCurrentStroke();
            }, 300);
            
            return;
        }
        
        if (targetIndex < 0 || targetIndex >= this.currentStrokeCoords.length) {
            return;
        }
        
        this.currentCoordinateIndex = targetIndex;
        this.renderer.updateTracingProgress(this.currentStroke, this.currentCoordinateIndex);
        
        const targetCoord = this.currentStrokeCoords[targetIndex];
        if (targetCoord && this.frontMarker) {
            this.updateFrontMarkerPosition(targetCoord);
            this.frontMarkerCoordIndex = targetIndex;
            this.frontMarkerProgress = 0;
        }
        
        if (this.slider && targetCoord) {
            this.slider.setAttribute('cx', targetCoord.x);
            this.slider.setAttribute('cy', targetCoord.y);
        }
        
        setTimeout(() => {
            const autoProgression = this.checkAutoProgression(this.currentCoordinateIndex);
            if (autoProgression) {
                if (autoProgression.sectionBreak) {
                    this.completeTraceUpTo(-1, true);
                } else {
                    this.completeTraceUpTo(autoProgression.targetIndex, false);
                }
                return;
            }
            
            if (targetIndex >= this.currentStrokeCoords.length - 1) {
                setTimeout(() => {
                    this.completeCurrentStroke();
                }, 300);
            }
        }, 100);
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
        this.stopCatchUpAnimation();
        
        if (this.slider) {
            this.slider.style.opacity = '0';
        }
        this.removeFrontMarker();
        
        const coords = this.renderer.getStrokeCoordinates(this.currentStroke);
        if (coords && coords.length > 0) {
            this.renderer.createTracedPath(this.currentStroke, coords.length - 1);
        }
        
        const currentNumber = this.getCurrentNumber();
        const totalStrokes = this.renderer.getStrokeCount();
        
        if (this.currentStroke + 1 < totalStrokes) {
            const nextStrokeIndex = this.currentStroke + 1;
            setTimeout(() => {
                this.startNewStroke(nextStrokeIndex);
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

    moveToNextStroke() {
        const totalStrokes = this.renderer.getStrokeCount();
        if (this.currentStroke + 1 < totalStrokes) {
            this.startNewStroke(this.currentStroke + 1);
        }
    }

    cleanup() {
        this.removeSlider();
        this.removeFrontMarker();
        this.removeDirectionArrow();
        this.clearArrowTimer();
        this.stopCatchUpAnimation();
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
