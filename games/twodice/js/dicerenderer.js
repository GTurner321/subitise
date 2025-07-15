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

    // Create a realistic dice with proper face values and random starting orientation
    createRealisticDice(diceColor, startingValue = null) {
        const dice = document.createElement('div');
        dice.className = 'dice';
        
        // Start invisible
        dice.style.opacity = '0';
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
        
        // Set starting orientation to show the provided starting value, or random if none provided
        let startingOrientation;
        if (startingValue) {
            // Find the face that matches the starting value
            const faceForValue = Object.entries(faceValues).find(([face, value]) => value === startingValue);
            if (faceForValue) {
                const [faceName] = faceForValue;
                startingOrientation = this.getOrientationForFace(faceName, startingValue);
            } else {
                // Fallback to random if value not found
                startingOrientation = this.getRandomOrientation();
            }
        } else {
            startingOrientation = this.getRandomOrientation();
        }
        
        // Set initial transform
        dice.style.transform = startingOrientation.rotation;
        
        // Track current state (simplified - just track the visible value)
        dice.dataset.currentVisibleValue = startingOrientation.value;
        dice.dataset.currentRotationX = this.extractRotationX(startingOrientation.rotation);
        dice.dataset.currentRotationY = this.extractRotationY(startingOrientation.rotation);
        
        console.log(`Created dice starting with value ${startingOrientation.value}`);
        return dice;
    }

    getOrientationForFace(faceName, value) {
        const orientations = {
            'front': { rotation: 'rotateX(0deg) rotateY(0deg)', value: 1 },
            'right': { rotation: 'rotateX(0deg) rotateY(90deg)', value: 2 },
            'top': { rotation: 'rotateX(-90deg) rotateY(0deg)', value: 3 },
            'bottom': { rotation: 'rotateX(90deg) rotateY(0deg)', value: 4 },
            'left': { rotation: 'rotateX(0deg) rotateY(-90deg)', value: 5 },
            'back': { rotation: 'rotateX(0deg) rotateY(180deg)', value: 6 }
        };
        return orientations[faceName] || orientations['front'];
    }

    getRandomOrientation() {
        const startingOrientations = [
            { rotation: 'rotateX(0deg) rotateY(0deg)', value: 1 },      // Front facing
            { rotation: 'rotateX(0deg) rotateY(90deg)', value: 2 },     // Right facing
            { rotation: 'rotateX(0deg) rotateY(-90deg)', value: 5 },    // Left facing
            { rotation: 'rotateX(0deg) rotateY(180deg)', value: 6 },    // Back facing
            { rotation: 'rotateX(-90deg) rotateY(0deg)', value: 3 },    // Top facing
            { rotation: 'rotateX(90deg) rotateY(0deg)', value: 4 }      // Bottom facing
        ];
        
        return startingOrientations[Math.floor(Math.random() * startingOrientations.length)];
    }

    extractRotationX(rotationString) {
        const match = rotationString.match(/rotateX\((-?\d+)deg\)/);
        return match ? parseInt(match[1]) : 0;
    }

    extractRotationY(rotationString) {
        const match = rotationString.match(/rotateY\((-?\d+)deg\)/);
        return match ? parseInt(match[1]) : 0;
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

    // Simplified function to get the current visible value after rotation
    getCurrentVisibleValue(dice, rotationX, rotationY) {
        // Normalize rotations to 0-360 range
        const normX = ((rotationX % 360) + 360) % 360;
        const normY = ((rotationY % 360) + 360) % 360;
        
        // Determine which face is visible based on final rotation
        // This is a simplified mapping - in a real implementation you'd want more precise calculations
        if (normX === 0 || normX === 360) {
            if (normY === 0 || normY === 360) return 1; // front
            if (normY === 90) return 2; // right
            if (normY === 180) return 6; // back
            if (normY === 270) return 5; // left
        } else if (normX === 90) {
            return 4; // bottom
        } else if (normX === 270) {
            return 3; // top
        }
        
        // Fallback - return random valid dice value
        return Math.floor(Math.random() * 6) + 1;
    }

    async rollDice() {
        console.log(`=== STARTING SIMPLIFIED DICE ROLL ===`);
        
        // Get random colors for each dice (ensuring they're different)
        const colors = this.getRandomDiceColors();
        console.log(`Dice colors: Left=${colors.left}, Right=${colors.right}`);
        
        // Create two realistic dice with random starting values
        const leftStartValue = Math.floor(Math.random() * 6) + 1;
        const rightStartValue = Math.floor(Math.random() * 6) + 1;
        
        const leftDice = this.createRealisticDice(colors.left, leftStartValue);
        const rightDice = this.createRealisticDice(colors.right, rightStartValue);
        
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
        
        // Start both dice rolling independently with random number of rolls
        const leftRolls = Math.floor(Math.random() * 10) + 6; // 6-15 rolls
        const rightRolls = Math.floor(Math.random() * 10) + 6; // 6-15 rolls
        
        console.log(`Left dice will do ${leftRolls} rolls, Right dice will do ${rightRolls} rolls`);
        
        const leftPromise = this.rollDiceForSteps(leftDice, leftRolls, 'Left');
        const rightPromise = this.rollDiceForSteps(rightDice, rightRolls, 'Right');
        
        // Wait for both dice to complete
        const [leftFinalValue, rightFinalValue] = await Promise.all([leftPromise, rightPromise]);
        
        console.log(`=== BOTH DICE COMPLETED ROLLING: Left=${leftFinalValue}, Right=${rightFinalValue} ===`);
        return { left: leftFinalValue, right: rightFinalValue, total: leftFinalValue + rightFinalValue };
    }

    async rollDiceForSteps(dice, numberOfRolls, diceName) {
        return new Promise((resolve) => {
            let rollCount = 0;
            let currentRotationX = parseInt(dice.dataset.currentRotationX) || 0;
            let currentRotationY = parseInt(dice.dataset.currentRotationY) || 0;
            let lastDirection = null;
            
            console.log(`${diceName} dice: Will perform ${numberOfRolls} rolls`);
            
            const performRoll = () => {
                rollCount++;
                
                // Get random diagonal direction and duration
                const direction = this.getRandomDiagonalDirection(
                    lastDirection ? lastDirection.opposite : null
                );
                const flipDuration = this.getRandomFlipDuration();
                
                // Calculate new rotation values
                const newRotationX = currentRotationX + direction.rotX;
                const newRotationY = currentRotationY + direction.rotY;
                
                console.log(`${diceName} roll ${rollCount}/${numberOfRolls}: ${direction.name} (${flipDuration}s)`);
                
                // Clear transition and apply rotation
                dice.style.transition = 'none';
                dice.offsetHeight; // Force reflow
                
                dice.style.transition = `transform ${flipDuration}s ease-in-out`;
                dice.style.transform = `rotateX(${newRotationX}deg) rotateY(${newRotationY}deg)`;
                
                // Update tracking variables
                currentRotationX = newRotationX;
                currentRotationY = newRotationY;
                dice.dataset.currentRotationX = currentRotationX;
                dice.dataset.currentRotationY = currentRotationY;
                lastDirection = direction;
                
                // Check if this was the last roll
                if (rollCount >= numberOfRolls) {
                    console.log(`${diceName} dice: Completed all ${numberOfRolls} rolls`);
                    
                    // Wait for current roll to complete, then determine final value
                    const stopTimeout = setTimeout(() => {
                        dice.classList.add('dice-final');
                        
                        // Calculate the final visible value based on final rotation
                        const finalValue = this.getCurrentVisibleValue(dice, currentRotationX, currentRotationY);
                        dice.dataset.currentVisibleValue = finalValue;
                        
                        console.log(`${diceName} dice: Final value is ${finalValue}`);
                        resolve(finalValue);
                    }, flipDuration * 1000);
                    this.rollTimeouts.push(stopTimeout);
                } else {
                    // Schedule next roll
                    const nextTimeout = setTimeout(performRoll, flipDuration * 1000);
                    this.rollTimeouts.push(nextTimeout);
                }
            };
            
            // Start first roll after fade-in begins
            const initialTimeout = setTimeout(performRoll, 300);
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
        if (this.currentDice.length >= 2) {
            const leftValue = parseInt(this.currentDice[0].dataset.currentVisibleValue) || 0;
            const rightValue = parseInt(this.currentDice[1].dataset.currentVisibleValue) || 0;
            return { left: leftValue, right: rightValue, total: leftValue + rightValue };
        }
        return { left: 0, right: 0, total: 0 };
    }

    reset() {
        this.clearDice();
    }
}
