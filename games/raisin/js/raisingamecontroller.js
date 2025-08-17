/**
 * Raisin Game Controller - Universal Systems Version
 * Manages game flow, tutorial mode, difficulty progression, and user interactions.
 * Coordinates between RaisinPositionRenderer and RaisinAnimationRenderer.
 * Handles 5-raisin tutorial mode for first 3 questions, then 10-raisin normal mode.
 */
class RaisinGameController {
    constructor() {
        console.log('🐹 Raisin Game Controller - Universal Systems Version');
        
        // Initialize universal components
        this.positionRenderer = new RaisinPositionRenderer();
        this.animationRenderer = new RaisinAnimationRenderer(this.positionRenderer);
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        
        // Game state
        this.currentQuestion = 0;
        this.currentAnswer = 0;
        this.gameComplete = false;
        this.buttonsDisabled = false;
        this.questionsCompleted = 0;
        
        // Simplified level system tracking
        this.currentLevel = 1; // Start at level 1
        this.consecutiveCorrect = 0; // Track consecutive first-attempt correct answers
        this.recentAnswers = []; // Track last 2 answers for avoiding repeats
        this.questionCount = 0; // Total questions asked (for first question detection)
        
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
        // Create buttons based on current level
        const buttonCount = CONFIG.isLevel1(this.currentLevel) ? 5 : 10;
        
        const colors = CONFIG.COLORS.slice(0, buttonCount);
        const numbers = Array.from({length: buttonCount}, (_, i) => i + 1);
        
        console.log(`Creating raisin game buttons: ${buttonCount} buttons for level ${this.currentLevel}`);
        
        if (window.ButtonBar) {
            window.ButtonBar.destroy();
        }
        
        setTimeout(() => {
            if (window.ButtonBar) {
                window.ButtonBar.create(
                    buttonCount,
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
        
        // Keyboard input support
        document.addEventListener('keydown', (e) => {
            if (this.buttonsDisabled || this.gameComplete) return;
            
            if (e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                const selectedNumber = parseInt(e.key);
                
                // Check if this number is available on current buttons
                const isTutorial = CONFIG.isTutorialMode(this.currentQuestion);
                const maxButton = isTutorial ? 5 : 10;
                
                if (selectedNumber <= maxButton) {
                    console.log('⌨️ Keyboard input:', selectedNumber);
                    
                    this.clearInactivityTimer();
                    this.startInactivityTimer();
                    this.handleNumberClick(selectedNumber, null); // null for buttonElement since it's keyboard
                }
            }
        });
    }
    
    setupVisibilityHandling() {
        // Handle tab visibility changes
        document.addEventListener('visibilitychange', () => {
            this.isTabVisible = !document.hidden;
            
            if (!this.isTabVisible) {
                // Tab is hidden - stop all audio and clear timers
                this.clearInactivityTimer();
                this.animationRenderer.stopGuineaPigSounds();
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
        
        const hintMessage = CONFIG.getHintMessage(this.currentLevel);
        this.speakText(hintMessage);
    }
    
    async startNewQuestion() {
        if (this.gameComplete || this.currentQuestion >= CONFIG.TOTAL_QUESTIONS) {
            return;
        }
        
        // Reset hint tracking for new question
        this.hintGiven = false;
        this.buttonsDisabled = false;
        
        // Generate question based on simplified level system
        this.currentAnswer = this.generateAnswerForCurrentMode();
        
        console.log(`Question ${this.currentQuestion + 1}: Level ${this.currentLevel}, Answer: ${this.currentAnswer}, Consecutive Correct: ${this.consecutiveCorrect}`);
        
        // Render raisins with staggered appearance
        await this.positionRenderer.renderRaisinsStaggered(this.currentLevel);
        
        // Select exactly currentAnswer raisins to eat
        const raisinsToEat = this.selectRaisinsToEat();
        
        // Give starting instruction (different for first question vs subsequent)
        this.giveStartingInstruction();
        
        // Start the guinea pig sequence
        await this.runGuineaPigSequence(raisinsToEat);
        
        // Start inactivity timer after guinea pigs finish
        this.startInactivityTimer();
    }
    
    generateAnswerForCurrentMode() {
        let possibleAnswers;
        
        if (CONFIG.isLevel1(this.currentLevel)) {
            possibleAnswers = CONFIG.LEVEL_SYSTEM.LEVEL_1.POSSIBLE_MISSING;
        } else {
            possibleAnswers = CONFIG.LEVEL_SYSTEM.LEVEL_2.POSSIBLE_MISSING;
        }
        
        // Remove last 2 answers from possible choices to avoid repeats in rolling group of 3
        const availableAnswers = possibleAnswers.filter(answer => 
            !this.recentAnswers.includes(answer)
        );
        
        // If no answers available (shouldn't happen with sets of 4+ items), use all
        const finalAnswers = availableAnswers.length > 0 ? availableAnswers : possibleAnswers;
        
        // Select random answer from available set
        const selectedAnswer = finalAnswers[Math.floor(Math.random() * finalAnswers.length)];
        
        // Update recent answers (keep only last 2)
        this.recentAnswers.push(selectedAnswer);
        if (this.recentAnswers.length > 2) {
            this.recentAnswers.shift(); // Remove oldest
        }
        
        console.log(`🎯 Level ${this.currentLevel} - Selected: ${selectedAnswer}, Recent: [${this.recentAnswers.join(', ')}], Available was: [${finalAnswers.join(', ')}]`);
        
        return selectedAnswer;
    }
    
    selectRaisinsToEat() {
        const totalRaisins = CONFIG.getTotalRaisins(this.currentLevel);
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
        
        const audioMessages = CONFIG.getAudioMessages(this.currentLevel);
        
        setTimeout(() => {
            if (this.questionCount === 0) {
                // Very first question - full instruction
                this.speakText(audioMessages.FIRST_QUESTION);
            } else {
                // Subsequent questions - shorter instruction
                this.speakText(audioMessages.SUBSEQUENT_QUESTION);
            }
        }, 500);
    }
    
    async runGuineaPigSequence(raisinsToEat) {
        this.buttonsDisabled = true;
        
        // Show guinea pig 3 and raisins for 4 seconds
        this.animationRenderer.showGuineaPig3();
        
        // Wait for initial display period
        await this.sleep(CONFIG.GUINEA_PIG_3_INITIAL_DISPLAY);
        
        // For first question only, give extended instruction
        if (this.questionCount === 0) {
            await this.sleep(CONFIG.INITIAL_INSTRUCTION_DELAY);
            
            if (this.isTabVisible) {
                const audioMessages = CONFIG.getAudioMessages(this.currentLevel);
                this.speakText(audioMessages.FIRST_INSTRUCTION);
            }
            
            // Wait for instruction to finish (approximately 5 seconds)
            await this.sleep(5000);
        }
        
        // Fade out guinea pig 3 completely before moving guinea pigs appear
        await this.animationRenderer.fadeOutGuineaPig3();
        
        // Start guinea pig sounds
        this.animationRenderer.startGuineaPigSounds();
        
        // Guinea pig 2 moves left to right (only after GP3 is completely gone)
        await this.animationRenderer.moveGuineaPig2(raisinsToEat);
        
        // Short pause
        await this.sleep(CONFIG.GUINEA_PIG_PAUSE_DURATION);
        
        // Guinea pig 1 moves right to left (only after GP2 is completely gone)
        await this.animationRenderer.moveGuineaPig1(raisinsToEat);
        
        // Stop guinea pig sounds
        this.animationRenderer.stopGuineaPigSounds();
        
        // Fade in guinea pig 3 again (only after GP1 is completely gone)
        await this.animationRenderer.fadeInGuineaPig3();
        
        // Give question instruction
        setTimeout(() => {
            if (this.isTabVisible) {
                const audioMessages = CONFIG.getAudioMessages(this.currentLevel);
                this.speakText(audioMessages.QUESTION);
            }
        }, 500);
        
        this.buttonsDisabled = false;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
        
        // For keyboard input, find the button element
        if (!buttonElement && window.ButtonBar) {
            buttonElement = window.ButtonBar.findButtonByNumber(this.currentAnswer);
        }
        
        // Use ButtonBar for correct feedback
        if (window.ButtonBar) {
            window.ButtonBar.showCorrectFeedback(this.currentAnswer, buttonElement);
        }

        // Play completion sound using AudioSystem
        if (window.AudioSystem) {
            window.AudioSystem.playCompletionSound();
        }

        // Add rainbow piece
        this.rainbow.addPiece();
        
        // Give encouragement for correct answer
        if (this.isTabVisible) {
            const encouragements = CONFIG.AUDIO.ENCOURAGEMENTS;
            const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
            setTimeout(() => {
                this.speakText(randomEncouragement);
            }, 400);
        }
        
        // Update level progression based on simplified system
        if (wasFirstAttempt) {
            this.consecutiveCorrect++;
            console.log(`✅ Consecutive correct: ${this.consecutiveCorrect}`);
            
            // Check if ready to advance to level 2
            if (this.currentLevel === 1 && this.consecutiveCorrect >= CONFIG.LEVEL_SYSTEM.LEVEL_1.CONSECUTIVE_CORRECT_NEEDED) {
                this.currentLevel = 2;
                this.consecutiveCorrect = 0; // Reset counter for level 2
                console.log(`🎉 Advanced to Level 2!`);
            }
        } else {
            // Wrong on first attempt - reset consecutive counter
            if (this.currentLevel === 1) {
                this.consecutiveCorrect = 0;
                console.log(`❌ Reset consecutive correct count to 0`);
            }
            // Level 2 has no return to level 1
        }
        
        this.currentQuestion++;
        this.questionsCompleted++;
        this.questionCount++; // Track total questions for first question detection
        
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
        // Only update difficulty in normal mode (not tutorial)
        if (!CONFIG.isTutorialMode(this.currentQuestion - 1)) { // -1 because we already incremented
            if (this.currentLevel === 1) {
                this.currentLevel = 2; // Level 1 correct on first attempt → Level 2
            } else if (this.currentLevel === 3) {
                this.currentLevel = 2; // Level 3 correct on first attempt → Level 2
            }
            // Level 2 stays at Level 2 when correct
        }
    }
    
    updateDifficultyOnFailure() {
        // Only update difficulty in normal mode (not tutorial)
        if (!CONFIG.isTutorialMode(this.currentQuestion - 1)) { // -1 because we already incremented
            if (this.currentLevel === 2) {
                this.currentLevel = 3; // Level 2 not correct on first attempt → Level 3
            } else if (this.currentLevel === 3) {
                this.currentLevel = 1; // Level 3 not correct on first attempt → Level 1
            }
            // Level 1 stays at Level 1 when not correct on first attempt
        }
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
        
        // For keyboard input, find the button element
        if (!buttonElement && window.ButtonBar) {
            buttonElement = window.ButtonBar.findButtonByNumber(selectedNumber);
        }
        
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
        
        // Give specific wrong answer hint after button animation
        if (this.isTabVisible) {
            setTimeout(() => {
                const audioMessages = CONFIG.getAudioMessages(this.currentLevel);
                this.speakText(audioMessages.WRONG_ANSWER_HINT);
            }, 800);
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
        this.animationRenderer.stopGuineaPigSounds();
        this.modal.classList.remove('hidden');
        
        // Start bear celebration when modal opens
        this.bear.startCelebration();
        
        // Give completion audio message
        if (this.isTabVisible) {
            setTimeout(() => {
                this.speakText(CONFIG.AUDIO.COMPLETION_MESSAGE);
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
        this.consecutiveCorrect = 0; // Reset consecutive counter
        this.recentAnswers = []; // Clear recent answers
        this.questionCount = 0; // Reset question count
        
        this.clearInactivityTimer();
        this.animationRenderer.stopGuineaPigSounds();
        
        this.rainbow.reset();
        this.bear.reset();
        this.positionRenderer.reset();
        this.animationRenderer.reset();
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
        this.animationRenderer.stopGuineaPigSounds();
        
        // Stop all audio using AudioSystem
        if (window.AudioSystem) {
            window.AudioSystem.stopAllAudio();
        }
        
        // Clean up other resources
        this.rainbow.reset();
        this.bear.reset();
        this.positionRenderer.destroy();
        this.animationRenderer.destroy();
        
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
