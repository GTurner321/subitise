class DiceTransformTester {
    constructor() {
        this.diceContainer = document.getElementById('diceContainer');
        this.resultsLog = document.getElementById('resultsLog');
        this.startButton = document.getElementById('startTest');
        this.clearButton = document.getElementById('clearResults');
        
        this.currentDice = null;
        this.testResults = [];
        
        this.setupEventListeners();
        this.log('Dice Transform Tester initialized. Ready to test face orientations.', 'info');
    }
    
    setupEventListeners() {
        this.startButton.addEventListener('click', () => {
            this.runFaceTransformTest();
        });
        
        this.clearButton.addEventListener('click', () => {
            this.clearResults();
        });
    }
    
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `<strong>[${timestamp}]</strong> ${message}`;
        this.resultsLog.appendChild(logEntry);
        this.resultsLog.scrollTop = this.resultsLog.scrollHeight;
        console.log(`[${timestamp}] ${message}`);
    }
    
    clearResults() {
        this.resultsLog.innerHTML = '<p>Results cleared. Ready for new test.</p>';
        this.testResults = [];
        if (this.currentDice) {
            this.currentDice.remove();
            this.currentDice = null;
        }
    }
    
    async runFaceTransformTest() {
        this.startButton.disabled = true;
        this.clearResults();
        
        this.log('=== STARTING FACE TRANSFORM TEST ===', 'info');
        this.log('Testing all 6 face orientations to verify transform accuracy', 'info');
        
        // Define the 6 basic orientations to test each face
        const testOrientations = [
            { name: 'Front Face', rotX: 0, rotY: 0, expectedFace: 'front', expectedValue: 1 },
            { name: 'Back Face', rotX: 0, rotY: 180, expectedFace: 'back', expectedValue: 6 },
            { name: 'Right Face', rotX: 0, rotY: 90, expectedFace: 'right', expectedValue: 2 },
            { name: 'Left Face', rotX: 0, rotY: -90, expectedFace: 'left', expectedValue: 5 },
            { name: 'Top Face', rotX: -90, rotY: 0, expectedFace: 'top', expectedValue: 3 },
            { name: 'Bottom Face', rotX: 90, rotY: 0, expectedFace: 'bottom', expectedValue: 4 }
        ];
        
        for (let i = 0; i < testOrientations.length; i++) {
            const orientation = testOrientations[i];
            this.log(`\n--- Testing ${orientation.name} (${i + 1}/6) ---`, 'info');
            
            await this.testSingleOrientation(orientation);
            
            // Wait between tests for visual verification
            await this.wait(2000);
        }
        
        this.log('\n=== FACE TRANSFORM TEST COMPLETE ===', 'info');
        this.analyzeFinalResults();
        this.startButton.disabled = false;
    }
    
    async testSingleOrientation(orientation) {
        // Create fresh dice for this test
        this.createTestDice();
        
        // Apply the test orientation
        this.log(`Applying transform: rotateX(${orientation.rotX}deg) rotateY(${orientation.rotY}deg)`, 'info');
        this.currentDice.style.transform = `rotateX(${orientation.rotX}deg) rotateY(${orientation.rotY}deg)`;
        
        // Wait for transform to complete
        await this.wait(1000);
        
        // Detect which face is visible using Z-depth method
        const detectedResult = this.readVisibleFaceByZDepth(this.currentDice);
        
        // Log results
        this.log(`Expected: ${orientation.expectedFace} face (value ${orientation.expectedValue})`, 'info');
        this.log(`Detected: ${detectedResult.face} face (value ${detectedResult.value})`, 'info');
        
        // Check for match
        const isCorrect = (detectedResult.face === orientation.expectedFace && detectedResult.value === orientation.expectedValue);
        
        if (isCorrect) {
            this.log(`✅ CORRECT: Transform working properly for ${orientation.name}`, 'success');
        } else {
            this.log(`❌ ERROR: Transform mismatch for ${orientation.name}`, 'error');
            this.log(`   Expected ${orientation.expectedFace}(${orientation.expectedValue}) but got ${detectedResult.face}(${detectedResult.value})`, 'error');
        }
        
        // Store result
        this.testResults.push({
            orientation: orientation,
            detected: detectedResult,
            correct: isCorrect
        });
        
        this.log(`Visual Check: Look at the dice - do you see ${orientation.expectedValue} dots?`, 'info');
    }
    
    createTestDice() {
        // Remove existing dice
        if (this.currentDice) {
            this.currentDice.remove();
        }
        
        // Create new dice element
        const dice = document.createElement('div');
        dice.className = 'test-dice';
        dice.style.transformStyle = 'preserve-3d';
        
        // Standard dice face values - same as main game
        const faceValues = {
            'front': 1, 'back': 6, 'right': 2, 'left': 5, 'top': 3, 'bottom': 4
        };
        
        // Create all 6 faces
        Object.entries(faceValues).forEach(([faceClass, faceValue]) => {
            const face = document.createElement('div');
            face.className = `dice-face ${faceClass}`;
            face.dataset.faceValue = faceValue;
            
            // Set 3D positioning - same transforms as main game
            this.setFace3DPosition(face, faceClass, 60); // halfSize = 60px for 120px dice
            
            // Create face structure
            this.createFaceStructure(face, faceValue);
            
            dice.appendChild(face);
        });
        
        this.diceContainer.appendChild(dice);
        this.currentDice = dice;
        
        this.log('Test dice created with 6 faces positioned', 'info');
    }
    
    setFace3DPosition(face, faceClass, halfSize) {
        // Exact same transforms as main game
        face.style.backfaceVisibility = 'hidden';
        
        switch (faceClass) {
            case 'front':
                face.style.transform = `rotateY(0deg) translateZ(${halfSize}px)`;
                break;
            case 'back':
                face.style.transform = `rotateY(180deg) translateZ(${halfSize}px)`;
                break;
            case 'right':
                face.style.transform = `rotateY(90deg) translateZ(${halfSize}px)`;
                break;
            case 'left':
                face.style.transform = `rotateY(-90deg) translateZ(${halfSize}px)`;
                break;
            case 'top':
                face.style.transform = `rotateX(90deg) translateZ(${halfSize}px)`;
                break;
            case 'bottom':
                face.style.transform = `rotateX(-90deg) translateZ(${halfSize}px)`;
                break;
        }
    }
    
    createFaceStructure(face, faceValue) {
        // Create inner face
        const innerFace = document.createElement('div');
        innerFace.className = 'dice-face-inner';
        
        // Create colored surface
        const coloredSurface = document.createElement('div');
        coloredSurface.className = 'dice-face-surface';
        
        // Create dots container
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'dice-dots-container';
        
        // Create dots based on face value
        this.createDots(dotsContainer, faceValue);
        
        face.appendChild(innerFace);
        face.appendChild(coloredSurface);
        face.appendChild(dotsContainer);
    }
    
    createDots(container, value) {
        const pattern = CONFIG.DICE_FACES[value];
        container.innerHTML = '';
        
        // Create 9 dot positions in 3x3 grid
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const dot = document.createElement('div');
                dot.className = 'dice-dot';
                
                // Set visibility based on pattern
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
    
    readVisibleFaceByZDepth(dice) {
        // Same Z-depth detection logic as main game
        const diceStyle = window.getComputedStyle(dice);
        const diceTransform = diceStyle.transform;
        
        if (!diceTransform || diceTransform === 'none') {
            return { face: 'unknown', value: 0 };
        }
        
        const diceMatrix = new DOMMatrix(diceTransform);
        const faces = dice.querySelectorAll('.dice-face');
        let frontmostFace = null;
        let maxZ = -Infinity;
        
        // Face normal vectors
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
            
            // Transform normal by dice rotation
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
            return {
                face: frontmostFace.classList[1],
                value: parseInt(frontmostFace.dataset.faceValue),
                zComponent: maxZ
            };
        }
        
        return { face: 'unknown', value: 0 };
    }
    
    analyzeFinalResults() {
        const totalTests = this.testResults.length;
        const correctTests = this.testResults.filter(r => r.correct).length;
        const incorrectTests = totalTests - correctTests;
        
        this.log(`\n=== FINAL ANALYSIS ===`, 'info');
        this.log(`Total tests: ${totalTests}`, 'info');
        this.log(`Correct: ${correctTests}`, correctTests === totalTests ? 'success' : 'info');
        this.log(`Incorrect: ${incorrectTests}`, incorrectTests > 0 ? 'error' : 'success');
        
        if (incorrectTests > 0) {
            this.log('\n❌ TRANSFORM ERRORS FOUND:', 'error');
            this.testResults.filter(r => !r.correct).forEach(result => {
                this.log(`   ${result.orientation.name}: Expected ${result.orientation.expectedFace}(${result.orientation.expectedValue}) → Got ${result.detected.face}(${result.detected.value})`, 'error');
            });
            
            this.log('\nSuggested fixes needed in face transform positioning.', 'error');
        } else {
            this.log('\n✅ ALL TRANSFORMS WORKING CORRECTLY!', 'success');
            this.log('The issue may be elsewhere in the dice rolling logic.', 'info');
        }
    }
    
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the tester when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.diceTransformTester = new DiceTransformTester();
});
