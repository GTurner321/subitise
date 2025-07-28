class SimplifiedGuineaPigWave {
    constructor(imagePath = 'assets/raisin/') {
        this.guineaPig = null;
        this.animationId = null;
        this.isAnimating = false;
        
        // Configurable image path for different game folders
        this.imagePath = imagePath;
        
        // Only 2 scenarios now
        this.scenarios = [
            'bobbling_movement',    // Scenario 1: Fast entry, slow down, pause, bobble off
            'pause_and_face_front' // Scenario 2: Uniform speed with pause and face front
        ];
        
        // Timing parameters
        this.scenario1 = {
            fastEntryTime: 2000,    // 2 seconds to come in and stop
            pauseTime: 500,         // 0.5 seconds pause
            bobbleExitTime: 3000    // 3 seconds to bobble off
        };
        
        this.scenario2 = {
            pausePosition: { min: 0.3, max: 0.6 }, // 30-60% through path
            pauseTime: 500,         // 0.5 seconds pause
            frontFacingTime: 2000   // 2 seconds facing front
        };
        
        this.startTime = null;
        this.screenWidth = 0;
        this.screenHeight = 0;
        this.currentScenario = null;
        this.entranceHeight = 0.75; // Default 75% from top (can be overridden)
        
        this.addStyles();
        this.updateScreenDimensions();
        
        // Update dimensions on window resize
        window.addEventListener('resize', () => {
            this.updateScreenDimensions();
        });
    }
    
    addStyles() {
        // Check if styles already exist
        if (document.querySelector('#simplified-guinea-pig-wave-styles')) return;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'simplified-guinea-pig-wave-styles';
        styleElement.textContent = `
            .simplified-guinea-pig-wave {
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
    
    // Method for game controllers to set entrance height
    setEntranceHeight(heightPercentage) {
        // heightPercentage should be 0-100 (e.g., 60 for 60% from top)
        this.entranceHeight = heightPercentage / 100;
    }
    
    createGuineaPigElement() {
        const element = document.createElement('img');
        element.className = 'simplified-guinea-pig-wave';
        element.src = `${this.imagePath}guineapig2.png`; // Start facing right
        
        // Calculate entrance position
        const yPosition = this.screenHeight * this.entranceHeight;
        
        // Initial positioning (off-screen left)
        element.style.cssText = `
            left: -200px;
            top: ${yPosition}px;
            opacity: 1;
        `;
        
        // Set size to 20% of screen height
        const height = this.screenHeight * 0.2;
        element.style.height = `${height}px`;
        element.style.width = 'auto';
        
        document.body.appendChild(element);
        
        return {
            element: element,
            yPosition: yPosition,
            pausePosition: null, // Will be set for scenario 2
            phase: 'entry' // Track current phase of animation
        };
    }
    
    selectRandomScenario() {
        // 50% chance for each scenario
        this.currentScenario = Math.random() < 0.5 ? 'bobbling_movement' : 'pause_and_face_front';
        console.log('Selected scenario:', this.currentScenario);
        
        // Clear existing guinea pig
        this.clearGuineaPig();
        
        // Create guinea pig
        this.guineaPig = this.createGuineaPigElement();
        
        // Set pause position for scenario 2
        if (this.currentScenario === 'pause_and_face_front') {
            const min = this.scenario2.pausePosition.min;
            const max = this.scenario2.pausePosition.max;
            this.guineaPig.pausePosition = min + Math.random() * (max - min);
        }
    }
    
    startAnimation(entranceHeightPercentage = 75) {
        if (this.isAnimating) {
            this.stopAnimation();
        }
        
        console.log('Starting simplified guinea pig wave animation');
        
        // Set entrance height if provided
        this.setEntranceHeight(entranceHeightPercentage);
        
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
        
        // Check if animation is complete
        if (this.guineaPig.element.style.opacity === '0') {
            this.completeAnimation();
            return;
        }
        
        // Update guinea pig based on scenario
        if (this.currentScenario === 'bobbling_movement') {
            this.updateBobblingMovement(elapsed);
        } else {
            this.updatePauseAndFaceFront(elapsed);
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    updateBobblingMovement(elapsed) {
        const { fastEntryTime, pauseTime, bobbleExitTime } = this.scenario1;
        const totalTime = fastEntryTime + pauseTime + bobbleExitTime; // 2000 + 500 + 3000 = 5500ms
        
        // Debug logging
        if (elapsed % 500 < 16) { // Log every 500ms
            console.log(`Bobbling - Elapsed: ${elapsed}ms, Total: ${totalTime}ms, Phase: ${this.guineaPig.phase}`);
        }
        
        if (elapsed >= totalTime) {
            console.log('Bobbling animation complete - hiding guinea pig');
            this.guineaPig.element.style.opacity = '0';
            return;
        }
        
        let x, y;
        const baseY = this.guineaPig.yPosition;
        
        if (elapsed <= fastEntryTime) {
            // Phase 1: Faster entry with stronger deceleration to 70% of screen
            const progress = elapsed / fastEntryTime;
            // Stronger ease-out (quartic) for more dramatic deceleration
            const easedProgress = 1 - Math.pow(1 - progress, 4);
            x = this.calculateX(easedProgress * 0.7); // Move to 70% of screen (changed from 80%)
            y = baseY;
            this.guineaPig.phase = 'entry';
            
        } else if (elapsed <= fastEntryTime + pauseTime) {
            // Phase 2: Pause at 70%
            x = this.calculateX(0.7);
            y = baseY;
            this.guineaPig.phase = 'pause';
            
        } else {
            // Phase 3: Bobbling movement to exit - uniform slow speed with bobbles
            const bobbleElapsed = elapsed - fastEntryTime - pauseTime;
            const bobbleProgress = bobbleElapsed / bobbleExitTime;
            
            // X position: from 70% to 120% (well off screen) at uniform speed
            const xProgress = 0.7 + (bobbleProgress * 0.5); // 0.7 to 1.2 (goes well off screen)
            x = this.calculateX(xProgress);
            
            // Bobbling Y movement: fine v-toothed pattern simulating walking
            const bobbleFrequency = 12; // Higher frequency for finer bobbles
            const bobbleAmplitude = 6; // Smaller amplitude for subtle effect
            const bobbleOffset = Math.sin(bobbleElapsed * bobbleFrequency * Math.PI / 1000) * bobbleAmplitude;
            y = baseY + bobbleOffset;
            
            this.guineaPig.phase = 'bobbling';
        }
        
        // Update position
        this.guineaPig.element.style.left = `${x - (this.guineaPig.element.offsetWidth / 2)}px`;
        this.guineaPig.element.style.top = `${y - (this.guineaPig.element.offsetHeight / 2)}px`;
    }
    
    updatePauseAndFaceFront(elapsed) {
        const { pauseTime, frontFacingTime } = this.scenario2;
        const pausePos = this.guineaPig.pausePosition;
        
        // Calculate durations based on pause position
        const timeToReachPause = 2000 * pausePos; // Proportional time to reach pause
        const timeFromPauseToEnd = 2000 * (1 - pausePos); // Proportional time from pause to end
        const totalTime = timeToReachPause + pauseTime + frontFacingTime + timeFromPauseToEnd;
        
        // Debug logging
        if (elapsed % 500 < 16) { // Log every 500ms
            console.log(`PauseFront - Elapsed: ${elapsed}ms, Total: ${totalTime}ms, Phase: ${this.guineaPig.phase}, PausePos: ${pausePos.toFixed(2)}`);
            console.log(`Times - ToReach: ${timeToReachPause}ms, Pause: ${pauseTime}ms, Front: ${frontFacingTime}ms, FromPause: ${timeFromPauseToEnd}ms`);
        }
        
        if (elapsed >= totalTime) {
            console.log('PauseFront animation complete - hiding guinea pig');
            this.guineaPig.element.style.opacity = '0';
            return;
        }
        
        let progress, x, y;
        const baseY = this.guineaPig.yPosition;
        y = baseY; // No vertical movement in this scenario
        
        if (elapsed <= timeToReachPause) {
            // Phase 1: Moving to pause position at uniform speed
            const phaseProgress = elapsed / timeToReachPause;
            progress = phaseProgress * pausePos;
            this.guineaPig.element.src = `${this.imagePath}guineapig2.png`;
            this.guineaPig.phase = 'approaching';
            
        } else if (elapsed <= timeToReachPause + pauseTime) {
            // Phase 2: Brief pause (0.5 seconds) - stay as guineapig2
            progress = pausePos;
            this.guineaPig.element.src = `${this.imagePath}guineapig2.png`;
            this.guineaPig.phase = 'pausing';
            
        } else if (elapsed <= timeToReachPause + pauseTime + frontFacingTime) {
            // Phase 3: Face front (2 seconds) - change to guineapig3
            progress = pausePos;
            this.guineaPig.element.src = `${this.imagePath}guineapig3.png`;
            this.guineaPig.phase = 'facing_front';
            
        } else {
            // Phase 4: Turn back to guineapig2 and continue moving off the page
            const exitElapsed = elapsed - timeToReachPause - pauseTime - frontFacingTime;
            const exitProgress = exitElapsed / timeFromPauseToEnd;
            // Continue from pause position to well off screen (120% to ensure it exits)
            progress = pausePos + (exitProgress * (1.2 - pausePos));
            this.guineaPig.element.src = `${this.imagePath}guineapig2.png`; // Back to right-facing
            this.guineaPig.phase = 'exiting';
        }
        
        x = this.calculateX(progress);
        
        // Update position
        this.guineaPig.element.style.left = `${x - (this.guineaPig.element.offsetWidth / 2)}px`;
        this.guineaPig.element.style.top = `${y - (this.guineaPig.element.offsetHeight / 2)}px`;
    }
    
    calculateX(progress) {
        // X position: from off-screen left to off-screen right
        const startX = -200; // Start off-screen left
        const endX = this.screenWidth + 200; // End off-screen right
        return startX + (progress * (endX - startX));
    }
    
    completeAnimation() {
        console.log('Simplified guinea pig wave animation complete');
        
        this.isAnimating = false;
        
        // Hide guinea pig
        if (this.guineaPig) {
            this.guineaPig.element.style.opacity = '0';
        }
        
        // Clean up
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.startTime = null;
    }
    
    stopAnimation() {
        if (!this.isAnimating) return;
        
        console.log('Stopping simplified guinea pig wave animation');
        
        this.isAnimating = false;
        
        // Hide guinea pig
        if (this.guineaPig) {
            this.guineaPig.element.style.opacity = '0';
        }
        
        // Clean up
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.startTime = null;
    }
    
    clearGuineaPig() {
        if (this.guineaPig && this.guineaPig.element && this.guineaPig.element.parentNode) {
            this.guineaPig.element.parentNode.removeChild(this.guineaPig.element);
        }
        this.guineaPig = null;
    }
    
    isCurrentlyAnimating() {
        return this.isAnimating;
    }
    
    destroy() {
        this.stopAnimation();
        this.clearGuineaPig();
        
        // Remove styles when destroying
        const styleElement = document.querySelector('#simplified-guinea-pig-wave-styles');
        if (styleElement && styleElement.parentNode) {
            styleElement.parentNode.removeChild(styleElement);
        }
    }
}

// Example usage for game controllers:
/*
// In your game controller file:

// Create the animation instance
const guineaPigWave = new SimplifiedGuineaPigWave('assets/raisin/');

// Method 1: Set entrance height before starting animation
guineaPigWave.setEntranceHeight(60); // 60% from top
guineaPigWave.startAnimation();

// Method 2: Set entrance height when starting animation
guineaPigWave.startAnimation(60); // 60% from top

// Method 3: Use default entrance height (75% from top)
guineaPigWave.startAnimation();
*/
