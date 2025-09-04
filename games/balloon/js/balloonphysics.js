class BalloonPhysics {
    constructor() {
        this.balloons = [];
        this.animationId = null;
        this.lastTime = 0;
        this.isRunning = false;
        
        // Physics configuration - all responsive to screen dimensions
        this.config = {
            // Speed ranges in vh per second (responsive to screen height)
            riseSpeedMin: 0, // Will be calculated based on screen height
            riseSpeedMax: 0,
            sidewaysSpeedMin: 0,
            sidewaysSpeedMax: 0,
            
            // Boundaries
            screenWidth: 0,
            screenHeight: 0,
            balloonRadius: 0
        };
        
        this.updatePhysicsConfig();
    }
    
    updatePhysicsConfig() {
        this.config.screenWidth = window.innerWidth;
        this.config.screenHeight = window.innerHeight;
        this.config.balloonRadius = window.innerHeight * 0.04; // 4vh radius
        
        // Convert config speeds to responsive vh-based speeds
        // Original config was in pixels per second, convert to vh per second
        const pixelsToVh = 100 / window.innerHeight;
        
        this.config.riseSpeedMin = BALLOON_CONFIG.BALLOON_RISE_SPEED_MIN * pixelsToVh;
        this.config.riseSpeedMax = BALLOON_CONFIG.BALLOON_RISE_SPEED_MAX * pixelsToVh;
        this.config.sidewaysSpeedMin = BALLOON_CONFIG.BALLOON_SIDEWAYS_SPEED_MIN * pixelsToVh;
        this.config.sidewaysSpeedMax = BALLOON_CONFIG.BALLOON_SIDEWAYS_SPEED_MAX * pixelsToVh;
        
        console.log('⚙️ Physics config updated:', {
            riseSpeed: `${this.config.riseSpeedMin.toFixed(2)}-${this.config.riseSpeedMax.toFixed(2)} vh/s`,
            sidewaysSpeed: `${this.config.sidewaysSpeedMin.toFixed(2)}-${this.config.sidewaysSpeedMax.toFixed(2)} vh/s`,
            balloonRadius: `${this.config.balloonRadius}px`
        });
    }
    
    startSimulation(balloons) {
        console.log(`🎪 Starting physics simulation for ${balloons.length} balloons`);
        
        this.balloons = balloons;
        this.isRunning = true;
        
        // Initialize physics properties for each balloon
        this.balloons.forEach(balloon => {
            this.initializeBalloonPhysics(balloon);
        });
        
        // Start physics loop
        this.lastTime = performance.now();
        this.animationId = requestAnimationFrame((time) => this.physicsLoop(time));
    }
    
    initializeBalloonPhysics(balloon) {
        // Assign random physics properties to balloon
        balloon.riseSpeed = this.config.riseSpeedMin + 
                           Math.random() * (this.config.riseSpeedMax - this.config.riseSpeedMin);
        
        balloon.sidewaysSpeed = this.config.sidewaysSpeedMin + 
                               Math.random() * (this.config.sidewaysSpeedMax - this.config.sidewaysSpeedMin);
        
        balloon.sidewaysDirection = Math.random() > 0.5 ? 1 : -1;
        
        // Convert vh-based speeds back to pixels per second for calculations
        const vhToPixels = window.innerHeight / 100;
        balloon.riseSpeedPx = balloon.riseSpeed * vhToPixels;
        balloon.sidewaysSpeedPx = balloon.sidewaysSpeed * vhToPixels;
        
        console.log(`⚡ Initialized balloon ${balloon.number}: rise=${balloon.riseSpeed.toFixed(2)}vh/s, sideways=${balloon.sidewaysSpeed.toFixed(2)}vh/s`);
    }
    
    physicsLoop(currentTime) {
        if (!this.isRunning) return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Update each balloon's physics
        this.balloons.forEach(balloon => {
            if (!balloon.popped) {
                this.updateBalloonPhysics(balloon, deltaTime);
            }
        });
        
        // Continue physics loop
        this.animationId = requestAnimationFrame((time) => this.physicsLoop(time));
    }
    
    updateBalloonPhysics(balloon, deltaTime) {
        // Move balloon up
        balloon.y -= balloon.riseSpeedPx * deltaTime;
        
        // Check if balloon reached ceiling - balloon center should touch the top
        if (balloon.y + this.config.balloonRadius <= 0) {
            // Dispatch pop event for ceiling hit
            const popEvent = new CustomEvent('balloonPopped', {
                detail: { balloon, poppedByUser: false }
            });
            document.dispatchEvent(popEvent);
            return;
        }
        
        // Move balloon sideways
        balloon.x += balloon.sidewaysSpeedPx * balloon.sidewaysDirection * deltaTime;
        
        // Check wall collisions and bounce
        this.handleWallCollisions(balloon);
        
        // Update balloon visual position (if renderer is handling display updates)
        if (window.balloonGame && window.balloonGame.renderer) {
            window.balloonGame.renderer.updateBalloonDisplay(balloon);
        }
    }
    
    handleWallCollisions(balloon) {
        const balloonDiameter = this.config.balloonRadius * 2;
        
        // Left wall collision
        if (balloon.x <= 0) {
            balloon.x = 0;
            balloon.sidewaysDirection = 1; // Bounce right
            this.addBounceVariation(balloon);
        }
        // Right wall collision  
        else if (balloon.x + balloonDiameter >= this.config.screenWidth) {
            balloon.x = this.config.screenWidth - balloonDiameter;
            balloon.sidewaysDirection = -1; // Bounce left
            this.addBounceVariation(balloon);
        }
    }
    
    addBounceVariation(balloon) {
        // Add slight variation to speed on bounce for more natural movement
        const speedVariation = 0.9 + (Math.random() * 0.2); // 90% to 110% of original speed
        balloon.sidewaysSpeedPx *= speedVariation;
        
        // Clamp to reasonable bounds
        const vhToPixels = window.innerHeight / 100;
        const minSpeedPx = this.config.sidewaysSpeedMin * vhToPixels;
        const maxSpeedPx = this.config.sidewaysSpeedMax * vhToPixels;
        
        balloon.sidewaysSpeedPx = Math.max(minSpeedPx, Math.min(maxSpeedPx, balloon.sidewaysSpeedPx));
        
        console.log(`🏐 Balloon ${balloon.number} bounced, new sideways speed: ${(balloon.sidewaysSpeedPx / vhToPixels).toFixed(2)}vh/s`);
    }
    
    stopSimulation() {
        console.log('⏹️ Stopping physics simulation');
        
        this.isRunning = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.balloons = [];
    }
    
    // Method to handle window resize
    handleResize() {
        console.log('🔄 Physics handling resize');
        
        const oldScreenWidth = this.config.screenWidth;
        const oldScreenHeight = this.config.screenHeight;
        
        this.updatePhysicsConfig();
        
        // Update existing balloon positions proportionally
        const widthScale = this.config.screenWidth / oldScreenWidth;
        const heightScale = this.config.screenHeight / oldScreenHeight;
        
        this.balloons.forEach(balloon => {
            // Scale balloon position
            balloon.x *= widthScale;
            balloon.y *= heightScale;
            
            // Recalculate speed in pixels
            const vhToPixels = window.innerHeight / 100;
            balloon.riseSpeedPx = balloon.riseSpeed * vhToPixels;
            balloon.sidewaysSpeedPx = balloon.sidewaysSpeed * vhToPixels;
        });
        
        console.log('⚙️ Physics updated for resize');
    }
    
    destroy() {
        console.log('🧹 Destroying Balloon Physics');
        
        this.stopSimulation();
        this.balloons = [];
        this.config = {};
        
        console.log('✅ Balloon Physics destroyed');
    }
}
