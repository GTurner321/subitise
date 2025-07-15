class DiceRenderer {
    constructor() {
        this.leftSide = document.getElementById('leftSide');
        this.rightSide = document.getElementById('rightSide');
        this.currentDice = [];
        this.rollTimeouts = [];
        
        // Available colors for dice
        this.availableColors = [
            '#ff6b6b',  // Red
            '#4ecdc4',  // Teal
            '#45b7d1',  // Blue
            '#f9ca24',  // Yellow
            '#f0932b',  // Orange
            '#6c5ce7'   // Purple
        ];
        
        // Track previously used colors to avoid repeats
        this.previousColors = [];
    }

    clearDice() {
        // Remove all existing dice from both sides
        this.currentDice.forEach(dice => {
            if (dice && dice.parentNode) {
                dice.parentNode.removeChild(dice);
            }
        });
        this.currentDice = [];
        
        // Clear any pending timeouts
        this.rollTimeouts.forEach(timeout => clearTimeout(timeout));
        this.rollTimeouts = [];
    }

    getRandomDiceColors() {
        // Get colors that weren't used in the previous set
        let availableForSelection = this.availableColors.filter(color => 
            !this.previousColors.includes(color)
        );
        
        // If we don't have enough unused colors (need at least 2), reset and use all colors
        if (availableForSelection.length < 2) {
            availableForSelection = [...this.availableColors];
            console.log('Resetting color pool - all colors available again');
        }
        
        // Shuffle the available colors and pick the first two
        const shuffled = [...availableForSelection].sort(() => Math.random() - 0.5);
        const selectedColors = {
            left: shuffled[0],
            right: shuffled[1]
        };
        
        // Store these colors as the previous set for next time
        this.previousColors = [selectedColors.left, selectedColors.right];
        
        console.log(`Selected dice colors: Left=${selectedColors.left}, Right=${selectedColors.right}`);
        console.log(`Previous colors stored: ${this.previousColors.join(', ')}`);
        
        return selectedColors;
    }

    getDiagonalDirections() {
        return [
            { rotX: 90, rotY: 90, name: 'down-right', reverse: 'up-left' },
            { rotX: -90, rotY: 90, name: 'up-right', reverse: 'down-left' },
            { rotX: 90, rotY: -90, name: 'down-left', reverse: 'up-right' },
            { rotX: -90, rotY: -90, name: 'up-left', reverse: 'down-right' }
        ];
    }

    getRandomDiagonalDirection(previousDirection = null) {
        const directions = this.getDiagonalDirections();
        
        // If this is the first move, return any direction
        if (!previousDirection) {
            return directions[Math.floor(Math.random() * directions.length)];
        }
        
        // Filter out the reverse of the previous direction
        const validDirections = directions.filter(dir => dir.name !== previousDirection.reverse);
        
        console.log(`Previous direction: ${previousDirection.name}, excluding: ${previousDirection.reverse}`);
        console.log(`Valid directions: ${validDirections.map(d => d.name).join(', ')}`);
        
        return validDirections[Math.floor(Math.random() * validDirections.length)];
    }

    getRandomFlipDuration() {
        const durations = [0.35, 0.45, 0.55, 0.65];
        return durations[Math.floor(Math.random() * durations.length)];
    }

    createDice(diceColor) {
        const dice = document.createElement('div');
        dice.className = 'dice';
        dice.style.opacity = '0';
        dice.style.transformStyle = 'preserve-3d';
        
        // Standard dice face values
        const faceValues = {
            'front': 1, 'back': 6, 'right': 2, 'left': 5, 'top': 3, 'bottom': 4
        };
        
        // Create all 6 faces
        Object.entries(faceValues).forEach(([faceClass, faceValue]) => {
            const face = document.createElement('div');
            face.className = `dice-face ${faceClass}`;
            // Explicitly ensure transparent background
            face.style.backgroundColor = 'transparent';
            face.style.background = 'none';
            face.style.border = 'none';
            face.style.boxShadow = 'none';
            
            // Create colored surface
            const coloredSurface = document.createElement('div');
            coloredSurface.className = 'dice-face-surface';
            coloredSurface.style.position = 'absolute';
            coloredSurface.style.top = '0';
            coloredSurface.style.left = '0';
            coloredSurface.style.right = '0';
            coloredSurface.style.bottom = '0';
            coloredSurface.style.backgroundColor = diceColor;
            coloredSurface.style.border = '3px solid #333';
            coloredSurface.style.borderRadius = '15px';
            coloredSurface.style.boxSizing = 'border-box';
            coloredSurface.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
            
            // Create dots container
            const dotsContainer = document.createElement('div');
            dotsContainer.className = 'dice-dots-container';
            dotsContainer.style.position = 'relative';
            dotsContainer.style.zIndex = '2';
            dotsContainer.style.width = '100%';
            dotsContainer.style.height = '100%';
            dotsContainer.style.display = 'grid';
            dotsContainer.style.gridTemplateColumns = '1fr 1fr 1fr';
            dotsContainer.style.gridTemplateRows = '1fr 1fr 1fr';
            dotsContainer.style.gap = '8px';
            dotsContainer.style.padding = '12px';
            dotsContainer.style.boxSizing = 'border-box';
            
            this.createDots(dotsContainer, faceValue);
            
            face.appendChild(coloredSurface);
            face.appendChild(dotsContainer);
            dice.appendChild(face);
        });
        
        // Set random starting orientation
        const startingRotX = Math.floor(Math.random() * 4) * 90; // 0, 90, 180, 270
        const startingRotY = Math.floor(Math.random() * 4) * 90;
        dice.style.transform = `rotateX(${startingRotX}deg) rotateY(${startingRotY}deg)`;
        
        // Store initial rotation for tracking
        dice.dataset.currentRotationX = startingRotX;
        dice.dataset.currentRotationY = startingRotY;
        
        // Initialize previous direction tracking
        dice.dataset.previousDirection = null;
        
        return dice;
    }

    createDots(container, value) {
        const pattern = CONFIG.DICE_FACES[value];
        container.innerHTML = '';
        
        // Create 9 dot positions in 3x3 grid
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const dot = document.createElement('div');
                dot.className = 'dice-dot';
                
                if (pattern[row][col] === 1) {
                    dot.classList.add('active');
                }
                
                container.appendChild(dot);
            }
        }
    }

    // Face reading function - counts visible dots to determine dice value
    readVisibleFace(dice) {
        // Get all active dots on this dice
        const activeDots = dice.querySelectorAll('.dice-dot.active');
        const diceRect = dice.getBoundingClientRect();
        
        let visibleDots = 0;
        
        activeDots.forEach(dot => {
            if (this.isDotVisible(dot, dice, diceRect)) {
                visibleDots++;
            }
        });
        
        // Ensure we return a valid dice value (1-6)
        const finalValue = Math.max(1, Math.min(6, visibleDots));
        
        console.log(`Dice face reader: Found ${visibleDots} visible dots, returning value ${finalValue}`);
        return finalValue;
    }

    // Check if a dot is visible (facing toward the viewer)
    isDotVisible(dot, dice, diceRect) {
        const dotRect = dot.getBoundingClientRect();
        
        // Check if dot is within the dice boundaries (basic sanity check)
        if (dotRect.width === 0 || dotRect.height === 0) {
            return false;
        }
        
        // Get the face this dot belongs to
        const face = dot.closest('.dice-face');
        if (!face) return false;
        
        // Check if this face is oriented toward the front
        return this.isFaceFacingFront(face, dice);
    }

    // Determine if a face is facing toward the viewer
    isFaceFacingFront(face, dice) {
        const faceRect = face.getBoundingClientRect();
        const diceRect = dice.getBoundingClientRect();
        
        // If the face has no visible area, it's not facing front
        if (faceRect.width === 0 || faceRect.height === 0) {
            return false;
        }
        
        // Check if the face is positioned in the front area of the dice
        const faceCenterX = faceRect.left + faceRect.width / 2;
        const faceCenterY = faceRect.top + faceRect.height / 2;
        const diceCenterX = diceRect.left + diceRect.width / 2;
        const diceCenterY = diceRect.top + diceRect.height / 2;
        
        // The face should be close to the dice center and have reasonable size
        const maxDistance = Math.min(diceRect.width, diceRect.height) * 0.4;
        const distance = Math.sqrt(
            Math.pow(faceCenterX - diceCenterX, 2) + 
            Math.pow(faceCenterY - diceCenterY, 2)
        );
        
        // Also check that the face has a reasonable size (not collapsed)
        const minFaceSize = Math.min(diceRect.width, diceRect.height) * 0.6;
        const faceSize = Math.min(faceRect.width, faceRect.height);
        
        return distance < maxDistance && faceSize > minFaceSize;
    }

    // Alternative simpler approach - find the largest visible face
    readVisibleFaceSimple(dice) {
        const faces = dice.querySelectorAll('.dice-face');
        let largestFace = null;
        let largestArea = 0;
        
        faces.forEach(face => {
            const rect = face.getBoundingClientRect();
            const area = rect.width * rect.height;
            
            // Only consider faces that are actually visible
            if (area > largestArea && rect.width > 50 && rect.height > 50) {
                largestFace = face;
                largestArea = area;
            }
        });
        
        if (largestFace) {
            // Count dots on the largest visible face
            const activeDots = largestFace.querySelectorAll('.dice-dot.active');
            const value = activeDots.length;
            console.log(`Simple reader: Largest face has ${value} dots`);
            return Math.max(1, Math.min(6, value));
        }
        
        console.log('Simple reader: No clear visible face found, defaulting to 1');
        return 1;
    }

    async rollDice() {
        console.log('=== STARTING NATURAL DICE ROLL ===');
        
        // Get random colors
        const colors = this.getRandomDiceColors();
        
        // Create two dice
        const leftDice = this.createDice(colors.left);
        const rightDice = this.createDice(colors.right);
        
        // Add to sides
        this.leftSide.appendChild(leftDice);
        this.rightSide.appendChild(rightDice);
        this.currentDice = [leftDice, rightDice];
        
        // Fade in
        setTimeout(() => {
            [leftDice, rightDice].forEach(dice => {
                dice.style.transition = 'opacity 1s ease-in';
                dice.style.opacity = '1';
                
                const faces = dice.querySelectorAll('.dice-face');
                faces.forEach(face => {
                    face.style.transition = 'opacity 1s ease-in';
                    face.style.opacity = '1';
                });
            });
        }, 200);
        
        // Start rolling both dice
        const leftRolls = Math.floor(Math.random() * 10) + 6; // 6-15 rolls
        const rightRolls = Math.floor(Math.random() * 10) + 6; // 6-15 rolls
        
        const leftPromise = this.rollDiceNaturally(leftDice, leftRolls, 'Left');
        const rightPromise = this.rollDiceNaturally(rightDice, rightRolls, 'Right');
        
        // Wait for both to complete
        await Promise.all([leftPromise, rightPromise]);
        
        // Read the final faces using visual detection
        const leftValue = this.readVisibleFaceRobust(leftDice);
        const rightValue = this.readVisibleFaceRobust(rightDice);
        const total = leftValue + rightValue;
        
        console.log(`=== DICE ROLLING COMPLETE ===`);
        console.log(`Left dice shows: ${leftValue}`);
        console.log(`Right dice shows: ${rightValue}`);
        console.log(`Total: ${total}`);
        
        return { left: leftValue, right: rightValue, total: total };
    }

    async rollDiceNaturally(dice, numberOfRolls, diceName) {
        return new Promise((resolve) => {
            let rollCount = 0;
            let currentRotationX = parseInt(dice.dataset.currentRotationX) || 0;
            let currentRotationY = parseInt(dice.dataset.currentRotationY) || 0;
            let previousDirection = null; // Track the previous direction
            
            const performRoll = () => {
                rollCount++;
                
                // Get random direction, excluding reverse of previous move
                const direction = this.getRandomDiagonalDirection(previousDirection);
                const flipDuration = this.getRandomFlipDuration();
                
                console.log(`${diceName} dice roll ${rollCount}: ${direction.name} (duration: ${flipDuration}s)`);
                
                // Apply rotation
                currentRotationX += direction.rotX;
                currentRotationY += direction.rotY;
                
                dice.style.transition = `transform ${flipDuration}s ease-in-out`;
                dice.style.transform = `rotateX(${currentRotationX}deg) rotateY(${currentRotationY}deg)`;
                
                // Update tracking
                dice.dataset.currentRotationX = currentRotationX;
                dice.dataset.currentRotationY = currentRotationY;
                
                // Store this direction as the previous one for next roll
                previousDirection = direction;
                
                // Check if done
                if (rollCount >= numberOfRolls) {
                    const stopTimeout = setTimeout(() => {
                        dice.classList.add('dice-final');
                        console.log(`${diceName} dice completed rolling after ${rollCount} moves`);
                        resolve();
                    }, flipDuration * 1000);
                    this.rollTimeouts.push(stopTimeout);
                } else {
                    // Continue rolling
                    const nextTimeout = setTimeout(performRoll, flipDuration * 1000);
                    this.rollTimeouts.push(nextTimeout);
                }
            };
            
            // Start rolling after fade-in
            const initialTimeout = setTimeout(performRoll, 1300);
            this.rollTimeouts.push(initialTimeout);
        });
    }

    async fadeOutCurrentDice() {
        if (this.currentDice.length === 0) return;
        
        // Fade out current dice
        this.currentDice.forEach(dice => {
            if (dice && dice.parentNode) {
                dice.style.transition = 'opacity 1s ease-out';
                dice.style.opacity = '0';
                
                const faces = dice.querySelectorAll('.dice-face');
                faces.forEach(face => {
                    face.style.transition = 'opacity 1s ease-out';
                    face.style.opacity = '0';
                });
            }
        });
        
        // Wait for fade-out and remove
        return new Promise(resolve => {
            const timeout = setTimeout(() => {
                this.currentDice.forEach(dice => {
                    if (dice && dice.parentNode) {
                        dice.parentNode.removeChild(dice);
                    }
                });
                this.currentDice = [];
                resolve();
            }, 1000);
            this.rollTimeouts.push(timeout);
        });
    }

    // Robust face reader that tries multiple approaches
    readVisibleFaceRobust(dice) {
        // Try the simple approach first (largest visible face)
        const simpleResult = this.readVisibleFaceSimple(dice);
        
        // Try the complex approach for verification
        const complexResult = this.readVisibleFace(dice);
        
        // If both methods agree, use that value
        if (simpleResult === complexResult) {
            console.log(`Both methods agree: ${simpleResult}`);
            return simpleResult;
        }
        
        // If they disagree, prefer the simple method but log the disagreement
        console.log(`Methods disagree: simple=${simpleResult}, complex=${complexResult}, using simple`);
        return simpleResult;
    }

    getCurrentValues() {
        if (this.currentDice.length >= 2) {
            const leftValue = this.readVisibleFaceRobust(this.currentDice[0]);
            const rightValue = this.readVisibleFaceRobust(this.currentDice[1]);
            return { left: leftValue, right: rightValue, total: leftValue + rightValue };
        }
        return { left: 0, right: 0, total: 0 };
    }

    reset() {
        this.clearDice();
        // Reset color tracking when game resets
        this.previousColors = [];
        console.log('Dice renderer reset - color tracking cleared');
    }
}
