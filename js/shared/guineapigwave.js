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
    
    updateGuineaPigSize(guineaPig, state) {
        let height;
        
        if (state === 'static') {
            // Static guinea pig (guineapig3) = 30% of screen height
            height = this.screenHeight * 0.3;
        } else {
            // Moving guinea pig (guineapig1/2) = original size
            height = this.screenHeight * guineaPig.size;
        }
        
        guineaPig.element.style.height = `${height}px`;
        guineaPig.element.style.width = 'auto';
    }
    
    updateSimpleMovement(guineaPig, elapsed) {
        const progress = elapsed / this.totalDuration;
        const position = this.calculatePosition(progress, guineaPig.yPosition);
        
        guineaPig.element.style.left = `${position.x - (guineaPig.element.offsetWidth / 2)}px`;
        guineaPig.element.style.top = `${position.y - (guineaPig.element.offsetHeight / 2)}px`;
    }
    
    updateMovementWithPause(guineaPig, elapsed) {
        // Using the working logic from your simple file
        // Total duration breakdown: 1s to pause + 1s pause + 2s front-facing + 1s to exit = 5s
        const firstHalfDuration = guineaPig.pausePoint * this.totalDuration; // Time to reach pause point
        const pauseDuration = this.pauseDuration; // 1s pause
        const frontFacingDuration = this.frontFacingDuration; // 2s front-facing
        
        let progress = 0;
        
        if (elapsed <= firstHalfDuration) {
            // First half: moving to pause point
            progress = (elapsed / firstHalfDuration) * guineaPig.pausePoint;
            guineaPig.element.src = `${this.imagePath}guineapig2.png`;
            this.updateGuineaPigSize(guineaPig, 'moving');
            
        } else if (elapsed <= firstHalfDuration + pauseDuration) {
            // Regular pause: stay at pause point with same image and size
            progress = guineaPig.pausePoint;
            guineaPig.element.src = `${this.imagePath}guineapig2.png`;
            this.updateGuineaPigSize(guineaPig, 'moving');
            
        } else if (elapsed <= firstHalfDuration + pauseDuration + frontFacingDuration) {
            // Front-facing pause: stay at pause point but change image and size
            progress = guineaPig.pausePoint;
            guineaPig.element.src = `${this.imagePath}guineapig3.png`;
            this.updateGuineaPigSize(guineaPig, 'static');
            
        } else {
            // Second half: moving from pause point to exit
            const secondHalfElapsed = elapsed - firstHalfDuration - pauseDuration - frontFacingDuration;
            const secondHalfDuration = this.totalDuration - firstHalfDuration - pauseDuration - frontFacingDuration;
            progress = guineaPig.pausePoint + ((secondHalfElapsed / secondHalfDuration) * (1 - guineaPig.pausePoint));
            guineaPig.element.src = `${this.imagePath}guineapig2.png`;
            this.updateGuineaPigSize(guineaPig, 'moving');
        }
        
        // Update position
        const position = this.calculatePosition(progress, guineaPig.yPosition);
        guineaPig.element.style.left = `${position.x - (guineaPig.element.offsetWidth / 2)}px`;
        guineaPig.element.style.top = `${position.y - (guineaPig.element.offsetHeight / 2)}px`;
    }
    
    updateMovementWithReversal(guineaPig, elapsed) {
        // Similar logic but for reversal scenario
        const firstHalfDuration = guineaPig.pausePoint * this.totalDuration; // Time to reach pause point (50%)
        const pauseDuration = this.pauseDuration; // 1s pause
        const frontFacingDuration = this.frontFacingDuration; // 2s front-facing
        
        let progress = 0;
        
        if (elapsed <= firstHalfDuration) {
            // First half: moving to pause point (50% of the way)
            progress = (elapsed / firstHalfDuration) * guineaPig.pausePoint;
            guineaPig.element.src = `${this.imagePath}guineapig2.png`;
            this.updateGuineaPigSize(guineaPig, 'moving');
            guineaPig.isReversing = false;
            
        } else if (elapsed <= firstHalfDuration + pauseDuration) {
            // Regular pause: stay at pause point with same image and size
            progress = guineaPig.pausePoint;
            guineaPig.element.src = `${this.imagePath}guineapig2.png`;
            this.updateGuineaPigSize(guineaPig, 'moving');
            
        } else if (elapsed <= firstHalfDuration + pauseDuration + frontFacingDuration) {
            // Front-facing pause: stay at pause point but change image and size
            progress = guineaPig.pausePoint;
            guineaPig.element.src = `${this.imagePath}guineapig3.png`;
            this.updateGuineaPigSize(guineaPig, 'static');
            
        } else {
            // Reverse movement: moving from pause point back to start
            const secondHalfElapsed = elapsed - firstHalfDuration - pauseDuration - frontFacingDuration;
            const secondHalfDuration = this.totalDuration - firstHalfDuration - pauseDuration - frontFacingDuration;
            progress = guineaPig.pausePoint - ((secondHalfElapsed / secondHalfDuration) * guineaPig.pausePoint);
            
            // Switch to left-facing image for reverse movement
            if (!guineaPig.isReversing) {
                guineaPig.isReversing = true;
            }
            guineaPig.element.src = `${this.imagePath}guineapig1.png`;
            this.updateGuineaPigSize(guineaPig, 'moving');
        }
        
        // Update position
        const position = this.calculatePosition(Math.max(0, progress), guineaPig.yPosition);
        guineaPig.element.style.left = `${position.x - (guineaPig.element.offsetWidth / 2)}px`;
        guineaPig.element.style.top = `${position.y - (guineaPig.element.offsetHeight / 2)}px`;
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
