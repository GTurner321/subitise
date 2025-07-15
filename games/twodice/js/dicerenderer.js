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
    createRealisticDice(diceColor) {
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
        
        // Randomly choose starting orientation to make all faces reachable
        const startingOrientations = [
            { rotation: 'rotateX(0deg) rotateY(0deg)', face: 'front', value: 1 },      // Front facing
            { rotation: 'rotateX(0deg) rotateY(90deg)', face: 'right', value: 2 },     // Right facing
            { rotation: 'rotateX(0deg) rotateY(-90deg)', face: 'left', value: 5 },     // Left facing
            { rotation: 'rotateX(0deg) rotateY(180deg)', face: 'back', value: 6 },     // Back facing
            { rotation: 'rotateX(-90deg) rotateY(0deg)', face: 'top', value: 3 },      // Top facing
            { rotation: 'rotateX(90deg) rotateY(0deg)', face: 'bottom', value: 4 }     // Bottom facing
        ];
        
        const startingOrientation = startingOrientations[Math.floor(Math.random() * startingOrientations.length)];
        
        // Set initial transform
        dice.style.transform = startingOrientation.rotation;
        
        // Track which face is currently visible
        dice.dataset.currentVisibleFace = startingOrientation.face;
        dice.dataset.currentVisibleValue = startingOrientation.value;
        dice.dataset.currentRotationX = startingOrientation.rotation.includes('rotateX(-90deg)') ? -90 : 
                                       startingOrientation.rotation.includes('rotateX(90deg)') ? 90 : 0;
        dice.dataset.currentRotationY = startingOrientation.rotation.includes('rotateY(90deg)') ? 90 :
                                       startingOrientation.rotation.includes('rotateY(-90deg)') ? -90 :
                                       startingOrientation.rotation.includes('rotateY(180deg)') ? 180 : 0;
        
        console.log(`Created dice starting with ${startingOrientation.face} face (${startingOrientation.value}) visible`);
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
        
        // Corrected mapping based on actual 3D rotations
        // Each diagonal move combines X and Y rotations
        const faceTransitions = {
            'front': {  // Starting face: 1
                'down-right': 'right',    // rotateX(90) + rotateY(90) → 2
                'up-right': 'right',      // rotateX(-90) + rotateY(90) → 2
                'down-left': 'left',      // rotateX(90) + rotateY(-90) → 5
                'up-left': 'left'         // rotateX(-90) + rotateY(-90) → 5
            },
            'back': {   // Starting face: 6
                'down-right': 'left',     // 6 → 5
                'up-right': 'left',       // 6 → 5
                'down-left': 'right',     // 6 → 2
                'up-left': 'right'        // 6 → 2
            },
            'right': {  // Starting face: 2
                'down-right': 'back',     // 2 → 6
                'up-right': 'front',      // 2 → 1
                'down-left': 'back',      // 2 → 6
                'up-left': 'front'        // 2 → 1
            },
            'left': {   // Starting face: 5
                'down-right': 'front',    // 5 → 1
                'up-right': 'back',       // 5 → 6
                'down-left': 'front',     // 5 → 1
                'up-left': 'back'         // 5 → 6
            },
            'top': {    // Starting face: 3
                'down-right': 'right',    // 3 → 2
                'up-right': 'left',       // 3 → 5
                'down-left': 'left',      // 3 → 5
                'up-left': 'right'        // 3 → 2
            },
            'bottom': { // Starting face: 4
                'down-right': 'left',     // 4 → 5
                'up-right': 'right',      // 4 → 2
                'down-left': 'right',     // 4 → 2
                'up-left': 'left'         // 4 → 5
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
        
        console.log(`${rotation.name}: ${currentFace}(${faceToValue[currentFace]}) → ${newFace}(${newValue})`);
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
            let currentRotationX = parseInt(dice.dataset.currentRotationX) || 0;
            let currentRotationY = parseInt(dice.dataset.currentRotationY) || 0;
            let lastDirection = null;
            const maxFlips = 25; // Safety limit
            
            console.log(`${diceName} dice: Starting from ${dice.dataset.currentVisibleFace}(${dice.dataset.currentVisibleValue}), rolling until we get ${targetValue}`);
            
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
                dice.dataset.currentRotationX = currentRotationX;
                dice.dataset.currentRotationY = currentRotationY;
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
