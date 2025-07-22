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
        
        // Animation parameters
        this.startTime = null;
        this.gameAreaRect = null;
        this.screenWidth = 0;
        this.screenHeight = 0;
        
        // Multi-crossing state
        this.crossingIndex = 0;
        this.crossingSizes = [1, 0.7, 0.55, 1]; // Normal, 30% smaller, 15% smaller again, normal
        this.crossingHeights = [0.75, 0.55, 0.45, 0.40]; // Y positions as percentages
        this.crossingDirections = ['right', 'left', 'right', 'right']; // Movement directions
        
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
                this.currentJourney.duration = 5000;
                this.currentJourney.pausePoint = 0.3 + Math.random() * 0.3; // 30-60%
                break;
            case 'circular_path':
                this.currentJourney.duration = 4000;
                this.currentJourney.pausePoint = 0.2 + Math.random() * 0.2; // 20-40% (before circle starts)
                break;
            case 'u_turn':
                this.currentJourney.duration = 4000;
                this.currentJourney.pausePoint = 0.2 + Math.random() * 0.2; // 20-40% (before turn starts)
                break;
            case 'multiple_crossings':
                this.currentJourney.duration = 8000; // Longer for multiple crossings
                this.currentJourney.pausePoint = 0.3 + Math.random() * 0.3; // Only applies to first crossing
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
                this.updateGuineaPigSize(0.2, this.crossingSizes[0]);
                this.crossingIndex = 0;
                break;
        }
        
        this.guineaPigElement.style.opacity = '1';
    }
    
    animate() {
        if (!this.isAnimating) return;
        
        const currentTime = performance.now();
        const elapsed = currentTime - this.startTime;
        const journey = this.currentJourney;
        
        if (elapsed >= journey.duration) {
            this.completeAnimation();
            return;
        }
        
        // Calculate position based on journey type
        const position = this.calculateJourneyPosition(elapsed / journey.duration);
        
        // Handle pausing logic
        const pauseState = this.handlePauseState(elapsed / journey.duration);
        
        // Update guinea pig image based on state
        this.updateGuineaPigImage(pauseState, position);
        
        // Update position
        this.guineaPigElement.style.left = `${position.x - (this.guineaPigElement.offsetWidth / 2)}px`;
        this.guineaPigElement.style.top = `${position.y - (this.guineaPigElement.offsetHeight / 2)}px`;
        
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
        const totalDistance = this.screenWidth + (2 * this.guineaPigElement.offsetWidth);
        const straightDistance = totalDistance * 0.3; // 30% straight movement
        const circleDistance = totalDistance * 0.7; // 70% circular movement
        
        if (progress <= 0.3) {
            // Straight movement from left
            const straightProgress = progress / 0.3;
            const x = -this.guineaPigElement.offsetWidth + (straightProgress * straightDistance);
            const y = this.screenHeight * 0.75;
            return { x, y };
        } else {
            // Circular movement
            const circleProgress = (progress - 0.3) / 0.7;
            const centerX = straightDistance;
            const centerY = this.screenHeight * 0.75;
            const radius = this.gameAreaRect.height * 0.25;
            
            // Full circle: start from bottom, go clockwise
            const angle = circleProgress * 2 * Math.PI - Math.PI / 2; // Start from bottom
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            return { x, y };
        }
    }
    
    calculateUTurnPosition(progress) {
        const halfScreenWidth = this.screenWidth * 0.5;
        
        if (progress <= 0.5) {
            // Straight movement to middle
            const straightProgress = progress / 0.5;
            const x = -this.guineaPigElement.offsetWidth + (straightProgress * halfScreenWidth);
            const y = this.screenHeight * 0.75;
            return { x, y };
        } else {
            // Semi-circular turn back
            const turnProgress = (progress - 0.5) / 0.5;
            const centerX = halfScreenWidth;
            const centerY = this.screenHeight * 0.75;
            const radius = this.gameAreaRect.height * 0.2;
            
            // Semi-circle from bottom-right to bottom-left
            const angle = turnProgress * Math.PI; // 180 degrees
            const x = centerX + radius * Math.cos(angle);
            const y = centerY - radius * Math.sin(angle);
            
            return { x, y };
        }
    }
    
    calculateMultipleCrossingsPosition(progress) {
        const crossingDuration = 0.25; // Each crossing takes 25% of total time
        const currentCrossingProgress = (progress % crossingDuration) / crossingDuration;
        const crossingIndex = Math.floor(progress / crossingDuration);
        
        if (crossingIndex >= this.crossingSizes.length) {
            // Animation complete
            return { x: this.screenWidth + 200, y: this.screenHeight * 0.4 };
        }
        
        // Update size if crossing changed
        if (crossingIndex !== this.crossingIndex) {
            this.crossingIndex = crossingIndex;
            this.updateGuineaPigSize(0.2, this.crossingSizes[crossingIndex]);
        }
        
        const direction = this.crossingDirections[crossingIndex];
        const y = this.screenHeight * this.crossingHeights[crossingIndex];
        
        let x;
        if (direction === 'right') {
            x = -this.guineaPigElement.offsetWidth + 
                (currentCrossingProgress * (this.screenWidth + 2 * this.guineaPigElement.offsetWidth));
        } else {
            x = (this.screenWidth + this.guineaPigElement.offsetWidth) - 
                (currentCrossingProgress * (this.screenWidth + 2 * this.guineaPigElement.offsetWidth));
        }
        
        return { x, y };
    }
    
    handlePauseState(progress) {
        const journey = this.currentJourney;
        
        if (!journey.shouldPause) {
            return { isPaused: false, showFrontFacing: false };
        }
        
        const pauseStart = journey.pausePoint;
        const pauseEnd = pauseStart + 0.1; // Pause duration in progress terms (1s pause + 2s front-facing)
        
        if (progress >= pauseStart && progress <= pauseEnd) {
            const pauseProgress = (progress - pauseStart) / (pauseEnd - pauseStart);
            
            if (pauseProgress <= 0.33) {
                // First 1/3: regular pause (1 second)
                return { isPaused: true, showFrontFacing: false };
            } else {
                // Remaining 2/3: front-facing (2 seconds)
                return { isPaused: true, showFrontFacing: true };
            }
        }
        
        return { isPaused: false, showFrontFacing: false };
    }
    
    updateGuineaPigImage(pauseState, position) {
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
                // Change to left-facing when turning around
                if (position.x <= this.screenWidth * 0.5 && position.y < this.screenHeight * 0.75) {
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
                this.updateGuineaPigSize(0.2, this.crossingSizes[this.crossingIndex]);
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
