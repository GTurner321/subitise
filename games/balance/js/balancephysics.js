/**
 * BalancePhysics - Handles seesaw physics and animation
 * Natural damped oscillation: accelerates to target, overshoots twice, then settles
 */
class BalancePhysics {
    constructor() {
        this.currentAngle = 0;
        this.targetAngle = 0;
        this.angularVelocity = 0; // Velocity for natural oscillation
        this.isSettling = false;
        this.leftWeight = 0;
        this.rightWeight = 0;
        this.lastChangeTime = 0;
        this.settleStartTime = 0;
        this.isBalanced = false;
        this.overshootCount = 0; // Track number of overshoots
        this.lastAngleDiff = 0; // Track direction changes
        
        // Calculate maximum angle (when bar end touches ground)
        this.maxGroundAngle = this.calculateMaxGroundAngle();
        console.log('Physics initialized with max ground angle:', this.maxGroundAngle.toFixed(2) + '°');
    }
    
    calculateMaxGroundAngle() {
        const pivotHeight = BALANCE_CONFIG.PIVOT_HEIGHT_PERCENT;
        const barWidth = BALANCE_CONFIG.SEESAW_WIDTH_PERCENT;
        const halfBarWidth = barWidth / 2;
        
        const angleRad = Math.asin(pivotHeight / halfBarWidth);
        const angleDeg = angleRad * (180 / Math.PI);
        
        return angleDeg;
    }
    
    updateWeights(leftWeight, rightWeight) {
        const weightChanged = (this.leftWeight !== leftWeight || this.rightWeight !== rightWeight);
        
        this.leftWeight = leftWeight;
        this.rightWeight = rightWeight;
        
        if (weightChanged) {
            this.lastChangeTime = Date.now();
            this.settleStartTime = 0;
            this.isBalanced = false;
            this.overshootCount = 0; // Reset overshoot counter on weight change
            this.lastAngleDiff = 0;
        }
        
        const weightDiff = rightWeight - leftWeight;
        
        if (Math.abs(weightDiff) < 0.1) {
            // Perfectly balanced - target is level
            this.targetAngle = 0;
            this.isSettling = true;
            
            if (this.settleStartTime === 0 && !this.isBalanced) {
                this.settleStartTime = Date.now();
            }
            
            if (weightChanged) {
                console.log('⚖️ BALANCED - target angle: 0°');
            }
        } else {
            // Direct angle calculation based on weight difference
            const initialWeightDiff = this.getInitialWeightDifference();
            
            if (initialWeightDiff > 0) {
                // Linear mapping: angle = (currentDiff / initialDiff) × maxAngle
                const ratio = weightDiff / initialWeightDiff;
                this.targetAngle = ratio * this.maxGroundAngle;
                
                if (weightChanged) {
                    const degreesPerUnit = this.maxGroundAngle / initialWeightDiff;
                    console.log(`📊 Weight: L=${leftWeight} R=${rightWeight} Diff=${weightDiff}`);
                    console.log(`📐 Target: ${this.targetAngle.toFixed(1)}° (${degreesPerUnit.toFixed(1)}°/unit)`);
                }
            } else {
                // Fallback
                const sensitivity = this.maxGroundAngle / 9;
                this.targetAngle = Math.max(-this.maxGroundAngle, Math.min(this.maxGroundAngle, weightDiff * sensitivity));
            }
            
            this.isSettling = false;
            this.settleStartTime = 0;
        }
    }
    
    getInitialWeightDifference() {
        return this.initialWeightDiff || 9;
    }
    
    setInitialWeightDifference(diff) {
        this.initialWeightDiff = Math.abs(diff);
        console.log('Initial weight difference set to:', this.initialWeightDiff);
    }
    
    update(deltaTime, groundHit = false) {
        const cappedDelta = Math.min(deltaTime, 100);
        const dt = cappedDelta / 16.67; // Normalize to 60fps
        
        const angleDiff = this.targetAngle - this.currentAngle;
        
        // Detect if we crossed the target (overshoot)
        const crossedTarget = (this.lastAngleDiff > 0 && angleDiff < 0) || 
                             (this.lastAngleDiff < 0 && angleDiff > 0);
        
        if (crossedTarget && Math.abs(this.lastAngleDiff) > 0.1) {
            this.overshootCount++;
            console.log(`🌊 Overshoot #${this.overshootCount}`);
        }
        
        this.lastAngleDiff = angleDiff;
        
        // Apply different physics based on overshoot count
        if (this.overshootCount >= 2) {
            // After 2 overshoots, settle quickly to target
            const settleSpeed = 0.3; // Fast settling
            this.currentAngle += angleDiff * settleSpeed;
            this.angularVelocity *= 0.8; // Heavy damping
            
            // Snap to target when very close
            if (Math.abs(angleDiff) < 0.1) {
                this.currentAngle = this.targetAngle;
                this.angularVelocity = 0;
            }
        } else {
            // Natural oscillation with spring-like physics
            const springStrength = 0.06; // How strongly it pulls toward target
            const damping = 0.92; // How much velocity is preserved (higher = more bouncy)
            
            // Acceleration toward target (spring force)
            const acceleration = angleDiff * springStrength;
            this.angularVelocity += acceleration;
            
            // Apply damping to velocity
            this.angularVelocity *= damping;
            
            // Update angle based on velocity
            this.currentAngle += this.angularVelocity * dt;
        }
        
        // Check if balanced
        if (this.isSettling && this.settleStartTime > 0) {
            const settleTime = Date.now() - this.settleStartTime;
            if (settleTime >= BALANCE_CONFIG.BALANCE_SETTLE_TIME) {
                this.isBalanced = (this.leftWeight === this.rightWeight);
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
        this.overshootCount = 0;
        this.lastAngleDiff = 0;
    }
    
    setAngle(angle) {
        this.currentAngle = angle;
        this.targetAngle = angle;
        this.angularVelocity = 0;
        this.overshootCount = 0;
    }
}
