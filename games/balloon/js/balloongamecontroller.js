class BalloonGameController {
    constructor() {
        // Make config available globally for shared Rainbow and Bear classes
        window.CONFIG = BALLOON_CONFIG;
        
        // Initialize components
        this.renderer = null;
        this.physics = null;
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        
        // Game state
        this.currentLevel = 1;
        this.levelProgress = {}; // Track progress for each level
        this.usedNumbers = new Set(); // Track used numbers in current session
        this.targetNumber = null;
        this.questionCount = 0;
        
        // Score tracking (only count user-popped balloons)
        this.correctBalloonsPopped = 0; // User popped correct balloons
        this.incorrectBalloonsPopped = 0; // User popped incorrect balloons
        this.totalCorrectBalloons = 0; // Total correct balloons in game
        this.totalQuestionsCompleted = 0; // Track total questions for rainbow
        this.correctBalloonsCeilingHit = 0; // Correct balloons that hit ceiling
        this.balloonPopOrder = []; // Track order of correct balloon pops (user=true, ceiling=false)
        
        // Game active state
        this.gameActive = false;
        
        // DOM elements
        this.modal = document.getElementById('gameModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalMessage = document.getElementById('modalMessage');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        
        // Target number display element
        this.targetNumberDisplay = null;
        
        this.handleResize = this.handleResize.bind(this);
        
        this.initializeGame();
    }
    
    async initializeGame() {
        console.log('🎈 Initializing Balloon Game Controller');
        
        // Setup shared audio system for bottom-right positioning WITH ROTATION DISABLED
        if (window.AudioSystem) {
            window.AudioSystem.setBottomPosition(true, '../../index.html', true); // TRUE = disable rotation
        }
        
        // Initialize components in order
        await this.initializeComponents();
        this.setupEventListeners();
        this.loadGameState();
        this.startNewQuestion();
    }
    
    async initializeComponents() {
        // Wait for renderer and physics to be available
        if (typeof BalloonRenderer === 'undefined' || typeof BalloonPhysics === 'undefined') {
            console.warn('Waiting for BalloonRenderer and BalloonPhysics to load...');
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Initialize renderer
        this.renderer = new BalloonRenderer();
        await this.renderer.initialize();
        
        // Initialize physics
        this.physics = new BalloonPhysics();
        
        // Configure rainbow for balloon game (55% from top instead of default 60%)
        this.configureRainbow();
        
        // Setup resize handling
        window.addEventListener('resize', this.handleResize);
        
        console.log('✅ All components initialized');
    }
    
    configureRainbow() {
        // Override rainbow positioning for balloon game
        if (this.rainbow && this.rainbow.config) {
            // The rainbow should be positioned at 55% from top instead of default
            // This will be handled by CSS positioning in .rainbow-container
            console.log('🌈 Rainbow configured for balloon game positioning');
        }
    }
    
    handleResize() {
        if (this.renderer) {
            this.renderer.handleResize();
        }
    }
    
    setupEventListeners() {
        if (this.playAgainBtn) {
            this.playAgainBtn.addEventListener('click', () => this.startNewGame());
        }
        
        // Listen for balloon pop events from renderer
        document.addEventListener('balloonPopped', (event) => {
            const { balloon, poppedByUser } = event.detail;
            this.handleBalloonPop(balloon, poppedByUser);
        });
    }
    
    loadGameState() {
        // Don't use localStorage in Claude.ai - use in-memory storage
        this.currentLevel = this.sessionLevel || 1;
        this.levelProgress = this.sessionProgress || {};
        
        // Initialize level progress if needed
        for (let level = 1; level <= 4; level++) {
            if (!this.levelProgress[level]) {
                this.levelProgress[level] = 0;
            }
        }
    }
    
    saveGameState() {
        // Store in memory for this session
        this.sessionLevel = this.currentLevel;
        this.sessionProgress = this.levelProgress;
    }
    
    startNewGame() {
        console.log('🔄 Starting new game');
        
        // Reset used numbers for new game
        this.usedNumbers.clear();
        this.totalQuestionsCompleted = 0;
        this.questionCount = 0;
        
        // Hide modal
        if (this.modal) this.modal.classList.add('hidden');
        
        // Reset rainbow and bear
        this.rainbow.reset();
        this.bear.reset();
        
        // Reset renderer
        if (this.renderer) {
            this.renderer.reset();
        }
        
        this.startNewQuestion();
    }
    
    startNewQuestion() {
        console.log(`🎯 Starting question ${this.questionCount + 1}`);
        
        this.questionCount++;
        this.gameActive = true;
        
        // Reset counters
        this.correctBalloonsPopped = 0;
        this.incorrectBalloonsPopped = 0;
        this.totalCorrectBalloons = 0;
        this.correctBalloonsCeilingHit = 0;
        this.balloonPopOrder = [];
        
        // Reset renderer for new question
        if (this.renderer) {
            this.renderer.clearAll();
        }
        
        // Select target number for current level
        this.selectTargetNumber();
        
        // Show target number first, then start game
        this.showTargetNumber();
    }
    
    selectTargetNumber() {
        const levelNumbers = BALLOON_CONFIG.LEVELS[this.currentLevel].numbers;
        const availableNumbers = levelNumbers.filter(num => !this.usedNumbers.has(num));
        
        // If all numbers used, reset the used numbers set
        if (availableNumbers.length === 0) {
            this.usedNumbers.clear();
            this.targetNumber = levelNumbers[Math.floor(Math.random() * levelNumbers.length)];
        } else {
            this.targetNumber = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
        }
        
        this.usedNumbers.add(this.targetNumber);
        console.log(`🎯 Target number: ${this.targetNumber} (Level ${this.currentLevel})`);
    }
    
    showTargetNumber() {
        // Remove existing target display
        if (this.targetNumberDisplay && this.targetNumberDisplay.parentNode) {
            this.targetNumberDisplay.parentNode.removeChild(this.targetNumberDisplay);
        }
        
        // Create target number display
        this.targetNumberDisplay = document.createElement('div');
        this.targetNumberDisplay.id = 'targetNumberDisplay';
        this.targetNumberDisplay.style.cssText = `
            position: fixed; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%);
            z-index: 5; 
            text-align: center; 
            opacity: 0; 
            transition: all 1s ease-in-out;
            pointer-events: none;
        `;
        
        // Large number - responsive sizing (DOUBLED from 6vh to 12vh)
        const numberElement = document.createElement('div');
        numberElement.textContent = this.targetNumber.toString();
        numberElement.style.cssText = `
            font-size: 24vh; 
            font-weight: bold; 
            color: #dc3545;
            font-family: Arial, sans-serif; 
            line-height: 1; 
            margin-bottom: 2vh;
            text-shadow: 0.6vh 0.6vh 1.2vh rgba(220, 53, 69, 0.3);
        `;
        
        // Text version - responsive sizing (DOUBLED from 1.5vh to 3vh)
        const textElement = document.createElement('div');
        textElement.textContent = BALLOON_CONFIG.NUMBER_TO_WORD[this.targetNumber] || this.targetNumber.toString();
        textElement.style.cssText = `
            font-size: 6vh; 
            font-weight: bold; 
            color: #dc3545; 
            font-family: Arial, sans-serif;
            text-shadow: 0.2vh 0.2vh 0.4vh rgba(220, 53, 69, 0.2);
        `;
        
        this.targetNumberDisplay.appendChild(numberElement);
        this.targetNumberDisplay.appendChild(textElement);
        document.body.appendChild(this.targetNumberDisplay);
        
        // Fade in
        setTimeout(() => {
            this.targetNumberDisplay.style.opacity = '1';
        }, 100);
        
        // Give audio instruction
        if (window.AudioSystem && window.AudioSystem.audioEnabled) {
            setTimeout(() => {
                window.AudioSystem.speakText(`Pop all the balloons with the number ${this.targetNumber}`);
            }, 1000);
        }
        
        // After 4 seconds, fade to persistent display and start game
        setTimeout(() => {
            this.makePersistentTargetNumber();
            this.startBalloonSpawning();
        }, 4000);
    }
    
    makePersistentTargetNumber() {
        if (!this.targetNumberDisplay) return;
        
        // Change to dark grey and 30% opacity, keep centered, LOWER Z-INDEX to go behind balloons
        this.targetNumberDisplay.style.color = '#666666';
        this.targetNumberDisplay.style.opacity = '0.3';
        this.targetNumberDisplay.style.zIndex = '3'; // Lower than balloons (z-index: 10)
        
        // Update child elements
        const numberElement = this.targetNumberDisplay.children[0];
        const textElement = this.targetNumberDisplay.children[1];
        
        if (numberElement) {
            numberElement.style.color = '#666666';
            numberElement.style.textShadow = '0.6vh 0.6vh 1.2vh rgba(102, 102, 102, 0.3)';
        }
        
        if (textElement) {
            textElement.style.color = '#666666';  
            textElement.style.textShadow = '0.2vh 0.2vh 0.4vh rgba(102, 102, 102, 0.2)';
        }
        
        console.log('🎯 Target number now persistent at 30% opacity and behind balloons');
    }
    
    hideTargetNumber() {
        if (this.targetNumberDisplay) {
            this.targetNumberDisplay.style.opacity = '0';
            setTimeout(() => {
                if (this.targetNumberDisplay && this.targetNumberDisplay.parentNode) {
                    this.targetNumberDisplay.parentNode.removeChild(this.targetNumberDisplay);
                    this.targetNumberDisplay = null;
                }
            }, 1000);
        }
    }
    
    startBalloonSpawning() {
        console.log('🎈 Starting balloon spawning');
        
        if (!this.renderer) {
            console.error('Renderer not available for balloon spawning');
            return;
        }
        
        // Create balloon configuration
        const balloonConfig = this.createBalloonConfiguration();
        
        // Pass to renderer to create and start balloons
        this.renderer.spawnBalloons(balloonConfig);
        
        // Start physics simulation
        if (this.physics) {
            this.physics.startSimulation(this.renderer.balloons);
        }
    }
    
    createBalloonConfiguration() {
        // Create array of balloon numbers with exact counts
        const balloonNumbers = [];
        
        // Add correct balloons
        for (let i = 0; i < BALLOON_CONFIG.CORRECT_BALLOONS; i++) {
            balloonNumbers.push({
                number: this.targetNumber,
                isCorrect: true
            });
        }
        this.totalCorrectBalloons = BALLOON_CONFIG.CORRECT_BALLOONS;
        
        // Add incorrect balloons
        const levelNumbers = BALLOON_CONFIG.LEVELS[this.currentLevel].numbers;
        const incorrectNumbers = levelNumbers.filter(num => num !== this.targetNumber);
        
        for (let i = 0; i < BALLOON_CONFIG.INCORRECT_BALLOONS; i++) {
            const randomNumber = incorrectNumbers[Math.floor(Math.random() * incorrectNumbers.length)];
            balloonNumbers.push({
                number: randomNumber,
                isCorrect: false
            });
        }
        
        // Shuffle the array
        this.shuffleArray(balloonNumbers);
        
        return balloonNumbers;
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    handleBalloonPop(balloon, poppedByUser = true) {
        if (!this.gameActive) return;
        
        console.log(`🎈 Balloon popped: ${balloon.number}, correct: ${balloon.isCorrect}, by user: ${poppedByUser}`);
        
        if (balloon.isCorrect) {
            // Add to pop order tracking
            this.balloonPopOrder.push(poppedByUser);
            
            if (poppedByUser) {
                this.correctBalloonsPopped++;
                if (window.AudioSystem) {
                    window.AudioSystem.playCompletionSound();
                }
                
                // Give encouragement
                if (window.AudioSystem && window.AudioSystem.audioEnabled) {
                    const encouragements = ['Great job!', 'Well done!', 'Excellent!', 'Perfect!'];
                    setTimeout(() => {
                        window.AudioSystem.speakText(encouragements[Math.floor(Math.random() * encouragements.length)]);
                    }, 200);
                }
            } else {
                // Correct balloon hit ceiling
                this.correctBalloonsCeilingHit++;
                if (window.AudioSystem) {
                    window.AudioSystem.playCompletionSound();
                }
            }
            
            // Update traffic light display
            if (this.renderer) {
                this.renderer.updateTrafficLight(this.balloonPopOrder);
            }
            
            // Check if all correct balloons processed
            if (this.balloonPopOrder.length === this.totalCorrectBalloons) {
                setTimeout(() => this.startEndSequence(), 500);
            }
        } else {
            // Incorrect balloon
            if (poppedByUser) {
                this.incorrectBalloonsPopped++;
            }
            if (window.AudioSystem) {
                window.AudioSystem.playFailureSound();
            }
        }
    }
    
    startEndSequence() {
        console.log('🎬 Starting end sequence');
        
        // Tell renderer to fade out remaining incorrect balloons
        if (this.renderer) {
            this.renderer.fadeOutIncorrectBalloons();
        }
        
        // Check for question completion after end sequence
        setTimeout(() => {
            this.checkQuestionCompletion();
        }, 1500);
    }
    
    checkQuestionCompletion() {
        // Check if all falling numbers have landed and disappeared
        const allNumbersGone = this.renderer ? this.renderer.areAllFallingNumbersGone() : true;
        
        // If all correct balloons processed and all numbers gone, end question
        if (this.balloonPopOrder.length === this.totalCorrectBalloons && allNumbersGone) {
            this.endQuestion();
        } else {
            // Check again in a bit if not ready
            setTimeout(() => this.checkQuestionCompletion(), 500);
        }
    }
    
    endQuestion() {
        console.log('🏁 Ending question');
        
        this.gameActive = false;
        
        // Stop physics simulation
        if (this.physics) {
            this.physics.stopSimulation();
        }
        
        // Clear renderer
        if (this.renderer) {
            this.renderer.clearAll();
        }
        
        // Hide target number
        this.hideTargetNumber();
        
        // Evaluate performance
        const success = this.correctBalloonsPopped >= BALLOON_CONFIG.MIN_CORRECT_BALLOONS && 
                       this.incorrectBalloonsPopped <= BALLOON_CONFIG.MAX_INCORRECT_BALLOONS;
        
        // Update progress
        if (success) {
            this.levelProgress[this.currentLevel]++;
            this.rainbow.addPiece();
        }
        
        this.totalQuestionsCompleted++;
        
        // Save state
        this.saveGameState();
        
        // Give audio feedback
        this.giveQuestionFeedback(success);
        
        // Check if we've completed all questions
        if (this.totalQuestionsCompleted >= BALLOON_CONFIG.TOTAL_QUESTIONS) {
            setTimeout(() => {
                this.showFinalModal();
            }, 2000);
        } else {
            // Check for level progression
            setTimeout(() => {
                this.checkLevelProgression(success);
            }, 2000);
        }
    }
    
    giveQuestionFeedback(success) {
        if (!window.AudioSystem || !window.AudioSystem.audioEnabled) return;
        
        let message = '';
        
        if (success) {
            message = `Well done, you popped ${this.correctBalloonsPopped} out of ${BALLOON_CONFIG.CORRECT_BALLOONS} of the number ${this.targetNumber} balloons`;
            if (this.incorrectBalloonsPopped === 0) {
                message += ' and none of the other balloons';
            } else {
                message += ` and only ${this.incorrectBalloonsPopped} of the other balloons`;
            }
        } else {
            message = `You popped ${this.correctBalloonsPopped} out of ${BALLOON_CONFIG.CORRECT_BALLOONS} of the number ${this.targetNumber} balloons`;
            if (this.incorrectBalloonsPopped === 0) {
                message += ' and none of the other balloons';
            } else {
                message += ` and ${this.incorrectBalloonsPopped} of the other balloons`;
            }
            
            // Add specific failure advice
            const tooFewCorrect = this.correctBalloonsPopped < BALLOON_CONFIG.MIN_CORRECT_BALLOONS;
            const tooManyIncorrect = this.incorrectBalloonsPopped > BALLOON_CONFIG.MAX_INCORRECT_BALLOONS;
            
            if (tooFewCorrect && tooManyIncorrect) {
                message += '. Next time try to pop all of the balloons with the chosen number in, and only those balloons';
            } else if (tooFewCorrect) {
                message += '. Next time try to pop more balloons';
            } else if (tooManyIncorrect) {
                message += '. Next time only pop the balloons with the right number in';
            }
        }
        
        setTimeout(() => {
            window.AudioSystem.speakText(message);
        }, 500);
    }
    
    checkLevelProgression(success) {
        const currentProgress = this.levelProgress[this.currentLevel];
        const requiredProgress = BALLOON_CONFIG.LEVELS[this.currentLevel].questionsNeeded;
        
        // Level progression logic
        if (success && currentProgress >= requiredProgress) {
            // Level completed - advance to next level
            if (this.currentLevel < 4) {
                this.currentLevel++;
                console.log(`📈 Advanced to level ${this.currentLevel}`);
                this.saveGameState();
            }
        } else if (!success && this.currentLevel > 1) {
            // Failure - drop back to previous level
            this.currentLevel--;
            this.levelProgress[this.currentLevel] = Math.max(0, this.levelProgress[this.currentLevel] - 1);
            console.log(`📉 Dropped to level ${this.currentLevel}`);
            this.saveGameState();
        }
        
        // Continue to next question
        this.startNewQuestion();
    }
    
    showFinalModal() {
        console.log('🏆 Showing final completion modal');
        
        if (this.modal && this.modalTitle && this.modalMessage) {
            this.modalTitle.textContent = '🌈 Well Done! 🌈';
            this.modalMessage.textContent = `Congratulations! You've completed all ${BALLOON_CONFIG.TOTAL_QUESTIONS} questions!`;
            
            // Remove dark background by making modal background transparent
            this.modal.style.background = 'transparent';
            this.modal.classList.remove('hidden');
            
            // Start bear celebration
            this.bear.startCelebration();
            
            if (window.AudioSystem && window.AudioSystem.audioEnabled) {
                setTimeout(() => {
                    window.AudioSystem.speakText('Well done! You have completed all the questions!');
                }, 500);
            }
        }
    }
    
    destroy() {
        console.log('🧹 Destroying Balloon Game Controller');
        
        this.gameActive = false;
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('balloonPopped', this.handleBalloonPop);
        
        // Destroy components
        if (this.renderer) {
            this.renderer.destroy();
        }
        
        if (this.physics) {
            this.physics.destroy();
        }
        
        // Reset shared systems
        this.rainbow.reset();
        this.bear.reset();
        
        // Clean up target number display
        this.hideTargetNumber();
        
        console.log('✅ Balloon Game Controller destroyed');
    }
}

// Game initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎈 DOM loaded, initializing Balloon Game');
    window.balloonGame = new BalloonGameController();
});

// Clean up resources when page is about to unload
window.addEventListener('beforeunload', () => {
    if (window.balloonGame) {
        window.balloonGame.destroy();
    }
});
