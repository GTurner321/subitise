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

        // Define the 4 diagonal directions for realistic rolling
        this.diagonalDirections = [
            { rotX: -90, rotY: 90, name: 'top-right-to-bottom-left', opposite: 'bottom-left-to-top-right' },
            { rotX: -90, rotY: -90, name: 'top-left-to-bottom-right', opposite: 'bottom-right-to-top-left' },
            { rotX: 90, rotY: -90, name: 'bottom-right-to-top-left', opposite: 'top-left-to-bottom-right' },
            { rotX: 90, rotY: 90, name: 'bottom-left-to-top-right', opposite: 'top-right-to-bottom-left' }
        ];

        // Define the 6 faces and their final rotations to show each number
        this.faceRotations = {
            1: { rotateX: 0, rotateY: 0 },      // front face
            2: { rotateX: 0, rotateY: 180 },    // back face  
            3: { rotateX: 0, rotateY: -90 },    // left face
            4: { rotateX: 0, rotateY: 90 },     // right face
            5: { rotateX: -90, rotateY: 0 },    // top face
            6: { rotateX: 90, rotateY: 0 }      // bottom face
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

    getRandomDirection(excludeOpposite = null) {
        const availableDirections = excludeOpposite 
            ? this.diagonalDirections.filter(dir => dir.name !== excludeOpposite)
            : this.diagonalDirections;
        
        return availableDirections[Math.floor(Math.random() * availableDirections.length)];
    }

    getRandomFlipDuration() {
        const durations = [0.35, 0.45, 0.55, 0.65];
        return durations[Math.floor(Math.random() * durations.length)];
    }

    // Generate a sequence with no consecutive repeats and ensure penultimate ≠ target
    generateRollSequence(targetValue) {
        const totalFlips = 6 + Math.floor(Math.random() * 7); // 6-12 flips
        const sequence = [];
        let currentRotationX = 0;
        let currentRotationY = 0;
        let lastShownNumber = null;
        let lastDirection = null;
        
        console.log(`Generating ${totalFlips} flips for target ${targetValue}`);
        
        // Generate intermediate flips (all but the last one)
        for (let i = 0; i < totalFlips - 1; i++) {
            // Get direction excluding the opposite of the previous direction
            const direction = this.getRandomDirection(
                lastDirection ? lastDirection.opposite : null
            );
            const duration = this.getRandomFlipDuration();
            
            // Update cumulative rotation
            currentRotationX += direction.rotX;
            currentRotationY += direction.rotY;
            
            // Determine which number would be showing after this rotation
            let shownNumber = this.calculateVisibleNumber(currentRotationX, currentRotationY);
            
            // If this is the penultimate flip, ensure it doesn't show the target value
            if (i === totalFlips - 2) {
                let attempts = 0;
                while (shownNumber === targetValue && attempts < 10) {
                    // Undo the last rotation and try a different direction
                    currentRotationX -= direction.rotX;
                    currentRotationY -= direction.rotY;
                    
                    const newDirection = this.getRandomDirection(
                        lastDirection ? lastDirection.opposite : null
                    );
                    currentRotationX += newDirection.rotX;
                    currentRotationY += newDirection.rotY;
                    
                    shownNumber = this.calculateVisibleNumber(currentRotationX, currentRotationY);
                    if (shownNumber !== targetValue && shownNumber !== lastShownNumber) {
                        direction.rotX = newDirection.rotX;
                        direction.rotY = newDirection.rotY;
                        direction.name = newDirection.name;
                        direction.opposite = newDirection.opposite;
                        break;
                    }
                    attempts++;
                }
            }
            
            // Also ensure no consecutive repeats throughout the sequence
            if (shownNumber === lastShownNumber) {
                let attempts = 0;
                while (shownNumber === lastShownNumber && attempts < 8) {
                    currentRotationX -= direction.rotX;
                    currentRotationY -= direction.rotY;
                    
                    const newDirection = this.getRandomDirection(
                        lastDirection ? lastDirection.opposite : null
                    );
                    currentRotationX += newDirection.rotX;
                    currentRotationY += newDirection.rotY;
                    
                    shownNumber = this.calculateVisibleNumber(currentRotationX, currentRotationY);
                    if (shownNumber !== lastShownNumber) {
                        direction.rotX = newDirection.rotX;
                        direction.rotY = newDirection.rotY;
                        direction.name = newDirection.name;
                        direction.opposite = newDirection.opposite;
                        break;
                    }
                    attempts++;
                }
            }
            
            sequence.push({
                rotX: direction.rotX,
                rotY: direction.rotY,
                duration: duration,
                cumulativeX: currentRotationX,
                cumulativeY: currentRotationY
            });
            
            lastShownNumber = shownNumber;
            lastDirection = direction;
            console.log(`Flip ${i + 1}: ${direction.name}, showing number ${lastShownNumber}`);
        }
        
        // Final flip: calculate exactly what rotation is needed to show target
        const targetRotation = this.faceRotations[targetValue];
        const finalRotX = targetRotation.rotateX - currentRotationX;
        const finalRotY = targetRotation.rotateY - currentRotationY;
        
        sequence.push({
            rotX: finalRotX,
            rotY: finalRotY,
            duration: 0.5 + Math.random() * 0.3,
            cumulativeX: targetRotation.rotateX,
            cumulativeY: targetRotation.rotateY,
            isFinal: true
        });
        
        console.log(`Final flip: rotX=${finalRotX}, rotY=${finalRotY}, target=${targetValue}`);
        return sequence;
    }

    // Calculate which number should be visible given cumulative rotations
    calculateVisibleNumber(cumulativeX, cumulativeY) {
        // Normalize rotations to 0-360 range
        let normalizedX = ((cumulativeX % 360) + 360) % 360;
        let normalizedY = ((cumulativeY % 360) + 360) % 360;
        
        // Check which face rotation matches closest
        let closestMatch = 1;
        let minDistance = Infinity;
        
        for (let value = 1; value <= 6; value++) {
            const faceRot = this.faceRotations[value];
            let faceX = ((faceRot.rotateX % 360) + 360) % 360;
            let faceY = ((faceRot.rotateY % 360) + 360) % 360;
            
            // Calculate distance considering wrap-around
            const distanceX = Math.min(
                Math.abs(normalizedX - faceX),
                360 - Math.abs(normalizedX - faceX)
            );
            const distanceY = Math.min(
                Math.abs(normalizedY - faceY),
                360 - Math.abs(normalizedY - faceY)
            );
            
            const totalDistance = distanceX + distanceY;
            
            if (totalDistance < minDistance) {
                minDistance = totalDistance;
                closestMatch = value;
            }
        }
        
        return closestMatch;
    }

    createDice(diceColor, targetValue) {
        const dice = document.createElement('div');
        dice.className = 'dice';
        
        // Start invisible
        dice.style.opacity = '0';
        dice.style.transform = 'rotateX(0deg) rotateY(0deg)';
        dice.style.transformStyle = 'preserve-3d';
        
        // Create inner colored cube to fill gaps between faces
        const innerCube = document.createElement('div');
        innerCube.className = 'dice-inner-cube';
        innerCube.style.position = 'absolute';
        innerCube.style.width = '110px';
        innerCube.style.height = '110px';
        innerCube.style.backgroundColor = diceColor;
        innerCube.style.left = '5px';
        innerCube.style.top = '5px';
        innerCube.style.transformStyle = 'preserve-3d';
        innerCube.style.opacity = '0.8'; // Slightly transparent so it doesn't interfere
        innerCube.style.borderRadius = '10px';
        dice.appendChild(innerCube);
        
        // Create all 6 faces of the dice with correct numbers
        const faces = [
            { name: 'front', value: 1 },
            { name: 'back', value: 2 },
            { name: 'left', value: 3 },
            { name: 'right', value: 4 },
            { name: 'top', value: 5 },
            { name: 'bottom', value: 6 }
        ];
        
        faces.forEach((face) => {
            const faceElement = document.createElement('div');
            faceElement.className = `dice-face ${face.name}`;
            faceElement.style.backgroundColor = diceColor;
            faceElement.style.setProperty('--face-color', diceColor);
            faceElement.style.opacity = '0'; // Start faces invisible too
            
            this.createDots(faceElement, face.value);
            dice.appendChild(faceElement);
        });
        
        console.log(`Created dice with target value ${targetValue}`);
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
        console.log(`=== STARTING DICE ROLL: Left=${leftValue}, Right=${rightValue} ===`);
        
        // Get random colors for each dice (ensuring they're different)
        const colors = this.getRandomDiceColors();
        console.log(`Dice colors: Left=${colors.left}, Right=${colors.right}`);
        
        // Generate roll sequences for both dice
        const leftSequence = this.generateRollSequence(leftValue);
        const rightSequence = this.generateRollSequence(rightValue);
        
        // Create dice with standard 1-6 faces
        const leftDice = this.createDice(colors.left, leftValue);
        const rightDice = this.createDice(colors.right, rightValue);
        
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
        
        // Start both dice animations independently
        const leftPromise = this.executeDiceRoll(leftDice, leftSequence);
        const rightPromise = this.executeDiceRoll(rightDice, rightSequence);
        
        // Wait for both dice to complete
        await Promise.all([leftPromise, rightPromise]);
        
        console.log('=== BOTH DICE ANIMATIONS COMPLETED ===');
        return { left: leftValue, right: rightValue, total: leftValue + rightValue };
    }

    async executeDiceRoll(dice, rollSequence) {
        return new Promise((resolve) => {
            let currentStep = 0;
            let cumulativeRotationX = 0;
            let cumulativeRotationY = 0;
            
            console.log(`Starting roll sequence with ${rollSequence.length} steps`);
            
            const performStep = () => {
                if (currentStep >= rollSequence.length) {
                    // Animation complete
                    console.log(`=== DICE ROLL COMPLETE ===`);
                    dice.classList.add('dice-final');
                    resolve();
                    return;
                }
                
                const step = rollSequence[currentStep];
                
                // Update cumulative rotation
                cumulativeRotationX += step.rotX;
                cumulativeRotationY += step.rotY;
                
                console.log(`Step ${currentStep + 1}/${rollSequence.length}: +rotX(${step.rotX}) +rotY(${step.rotY}) = total(${cumulativeRotationX}, ${cumulativeRotationY}) duration=${step.duration}s`);
                
                // Clear any existing transition first
                dice.style.transition = 'none';
                dice.offsetHeight; // Force reflow
                
                // Apply the cumulative rotation animation
                dice.style.transition = `transform ${step.duration}s ease-in-out`;
                dice.style.transform = `rotateX(${cumulativeRotationX}deg) rotateY(${cumulativeRotationY}deg)`;
                
                currentStep++;
                
                // Schedule next step
                const timeout = setTimeout(performStep, step.duration * 1000);
                this.rollTimeouts.push(timeout);
            };
            
            // Start first step after fade-in begins
            const initialTimeout = setTimeout(performStep, 300);
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
