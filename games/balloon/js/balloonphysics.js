class BalloonPhysics {
    constructor(balloons, fallingNumbers, config, controller) {
        this.balloons = balloons;
        this.fallingNumbers = fallingNumbers;
        this.config = config;
        this.controller = controller; // Reference to game controller for callbacks
        
        this.animationId = null;
        this.lastTime = 0;
        this.isRunning = false;
    }

    /**
     * Start the physics animation loop
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        this.animationId = requestAnimationFrame((time) => this.update(time));
    }

    /**
     * Stop the physics animation loop
     */
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Main physics update loop
     */
    update(currentTime) {
        if (!this.isRunning) return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Update balloon physics
        this.updateBalloons(deltaTime);
        
        // Update falling numbers physics
        this.updateFallingNumbers(deltaTime, currentTime);
        
        // Continue animation loop - always continue if we're running
        // The controller will call stop() when appropriate
        this.animationId = requestAnimationFrame((time) => this.update(time));
    }

    /**
     * Update balloon positions and handle collisions
     */
    updateBalloons(deltaTime) {
        this.balloons.forEach((balloon, index) => {
            if (balloon.popped) return;
            
            // Move balloon up
            balloon.y -= balloon.riseSpeed * deltaTime;
            
            // Check if balloon reached ceiling - balloon center should touch the ceiling
            if (balloon.y + balloon.radius <= 0) {
                this.controller.onBalloonHitCeiling(balloon);
                return;
            }
            
            // Move balloon sideways
            balloon.x += balloon.sidewaysSpeed * balloon.sidewaysDirection * deltaTime;
            
            // Handle wall bouncing
            this.handleWallCollision(balloon);
            
            // Notify controller to update visuals
            this.controller.onBalloonPositionUpdate(balloon);
        });
    }

    /**
     * Handle balloon collision with walls
     */
    handleWallCollision(balloon) {
        const gameAreaWidth = window.innerWidth;
        const balloonWidth = balloon.radius * 2;
        
        if (balloon.x <= 0) {
            balloon.x = 0;
            balloon.sidewaysDirection = 1;
        } else if (balloon.x + balloonWidth >= gameAreaWidth) {
            balloon.x = gameAreaWidth - balloonWidth;
            balloon.sidewaysDirection = -1;
        }
    }

    /**
     * Update falling numbers physics
     */
    updateFallingNumbers(deltaTime, currentTime) {
        this.fallingNumbers.forEach((fallingNumber, index) => {
            if (!fallingNumber.landed) {
                // Only update Y position - never touch X
                fallingNumber.y += fallingNumber.speed * deltaTime;
                
                if (fallingNumber.y >= fallingNumber.targetY) {
                    fallingNumber.y = fallingNumber.targetY;
                    fallingNumber.landed = true;
                    fallingNumber.landedTime = currentTime;
                }
                
                // Notify controller to update visuals
                this.controller.onFallingNumberPositionUpdate(fallingNumber);
            } else {
                // Check if it's time to remove landed numbers (after 3 seconds)
                if (currentTime - fallingNumber.landedTime > 3000) {
                    this.controller.onFallingNumberRemovalReady(fallingNumber, index);
                }
            }
        });
    }

    /**
     * Create balloon with physics properties
     */
    createBalloon(number, isCorrect) {
        // Generate random position across game width with better distribution
        const gameAreaWidth = window.innerWidth;
        const constrainedWidth = gameAreaWidth * 0.9;
        const startOffset = (gameAreaWidth - constrainedWidth) / 2;
        const x = startOffset + (Math.random() * (constrainedWidth - this.config.BALLOON_RADIUS * 2));
        
        // Use improved height positioning with larger range
        const gameAreaHeight = window.innerHeight;
        const baseMinStartHeight = gameAreaHeight * this.config.BALLOON_START_HEIGHT_MIN;
        const baseMaxStartHeight = gameAreaHeight * this.config.BALLOON_START_HEIGHT_MAX;
        const rangeExtension = (baseMaxStartHeight - baseMinStartHeight) * this.config.BALLOON_RANGE_EXTENSION;
        const minStartHeight = baseMinStartHeight - rangeExtension;
        const maxStartHeight = baseMaxStartHeight;
        const y = minStartHeight + Math.random() * (maxStartHeight - minStartHeight);
        
        const balloon = {
            x: x,
            y: y,
            number: number,
            isCorrect: isCorrect,
            riseSpeed: this.config.BALLOON_RISE_SPEED_MIN + 
                      Math.random() * (this.config.BALLOON_RISE_SPEED_MAX - this.config.BALLOON_RISE_SPEED_MIN),
            sidewaysSpeed: this.config.BALLOON_SIDEWAYS_SPEED_MIN + 
                          Math.random() * (this.config.BALLOON_SIDEWAYS_SPEED_MAX - this.config.BALLOON_SIDEWAYS_SPEED_MIN),
            sidewaysDirection: Math.random() > 0.5 ? 1 : -1,
            popped: false,
            color: this.config.BALLOON_COLORS[Math.floor(Math.random() * this.config.BALLOON_COLORS.length)],
            radius: this.config.BALLOON_RADIUS,
            
            // Visual references (will be set by renderer)
            group: null,
            string: null,
            circle: null,
            highlight: null,
            text: null,
            stringStartX: 0,
            stringStartY: 0,
            stringEndX: 0,
            stringEndY: 0
        };
        
        return balloon;
    }

    /**
     * Remove balloon from physics simulation
     */
    removeBalloon(balloon) {
        const index = this.balloons.indexOf(balloon);
        if (index > -1) {
            this.balloons.splice(index, 1);
        }
    }

    /**
     * Remove falling number from physics simulation
     */
    removeFallingNumber(fallingNumber) {
        const index = this.fallingNumbers.indexOf(fallingNumber);
        if (index > -1) {
            this.fallingNumbers.splice(index, 1);
        }
    }

    /**
     * Check if all falling numbers have landed and disappeared
     */
    areAllFallingNumbersGone() {
        return this.fallingNumbers.length === 0;
    }

    /**
     * Clear all physics objects
     */
    clearAll() {
        this.balloons.length = 0;
        this.fallingNumbers.length = 0;
    }

    /**
     * Get balloon at specific screen coordinates (for click detection)
     */
    getBalloonAtPosition(x, y) {
        // Check balloons in reverse order (top to bottom visually)
        for (let i = this.balloons.length - 1; i >= 0; i--) {
            const balloon = this.balloons[i];
            if (balloon.popped) continue;
            
            // Check if click is within balloon circle
            const centerX = balloon.x + balloon.radius;
            const centerY = balloon.y + balloon.radius;
            const distance = Math.sqrt(
                Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
            );
            
            if (distance <= balloon.radius) {
                return balloon;
            }
        }
        
        return null;
    }

    /**
     * Calculate physics statistics for debugging
     */
    getStats() {
        const activeBalloons = this.balloons.filter(b => !b.popped).length;
        const fallingNumbers = this.fallingNumbers.length;
        const landedNumbers = this.fallingNumbers.filter(fn => fn.landed).length;
        
        return {
            activeBalloons,
            fallingNumbers,
            landedNumbers,
            isRunning: this.isRunning
        };
    }

    /**
     * Destroy physics engine and clean up
     */
    destroy() {
        this.stop();
        this.clearAll();
        this.controller = null;
    }
}
