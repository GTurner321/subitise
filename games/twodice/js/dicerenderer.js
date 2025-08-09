class DiceRenderer {
    constructor() {
        // SEARCH FOR THIS LINE: DICE RENDERER UPDATED 2025-01-09 - TARGET CONTROLLED
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
            dice.style.height = `${diceWidthPx}px`;
            dice.dataset.halfSize = halfDiceSize;
            
            const faces = dice.querySelectorAll('.dice-face');
            faces.forEach(face => {
                const faceClass = face.classList[1];
                this.setFace3DPosition(face, faceClass, halfDiceSize);
            });
            
            const dots = dice.querySelectorAll('.dice-dot');
            const dotSize = gameAreaWidth * 0.018;
            dots.forEach(dot => {
                dot.style.width = `${dotSize}px`;
                dot.style.height = `${dotSize}px`;
            });
        });
    }

    clearDice() {
        this.currentDice.forEach(dice => {
            if (dice && dice.parentNode) {
                dice.parentNode.removeChild(dice);
            }
        });
        this.currentDice = [];
        
        this.rollTimeouts.forEach(timeout => clearTimeout(timeout));
        this.rollTimeouts = [];
    }

    getRandomDiceColors() {
        let availableForSelection = this.availableColors.filter(color => 
            !this.previousColors.includes(color)
        );
        
        if (availableForSelection.length < 2) {
            availableForSelection = [...this.availableColors];
            console.log('Resetting color pool - all colors available again');
        }
        
        const shuffled = [...availableForSelection].sort(() => Math.random() - 0.5);
        const selectedColors = {
            left: shuffled[0],
            right: shuffled[1]
        };
        
        this.previousColors = [selectedColors.left, selectedColors.right];
        
        console.log(`Selected dice colors: Left=${selectedColors.left}, Right=${selectedColors.right}`);
        
        return selectedColors;
    }

    /**
     * Get the three "rolling toward user" movements
     */
    getTowardUserMoves() {
        return [
            { rotX: 90, rotY: 90, name: 'diagonal-right', type: 'diagonal' },   // Top-right diagonal
            { rotX: 90, rotY: -90, name: 'diagonal-left', type: 'diagonal' },   // Top-left diagonal  
            { rotX: 90, rotY: 0, name: 'top-to-bottom', type: 'topToBottom' }   // Forward roll
        ];
    }

    /**
     * Select random movement based on configured probabilities
     */
    getRandomTowardUserMove() {
        const moves = this.getTowardUserMoves();
        const rand = Math.random();
        
        // 40% for first diagonal, 40% for second diagonal, 20% for top-to-bottom
        if (rand < CONFIG.DICE_ROLLING.DIAGONAL_PROBABILITY) {
            return moves[0]; // diagonal-right
        } else if (rand < CONFIG.DICE_ROLLING.DIAGONAL_PROBABILITY * 2) {
            return moves[1]; // diagonal-left
        } else {
            return moves[2]; // top-to-bottom
        }
    }

    /**
     * Generate a predetermined sequence to reach target face
     */
    generateSequenceForTarget(targetFace, maxMoves = CONFIG.DICE_ROLLING.MAX_MOVES) {
        console.log(`🎯 Generating sequence to reach target face: ${targetFace}`);
        
        // Try to generate a sequence that hits the target
        for (let attempt = 1; attempt <= CONFIG.DICE_ROLLING.MAX_SEQUENCE_ATTEMPTS; attempt++) {
            console.log(`📝 Sequence attempt ${attempt}/${CONFIG.DICE_ROLLING.MAX_SEQUENCE_ATTEMPTS}`);
            
            const sequence = this.createRandomSequence(maxMoves);
            const targetIndex = this.findTargetInSequence(sequence, targetFace);
            
            if (targetIndex >= CONFIG.DICE_ROLLING.TARGET_CHECK_START - 1) { // -1 because array is 0-indexed
                console.log(`✅ Target found at move ${targetIndex + 1}, truncating sequence`);
                return sequence.slice(0, targetIndex + 1);
            }
        }
        
        // Fallback: create sequence and stop at fallback move
        console.warn(`⚠️ Could not find target ${targetFace} in ${CONFIG.DICE_ROLLING.MAX_SEQUENCE_ATTEMPTS} attempts, using fallback`);
        const fallbackSequence = this.createRandomSequence(CONFIG.DICE_ROLLING.FALLBACK_STOP_MOVE);
        const finalFace = this.simulateSequence(fallbackSequence);
        console.log(`🎲 Fallback sequence will show face: ${finalFace}`);
        return fallbackSequence;
    }

    /**
     * Create a random sequence of moves
     */
    createRandomSequence(length) {
        const sequence = [];
        for (let i = 0; i < length; i++) {
            sequence.push(this.getRandomTowardUserMove());
        }
        return sequence;
    }

    /**
     * Find target face in a sequence (simulates the dice rolling)
     */
    findTargetInSequence(sequence, targetFace) {
        let currentRotX = 0;
        let currentRotY = 0;
        
        for (let i = 0; i < sequence.length; i++) {
            const move = sequence[i];
            currentRotX += move.rotX;
            currentRotY += move.rotY;
            
            const visibleFace = this.calculateVisibleFace(currentRotX, currentRotY);
            
            if (i >= CONFIG.DICE_ROLLING.TARGET_CHECK_START - 1 && visibleFace === targetFace) {
                console.log(`🎯 Target ${targetFace} found at move ${i + 1} in sequence`);
                return i;
            }
        }
        
        return -1; // Target not found
    }

    /**
     * Simulate entire sequence and return final face
     */
    simulateSequence(sequence) {
        let currentRotX = 0;
        let currentRotY = 0;
        
        sequence.forEach(move => {
            currentRotX += move.rotX;
            currentRotY += move.rotY;
        });
        
        return this.calculateVisibleFace(currentRotX, currentRotY);
    }

    /**
     * Calculate which face is visible based on rotation values
     * This is a simplified version - you may need to adjust based on your 3D setup
     */
    calculateVisibleFace(rotX, rotY) {
        // Normalize rotations to 0-360 range
        const normalizedX = ((rotX % 360) + 360) % 360;
        const normalizedY = ((rotY % 360) + 360) % 360;
        
        // Map rotation combinations to faces
        // This mapping depends on your cube's initial orientation and face assignments
        // You may need to adjust these mappings based on testing
        
        const key = `${normalizedX}-${normalizedY}`;
        
        // Basic mapping - you'll need to expand/refine this based on your cube setup
        const rotationToFace = {
            '0-0': 1,    // front
            '90-0': 3,   // top to front
            '180-0': 6,  // back to front  
            '270-0': 4,  // bottom to front
            '0-90': 5,   // left to front
            '0-270': 2,  // right to front
            '90-90': 2,  // diagonal combinations
            '90-270': 5,
            // Add more combinations as needed
        };
        
        const face = rotationToFace[key];
        if (face) {
            return face;
        }
        
        // Fallback: calculate based on dominant rotation
        if (normalizedX === 0) {
            // Pure Y rotations
            switch (normalizedY) {
                case 0: return 1;
                case 90: return 5;
                case 180: return 6;
                case 270: return 2;
            }
        } else if (normalizedY === 0) {
            // Pure X rotations
            switch (normalizedX) {
                case 0: return 1;
                case 90: return 3;
                case 180: return 6;
                case 270: return 4;
            }
        }
        
        // Default fallback
        console.warn(`Unknown rotation combination: X=${normalizedX}, Y=${normalizedY}, defaulting to face 1`);
        return 1;
    }

    createDice(diceColor, isLeft = true) {
        const dice = document.createElement('div');
        dice.className = `dice ${isLeft ? 'left-dice' : 'right-dice'}`;
        dice.style.opacity = '0';
        dice.style.transformStyle = 'preserve-3d';
        
        const gameArea = document.querySelector('.game-area');
        const gameAreaWidth = gameArea.offsetWidth;
        const diceWidthPx = gameAreaWidth * 0.12;
        const halfDiceSize = diceWidthPx / 2;
        
        dice.style.height = `${diceWidthPx}px`;
        dice.dataset.halfSize = halfDiceSize;
        
        // Ensure dice container is transparent
        dice.style.backgroundColor = 'transparent';
        dice.style.background = 'transparent';
        dice.style.border = 'none';
        dice.style.boxShadow = 'none';
        
        // Standard dice face values
        const faceValues = {
            'front': 1, 'back': 6, 'right': 2, 'left': 5, 'top': 3, 'bottom': 4
        };
        
        console.log('Creating dice with face values:', faceValues);
        
        // Create all 6 faces
        Object.entries(faceValues).forEach(([faceClass, faceValue]) => {
            const face = document.createElement('div');
            face.className = `dice-face ${faceClass}`;
            face.dataset.faceValue = faceValue;
            
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
            
            // Create inner face
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
            
            // Create colored surface
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
            
            this.createDots(dotsContainer, faceValue, gameAreaWidth, faceClass);
            
            face.appendChild(innerFace);      
            face.appendChild(coloredSurface); 
            face.appendChild(dotsContainer);  
            dice.appendChild(face);
        });
        
        // Set initial orientation
        dice.style.transform = `rotateX(0deg) rotateY(0deg)`;
        dice.dataset.currentRotationX = 0;
        dice.dataset.currentRotationY = 0;
        
        return dice;
    }

    createDots(container, value, gameAreaWidth, faceClass = '') {
        const pattern = CONFIG.DICE_FACES[value];
        container.innerHTML = '';
        
        if (faceClass) {
            console.log(`Creating ${value} dots for ${faceClass} face`);
        }
        
        const dotSize = gameAreaWidth * 0.018;
        
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const dot = document.createElement('div');
                dot.className = 'dice-dot';
                
                dot.style.width = `${dotSize}px`;
                dot.style.height = `${dotSize}px`;
                dot.style.borderRadius = '50%';
                dot.style.backgroundColor = '#333';
                dot.style.margin = 'auto';
                dot.style.transition = 'opacity 0.1s ease';
                dot.style.pointerEvents = 'none';
                dot.style.touchAction = 'none';
                
                if (pattern[row][col] === 1) {
                    dot.classList.add('active');
                    dot.style.opacity = '1';
                } else {
                    dot.style.opacity = '0';
                }
                
                container.appendChild(dot);
            }
        }
    }

    setFace3DPosition(face, faceClass, halfSize) {
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
     * Z-depth detection for final face reading
     */
    readVisibleFaceByZDepth(dice) {
        console.log('=== Z-DEPTH FACE DETECTION ===');
        
        const diceStyle = window.getComputedStyle(dice);
        const diceTransform = diceStyle.transform;
        
        if (!diceTransform || diceTransform === 'none') {
            console.warn('No dice transform found, defaulting to 1');
            return 1;
        }
        
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
        
        const faceNormals = {
            'front': [0, 0, 1],
            'back': [0, 0, -1],
            'right': [1, 0, 0],
            'left': [-1, 0, 0],
            'top': [0, 1, 0],
            'bottom': [0, -1, 0]
        };
        
        faces.forEach(face => {
            const faceClass = face.classList[1];
            const faceValue = parseInt(face.dataset.faceValue);
            const normal = faceNormals[faceClass];
            
            if (!normal) return;
            
            const transformedNormal = [
                normal[0] * diceMatrix.m11 + normal[1] * diceMatrix.m21 + normal[2] * diceMatrix.m31,
                normal[0] * diceMatrix.m12 + normal[1] * diceMatrix.m22 + normal[2] * diceMatrix.m32,
                normal[0] * diceMatrix.m13 + normal[1] * diceMatrix.m23 + normal[2] * diceMatrix.m33
            ];
            
            const zComponent = transformedNormal[2];
            
            if (zComponent > maxZ) {
                maxZ = zComponent;
                frontmostFace = face;
            }
        });
        
        if (frontmostFace) {
            const finalValue = parseInt(frontmostFace.dataset.faceValue);
            const faceClass = frontmostFace.classList[1];
            
            console.log(`Frontmost face: ${faceClass} with value ${finalValue} (Z-component: ${maxZ.toFixed(3)})`);
            console.log('=== Z-DEPTH DETECTION COMPLETE ===');
            
            return Math.max(1, Math.min(6, finalValue));
        }
        
        console.warn('No frontmost face found, defaulting to 1');
        return 1;
    }

    /**
     * Roll dice with predetermined target values
     */
    async rollDice(leftTarget, rightTarget) {
        console.log('=== STARTING TARGET-CONTROLLED DICE ROLL ===');
        console.log(`🎯 Targets: Left=${leftTarget}, Right=${rightTarget}`);
        
        const colors = this.getRandomDiceColors();
        
        const leftDice = this.createDice(colors.left, true);
        const rightDice = this.createDice(colors.right, false);
        
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
        
        // Generate sequences for both dice
        const leftSequence = this.generateSequenceForTarget(leftTarget);
        const rightSequence = this.generateSequenceForTarget(rightTarget);
        
        // Assign speed sets randomly
        const leftIsSetA = Math.random() < 0.5;
        const leftSpeedSet = leftIsSetA ? 'A' : 'B';
        const rightSpeedSet = leftIsSetA ? 'B' : 'A';
        
        console.log(`🎰 Speed assignment: Left=${leftSpeedSet}, Right=${rightSpeedSet}`);
        
        // Roll both dice with their sequences
        const leftPromise = this.executeSequence(leftDice, leftSequence, leftSpeedSet, 'Left');
        const rightPromise = this.executeSequence(rightDice, rightSequence, rightSpeedSet, 'Right');
        
        await Promise.all([leftPromise, rightPromise]);
        
        // Read final faces
        const leftValue = this.readVisibleFaceByZDepth(leftDice);
        const rightValue = this.readVisibleFaceByZDepth(rightDice);
        const total = leftValue + rightValue;
        
        console.log(`=== TARGET-CONTROLLED ROLLING COMPLETE ===`);
        console.log(`Target: Left=${leftTarget}, Right=${rightTarget}`);
        console.log(`Actual: Left=${leftValue}, Right=${rightValue}`);
        console.log(`Total: ${total}`);
        
        return { left: leftValue, right: rightValue, total: total };
    }

    /**
     * Execute a predetermined sequence on a dice
     */
    async executeSequence(dice, sequence, speedSet, diceName) {
        return new Promise((resolve) => {
            let moveIndex = 0;
            let currentRotationX = 0;
            let currentRotationY = 0;
            
            const performMove = () => {
                if (moveIndex >= sequence.length) {
                    dice.classList.add('dice-final');
                    console.log(`${diceName} dice completed sequence after ${sequence.length} moves`);
                    resolve();
                    return;
                }
                
                const move = sequence[moveIndex];
                const isLastThreeMoves = moveIndex >= (sequence.length - 3);
                
                // Get timing based on speed set and move type
                let duration;
                const speedConfig = CONFIG.DICE_ROLLING.SPEED_SETS[speedSet];
                
                if (isLastThreeMoves) {
                    duration = speedConfig.finalThreeMoves[move.type];
                } else {
                    duration = speedConfig[move.type];
                }
                
                console.log(`${diceName} move ${moveIndex + 1}/${sequence.length}: ${move.name} (${duration}s)`);
                
                // Apply rotation
                currentRotationX += move.rotX;
                currentRotationY += move.rotY;
                
                dice.style.transition = `transform ${duration}s ease-in-out`;
                dice.style.transform = `rotateX(${currentRotationX}deg) rotateY(${currentRotationY}deg)`;
                
                // Update tracking
                dice.dataset.currentRotationX = currentRotationX;
                dice.dataset.currentRotationY = currentRotationY;
                
                moveIndex++;
                
                // Schedule next move
                const nextTimeout = setTimeout(performMove, duration * 1000);
                this.rollTimeouts.push(nextTimeout);
            };
            
            // Start sequence after fade-in
            const initialTimeout = setTimeout(performMove, 1300);
            this.rollTimeouts.push(initialTimeout);
        });
    }

    async fadeOutCurrentDice() {
        if (this.currentDice.length === 0) return;
        
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
        this.previousColors = [];
        
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
        
        console.log('Dice renderer reset - color tracking cleared');
    }
}
