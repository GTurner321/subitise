class DiceRenderer {
    constructor() {
        // SEARCH FOR THIS LINE: DICE RENDERER PREDICTIVE 2025-01-01
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
        
        // UPDATED: Level-based dice ranges
        this.levelRanges = {
            L1: [1, 2, 3],
            L2: [2, 3, 4], 
            L3: [1, 2, 3, 4, 5, 6]
        };
        
        // UPDATED: Speed sets for movement timing
        this.speedSets = {
            A: {
                diagonal: 0.55,
                forward: 0.4,
                penultimate: { diagonal: 0.7, forward: 0.53 },
                last: { diagonal: 0.95, forward: 0.75 }
            },
            B: {
                diagonal: 0.58,
                forward: 0.42,
                penultimate: { diagonal: 0.7, forward: 0.53 },
                last: { diagonal: 0.95, forward: 0.75 }
            }
        };
        
        // Physical dice rendering - standard dice face positions for visual display
        this.physicalFacePositions = {
            front: 1,
            back: 6,
            left: 5,
            right: 2,
            top: 3,
            bottom: 4
        };
        
        // Face tracking system - logical positions for movement calculations (3 and 4 swapped)
        this.logicalFacePositions = {
            front: 1,
            back: 6,
            left: 5,
            right: 2,
            top: 4,      // Swapped for tracking logic
            bottom: 3    // Swapped for tracking logic
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

    /**
     * UPDATED: Generate targets based on level and used sums
     */
    generateLevelBasedTargets(level, usedSums) {
        const range = this.levelRanges[level];
        if (!range) {
            console.error(`Invalid level: ${level}`);
            return { leftValue: 1, rightValue: 1, total: 2 };
        }
        
        console.log(`🎯 Generating targets for ${level} with range [${range.join(', ')}]`);
        console.log(`🚫 Avoiding used sums: [${Array.from(usedSums).sort((a,b) => a-b).join(', ')}]`);
        
        // Try up to 10 times to find a non-repeated sum
        for (let attempt = 1; attempt <= 10; attempt++) {
            const leftValue = range[Math.floor(Math.random() * range.length)];
            const rightValue = range[Math.floor(Math.random() * range.length)];
            const total = leftValue + rightValue;
            
            if (!usedSums.has(total)) {
                console.log(`✅ Found unique sum on attempt ${attempt}: (${leftValue}, ${rightValue}) = ${total}`);
                return { leftValue, rightValue, total };
            }
            
            console.log(`🔄 Attempt ${attempt}: sum ${total} already used, trying again...`);
        }
        
        // After 10 attempts, just use the last generated values
        const leftValue = range[Math.floor(Math.random() * range.length)];
        const rightValue = range[Math.floor(Math.random() * range.length)];
        const total = leftValue + rightValue;
        
        console.warn(`⚠️ Using repeat sum after 10 attempts: (${leftValue}, ${rightValue}) = ${total}`);
        return { leftValue, rightValue, total };
    }

    /**
     * UPDATED: Assign random speed sets ensuring they're different
     */
    assignSpeedSets() {
        const sets = ['A', 'B'];
        const shuffled = [...sets].sort(() => Math.random() - 0.5);
        
        const assignment = {
            left: shuffled[0],
            right: shuffled[1]
        };
        
        console.log(`🏃‍♀️ Speed assignment: Left dice = Set ${assignment.left}, Right dice = Set ${assignment.right}`);
        
        return assignment;
    }

    /**
     * UPDATED: Get movement duration based on speed set and position in sequence
     */
    getMovementDuration(speedSet, moveNumber, totalMoves, moveType) {
        const set = this.speedSets[speedSet];
        let duration;
        
        if (moveNumber === totalMoves) {
            // Last move
            duration = moveType === 'diagonal' ? set.last.diagonal : set.last.forward;
        } else if (moveNumber === totalMoves - 1) {
            // Penultimate move
            duration = moveType === 'diagonal' ? set.penultimate.diagonal : set.penultimate.forward;
        } else {
            // Regular moves
            duration = moveType === 'diagonal' ? set.diagonal : set.forward;
        }
        
        console.log(`⏱️ Set ${speedSet} move ${moveNumber}/${totalMoves} (${moveType}): ${duration}s`);
        return duration;
    }

    // Movement system - generates intended movements
    getAvailableMoves() {
        return [
            { rotX: -90, rotY: 90, name: 'forwards-right', probability: 0.4, type: 'diagonal' },
            { rotX: -90, rotY: -90, name: 'forwards-left', probability: 0.4, type: 'diagonal' },
            { rotX: -90, rotY: 0, name: 'forwards', probability: 0.2, type: 'forward' }
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

    /**
     * UPDATED: Generate movement sequence with new constraints
     */
    generateTargetBasedSequence(targetNumber, diceName, maxAttempts = 10) {
        console.log(`🎯 Generating sequence for ${diceName} dice to reach ${targetNumber} (max ${maxAttempts} attempts)`);
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            console.log(`🔄 Attempt ${attempt}/${maxAttempts} for ${diceName} dice`);
            
            const sequence = [];
            let currentFaces = { ...this.logicalFacePositions }; // Start with initial position
            let moveCount = 0;
            const maxMoves = 18;
            const minMoves = 8;
            const checkFromMove = 9; // Start checking on 9th move
            
            while (moveCount < maxMoves) {
                moveCount++;
                
                // Generate a random move
                const move = this.getRandomMove();
                const moveData = {
                    moveNumber: moveCount,
                    ...move
                };
                
                // Apply the move to see the result
                const newFaces = this.applyLogicalTransform(currentFaces, move.rotX, move.rotY, moveCount);
                
                // Add move to sequence
                sequence.push(moveData);
                currentFaces = newFaces;
                
                // Check if we've reached the target (but only after minimum moves)
                if (moveCount >= checkFromMove && newFaces.front === targetNumber) {
                    console.log(`✅ ${diceName} dice reached target ${targetNumber} after ${moveCount} moves (attempt ${attempt})`);
                    return sequence;
                }
            }
            
            console.log(`❌ Attempt ${attempt}: ${diceName} dice completed ${maxMoves} moves without reaching target ${targetNumber} (final: ${currentFaces.front})`);
            
            // If this is the last attempt, return the sequence anyway
            if (attempt === maxAttempts) {
                console.warn(`⚠️ ${diceName} dice using final sequence after ${maxAttempts} attempts (target: ${targetNumber}, actual: ${currentFaces.front})`);
                return sequence;
            }
        }
        
        // This should never be reached, but just in case
        console.error(`❌ Failed to generate sequence for ${diceName} dice`);
        return [];
    }

    // Apply CSS pattern corrections to make physical dice match intended sequence
    applyCSSPatternCorrections(intendedMove) {
        const { moveNumber, rotX, rotY, name } = intendedMove;
        
        // Pattern corrections for CSS transforms
        let cssRotX = rotX;
        let cssRotY = rotY;
        let cssOrder = 'Y-then-X'; // Default order
        
        // PATTERN 1: Y-flip on moves 2,3,6,7,10,11,14,15,18,19... (4n-2 and 4n-1)
        const shouldFlipY = this.shouldFlipYRotation(moveNumber);
        if (shouldFlipY && rotY !== 0) {
            cssRotY = -rotY; // Flip Y rotation for CSS
        }
        
        // PATTERN 2: Order-flip on odd moves 
        const shouldFlipOrder = (moveNumber % 2 === 1);
        if (shouldFlipOrder) {
            cssOrder = 'X-then-Y'; // Flip order for CSS on odd moves
        }
        
        if (shouldFlipY || shouldFlipOrder) {
            console.log(`🔧 CSS corrections for move ${moveNumber}: ${shouldFlipY ? `Y-flip (${rotY} → ${cssRotY})` : ''} ${shouldFlipY && shouldFlipOrder ? ' + ' : ''}${shouldFlipOrder ? 'Order-flip (X-then-Y)' : ''}`);
        }
        
        return {
            cssRotX,
            cssRotY,
            cssOrder,
            shouldFlipY,
            shouldFlipOrder
        };
    }

    // Apply logical transforms in the same order CSS will execute them
    applyLogicalTransform(currentFaces, rotX, rotY, moveNumber) {
        let newFaces = { ...currentFaces };
        
        // Determine order based on move number (matching CSS behavior)
        const isOddMove = (moveNumber % 2 === 1);
        
        if (isOddMove) {
            // ODD MOVES: CSS does Y-then-X, so we predict Y-then-X
            
            // Apply Y rotation first
            if (rotY === 90) {
                const temp = newFaces.left;
                newFaces.left = newFaces.back;
                newFaces.back = newFaces.right;
                newFaces.right = newFaces.front;
                newFaces.front = temp;
            } else if (rotY === -90) {
                const temp = newFaces.left;
                newFaces.left = newFaces.front;
                newFaces.front = newFaces.right;
                newFaces.right = newFaces.back;
                newFaces.back = temp;
            }
            
            // Apply X rotation second
            if (rotX === 90) {
                const temp = newFaces.front;
                newFaces.front = newFaces.bottom;
                newFaces.bottom = newFaces.back;
                newFaces.back = newFaces.top;
                newFaces.top = temp;
            } else if (rotX === -90) {
                const temp = newFaces.front;
                newFaces.front = newFaces.top;
                newFaces.top = newFaces.back;
                newFaces.back = newFaces.bottom;
                newFaces.bottom = temp;
            }
            
        } else {
            // EVEN MOVES: CSS does X-then-Y, so we predict X-then-Y
            
            // Apply X rotation first
            if (rotX === 90) {
                const temp = newFaces.front;
                newFaces.front = newFaces.bottom;
                newFaces.bottom = newFaces.back;
                newFaces.back = newFaces.top;
                newFaces.top = temp;
            } else if (rotX === -90) {
                const temp = newFaces.front;
                newFaces.front = newFaces.top;
                newFaces.top = newFaces.back;
                newFaces.back = newFaces.bottom;
                newFaces.bottom = temp;
            }
            
            // Apply Y rotation second
            if (rotY === 90) {
                const temp = newFaces.left;
                newFaces.left = newFaces.back;
                newFaces.back = newFaces.right;
                newFaces.right = newFaces.front;
                newFaces.front = temp;
            } else if (rotY === -90) {
                const temp = newFaces.left;
                newFaces.left = newFaces.front;
                newFaces.front = newFaces.right;
                newFaces.right = newFaces.back;
                newFaces.back = temp;
            }
        }
        
        return newFaces;
    }

    shouldFlipYRotation(moveNumber) {
        // Pattern: moves 2,3,6,7,10,11,14,15,18,19 etc.
        // These are 4n-2 and 4n-1 moves (where n starts from 1)
        const remainder = moveNumber % 4;
        return remainder === 2 || remainder === 3;
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
        
        // Initialize with logical face positions for tracking
        dice.dataset.currentFaces = JSON.stringify(this.logicalFacePositions);
        
        // Standard dice face values - using PHYSICAL positions for rendering
        const faceValues = {
            'front': this.physicalFacePositions.front,
            'back': this.physicalFacePositions.back, 
            'right': this.physicalFacePositions.right,
            'left': this.physicalFacePositions.left,
            'top': this.physicalFacePositions.top,
            'bottom': this.physicalFacePositions.bottom
        };
        
        console.log('\n=== CREATING DICE ===');
        console.log('Physical rendering positions:', this.physicalFacePositions);
        console.log('Logical tracking positions:', this.logicalFacePositions);
        
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

    /**
     * UPDATED: New level-based dice rolling method
     */
    async rollDiceForLevel(level, usedSums) {
        console.log('\n🎲🎲🎲 STARTING LEVEL-BASED DICE ROLL 🎲🎲🎲');
        console.log(`📊 Level: ${level}`);
        
        // Generate targets based on level
        const targets = this.generateLevelBasedTargets(level, usedSums);
        const { leftValue: leftTarget, rightValue: rightTarget } = targets;
        
        console.log(`🎯 TARGETS: Left dice = ${leftTarget}, Right dice = ${rightTarget}, Total = ${targets.total}`);
        
        // Assign speed sets randomly (ensuring they're different)
        const speedAssignment = this.assignSpeedSets();
        
        // Get random colors
        const colors = this.getRandomDiceColors();
        
        // Create two dice with positioning classes
        const leftDice = this.createDice(colors.left, true);
        const rightDice = this.createDice(colors.right, false);
        
        // Store speed assignments in dice data
        leftDice.dataset.speedSet = speedAssignment.left;
        rightDice.dataset.speedSet = speedAssignment.right;
        
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
        
        // Generate movement sequences until targets are reached
        const leftSequence = this.generateTargetBasedSequence(leftTarget, 'Left');
        const rightSequence = this.generateTargetBasedSequence(rightTarget, 'Right');
        
        // Pre-log predictions for BOTH dice before any physical execution
        console.log('\n🎯🎯🎯 COMPLETE PREDICTIONS FOR BOTH DICE 🎯🎯🎯');
        this.logPredictedSequence(leftDice, leftSequence, 'Left');
        this.logPredictedSequence(rightDice, rightSequence, 'Right');
        console.log('\n🎬🎬🎬 STARTING PHYSICAL EXECUTION 🎬🎬🎬\n');
        
        // Execute both sequences with speed-based timing
        const leftPromise = this.executeMovementSequence(leftDice, leftSequence, 'Left');
        const rightPromise = this.executeMovementSequence(rightDice, rightSequence, 'Right');
        
        // Wait for both to complete
        await Promise.all([leftPromise, rightPromise]);
        
        // Read the final faces using tracking data
        const leftValue = this.getCurrentFrontFace(leftDice);
        const rightValue = this.getCurrentFrontFace(rightDice);
        const total = leftValue + rightValue;
        
        console.log(`\n🎯 FINAL RESULT: Left=${leftValue}, Right=${rightValue}, Total=${total}`);
        console.log(`🎯 EXPECTED: Left=${leftTarget}, Right=${rightTarget}, Total=${leftTarget + rightTarget}`);
        
        // Verify results
        if (leftValue !== leftTarget || rightValue !== rightTarget) {
            console.warn(`⚠️ MISMATCH! Expected (${leftTarget}, ${rightTarget}) but got (${leftValue}, ${rightValue})`);
        } else {
            console.log(`✅ SUCCESS! Dice landed on expected values`);
        }
        
        return { left: leftValue, right: rightValue, total: total };
    }

    /**
     * LEGACY: Keep original methods for backward compatibility
     */
    async rollDiceForSequence(sequenceIndex) {
        console.warn('⚠️ rollDiceForSequence is deprecated - use rollDiceForLevel instead');
        return this.rollDiceForLevel('L1', new Set());
    }

    async rollDice() {
        console.warn('⚠️ rollDice is deprecated - use rollDiceForLevel instead');
        return this.rollDiceForLevel('L1', new Set());
    }

    // Separate method to log predicted sequence for any dice
    logPredictedSequence(dice, movementSequence, diceName) {
        console.log(`\n🎯 PREDICTED SEQUENCE FOR ${diceName} DICE:`);
        let predictedFaces = JSON.parse(dice.dataset.currentFaces);
        console.log(`INITIAL: Front: ${predictedFaces.front} | Back: ${predictedFaces.back} | Left: ${predictedFaces.left} | Right: ${predictedFaces.right} | Top: ${predictedFaces.top} | Bottom: ${predictedFaces.bottom}`);
        
        movementSequence.forEach((move, index) => {
            const { moveNumber, rotX, rotY, name } = move;
            
            // Predict step A and B based on CSS execution order
            const isOddMove = (moveNumber % 2 === 1);
            
            if (isOddMove) {
                // ODD MOVES: CSS does Y-then-X
                if (rotY !== 0) {
                    predictedFaces = this.applyLogicalTransform({ ...predictedFaces }, 0, rotY, moveNumber);
                    console.log(`MOVE ${moveNumber}A (${name}): rotY=${rotY} → Front: ${predictedFaces.front} | Back: ${predictedFaces.back} | Left: ${predictedFaces.left} | Right: ${predictedFaces.right} | Top: ${predictedFaces.top} | Bottom: ${predictedFaces.bottom}`);
                }
                if (rotX !== 0) {
                    predictedFaces = this.applyLogicalTransform({ ...predictedFaces }, rotX, 0, moveNumber);
                    console.log(`MOVE ${moveNumber}B (${name}): rotX=${rotX} → Front: ${predictedFaces.front} | Back: ${predictedFaces.back} | Left: ${predictedFaces.left} | Right: ${predictedFaces.right} | Top: ${predictedFaces.top} | Bottom: ${predictedFaces.bottom}`);
                }
            } else {
                // EVEN MOVES: CSS does X-then-Y
                if (rotX !== 0) {
                    predictedFaces = this.applyLogicalTransform({ ...predictedFaces }, rotX, 0, moveNumber);
                    console.log(`MOVE ${moveNumber}A (${name}): rotX=${rotX} → Front: ${predictedFaces.front} | Back: ${predictedFaces.back} | Left: ${predictedFaces.left} | Right: ${predictedFaces.right} | Top: ${predictedFaces.top} | Bottom: ${predictedFaces.bottom}`);
                }
                if (rotY !== 0) {
                    predictedFaces = this.applyLogicalTransform({ ...predictedFaces }, 0, rotY, moveNumber);
                    console.log(`MOVE ${moveNumber}B (${name}): rotY=${rotY} → Front: ${predictedFaces.front} | Back: ${predictedFaces.back} | Left: ${predictedFaces.left} | Right: ${predictedFaces.right} | Top: ${predictedFaces.top} | Bottom: ${predictedFaces.bottom}`);
                }
            }
            
            // For single component moves, the result is already in predictedFaces from above
            if (rotY === 0 || rotX === 0) {
                console.log(`MOVE ${moveNumber} (${name}): Complete → Front: ${predictedFaces.front} | Back: ${predictedFaces.back} | Left: ${predictedFaces.left} | Right: ${predictedFaces.right} | Top: ${predictedFaces.top} | Bottom: ${predictedFaces.bottom}`);
            }
        });
    }

    /**
     * UPDATED: Execute movement sequence with speed-based timing
     */
    async executeMovementSequence(dice, movementSequence, diceName) {
        return new Promise((resolve) => {
            let sequenceIndex = 0;
            let currentRotationX = parseInt(dice.dataset.currentRotationX) || 0;
            let currentRotationY = parseInt(dice.dataset.currentRotationY) || 0;
            let currentFaces = JSON.parse(dice.dataset.currentFaces);
            const speedSet = dice.dataset.speedSet;
            const totalMoves = movementSequence.length;
            
            const executeNextMove = () => {
                if (sequenceIndex >= movementSequence.length) {
                    dice.classList.add('dice-final');
                    console.log(`\n✅ ${diceName} dice completed ${movementSequence.length} moves`);
                    console.log(`Final front face: ${currentFaces.front}`);
                    resolve();
                    return;
                }
                
                const intendedMove = movementSequence[sequenceIndex];
                const { moveNumber, rotX, rotY, name, type } = intendedMove;
                
                // Apply logical transformation (using CSS execution order)
                const newFaces = this.applyLogicalTransform(currentFaces, rotX, rotY, moveNumber);
                
                // Apply CSS pattern corrections
                const cssCorrections = this.applyCSSPatternCorrections(intendedMove);
                const { cssRotX, cssRotY, cssOrder, shouldFlipY, shouldFlipOrder } = cssCorrections;
                
                // Get movement duration based on speed set and position
                const flipDuration = this.getMovementDuration(speedSet, moveNumber, totalMoves, type);
                
                // Log CSS execution details for left dice only during execution
                if (diceName === 'Left') {
                    console.log(`📱 CSS EXECUTION - MOVE ${moveNumber}: ${name} (${flipDuration}s)`);
                    console.log(`   Intended: rotX=${rotX}, rotY=${rotY}`);
                    console.log(`   CSS: rotX=${cssRotX}, rotY=${cssRotY}`);
                    console.log(`   Order: ${cssOrder} ${shouldFlipOrder ? '(ORDER-FLIPPED)' : '(NORMAL)'}`);
                    console.log(`   Y-Direction: ${shouldFlipY ? 'FLIPPED' : 'NORMAL'}`);
                    console.log(`   Result: Front=${newFaces.front}\n`);
                }
                
                // Apply CSS transform with corrections
                currentRotationX += cssRotX;
                currentRotationY += cssRotY;
                
                dice.style.transition = `transform ${flipDuration}s ease-in-out`;
                dice.style.transform = `rotateX(${currentRotationX}deg) rotateY(${currentRotationY}deg)`;
                
                // Update tracking
                dice.dataset.currentRotationX = currentRotationX;
                dice.dataset.currentRotationY = currentRotationY;
                dice.dataset.currentFaces = JSON.stringify(newFaces);
                dice.dataset.moveCount = moveNumber;
                currentFaces = newFaces;
                
                sequenceIndex++;
                
                // Schedule next move
                const nextTimeout = setTimeout(executeNextMove, flipDuration * 1000);
                this.rollTimeouts.push(nextTimeout);
            };
            
            // Start sequence after fade-in
            const initialTimeout = setTimeout(executeNextMove, 1300);
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
