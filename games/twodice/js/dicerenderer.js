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

    getDiagonalDirections() {
        return [
            { rotX: 90, rotY: 90, name: 'down-right', opposite: 'up-left' },
            { rotX: -90, rotY: 90, name: 'up-right', opposite: 'down-left' },
            { rotX: 90, rotY: -90, name: 'down-left', opposite: 'up-right' },
            { rotX: -90, rotY: -90, name: 'up-left', opposite: 'down-right' }
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

    // Create a realistic dice with proper face values (1-6 on opposite faces adding to 7)
    createRealisticDice(diceColor) {
        const dice = document.createElement('div');
        dice.className = 'dice';
        
        // Start invisible
        dice.style.opacity = '0';
        dice.style.transform = 'rotateX(0deg) rotateY(0deg)';
        dice.style.transformStyle = 'preserve-3d';
        
        // Standard dice configuration - opposite faces add to 7
        const faceValues = {
            'front': 1,
            'back': 6,    // opposite of front (1)
            'right': 2, 
            'left': 5,    // opposite of right (2)
            'top': 3,
            'bottom': 4   // opposite of top (3)
        };
        
        // Create all 6 faces with realistic values
        Object.entries(faceValues).forEach(([faceClass, faceValue]) => {
            const face = document.createElement('div');
            face.className = `dice-face ${faceClass}`;
            face.style.backgroundColor = diceColor;
            face.style.setProperty('--face-color', diceColor);
            face.style.opacity = '0'; // Start faces invisible
            
            this.createDots(face, faceValue);
            dice.appendChild(face);
        });
        
        // Track which face is currently visible (starts with front)
        dice.dataset.currentVisibleFace = 'front';
        dice.dataset.currentVisibleValue = '1';
        
        console.log(`Created realistic dice with standard 1-6 configuration`);
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

    // Track which face becomes visible after a diagonal rotation
    updateVisibleFace(dice, rotation) {
        const currentFace = dice.dataset.currentVisibleFace;
        
        // Mapping of face transitions for each diagonal rotation
        const faceTransitions = {
            'front': {
                'down-right': 'bottom',   // 1 → 4
                'up-right': 'top',        // 1 → 3
                'down-left': 'bottom',    // 1 → 4
                'up-left': 'top'          // 1 → 3
            },
            'back': {
                'down-right': 'bottom',   // 6 → 4
                'up-right': 'top',        // 6 → 3
                'down-left': 'bottom',    // 6 → 4
                'up-left': 'top'          // 6 → 3
            },
            'right': {
                'down-right': 'bottom',   // 2 → 4
                'up-right': 'top',        // 2 → 3
                'down-left': 'front',     // 2 → 1
                'up-left': 'back'         // 2 → 6
            },
            'left': {
                'down-right': 'front',    // 5 → 1
                'up-right': 'back',       // 5 → 6
                'down-left': 'bottom',    // 5 → 4
                'up-left': 'top'          // 5 → 3
            },
            'top': {
                'down-right': 'back',     // 3 → 6
                'up-right': 'front',      // 3 → 1
                'down-left': 'back',      // 3 → 6
                'up-left': 'front'        // 3 → 1
            },
            'bottom': {
                'down-right': 'front',    // 4 → 1
                'up-right': 'back',       // 4 → 6
                'down-left': 'front',     // 4 → 1
                'up-left': 'back'         // 4 → 6
            }
        };
        
        const newFace = faceTransitions[currentFace]?.[rotation.name] || currentFace;
        
        // Update the tracking data
        dice.dataset.currentVisibleFace = newFace;
        
        // Map face to value
        const faceToValue = {
            'front': 1, 'back': 6, 'right': 2, 'left': 5, 'top': 3, 'bottom': 4
        };
        
        const newValue = faceToValue[newFace];
        dice.dataset.currentVisibleValue = newValue;
        
        console.log(`After ${rotation.name}: ${newFace} face visible (value: ${newValue})`);
        return newValue;
    }

    async rollDice(leftValue, rightValue) {
        console.log(`=== STARTING REALISTIC DICE ROLL: Left=${leftValue}, Right=${rightValue} ===`);
        
        // Get random colors for each dice (ensuring they're different)
        const colors = this.getRandomDiceColors();
        console.log(`Dice colors: Left=${colors.left}, Right=${colors.right}`);
        
        // Create two realistic dice
        const leftDice = this.createRealisticDice(colors.left);
        const rightDice = this.createRealisticDice(colors.right);
        
        // Add dice to their respective sides
        this.leftSide.appendChild(leftDice);
        this.rightSide.appendChild(rightDice);
        
        this.currentDice = [leftDice, rightDice];
        console.log('Realistic dice created and added to DOM, starting fade-in...');
        
        // Force a reflow to ensure dice are in DOM before animation
        leftDice.offsetHeight;
        rightDice.offsetHeight;
        
        // Clear any existing transitions and set initial state
        leftDice.style.transition = 'none';
        rightDice.style.transition = 'none';
        leftDice.style.opacity = '0';
        rightDice.style.opacity = '0';
        
        // Start fade-in for both dice
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
        }, 200);
        
        // Start both dice rolling independently until they hit target values
        const leftPromise = this.rollUntilTarget(leftDice, leftValue, 'Left');
        const rightPromise = this.rollUntilTarget(rightDice, rightValue, 'Right');
        
        // Wait for both dice to complete
        await Promise.all([leftPromise, rightPromise]);
        
        console.log('=== BOTH DICE COMPLETED ROLLING ===');
        return { left: leftValue, right: rightValue, total: leftValue + rightValue };
    }

    async rollUntilTarget(dice, targetValue, diceName) {
        return new Promise((resolve) => {
            let flipCount = 0;
            let currentRotationX = 0;
            let currentRotationY = 0;
            let lastDirection = null;
            const maxFlips = 25; // Safety limit (extremely unlikely to reach)
            
            console.log(`${diceName} dice: Rolling until we get ${targetValue}`);
            
            const performFlip = () => {
                flipCount++;
                
                // Safety check
                if (flipCount > maxFlips) {
                    console.log(`${diceName} dice: Hit safety limit at ${maxFlips} flips, stopping anyway`);
                    dice.classList.add('dice-final');
                    resolve();
                    return;
                }
                
                // Get random diagonal direction and duration
                const direction = this.getRandomDiagonalDirection(
                    lastDirection ? lastDirection.opposite : null
                );
                const flipDuration = this.getRandomFlipDuration();
                
                // Calculate new rotation values
                const newRotationX = currentRotationX + direction.rotX;
                const newRotationY = currentRotationY + direction.rotY;
                
                // Update which face will be visible after this rotation
                const newVisibleValue = this.updateVisibleFace(dice, direction);
                
                console.log(`${diceName} flip ${flipCount}: ${direction.name} (${flipDuration}s) - Will show: ${newVisibleValue}, Target: ${targetValue}`);
                
                // Clear transition and apply rotation
                dice.style.transition = 'none';
                dice.offsetHeight; // Force reflow
                
                dice.style.transition = `transform ${flipDuration}s ease-in-out`;
                dice.style.transform = `rotateX(${newRotationX}deg) rotateY(${newRotationY}deg)`;
                
                // Update tracking variables
                currentRotationX = newRotationX;
                currentRotationY = newRotationY;
                lastDirection = direction;
                
                // Check if we should stop after this flip (minimum 5 flips, then check for target)
                if (flipCount >= 5 && newVisibleValue === targetValue) {
                    console.log(`${diceName} dice: SUCCESS! Hit target ${targetValue} after ${flipCount} flips`);
                    
                    // Wait for current flip to complete, then stop
                    const stopTimeout = setTimeout(() => {
                        dice.classList.add('dice-final');
                        resolve();
                    }, flipDuration * 1000);
                    this.rollTimeouts.push(stopTimeout);
                } else {
                    // Schedule next flip
                    const nextTimeout = setTimeout(performFlip, flipDuration * 1000);
                    this.rollTimeouts.push(nextTimeout);
                }
            };
            
            // Start first flip after fade-in begins
            const initialTimeout = setTimeout(performFlip, 300);
            this.rollTimeouts.push(initialTimeout);
        });
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
