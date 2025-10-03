/**
 * BalancePhysics - Handles seesaw physics and animation
 * FIXED: Stops at equilibrium AND when ground is hit (after bounce)
 */
class BalancePhysics {
    constructor() {
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
        this.lastUpdateTime = 0;
        this.isLocked = false;
        this.groundBounceCount = 0;
    }
    
    updateWeights(leftWeight, rightWeight) {
        const weightChanged = (this.leftWeight !== leftWeight || this.rightWeight !== rightWeight);
        
        this.leftWeight = leftWeight;
        this.rightWeight = rightWeight;
        
        if (weightChanged) {
            this.lastChangeTime = Date.now();
            this.settleStartTime = 0;
            this.isBalanced = false;
            this.hitGround = false;
            this.isLocked = false;
            this.groundBounceCount = 0;
        }
        
        const weightDiff = rightWeight - leftWeight;
        
        if (Math.abs(weightDiff) < 0.1) {
            this.targetAngle = 0;
            this.isSettling = true;
            
            if (this.settleStartTime === 0 && !this.isBalanced) {
                this.settleStartTime = Date.now();
            }
        } else {
            const normalizedDiff = Math.max(-1, Math.min(1, weightDiff / 10));
            this.targetAngle = normalizedDiff * 45;
            this.isSettling = false;
            this.settleStartTime = 0;
        }
    }
    
    update(deltaTime, groundHit = false) {
        if (this.isLocked) {
            return {
                angle: this.currentAngle,
                isBalanced: this.isBalanced,
                leftWeight: this.leftWeight,
                rightWeight: this.rightWeight
            };
        }
        
        const cappedDelta = Math.min(deltaTime, 100);
        const dt = cappedDelta / 16.67;
        
        let angleDiff = this.targetAngle - this.currentAngle;
        
        const acceleration = angleDiff * 0.02;
        this.angularVelocity += acceleration;
        
        this.angularVelocity *= 0.95;
        
        if (groundHit && !this.hitGround) {
            this.angularVelocity *= -BALANCE_CONFIG.BOUNCE_DAMPENING;
            this.hitGround = true;
            this.groundBounceCount++;
            
            console.log(`Ground bounce #${this.groundBounceCount}`);
            
            if (this.groundBounceCount >= 2) {
                this.currentAngle = this.targetAngle;
                this.angularVelocity = 0;
                this.isLocked = true;
                this.isBalanced = true;
                console.log('Physics locked after ground bounces');
            }
        } else if (!groundHit) {
            this.hitGround = false;
        }
        
        this.currentAngle += this.angularVelocity * dt;
        
        if (this.isSettling && !groundHit) {
            this.currentAngle *= 0.92;
            this.angularVelocity *= 0.85;
            
            if (Math.abs(this.currentAngle) < 0.05 && Math.abs(this.angularVelocity) < 0.05) {
                this.currentAngle = 0;
                this.angularVelocity = 0;
                this.isLocked = true;
                this.isBalanced = true;
                console.log('Physics locked at mid-air equilibrium');
            }
        }
        
        if (this.isSettling && this.settleStartTime > 0 && !groundHit) {
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
    
    getAngle() {
        return this.currentAngle;
    }
    
    setCurrentAngle(angle) {
        this.currentAngle = angle;
    }
    
    isFullyBalanced() {
        return this.isBalanced;
    }
    
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
        this.lastUpdateTime = 0;
        this.isLocked = false;
        this.groundBounceCount = 0;
    }
    
    setAngle(angle) {
        this.currentAngle = angle;
        this.targetAngle = angle;
        this.angularVelocity = 0;
        this.isLocked = false;
        this.groundBounceCount = 0;
    }
}
