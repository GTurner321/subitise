class TraceNumberRenderer {
    constructor() {
        // Core rendering state
        this.svg = null;
        this.currentNumber = null;
        this.currentStroke = 0;
        this.completedStrokes = new Set();
        
        // Paint system state
        this.paintProgress = {};
        
        // Number paths data
        this.numberPaths = {};
        this.strokeElements = {};
        
        // SVG dimensions
        this.svgWidth = CONFIG.SVG_WIDTH;
        this.svgHeight = CONFIG.SVG_HEIGHT;
        
        console.log('TraceNumberRenderer initialized');
    }

    initialize(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container not found:', containerId);
            return false;
        }

        // Create SVG element
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('class', 'trace-svg');
        this.svg.setAttribute('viewBox', `0 0 ${this.svgWidth} ${this.svgHeight}`);
        this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        
        // Set initial dimensions
        this.updateSVGDimensions();
        
        // Create defs section for masks and patterns
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        this.svg.appendChild(defs);
        
        // Add to container
        container.appendChild(this.svg);
        
        console.log('SVG renderer initialized successfully');
        return true;
    }

    updateSVGDimensions() {
        if (!this.svg) return;
        
        const container = this.svg.parentElement;
        if (container) {
            const rect = container.getBoundingClientRect();
            this.svg.style.width = '100%';
            this.svg.style.height = '100%';
        }
    }

    renderNumber(number) {
        if (!this.svg) {
            console.error('SVG not initialized');
            return false;
        }

        // Clear previous number
        this.clearSVG();
        
        // Reset state
        this.currentNumber = number;
        this.currentStroke = 0;
        this.completedStrokes.clear();
        this.paintProgress = {};
        this.strokeElements = {};

        // Get number path data
        const numberData = this.getNumberData(number);
        if (!numberData) {
            console.error('No path data found for number:', number);
            return false;
        }

        // Render the number outline
        this.renderNumberOutline(numberData);
        
        console.log(`Number ${number} rendered successfully`);
        return true;
    }

    getNumberData(number) {
        // This would typically come from your CONFIG.NUMBER_PATHS
        // For now, I'll provide a basic structure
        const numberPaths = {
            0: [
                "M 200 150 Q 150 100 100 150 Q 100 200 100 300 Q 100 400 150 450 Q 200 500 250 450 Q 300 400 300 300 Q 300 200 300 150 Q 250 100 200 150"
            ],
            1: [
                "M 200 100 L 200 500"
            ],
            2: [
                "M 100 200 Q 100 150 150 150 Q 200 150 250 150 Q 300 150 300 200 Q 300 250 200 350 L 100 450 L 300 450"
            ],
            3: [
                "M 100 200 Q 100 150 150 150 Q 200 150 250 150 Q 300 150 300 200 Q 300 250 250 275",
                "M 250 275 Q 300 300 300 350 Q 300 400 250 425 Q 200 450 150 425 Q 100 400 100 375"
            ],
            4: [
                "M 150 100 L 150 350 L 300 350",
                "M 250 100 L 250 450"
            ],
            5: [
                "M 300 100 L 100 100 L 100 275 Q 150 250 200 275 Q 300 300 300 375 Q 300 450 200 450 Q 100 450 100 375"
            ],
            6: [
                "M 300 150 Q 250 100 200 100 Q 150 100 100 150 Q 100 200 100 300 Q 100 400 150 450 Q 200 500 250 450 Q 300 400 300 350 Q 300 300 250 275 Q 200 250 150 275 Q 100 300 100 350"
            ],
            7: [
                "M 100 100 L 300 100 L 150 500"
            ],
            8: [
                "M 200 100 Q 150 100 125 125 Q 100 150 125 175 Q 150 200 200 200 Q 250 200 275 175 Q 300 150 275 125 Q 250 100 200 100",
                "M 200 200 Q 150 200 125 225 Q 100 250 100 300 Q 100 350 125 375 Q 150 400 200 400 Q 250 400 275 375 Q 300 350 300 300 Q 300 250 275 225 Q 250 200 200 200"
            ],
            9: [
                "M 100 350 Q 150 400 200 400 Q 250 400 300 350 Q 300 300 300 200 Q 300 100 250 50 Q 200 0 150 50 Q 100 100 100 150 Q 100 200 150 225 Q 200 250 250 225 Q 300 200 300 150"
            ]
        };

        const paths = numberPaths[number];
        if (!paths) return null;

        return {
            strokes: paths.map((path, index) => ({
                path: path,
                index: index
            }))
        };
    }

    renderNumberOutline(numberData) {
        const numberGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        numberGroup.setAttribute('class', `number-${this.currentNumber}`);
        
        // Render each stroke
        numberData.strokes.forEach((strokeData, index) => {
            this.renderStroke(strokeData, index, numberGroup);
        });
        
        this.svg.appendChild(numberGroup);
    }

    renderStroke(strokeData, strokeIndex, parentGroup) {
        // Create stroke group
        const strokeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        strokeGroup.setAttribute('class', `stroke-${strokeIndex}`);
        
        // Create the main outline path (black)
        const outlinePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        outlinePath.setAttribute('d', strokeData.path);
        outlinePath.setAttribute('fill', 'none');
        outlinePath.setAttribute('stroke', CONFIG.OUTLINE_COLOR || '#000000');
        outlinePath.setAttribute('stroke-width', CONFIG.OUTLINE_WIDTH || 30);
        outlinePath.setAttribute('stroke-linecap', 'round');
        outlinePath.setAttribute('stroke-linejoin', 'round');
        outlinePath.setAttribute('class', 'number-outline');
        
        // Create the white interior path (creates the "hollow" effect)
        const interiorPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        interiorPath.setAttribute('d', strokeData.path);
        interiorPath.setAttribute('fill', 'none');
        interiorPath.setAttribute('stroke', 'white');
        interiorPath.setAttribute('stroke-width', CONFIG.FILL_WIDTH || 20);
        interiorPath.setAttribute('stroke-linecap', 'round');
        interiorPath.setAttribute('stroke-linejoin', 'round');
        interiorPath.setAttribute('class', 'number-interior');
        
        // Add paths to stroke group
        strokeGroup.appendChild(outlinePath);
        strokeGroup.appendChild(interiorPath);
        
        // Store reference for paint system
        this.strokeElements[strokeIndex] = {
            group: strokeGroup,
            outline: outlinePath,
            interior: interiorPath
        };
        
        parentGroup.appendChild(strokeGroup);
    }

    // ================================
    // PAINT-FILL SYSTEM METHODS
    // ================================

    // Get the stroke path element for paint-fill system
    getStrokePathElement(strokeIndex) {
        const strokeElement = this.strokeElements[strokeIndex];
        if (!strokeElement) {
            console.error(`Stroke element ${strokeIndex} not found`);
            return null;
        }
        
        // Return the white interior path (the area we want to "paint over")
        return strokeElement.interior;
    }

    // Update paint progress (replaces updateTracingProgress)
    updatePaintProgress(strokeIndex, completionRatio) {
        console.log(`Paint progress for stroke ${strokeIndex}: ${(completionRatio * 100).toFixed(1)}%`);
        
        // Store progress for completion checking
        this.paintProgress[strokeIndex] = completionRatio;
        
        // Visual feedback could be added here if desired
        // For example, changing the outline color as progress increases
        if (completionRatio > 0.5) {
            const strokeElement = this.strokeElements[strokeIndex];
            if (strokeElement && strokeElement.outline) {
                strokeElement.outline.setAttribute('stroke', CONFIG.PROGRESS_COLOR || '#4CAF50');
            }
        }
        
        // Check if stroke is complete (80% painted = complete)
        if (completionRatio >= 0.8) {
            setTimeout(() => {
                this.completeStroke(strokeIndex);
            }, 100);
        }
    }

    // Enhanced stroke completion for paint system
    completeStroke(strokeIndex) {
        console.log(`Stroke ${strokeIndex} completed via painting!`);
        
        // Mark stroke as complete
        this.completedStrokes.add(strokeIndex);
        
        // Visual completion effect
        this.addStrokeCompletionEffect(strokeIndex);
        
        // Update stroke appearance
        const strokeElement = this.strokeElements[strokeIndex];
        if (strokeElement && strokeElement.outline) {
            strokeElement.outline.setAttribute('stroke', CONFIG.COMPLETE_COLOR || '#4CAF50');
            strokeElement.outline.setAttribute('stroke-width', (CONFIG.OUTLINE_WIDTH || 30) + 2);
        }
        
        // Check if entire number is complete
        if (this.completedStrokes.size >= this.getStrokeCount()) {
            setTimeout(() => {
                this.completeNumber();
            }, 500);
        } else {
            // Move to next stroke
            this.currentStroke = strokeIndex + 1;
        }
    }

    // Add completion effect for painted stroke
    addStrokeCompletionEffect(strokeIndex) {
        const strokePath = this.getStrokePathElement(strokeIndex);
        if (!strokePath) return;
        
        // Add a sparkle effect at the stroke location
        const bbox = strokePath.getBBox();
        const centerX = bbox.x + bbox.width / 2;
        const centerY = bbox.y + bbox.height / 2;
        
        // Create sparkle group
        const sparkleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        sparkleGroup.setAttribute('class', 'stroke-completion-sparkle');
        sparkleGroup.setAttribute('transform', `translate(${centerX}, ${centerY})`);
        
        // Create multiple sparkle stars
        for (let i = 0; i < 6; i++) {
            const sparkle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const angle = (i / 6) * Math.PI * 2;
            const distance = 20 + Math.random() * 15;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            sparkle.setAttribute('d', 'M-3,0 L0,-8 L3,0 L0,8 Z M0,-3 L8,0 L0,3 L-8,0 Z');
            sparkle.setAttribute('fill', '#FFD700');
            sparkle.setAttribute('transform', `translate(${x}, ${y}) scale(0.5)`);
            sparkle.setAttribute('opacity', '0');
            
            // Animate sparkle
            const animateOpacity = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
            animateOpacity.setAttribute('attributeName', 'opacity');
            animateOpacity.setAttribute('values', '0;1;0');
            animateOpacity.setAttribute('dur', '1s');
            animateOpacity.setAttribute('begin', `${i * 0.1}s`);
            
            const animateScale = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
            animateScale.setAttribute('attributeName', 'transform');
            animateScale.setAttribute('type', 'scale');
            animateScale.setAttribute('values', '0.5;1.2;0.3');
            animateScale.setAttribute('dur', '1s');
            animateScale.setAttribute('begin', `${i * 0.1}s`);
            
            sparkle.appendChild(animateOpacity);
            sparkle.appendChild(animateScale);
            sparkleGroup.appendChild(sparkle);
        }
        
        this.svg.appendChild(sparkleGroup);
        
        // Remove sparkles after animation
        setTimeout(() => {
            sparkleGroup.remove();
        }, 2000);
        
        console.log(`Added completion sparkle for stroke ${strokeIndex}`);
    }

    // Complete entire number
    completeNumber() {
        console.log(`Number ${this.currentNumber} completed!`);
        
        // Add completion effect for entire number
        this.addNumberCompletionEffect();
        
        // Trigger game controller completion
        // This will be called by the controller that listens for this
        if (typeof this.onNumberComplete === 'function') {
            this.onNumberComplete();
        }
    }

    addNumberCompletionEffect() {
        // Add a celebration effect for the entire number
        const numberGroup = this.svg.querySelector(`.number-${this.currentNumber}`);
        if (!numberGroup) return;
        
        // Flash effect
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'opacity');
        animate.setAttribute('values', '1;0.5;1;0.5;1');
        animate.setAttribute('dur', '1s');
        
        numberGroup.appendChild(animate);
        
        // Remove animation after completion
        setTimeout(() => {
            animate.remove();
        }, 1000);
    }

    // ================================
    // UTILITY METHODS
    // ================================

    getStrokeCount() {
        return Object.keys(this.strokeElements).length;
    }

    getCurrentStroke() {
        return this.currentStroke;
    }

    isStrokeComplete(strokeIndex) {
        return this.completedStrokes.has(strokeIndex);
    }

    getCurrentNumber() {
        return this.currentNumber;
    }

    // Get current paint completion for a stroke
    getPaintCompletion(strokeIndex) {
        return this.paintProgress[strokeIndex] || 0;
    }

    // Check if stroke is ready for painting
    isStrokeReadyForPainting(strokeIndex) {
        if (strokeIndex === 0) return true;
        return this.completedStrokes.has(strokeIndex - 1);
    }

    // ================================
    // CLEANUP AND RESET
    // ================================

    clearSVG() {
        if (!this.svg) return;
        
        // Remove all children except defs
        const children = Array.from(this.svg.children);
        children.forEach(child => {
            if (child.tagName !== 'defs') {
                child.remove();
            }
        });
        
        // Clear defs of paint masks
        const defs = this.svg.querySelector('defs');
        if (defs) {
            const paintMasks = defs.querySelectorAll('[id^="paint-mask-"]');
            paintMasks.forEach(mask => mask.remove());
        }
    }

    reset() {
        console.log('Resetting renderer');
        
        // Clear SVG
        this.clearSVG();
        
        // Reset state
        this.currentNumber = null;
        this.currentStroke = 0;
        this.completedStrokes.clear();
        this.paintProgress = {};
        this.strokeElements = {};
        
        // Remove any paint groups
        const paintGroups = this.svg.querySelectorAll('[class^="paint-group-"]');
        paintGroups.forEach(group => group.remove());
        
        console.log('Renderer reset complete');
    }

    destroy() {
        if (this.svg) {
            this.svg.remove();
            this.svg = null;
        }
        this.reset();
    }

    // ================================
    // DEBUG METHODS
    // ================================

    showPaintableAreas() {
        if (!CONFIG.DEBUG_MODE) return;
        
        for (let i = 0; i < this.getStrokeCount(); i++) {
            const strokePath = this.getStrokePathElement(i);
            if (strokePath) {
                const bbox = strokePath.getBBox();
                
                const debugRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                debugRect.setAttribute('x', bbox.x - 10);
                debugRect.setAttribute('y', bbox.y - 10);
                debugRect.setAttribute('width', bbox.width + 20);
                debugRect.setAttribute('height', bbox.height + 20);
                debugRect.setAttribute('fill', 'rgba(0, 255, 0, 0.2)');
                debugRect.setAttribute('stroke', 'green');
                debugRect.setAttribute('stroke-width', 2);
                debugRect.setAttribute('class', 'debug-paintable-area');
                
                this.svg.appendChild(debugRect);
            }
        }
        
        console.log('Debug paintable areas shown');
    }

    logState() {
        console.log('Renderer State:', {
            currentNumber: this.currentNumber,
            currentStroke: this.currentStroke,
            completedStrokes: Array.from(this.completedStrokes),
            paintProgress: this.paintProgress,
            strokeCount: this.getStrokeCount()
        });
    }
}

// Make available globally
window.TraceNumberRenderer = TraceNumberRenderer;
