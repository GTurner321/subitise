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
        // Add slight variation to speed and direction on bounce for more natural movement
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
    
    // Method to add a balloon to the simulation after it's started
    addBalloon(balloon) {
        if (this.isRunning) {
            this.initializeBalloonPhysics(balloon);
            this.balloons.push(balloon);
            console.log(`➕ Added balloon ${balloon.number} to physics simulation`);
        }
    }
    
    // Method to remove a balloon from simulation
    // Method to remove a balloon from simulation
    removeBalloon(balloon) {
        const index = this.balloons.indexOf(balloon);
        if (index > -1) {
            this.balloons.splice(index, 1);
            console.log(`➖ Removed balloon ${balloon.number} from physics simulation`);
        }
    }
    
    // Method to pause/resume simulation without destroying it
    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
            console.log('⏸️ Physics simulation paused');
        }
    }
    
    resume() {
        if (!this.isRunning && this.balloons.length > 0) {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.animationId = requestAnimationFrame((time) => this.physicsLoop(time));
            console.log('▶️ Physics simulation resumed');
        }
    }
    
    // Method to get current physics state (for debugging)
    getPhysicsState() {
        return {
            isRunning: this.isRunning,
            balloonCount: this.balloons.length,
            activeBalloons: this.balloons.filter(b => !b.popped).length,
            config: this.config
        };
    }
    
    // Method to apply force to a balloon (for special effects)
    applyForce(balloon, forceX, forceY, duration = 1000) {
        if (!balloon || balloon.popped) return;
        
        // Store original speeds
        const originalRiseSpeed = balloon.riseSpeedPx;
        const originalSidewaysSpeed = balloon.sidewaysSpeedPx;
        
        // Apply force
        balloon.riseSpeedPx += forceY;
        balloon.sidewaysSpeedPx += Math.abs(forceX);
        if (forceX !== 0) {
            balloon.sidewaysDirection = forceX > 0 ? 1 : -1;
        }
        
        // Restore original speeds after duration
        setTimeout(() => {
            if (!balloon.popped) {
                balloon.riseSpeedPx = originalRiseSpeed;
                balloon.sidewaysSpeedPx = originalSidewaysSpeed;
            }
        }, duration);
        
        console.log(`💨 Applied force to balloon ${balloon.number}: X=${forceX}, Y=${forceY} for ${duration}ms`);
    }
    
    // Method to create wind effect on all balloons
    createWindEffect(windStrength = 0.5, duration = 3000) {
        const windDirection = Math.random() > 0.5 ? 1 : -1;
        const vhToPixels = window.innerHeight / 100;
        const windForce = windStrength * this.config.sidewaysSpeedMax * vhToPixels * windDirection;
        
        console.log(`💨 Creating wind effect: strength=${windStrength}, direction=${windDirection > 0 ? 'right' : 'left'}`);
        
        this.balloons.forEach(balloon => {
            if (!balloon.popped) {
                this.applyForce(balloon, windForce, 0, duration);
            }
        });
    }
    
    // Method to make all balloons rise faster (urgency effect)
    createUrgencyEffect(speedMultiplier = 1.5, duration = 2000) {
        const originalSpeeds = new Map();
        
        this.balloons.forEach(balloon => {
            if (!balloon.popped) {
                originalSpeeds.set(balloon, balloon.riseSpeedPx);
                balloon.riseSpeedPx *= speedMultiplier;
            }
        });
        
        setTimeout(() => {
            this.balloons.forEach(balloon => {
                if (!balloon.popped && originalSpeeds.has(balloon)) {
                    balloon.riseSpeedPx = originalSpeeds.get(balloon);
                }
            });
        }, duration);
        
        console.log(`⚡ Created urgency effect: ${speedMultiplier}x speed for ${duration}ms`);
    }
    
    // Method to check if balloon is near ceiling (for warnings)
    isBalloonNearCeiling(balloon, threshold = 0.1) {
        const ceilingThreshold = window.innerHeight * threshold; // 10% of screen height
        return balloon.y <= ceilingThreshold;
    }
    
    // Method to get balloons approaching ceiling
    getBalloonsNearCeiling(threshold = 0.1) {
        return this.balloons.filter(balloon => 
            !balloon.popped && this.isBalloonNearCeiling(balloon, threshold)
        );
    }
    
    // Method to predict when a balloon will hit ceiling
    predictCeilingHitTime(balloon) {
        if (balloon.popped || balloon.riseSpeedPx <= 0) return null;
        
        const distanceToCeiling = balloon.y + this.config.balloonRadius;
        const timeToHit = distanceToCeiling / balloon.riseSpeedPx; // seconds
        
        return timeToHit;
    }
    
    // Method to get collision predictions for all balloons
    getCeilingCollisionPredictions() {
        const predictions = [];
        
        this.balloons.forEach(balloon => {
            if (!balloon.popped) {
                const hitTime = this.predictCeilingHitTime(balloon);
                if (hitTime !== null && hitTime > 0) {
                    predictions.push({
                        balloon: balloon,
                        timeToHit: hitTime,
                        isCorrect: balloon.isCorrect
                    });
                }
            }
        });
        
        // Sort by time to hit (soonest first)
        predictions.sort((a, b) => a.timeToHit - b.timeToHit);
        
        return predictions;
    }
    
    // Method to calculate balloon density in different screen regions
    getBalloonDensity() {
        const regions = {
            top: { count: 0, correct: 0 },
            middle: { count: 0, correct: 0 },
            bottom: { count: 0, correct: 0 }
        };
        
        const screenHeight = this.config.screenHeight;
        const topThreshold = screenHeight * 0.33;
        const bottomThreshold = screenHeight * 0.67;
        
        this.balloons.forEach(balloon => {
            if (!balloon.popped) {
                let region;
                if (balloon.y < topThreshold) {
                    region = regions.top;
                } else if (balloon.y < bottomThreshold) {
                    region = regions.middle;
                } else {
                    region = regions.bottom;
                }
                
                region.count++;
                if (balloon.isCorrect) {
                    region.correct++;
                }
            }
        });
        
        return regions;
    }
    
    // Method to check for balloon clustering (too many balloons close together)
    detectBalloonClustering(clusterRadius = null) {
        if (!clusterRadius) {
            clusterRadius = this.config.balloonRadius * 3; // 3 balloon radii
        }
        
        const clusters = [];
        const processedBalloons = new Set();
        
        this.balloons.forEach(balloon => {
            if (balloon.popped || processedBalloons.has(balloon)) return;
            
            const cluster = [balloon];
            processedBalloons.add(balloon);
            
            // Find nearby balloons
            this.balloons.forEach(otherBalloon => {
                if (otherBalloon.popped || processedBalloons.has(otherBalloon)) return;
                
                const distance = Math.sqrt(
                    Math.pow(balloon.x - otherBalloon.x, 2) + 
                    Math.pow(balloon.y - otherBalloon.y, 2)
                );
                
                if (distance <= clusterRadius) {
                    cluster.push(otherBalloon);
                    processedBalloons.add(otherBalloon);
                }
            });
            
            if (cluster.length > 1) {
                clusters.push(cluster);
            }
        });
        
        return clusters;
    }
    
    // Method to spread out clustered balloons
    disperseClusteredBalloons(clusters = null) {
        if (!clusters) {
            clusters = this.detectBalloonClustering();
        }
        
        clusters.forEach(cluster => {
            const centerX = cluster.reduce((sum, b) => sum + b.x, 0) / cluster.length;
            const centerY = cluster.reduce((sum, b) => sum + b.y, 0) / cluster.length;
            
            cluster.forEach((balloon, index) => {
                const angle = (index / cluster.length) * 2 * Math.PI;
                const disperseRadius = this.config.balloonRadius * 4;
                
                const forceX = Math.cos(angle) * disperseRadius;
                const forceY = Math.sin(angle) * disperseRadius;
                
                this.applyForce(balloon, forceX, forceY, 1500);
            });
        });
        
        console.log(`🌪️ Dispersed ${clusters.length} balloon clusters`);
    }
    
    // Method to get comprehensive physics debug info
    getDebugInfo() {
        const state = this.getPhysicsState();
        const predictions = this.getCeilingCollisionPredictions();
        const density = this.getBalloonDensity();
        const clusters = this.detectBalloonClustering();
        
        return {
            ...state,
            ceilingCollisions: {
                count: predictions.length,
                nextHit: predictions.length > 0 ? predictions[0] : null,
                correctBalloonsAtRisk: predictions.filter(p => p.isCorrect).length
            },
            density,
            clusters: {
                count: clusters.length,
                totalBalloonsInClusters: clusters.reduce((sum, cluster) => sum + cluster.length, 0)
            }
        };
    }
    
    destroy() {
        console.log('🧹 Destroying Balloon Physics');
        
        this.stopSimulation();
        this.balloons = [];
        this.config = {};
        
        console.log('✅ Balloon Physics destroyed');
    }
}
