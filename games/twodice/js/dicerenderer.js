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
        
        // Face mapping for 3D positioning - which face is visible at which rotation
        this.faceRotations = {
            'front': { x: 0, y: 0 },      // rotateX(0) rotateY(0)
            'back': { x: 0, y: 180 },     // rotateX(0) rotateY(180)
            'right': { x: 0, y: 90 },     // rotateX(0) rotateY(90)
            'left': { x: 0, y: -90 },     // rotateX(0) rotateY(-90)
            'top': { x: -90, y: 0 },      // rotateX(-90) rotateY(0)
            'bottom': { x: 90, y: 0 }     // rotateX(90) rotateY(0)
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

    // Calculate which face will be visible after a series of rotations
    calculateFinalVisibleFace(rotationSequence) {
        let finalX = 0;
        let finalY = 0;
        
        // Apply all rotations
        rotationSequence.forEach(rotation => {
            finalX += rotation.rotX;
            finalY += rotation.rotY;
        });
        
        // Normalize to 0-359 range
        finalX = ((finalX % 360) + 360) % 360;
        finalY = ((finalY % 360) + 360) % 360;
        
        // Find which face corresponds to this rotation
        for (const [faceName, rotation] of Object.entries(this.faceRotations)) {
            const normalizedFaceX = ((rotation.x % 360) + 360) % 360;
            const normalizedFaceY = ((rotation.y % 360) + 360) % 360;
            
            if (Math.abs(finalX - normalizedFaceX) < 10 && Math.abs(finalY - normalizedFaceY) < 10) {
                return faceName;
            }
        }
        
        // Default to top face if no exact match
        return 'top';
    }

    // Plan the dice roll to end on the correct number
    planDiceRoll(targetValue) {
        // Generate random number of flips (6-12)
        const totalFlips = 6 + Math.floor(Math.random() * 7);
        
        // Generate random sequence of diagonal directions
        const rotationSequence = [];
        let lastDirection = null;
        
        for (let i = 0; i < totalFlips; i++) {
            const direction = this.getRandomDiagonalDirection(
                lastDirection ? lastDirection.opposite : null
            );
            rotationSequence.push(direction);
            lastDirection = direction;
        }
        
        // Calculate which face will be visible at the end
        const finalVisibleFace = this.calculateFinalVisibleFace(rotationSequence);
        
        console.log(`Planned ${totalFlips} flips, final visible face: ${finalVisibleFace}`);
        
        // Generate random durations for each flip
        const flipDurations = rotationSequence.map(() => this.getRandomFlipDuration());
        
        return {
            totalFlips,
            rotationSequence,
            flipDurations,
            finalVisibleFace,
            targetValue
        };
    }

    createDice(diceColor, rollPlan) {
        const dice = document.createElement('div');
        dice.className = 'dice';
        
        // Start invisible
        dice.style.opacity = '0';
        dice.style.transform = 'rotateX(0deg) rotateY(0deg)';
        dice.style.transformStyle = 'preserve-3d';
        
        // Create all 6 faces of the dice
        const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
        
        faces.forEach((faceClass, index) => {
            const face = document.createElement('div');
            face.className = `dice-face ${faceClass}`;
            face.style.backgroundColor = diceColor;
            face.style.setProperty('--face-color', diceColor);
            face.style.opacity = '0'; // Start faces invisible too
            
            // Assign numbers to faces - the final visible face gets the target value
            let faceValue;
            if (faceClass === rollPlan.finalVisibleFace) {
                faceValue = rollPlan.targetValue;
            } else {
                // Other faces get random values (avoiding the target value)
                do {
                    faceValue = Math.floor(Math.random() * 6) + 1;
                } while (faceValue === rollPlan.targetValue);
            }
            
            this.createDots(face, faceValue);
            dice.appendChild(face);
        });
        
        console.log(`Created dice with target ${rollPlan.targetValue} on ${rollPlan.finalVisibleFace} face`);
        
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

    async rollDice(leftValue, rightValue) {
        console.log(`=== PLANNING DICE ROLLS: Left=${leftValue}, Right=${rightValue} ===`);
        
        // Plan both dice rolls
        const leftPlan = this.planDiceRoll(leftValue);
        const rightPlan = this.planDiceRoll(rightValue);
        
        // Get random colors for each dice (ensuring they're different)
        const colors = this.getRandomDiceColors();
        console.log(`Dice colors: Left=${colors.left}, Right=${colors.right}`);
        
        // Create two dice with their roll plans
        const leftDice = this.createDice(colors.left, leftPlan);
        const rightDice = this.createDice(colors.right, rightPlan);
        
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
        }, 200);
        
        console.log(`Left: ${leftPlan.totalFlips} flips, Right: ${rightPlan.totalFlips} flips`);
        
        // Start both dice animations independently
        const leftPromise = this.executeDiceRoll(leftDice, leftPlan);
        const rightPromise = this.executeDiceRoll(rightDice, rightPlan);
        
        // Wait for both dice to complete
        await Promise.all([leftPromise, rightPromise]);
        
        console.log('=== BOTH DICE ANIMATIONS COMPLETED ===');
        return { left: leftValue, right: rightValue, total: leftValue + rightValue };
    }

    async executeDiceRoll(dice, rollPlan) {
        return new Promise((resolve) => {
            let currentFlip = 0;
            let currentRotationX = 0;
            let currentRotationY = 0;
            
            console.log(`Starting planned roll: ${rollPlan.totalFlips} flips to show ${rollPlan.targetValue}`);
            
            const performFlip = () => {
                if (currentFlip >= rollPlan.totalFlips) {
                    // Animation complete
                    console.log(`=== DICE ROLL COMPLETE - Target: ${rollPlan.targetValue} ===`);
                    dice.classList.add('dice-final');
                    resolve();
                    return;
                }
                
                const direction = rollPlan.rotationSequence[currentFlip];
                const flipDuration = rollPlan.flipDurations[currentFlip];
                
                // Calculate the NEW rotation values
                const newRotationX = currentRotationX + direction.rotX;
                const newRotationY = currentRotationY + direction.rotY;
                
                console.log(`Flip ${currentFlip + 1}/${rollPlan.totalFlips}: ${direction.name} (${flipDuration}s)`);
                
                // Clear any existing transition first
                dice.style.transition = 'none';
                dice.offsetHeight; // Force reflow
                
                // Apply the rotation animation
                dice.style.transition = `transform ${flipDuration}s ease-in-out`;
                dice.style.transform = `rotateX(${newRotationX}deg) rotateY(${newRotationY}deg)`;
                
                // Update tracking variables
                currentRotationX = newRotationX;
                currentRotationY = newRotationY;
                currentFlip++;
                
                // Schedule next flip
                const timeout = setTimeout(performFlip, flipDuration * 1000);
                this.rollTimeouts.push(timeout);
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
