class DiceRenderer {
    constructor() {
        this.leftSide = document.getElementById('leftSide');
        this.rightSide = document.getElementById('rightSide');
        this.currentDice = [];
        this.rollTimeouts = [];
        
        // Color mapping for each dice number
        this.numberColors = {
            1: '#ff6b6b',  // Red
            2: '#4ecdc4',  // Teal
            3: '#45b7d1',  // Blue
            4: '#f9ca24',  // Yellow
            5: '#f0932b',  // Orange
            6: '#6c5ce7'   // Purple
        };
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
        
        // Start invisible, no scaling
        dice.style.opacity = '0';
        dice.style.transform = 'rotateX(0deg) rotateY(0deg)';
        
        // Create all 6 faces of the dice
        const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
        
        faces.forEach((faceClass, index) => {
            const face = document.createElement('div');
            face.className = `dice-face ${faceClass}`;
            
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
        
        // Set face color based on the number
        face.style.backgroundColor = this.numberColors[value];
        
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
        // Update all faces to show the same value and color
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
            { transform: 'rotateY(-90deg)', name: 'left' },  // flip left
            { transform: 'rotateX(90deg) rotateY(90deg)', name: 'down-right' },   // diagonal
            { transform: 'rotateX(-90deg) rotateY(90deg)', name: 'up-right' },    // diagonal
            { transform: 'rotateX(90deg) rotateY(-90deg)', name: 'down-left' },   // diagonal
            { transform: 'rotateX(-90deg) rotateY(-90deg)', name: 'up-left' }     // diagonal
        ];
        return directions[Math.floor(Math.random() * directions.length)];
    }

    getRandomFlipDuration() {
        const durations = [0.35, 0.45, 0.55, 0.65];
        return durations[Math.floor(Math.random() * durations.length)];
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
            
            // Start fade-in immediately (no scaling)
            dice.style.transition = 'opacity 1s ease-out';
            dice.style.opacity = '1';
            
            console.log(`Starting ${totalFlips} flips for dice`);
            
            const performFlip = () => {
                if (currentFlip >= totalFlips) {
                    // Animation complete - set final state
                    this.completeDiceAnimation(dice, finalValue);
                    resolve();
                    return;
                }
                
                // Get random flip direction and duration
                const direction = this.getRandomFlipDirection();
                const flipDuration = this.getRandomFlipDuration();
                
                // Update rotation values based on direction
                if (direction.name === 'down') {
                    currentRotationX += 90;
                } else if (direction.name === 'up') {
                    currentRotationX -= 90;
                } else if (direction.name === 'right') {
                    currentRotationY += 90;
                } else if (direction.name === 'left') {
                    currentRotationY -= 90;
                } else if (direction.name === 'down-right') {
                    currentRotationX += 90;
                    currentRotationY += 90;
                } else if (direction.name === 'up-right') {
                    currentRotationX -= 90;
                    currentRotationY += 90;
                } else if (direction.name === 'down-left') {
                    currentRotationX += 90;
                    currentRotationY -= 90;
                } else if (direction.name === 'up-left') {
                    currentRotationX -= 90;
                    currentRotationY -= 90;
                }
                
                // Apply the rotation with random duration
                dice.style.transition = `transform ${flipDuration}s ease-in-out`;
                dice.style.transform = `rotateX(${currentRotationX}deg) rotateY(${currentRotationY}deg)`;
                
                // Change the face value during flip for visual effect
                const randomFaceValue = Math.floor(Math.random() * 6) + 1;
                this.updateAllFaces(dice, randomFaceValue);
                
                console.log(`Flip ${currentFlip + 1}/${totalFlips}: ${direction.name} (${flipDuration}s) (X: ${currentRotationX}, Y: ${currentRotationY})`);
                
                currentFlip++;
                
                // Schedule next flip after current flip duration
                const timeout = setTimeout(performFlip, flipDuration * 1000);
                this.rollTimeouts.push(timeout);
            };
            
            // Start first flip after a short delay to let fade-in begin
            const initialTimeout = setTimeout(performFlip, 200);
            this.rollTimeouts.push(initialTimeout);
        });
    }

    completeDiceAnimation(dice, finalValue) {
        // Set the final face value and color
        this.updateAllFaces(dice, finalValue);
        
        // Position dice to show the top face clearly (final flip down)
        dice.style.transition = 'transform 0.5s ease-out';
        dice.style.transform = 'rotateX(-90deg)';
        
        // Add a final class for styling
        dice.classList.add('dice-final');
        
        console.log(`Dice animation completed with final value: ${finalValue}`);
    }

    async fadeOutCurrentDice() {
        if (this.currentDice.length === 0) return;
        
        console.log('Fading out current dice');
        
        // Start fade-out for current dice
        this.currentDice.forEach(dice => {
            if (dice && dice.parentNode) {
                dice.style.transition = 'opacity 0.5s ease-out';
                dice.style.opacity = '0';
            }
        });
        
        // Wait for fade-out to complete
        return new Promise(resolve => {
            const timeout = setTimeout(() => {
                // Remove the dice after fade-out
                this.currentDice.forEach(dice => {
                    if (dice && dice.parentNode) {
                        dice.parentNode.removeChild(dice);
                    }
                });
                this.currentDice = [];
                resolve();
            }, 500);
            this.rollTimeouts.push(timeout);
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
