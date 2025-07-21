class GuineaPigWave {
    constructor(imagePath = 'assets/raisin/') {
        this.guineaPigElement = null;
        this.gameArea = document.querySelector('.game-area');
        this.animationId = null;
        this.isAnimating = false;
        
        // Configurable image path for different game folders
        this.imagePath = imagePath;
        
        // Animation parameters - 50% faster movement, same pause
        this.totalDuration = 5000; // Still 5s total: 1s + 2s + 1s = 4s
        this.firstHalfDuration = 1000; // 1 second to middle (was 1.5s)
        this.pauseDuration = 2000; // 2 second pause (unchanged)
        this.secondHalfDuration = 1000; // 1 second to exit (was 1.5s)
        
        this.startTime = null;
        this.gameAreaRect = null;
        this.screenWidth = 0;
        
        this.addStyles();
        this.createGuineaPigElement();
    }
    
    addStyles() {
        // Check if styles already exist
        if (document.querySelector('#guinea-pig-wave-styles')) return;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'guinea-pig-wave-styles';
        styleElement.textContent = `
            .guinea-pig-wave {
                position: fixed !important; /* Fixed for full screen movement */
                opacity: 1 !important; /* Always visible, no fade transitions */
                z-index: 50 !important;
                pointer-events: none !important;
                image-rendering: crisp-edges !important; /* Better rendering for pixel art */
                /* Height and width set dynamically by JavaScript based on state */
            }
        `;
        
        document.head.appendChild(styleElement);
    }
    
    createGuineaPigElement() {
        this.guineaPigElement = document.createElement('img');
        this.guineaPigElement.className = 'guinea-pig-wave';
        this.guineaPigElement.src = `${this.imagePath}guineapig2.png`; // Start with facing right
        
        // Initial inline styles for positioning and basic setup
        this.guineaPigElement.style.cssText = `
            left: -200px;
            top: 0px;
        `;
        
        document.body.appendChild(this.guineaPigElement);
        
        // Set initial size
        this.updateGuineaPigSize('moving');
        
        // Update size and screen width on window resize
        window.addEventListener('resize', () => {
            // Keep current state for resize
            const currentSrc = this.guineaPigElement.src;
            const isStatic = currentSrc.includes('guineapig3.png');
            this.updateGuineaPigSize(isStatic ? 'static' : 'moving');
            this.updateGameAreaRect();
            this.screenWidth = window.innerWidth;
        });
        
        this.updateGameAreaRect();
        this.screenWidth = window.innerWidth;
    }
    
    updateGuineaPigSize(state) {
        if (!this.guineaPigElement || !this.gameArea) return;
        
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        let guineaPigHeight;
        
        if (state === 'static') {
            // Static guinea pig (guineapig3) = 30% of game area height
            guineaPigHeight = gameAreaRect.height * 0.3;
        } else {
            // Moving guinea pig (guineapig2) = 20% of game area height
            guineaPigHeight = gameAreaRect.height * 0.2;
        }
        
        this.guineaPigElement.style.height = `${guineaPigHeight}px`;
        this.guineaPigElement.style.width = 'auto';
    }
    
    updateGameAreaRect() {
        if (this.gameArea) {
            this.gameAreaRect = this.gameArea.getBoundingClientRect();
        }
    }
    
    calculatePosition(progress) {
        if (!this.gameAreaRect) return { x: -200, y: 0 };
        
        // X position: from off-screen left to off-screen right
        const startX = -this.guineaPigElement.offsetWidth; // Start completely off-screen left
        const endX = this.screenWidth + this.guineaPigElement.offsetWidth; // End completely off-screen right
        const x = startX + (progress * (endX - startX));
        
        // Y position: sine wave function within game area bounds
        // y = 0.05 * gameAreaHeight * sin((5*π/gameAreaWidth) * relativeX)
        // Start at 80% down the game area
        const gameAreaProgress = Math.max(0, Math.min(1, (x - this.gameAreaRect.left) / this.gameAreaRect.width));
        const relativeX = gameAreaProgress * this.gameAreaRect.width;
        const baseY = this.gameAreaRect.top + (this.gameAreaRect.height * 0.8);
        const amplitude = 0.05 * this.gameAreaRect.height;
        const frequency = (5 * Math.PI) / this.gameAreaRect.width;
        
        const sineOffset = amplitude * Math.sin(frequency * relativeX);
        const y = baseY + sineOffset;
        
        return { x, y };
    }
    
    startAnimation() {
        if (this.isAnimating) {
            this.stopAnimation(); // Stop any existing animation
        }
        
        console.log('Starting guinea pig wave animation');
        
        this.updateGameAreaRect();
        this.screenWidth = window.innerWidth;
        this.isAnimating = true;
        this.startTime = performance.now();
        
        // Start with guineapig2 (facing right) at moving size (20%)
        this.guineaPigElement.src = `${this.imagePath}guineapig2.png`;
        this.updateGuineaPigSize('moving');
        this.guineaPigElement.style.opacity = '1';
        
        // Start the animation loop
        this.animate();
    }
    
    animate() {
        if (!this.isAnimating) return;
        
        const currentTime = performance.now();
        const elapsed = currentTime - this.startTime;
        
        if (elapsed >= this.totalDuration) {
            // Animation complete
            this.completeAnimation();
            return;
        }
        
        let progress = 0;
        
        if (elapsed <= this.firstHalfDuration) {
            // First half: moving to middle (20% of game area height)
            progress = elapsed / this.firstHalfDuration * 0.5; // 0 to 0.5
            this.guineaPigElement.src = `${this.imagePath}guineapig2.png`;
            this.updateGuineaPigSize('moving');
            
        } else if (elapsed <= this.firstHalfDuration + this.pauseDuration) {
            // Pause in middle: facing straight (30% of game area height)
            progress = 0.5; // Stay at middle
            this.guineaPigElement.src = `${this.imagePath}guineapig3.png`;
            this.updateGuineaPigSize('static');
            
        } else {
            // Second half: moving to right (20% of game area height)
            const secondHalfElapsed = elapsed - this.firstHalfDuration - this.pauseDuration;
            progress = 0.5 + (secondHalfElapsed / this.secondHalfDuration * 0.5); // 0.5 to 1.0
            this.guineaPigElement.src = `${this.imagePath}guineapig2.png`;
            this.updateGuineaPigSize('moving');
        }
        
        // Update position
        const position = this.calculatePosition(progress);
        this.guineaPigElement.style.left = `${position.x - (this.guineaPigElement.offsetWidth / 2)}px`;
        this.guineaPigElement.style.top = `${position.y - (this.guineaPigElement.offsetHeight / 2)}px`;
        
        // Continue animation
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    completeAnimation() {
        console.log('Guinea pig wave animation complete');
        
        this.isAnimating = false;
        
        // No fade out - guinea pig should be off-screen already
        // Just hide it immediately
        this.guineaPigElement.style.opacity = '0';
        this.guineaPigElement.style.left = `-200px`;
        
        // Clean up
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.startTime = null;
    }
    
    stopAnimation() {
        if (!this.isAnimating) return;
        
        console.log('Stopping guinea pig wave animation');
        
        this.isAnimating = false;
        
        // Hide immediately and reset position
        this.guineaPigElement.style.opacity = '0';
        this.guineaPigElement.style.left = `-200px`;
        
        // Clean up
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.startTime = null;
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
        const styleElement = document.querySelector('#guinea-pig-wave-styles');
        if (styleElement && styleElement.parentNode) {
            styleElement.parentNode.removeChild(styleElement);
        }
        
        this.guineaPigElement = null;
        this.gameArea = null;
        this.gameAreaRect = null;
    }
}
