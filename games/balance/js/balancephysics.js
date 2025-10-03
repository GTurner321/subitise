/**
 * BalancePhysics - Handles seesaw physics and animation
 * FIXED: Impulse-based bounce regardless of weight difference
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
        
        const oldWeightDiff = this.rightWeight - this.leftWeight;
        this.leftWeight = leftWeight;
        this.rightWeight = rightWeight;
        const newWeightDiff = rightWeight - leftWeight;
        
        if (weightChanged) {
            this.lastChangeTime = Date.now();
            this.settleStartTime = 0;
            this.isBalanced = false;
            this.hitGround = false;
            this.isLocked = false;
            this.groundBounceCount = 0;
            
            // FIXED: More aggressive impulse that creates visible bounce even at extreme angles
            // Calculate which side received the block
            const weightChange = Math.abs(newWeightDiff - oldWeightDiff);
            
            // Determine impulse direction based on which side got heavier
            let impulseDirection;
            if (Math.abs(newWeightDiff) > Math.abs(oldWeightDiff)) {
                // Weight difference increased - same direction as current tilt
                impulseDirection = Math.sign(newWeightDiff);
            } else {
                // Weight difference decreased - opposite direction (lifting back up)
                impulseDirection = -Math.sign(oldWeightDiff);
            }
            
            // MUCH stronger impulse - 8 degrees per block to overcome strong target angle pull
            const bounceImpulse = weightChange * 8;
            
            // Apply impulse
            this.angularVelocity += impulseDirection * bounceImpulse;
            
            console.log(`Weight change: ${oldWeightDiff} -> ${newWeightDiff}, impulse: ${(impulseDirection * bounceImpulse).toFixed(1)}°, current angle: ${this.currentAngle.toFixed(1)}°`);
        }
        
        const weightDiff = rightWeight - leftWeight;
        
        if (Math.abs(weightDiff) < 0.1) {
            this.targetAngle = 0;
            this.isSettling = true;
            
            if (this.settleStartTime === 0 && !this.isBalanced) {
                this.settleStartTime = Date.now();
            }
        } else {
            // Calculate target angle with capping
            const maxAngle = 45;
            const sensitivity = 3;
            const calculatedAngle = weightDiff * sensitivity;
            this.targetAngle = Math.max(-maxAngle, Math.min(maxAngle, calculatedAngle));
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
        
        const acceleration = angleDiff * 0.03;
        this.angularVelocity += acceleration;
        
        this.angularVelocity *= 0.97;
        
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
