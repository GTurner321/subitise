class EnhancedGuineaPigWave {
    constructor(imagePath = 'assets/raisin/') {
        this.guineaPigs = [];
        this.gameArea = document.querySelector('.game-area');
        this.animationId = null;
        this.isAnimating = false;
        
        // Configurable image path for different game folders
        this.imagePath = imagePath;
        
        // Animation scenarios
        this.scenarios = [
            'single_guinea_pig',
            'single_guinea_pig_with_pause',
            'two_guinea_pigs',
            'two_guinea_pigs_with_pause',
            'three_guinea_pigs_with_reversal'
        ];
        
        // Timing parameters (1s move + 1s pause + 2s forward + 1s move = 5s total)
        this.moveDuration = 1000; // Time to reach pause point
        this.pauseDuration = 1000; // Regular pause duration
        this.frontFacingDuration = 2000; // Forward-facing duration
        this.totalDuration = 5000; // Total animation time
        
        this.startTime = null;
        this.screenWidth = 0;
        this.screenHeight = 0;
        this.currentScenario = null;
        
        this.addStyles();
        this.updateScreenDimensions();
        
        // Update dimensions on window resize
        window.addEventListener('resize', () => {
            this.updateScreenDimensions();
        });
    }
    
    addStyles() {
        // Check if styles already exist
        if (document.querySelector('#enhanced-guinea-pig-wave-middle-styles')) return;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'enhanced-guinea-pig-wave-middle-styles';
        styleElement.textContent = `
            .enhanced-guinea-pig-wave-middle {
                position: fixed !important;
                opacity: 1 !important;
                z-index: 50 !important;
                pointer-events: none !important;
                image-rendering: crisp-edges !important;
                transition: none !important;
            }
        `;
        
        document.head.appendChild(styleElement);
    }
    
    updateScreenDimensions() {
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
    }
    
    createGuineaPigElement(yPosition, size, shouldPause = false, pausePoint = 0.5, shouldReverse = false) {
        const element = document.createElement('img');
        element.className = 'enhanced-guinea-pig-wave-middle';
        element.src = `${this.imagePath}guineapig2.png`; // Start facing right
        
        // Initial positioning
        element.style.cssText = `
            left: -200px;
            top: ${yPosition}px;
            opacity: 1;
        `;
        
        // Set size
        const height = this.screenHeight * size;
        element.style.height = `${height}px`;
        element.style.width = 'auto';
        
        document.body.appendChild(element);
        
        return {
            element: element,
            yPosition: yPosition,
            size: size,
            shouldPause: shouldPause,
            pausePoint: pausePoint,
            shouldReverse: shouldReverse,
            isReversing: false,
            pauseState: 'none' // 'none', 'pausing', 'front_facing'
        };
    }
    
    selectRandomScenario() {
        const scenarioIndex = Math.floor(Math.random() * this.scenarios.length);
        this.currentScenario = this.scenarios[scenarioIndex];
        console.log('Selected scenario:', this.currentScenario);
        
        // Clear existing guinea pigs
        this.clearGuineaPigs();
        
        // Create guinea pigs based on scenario
        switch (this.currentScenario) {
            case 'single_guinea_pig':
                this.guineaPigs.push(
                    this.createGuineaPigElement(this.screenHeight * 0.75, 0.2)
                );
                break;
                
            case 'single_guinea_pig_with_pause':
                const pausePoint = 0.3 + Math.random() * 0.3; // 30-60%
                this.guineaPigs.push(
                    this.createGuineaPigElement(this.screenHeight * 0.75, 0.2, true, pausePoint)
                );
                break;
                
            case 'two_guinea_pigs':
                this.guineaPigs.push(
                    this.createGuineaPigElement(this.screenHeight * 0.6, 0.15),
                    this.createGuineaPigElement(this.screenHeight * 0.8, 0.15)
                );
                break;
                
            case 'two_guinea_pigs_with_pause':
                const pausingIndex = Math.floor(Math.random() * 2); // 0 or 1
                const pausePoint2 = 0.3 + Math.random() * 0.3; // 30-60%
                
                this.guineaPigs.push(
                    this.createGuineaPigElement(this.screenHeight * 0.6, 0.15, pausingIndex === 0, pausePoint2),
                    this.createGuineaPigElement(this.screenHeight * 0.8, 0.15, pausingIndex === 1, pausePoint2)
                );
                break;
                
            case 'three_guinea_pigs_with_reversal':
                this.guineaPigs.push(
                    this.createGuineaPigElement(this.screenHeight * 0.4, 0.15, true, 0.5, true), // Top one reverses
                    this.createGuineaPigElement(this.screenHeight * 0.6, 0.15),
                    this.createGuineaPigElement(this.screenHeight * 0.8, 0.15)
                );
                break;
        }
    }
    
    startAnimation() {
        if (this.isAnimating) {
            this.stopAnimation();
        }
        
        console.log('Starting enhanced guinea pig wave animation (middle version)');
        
        this.updateScreenDimensions();
        this.selectRandomScenario();
        
        this.isAnimating = true;
        this.startTime = performance.now();
        
        this.animate();
    }
    
    animate() {
        if (!this.isAnimating) return;
        
        const currentTime = performance.now();
        const elapsed = currentTime - this.startTime;
        
        if (elapsed >= this.totalDuration) {
            this.completeAnimation();
            return;
        }
        
        // Update each guinea pig
        this.guineaPigs.forEach(guineaPig => {
            this.updateGuineaPig(guineaPig, elapsed);
        });
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    updateGuineaPig(guineaPig, elapsed) {
        if (!guineaPig.shouldPause) {
            // Simple left-to-right movement
            this.updateSimpleMovement(guineaPig, elapsed);
        } else if (!guineaPig.shouldReverse) {
            // Movement with pause (scenarios 2 and 4)
            this.updateMovementWithPause(guineaPig, elapsed);
        } else {
            // Movement with reversal (scenario 5)
            this.updateMovementWithReversal(guineaPig, elapsed);
        }
    }
    
    updateSimpleMovement(guineaPig, elapsed) {
        const progress = elapsed / this.totalDuration;
        const position = this.calculatePosition(progress, guineaPig.yPosition);
        
        guineaPig.element.style.left = `${position.x - (guineaPig.element.offsetWidth / 2)}px`;
        guineaPig.element.style.top = `${position.y - (guineaPig.element.offsetHeight / 2)}px`;
    }
    
    updateMovementWithPause(guineaPig, elapsed) {
        const pauseStartTime = guineaPig.pausePoint * this.totalDuration;
        const pauseEndTime = pauseStartTime + this.pauseDuration + this.frontFacingDuration;
        
        if (elapsed < pauseStartTime) {
            // Moving to pause point
            const progress = (elapsed / pauseStartTime) * guineaPig.pausePoint;
            const position = this.calculatePosition(progress, guineaPig.yPosition);
            
            guineaPig.element.src = `${this.imagePath}guineapig2.png`;
            guineaPig.element.style.height = `${this.screenHeight * guineaPig.size}px`;
            guineaPig.pauseState = 'none';
            
            guineaPig.element.style.left = `${position.x - (guineaPig.element.offsetWidth / 2)}px`;
            guineaPig.element.style.top = `${position.y - (guineaPig.element.offsetHeight / 2)}px`;
            
        } else if (elapsed < pauseStartTime + this.pauseDuration) {
            // Regular pause (1 second)
            if (guineaPig.pauseState !== 'pausing') {
                guineaPig.element.src = `${this.imagePath}guineapig2.png`;
                guineaPig.element.style.height = `${this.screenHeight * guineaPig.size}px`;
                guineaPig.pauseState = 'pausing';
            }
            // Stay at pause position
            
        } else if (elapsed < pauseEndTime) {
            // Front-facing pause (2 seconds)
            if (guineaPig.pauseState !== 'front_facing') {
                guineaPig.element.src = `${this.imagePath}guineapig3.png`;
                guineaPig.element.style.height = `${this.screenHeight * 0.3}px`; // Larger when front-facing
                guineaPig.pauseState = 'front_facing';
            }
            // Stay at pause position
            
        } else {
            // Resume movement
            const remainingTime = this.totalDuration - pauseEndTime;
            const resumeElapsed = elapsed - pauseEndTime;
            const resumeProgress = guineaPig.pausePoint + ((resumeElapsed / remainingTime) * (1 - guineaPig.pausePoint));
            const position = this.calculatePosition(resumeProgress, guineaPig.yPosition);
            
            if (guineaPig.pauseState !== 'none') {
                guineaPig.element.src = `${this.imagePath}guineapig2.png`;
                guineaPig.element.style.height = `${this.screenHeight * guineaPig.size}px`;
                guineaPig.pauseState = 'none';
            }
            
            guineaPig.element.style.left = `${position.x - (guineaPig.element.offsetWidth / 2)}px`;
            guineaPig.element.style.top = `${position.y - (guineaPig.element.offsetHeight / 2)}px`;
        }
    }
    
    updateMovementWithReversal(guineaPig, elapsed) {
        const pauseStartTime = guineaPig.pausePoint * this.totalDuration;
        const pauseEndTime = pauseStartTime + this.pauseDuration + this.frontFacingDuration;
        
        if (elapsed < pauseStartTime) {
            // Moving to pause point (50% of the way)
            const progress = (elapsed / pauseStartTime) * guineaPig.pausePoint;
            const position = this.calculatePosition(progress, guineaPig.yPosition);
            
            guineaPig.element.src = `${this.imagePath}guineapig2.png`;
            guineaPig.element.style.height = `${this.screenHeight * guineaPig.size}px`;
            guineaPig.pauseState = 'none';
            guineaPig.isReversing = false;
            
            guineaPig.element.style.left = `${position.x - (guineaPig.element.offsetWidth / 2)}px`;
            guineaPig.element.style.top = `${position.y - (guineaPig.element.offsetHeight / 2)}px`;
            
        } else if (elapsed < pauseStartTime + this.pauseDuration) {
            // Regular pause (1 second)
            if (guineaPig.pauseState !== 'pausing') {
                guineaPig.element.src = `${this.imagePath}guineapig2.png`;
                guineaPig.element.style.height = `${this.screenHeight * guineaPig.size}px`;
                guineaPig.pauseState = 'pausing';
            }
            // Stay at pause position
            
        } else if (elapsed < pauseEndTime) {
            // Front-facing pause (2 seconds)
            if (guineaPig.pauseState !== 'front_facing') {
                guineaPig.element.src = `${this.imagePath}guineapig3.png`;
                guineaPig.element.style.height = `${this.screenHeight * 0.3}px`; // Larger when front-facing
                guineaPig.pauseState = 'front_facing';
            }
            // Stay at pause position
            
        } else {
            // Reverse movement (right to left)
            const remainingTime = this.totalDuration - pauseEndTime;
            const reverseElapsed = elapsed - pauseEndTime;
            const reverseProgress = guineaPig.pausePoint - ((reverseElapsed / remainingTime) * guineaPig.pausePoint);
            const position = this.calculatePosition(Math.max(0, reverseProgress), guineaPig.yPosition);
            
            if (!guineaPig.isReversing) {
                guineaPig.element.src = `${this.imagePath}guineapig1.png`; // Face left for reverse
                guineaPig.element.style.height = `${this.screenHeight * guineaPig.size}px`;
                guineaPig.pauseState = 'none';
                guineaPig.isReversing = true;
            }
            
            guineaPig.element.style.left = `${position.x - (guineaPig.element.offsetWidth / 2)}px`;
            guineaPig.element.style.top = `${position.y - (guineaPig.element.offsetHeight / 2)}px`;
        }
    }
    
    calculatePosition(progress, yPosition) {
        // X position: from off-screen left to off-screen right
        const startX = -200; // Start off-screen left
        const endX = this.screenWidth + 200; // End off-screen right
        const x = startX + (progress * (endX - startX));
        
        return { x, y: yPosition };
    }
    
    completeAnimation() {
        console.log('Enhanced guinea pig wave animation complete (middle version)');
        
        this.isAnimating = false;
        
        // Hide all guinea pigs
        this.guineaPigs.forEach(guineaPig => {
            guineaPig.element.style.opacity = '0';
        });
        
        // Clean up
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.startTime = null;
    }
    
    stopAnimation() {
        if (!this.isAnimating) return;
        
        console.log('Stopping enhanced guinea pig wave animation (middle version)');
        
        this.isAnimating = false;
        
        // Hide all guinea pigs
        this.guineaPigs.forEach(guineaPig => {
            guineaPig.element.style.opacity = '0';
        });
        
        // Clean up
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.startTime = null;
    }
    
    clearGuineaPigs() {
        this.guineaPigs.forEach(guineaPig => {
            if (guineaPig.element && guineaPig.element.parentNode) {
                guineaPig.element.parentNode.removeChild(guineaPig.element);
            }
        });
        this.guineaPigs = [];
    }
    
    isCurrentlyAnimating() {
        return this.isAnimating;
    }
    
    destroy() {
        this.stopAnimation();
        this.clearGuineaPigs();
        
        // Remove styles when destroying
        const styleElement = document.querySelector('#enhanced-guinea-pig-wave-middle-styles');
        if (styleElement && styleElement.parentNode) {
            styleElement.parentNode.removeChild(styleElement);
        }
        
        this.gameArea = null;
    }
}
