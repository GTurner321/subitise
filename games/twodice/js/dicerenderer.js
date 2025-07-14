class DiceRenderer {
    constructor() {
        this.leftSide = document.getElementById('leftSide');
        this.rightSide = document.getElementById('rightSide');
        this.currentDice = [];
        this.rollTimeouts = [];
        this.animationFrames = [];
    }

    clearDice() {
        // Remove all existing dice from both sides
        this.currentDice.forEach(dice => {
            if (dice.parentNode) {
                dice.parentNode.removeChild(dice);
            }
        });
        this.currentDice = [];
        
        // Clear any pending timeouts and animation frames
        this.rollTimeouts.forEach(timeout => clearTimeout(timeout));
        this.rollTimeouts = [];
        
        this.animationFrames.forEach(frame => cancelAnimationFrame(frame));
        this.animationFrames = [];
    }

    createDice(value = 1) {
        const dice = document.createElement('div');
        dice.className = 'dice';
        
        // Start invisible and small
        dice.style.opacity = '0';
        dice.style.transform = `scale(${CONFIG.DICE_MIN_SCALE})`;
        
        // Create all 6 faces of the dice
        const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
        const faceValues = [1, 6, 2, 5, 3, 4]; // Opposite faces add to 7
        
        // Get random color for this dice
        const colorIndex = Math.floor(Math.random() * CONFIG.DICE_COLORS.length);
        const diceColor = CONFIG.DICE_COLORS[colorIndex];
        
        faces.forEach((faceClass, index) => {
            const face = document.createElement('div');
            face.className = `dice-face ${faceClass}`;
            face.style.backgroundColor = diceColor;
            
            // Create dots for this face with initial random value
            const initialValue = Math.floor(Math.random() * 6) + 1;
            this.createDots(face, initialValue);
            dice.appendChild(face);
        });
        
        return dice;
    }

    createDots(face, value) {
        const pattern = CONFIG.DICE_FACES[value];
        
        // Clear existing dots
        face.innerHTML = '';
        
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

    updateAllFaces(dice, value) {
        // Update all faces to show the same value (for consistency during roll)
        const faces = dice.querySelectorAll('.dice-face');
        faces.forEach(face => {
            this.createDots(face, value);
        });
    }

    getRandomRotationDirection() {
        const directions = [
            { axis: 'X', direction: 1 },  // flip down
            { axis: 'X', direction: -1 }, // flip up
            { axis: 'Y', direction: 1 },  // flip right
            { axis: 'Y', direction: -1 }  // flip left
        ];
        return directions[Math.floor(Math.random() * directions.length)];
    }

    async rollDice(leftValue, rightValue) {
        this.clearDice();
        
        console.log(`Rolling dice: Left=${leftValue}, Right=${rightValue}`);
        
        // Create two dice
        const leftDice = this.createDice();
        const rightDice = this.createDice();
        
        // Add dice to their respective sides
        this.leftSide.appendChild(leftDice);
        this.rightSide.appendChild(rightDice);
        
        this.currentDice = [leftDice, rightDice];
        
        // Generate random parameters for each dice
        const leftRotations = 6 + Math.floor(Math.random() * 7); // 6-12 rotations
        const rightRotations = 6 + Math.floor(Math.random() * 7); // 6-12 rotations
        
        const leftDirection = this.getRandomRotationDirection();
        const rightDirection = this.getRandomRotationDirection();
        
        // Calculate durations
        const rotationDuration = 500; // Each rotation takes 0.5 seconds
        const leftTotalDuration = leftRotations * rotationDuration;
        const rightTotalDuration = rightRotations * rotationDuration;
        
        console.log(`Left: ${leftRotations} rotations (${leftTotalDuration}ms), Right: ${rightRotations} rotations (${rightTotalDuration}ms)`);
        
        // Start both dice animations immediately
        const leftPromise = this.animateDice(leftDice, leftValue, leftRotations, leftDirection, rotationDuration);
        const rightPromise = this.animateDice(rightDice, rightValue, rightRotations, rightDirection, rotationDuration);
        
        // Wait for both dice to complete
        await Promise.all([leftPromise, rightPromise]);
        
        console.log('Both dice animations completed');
        return { left: leftValue, right: rightValue, total: leftValue + rightValue };
    }

    async animateDice(dice, finalValue, totalRotations, direction, rotationDuration) {
        return new Promise((resolve) => {
            let currentRotation = 0;
            let startTime = performance.now();
            
            // Start fade-in immediately
            dice.style.transition = 'opacity 1s ease-out, transform 1s ease-out';
            dice.style.opacity = '1';
            dice.style.transform = `scale(1)`;
            
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / (totalRotations * rotationDuration), 1);
                
                // Calculate current rotation based on progress
                const targetRotation = progress * totalRotations * 360;
                
                // Update rotation smoothly
                const rotateAxis = direction.axis === 'X' ? 'rotateX' : 'rotateY';
                const rotateValue = targetRotation * direction.direction;
                
                // Apply rotation with easing
                const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
                const easedRotation = easeOut * totalRotations * 360 * direction.direction;
                
                dice.style.transform = `${rotateAxis}(${easedRotation}deg) scale(1)`;
                
                // Change the face value during rotation for visual effect
                if (progress < 1) {
                    const currentFaceValue = Math.floor(Math.random() * 6) + 1;
                    this.updateAllFaces(dice, currentFaceValue);
                    
                    this.animationFrames.push(requestAnimationFrame(animate));
                } else {
                    // Animation complete - set final state
                    this.completeDiceAnimation(dice, finalValue, direction);
                    resolve();
                }
            };
            
            // Start the animation
            this.animationFrames.push(requestAnimationFrame(animate));
        });
    }

    completeDiceAnimation(dice, finalValue, direction) {
        // Set the final face value
        this.updateAllFaces(dice, finalValue);
        
        // Position dice to show the top face clearly
        // The final rotation should position the dice so the top face is visible
        const finalRotation = direction.axis === 'X' ? 'rotateX(-90deg)' : 'rotateY(0deg)';
        
        dice.style.transition = 'transform 0.3s ease-out';
        dice.style.transform = `${finalRotation} scale(1)`;
        
        // Add a final class for styling
        dice.classList.add('dice-final');
        
        console.log(`Dice animation completed with value: ${finalValue}`);
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
