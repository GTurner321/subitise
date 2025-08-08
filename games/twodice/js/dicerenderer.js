/**
     * FALLBACK: Original random dice rolling system
     * Used when target-driven system fails or for testing
     */
    async rollDice() {
        console.log('=== STARTING RANDOM DICE ROLL ===');
        
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
        
        // Start rolling both dice
        const leftRolls = Math.floor(Math.random() * 10) + 6; // 6-15 rolls
        const rightRolls = Math.floor(Math.random() * 10) + 6; // 6-15 rolls
        
        const leftPromise = this.rollDiceNaturally(leftDice, leftRolls, 'Left');
        const rightPromise = this.rollDiceNaturally(rightDice, rightRolls, 'Right');
        
        // Wait for both to complete
        await Promise.all([leftPromise, rightPromise]);
        
        // Read the final faces using Z-depth detection
        const leftValue = this.readVisibleFaceByZDepth(leftDice);
        const rightValue = this.readVisibleFaceByZDepth(rightDice);
        const total = leftValue + rightValue;
        
        console.log(`=== RANDOM DICE ROLLING COMPLETE ===`);
        console.log(`Left dice shows: ${leftValue}`);
        console.log(`Right dice shows: ${rightValue}`);
        console.log(`Total: ${total}`);
        
        return { left: leftValue, right: rightValue, total: total };
    }class DiceRenderer {
    constructor() {
        // SEARCH FOR THIS LINE: DICE RENDERER UPDATED 2025-01-01
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
        
        // Standard dice face values - reverted to original mapping
        const faceValues = {
            'front': 1, 'back': 6, 'right': 2, 'left': 5, 'top': 3, 'bottom': 4
        };
        
        console.log('Creating dice with original face values:', faceValues);
        
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
        
        // Set random starting orientation
        const startingRotX = Math.floor(Math.random() * 4) * 90;
        const startingRotY = Math.floor(Math.random() * 4) * 90;
        dice.style.transform = `rotateX(${startingRotX}deg) rotateY(${startingRotY}deg)`;
        
        // Store initial rotation for tracking
        dice.dataset.currentRotationX = startingRotX;
        dice.dataset.currentRotationY = startingRotY;
        
        // Initialize previous direction tracking
        dice.dataset.previousDirection = null;
        
        return dice;
    }

    createDots(container, value, gameAreaWidth, faceClass = '') {
        const pattern = CONFIG.DICE_FACES[value];
        container.innerHTML = '';
        
        // Debug: Log which pattern is being used for which face
        if (faceClass) {
            console.log(`Creating ${value} dots for ${faceClass} face`);
        }
        
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
                // FIXED: Was rotateY(90deg), now swapped with left
                face.style.transform = `rotateY(-90deg) translateZ(${halfSize}px)`;
                break;
            case 'left':
                // FIXED: Was rotateY(-90deg), now swapped with right
                face.style.transform = `rotateY(90deg) translateZ(${halfSize}px)`;
                break;
            case 'top':
                // FIXED: Was rotateX(90deg), now swapped with bottom
                face.style.transform = `rotateX(-90deg) translateZ(${halfSize}px)`;
                break;
            case 'bottom':
                // FIXED: Was rotateX(-90deg), now swapped with top
                face.style.transform = `rotateX(90deg) translateZ(${halfSize}px)`;
                break;
        }
    }

    /**
     * NEW Z-DEPTH DETECTION METHOD
     * Determines the visible face by calculating which face has the highest Z-coordinate
     * after applying the dice's rotation transforms
     */
    readVisibleFaceByZDepth(dice) {
        console.log('=== Z-DEPTH FACE DETECTION ===');
        
        // Get the dice's current rotation from its transform
        const diceStyle = window.getComputedStyle(dice);
        const diceTransform = diceStyle.transform;
        
        if (!diceTransform || diceTransform === 'none') {
            console.warn('No dice transform found, defaulting to 1');
            return 1;
        }
        
        // Parse the dice's rotation matrix
        const diceMatrix = new DOMMatrix(diceTransform);
        console.log('Dice transform matrix:', {
            m11: diceMatrix.m11.toFixed(3),
            m12: diceMatrix.m12.toFixed(3),
            m13: diceMatrix.m13.toFixed(3),
            m21: diceMatrix.m21.toFixed(3),
            m22: diceMatrix.m22.toFixed(3),
            m23: diceMatrix.m23.toFixed(3),
            m31: diceMatrix.m31.toFixed(3),
            m32: diceMatrix.m32.toFixed(3),
            m33: diceMatrix.m33.toFixed(3)
        });
        
        const faces = dice.querySelectorAll('.dice-face');
        let frontmostFace = null;
        let maxZ = -Infinity;
        let faceDepthInfo = [];
        
        // Define the initial face normal vectors (pointing outward from cube center)
        const faceNormals = {
            'front': [0, 0, 1],    // Points toward +Z (toward viewer initially)
            'back': [0, 0, -1],    // Points toward -Z (away from viewer initially)
            'right': [1, 0, 0],    // Points toward +X
            'left': [-1, 0, 0],    // Points toward -X
            'top': [0, 1, 0],      // Points toward +Y
            'bottom': [0, -1, 0]   // Points toward -Y
        };
        
        faces.forEach(face => {
            const faceClass = face.classList[1]; // 'front', 'back', etc.
            const faceValue = parseInt(face.dataset.faceValue);
            const normal = faceNormals[faceClass];
            
            if (!normal) {
                console.warn(`Unknown face class: ${faceClass}`);
                return;
            }
            
            // Transform the face normal by the dice's rotation matrix
            // This gives us the direction this face is pointing after rotation
            const transformedNormal = [
                normal[0] * diceMatrix.m11 + normal[1] * diceMatrix.m21 + normal[2] * diceMatrix.m31,
                normal[0] * diceMatrix.m12 + normal[1] * diceMatrix.m22 + normal[2] * diceMatrix.m32,
                normal[0] * diceMatrix.m13 + normal[1] * diceMatrix.m23 + normal[2] * diceMatrix.m33
            ];
            
            // The Z-component of the transformed normal tells us how much this face
            // is pointing toward the viewer (positive Z = toward viewer)
            const zComponent = transformedNormal[2];
            
            faceDepthInfo.push({
                face: faceClass,
                value: faceValue,
                originalNormal: normal,
                transformedNormal: transformedNormal.map(n => n.toFixed(3)),
                zComponent: zComponent.toFixed(3)
            });
            
            // Track the face with highest Z-component (most toward viewer)
            if (zComponent > maxZ) {
                maxZ = zComponent;
                frontmostFace = face;
            }
        });
        
        // Log all face analysis for debugging
        console.log('Face normal analysis:', faceDepthInfo);
        
        if (frontmostFace) {
            const finalValue = parseInt(frontmostFace.dataset.faceValue);
            const faceClass = frontmostFace.classList[1];
            
            console.log(`Frontmost face: ${faceClass} with value ${finalValue} (Z-component: ${maxZ.toFixed(3)})`);
            console.log('=== Z-DEPTH DETECTION COMPLETE ===');
            
            return Math.max(1, Math.min(6, finalValue));
        }
        
        console.warn('No frontmost face found, defaulting to 1');
        console.log('=== Z-DEPTH DETECTION COMPLETE ===');
        return 1;
    }

    /**
     * NEW TARGET-DRIVEN DICE ROLLING SYSTEM
     * Rolls dice to achieve specific target values by working backwards from desired outcome
     */
    async rollDiceToTarget(targetLeft, targetRight) {
        console.log(`=== STARTING TARGET-DRIVEN DICE ROLL ===`);
        console.log(`Target: Left=${targetLeft}, Right=${targetRight}, Total=${targetLeft + targetRight}`);
        
        try {
            // Get random colors
            const colors = this.getRandomDiceColors();
            
            // Calculate starting positions and move sequences for both dice
            const leftPlan = this.calculateDiceRollPlan(targetLeft);
            const rightPlan = this.calculateDiceRollPlan(targetRight);
            
            if (!leftPlan || !rightPlan) {
                console.warn('Failed to calculate roll plans, falling back to random rolling');
                return await this.rollDice(); // Fallback to random
            }
            
            // Create dice with calculated starting positions
            const leftDice = this.createDiceWithStartingState(colors.left, true, leftPlan.startingState);
            const rightDice = this.createDiceWithStartingState(colors.right, false, rightPlan.startingState);
            
            // Add to game area
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
            
            // Execute planned move sequences
            const leftPromise = this.executePlannedRolls(leftDice, leftPlan.moves, 'Left');
            const rightPromise = this.executePlannedRolls(rightDice, rightPlan.moves, 'Right');
            
            // Wait for both to complete
            await Promise.all([leftPromise, rightPromise]);
            
            // Verify the final results match our targets
            const leftValue = this.readVisibleFaceByZDepth(leftDice);
            const rightValue = this.readVisibleFaceByZDepth(rightDice);
            const total = leftValue + rightValue;
            
            console.log(`=== TARGET-DRIVEN ROLLING COMPLETE ===`);
            console.log(`Target: ${targetLeft}+${targetRight}=${targetLeft + targetRight}`);
            console.log(`Actual: ${leftValue}+${rightValue}=${total}`);
            
            if (leftValue === targetLeft && rightValue === targetRight) {
                console.log(`✅ SUCCESS: Target achieved perfectly!`);
            } else {
                console.warn(`⚠️  MISMATCH: Expected ${targetLeft}+${targetRight}, got ${leftValue}+${rightValue}`);
            }
            
            return { left: leftValue, right: rightValue, total: total };
            
        } catch (error) {
            console.error('Error in target-driven rolling:', error);
            return await this.rollDice(); // Fallback to random
        }
    }

    /**
     * Calculate starting position and move sequence to achieve target face
     */
    calculateDiceRollPlan(targetFace) {
        console.log(`Calculating roll plan for target face: ${targetFace}`);
        
        // Generate random number of moves (6-15 like original system)
        const numMoves = Math.floor(Math.random() * 10) + 6;
        
        // Generate random move sequence
        const moveNames = Object.keys(CONFIG.TRANSFORM_MOVES);
        const moves = [];
        let lastDirection = null;
        
        for (let i = 0; i < numMoves; i++) {
            const availableMoves = moveNames.filter(move => {
                if (!lastDirection) return true;
                return move !== CONFIG.TRANSFORM_MOVES[lastDirection].inverse;
            });
            
            const selectedMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
            moves.push(selectedMove);
            lastDirection = selectedMove;
        }
        
        console.log(`Generated ${numMoves} moves:`, moves);
        
        // Start with target state (face visible, rotation 0)
        let currentState = { frontFace: targetFace, rotation: 0 };
        
        // Work backwards through moves using inverse transforms
        for (let i = moves.length - 1; i >= 0; i--) {
            const currentMove = moves[i];
            const inverseMove = CONFIG.TRANSFORM_MOVES[currentMove].inverse;
            const stateKey = `${currentState.frontFace},${currentState.rotation}`;
            
            const transitions = CONFIG.DICE_STATE_TRANSITIONS[stateKey];
            if (!transitions || !transitions[inverseMove]) {
                console.error(`No transition found for state ${stateKey} with inverse move ${inverseMove}`);
                return null;
            }
            
            currentState = transitions[inverseMove];
            console.log(`Move ${i+1} (${currentMove}) inverse ${inverseMove}: ${stateKey} → ${currentState.frontFace},${currentState.rotation}`);
        }
        
        console.log(`Starting state calculated: face ${currentState.frontFace}, rotation ${currentState.rotation}`);
        
        return {
            startingState: currentState,
            moves: moves,
            targetFace: targetFace
        };
    }

    /**
     * Create dice with specific starting state
     */
    createDiceWithStartingState(diceColor, isLeft, startingState) {
        const dice = this.createDice(diceColor, isLeft);
        
        // Convert starting state to actual rotation values
        const startingRotation = this.stateToRotation(startingState);
        
        // Apply starting rotation
        dice.style.transform = `rotateX(${startingRotation.rotX}deg) rotateY(${startingRotation.rotY}deg)`;
        
        // Store rotation tracking
        dice.dataset.currentRotationX = startingRotation.rotX;
        dice.dataset.currentRotationY = startingRotation.rotY;
        
        console.log(`Dice created with starting state: face ${startingState.frontFace}, rotation ${startingState.rotation}`);
        console.log(`Applied transform: rotateX(${startingRotation.rotX}deg) rotateY(${startingRotation.rotY}deg)`);
        
        return dice;
    }

    /**
     * Convert dice state (frontFace, rotation) to actual 3D rotation values
     */
    stateToRotation(state) {
        // Map face + rotation combinations to actual rotateX/rotateY values
        const stateRotationMap = {
            // Face 1 (originally front)
            "1,0": { rotX: 0, rotY: 0 },
            "1,90": { rotX: 0, rotY: 0 },     // Face rotated 90°
            "1,180": { rotX: 0, rotY: 0 },   // Face rotated 180°
            "1,270": { rotX: 0, rotY: 0 },   // Face rotated 270°
            
            // Face 2 (originally right)
            "2,0": { rotX: 0, rotY: -90 },   // Right face forward
            "2,90": { rotX: 0, rotY: -90 },
            "2,180": { rotX: 0, rotY: -90 },
            "2,270": { rotX: 0, rotY: -90 },
            
            // Face 3 (originally top)
            "3,0": { rotX: -90, rotY: 0 },   // Top face forward
            "3,90": { rotX: -90, rotY: 0 },
            "3,180": { rotX: -90, rotY: 0 },
            "3,270": { rotX: -90, rotY: 0 },
            
            // Face 4 (originally bottom)
            "4,0": { rotX: 90, rotY: 0 },    // Bottom face forward
            "4,90": { rotX: 90, rotY: 0 },
            "4,180": { rotX: 90, rotY: 0 },
            "4,270": { rotX: 90, rotY: 0 },
            
            // Face 5 (originally left)
            "5,0": { rotX: 0, rotY: 90 },    // Left face forward
            "5,90": { rotX: 0, rotY: 90 },
            "5,180": { rotX: 0, rotY: 90 },
            "5,270": { rotX: 0, rotY: 90 },
            
            // Face 6 (originally back)
            "6,0": { rotX: 0, rotY: 180 },   // Back face forward
            "6,90": { rotX: 0, rotY: 180 },
            "6,180": { rotX: 0, rotY: 180 },
            "6,270": { rotX: 0, rotY: 180 }
        };
        
        const key = `${state.frontFace},${state.rotation}`;
        const rotation = stateRotationMap[key];
        
        if (!rotation) {
            console.warn(`No rotation mapping found for state: ${key}`);
            return { rotX: 0, rotY: 0 };
        }
        
        return rotation;
    }

    /**
     * Execute planned sequence of moves
     */
    async executePlannedRolls(dice, moves, diceName) {
        return new Promise((resolve) => {
            let rollCount = 0;
            let currentRotationX = parseInt(dice.dataset.currentRotationX) || 0;
            let currentRotationY = parseInt(dice.dataset.currentRotationY) || 0;
            
            const performRoll = () => {
                if (rollCount >= moves.length) {
                    dice.classList.add('dice-final');
                    console.log(`${diceName} dice completed planned rolling after ${moves.length} moves`);
                    resolve();
                    return;
                }
                
                const moveName = moves[rollCount];
                const move = CONFIG.TRANSFORM_MOVES[moveName];
                const flipDuration = this.getRandomFlipDuration();
                
                console.log(`${diceName} dice planned roll ${rollCount + 1}: ${moveName} (duration: ${flipDuration}s)`);
                
                // Apply the planned rotation
                currentRotationX += move.rotX;
                currentRotationY += move.rotY;
                
                dice.style.transition = `transform ${flipDuration}s ease-in-out`;
                dice.style.transform = `rotateX(${currentRotationX}deg) rotateY(${currentRotationY}deg)`;
                
                // Update tracking
                dice.dataset.currentRotationX = currentRotationX;
                dice.dataset.currentRotationY = currentRotationY;
                
                rollCount++;
                
                // Schedule next roll
                const nextTimeout = setTimeout(performRoll, flipDuration * 1000);
                this.rollTimeouts.push(nextTimeout);
            };
            
            // Start rolling after fade-in
            const initialTimeout = setTimeout(performRoll, 1300);
            this.rollTimeouts.push(initialTimeout);
        });
    }

    async rollDiceNaturally(dice, numberOfRolls, diceName) {
        return new Promise((resolve) => {
            let rollCount = 0;
            let currentRotationX = parseInt(dice.dataset.currentRotationX) || 0;
            let currentRotationY = parseInt(dice.dataset.currentRotationY) || 0;
            let previousDirection = null;
            
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

    getCurrentValues() {
        if (this.currentDice.length >= 2) {
            const leftValue = this.readVisibleFaceByZDepth(this.currentDice[0]);
            const rightValue = this.readVisibleFaceByZDepth(this.currentDice[1]);
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
