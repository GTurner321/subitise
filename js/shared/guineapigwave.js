class GuineaPigWave {
    constructor(imagePath = 'assets/raisin/') {
        this.guineaPigElement = null;
        this.gameArea = document.querySelector('.game-area');
        this.animationId = null;
        this.isAnimating = false;
        
        // Configurable image path for different game folders
        this.imagePath = imagePath;
        
        // Animation parameters
        this.totalDuration = 5000; // 1.5s + 2s + 1.5s = 5s total
        this.firstHalfDuration = 1500; // 1.5 seconds to middle
        this.pauseDuration = 2000; // 2 second pause
        this.secondHalfDuration = 1500; // 1.5 seconds to exit
        
        this.startTime = null;
        this.gameAreaRect = null;
        
        this.createGuineaPigElement();
    }
    
    createGuineaPigElement() {
        this.guineaPigElement = document.createElement('img');
        this.guineaPigElement.className = 'guinea-pig-wave';
        this.guineaPigElement.src = `${this.imagePath}guineapig2.png`; // Start with facing right
        
        // Scale to 15% of screen height
        const screenHeight = window.innerHeight;
        const guineaPigHeight = screenHeight * 0.15;
        
        this.guineaPigElement.style.cssText = `
            position: absolute;
            height: ${guineaPigHeight}px;
            width: auto;
            opacity: 0;
            z-index: 50;
            pointer-events: none;
            transition: opacity 0.3s ease;
            image-rendering: crisp-edges;
        `;
        
        document.body.appendChild(this.guineaPigElement);
        
        // Update size on window resize
        window.addEventListener('resize', () => {
            const newScreenHeight = window.innerHeight;
            const newGuineaPigHeight = newScreenHeight * 0.15;
            this.guineaPigElement.style.height = `${newGuineaPigHeight}px`;
            this.updateGameAreaRect();
        });
    }
    
    updateGameAreaRect() {
        if (this.gameArea) {
            this.gameAreaRect = this.gameArea.getBoundingClientRect();
        }
    }
    
    calculatePosition(progress) {
        if (!this.gameAreaRect) return { x: 0, y: 0 };
        
        // X position: linear progression from left to right
        const x = this.gameAreaRect.left + (progress * this.gameAreaRect.width);
        
        // Y position: sine wave function
        // y = 0.05 * gameAreaHeight * sin((5*π/gameAreaWidth) * relativeX)
        // Start at 80% down the game area
        const relativeX = progress * this.gameAreaRect.width;
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
        this.isAnimating = true;
        this.startTime = performance.now();
        
        // Start with guineapig2 (facing right) and make visible
        this.guineaPigElement.src = `${this.imagePath}guineapig2.png`;
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
        let shouldUpdatePosition = true;
        
        if (elapsed <= this.firstHalfDuration) {
            // First half: moving to middle
            progress = elapsed / this.firstHalfDuration * 0.5; // 0 to 0.5
            this.guineaPigElement.src = `${this.imagePath}guineapig2.png`;
            
        } else if (elapsed <= this.firstHalfDuration + this.pauseDuration) {
            // Pause in middle: facing straight
            progress = 0.5; // Stay at middle
            this.guineaPigElement.src = `${this.imagePath}guineapig3.png`;
            
        } else {
            // Second half: moving to right
            const secondHalfElapsed = elapsed - this.firstHalfDuration - this.pauseDuration;
            progress = 0.5 + (secondHalfElapsed / this.secondHalfDuration * 0.5); // 0.5 to 1.0
            this.guineaPigElement.src = `${this.imagePath}guineapig2.png`;
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
        
        // Fade out the guinea pig
        this.guineaPigElement.style.opacity = '0';
        
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
        
        // Fade out immediately
        this.guineaPigElement.style.opacity = '0';
        
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
        
        this.guineaPigElement = null;
        this.gameArea = null;
        this.gameAreaRect = null;
    }
}
