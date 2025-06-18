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
        this.lastValidPosition = null;
        this.isDragging = false;
        
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
        this.currentStroke = strokeIndex;
        this.currentProgress = 0;
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
        
        // Create slider at start position
        this.createSlider(strokeData.strokeData.startPoint);
        
        // Create direction arrow
        this.createArrow();
        this.updateArrowPosition(0);
        
        console.log(`Started stroke ${strokeIndex} for number ${this.renderer.currentNumber}`);
        return true;
    }

    createSlider(startPoint) {
        // Remove existing slider
        if (this.slider) {
            this.slider.remove();
        }
        
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
        this.svg.appendChild(this.arrow);
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
        
        // Check if point is within path tolerance
        const pathProgress = this.getProgressAlongPath(point);
        
        if (pathProgress !== null) {
            // Valid position - update progress
            this.updateProgress(pathProgress, point);
        } else {
            // Invalid position - check if we should stop tracing
            this.handleInvalidPosition(point);
        }
    }

    handleEnd(event) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        // If we're not far enough along the path, reset to last valid position
        if (this.currentProgress < 0.1) {
            this.resetSliderPosition();
            this.isTracing = false;
        }
        
        console.log('Ended tracing. Progress:', this.currentProgress);
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

    getProgressAlongPath(point) {
        if (!this.pathElementCache) return null;
        
        let closestDistance = Infinity;
        let closestProgress = null;
        
        // Sample points along the path to find closest match
        const samples = Math.max(50, Math.floor(this.pathLengthCache / 5));
        
        for (let i = 0; i <= samples; i++) {
            const progress = i / samples;
            const pathLength = progress * this.pathLengthCache;
            const pathPoint = this.pathElementCache.getPointAtLength(pathLength);
            
            const distance = Math.sqrt(
                Math.pow(point.x - pathPoint.x, 2) +
                Math.pow(point.y - pathPoint.y, 2)
            );
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestProgress = progress;
            }
        }
        
        // Check if closest point is within tolerance
        if (closestDistance <= CONFIG.PATH_TOLERANCE) {
            // Ensure progress only moves forward
            if (closestProgress >= this.currentProgress - 0.05) { // Allow small backward movement
                return closestProgress;
            }
        }
        
        return null;
    }

    updateProgress(progress, point) {
        // Smooth progress updates - don't allow big jumps backward
        const maxProgressJump = 0.1;
        if (progress < this.currentProgress - maxProgressJump) {
            progress = this.currentProgress;
        }
        
        this.currentProgress = Math.max(this.currentProgress, progress);
        this.lastValidPosition = point;
        
        // Update slider position
        const pathPoint = this.pathElementCache.getPointAtLength(this.currentProgress * this.pathLengthCache);
        this.slider.setAttribute('cx', pathPoint.x);
        this.slider.setAttribute('cy', pathPoint.y);
        
        // Update arrow position
        this.updateArrowPosition(this.currentProgress);
        
        // Update renderer with progress
        this.renderer.updateTracingProgress(this.currentStroke, this.currentProgress);
        
        // Check for stroke completion
        if (this.currentProgress >= 0.95) {
            this.completeCurrentStroke();
        }
    }

    handleInvalidPosition(point) {
        // Calculate distance from last valid position
        const distance = Math.sqrt(
            Math.pow(point.x - this.lastValidPosition.x, 2) +
            Math.pow(point.y - this.lastValidPosition.y, 2)
        );
        
        // If too far from path, stop tracing
        if (distance > CONFIG.PATH_TOLERANCE * 2) {
            console.log('Too far from path, stopping trace');
            this.stopTracing();
        }
    }

    stopTracing() {
        this.isTracing = false;
        this.isDragging = false;
        
        // Animate slider back to last valid position
        this.resetSliderPosition();
    }

    resetSliderPosition() {
        if (!this.slider || !this.lastValidPosition) return;
        
        // Smoothly animate back to last valid position
        this.slider.style.transition = CONFIG.SLIDER_TRANSITION_SPEED;
        this.slider.setAttribute('cx', this.lastValidPosition.x);
        this.slider.setAttribute('cy', this.lastValidPosition.y);
        
        // Remove transition after animation
        setTimeout(() => {
            if (this.slider) {
                this.slider.style.transition = '';
            }
        }, 100);
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
            if (this.slider) {
                this.slider.remove();
                this.slider = null;
            }
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
        if (this.slider) {
            this.slider.remove();
            this.slider = null;
        }
        if (this.arrow) {
            this.arrow.remove();
            this.arrow = null;
        }
        
        this.isTracing = false;
        this.isDragging = false;
        this.currentProgress = 0;
        this.lastValidPosition = null;
    }

    reset() {
        this.cleanup();
        this.currentStroke = 0;
        this.pathElementCache = null;
        this.pathLengthCache = null;
    }

    // Debug methods
    showPathSamples() {
        if (!CONFIG.DEBUG_MODE || !this.pathElementCache) return;
        
        const samples = 20;
        for (let i = 0; i <= samples; i++) {
            const progress = i / samples;
            const point = this.pathElementCache.getPointAtLength(progress * this.pathLengthCache);
            
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', point.x);
            circle.setAttribute('cy', point.y);
            circle.setAttribute('r', 3);
            circle.setAttribute('fill', 'red');
            circle.setAttribute('class', 'debug-sample');
            
            this.svg.appendChild(circle);
        }
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
        circle.setAttribute('r', CONFIG.PATH_TOLERANCE);
        circle.setAttribute('fill', 'rgba(255,255,0,0.2)');
        circle.setAttribute('stroke', 'yellow');
        circle.setAttribute('stroke-width', 1);
        circle.setAttribute('class', 'tolerance-indicator');
        
        this.svg.appendChild(circle);
    }
}
