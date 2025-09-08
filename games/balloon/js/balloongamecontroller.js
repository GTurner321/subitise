class BalloonGameController {
    constructor() {
        // Make config available globally for shared Rainbow and Bear classes
        window.CONFIG = BALLOON_CONFIG;
        
        this.svg = null;
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
        
        // Balloon management arrays (shared with physics)
        this.balloons = [];
        this.fallingNumbers = [];
        this.gameActive = false;
        
        // Score tracking (only count user-popped balloons)
        this.correctBalloonsPopped = 0; // User popped correct balloons
        this.incorrectBalloonsPopped = 0; // User popped incorrect balloons
        this.totalCorrectBalloons = 0; // Total correct balloons in game
        this.totalQuestionsCompleted = 0; // Track total questions for rainbow
        this.correctBalloonsCeilingHit = 0; // Correct balloons that hit ceiling
        this.balloonPopOrder = []; // Track order of correct balloon pops (user=true, ceiling=false)
        
        // DOM elements
        this.container = document.getElementById('balloonContainer');
        this.modal = document.getElementById('gameModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalMessage = document.getElementById('modalMessage');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        
        this.handleResize = this.handleResize.bind(this);
        
        this.initializeGame();
    }
    
    async initializeGame() {
        window.addEventListener('resize', this.handleResize);
        this.initializeRainbow();
        this.setupEventListeners();
        this.createSVG();
        this.createRenderer();
        this.createPhysics();
        this.loadGameState();
        this.startNewQuestion();
    }
    
    initializeRainbow() {
        // Rainbow will auto-initialize using the global CONFIG we set
    }
    
    createSVG() {
        this.container.innerHTML = '';
        
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('id', 'balloonSVG');
        this.svg.setAttribute('class', 'balloon-svg');
        this.updateSVGDimensions();
        
        this.container.appendChild(this.svg);
    }
    
    createRenderer() {
        this.renderer = new BalloonRenderer(this.svg, BALLOON_CONFIG, this.fallingNumbers);
    }
    
    createPhysics() {
        this.physics = new BalloonPhysics(this.balloons, this.fallingNumbers, BALLOON_CONFIG, this);
    }
    
    updateSVGDimensions() {
        if (this.svg) {
            const gameWidth = window.innerWidth;
            const gameHeight = window.innerHeight; // Full window height
            
            this.svg.setAttribute('viewBox', `0 0 ${gameWidth} ${gameHeight}`);
            this.svg.setAttribute('width', '100%');
            this.svg.setAttribute('height', '100%');
        }
    }
    
    handleResize() {
        if (this.svg) {
            this.updateSVGDimensions();
        }
        this.initializeRainbow();
    }
    
    setupEventListeners() {
        if (this.playAgainBtn) {
            this.playAgainBtn.addEventListener('click', () => this.startNewGame());
        }
        
        // Add click/touch listeners to SVG
        if (this.svg) {
            this.svg.addEventListener('click', (e) => this.handleSVGClick(e));
            this.svg.addEventListener('touchstart', (e) => this.handleSVGTouch(e));
        }
    }
    
    handleSVGClick(e) {
        if (!this.gameActive) return;
        
        const rect = this.svg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const balloon = this.physics.getBalloonAtPosition(x, y);
        if (balloon) {
            this.popBalloon(balloon, true);
        }
    }
    
    handleSVGTouch(e) {
        e.preventDefault();
        if (!this.gameActive) return;
        
        const touch = e.touches[0];
        const rect = this.svg.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        const balloon = this.physics.getBalloonAtPosition(x, y);
        if (balloon) {
            this.popBalloon(balloon, true);
        }
    }
    
    // Physics callback methods
    onBalloonHitCeiling(balloon) {
        this.popBalloon(balloon, false);
    }
    
    onBalloonPositionUpdate(balloon) {
        this.renderer.updateBalloonPosition(balloon);
    }
    
    onFallingNumberPositionUpdate(fallingNumber) {
        this.renderer.updateFallingNumberPosition(fallingNumber);
    }
    
    onFallingNumberRemovalReady(fallingNumber, index) {
        this.renderer.removeFallingNumber(fallingNumber);
        this.physics.removeFallingNumber(fallingNumber);
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
        this.renderer.resetTrafficLight();
        
        this.startNewQuestion();
    }
    
    startNewQuestion() {
        console.log('startNewQuestion called');
        this.questionCount++;
        this.gameActive = true;
        
        // Stop physics
        this.physics.stop();
        
        // Clear all arrays and visual elements
        this.renderer.clearAll();
        this.physics.clearAll();
        
        // Remove previous target display if it exists
        if (this.targetDisplay) {
            this.renderer.removeTargetNumber(this.targetDisplay);
            this.targetDisplay = null;
        }
        
        // Reset counters
        this.correctBalloonsPopped = 0;
        this.incorrectBalloonsPopped = 0;
        this.totalCorrectBalloons = 0;
        this.correctBalloonsCeilingHit = 0;
        this.balloonPopOrder = [];
        
        // Reset traffic light
        this.renderer.resetTrafficLight();
        
        // Select target number for current level
        this.selectTargetNumber();
        console.log('Target number selected:', this.targetNumber);
        
        // Show target number first, then start game
        console.log('About to call showTargetNumber');
        this.showTargetNumber();
        console.log('showTargetNumber called');
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
    }
    
    showTargetNumber() {
        this.targetDisplay = this.renderer.showTargetNumber(this.targetNumber);
        
        // Give audio instruction
        if (window.AudioSystem && window.AudioSystem.audioEnabled) {
            setTimeout(() => {
                window.AudioSystem.speakText(`Pop all the balloons with the number ${this.targetNumber}`);
            }, 1000);
        }
        
        // Fade to background and start game
        setTimeout(() => {
        this.renderer.fadeTargetNumberToBackground(this.targetDisplay);
        this.startBalloonSpawning();
        }, 4000);

    }
    
    startBalloonSpawning() {
        console.log('startBalloonSpawning called');
        
        // Create balloons
        this.spawnBalloons();
        
        // Fade in all balloons over 2 seconds
        this.renderer.fadeInAllBalloons(this.balloons);
        
        // Start physics loop
        console.log('About to start physics');
        this.physics.start();
        console.log('Physics start called');
    }
    
    spawnBalloons() {
        // Create array of balloon numbers with exact counts
        const balloonNumbers = [];
        
        // Add correct balloons
        for (let i = 0; i < BALLOON_CONFIG.CORRECT_BALLOONS; i++) {
            balloonNumbers.push(this.targetNumber);
        }
        
        // Add incorrect balloons
        const levelNumbers = BALLOON_CONFIG.LEVELS[this.currentLevel].numbers;
        const incorrectNumbers = levelNumbers.filter(num => num !== this.targetNumber);
        
        for (let i = 0; i < BALLOON_CONFIG.INCORRECT_BALLOONS; i++) {
            const randomNumber = incorrectNumbers[Math.floor(Math.random() * incorrectNumbers.length)];
            balloonNumbers.push(randomNumber);
        }
        
        // Shuffle the array
        this.shuffleArray(balloonNumbers);
        
        // Create balloons
        balloonNumbers.forEach((number) => {
            this.createBalloon(number);
        });
        
        console.log(`Created ${this.balloons.length} balloons: ${BALLOON_CONFIG.CORRECT_BALLOONS} correct + ${BALLOON_CONFIG.INCORRECT_BALLOONS} incorrect`);
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    createBalloon(number) {
        const isCorrect = number === this.targetNumber;
        if (isCorrect) {
            this.totalCorrectBalloons++;
        }
        
        // Create balloon with physics
        const balloon = this.physics.createBalloon(number, isCorrect);
        
        // Create visual elements
        this.renderer.createBalloonVisuals(balloon);
        
        // Add event listeners to balloon group
        if (balloon.group) {
            balloon.group.addEventListener('click', () => this.popBalloon(balloon, true));
            balloon.group.addEventListener('touchstart', (e) => { 
                e.preventDefault(); 
                this.popBalloon(balloon, true); 
            });
        }
        
        this.balloons.push(balloon);
    }
    
    popBalloon(balloon, poppedByUser = true) {
        if (balloon.popped || !this.gameActive) return;
        balloon.popped = true;
        
        // Create visual effects
        this.renderer.createPopEffect(balloon.x + balloon.radius, balloon.y + balloon.radius);
        
        if (balloon.isCorrect) {
            // Create falling number and add to physics
            const fallingNumber = this.renderer.createFallingNumber(balloon.x + balloon.radius, balloon.y + balloon.radius, balloon.number);
            this.fallingNumbers.push(fallingNumber);
            
            // Add to pop order tracking
            this.balloonPopOrder.push(poppedByUser);
            
            if (poppedByUser) {
                this.correctBalloonsPopped++;
                if (window.AudioSystem) window.AudioSystem.playCompletionSound();
                
                if (window.AudioSystem && window.AudioSystem.audioEnabled) {
                    const encouragements = ['Great job!', 'Well done!', 'Excellent!', 'Perfect!'];
                    setTimeout(() => {
                        window.AudioSystem.speakText(encouragements[Math.floor(Math.random() * encouragements.length)]);
                    }, 200);
                }
            } else {
                // Correct balloon hit ceiling
                this.correctBalloonsCeilingHit++;
                if (window.AudioSystem) window.AudioSystem.playCompletionSound();
            }
            
            this.renderer.updateTrafficLight(this.balloonPopOrder);
            
            // Check if all correct balloons processed
            if (this.balloonPopOrder.length === this.totalCorrectBalloons) {
                this.startEndSequence();
            }
        } else {
            // Incorrect balloon
            if (poppedByUser) {
                this.incorrectBalloonsPopped++;
            }
            if (window.AudioSystem) window.AudioSystem.playFailureSound();
        }
        
        // Remove balloon
        this.renderer.removeBalloon(balloon);
        this.physics.removeBalloon(balloon);
    }
    
    startEndSequence() {
        // Fade out remaining incorrect balloons
        this.renderer.fadeOutIncorrectBalloons(this.balloons);
        
        // Check for question completion after end sequence starts
        setTimeout(() => {
            this.checkQuestionCompletion();
        }, 1500);
    }
    
    checkQuestionCompletion() {
        // Check if all falling numbers have landed and disappeared
        const allNumbersGone = this.physics.areAllFallingNumbersGone();
        
        // If all correct balloons processed and all numbers gone, end question
        if (this.balloonPopOrder.length === this.totalCorrectBalloons && allNumbersGone) {
            this.endQuestion();
        } else {
            // Check again in a bit if not ready
            setTimeout(() => this.checkQuestionCompletion(), 500);
        }
    }
    
    endQuestion() {
        this.gameActive = false;
        
        // IMPORTANT: Only stop physics AFTER checking that falling numbers are done
        console.log('Ending question - stopping physics now that falling numbers are complete');
        this.physics.stop();
        
        // Clear any remaining balloons
        this.renderer.clearAll();
        this.physics.clearAll();
        
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
    
    showFinalModal() {
        if (this.modal && this.modalTitle && this.modalMessage) {
            this.modalTitle.textContent = '🌈 Well Done! 🌈';
            this.modalMessage.textContent = `Congratulations! You've completed all ${BALLOON_CONFIG.TOTAL_QUESTIONS} questions!`;
            
            // Remove dark background by making modal background transparent
            this.modal.style.background = 'transparent';
            this.modal.classList.remove('hidden');
            
            if (window.AudioSystem && window.AudioSystem.audioEnabled) {
                setTimeout(() => {
                    window.AudioSystem.speakText('Well done! You have completed all the questions!');
                }, 500);
            }
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
        
        // Only hidden levels are dependent on success criteria per question
        if (success && currentProgress >= requiredProgress) {
            // Level completed - advance to next level
            if (this.currentLevel < 4) {
                this.currentLevel++;
                this.saveGameState();
            }
        } else if (!success && this.currentLevel > 1) {
            // Failure - drop back to previous level
            this.currentLevel--;
            this.levelProgress[this.currentLevel] = Math.max(0, this.levelProgress[this.currentLevel] - 1);
            this.saveGameState();
        }
        
        // Continue to next question
        this.startNewQuestion();
    }
    
    destroy() {
        this.gameActive = false;
        
        window.removeEventListener('resize', this.handleResize);
        
        if (this.physics) {
            this.physics.destroy();
        }
        
        if (this.renderer) {
            this.renderer.destroy();
        }
        
        if (this.svg) {
            this.svg.innerHTML = '';
        }
        
        this.balloons = [];
        this.fallingNumbers = [];
        
        this.rainbow.reset();
        this.bear.reset();
        
        if (window.AudioSystem) {
            window.AudioSystem.stopAllAudio();
        }
    }
}

// Game initialization
document.addEventListener('DOMContentLoaded', () => {
    window.balloonGame = new BalloonGameController();
});

// Clean up resources when page is about to unload
window.addEventListener('beforeunload', () => {
    if (window.balloonGame) {
        window.balloonGame.destroy();
    }
});
