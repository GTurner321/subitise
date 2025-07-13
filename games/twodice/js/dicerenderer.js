class DiceRenderer {
    constructor() {
        this.leftSide = document.getElementById('leftSide');
        this.rightSide = document.getElementById('rightSide');
        this.currentDice = [];
        this.rollTimeouts = [];
    }

    clearDice() {
        // Remove all existing dice from both sides
        this.currentDice.forEach(dice => {
            if (dice.parentNode) {
                dice.parentNode.removeChild(dice);
            }
        });
        this.currentDice = [];
        
        // Clear any pending timeouts
        this.rollTimeouts.forEach(timeout => clearTimeout(timeout));
        this.rollTimeouts = [];
    }

    createDice(value = 1) {
        const dice = document.createElement('div');
        dice.className = 'dice';
        
        // Start invisible to prevent initial (6,6) flash
        dice.style.opacity = '0';
        dice.style.transform = `scale(${CONFIG.DICE_MIN_SCALE})`;
        
        // Create all 6 faces of the dice
        const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
        const faceValues = [1, 6, 2, 5, 3, 4]; // Opposite faces add to 7
        
        faces.forEach((faceClass, index) => {
            const face = document.createElement('div');
            face.className = `dice-face ${faceClass}`;
            
            // Get random color for this dice
            const colorIndex = Math.floor(Math.random() * CONFIG.DICE_COLORS.length);
            face.style.backgroundColor = CONFIG.DICE_COLORS[colorIndex];
            
            // Create dots for this face with random initial value to avoid (6,6) flash
            const randomInitialValue = Math.floor(Math.random() * 6) + 1;
            this.createDots(face, randomInitialValue);
            dice.appendChild(face);
        });
        
        return dice;
    }

    createDots(face, value) {
        const pattern = CONFIG.DICE_FACES[value];
        
        // Create 9 dot positions in 3x3 grid
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const dot = document.createElement('div');
                dot.className = 'dice-dot';
                
                // Show dot if pattern says so
                if (pattern[row][col] === 1) {
                    dot.classList.add('active');
                }
                
                face.appendChild(dot);
            }
        }
    }

    updateDiceFace(dice, value) {
        // Update the top face (which will be visible in final position)
        const topFace = dice.querySelector('.dice-face.top');
        if (topFace) {
            // Clear existing dots
            topFace.innerHTML = '';
            
            // Create new dots for the value
            this.createDots(topFace, value);
        }
    }

    async rollDice(leftValue, rightValue) {
        this.clearDice();
        
        // Create two dice (they start invisible)
        const leftDice = this.createDice();
        const rightDice = this.createDice();
        
        // Add dice to their respective sides
        this.leftSide.appendChild(leftDice);
        this.rightSide.appendChild(rightDice);
        
        this.currentDice = [leftDice, rightDice];
        
        // Start with fade-in animation (this makes them visible)
        leftDice.classList.add('fade-in');
        rightDice.classList.add('fade-in');
        
        // Wait for fade-in to complete, then start rolling
        await new Promise(resolve => setTimeout(resolve, CONFIG.DICE_FADE_IN_DURATION));
        
        // Generate random roll durations (to nearest tenth of a second)
        const leftDuration = Math.round((Math.random() * (CONFIG.DICE_ROLL_MAX_DURATION - CONFIG.DICE_ROLL_MIN_DURATION) + CONFIG.DICE_ROLL_MIN_DURATION) / 100) * 100;
        const rightDuration = Math.round((Math.random() * (CONFIG.DICE_ROLL_MAX_DURATION - CONFIG.DICE_ROLL_MIN_DURATION) + CONFIG.DICE_ROLL_MIN_DURATION) / 100) * 100;
        
        console.log(`Rolling dice: Left for ${leftDuration}ms, Right for ${rightDuration}ms`);
        
        // Set up CSS custom properties for scaling animation
        leftDice.style.setProperty('--grow-duration', `${leftDuration}ms`);
        rightDice.style.setProperty('--grow-duration', `${rightDuration}ms`);
        leftDice.style.setProperty('--current-scale', CONFIG.DICE_MIN_SCALE);
        rightDice.style.setProperty('--current-scale', CONFIG.DICE_MIN_SCALE);
        
        // Remove fade-in and start rolling (dice remain visible)
        leftDice.classList.remove('fade-in');
        rightDice.classList.remove('fade-in');
        leftDice.classList.add('rolling');
        rightDice.classList.add('rolling');
        
        // Change faces rapidly during roll
        const changeIntervals = [];
        
        // Left dice face changes
        const leftInterval = setInterval(() => {
            const randomValue = Math.floor(Math.random() * 6) + 1;
            this.updateDiceFace(leftDice, randomValue);
        }, CONFIG.DICE_CHANGE_SPEED);
        changeIntervals.push(leftInterval);
        
        // Right dice face changes
        const rightInterval = setInterval(() => {
            const randomValue = Math.floor(Math.random() * 6) + 1;
            this.updateDiceFace(rightDice, randomValue);
        }, CONFIG.DICE_CHANGE_SPEED);
        changeIntervals.push(rightInterval);
        
        // Stop left dice
        const leftTimeout = setTimeout(() => {
            clearInterval(leftInterval);
            leftDice.classList.remove('rolling');
            leftDice.classList.add('final');
            leftDice.style.transform = 'rotateX(-90deg) scale(1)';
            this.updateDiceFace(leftDice, leftValue);
            console.log(`Left dice stopped with value: ${leftValue}`);
        }, leftDuration);
        this.rollTimeouts.push(leftTimeout);
        
        // Stop right dice
        const rightTimeout = setTimeout(() => {
            clearInterval(rightInterval);
            rightDice.classList.remove('rolling');
            rightDice.classList.add('final');
            rightDice.style.transform = 'rotateX(-90deg) scale(1)';
            this.updateDiceFace(rightDice, rightValue);
            console.log(`Right dice stopped with value: ${rightValue}`);
        }, rightDuration);
        this.rollTimeouts.push(rightTimeout);
        
        // Return promise that resolves when both dice have stopped
        return new Promise((resolve) => {
            const maxDuration = Math.max(leftDuration, rightDuration);
            const finalTimeout = setTimeout(() => {
                // Clean up intervals
                changeIntervals.forEach(interval => clearInterval(interval));
                resolve({ left: leftValue, right: rightValue, total: leftValue + rightValue });
            }, maxDuration + 100); // Small buffer to ensure dice have stopped
            this.rollTimeouts.push(finalTimeout);
        });
    }

    getCurrentValues() {
        // This would be used if we need to check current dice values
        // For now, we track values in the game controller
        return { left: 0, right: 0, total: 0 };
    }

    reset() {
        this.clearDice();
    }
}
