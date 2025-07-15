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
        const shuffled = [...this.availableColors].sort(() => Math.random() - 0.5);
        return {
            left: shuffled[0],
            right: shuffled[1]
        };
    }

    getDiagonalDirections() {
        return [
            { rotX: 90, rotY: 90, name: 'down-right' },
            { rotX: -90, rotY: 90, name: 'up-right' },
            { rotX: 90, rotY: -90, name: 'down-left' },
            { rotX: -90, rotY: -90, name: 'up-left' }
        ];
    }

    getRandomDiagonalDirection() {
        const directions = this.getDiagonalDirections();
        return directions[Math.floor(Math.random() * directions.length)];
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
            face.style.backgroundColor = 'transparent';
            
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

    // Face reading function - determines which face is currently visible
    readVisibleFace(dice) {
        const rotX = parseInt(dice.dataset.currentRotationX) || 0;
        const rotY = parseInt(dice.dataset.currentRotationY) || 0;
        
        // Normalize rotations to 0-360 range
        const normalizedX = ((rotX % 360) + 360) % 360;
        const normalizedY = ((rotY % 360) + 360) % 360;
        
        // Determine which face is visible based on final rotation
        // This maps rotation angles to face values
        if (normalizedX === 0 || normalizedX === 360) {
            // Front/Back/Left/Right faces
            if (normalizedY === 0 || normalizedY === 360) return 1; // front
            if (normalizedY === 90) return 2; // right
            if (normalizedY === 180) return 6; // back
            if (normalizedY === 270) return 5; // left
        } else if (normalizedX === 90) {
            return 4; // bottom
        } else if (normalizedX === 270) {
            return 3; // top
        }
        
        // For non-standard angles, use approximation
        return this.approximateVisibleFace(normalizedX, normalizedY);
    }

    // Approximate face reading for non-standard angles
    approximateVisibleFace(rotX, rotY) {
        // Find the closest standard angle
        const xAngles = [0, 90, 180, 270];
        const yAngles = [0, 90, 180, 270];
        
        const closestX = xAngles.reduce((prev, curr) => 
            Math.abs(curr - rotX) < Math.abs(prev - rotX) ? curr : prev
        );
        
        const closestY = yAngles.reduce((prev, curr) => 
            Math.abs(curr - rotY) < Math.abs(prev - rotY) ? curr : prev
        );
        
        // Use the closest standard angles to determine face
        if (closestX === 0) {
            if (closestY === 0) return 1; // front
            if (closestY === 90) return 2; // right
            if (closestY === 180) return 6; // back
            if (closestY === 270) return 5; // left
        } else if (closestX === 90) {
            return 4; // bottom
        } else if (closestX === 270) {
            return 3; // top
        }
        
        // Fallback to front face
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
        
        // Read the final faces
        const leftValue = this.readVisibleFace(leftDice);
        const rightValue = this.readVisibleFace(rightDice);
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
            
            const performRoll = () => {
                rollCount++;
                
                // Get random direction and duration
                const direction = this.getRandomDiagonalDirection();
                const flipDuration = this.getRandomFlipDuration();
                
                // Apply rotation
                currentRotationX += direction.rotX;
                currentRotationY += direction.rotY;
                
                dice.style.transition = `transform ${flipDuration}s ease-in-out`;
                dice.style.transform = `rotateX(${currentRotationX}deg) rotateY(${currentRotationY}deg)`;
                
                // Update tracking
                dice.dataset.currentRotationX = currentRotationX;
                dice.dataset.currentRotationY = currentRotationY;
                
                // Check if done
                if (rollCount >= numberOfRolls) {
                    const stopTimeout = setTimeout(() => {
                        dice.classList.add('dice-final');
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

    getCurrentValues() {
        if (this.currentDice.length >= 2) {
            const leftValue = this.readVisibleFace(this.currentDice[0]);
            const rightValue = this.readVisibleFace(this.currentDice[1]);
            return { left: leftValue, right: rightValue, total: leftValue + rightValue };
        }
        return { left: 0, right: 0, total: 0 };
    }

    reset() {
        this.clearDice();
    }
}
