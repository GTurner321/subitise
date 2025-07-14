class DiceRenderer {
    constructor() {
        this.leftSide = document.getElementById('leftSide');
        this.rightSide = document.getElementById('rightSide');
        this.currentDice = [];
        this.rollTimeouts = [];
        
        // Available colors for dice (will be randomly assigned)
        this.availableColors = [
            '#ff6b6b',  // Red
            '#4ecdc4',  // Teal
            '#45b7d1',  // Blue
            '#f9ca24',  // Yellow
            '#f0932b',  // Orange
            '#6c5ce7'   // Purple
        ];
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

    getRandomDiceColors() {
        // Randomly select two different colors
        const shuffled = [...this.availableColors].sort(() => Math.random() - 0.5);
        return {
            left: shuffled[0],
            right: shuffled[1]
        };
    }

    createDice(diceColor) {
        const dice = document.createElement('div');
        dice.className = 'dice';
        
        // Start invisible
        dice.style.opacity = '0';
        dice.style.transform = 'rotateX(0deg) rotateY(0deg)';
        dice.style.transformStyle = 'preserve-3d'; // Ensure 3D context
        
        // Create all 6 faces of the dice
        const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
        
        faces.forEach((faceClass, index) => {
            const face = document.createElement('div');
            face.className = `dice-face ${faceClass}`;
            face.style.backgroundColor = diceColor; // Fixed color for this dice
            face.style.setProperty('--face-color', diceColor); // CSS variable for inset shadow
            face.style.opacity = '0'; // Start faces invisible too
            
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
        // DON'T update all faces to the same value - this kills the 3D effect!
        // Instead, update only the currently visible face based on rotation
        // Let the 3D rotation show different faces naturally
        
        // For now, just update the top face (which should be visible at rotateX(-90))
        const topFace = dice.querySelector('.dice-face.top');
        if (topFace) {
            this.createDots(topFace, value);
        }
    }

    getDiagonalDirections() {
        return [
            { rotX: 90, rotY: 90, name: 'down-right', opposite: 'up-left' },     // Flip down AND right
            { rotX: -90, rotY: 90, name: 'up-right', opposite: 'down-left' },    // Flip up AND right  
            { rotX: 90, rotY: -90, name: 'down-left', opposite: 'up-right' },    // Flip down AND left
            { rotX: -90, rotY: -90, name: 'up-left', opposite: 'down-right' }    // Flip up AND left
        ];
    }

    getRandomDiagonalDirection(excludeOpposite = null) {
        const directions = this.getDiagonalDirections();
        const availableDirections = excludeOpposite 
            ? directions.filter(dir => dir.name !== excludeOpposite)
            : directions;
        
        return availableDirections[Math.floor(Math.random() * availableDirections.length)];
    }

    getRandomFlipDuration() {
        const durations = [0.35, 0.45, 0.55, 0.65];
        return durations[Math.floor(Math.random() * durations.length)];
    }

    async rollDice(leftValue, rightValue) {
        // DON'T call clearDice() here - fadeOutCurrentDice() handles cleanup
        console.log(`=== STARTING NEW ROLL: Left=${leftValue}, Right=${rightValue} ===`);
        
        // Get random colors for each dice (ensuring they're different)
        const colors = this.getRandomDiceColors();
        console.log(`Dice colors: Left=${colors.left}, Right=${colors.right}`);
        
        // Create two dice with their assigned colors
        const leftDice = this.createDice(colors.left);
        const rightDice = this.createDice(colors.right);
        
        // Add dice to their respective sides
        this.leftSide.appendChild(leftDice);
        this.rightSide.appendChild(rightDice);
        
        this.currentDice = [leftDice, rightDice];
        console.log('Dice created and added to DOM, starting fade-in...');
        
        // Force a reflow to ensure dice are in DOM before animation
        leftDice.offsetHeight;
        rightDice.offsetHeight;
        
        // Clear any existing transitions and set initial state
        leftDice.style.transition = 'none';
        rightDice.style.transition = 'none';
        leftDice.style.opacity = '0';
        rightDice.style.opacity = '0';
        
        // Start fade-in for both dice with more delay
        setTimeout(() => {
            console.log('=== STARTING FADE-IN (1 second) ===');
            
            // Set opacity on both container and all faces
            [leftDice, rightDice].forEach((dice, index) => {
                dice.style.transition = 'opacity 1s ease-in !important';
                dice.style.opacity = '1';
                
                // Also ensure all faces fade in
                const faces = dice.querySelectorAll('.dice-face');
                faces.forEach(face => {
                    face.style.transition = 'opacity 1s ease-in !important';
                    face.style.opacity = '1';
                });
                
                console.log(`Dice ${index + 1}: Set container and ${faces.length} faces to fade in`);
            });
            
            // Log opacity after setting
            setTimeout(() => {
                console.log(`Left dice opacity: ${leftDice.style.opacity}, Right dice opacity: ${rightDice.style.opacity}`);
                console.log(`Left dice computed opacity: ${getComputedStyle(leftDice).opacity}`);
            }, 100);
        }, 200);
        
        // Generate random parameters for each dice
        const leftFlips = 6 + Math.floor(Math.random() * 7); // 6-12 flips
        const rightFlips = 6 + Math.floor(Math.random() * 7); // 6-12 flips
        
        console.log(`Left: ${leftFlips} flips, Right: ${rightFlips} flips`);
        
        // Start both dice animations independently
        const leftPromise = this.animateDice(leftDice, leftValue, leftFlips);
        const rightPromise = this.animateDice(rightDice, rightValue, rightFlips);
        
        // Wait for both dice to complete
        await Promise.all([leftPromise, rightPromise]);
        
        console.log('=== BOTH DICE ANIMATIONS COMPLETED ===');
        return { left: leftValue, right: rightValue, total: leftValue + rightValue };
    }

    async animateDice(dice, finalValue, totalFlips) {
        return new Promise((resolve) => {
            let currentFlip = 0;
            let currentRotationX = 0;
            let currentRotationY = 0;
            let lastDirection = null;
            let currentFaceValue = Math.floor(Math.random() * 6) + 1;
            
            console.log(`Starting ${totalFlips} flips for dice`);
            
            const performFlip = () => {
                if (currentFlip >= totalFlips) {
                    // Animation complete - just set the final value, no positioning change
                    console.log(`=== DICE ANIMATION COMPLETE - Final value: ${finalValue} ===`);
                    this.updateAllFaces(dice, finalValue);
                    dice.classList.add('dice-final');
                    resolve();
                    return;
                }
                
                // Get random diagonal direction (avoiding opposite of last direction)
                const direction = this.getRandomDiagonalDirection(
                    lastDirection ? lastDirection.opposite : null
                );
                const flipDuration = this.getRandomFlipDuration();
                
                // Calculate the NEW rotation values (this is where we'll end up)
                const newRotationX = currentRotationX + direction.rotX;
                const newRotationY = currentRotationY + direction.rotY;
                
                console.log(`Direction: ${direction.name}, From: rotX=${currentRotationX}, rotY=${currentRotationY} To: rotX=${newRotationX}, rotY=${newRotationY}`);
                
                // For the LAST flip, use the final value, otherwise use random
                let newFaceValue;
                if (currentFlip === totalFlips - 1) {
                    // This is the last flip - show the final value
                    newFaceValue = finalValue;
                } else {
                    // Not the last flip - generate random value (different from current)
                    do {
                        newFaceValue = Math.floor(Math.random() * 6) + 1;
                    } while (newFaceValue === currentFaceValue);
                }
                
                // Clear any existing transition first to ensure clean state
                dice.style.transition = 'none';
                
                // Force reflow
                dice.offsetHeight;
                
                // Update face value at the START of the flip (so it changes as we rotate)
                this.updateAllFaces(dice, newFaceValue);
                
                // Apply the rotation animation - this creates the visual flip
                dice.style.transition = `transform ${flipDuration}s ease-in-out`;
                dice.style.transform = `rotateX(${newRotationX}deg) rotateY(${newRotationY}deg)`;
                
                console.log(`Flip ${currentFlip + 1}/${totalFlips}: ${direction.name} (${flipDuration}s) - Face: ${newFaceValue}`);
                console.log(`Applied transform: rotateX(${newRotationX}deg) rotateY(${newRotationY}deg)`);
                console.log(`CSS transition: ${dice.style.transition}`);
                console.log(`CSS transform: ${dice.style.transform}`);
                
                // Update our tracking variables for next flip
                currentRotationX = newRotationX;
                currentRotationY = newRotationY;
                currentFaceValue = newFaceValue;
                lastDirection = direction;
                currentFlip++;
                
                // Schedule next flip after current flip duration
                const timeout = setTimeout(performFlip, flipDuration * 1000);
                this.rollTimeouts.push(timeout);
            };
            
            // Start first flip after a short delay to let fade-in begin
            const initialTimeout = setTimeout(performFlip, 300);
            this.rollTimeouts.push(initialTimeout);
        });
    }

    completeDiceAnimation(dice, finalValue) {
        console.log(`=== COMPLETING DICE ANIMATION ===`);
        
        // Clear any ongoing transitions first
        dice.style.transition = 'none';
        
        // Set the final face value
        this.updateAllFaces(dice, finalValue);
        
        // Wait a moment, then apply final positioning smoothly
        setTimeout(() => {
            dice.style.transition = 'transform 0.8s ease-out';
            dice.style.transform = 'rotateX(-90deg) rotateY(0deg)';
            
            console.log(`Final positioning applied for value: ${finalValue}`);
        }, 100);
        
        // Add a final class for styling
        dice.classList.add('dice-final');
    }

    async fadeOutCurrentDice() {
        if (this.currentDice.length === 0) {
            console.log('No dice to fade out');
            return;
        }
        
        console.log('=== STARTING FADE-OUT (1 second) ===');
        
        // Start fade-out for current dice
        this.currentDice.forEach((dice, index) => {
            if (dice && dice.parentNode) {
                console.log(`Fading out dice ${index + 1}`);
                
                // Clear any existing transition first
                dice.style.transition = 'none';
                
                // Also clear transitions on all faces
                const faces = dice.querySelectorAll('.dice-face');
                faces.forEach(face => {
                    face.style.transition = 'none';
                });
                
                // Force reflow
                dice.offsetHeight;
                
                // Apply fade-out transition to container and faces
                dice.style.transition = 'opacity 1s ease-out !important';
                dice.style.opacity = '0';
                
                faces.forEach(face => {
                    face.style.transition = 'opacity 1s ease-out !important';
                    face.style.opacity = '0';
                });
                
                console.log(`Dice ${index + 1}: Set container and ${faces.length} faces to fade out`);
            }
        });
        
        // Wait for fade-out to complete
        return new Promise(resolve => {
            const timeout = setTimeout(() => {
                console.log('=== FADE-OUT COMPLETE, REMOVING DICE ===');
                // Remove the dice after fade-out
                this.currentDice.forEach((dice, index) => {
                    if (dice && dice.parentNode) {
                        console.log(`Removing dice ${index + 1} from DOM`);
                        dice.parentNode.removeChild(dice);
                    }
                });
                this.currentDice = [];
                resolve();
            }, 1000);
            this.rollTimeouts.push(timeout);
        });
    }

    getCurrentValues() {
        return { left: 0, right: 0, total: 0 };
    }

    reset() {
        this.clearDice();
    }
}
