class MultiDiceRenderer {
    constructor() {
        // SEARCH FOR THIS LINE: MULTI DICE RENDERER 2025-01-01
        this.currentDice = [];
        this.rollTimeouts = [];
        this.currentMode = CONFIG.GAME_MODES.TWO_DICE; // Default to 2 dice
        
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
        
        // Level-based dice ranges
        this.levelRanges = {
            L1: [1, 2, 3],
            L2: [2, 3, 4], 
            L3: [1, 2, 3, 4, 5, 6]
        };
        
        // Speed sets for movement timing
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

    /**
     * Set the game mode (2, 3, or 4 dice)
     */
    setGameMode(mode) {
        this.currentMode = mode;
        console.log(`🎲 Dice renderer set to ${mode} mode`);
        
        // Update game area data attribute for CSS styling
        const gameArea = document.querySelector('.game-area');
        if (gameArea) {
            gameArea.setAttribute('data-mode', mode);
        }
        
        // Update CSS custom properties for sum bar width
        const modeKey = mode.toUpperCase().replace('_', '_');
        const config = CONFIG.SUM_BAR_CONFIG[modeKey];
        if (config) {
            document.documentElement.style.setProperty('--sum-bar-width-multiplier', config.widthMultiplier);
        }
        
        // Position plus sign based on mode
        this.positionPlusSign();
    }

    /**
     * Position the plus sign based on current mode
     */
    positionPlusSign() {
        const plusSign = document.querySelector('.plus-sign');
        if (!plusSign) return;
        
        const modeKey = this.currentMode.toUpperCase().replace('_', '_');
        const position = CONFIG.PLUS_POSITIONS[modeKey];
        if (position) {
            plusSign.style.left = `calc(${position.x}% - calc(var(--red-circle-diameter) / 2))`;
            plusSign.style.top = `calc(${position.y}% - calc(var(--red-circle-diameter) / 2))`;
        }
    }

    setupResizeHandling() {
        window.addEventListener('resize', () => {
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }
            this.resizeTimeout = setTimeout(() => {
                this.updateDiceSize();
                this.positionPlusSign();
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
        // Remove all existing dice and flash circles
        this.currentDice.forEach(dice => {
            if (dice && dice.parentNode) {
                dice.parentNode.removeChild(dice);
            }
        });
        this.currentDice = [];
        
        // Clear flash circles
        const flashCircles = document.querySelectorAll('.dice-flash-circle');
        flashCircles.forEach(circle => {
            if (circle.parentNode) {
                circle.parentNode.removeChild(circle);
            }
        });
        
        // Clear any pending timeouts
        this.rollTimeouts.forEach(timeout => clearTimeout(timeout));
        this.rollTimeouts = [];
    }

    /**
     * Get the number of dice for current mode
     */
    getDiceCount() {
        switch (this.currentMode) {
            case CONFIG.GAME_MODES.TWO_DICE: return 2;
            case CONFIG.GAME_MODES.THREE_DICE: return 3;
            case CONFIG.GAME_MODES.FOUR_DICE: return 4;
            default: return 2;
        }
    }

    /**
     * Get dice positions for current mode
     */
    getDicePositions() {
        const modeKey = this.currentMode.toUpperCase().replace('_', '_');
        return CONFIG.DICE_POSITIONS[modeKey] || CONFIG.DICE_POSITIONS.TWO_DICE;
    }

    /**
     * Get random dice colors ensuring no repeats and enough colors for mode
     */
    getRandomDiceColors() {
        const diceCount = this.getDiceCount();
        
        // Get colors that weren't used in the previous set
        let availableForSelection = this.availableColors.filter(color => 
            !this.previousColors.includes(color)
        );
        
        // If we don't have enough unused colors, reset and use all colors
        if (availableForSelection.length < diceCount) {
            availableForSelection = [...this.availableColors];
            console.log('Resetting color pool - all colors available again');
        }
        
        // Shuffle the available colors and pick the required number
        const shuffled = [...availableForSelection].sort(() => Math.random() - 0.5);
        const selectedColors = shuffled.slice(0, diceCount);
        
        // Store these colors as the previous set for next time
        this.previousColors = [...selectedColors];
        
        console.log(`Selected dice colors: [${selectedColors.join(', ')}]`);
        
        return selectedColors;
    }

    /**
     * Generate targets based on level and used sums for current mode
     */
    generateLevelBasedTargets(level, usedSums) {
        const range = this.levelRanges[level];
        const diceCount = this.getDiceCount();
        
        if (!range) {
            console.error(`Invalid level: ${level}`);
            const fallbackValues = Array(diceCount).fill(1);
            return { 
                values: fallbackValues, 
                total: fallbackValues.reduce((a, b) => a + b, 0) 
            };
        }
        
        console.log(`🎯 Generating targets for ${level} with range [${range.join(', ')}] for ${diceCount} dice`);
        console.log(`🚫 Avoiding used combinations: [${Array.from(usedSums).sort().join(', ')}]`);
        
        // Try up to 10 times to find a non-repeated combination
        for (let attempt = 1; attempt <= 10; attempt++) {
            const values = Array(diceCount).fill(0).map(() => 
                range[Math.floor(Math.random() * range.length)]
            );
            const total = values.reduce((a, b) => a + b, 0);
            
            // Create sorted string representation to check for duplicate combinations
            const sortedValues = [...values].sort((a, b) => a - b);
            const combinationKey = sortedValues.join(',');
            
            if (!usedSums.has(combinationKey)) {
                console.log(`✅ Found unique combination on attempt ${attempt}: [${values.join(', ')}] = ${total}`);
                return { values, total, combinationKey };
            }
            
            console.log(`🔄 Attempt ${attempt}: combination [${values.join(', ')}] already used, trying again...`);
        }
        
        // After 10 attempts, just use the last generated values
        const values = Array(diceCount).fill(0).map(() => 
            range[Math.floor(Math.random() * range.length)]
        );
        const total = values.reduce((a, b) => a + b, 0);
        const sortedValues = [...values].sort((a, b) => a - b);
        const combinationKey = sortedValues.join(',');
        
        console.warn(`⚠️ Using repeat combination after 10 attempts: [${values.join(', ')}] = ${total}`);
        return { values, total, combinationKey };
    }

    /**
     * Assign random speed sets ensuring they're different for each dice
     */
    assignSpeedSets() {
        const diceCount = this.getDiceCount();
        const sets = ['A', 'B'];
        const assignments = [];
        
        for (let i = 0; i < diceCount; i++) {
            // Cycle through available sets
            assignments.push(sets[i % sets.length]);
        }
        
        // Shuffle to randomize which dice get which set
        const shuffled = [...assignments].sort(() => Math.random() - 0.5);
        
        console.log(`🏃‍♀️ Speed assignment: [${shuffled.join(', ')}]`);
        
        return shuffled;
    }

    /**
     * Get movement duration based on speed set and position in sequence
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
     * Generate movement sequence with new constraints
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

    /**
     * Create a dice element with proper positioning
     */
    createDice(diceColor, position, positionKey) {
        const dice = document.createElement('div');
        dice.className = `dice positioned`;
        dice.dataset.position = positionKey;
        dice.style.opacity = '0';
        dice.style.transformStyle = 'preserve-3d';
        
        // Calculate dice size dynamically - width is 12% of game area width
        const gameArea = document.querySelector('.game-area');
        const gameAreaWidth = gameArea.offsetWidth;
        const diceWidthPx = gameAreaWidth * 0.12; // 12% of game area width
        const halfDiceSize = diceWidthPx / 2;
        
        // Set height to match width in pixels for perfect square
        dice.style.height = `${diceWidthPx}px`;
        
        // Position the dice based on coordinates
        dice.style.left = `calc(${position.x}% - 6%)`; // Center by subtracting half width
        dice.style.top = `calc(${position.y}% - calc(var(--game-area-width) * 0.06))`; // Center by subtracting 6% of game area width
        
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
        
        console.log(`\n=== CREATING ${positionKey.toUpperCase()} DICE ===`);
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

    /**
     * Create flash circle for a dice position
     */
    createFlashCircle(position, positionKey) {
        const circle = document.createElement('div');
        circle.className = 'dice-flash-circle';
        circle.dataset.position = positionKey;
        
        // Position the circle centered on the dice position
        circle.style.left = `calc(${position.x}% - calc(var(--dice-flash-diameter) / 2))`;
        circle.style.top = `calc(${position.y}% - calc(var(--dice-flash-diameter) / 2))`;
        
        return circle;
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
     * Main dice rolling method for current mode with level-based targets
     */
    async rollDiceForLevel(level, usedSums) {
        console.log(`\n🎲🎲🎲 STARTING ${this.currentMode.toUpperCase()} DICE ROLL 🎲🎲🎲`);
        console.log(`📊 Level: ${level}`);
        
        // Generate targets based on level and mode
        const targets = this.generateLevelBasedTargets(level, usedSums);
        const { values: targetValues, total, combinationKey } = targets;
        
        console.log(`🎯 TARGETS: [${targetValues.join(', ')}], Total = ${total}`);
        
        // Get positions and colors for current mode
        const positions = this.getDicePositions();
        const colors = this.getRandomDiceColors();
        const speedAssignments = this.assignSpeedSets();
        
        // Create dice and flash circles
        const gameArea = document.querySelector('.game-area');
        const positionKeys = Object.keys(positions);
        
        for (let i = 0; i < targetValues.length; i++) {
            const positionKey = positionKeys[i];
            const position = positions[positionKey];
            const color = colors[i];
            const speedSet = speedAssignments[i];
            
            // Create dice
            const dice = this.createDice(color, position, positionKey);
            dice.dataset.speedSet = speedSet;
            dice.dataset.targetValue = targetValues[i];
            
            // Create flash circle
            const flashCircle = this.createFlashCircle(position, positionKey);
            
            gameArea.appendChild(flashCircle);
            gameArea.appendChild(dice);
            this.currentDice.push(dice);
        }
        
        // Fade in dice
        setTimeout(() => {
            this.currentDice.forEach(dice => {
                dice.style.transition = 'opacity 1s ease-in';
                dice.style.opacity = '1';
                
                const faces = dice.querySelectorAll('.dice-face');
                faces.forEach(face => {
                    face.style.transition = 'opacity 1s ease-in';
                    face.style.opacity = '1';
                });
            });
        }, 200);
        
        // Generate movement sequences for each dice
        const sequences = [];
        for (let i = 0; i < this.currentDice.length; i++) {
            const dice = this.currentDice[i];
            const targetValue = parseInt(dice.dataset.targetValue);
            const positionKey = dice.dataset.position;
            
            const sequence = this.generateTargetBasedSequence(targetValue, positionKey);
            sequences.push(sequence);
        }
        
        // Pre-log predictions
        console.log('\n🎯🎯🎯 COMPLETE PREDICTIONS FOR ALL DICE 🎯🎯🎯');
        this.currentDice.forEach((dice, i) => {
            this.logPredictedSequence(dice, sequences[i], dice.dataset.position);
        });
        console.log('\n🎬🎬🎬 STARTING PHYSICAL EXECUTION 🎬🎬🎬\n');
        
        // Execute all sequences in parallel
        const promises = this.currentDice.map((dice, i) => 
            this.executeMovementSequence(dice, sequences[i], dice.dataset.position)
        );
        
        // Wait for all dice to complete
        await Promise.all(promises);
        
        // Read final values
        const finalValues = this.currentDice.map(dice => this.getCurrentFrontFace(dice));
        const finalTotal = finalValues.reduce((a, b) => a + b, 0);
        
        console.log(`\n🎯 FINAL RESULT: [${finalValues.join(', ')}], Total=${finalTotal}`);
        console.log(`🎯 EXPECTED: [${targetValues.join(', ')}], Total=${total}`);
        
        // Verify results
        const matches = finalValues.every((value, i) => value === targetValues[i]);
        if (!matches) {
            console.warn(`⚠️ MISMATCH! Expected [${targetValues.join(', ')}] but got [${finalValues.join(', ')}]`);
        } else {
            console.log(`✅ SUCCESS! All dice landed on expected values`);
        }
        
        return { 
            values: finalValues, 
            total: finalTotal, 
            combinationKey: combinationKey || [...finalValues].sort((a, b) => a - b).join(',')
        };
    }

    /**
     * Separate method to log predicted sequence for any dice
     */
    logPredictedSequence(dice, movementSequence, diceName) {
        console.log(`\n🎯 PREDICTED SEQUENCE FOR ${diceName.toUpperCase()} DICE:`);
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
     * Execute movement sequence with speed-based timing
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
                
                // Log CSS execution details for first dice only during execution
                if (sequenceIndex === 0) {
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
        
        // Fade out flash circles
        const flashCircles = document.querySelectorAll('.dice-flash-circle');
        flashCircles.forEach(circle => {
            circle.style.transition = 'opacity 1s ease-out';
            circle.style.opacity = '0';
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
                
                // Remove flash circles
                flashCircles.forEach(circle => {
                    if (circle.parentNode) {
                        circle.parentNode.removeChild(circle);
                    }
                });
                
                resolve();
            }, 1000);
            this.rollTimeouts.push(timeout);
        });
    }

    getCurrentValues() {
        const values = this.currentDice.map(dice => this.getCurrentFrontFace(dice));
        const total = values.reduce((a, b) => a + b, 0);
        return { values, total };
    }

    /**
     * Get flash circle for a specific dice position
     */
    getFlashCircleForPosition(positionKey) {
        return document.querySelector(`.dice-flash-circle[data-position="${positionKey}"]`);
    }

    /**
     * Show flash circle for specific position
     */
    showFlashForPosition(positionKey) {
        const circle = this.getFlashCircleForPosition(positionKey);
        if (circle) {
            circle.classList.add('circle-flash');
        }
    }

    /**
     * Hide flash circle for specific position
     */
    hideFlashForPosition(positionKey) {
        const circle = this.getFlashCircleForPosition(positionKey);
        if (circle) {
            circle.classList.remove('circle-flash');
        }
    }

    /**
     * Hide all flash circles
     */
    hideAllFlash() {
        const circles = document.querySelectorAll('.dice-flash-circle');
        circles.forEach(circle => {
            circle.classList.remove('circle-flash');
        });
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
        
        // Reset to default mode
        this.currentMode = CONFIG.GAME_MODES.TWO_DICE;
        
        // Reset game area mode
        const gameArea = document.querySelector('.game-area');
        if (gameArea) {
            gameArea.setAttribute('data-mode', this.currentMode);
        }
        
        console.log('Multi-dice renderer reset - color tracking cleared, mode reset to 2 dice');
    }

    /**
     * Legacy methods for backward compatibility
     */
    async rollDiceForSequence(sequenceIndex) {
        console.warn('⚠️ rollDiceForSequence is deprecated - use rollDiceForLevel instead');
        return this.rollDiceForLevel('L1', new Set());
    }

    async rollDice() {
        console.warn('⚠️ rollDice is deprecated - use rollDiceForLevel instead');
        return this.rollDiceForLevel('L1', new Set());
    }
}
