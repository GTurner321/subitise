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
        
        // Create all 6 faces of the dice
        const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
        const faceValues = [1, 6, 2, 5, 3, 4]; // Opposite faces add to 7
        
        faces.forEach((faceClass, index) => {
            const face = document.createElement('div');
            face.className = `dice-face ${faceClass}`;
            
            // Get random color for this dice
            const colorIndex = Math.floor(Math.random() * CONFIG.DICE_COLORS.length);
            face.style.backgroundColor = CONFIG.DICE_COLORS[colorIndex];
            
            // Create dots for this face
            this.createDots(face, faceValues[index]);
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
        
        // Create two dice
        const leftDice = this.createDice();
        const rightDice = this.createDice();
        
        // Add dice to their respective sides
        this.leftSide.appendChild(leftDice);
        this.rightSide.appendChild(rightDice);
        
        this.currentDice = [leftDice, rightDice];
        
        // Start rolling animation
        leftDice.classList.add('rolling');
        rightDice.classList.add('rolling');
        
        // Random roll durations for each dice
        const leftDuration = Math.random() * (CONFIG.DICE_ROLL_MAX_DURATION - CONFIG.DICE_ROLL_MIN_DURATION) + CONFIG.DICE_ROLL_MIN_DURATION;
        const rightDuration = Math.random() * (CONFIG.DICE_ROLL_MAX_DURATION - CONFIG.DICE_ROLL_MIN_DURATION) + CONFIG.DICE_ROLL_MIN_DURATION;
        
        console.log(`Rolling dice: Left for ${leftDuration}ms, Right for ${rightDuration}ms`);
        
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
            this.updateDiceFace(leftDice, leftValue);
            console.log(`Left dice stopped with value: ${leftValue}`);
        }, leftDuration);
        this.rollTimeouts.push(leftTimeout);
        
        // Stop right dice
        const rightTimeout = setTimeout(() => {
            clearInterval(rightInterval);
            rightDice.classList.remove('rolling');
            rightDice.classList.add('final');
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
