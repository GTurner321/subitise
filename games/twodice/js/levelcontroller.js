class LevelBasedDiceController {
    constructor() {
        // Level definitions
        this.levels = {
            L1: { diceRange: [1, 2, 3], name: "Beginner" },
            L2: { diceRange: [2, 3, 4], name: "Intermediate" },
            L3: { diceRange: [1, 2, 3, 4, 5, 6], name: "Expert" }
        };
        
        // Current game state
        this.currentLevel = 'L1';
        this.roundQuestions = 0;
        this.maxRoundQuestions = 10;
        this.usedSumsThisRound = new Set();
        
        // Face mapping for matrix calculations
        this.faceMapping = {
            'front': [0, 0, 1],   // +Z direction
            'back': [0, 0, -1],   // -Z direction  
            'right': [1, 0, 0],   // +X direction
            'left': [-1, 0, 0],   // -X direction
            'top': [0, 1, 0],     // +Y direction
            'bottom': [0, -1, 0]  // -Y direction
        };
        
        // Face values mapping (your current system)
        this.faceValues = {
            'front': 1, 'back': 6, 'right': 2, 
            'left': 5, 'top': 3, 'bottom': 4
        };
        
        // Possible transformation types
        this.transformTypes = [
            { rotX: 90, rotY: 90, name: 'down-right' },
            { rotX: -90, rotY: 90, name: 'up-right' },
            { rotX: 90, rotY: -90, name: 'down-left' },
            { rotX: -90, rotY: -90, name: 'up-left' }
        ];
    }

    /**
     * Generate next question based on current level and round constraints
     */
    generateNextQuestion() {
        const levelConfig = this.levels[this.currentLevel];
        const availableSums = this.getAvailableSums(levelConfig.diceRange);
        
        if (availableSums.length === 0) {
            // No available sums - start new round
            this.startNewRound();
            return this.generateNextQuestion();
        }
        
        // Pick random available sum
        const targetSum = availableSums[Math.floor(Math.random() * availableSums.length)];
        this.usedSumsThisRound.add(targetSum);
        
        // Generate dice combination for this sum
        const diceCombo = this.generateDiceCombination(targetSum, levelConfig.diceRange);
        
        // Generate transformation sequence
        const transformations = this.generateTransformationSequence();
        
        // Calculate starting positions using inverse transforms
        const startingPositions = this.calculateStartingPositions(diceCombo, transformations);
        
        this.roundQuestions++;
        
        return {
            targetSum,
            leftValue: diceCombo.left,
            rightValue: diceCombo.right,
            transformations,
            startingPositions,
            level: this.currentLevel,
            questionNumber: this.roundQuestions
        };
    }

    /**
     * Get all possible sums for current level that haven't been used this round
     */
    getAvailableSums(diceRange) {
        const allPossibleSums = new Set();
        
        // Generate all possible sums from dice range
        for (let left of diceRange) {
            for (let right of diceRange) {
                allPossibleSums.add(left + right);
            }
        }
        
        // Filter out already used sums
        return Array.from(allPossibleSums).filter(sum => !this.usedSumsThisRound.has(sum));
    }

    /**
     * Generate valid dice combination for target sum within level constraints
     */
    generateDiceCombination(targetSum, diceRange) {
        const validCombos = [];
        
        for (let left of diceRange) {
            for (let right of diceRange) {
                if (left + right === targetSum) {
                    validCombos.push({ left, right });
                }
            }
        }
        
        if (validCombos.length === 0) {
            throw new Error(`No valid combination found for sum ${targetSum} in range ${diceRange}`);
        }
        
        return validCombos[Math.floor(Math.random() * validCombos.length)];
    }

    /**
     * Generate random transformation sequence (6-15 moves per dice)
     */
    generateTransformationSequence() {
        const leftMoves = Math.floor(Math.random() * 10) + 6;  // 6-15 moves
        const rightMoves = Math.floor(Math.random() * 10) + 6; // 6-15 moves
        
        return {
            left: this.generateDiceTransforms(leftMoves),
            right: this.generateDiceTransforms(rightMoves)
        };
    }

    /**
     * Generate transform sequence for one dice avoiding reverse moves
     */
    generateDiceTransforms(numMoves) {
        const transforms = [];
        let previousMove = null;
        
        for (let i = 0; i < numMoves; i++) {
            const availableTypes = this.transformTypes.filter(type => {
                if (!previousMove) return true;
                return type.name !== previousMove.reverse;
            });
            
            const selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            transforms.push({
                rotX: selectedType.rotX,
                rotY: selectedType.rotY,
                duration: this.getRandomDuration()
            });
            
            // Set reverse for next iteration
            previousMove = {
                name: selectedType.name,
                reverse: this.getReverseDirection(selectedType.name)
            };
        }
        
        return transforms;
    }

    getReverseDirection(direction) {
        const reverseMap = {
            'down-right': 'up-left',
            'up-right': 'down-left', 
            'down-left': 'up-right',
            'up-left': 'down-right'
        };
        return reverseMap[direction];
    }

    getRandomDuration() {
        const durations = [0.35, 0.45, 0.55, 0.65];
        return durations[Math.floor(Math.random() * durations.length)];
    }

    /**
     * Calculate starting orientations needed to achieve target face after transforms
     */
    calculateStartingPositions(diceCombo, transformations) {
        const leftStarting = this.calculateDiceStartingPosition(diceCombo.left, transformations.left);
        const rightStarting = this.calculateDiceStartingPosition(diceCombo.right, transformations.right);
        
        return { left: leftStarting, right: rightStarting };
    }

    /**
     * Calculate starting position for one dice
     */
    calculateDiceStartingPosition(targetValue, transforms) {
        // Find which face needs to be forward at the end
        let targetFace = null;
        for (let [face, value] of Object.entries(this.faceValues)) {
            if (value === targetValue) {
                targetFace = face;
                break;
            }
        }
        
        if (!targetFace) {
            throw new Error(`No face found for value ${targetValue}`);
        }
        
        // Create final transformation matrix by combining all transforms
        let finalMatrix = this.createIdentityMatrix();
        
        for (let transform of transforms) {
            const transformMatrix = this.createRotationMatrix(transform.rotX, transform.rotY);
            finalMatrix = this.multiplyMatrices(finalMatrix, transformMatrix);
        }
        
        // Get target normal (what direction target face should point at end)
        const targetNormal = [0, 0, 1]; // Forward direction (+Z)
        
        // Calculate what the normal of our target face will be after all transforms
        const targetFaceNormal = this.faceMapping[targetFace];
        const finalNormal = this.transformVector(targetFaceNormal, finalMatrix);
        
        // We need the inverse transformation to find starting position
        const inverseMatrix = this.invertMatrix(finalMatrix);
        
        // Transform target normal by inverse to get required starting normal
        const requiredStartingNormal = this.transformVector(targetNormal, inverseMatrix);
        
        // Find which face direction is closest to required starting normal
        let closestFace = null;
        let closestDot = -Infinity;
        
        for (let [face, normal] of Object.entries(this.faceMapping)) {
            const dotProduct = this.dotProduct(normal, requiredStartingNormal);
            if (dotProduct > closestDot) {
                closestDot = dotProduct;
                closestFace = face;
            }
        }
        
        // Calculate the starting rotation needed to orient this face forward
        const startingRotation = this.calculateStartingRotation(closestFace);
        
        console.log(`Target: ${targetValue}, Face: ${targetFace}, Starting rotation:`, startingRotation);
        
        return startingRotation;
    }

    /**
     * Calculate starting rotation to orient a specific face forward
     */
    calculateStartingRotation(faceName) {
        const rotations = {
            'front': { rotX: 0, rotY: 0 },
            'back': { rotX: 0, rotY: 180 },
            'right': { rotX: 0, rotY: -90 },
            'left': { rotX: 0, rotY: 90 },
            'top': { rotX: -90, rotY: 0 },
            'bottom': { rotX: 90, rotY: 0 }
        };
        
        return rotations[faceName] || { rotX: 0, rotY: 0 };
    }

    /**
     * Matrix and vector operations
     */
    createIdentityMatrix() {
        return [
            [1, 0, 0],
            [0, 1, 0], 
            [0, 0, 1]
        ];
    }

    createRotationMatrix(rotX, rotY) {
        const radX = (rotX * Math.PI) / 180;
        const radY = (rotY * Math.PI) / 180;
        
        // X rotation matrix
        const matrixX = [
            [1, 0, 0],
            [0, Math.cos(radX), -Math.sin(radX)],
            [0, Math.sin(radX), Math.cos(radX)]
        ];
        
        // Y rotation matrix  
        const matrixY = [
            [Math.cos(radY), 0, Math.sin(radY)],
            [0, 1, 0],
            [-Math.sin(radY), 0, Math.cos(radY)]
        ];
        
        // Combine Y then X rotation
        return this.multiplyMatrices(matrixX, matrixY);
    }

    multiplyMatrices(a, b) {
        const result = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ];
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                for (let k = 0; k < 3; k++) {
                    result[i][j] += a[i][k] * b[k][j];
                }
            }
        }
        
        return result;
    }

    transformVector(vector, matrix) {
        return [
            vector[0] * matrix[0][0] + vector[1] * matrix[1][0] + vector[2] * matrix[2][0],
            vector[0] * matrix[0][1] + vector[1] * matrix[1][1] + vector[2] * matrix[2][1],
            vector[0] * matrix[0][2] + vector[1] * matrix[1][2] + vector[2] * matrix[2][2]
        ];
    }

    dotProduct(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }

    invertMatrix(matrix) {
        // For 3x3 rotation matrices, inverse = transpose (since they're orthogonal)
        return [
            [matrix[0][0], matrix[1][0], matrix[2][0]],
            [matrix[0][1], matrix[1][1], matrix[2][1]],
            [matrix[0][2], matrix[1][2], matrix[2][2]]
        ];
    }

    /**
     * Level progression logic
     */
    handleCorrectAnswer(isFirstAttempt) {
        if (isFirstAttempt && this.currentLevel !== 'L3') {
            this.promoteLevel();
        }
    }

    handleIncorrectAnswer() {
        if (this.currentLevel !== 'L1') {
            this.demoteLevel();
        }
    }

    promoteLevel() {
        if (this.currentLevel === 'L1') {
            this.currentLevel = 'L2';
        } else if (this.currentLevel === 'L2') {
            this.currentLevel = 'L3';
        }
        console.log(`🎯 Promoted to ${this.currentLevel}: ${this.levels[this.currentLevel].name}`);
    }

    demoteLevel() {
        if (this.currentLevel === 'L3') {
            this.currentLevel = 'L2';
        } else if (this.currentLevel === 'L2') {
            this.currentLevel = 'L1';
        }
        console.log(`📉 Demoted to ${this.currentLevel}: ${this.levels[this.currentLevel].name}`);
    }

    startNewRound() {
        this.roundQuestions = 0;
        this.usedSumsThisRound.clear();
        console.log(`🔄 Starting new round at level ${this.currentLevel}`);
    }

    getCurrentLevelInfo() {
        return {
            level: this.currentLevel,
            name: this.levels[this.currentLevel].name,
            range: this.levels[this.currentLevel].diceRange,
            roundProgress: `${this.roundQuestions}/${this.maxRoundQuestions}`,
            usedSums: Array.from(this.usedSumsThisRound)
        };
    }
}

