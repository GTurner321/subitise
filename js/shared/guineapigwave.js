class EnhancedGuineaPigWave {
    constructor(imagePath = 'assets/raisin/') {
        this.guineaPigElement = null;
        this.gameArea = document.querySelector('.game-area');
        this.animationId = null;
        this.isAnimating = false;
        
        // Configurable image path for different game folders
        this.imagePath = imagePath;
        
        // Journey types
        this.journeyTypes = [
            'sine_wave',
            'circular_path',
            'u_turn',
            'multiple_crossings'
        ];
        
        // Current journey settings
        this.currentJourney = null;
        this.shouldPause = false;
        this.pausePoint = 0;
        this.pauseState = null; // Track current pause state
        
        // Animation parameters
        this.startTime = null;
        this.pauseStartTime = null;
        this.totalPauseTime = 0;
        this.gameAreaRect = null;
        this.screenWidth = 0;
        this.screenHeight = 0;
        
        // Multi-crossing state
        this.crossingIndex = 0;
        this.crossingSizes = [0.3, 0.2, 0.15, 0.4]; // 30%, 20%, 15%, 40% of screen height
        this.crossingHeights = [0.3, 0.5, 0.6, 0.4]; // Y positions in normalized coordinates
        this.crossingDirections = ['right', 'left', 'right', 'left']; // Movement directions
        
        this.addStyles();
        this.createGuineaPigElement();
    }
    
    addStyles() {
        // Check if styles already exist
        if (document.querySelector('#enhanced-guinea-pig-wave-styles')) return;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'enhanced-guinea-pig-wave-styles';
        styleElement.textContent = `
            .enhanced-guinea-pig-wave {
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
    
    createGuineaPigElement() {
        this.guineaPigElement = document.createElement('img');
        this.guineaPigElement.className = 'enhanced-guinea-pig-wave';
        
        // Initial setup
        this.guineaPigElement.style.cssText = `
            left: -200px;
            top: 0px;
            opacity: 0;
        `;
        
        document.body.appendChild(this.guineaPigElement);
        
        // Update dimensions on window resize
        window.addEventListener('resize', () => {
            this.updateGameAreaRect();
            this.screenWidth = window.innerWidth;
            this.screenHeight = window.innerHeight;
        });
        
        this.updateGameAreaRect();
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
    }
    
    updateGameAreaRect() {
        if (this.gameArea) {
            this.gameAreaRect = this.gameArea.getBoundingClientRect();
        } else {
            // Fallback if no game area
            this.gameAreaRect = {
                left: 0,
                top: 0,
                width: window.innerWidth,
                height: window.innerHeight
            };
        }
    }
    
    updateGuineaPigSize(baseSize = 0.2, sizeMultiplier = 1) {
        if (!this.guineaPigElement || !this.gameAreaRect) return;
        
        const guineaPigHeight = this.gameAreaRect.height * baseSize * sizeMultiplier;
        this.guineaPigElement.style.height = `${guineaPigHeight}px`;
        this.guineaPigElement.style.width = 'auto';
    }
    
    selectRandomJourney() {
        const journeyType = this.journeyTypes[Math.floor(Math.random() * this.journeyTypes.length)];
        this.shouldPause = Math.random() < 0.5; // 50% chance of pausing
        
        this.currentJourney = {
            type: journeyType,
            shouldPause: this.shouldPause
        };
        
        // Set journey-specific parameters
        switch (journeyType) {
            case 'sine_wave':
                this.currentJourney.duration = 3500; // Faster: was 5000
                this.currentJourney.pausePoint = 0.3 + Math.random() * 0.3; // 30-60%
                break;
            case 'circular_path':
                this.currentJourney.duration = 3000; // Faster: was 4000
                this.currentJourney.pausePoint = 0.3; // Fixed at end of first straight section
                break;
            case 'u_turn':
                this.currentJourney.duration = 3000; // Faster: was 4000
                this.currentJourney.pausePoint = 0.3; // Fixed at end of first straight section
                break;
            case 'multiple_crossings':
                this.currentJourney.duration = 6000; // Faster: was 8000
                this.currentJourney.pausePoint = 0.3 + Math.random() * 0.3; // 30-60% of first crossing
                this.crossingIndex = 0;
                break;
        }
        
        console.log('Selected journey:', this.currentJourney);
    }
    
    startAnimation() {
        if (this.isAnimating) {
            this.stopAnimation();
        }
        
        console.log('Starting enhanced guinea pig wave animation');
        
        this.updateGameAreaRect();
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        
        // Select random journey
        this.selectRandomJourney();
        
        this.isAnimating = true;
        this.startTime = performance.now();
        this.pauseStartTime = null;
        this.totalPauseTime = 0;
        
        // Set initial image and size based on journey type
        this.setupInitialState();
        
        this.animate();
    }
    
    setupInitialState() {
        const journey = this.currentJourney;
        
        switch (journey.type) {
            case 'sine_wave':
                this.guineaPigElement.src = `${this.imagePath}guineapig2.png`;
                this.updateGuineaPigSize(0.2);
                break;
            case 'circular_path':
                this.guineaPigElement.src = `${this.imagePath}guineapig2.png`;
                this.updateGuineaPigSize(0.2);
                break;
            case 'u_turn':
                this.guineaPigElement.src = `${this.imagePath}guineapig2.png`;
                this.updateGuineaPigSize(0.2);
                break;
            case 'multiple_crossings':
                this.guineaPigElement.src = `${this.imagePath}guineapig2.png`;
                this.updateGuineaPigSize(this.crossingSizes[0]);
                this.crossingIndex = 0;
                break;
        }
        
        this.guineaPigElement.style.opacity = '1';
    }
    
    animate() {
        if (!this.isAnimating) return;
        
        const currentTime = performance.now();
        const elapsed = currentTime - this.startTime - this.totalPauseTime;
        const journey = this.currentJourney;
        
        if (elapsed >= journey.duration) {
            this.completeAnimation();
            return;
        }
        
        // Handle pausing logic
        const pauseState = this.handlePauseState(currentTime - this.startTime, journey.duration);
        
        // Track pause time to exclude from movement calculations
        if (pauseState.isPaused) {
            if (!this.pauseStartTime) {
                this.pauseStartTime = currentTime;
            }
            // Don't update position during pause, just update image
            this.updateGuineaPigImage(pauseState, null, elapsed, journey.duration);
        } else {
            // Add completed pause time to total
            if (this.pauseStartTime) {
                this.totalPauseTime += currentTime - this.pauseStartTime;
                this.pauseStartTime = null;
            }
            
            // Calculate position based on journey type (excluding pause time)
            const position = this.calculateJourneyPosition(elapsed / journey.duration);
            
            // Update guinea pig image based on state
            this.updateGuineaPigImage(pauseState, position, elapsed, journey.duration);
            
            // Update position
            this.guineaPigElement.style.left = `${position.x - (this.guineaPigElement.offsetWidth / 2)}px`;
            this.guineaPigElement.style.top = `${position.y - (this.guineaPigElement.offsetHeight / 2)}px`;
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    calculateJourneyPosition(progress) {
        const journey = this.currentJourney;
        
        switch (journey.type) {
            case 'sine_wave':
                return this.calculateSineWavePosition(progress);
            case 'circular_path':
                return this.calculateCircularPathPosition(progress);
            case 'u_turn':
                return this.calculateUTurnPosition(progress);
            case 'multiple_crossings':
                return this.calculateMultipleCrossingsPosition(progress);
            default:
                return { x: -200, y: this.screenHeight * 0.75 };
        }
    }
    
    calculateSineWavePosition(progress) {
        // Start off-screen left, end off-screen right
        const startX = -this.guineaPigElement.offsetWidth;
        const endX = this.screenWidth + this.guineaPigElement.offsetWidth;
        const x = startX + (progress * (endX - startX));
        
        // Sine wave that covers the full journey
        const amplitude = 0.05 * this.gameAreaRect.height;
        const frequency = (5 * Math.PI) / this.screenWidth;
        const baseY = this.gameAreaRect.top + (this.gameAreaRect.height * 0.8);
        const sineOffset = amplitude * Math.sin(frequency * x);
        const y = baseY + sineOffset;
        
        return { x, y };
    }
    
    calculateCircularPathPosition(progress) {
        // Using circle equation: (2x-1)² + (y-0.55)² = 0.09
        // Center: (0.5, 0.55), radius: 0.3, but compressed horizontally by factor of 2
        
        if (progress <= 0.3) {
            // Straight line from left to intersection point: y = 0.25, x < 0.5
            const lineProgress = progress / 0.3; // 0 to 1
            const normalizedX = lineProgress * 0.5; // 0 to 0.5
            const normalizedY = 0.25;
            
            // Convert to screen coordinates - start off-screen left
            const x = -this.guineaPigElement.offsetWidth + 
                     (normalizedX * (this.screenWidth + 2 * this.guineaPigElement.offsetWidth));
            const y = this.screenHeight - (normalizedY * this.screenHeight);
            
            return { x, y };
            
        } else if (progress <= 0.9) {
            // Circular path: (2x-1)² + (y-0.55)² = 0.09
            const circleProgress = (progress - 0.3) / 0.6; // 0 to 1 for full circle
            const centerX = 0.5;
            const centerY = 0.55;
            const radiusY = 0.3; // Vertical radius
            const radiusX = 0.15; // Horizontal radius (compressed by factor of 2)
            
            const startAngle = -Math.PI / 2; // Bottom of circle (270°)
            const angle = startAngle + (circleProgress * 2 * Math.PI); // Anticlockwise
            
            const normalizedX = centerX + radiusX * Math.cos(angle);
            const normalizedY = centerY + radiusY * Math.sin(angle);
            
            // Convert to screen coordinates
            const x = -this.guineaPigElement.offsetWidth + 
                     (normalizedX * (this.screenWidth + 2 * this.guineaPigElement.offsetWidth));
            const y = this.screenHeight - (normalizedY * this.screenHeight);
            
            return { x, y };
            
        } else {
            // Straight line from intersection point to right: y = 0.25, x > 0.5
            const lineProgress = (progress - 0.9) / 0.1; // 0 to 1
            const normalizedX = 0.5 + (lineProgress * 0.5); // 0.5 to 1.0
            const normalizedY = 0.25;
            
            // Convert to screen coordinates - end off-screen right
            const x = -this.guineaPigElement.offsetWidth + 
                     (normalizedX * (this.screenWidth + 2 * this.guineaPigElement.offsetWidth));
            const y = this.screenHeight - (normalizedY * this.screenHeight);
            
            return { x, y };
        }
    }
    
    calculateUTurnPosition(progress) {
        // Using circle equation: (2x-1)² + (y-0.55)² = 0.09
        // Center: (0.5, 0.55), radius: 0.3, but compressed horizontally by factor of 2
        
        if (progress <= 0.3) {
            // Straight line from left to intersection point: y = 0.25, x < 0.5
            const lineProgress = progress / 0.3; // 0 to 1
            const normalizedX = lineProgress * 0.5; // 0 to 0.5
            const normalizedY = 0.25;
            
            // Convert to screen coordinates - start off-screen left
            const x = -this.guineaPigElement.offsetWidth + 
                     (normalizedX * (this.screenWidth + 2 * this.guineaPigElement.offsetWidth));
            const y = this.screenHeight - (normalizedY * this.screenHeight);
            
            return { x, y };
            
        } else if (progress <= 0.8) {
            // Half circle: (2x-1)² + (y-0.55)² = 0.09
            const circleProgress = (progress - 0.3) / 0.5; // 0 to 1 for half circle
            const centerX = 0.5;
            const centerY = 0.55;
            const radiusY = 0.3; // Vertical radius
            const radiusX = 0.15; // Horizontal radius (compressed by factor of 2)
            
            const startAngle = -Math.PI / 2; // Bottom of circle (270°)
            const angle = startAngle + (circleProgress * Math.PI); // Half circle anticlockwise
            
            const normalizedX = centerX + radiusX * Math.cos(angle);
            const normalizedY = centerY + radiusY * Math.sin(angle);
            
            // Convert to screen coordinates
            const x = -this.guineaPigElement.offsetWidth + 
                     (normalizedX * (this.screenWidth + 2 * this.guineaPigElement.offsetWidth));
            const y = this.screenHeight - (normalizedY * this.screenHeight);
            
            return { x, y };
            
        } else {
            // Straight line from intersection point to left: y = 0.85, x < 0.5
            const lineProgress = (progress - 0.8) / 0.2; // 0 to 1
            const normalizedX = 0.5 - (lineProgress * 1.5); // 0.5 to -1.0 (off-screen left)
            const normalizedY = 0.85;
            
            // Convert to screen coordinates - end off-screen left
            const x = -this.guineaPigElement.offsetWidth + 
                     (normalizedX * (this.screenWidth + 2 * this.guineaPigElement.offsetWidth));
            const y = this.screenHeight - (normalizedY * this.screenHeight);
            
            return { x, y };
        }
    }
    
    calculateMultipleCrossingsPosition(progress) {
        // Each crossing takes 25% of total time
        const crossingDuration = 0.25;
        const currentCrossingProgress = (progress % crossingDuration) / crossingDuration;
        const crossingIndex = Math.floor(progress / crossingDuration);
        
        if (crossingIndex >= this.crossingSizes.length) {
            // Animation complete - exit off-screen left (since last crossing goes right to left)
            return { 
                x: -this.guineaPigElement.offsetWidth - 50, 
                y: this.screenHeight - (0.3 * this.screenHeight) 
            };
        }
        
        // Update size if crossing changed
        if (crossingIndex !== this.crossingIndex) {
            this.crossingIndex = crossingIndex;
            this.updateGuineaPigSize(this.crossingSizes[crossingIndex]);
        }
        
        const direction = this.crossingDirections[crossingIndex];
        const normalizedY = this.crossingHeights[crossingIndex];
        
        let normalizedX;
        if (direction === 'right') {
            // Left to right: start off-screen left, end off-screen right
            normalizedX = -0.1 + (currentCrossingProgress * 1.2); // -0.1 to 1.1
        } else {
            // Right to left: start off-screen right, end off-screen left
            normalizedX = 1.1 - (currentCrossingProgress * 1.2); // 1.1 to -0.1
        }
        
        // Convert to screen coordinates
        const x = normalizedX * this.screenWidth;
        const y = this.screenHeight - (normalizedY * this.screenHeight);
        
        return { x, y };
    }
    
    handlePauseState(elapsed, totalDuration) {
        const journey = this.currentJourney;
        
        if (!journey.shouldPause) {
            return { isPaused: false, showFrontFacing: false };
        }
        
        // Calculate pause timing based on actual milliseconds
        let pauseStartTime;
        
        if (journey.type === 'multiple_crossings') {
            // For multiple crossings, only pause during first crossing
            const firstCrossingDuration = totalDuration * 0.25; // First 25% of total time
            const firstCrossingElapsed = Math.min(elapsed, firstCrossingDuration);
            
            if (elapsed >= firstCrossingDuration) {
                // Past first crossing, no more pausing
                this.pauseState = null;
                return { isPaused: false, showFrontFacing: false };
            }
            
            pauseStartTime = journey.pausePoint * firstCrossingDuration; // Pause point within first crossing
            
            if (firstCrossingElapsed >= pauseStartTime && firstCrossingElapsed <= pauseStartTime + 3000) {
                const pauseElapsed = firstCrossingElapsed - pauseStartTime;
                
                if (pauseElapsed <= 1000) {
                    // First 1 second: regular pause
                    return { isPaused: true, showFrontFacing: false };
                } else {
                    // Next 2 seconds: front-facing
                    return { isPaused: true, showFrontFacing: true };
                }
            }
        } else {
            // For other journey types
            pauseStartTime = journey.pausePoint * totalDuration;
            
            if (elapsed >= pauseStartTime && elapsed <= pauseStartTime + 3000) {
                const pauseElapsed = elapsed - pauseStartTime;
                
                if (pauseElapsed <= 1000) {
                    // First 1 second: regular pause
                    return { isPaused: true, showFrontFacing: false };
                } else {
                    // Next 2 seconds: front-facing
                    return { isPaused: true, showFrontFacing: true };
                }
            }
        }
        
        return { isPaused: false, showFrontFacing: false };
    }
    
    updateGuineaPigImage(pauseState, position, elapsed, totalDuration) {
        if (pauseState.showFrontFacing) {
            this.guineaPigElement.src = `${this.imagePath}guineapig3.png`;
            this.updateGuineaPigSize(0.3); // Larger when front-facing
            return;
        }
        
        if (pauseState.isPaused) {
            return; // Keep current image during regular pause
        }
        
        const journey = this.currentJourney;
        
        // Determine image based on journey type and position
        switch (journey.type) {
            case 'u_turn':
                // Change to left-facing when at rightmost point (0.65, 0.55)
                // In progress terms: 30% + (25% of half-circle) = 42.5% 
                const progress = elapsed / totalDuration;
                const rightmostProgress = 0.3 + (0.5 * 0.25); // 0.425
                if (progress >= rightmostProgress) {
                    this.guineaPigElement.src = `${this.imagePath}guineapig1.png`;
                } else {
                    this.guineaPigElement.src = `${this.imagePath}guineapig2.png`;
                }
                this.updateGuineaPigSize(0.2);
                break;
            case 'multiple_crossings':
                // Update image based on crossing direction
                const direction = this.crossingDirections[this.crossingIndex];
                if (direction === 'left') {
                    this.guineaPigElement.src = `${this.imagePath}guineapig1.png`;
                } else {
                    this.guineaPigElement.src = `${this.imagePath}guineapig2.png`;
                }
                this.updateGuineaPigSize(this.crossingSizes[this.crossingIndex]);
                break;
            default:
                this.guineaPigElement.src = `${this.imagePath}guineapig2.png`;
                this.updateGuineaPigSize(0.2);
                break;
        }
    }
    
    completeAnimation() {
        console.log('Enhanced guinea pig wave animation complete');
        
        this.isAnimating = false;
        this.guineaPigElement.style.opacity = '0';
        
        // Clean up
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.startTime = null;
        this.pauseStartTime = null;
        this.totalPauseTime = 0;
        this.currentJourney = null;
        this.crossingIndex = 0;
    }
    
    stopAnimation() {
        if (!this.isAnimating) return;
        
        console.log('Stopping enhanced guinea pig wave animation');
        
        this.isAnimating = false;
        this.guineaPigElement.style.opacity = '0';
        
        // Clean up
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.startTime = null;
        this.pauseStartTime = null;
        this.totalPauseTime = 0;
        this.currentJourney = null;
        this.crossingIndex = 0;
    }
    
    isCurrentlyAnimating() {
        return this.isAnimating;
    }
    
    destroy() {
        this.stopAnimation();
        
        if (this.guineaPigElement && this.guineaPigElement.parentNode) {
            this.guineaPigElement.parentNode.removeChild(this.guineaPigElement);
        }
        
        // Remove styles when destroying
        const styleElement = document.querySelector('#enhanced-guinea-pig-wave-styles');
        if (styleElement && styleElement.parentNode) {
            styleElement.parentNode.removeChild(styleElement);
        }
        
        this.guineaPigElement = null;
        this.gameArea = null;
        this.gameAreaRect = null;
    }
}
