/**
 * BalancePhysics - Handles seesaw physics and animation
 * REDESIGNED: Proper weight-based physics with ground-touching starting position
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
        
        // NEW: Calculate maximum angle (when bar end touches ground)
        this.maxGroundAngle = this.calculateMaxGroundAngle();
        console.log('Physics initialized with max ground angle:', this.maxGroundAngle.toFixed(2) + '°');
    }
    
    /**
     * Calculate the angle when the bar end just touches the ground
     * This is based on the pivot height and bar width
     */
    calculateMaxGroundAngle() {
        // Get pivot and bar dimensions from config
        const pivotHeight = BALANCE_CONFIG.PIVOT_HEIGHT_PERCENT;
        const barWidth = BALANCE_CONFIG.SEESAW_WIDTH_PERCENT;
        const halfBarWidth = barWidth / 2;
        
        // The pivot point is at the top of the triangle
        // When bar end touches ground, it forms a right triangle:
        // - Opposite side: pivot height (vertical distance)
        // - Adjacent side: half bar width (horizontal distance)
        // - Angle: arcsin(opposite / hypotenuse)
        
        // Actually we need: sin(angle) = pivotHeight / halfBarWidth (in percentage units)
        // But they're both percentages, so we need actual pixel ratio
        // Since we don't have viewport yet, use the ratio
        
        // The bar endpoint is at distance halfBarWidth from pivot
        // When it touches ground, vertical drop is pivotHeight
        // angle = arcsin(pivotHeight / halfBarWidth)
        
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
            this.hitGround = false;
            this.isLocked = false;
            this.groundBounceCount = 0;
        }
        
        const weightDiff = rightWeight - leftWeight;
        
        if (Math.abs(weightDiff) < 0.1) {
            // Perfectly balanced - target is level
            this.targetAngle = 0;
            this.isSettling = true;
            
            if (this.settleStartTime === 0 && !this.isBalanced) {
                this.settleStartTime = Date.now();
            }
            
            console.log('⚖️ BALANCED - target angle: 0°');
        } else {
            // NEW PHYSICS: Map weight difference to angle
            const initialWeightDiff = this.getInitialWeightDifference();
            
            if (initialWeightDiff > 0) {
                // Calculate angle proportionally
                const ratio = weightDiff / initialWeightDiff;
                this.targetAngle = ratio * this.maxGroundAngle;
                
                const degreesPerUnit = this.maxGroundAngle / initialWeightDiff;
                
                console.log(`📊 Weight diff: ${weightDiff}, Initial: ${initialWeightDiff}, Ratio: ${ratio.toFixed(2)}`);
                console.log(`📐 Target angle: ${this.targetAngle.toFixed(1)}° (${degreesPerUnit.toFixed(1)}° per unit)`);
                console.log(`🎯 Current angle: ${this.currentAngle.toFixed(1)}°, Diff: ${(this.targetAngle - this.currentAngle).toFixed(1)}°`);
            } else {
                // Fallback if we don't know initial difference
                const sensitivity = this.maxGroundAngle / 9;
                this.targetAngle = Math.max(-this.maxGroundAngle, Math.min(this.maxGroundAngle, weightDiff * sensitivity));
                
                console.log(`⚠️ Using fallback physics: target ${this.targetAngle.toFixed(1)}°`);
            }
            
            this.isSettling = false;
            this.settleStartTime = 0;
        }
    }
    
    /**
     * Get the initial weight difference from the question
     * This is stored when the question starts
     */
    getInitialWeightDifference() {
        // This will be set by the game controller when starting a question
        return this.initialWeightDiff || 9; // Default to 9 if not set
    }
    
    /**
     * Set the initial weight difference for the current question
     * Called by game controller when starting a new question
     */
    setInitialWeightDifference(diff) {
        this.initialWeightDiff = Math.abs(diff);
        console.log('Initial weight difference set to:', this.initialWeightDiff);
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
        
        // FIXED: Much stronger acceleration for more responsive movement
        const acceleration = angleDiff * 0.08; // Increased from 0.04
        this.angularVelocity += acceleration;
        
        // FIXED: Less damping so movement is visible
        this.angularVelocity *= 0.98; // Increased from 0.96
        
        if (groundHit && !this.hitGround) {
            this.angularVelocity *= -BALANCE_CONFIG.BOUNCE_DAMPENING;
            this.hitGround = true;
            this.groundBounceCount++;
            
            console.log(`Ground bounce #${this.groundBounceCount}, angle: ${this.currentAngle.toFixed(1)}°, target: ${this.targetAngle.toFixed(1)}°`);
            
            // FIXED: Only lock after settling near target, not just after bounces
            if (this.groundBounceCount >= 3 && Math.abs(angleDiff) < 0.5) {
                this.currentAngle = this.targetAngle;
                this.angularVelocity = 0;
                this.isLocked = true;
                this.isBalanced = (this.leftWeight === this.rightWeight);
                console.log('Physics locked after ground bounces and settling');
            }
        } else if (!groundHit) {
            this.hitGround = false;
        }
        
        this.currentAngle += this.angularVelocity * dt;
        
        if (this.isSettling && !groundHit) {
            this.currentAngle *= 0.95; // Less aggressive damping
            this.angularVelocity *= 0.90; // Less aggressive damping
            
            if (Math.abs(this.currentAngle) < 0.05 && Math.abs(this.angularVelocity) < 0.05) {
                this.currentAngle = 0;
                this.angularVelocity = 0;
                this.isLocked = true;
                this.isBalanced = true;
                console.log('Physics locked at mid-air equilibrium');
            }
        }
        
        // FIXED: Don't auto-balance based on time, only when locked and weights equal
        if (this.isSettling && this.settleStartTime > 0 && !groundHit) {
            const settleTime = Date.now() - this.settleStartTime;
            if (settleTime >= BALANCE_CONFIG.BALANCE_SETTLE_TIME && Math.abs(angleDiff) < 0.1) {
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
        this.hitGround = false;
        this.lastUpdateTime = 0;
        this.isLocked = false;
        this.groundBounceCount = 0;
        // Don't reset initialWeightDiff - it's set per question
    }
    
    setAngle(angle) {
        this.currentAngle = angle;
        this.targetAngle = angle;
        this.angularVelocity = 0;
        this.isLocked = false;
        this.groundBounceCount = 0;
    }
}
