class DiceRenderer {
    constructor() {
        // SEARCH FOR THIS LINE: DICE RENDERER UPDATED 2025-01-01-TRACKING
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
        
        // Face tracking system - standard dice starting position (corrected top/bottom)
        this.standardFacePositions = {
            front: 1,
            back: 6,
            left: 5,
            right: 2,
            top: 4,      // Swapped: was 3
            bottom: 3    // Swapped: was 4
        };
        
        // Setup resize handling for responsive dice
        this.setupResizeHandling();
    }

    setupResizeHandling() {
        window.addEventListener('resize', () => {
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }
            this.resizeTimeout = setTimeout(() => {
                this.updateDiceSize();
            }, 100);
        });
    }

    updateDiceSize() {
        if (this.currentDice.length === 0) return;
        
        const gameArea = document.querySelector('.game-area');
        if (!gameArea) return;
        
        const gameAreaWidth = gameArea.offsetWidth;
        const diceWidthPx = gameAreaWidth * 0.12; // 12% of game area width
        const halfDiceSize = diceWidthPx / 2;
        
        this.currentDice.forEach(dice => {
            // Update dice height to match width
            dice.style.height = `${diceWidthPx}px`;
            dice.dataset.halfSize = halfDiceSize;
            
            // Update 3D face positioning
            const faces = dice.querySelectorAll('.dice-face');
            faces.forEach(face => {
                const faceClass = face.classList[1]; // e.g., 'front', 'back', etc.
                this.setFace3DPosition(face, faceClass, halfDiceSize);
            });
            
            // Update dot sizes
            const dots = dice.querySelectorAll('.dice-dot');
            const dotSize = gameAreaWidth * 0.018;
            dots.forEach(dot => {
                dot.style.width = `${dotSize}px`;
                dot.style.height = `${dotSize}px`;
            });
        });
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
        
        return selectedColors;
    }

    // New restricted movement system - using -90X for forwards, Y-then-X order
    getAvailableMoves() {
        return [
            { rotX: -90, rotY: 90, name: 'forwards-right', probability: 0.4 },
            { rotX: -90, rotY: -90, name: 'forwards-left', probability: 0.4 },
            { rotX: -90, rotY: 0, name: 'forwards', probability: 0.2 }
        ];
    }

    getRandomMove() {
        const moves = this.getAvailableMoves();
        const random = Math.random();
        let cumulativeProbability = 0;
        
        for (const move of moves) {
            cumulativeProbability += move.probability;
            if (random <= cumulativeProbability) {
                return move;
            }
        }
        
        // Fallback to first move
        return moves[0];
    }

    // Face tracking system - applies transformation to face positions
    // Apply Y movement first, then X movement (component moves)
    applyTransformToFaces(currentFaces, rotX, rotY) {
        let newFaces = { ...currentFaces };
        
        // Apply Y rotation FIRST (around Y-axis) - left/right movement
        if (rotY === 90) {
            // +90Y rotation: roll right (left->front, front->right, right->back, back->left)
            const temp = newFaces.left;
            newFaces.left = newFaces.back;
            newFaces.back = newFaces.right;
            newFaces.right = newFaces.front;
            newFaces.front = temp;
        } else if (rotY === -90) {
            // -90Y rotation: roll left (left->back, back->right, right->front, front->left)
            const temp = newFaces.left;
            newFaces.left = newFaces.front;
            newFaces.front = newFaces.right;
            newFaces.right = newFaces.back;
            newFaces.back = temp;
        }
        
        // Apply X rotation SECOND (around X-axis) - forward/backward movement
        if (rotX === 90) {
            // +90X rotation: roll backwards (top->front, front->bottom, bottom->back, back->top)
            const temp = newFaces.top;
            newFaces.top = newFaces.back;
            newFaces.back = newFaces.bottom;
            newFaces.bottom = newFaces.front;
            newFaces.front = temp;
        } else if (rotX === -90) {
            // -90X rotation: roll forwards (top->back, back->bottom, bottom->front, front->top)
            const temp = newFaces.top;
            newFaces.top = newFaces.front;
            newFaces.front = newFaces.bottom;
            newFaces.bottom = newFaces.back;
            newFaces.back = temp;
        }
        
        return newFaces;
    }

    logFacePositions(faces, moveNumber, moveName, rotX, rotY) {
        console.log(`\n=== MOVE ${moveNumber}: ${moveName} (rotY: ${rotY} FIRST, then rotX: ${rotX}) ===`);
        console.log(`Front: ${faces.front} | Back: ${faces.back} | Left: ${faces.left} | Right: ${faces.right} | Top: ${faces.top} | Bottom: ${faces.bottom}`);
    }

    createDice(diceColor, isLeft = true) {
        const dice = document.createElement('div');
        dice.className = `dice ${isLeft ? 'left-dice' : 'right-dice'}`;
        dice.style.opacity = '0';
        dice.style.transformStyle = 'preserve-3d';
        
        // Calculate dice size dynamically - width is 12% of game area width
        const gameArea = document.querySelector('.game-area');
        const gameAreaWidth = gameArea.offsetWidth;
        const diceWidthPx = gameAreaWidth * 0.12; // 12% of game area width
        const halfDiceSize = diceWidthPx / 2;
        
        // Set height to match width in pixels for perfect square
        dice.style.height = `${diceWidthPx}px`;
        
        // Store dice size for 3D transforms
        dice.dataset.halfSize = halfDiceSize;
        
        // Ensure dice container is transparent
        dice.style.backgroundColor = 'transparent';
        dice.style.background = 'transparent';
        dice.style.border = 'none';
        dice.style.boxShadow = 'none';
        
        // Initialize with standard face positions
        dice.dataset.currentFaces = JSON.stringify(this.standardFacePositions);
        
        // Standard dice face values - using our standard mapping
        const faceValues = {
            'front': this.standardFacePositions.front,
            'back': this.standardFacePositions.back, 
            'right': this.standardFacePositions.right,
            'left': this.standardFacePositions.left,
            'top': this.standardFacePositions.top,
            'bottom': this.standardFacePositions.bottom
        };
        
        console.log('\n=== CREATING DICE ===');
        console.log('Starting face positions:', this.standardFacePositions);
        
        // Create all 6 faces
        Object.entries(faceValues).forEach(([faceClass, faceValue]) => {
            const face = document.createElement('div');
            face.className = `dice-face ${faceClass}`;
            
            // Store the face value as a data attribute for easy access
            face.dataset.faceValue = faceValue;
            
            // Set proper 3D positioning with calculated translateZ
            this.setFace3DPosition(face, faceClass, halfDiceSize);
            
            // Ensure transparent background
            face.style.backgroundColor = 'transparent';
            face.style.background = 'transparent';
            face.style.backgroundImage = 'none';
            face.style.border = 'none';
            face.style.borderRadius = '0';
            face.style.boxShadow = 'none';
            face.style.outline = 'none';
            face.style.color = 'transparent';
            
            // Create inner face - 90% size, same color, no rounded corners
            const innerFace = document.createElement('div');
            innerFace.className = 'dice-face-inner';
            innerFace.style.position = 'absolute';
            innerFace.style.top = '5%';
            innerFace.style.left = '5%';
            innerFace.style.width = '90%';
            innerFace.style.height = '90%';
            innerFace.style.backgroundColor = diceColor;
            innerFace.style.border = 'none';
            innerFace.style.borderRadius = '0';
            innerFace.style.boxSizing = 'border-box';
            innerFace.style.zIndex = '0';
            
            // Create colored surface with proper positioning
            const coloredSurface = document.createElement('div');
            coloredSurface.className = 'dice-face-surface';
            coloredSurface.style.position = 'absolute';
            coloredSurface.style.top = '0';
            coloredSurface.style.left = '0';
            coloredSurface.style.right = '0';
            coloredSurface.style.bottom = '0';
            coloredSurface.style.width = '100%';
            coloredSurface.style.height = '100%';
            coloredSurface.style.backgroundColor = diceColor;
            coloredSurface.style.border = '3px solid #333';
            coloredSurface.style.borderRadius = '15px';
            coloredSurface.style.boxSizing = 'border-box';
            coloredSurface.style.zIndex = '1';
            
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
            
            // Create dots with proper sizing and visibility
            this.createDots(dotsContainer, faceValue, gameAreaWidth, faceClass);
            
            face.appendChild(innerFace);      
            face.appendChild(coloredSurface); 
            face.appendChild(dotsContainer);  
            dice.appendChild(face);
        });
        
        // Start at standard orientation (no rotation)
        dice.style.transform = `rotateX(0deg) rotateY(0deg)`;
        
        // Store initial rotation for tracking
        dice.dataset.currentRotationX = 0;
        dice.dataset.currentRotationY = 0;
        dice.dataset.moveCount = 0;
        
        return dice;
    }

    createDots(container, value, gameAreaWidth, faceClass = '') {
        const pattern = CONFIG.DICE_FACES[value];
        container.innerHTML = '';
        
        // Calculate dot size - 1.8% of game area width
        const dotSize = gameAreaWidth * 0.018; // 1.8% of game area width
        
        // Create 9 dot positions in 3x3 grid
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const dot = document.createElement('div');
                dot.className = 'dice-dot';
                
                // Set dot size in pixels to match CSS percentage
                dot.style.width = `${dotSize}px`;
                dot.style.height = `${dotSize}px`;
                dot.style.borderRadius = '50%';
                dot.style.backgroundColor = '#333';
                dot.style.margin = 'auto';
                dot.style.transition = 'opacity 0.1s ease';
                dot.style.pointerEvents = 'none';
                dot.style.touchAction = 'none';
                
                // Set visibility based on pattern and add active class
                if (pattern[row][col] === 1) {
                    dot.classList.add('active');
                    dot.style.opacity = '1'; // Make dots visible immediately
                } else {
                    dot.style.opacity = '0';
                }
                
                container.appendChild(dot);
            }
        }
    }

    setFace3DPosition(face, faceClass, halfSize) {
        // Set 3D positioning with proper translateZ using calculated pixel values
        // IMPORTANT: Set backface-visibility to hidden for proper face detection
        face.style.backfaceVisibility = 'hidden';
        
        switch (faceClass) {
            case 'front':
                face.style.transform = `rotateY(0deg) translateZ(${halfSize}px)`;
                break;
            case 'back':
                face.style.transform = `rotateY(180deg) translateZ(${halfSize}px)`;
                break;
            case 'right':
                face.style.transform = `rotateY(-90deg) translateZ(${halfSize}px)`;
                break;
            case 'left':
                face.style.transform = `rotateY(90deg) translateZ(${halfSize}px)`;
                break;
            case 'top':
                face.style.transform = `rotateX(-90deg) translateZ(${halfSize}px)`;
                break;
            case 'bottom':
                face.style.transform = `rotateX(90deg) translateZ(${halfSize}px)`;
                break;
        }
    }

    async rollDice() {
        console.log('\n🎲🎲🎲 STARTING RESTRICTED MOVEMENT DICE ROLL 🎲🎲🎲');
        
        // Get random colors
        const colors = this.getRandomDiceColors();
        
        // Create two dice with positioning classes
        const leftDice = this.createDice(colors.left, true);
        const rightDice = this.createDice(colors.right, false);
        
        // Add to game area (not to left/right sides - dice position themselves)
        const gameArea = document.querySelector('.game-area');
        gameArea.appendChild(leftDice);
        gameArea.appendChild(rightDice);
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
        
        // Roll both dice (but only log the left one for now)
        const leftRolls = 8; // Fixed number for testing
        const rightRolls = 8; // Fixed number for testing
        
        const leftPromise = this.rollDiceWithTracking(leftDice, leftRolls, 'Left');
        const rightPromise = this.rollDiceSimple(rightDice, rightRolls, 'Right');
        
        // Wait for both to complete
        await Promise.all([leftPromise, rightPromise]);
        
        // Read the final faces
        const leftValue = this.getCurrentFrontFace(leftDice);
        const rightValue = this.getCurrentFrontFace(rightDice);
        const total = leftValue + rightValue;
        
        console.log(`\n🎯 FINAL RESULT: Left=${leftValue}, Right=${rightValue}, Total=${total}`);
        
        return { left: leftValue, right: rightValue, total: total };
    }

    async rollDiceWithTracking(dice, numberOfRolls, diceName) {
        return new Promise((resolve) => {
            let rollCount = 0;
            let currentRotationX = parseInt(dice.dataset.currentRotationX) || 0;
            let currentRotationY = parseInt(dice.dataset.currentRotationY) || 0;
            let currentFaces = JSON.parse(dice.dataset.currentFaces);
            
            console.log(`\n🎲 ${diceName} dice starting with standard positions:`);
            this.logFacePositions(currentFaces, 0, 'INITIAL', 0, 0);
            
            const performRoll = () => {
                rollCount++;
                
                // Get random move from our restricted set
                const move = this.getRandomMove();
                const flipDuration = 0.5; // Fixed duration for easier observation
                
                // Apply the transformation to face tracking
                const newFaces = this.applyTransformToFaces(currentFaces, move.rotX, move.rotY);
                
                // Log the transformation and result
                this.logFacePositions(newFaces, rollCount, move.name, move.rotX, move.rotY);
                
                // Apply rotation to the physical dice
                currentRotationX += move.rotX;
                currentRotationY += move.rotY;
                
                dice.style.transition = `transform ${flipDuration}s ease-in-out`;
                dice.style.transform = `rotateX(${currentRotationX}deg) rotateY(${currentRotationY}deg)`;
                
                // Update tracking
                dice.dataset.currentRotationX = currentRotationX;
                dice.dataset.currentRotationY = currentRotationY;
                dice.dataset.currentFaces = JSON.stringify(newFaces);
                dice.dataset.moveCount = rollCount;
                currentFaces = newFaces;
                
                // Check if done
                if (rollCount >= numberOfRolls) {
                    const stopTimeout = setTimeout(() => {
                        dice.classList.add('dice-final');
                        console.log(`\n✅ ${diceName} dice completed ${rollCount} moves`);
                        console.log(`Final front face should be: ${newFaces.front}`);
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

    async rollDiceSimple(dice, numberOfRolls, diceName) {
        return new Promise((resolve) => {
            let rollCount = 0;
            let currentRotationX = parseInt(dice.dataset.currentRotationX) || 0;
            let currentRotationY = parseInt(dice.dataset.currentRotationY) || 0;
            
            const performRoll = () => {
                rollCount++;
                
                const move = this.getRandomMove();
                const flipDuration = 0.5;
                
                currentRotationX += move.rotX;
                currentRotationY += move.rotY;
                
                dice.style.transition = `transform ${flipDuration}s ease-in-out`;
                dice.style.transform = `rotateX(${currentRotationX}deg) rotateY(${currentRotationY}deg)`;
                
                dice.dataset.currentRotationX = currentRotationX;
                dice.dataset.currentRotationY = currentRotationY;
                dice.dataset.moveCount = rollCount;
                
                if (rollCount >= numberOfRolls) {
                    const stopTimeout = setTimeout(() => {
                        dice.classList.add('dice-final');
                        resolve();
                    }, flipDuration * 1000);
                    this.rollTimeouts.push(stopTimeout);
                } else {
                    const nextTimeout = setTimeout(performRoll, flipDuration * 1000);
                    this.rollTimeouts.push(nextTimeout);
                }
            };
            
            const initialTimeout = setTimeout(performRoll, 1300);
            this.rollTimeouts.push(initialTimeout);
        });
    }

    getCurrentFrontFace(dice) {
        const currentFaces = JSON.parse(dice.dataset.currentFaces || '{}');
        return currentFaces.front || 1;
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
            const leftValue = this.getCurrentFrontFace(this.currentDice[0]);
            const rightValue = this.getCurrentFrontFace(this.currentDice[1]);
            return { left: leftValue, right: rightValue, total: leftValue + rightValue };
        }
        return { left: 0, right: 0, total: 0 };
    }

    reset() {
        this.clearDice();
        // Reset color tracking when game resets
        this.previousColors = [];
        
        // Clear resize timeout
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
        
        console.log('Dice renderer reset - color tracking cleared');
    }
}
