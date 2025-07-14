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
        
        // Start invisible and small
        dice.style.opacity = '0';
        dice.style.transform = `scale(${CONFIG.DICE_MIN_SCALE})`;
        
        // Create all 6 faces of the dice
        const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
        
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

    getRandomFlipDirection() {
        const directions = [
            { transform: 'rotateX(90deg)', name: 'down' },   // flip down
            { transform: 'rotateX(-90deg)', name: 'up' },    // flip up
            { transform: 'rotateY(90deg)', name: 'right' },  // flip right
            { transform: 'rotateY(-90deg)', name: 'left' }   // flip left
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
        const leftFlips = 6 + Math.floor(Math.random() * 7); // 6-12 flips
        const rightFlips = 6 + Math.floor(Math.random() * 7); // 6-12 flips
        
        console.log(`Left: ${leftFlips} flips, Right: ${rightFlips} flips`);
        
        // Start both dice animations immediately
        const leftPromise = this.animateDice(leftDice, leftValue, leftFlips);
        const rightPromise = this.animateDice(rightDice, rightValue, rightFlips);
        
        // Wait for both dice to complete
        await Promise.all([leftPromise, rightPromise]);
        
        console.log('Both dice animations completed');
        return { left: leftValue, right: rightValue, total: leftValue + rightValue };
    }

    async animateDice(dice, finalValue, totalFlips) {
        return new Promise((resolve) => {
            let currentFlip = 0;
            let currentRotationX = 0;
            let currentRotationY = 0;
            
            // Start fade-in immediately
            dice.style.transition = 'opacity 1s ease-out, transform 1s ease-out';
            dice.style.opacity = '1';
            dice.style.transform = `scale(1)`;
            
            console.log(`Starting ${totalFlips} flips for dice`);
            
            const performFlip = () => {
                if (currentFlip >= totalFlips) {
                    // Animation complete - set final state
                    this.completeDiceAnimation(dice, finalValue);
                    resolve();
                    return;
                }
                
                // Get random flip direction
                const direction = this.getRandomFlipDirection();
                
                // Update rotation values based on direction
                if (direction.name === 'down') {
                    currentRotationX += 90;
                } else if (direction.name === 'up') {
                    currentRotationX -= 90;
                } else if (direction.name === 'right') {
                    currentRotationY += 90;
                } else if (direction.name === 'left') {
                    currentRotationY -= 90;
                }
                
                // Apply the rotation with 0.5 second transition
                dice.style.transition = 'transform 0.5s ease-in-out';
                dice.style.transform = `rotateX(${currentRotationX}deg) rotateY(${currentRotationY}deg) scale(1)`;
                
                // Change the face value during flip for visual effect
                const randomFaceValue = Math.floor(Math.random() * 6) + 1;
                this.updateAllFaces(dice, randomFaceValue);
                
                console.log(`Flip ${currentFlip + 1}/${totalFlips}: ${direction.name} (X: ${currentRotationX}, Y: ${currentRotationY})`);
                
                currentFlip++;
                
                // Schedule next flip after 0.5 seconds
                const timeout = setTimeout(performFlip, 500);
                this.rollTimeouts.push(timeout);
            };
            
            // Start first flip after a short delay to let fade-in begin
            const initialTimeout = setTimeout(performFlip, 200);
            this.rollTimeouts.push(initialTimeout);
        });
    }

    completeDiceAnimation(dice, finalValue) {
        // Set the final face value
        this.updateAllFaces(dice, finalValue);
        
        // Position dice to show the top face clearly (final flip down)
        dice.style.transition = 'transform 0.5s ease-out';
        dice.style.transform = 'rotateX(-90deg) scale(1)';
        
        // Add a final class for styling
        dice.classList.add('dice-final');
        
        console.log(`Dice animation completed with final value: ${finalValue}`);
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
