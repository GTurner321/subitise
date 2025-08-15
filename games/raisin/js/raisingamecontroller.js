class RaisinGameController {
    constructor() {
        console.log('🐹 Raisin Game Controller - Universal Systems Version');
        
        // Initialize universal components
        this.raisinRenderer = new RaisinRenderer();
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        
        // Game state
        this.currentQuestion = 0;
        this.currentAnswer = 0;
        this.gameComplete = false;
        this.buttonsDisabled = false;
        this.questionsCompleted = 0;
        
        // Hidden difficulty levels
        this.currentLevel = 1;
        this.levelNames = ['Level 1', 'Level 2', 'Level 3'];
        
        // Inactivity timer for audio hints
        this.inactivityTimer = null;
        this.inactivityDuration = 20000; // 20 seconds
        this.hintGiven = false;
        this.isTabVisible = true;
        
        // DOM elements
        this.modal = document.getElementById('gameModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        
        // System readiness tracking
        this.systemsReady = false;
        this.readyCheckCount = 0;
        
        this.initializeEventListeners();
        this.setupVisibilityHandling();
        this.waitForSystemsAndInitialize();
    }
    
    waitForSystemsAndInitialize() {
        console.log('🐹 Checking system readiness...');
        
        const checkSystemsReady = () => {
            this.readyCheckCount++;
            
            const buttonBarReady = window.ButtonBar && typeof window.ButtonBar.create === 'function';
            const audioSystemReady = window.AudioSystem && typeof window.AudioSystem.speakText === 'function';
            const gameAreaReady = document.querySelector('.game-area');
            
            if (buttonBarReady && audioSystemReady && gameAreaReady) {
                console.log(`🐹 Systems ready after ${this.readyCheckCount} checks`);
                this.systemsReady = true;
                this.createButtons();
                
                setTimeout(() => {
                    this.initializeGame();
                }, 100);
                
                return;
            }
            
            if (this.readyCheckCount >= 40) {
                console.warn('⚠️ Systems not ready, forcing initialization');
                this.systemsReady = true;
                this.forceInitialization();
                return;
            }
            
            setTimeout(checkSystemsReady, 50);
        };
        
        checkSystemsReady();
    }
    
    forceInitialization() {
        console.log('🚨 Force initializing raisin game systems');
        this.systemsReady = true;
        
        if (window.ButtonBar && typeof window.ButtonBar.create === 'function') {
            try {
                this.createButtons();
            } catch (error) {
                console.warn('Button creation failed:', error);
            }
        }
        
        setTimeout(() => {
            this.initializeGame();
        }, 100);
    }
    
    createButtons() {
        // Create 9 buttons (1-9) since at least 1 raisin must remain
        const colors = CONFIG.COLORS ? CONFIG.COLORS.slice(0, 9) : [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', 
            '#eb4d4b', '#6c5ce7', '#a29bfe', '#fd79a8'
        ];
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        console.log('Creating raisin game buttons: 9 buttons (1-9)');
        
        if (window.ButtonBar) {
            window.ButtonBar.destroy();
        }
        
        setTimeout(() => {
            if (window.ButtonBar) {
                window.ButtonBar.create(
                    9,      // 9 buttons
                    8,      // 8% width of button panel
                    8,      // 8% height of button panel  
                    colors,
                    numbers,
                    (selectedNumber, buttonElement) => {
                        if (this.buttonsDisabled || this.gameComplete) return;
                        
                        this.clearInactivityTimer();
                        this.startInactivityTimer();
                        this.handleNumberClick(selectedNumber, buttonElement);
                    }
                );
            }
        }, 50);
    }
    
    initializeGame() {
        console.log('🐹 Starting raisin game initialization');
        this.startNewQuestion();
    }
    
    initializeEventListeners() {
        // Play again button
        this.playAgainBtn.addEventListener('click', () => {
            this.startNewGame();
        });
    }
    
    setupVisibilityHandling() {
        // Handle tab visibility changes
        document.addEventListener('visibilitychange', () => {
            this.isTabVisible = !document.hidden;
            
            if (!this.isTabVisible) {
                // Tab is hidden - stop all audio and clear timers
                this.clearInactivityTimer();
                if (window.AudioSystem) {
                    window.AudioSystem.stopAllAudio();
                }
            } else {
                // Tab is visible again - restart inactivity timer if game is active
                if (!this.gameComplete && !this.buttonsDisabled && this.systemsReady) {
                    this.startInactivityTimer();
                }
            }
        });
    }
    
    startInactivityTimer() {
        // Only start timer if tab is visible and hint hasn't been given
        if (!this.isTabVisible || this.hintGiven) {
            return;
        }
        
        this.clearInactivityTimer();
        this.inactivityTimer = setTimeout(() => {
            this.giveInactivityHint();
        }, this.inactivityDuration);
    }
    
    clearInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
    }
    
    giveInactivityHint() {
        if (this.buttonsDisabled || this.gameComplete || !this.isTabVisible) return;
        
        // Mark that hint has been given for this question
        this.hintGiven = true;
        
        this.speakText('Try counting how many more will make 10.');
        
        // Don't restart the timer - hint is only given once per question
    }
    
    async startNewQuestion() {
        if (this.gameComplete || this.currentQuestion >= CONFIG.TOTAL_QUESTIONS) {
            return;
        }
        
        // Reset hint tracking for new question
        this.hintGiven = false;
        this.buttonsDisabled = false;
        
        // Generate question based on current difficulty level
        this.currentAnswer = this.generateAnswerForLevel();
        
        console.log(`Question ${this.currentQuestion + 1}: Level ${this.currentLevel}, Answer: ${this.currentAnswer}`);
        
        // Reset button states
        this.resetButtonStates();
        
        // Render all 10 raisins with staggered appearance
        await this.raisinRenderer.renderRaisinsStaggered();
        
        // Select exactly currentAnswer raisins to eat
        const raisinsToEat = this.selectRaisinsToEat();
        
        // Give starting instruction (different for first question vs subsequent)
        this.giveStartingInstruction();
        
        // Start the guinea pig sequence
        await this.runGuineaPigSequence(raisinsToEat);
        
        // Start inactivity timer after guinea pigs finish
        this.startInactivityTimer();
    }
    
    generateAnswerForLevel() {
        const level = CONFIG.DIFFICULTY_LEVELS[`LEVEL_${this.currentLevel}`];
        const possibleAnswers = level.possibleRaisinsToEat;
        return possibleAnswers[Math.floor(Math.random() * possibleAnswers.length)];
    }
    
    selectRaisinsToEat() {
        const totalRaisins = CONFIG.TOTAL_RAISINS;
        const raisinsToEat = [];
        
        // Randomly select exactly currentAnswer raisins to eat
        while (raisinsToEat.length < this.currentAnswer) {
            const randomIndex = Math.floor(Math.random() * totalRaisins);
            if (!raisinsToEat.includes(randomIndex)) {
                raisinsToEat.push(randomIndex);
            }
        }
        
        return raisinsToEat;
    }
    
    giveStartingInstruction() {
        if (!this.isTabVisible) return;
        
        setTimeout(() => {
            if (this.currentQuestion === 0) {
                // First question - full instruction
                this.speakText('Watch the hungry guinea pig');
            } else {
                // Subsequent questions - shorter instruction
                this.speakText('How many of the 10 raisins does the guinea pig eat this time?');
            }
        }, 500);
    }
    
    async runGuineaPigSequence(raisinsToEat) {
        this.buttonsDisabled = true;
        
        // Show guinea pig 3 and raisins for 4 seconds
        this.raisinRenderer.showGuineaPig3();
        
        // Wait for initial display period
        await this.sleep(CONFIG.GUINEA_PIG_3_INITIAL_DISPLAY);
        
        // For first question only, give extended instruction
        if (this.currentQuestion === 0) {
            await this.sleep(CONFIG.INITIAL_INSTRUCTION_DELAY);
            
            if (this.isTabVisible) {
                this.speakText('There are 10 raisins. The hungry guinea pig is going to eat some of them.');
            }
            
            // Wait for instruction to finish (approximately 5 seconds)
            await this.sleep(5000);
        }
        
        // Fade out guinea pig 3 completely before moving guinea pigs appear
        await this.raisinRenderer.fadeOutGuineaPig3();
        
        // Start guinea pig sounds using AudioSystem
        this.startGuineaPigSounds();
        
        // Guinea pig 2 moves left to right (only after GP3 is completely gone)
        await this.raisinRenderer.moveGuineaPig2(raisinsToEat);
        
        // Short pause
        await this.sleep(CONFIG.GUINEA_PIG_PAUSE_DURATION);
        
        // Guinea pig 1 moves right to left (only after GP2 is completely gone)
        await this.raisinRenderer.moveGuineaPig1(raisinsToEat);
        
        // Stop guinea pig sounds
        this.stopGuineaPigSounds();
        
        // Fade in guinea pig 3 again (only after GP1 is completely gone)
        await this.raisinRenderer.fadeInGuineaPig3();
        
        // Give question instruction
        setTimeout(() => {
            if (this.isTabVisible) {
                this.speakText('How many raisins did the guinea pig eat?');
            }
        }, 500);
        
        this.buttonsDisabled = false;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    startGuineaPigSounds() {
        if (!this.isTabVisible) return;
        
        this.stopGuineaPigSounds(); // Clear any existing interval
        
        // Play first sound immediately using AudioSystem
        this.playGuineaPigSound();
        
        // Continue playing sounds at intervals (3x faster)
        this.guineaPigSoundInterval = setInterval(() => {
            this.playGuineaPigSound();
        }, 200); // Play every 200ms (was 600ms)
    }
    
    playGuineaPigSound() {
        if (window.AudioSystem) {
            // Create a faster squeaky guinea pig sound using AudioSystem's playTone
            window.AudioSystem.playTone(800, 0.083, 'sawtooth', 0.3);
        }
    }
    
    stopGuineaPigSounds() {
        if (this.guineaPigSoundInterval) {
            clearInterval(this.guineaPigSoundInterval);
            this.guineaPigSoundInterval = null;
        }
    }
    
    handleNumberClick(selectedNumber, buttonElement) {
        const isCorrect = selectedNumber === this.currentAnswer;
        
        if (isCorrect) {
            this.handleCorrectAnswer(buttonElement);
        } else {
            this.handleIncorrectAnswer(buttonElement, selectedNumber);
        }
    }
    
    handleCorrectAnswer(buttonElement) {
        // Check if this was the first attempt
        const wasFirstAttempt = !this.hasAttemptedAnswer();
        
        // Use ButtonBar for correct feedback
        if (window.ButtonBar) {
            window.ButtonBar.showCorrectFeedback(parseInt(buttonElement.dataset.number), buttonElement);
        }

        // Play completion sound using AudioSystem
        if (window.AudioSystem) {
            window.AudioSystem.playCompletionSound();
        }

        // Add rainbow piece
        this.rainbow.addPiece();
        
        // Give encouragement for correct answer
        if (this.isTabVisible) {
            const encouragements = ['Well done!', 'Excellent!', 'Perfect!', 'Great counting!'];
            const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
            setTimeout(() => {
                this.speakText(randomEncouragement);
            }, 400);
        }
        
        // Update difficulty level based on first attempt performance
        if (wasFirstAttempt) {
            this.updateDifficultyOnSuccess();
        } else {
            this.updateDifficultyOnFailure();
        }
        
        this.currentQuestion++;
        this.questionsCompleted++;
        
        // Stop timers
        this.clearInactivityTimer();
        
        // Check if game is complete
        if (this.currentQuestion >= CONFIG.TOTAL_QUESTIONS) {
            setTimeout(() => {
                this.completeGame();
            }, CONFIG.NEXT_QUESTION_DELAY + 1000);
            return;
        }

        // Start next question after delay
        setTimeout(() => {
            this.startNewQuestion();
        }, CONFIG.NEXT_QUESTION_DELAY);
    }
    
    updateDifficultyOnSuccess() {
        if (this.currentLevel === 1) {
            this.currentLevel = 2; // Level 1 correct on first attempt → Level 2
        } else if (this.currentLevel === 3) {
            this.currentLevel = 2; // Level 3 correct on first attempt → Level 2
        }
        // Level 2 stays at Level 2 when correct
    }
    
    updateDifficultyOnFailure() {
        if (this.currentLevel === 2) {
            this.currentLevel = 3; // Level 2 not correct on first attempt → Level 3
        } else if (this.currentLevel === 3) {
            this.currentLevel = 1; // Level 3 not correct on first attempt → Level 1
        }
        // Level 1 stays at Level 1 when not correct on first attempt
    }
    
    hasAttemptedAnswer() {
        return window.ButtonBar && window.ButtonBar.buttons && 
               Array.from(window.ButtonBar.buttons).some(btn => 
                   btn.dataset.attempted === 'true'
               );
    }
    
    handleIncorrectAnswer(buttonElement, selectedNumber) {
        // Clear inactivity timer and give immediate hint
        this.clearInactivityTimer();
        
        // Play failure sound using AudioSystem
        if (window.AudioSystem) {
            window.AudioSystem.playFailureSound();
        }
        
        // Disable buttons during error handling
        this.buttonsDisabled = true;
        
        // Use ButtonBar for incorrect feedback
        if (window.ButtonBar) {
            window.ButtonBar.showIncorrectFeedback(selectedNumber, buttonElement);
        }
        
        // Re-enable buttons and restart inactivity timer after ButtonBar animation
        setTimeout(() => {
            this.buttonsDisabled = false;
            this.startInactivityTimer();
        }, 2100);
    }
    
    resetButtonStates() {
        this.buttonsDisabled = false;
        
        if (window.ButtonBar) {
            window.ButtonBar.setButtonsEnabled(true);
            if (window.ButtonBar.buttons) {
                window.ButtonBar.buttons.forEach(btn => {
                    btn.dataset.attempted = 'false';
                    btn.classList.remove('correct', 'incorrect');
                    btn.style.opacity = '1';
                    btn.style.transition = '';
                    
                    // Remove any existing cross overlays using ButtonBar method
                    window.ButtonBar.removeCrossOverlay(btn);
                });
            }
        }
    }
    
    completeGame() {
        this.gameComplete = true;
        this.clearInactivityTimer();
        this.stopGuineaPigSounds();
        this.modal.classList.remove('hidden');
        
        // Start bear celebration when modal opens
        this.bear.startCelebration();
        
        // Give completion audio message
        if (this.isTabVisible) {
            setTimeout(() => {
                this.speakText('Well done! You have correctly counted how many raisins the guinea pig ate in all of the questions. Play again or return to the home page.');
            }, 1000);
        }
    }
    
    startNewGame() {
        this.currentQuestion = 0;
        this.currentAnswer = 0;
        this.gameComplete = false;
        this.buttonsDisabled = false;
        this.questionsCompleted = 0;
        this.currentLevel = 1; // Reset to Level 1
        
        this.clearInactivityTimer();
        this.stopGuineaPigSounds();
        
        this.rainbow.reset();
        this.bear.reset();
        this.raisinRenderer.reset();
        this.modal.classList.add('hidden');
        
        // Reset button states
        this.resetButtonStates();
        
        this.startNewQuestion();
    }
    
    speakText(text, options = {}) {
        if (window.AudioSystem) {
            window.AudioSystem.speakText(text, options);
        }
    }
    
    destroy() {
        // Clean up timers
        this.clearInactivityTimer();
        this.stopGuineaPigSounds();
        
        // Stop all audio using AudioSystem
        if (window.AudioSystem) {
            window.AudioSystem.stopAllAudio();
        }
        
        // Clean up other resources
        this.rainbow.reset();
        this.bear.reset();
        this.raisinRenderer.reset();
        
        if (window.ButtonBar) {
            window.ButtonBar.destroy();
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🐹 DOM loaded, creating RaisinGameController (Universal Systems Version)');
    window.raisinGame = new RaisinGameController();
});

// Clean up resources when page is about to unload
window.addEventListener('beforeunload', () => {
    if (window.raisinGame) {
        window.raisinGame.destroy();
    }
});
