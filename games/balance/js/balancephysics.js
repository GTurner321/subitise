/**
 * BalancePhysics - Handles seesaw physics and animation
 */
class BalancePhysics {
    constructor() {
        this.currentAngle = 0; // Current rotation angle
        this.targetAngle = 0; // Target angle based on weight
        this.angularVelocity = 0; // Current rotation speed
        this.isSettling = false; // Whether seesaw is settling to balance
        this.leftWeight = 0;
        this.rightWeight = 0;
        this.lastChangeTime = 0;
        this.settleStartTime = 0;
        this.isBalanced = false;
        this.hitGround = false;
    }
    
    /**
     * Update weights on the seesaw
     */
    updateWeights(leftWeight, rightWeight) {
        const weightChanged = (this.leftWeight !== leftWeight || this.rightWeight !== rightWeight);
        
        this.leftWeight = leftWeight;
        this.rightWeight = rightWeight;
        
        if (weightChanged) {
            this.lastChangeTime = Date.now();
            this.settleStartTime = 0;
            this.isBalanced = false;
            this.hitGround = false;
        }
        
        // Calculate target angle based on weight difference
        const weightDiff = rightWeight - leftWeight;
        
        if (Math.abs(weightDiff) < 0.1) {
            // Balanced
            this.targetAngle = 0;
            this.isSettling = true;
            
            // Start settle timer if not already started
            if (this.settleStartTime === 0 && !this.isBalanced) {
                this.settleStartTime = Date.now();
            }
        } else {
            // Unbalanced - angle proportional to weight difference
            // Allow large angles - renderer will clamp to grass collision
            const normalizedDiff = Math.max(-1, Math.min(1, weightDiff / 10));
            this.targetAngle = normalizedDiff * 45; // Up to 45 degrees
            this.isSettling = false;
            this.settleStartTime = 0;
        }
    }
    
    /**
     * Update physics simulation
     * @param {number} deltaTime - Time since last update
     * @param {boolean} groundHit - Whether endpoint hit grass (from renderer)
     */
    update(deltaTime, groundHit = false) {
        const dt = deltaTime / 16.67; // Normalize to 60fps
        
        // Calculate angle difference
        let angleDiff = this.targetAngle - this.currentAngle;
        
        // Apply acceleration based on angle difference
        const acceleration = angleDiff * 0.02;
        this.angularVelocity += acceleration;
        
        // Apply dampening
        this.angularVelocity *= 0.95;
        
        // If ground was hit, apply bounce
        if (groundHit && !this.hitGround) {
            this.angularVelocity *= -BALANCE_CONFIG.BOUNCE_DAMPENING;
            this.hitGround = true;
        } else if (!groundHit) {
            this.hitGround = false;
        }
        
        // Update angle
        this.currentAngle += this.angularVelocity * dt;
        
        // Handle settling to balance
        if (this.isSettling && Math.abs(this.currentAngle) < 0.5 && Math.abs(this.angularVelocity) < 0.1) {
            // Slowly move to exactly 0
            this.currentAngle *= 0.9;
            this.angularVelocity *= 0.8;
            
            if (Math.abs(this.currentAngle) < 0.01) {
                this.currentAngle = 0;
                this.angularVelocity = 0;
            }
        }
        
        // Check if balanced and settled
        if (this.isSettling && this.settleStartTime > 0) {
            const settleTime = Date.now() - this.settleStartTime;
            if (settleTime >= BALANCE_CONFIG.BALANCE_SETTLE_TIME) {
                this.isBalanced = true;
            }
        }
        
        return {
            angle: this.currentAngle,
            isBalanced: this.isBalanced,
            leftWeight: this.leftWeight,
            rightWeight: this.rightWeight
        };
    }
    
    /**
     * Get current rotation angle
     */
    getAngle() {
        return this.currentAngle;
    }
    
    /**
     * Set angle from renderer (after clamping)
     */
    setCurrentAngle(angle) {
        this.currentAngle = angle;
    }
    
    /**
     * Check if seesaw is balanced and settled
     */
    isFullyBalanced() {
        return this.isBalanced;
    }
    
    /**
     * Reset physics state
     */
    reset() {
        this.currentAngle = 0;
        this.targetAngle = 0;
        this.angularVelocity = 0;
        this.isSettling = false;
        this.leftWeight = 0;
        this.rightWeight = 0;
        this.lastChangeTime = 0;
        this.settleStartTime = 0;
        this.isBalanced = false;
        this.hitGround = false;
    }
    
    /**
     * Force immediate angle (for initial setup)
     */
    setAngle(angle) {
        this.currentAngle = angle;
        this.targetAngle = angle;
        this.angularVelocity = 0;
    }
}
