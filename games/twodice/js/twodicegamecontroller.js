class TwoDiceGameController {
    constructor() {
        // Initialize components in proper order
        this.diceRenderer = new DiceRenderer();
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        this.stats = new TwoDiceStats();
        
        // Game state
        this.questionsCompleted = 0;
        this.gameComplete = false;
        
        // UPDATED: Predetermined sequence tracking
        this.targetSequence = [
            [1,1], [2,2], [3,3], [2,4], [5,6], 
            [5,1], [6,6], [6,3], [4,3], [3,1]
        ];
        this.currentSequenceIndex = 0;
        
        // Current question state
        this.currentLeftValue = 0;
        this.currentRightValue = 0;
        this.currentTotal = 0;
        this.buttonsDisabled = false;
        
        // Track which boxes are filled
        this.leftFilled = false;
        this.rightFilled = false;
        this.totalFilled = false;
        
        // Inactivity timer for audio hints
        this.inactivityTimer = null;
        this.inactivityDuration = 20000; // 20 seconds
        this.hintGiven = false;
        this.isTabVisible = true;
        
        // Keyboard handling for two-digit numbers
        this.keyboardBuffer = '';
        this.keyboardTimer = null;
        this.keyboardWaitDuration = 4000; // 4 seconds
        
        // Flashing intervals
        this.flashingInterval = null;
        this.flashingTimeout = null;
        
        // Loading state and initialization tracking
        this.isLoading = true;
        this.initializationComplete = false;
        this.buttonBarReady = false;
        this.gameAreaReady = false;
        
        // UPDATED: Remove old level system variables (keep for future enhancement)
        // this.currentLevel = CONFIG.LEVEL_SYSTEM.STARTING_LEVEL;
        // this.usedSumsThisRound = new Set();
        // this.roundQuestionCount = 0;
        
        // DOM elements
        this.modal = document.getElementById('gameModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.leftInputBox = document.getElementById('leftInputBox');
        this.rightInputBox = document.getElementById('rightInputBox');
        this.totalInputBox = document.getElementById('totalInputBox');
        this.checkMark = document.getElementById('checkMark');
        this.leftSide = document.getElementById('leftSide');
        this.rightSide = document.getElementById('rightSide');
        this.leftFlashArea = document.getElementById('leftFlashArea');
        this.rightFlashArea = document.getElementById('rightFlashArea');
        this.gameArea = document.querySelector('.game-area');
        this.sumRow = document.getElementById('sumRow');
        
        // Stats display elements
        this.statsDisplay = {
            accuracy: document.getElementById('accuracyStat'),
            resilience: document.getElementById('resilienceStat'),
            speed: document.getElementById('speedStat'),
            variety: document.getElementById('varietyStat'),
            questions: document.getElementById('questionsStat')
        };
        
        // Update stats display periodically
        this.statsUpdateInterval = setInterval(() => {
            this.updateStatsDisplay();
        }, 1000);
        
        // Initialize in proper order
        this.initializeEventListeners();
        this.setupVisibilityHandling();
        this.waitForSystemsAndInitialize();
        
        console.log(`🎮 Game started with predetermined sequence of ${this.targetSequence.length} questions`);
    }

    /**
     * Wait for both ButtonBar AND proper game area setup
     */
    waitForSystemsAndInitialize() {
        console.log('🎲 Checking system readiness...');
        
        const buttonBarReady = window.ButtonBar && typeof window.ButtonBar.create === 'function';
        const gameAreaReady = this.gameArea && this.leftSide && this.rightSide && this.sumRow;
        
        if (buttonBarReady && gameAreaReady) {
            console.log('🎲 All systems ready, proceeding with initialization');
            this.buttonBarReady = true;
            this.gameAreaReady = true;
            
            this.createButtons();
            this.setupButtonBarCoordination();
            
            setTimeout(() => {
                console.log('🎲 ButtonBar coordination complete, initializing game');
                this.initializeGame();
            }, 800);
        } else {
            console.log(`⏳ Waiting for systems... ButtonBar: ${buttonBarReady}, GameArea: ${gameAreaReady}`);
            setTimeout(() => {
                this.waitForSystemsAndInitialize();
            }, 100);
        }
    }

    setupButtonBarCoordination() {
        if (window.ButtonBar) {
            window.ButtonBar.addObserver((dimensionData) => {
                console.log('🎯 ButtonBar dimensions updated:', dimensionData);
                this.updateGameAreaDimensions();
            });
        }
    }

    updateGameAreaDimensions() {
        if (!this.gameArea) {
            console.error('❌ Game area not found when trying to update dimensions');
            return;
        }
        
        this.gameArea.offsetHeight;
        
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        
        if (gameAreaRect.width < 100 || gameAreaRect.height < 100) {
            console.warn('⚠️ Game area dimensions seem too small, retrying...', gameAreaRect);
            setTimeout(() => {
                this.updateGameAreaDimensions();
            }, 100);
            return;
        }
        
        document.documentElement.style.setProperty('--game-area-width', `${gameAreaRect.width}px`);
        
        console.log('📏 Game area dimensions updated and CSS custom property set:', gameAreaRect.width, 'px');
        
        this.forceStyleRecalculation();
    }
    
    forceStyleRecalculation() {
        const elementsToUpdate = [
            document.querySelector('.plus-sign'),
            document.querySelector('.sum-row'),
            ...document.querySelectorAll('.input-box'),
            ...document.querySelectorAll('.sum-plus-sign, .sum-equals-sign'),
            document.querySelector('.check-mark')
        ];
        
        elementsToUpdate.forEach(element => {
            if (element) {
                const originalDisplay = element.style.display;
                element.style.display = 'none';
                element.offsetHeight;
                element.style.display = originalDisplay;
            }
        });
        
        console.log('🔄 Forced style recalculation for CSS custom property dependent elements');
    }

    initializeGame() {
        console.log('🎲 Starting game initialization with loading sequence');
        
        this.hideGameElements();
        
        setTimeout(() => {
            console.log('🎲 Starting fade-in sequence');
            this.showGameElements();
            this.isLoading = false;
            this.initializationComplete = true;
            
            setTimeout(() => {
                this.startNewQuestion();
            }, 1000);
            
        }, 500);
    }

    hideGameElements() {
        if (this.gameArea) this.gameArea.classList.remove('loaded');
        if (this.sumRow) this.sumRow.classList.remove('loaded');
    }

    showGameElements() {
        if (this.gameArea) {
            this.gameArea.classList.add('loaded');
        }
        
        if (this.sumRow) {
            this.sumRow.classList.add('loaded');
        }
        
        console.log('🎲 Game elements faded in');
    }

    createButtons() {
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', 
            '#eb4d4b', '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894',
            '#00cec9', '#e17055'
        ];
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        
        if (window.ButtonBar && this.buttonBarReady) {
            window.ButtonBar.create(
                12,
                6.7,
                6.7,
                colors,
                numbers,
                (selectedNumber, buttonElement) => {
                    if (this.buttonsDisabled || !this.initializationComplete) return;
                    
                    this.clearInactivityTimer();
                    this.startInactivityTimer();
                    
                    this.handleNumberClick(selectedNumber, buttonElement);
                }
            );
            console.log('✅ Button bar created successfully');
        } else {
            console.warn('ButtonBar not available - using fallback');
        }
    }

    setupVisibilityHandling() {
        document.addEventListener('visibilitychange', () => {
            this.isTabVisible = !document.hidden;
            
            if (!this.isTabVisible) {
                this.clearInactivityTimer();
                if (window.AudioSystem) {
                    window.AudioSystem.stopAllAudio();
                }
            } else {
                if (!this.gameComplete && !this.buttonsDisabled && this.initializationComplete) {
                    this.startInactivityTimer();
                }
            }
        });
    }

    speakText(text, options = {}) {
        if (window.AudioSystem) {
            window.AudioSystem.speakText(text, options);
        }
    }

    playCompletionSound() {
        if (window.AudioSystem) {
            window.AudioSystem.playCompletionSound();
        }
    }

    playFailureSound() {
        if (window.AudioSystem) {
            window.AudioSystem.playFailureSound();
        }
    }

    startInactivityTimer() {
        if (!this.isTabVisible || this.hintGiven || !this.initializationComplete) {
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

    clearKeyboardTimer() {
        if (this.keyboardTimer) {
            clearTimeout(this.keyboardTimer);
            this.keyboardTimer = null;
        }
        this.keyboardBuffer = '';
    }

    giveInactivityHint() {
        if (this.buttonsDisabled || this.gameComplete || !this.isTabVisible || !this.initializationComplete) return;
        
        this.hintGiven = true;
        
        let hintText = '';
        if (!this.leftFilled) {
            hintText = CONFIG.AUDIO.MESSAGES.HINT_LEFT_DICE;
        } else if (!this.rightFilled) {
            hintText = CONFIG.AUDIO.MESSAGES.HINT_RIGHT_DICE;
        } else if (!this.totalFilled) {
            hintText = CONFIG.AUDIO.MESSAGES.HINT_TOTAL;
        }
        
        if (hintText) {
            this.speakText(hintText);
        }
    }

    initializeEventListeners() {
        this.playAgainBtn.addEventListener('click', () => {
            this.startNewGame();
        });

        document.addEventListener('keydown', (e) => {
            if (this.buttonsDisabled || this.gameComplete || !this.initializationComplete) {
                return;
            }
            
            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                
                this.clearInactivityTimer();
                this.startInactivityTimer();
                
                const digit = parseInt(e.key);
                this.handleKeyboardDigit(digit);
            }
        });

        window.addEventListener('beforeunload', () => {
            this.destroy();
        });
    }

    handleKeyboardDigit(digit) {
        if (this.keyboardBuffer === '1' && (digit === 0 || digit === 1 || digit === 2)) {
            this.clearKeyboardTimer();
            const number = parseInt('1' + digit);
            if (number >= 10 && number <= 12) {
                this.handleNumberClick(number, null);
            }
            return;
        }
        
        this.clearKeyboardTimer();
        
        if (digit === 1) {
            if (this.isDigitValidAnswer(1)) {
                this.handleNumberClick(1, null);
                return;
            }
            
            if (this.isDigitValidAnswer(10) || this.isDigitValidAnswer(11) || this.isDigitValidAnswer(12)) {
                this.keyboardBuffer = '1';
                this.keyboardTimer = setTimeout(() => {
                    this.clearKeyboardTimer();
                    this.handleNumberClick(1, null);
                }, this.keyboardWaitDuration);
                return;
            }
        }
        
        if (digit >= 1 && digit <= 9) {
            this.handleNumberClick(digit, null);
        }
    }

    isDigitValidAnswer(number) {
        if (!this.leftFilled && number === this.currentLeftValue) return true;
        if (!this.rightFilled && number === this.currentRightValue) return true;
        if (!this.totalFilled && number === this.currentTotal) return true;
        return false;
    }

    /**
     * UPDATED: Get target values from predetermined sequence
     */
    getCurrentTargetValues() {
        // Check if we've completed all questions in the sequence
        if (this.currentSequenceIndex >= this.targetSequence.length) {
            console.log('🎉 All predetermined questions completed!');
            return null; // Signal that we're done
        }
        
        const [leftValue, rightValue] = this.targetSequence[this.currentSequenceIndex];
        const total = leftValue + rightValue;
        
        console.log(`🎯 Question ${this.currentSequenceIndex + 1}/${this.targetSequence.length}: Left=${leftValue}, Right=${rightValue}, Total=${total}`);
        
        return { leftValue, rightValue, total };
    }

    /**
     * UPDATED: Progress to next question in sequence
     */
    advanceToNextQuestion() {
        this.currentSequenceIndex++;
        console.log(`📈 Advanced to question ${this.currentSequenceIndex + 1}/${this.targetSequence.length}`);
    }

    startNewGame() {
        this.questionsCompleted = 0;
        this.gameComplete = false;
        this.clearInactivityTimer();
        this.clearKeyboardTimer();
        this.resetBoxState();
        
        // UPDATED: Reset sequence tracking
        this.currentSequenceIndex = 0;
        
        this.rainbow.reset();
        this.bear.reset();
        this.diceRenderer.reset();
        this.modal.classList.add('hidden');
        this.hideAllInputBoxes();
        
        this.initializationComplete = true;
        
        console.log(`🔄 New game started with predetermined sequence`);
        this.startNewQuestion();
    }

    resetBoxState() {
        this.leftFilled = false;
        this.rightFilled = false;
        this.totalFilled = false;
        this.stopFlashing();
    }

    startFlashing() {
        this.stopFlashing();
        
        const flashElements = () => {
            if (!this.leftFilled) {
                this.leftFlashArea.classList.add('area-flash');
                this.leftInputBox.classList.add('box-flash');
            } else if (!this.rightFilled) {
                this.rightFlashArea.classList.add('area-flash');
                this.rightInputBox.classList.add('box-flash');
            } else if (!this.totalFilled) {
                this.leftFlashArea.classList.add('area-flash');
                this.rightFlashArea.classList.add('area-flash');
                this.totalInputBox.classList.add('box-flash');
            }
            
            setTimeout(() => {
                this.leftFlashArea.classList.remove('area-flash');
                this.rightFlashArea.classList.remove('area-flash');
                this.leftInputBox.classList.remove('box-flash');
                this.rightInputBox.classList.remove('box-flash');
                this.totalInputBox.classList.remove('box-flash');
            }, 1000);
        };
        
        this.flashingTimeout = setTimeout(() => {
            flashElements();
            this.flashingInterval = setInterval(flashElements, 5000);
        }, 5000);
    }

    stopFlashing() {
        if (this.flashingInterval) {
            clearInterval(this.flashingInterval);
            this.flashingInterval = null;
        }
        
        if (this.flashingTimeout) {
            clearTimeout(this.flashingTimeout);
            this.flashingTimeout = null;
        }
        
        this.leftFlashArea.classList.remove('area-flash');
        this.rightFlashArea.classList.remove('area-flash');
        this.leftInputBox.classList.remove('box-flash');
        this.rightInputBox.classList.remove('box-flash');
        this.totalInputBox.classList.remove('box-flash');
    }

    async startNewQuestion() {
        if (this.gameComplete || !this.initializationComplete) {
            return;
        }

        // UPDATED: Get target values from sequence
        const targets = this.getCurrentTargetValues();
        if (!targets) {
            // We've completed all questions in the sequence
            this.completeGame();
            return;
        }

        this.resetBoxState();
        this.hideAllInputBoxes();
        this.hintGiven = false;

        console.log(`🎲 Starting question ${this.questionsCompleted + 1}: sequence index ${this.currentSequenceIndex}`);
        
        this.resetButtonStates();
        this.giveStartingInstruction();
        
        // UPDATED: Use predetermined target values
        this.currentLeftValue = targets.leftValue;
        this.currentRightValue = targets.rightValue;
        this.currentTotal = targets.total;
        
        // Disable buttons during dice roll
        this.buttonsDisabled = true;
        if (window.ButtonBar) {
            window.ButtonBar.setButtonsEnabled(false);
        }
        
        try {
            // UPDATED: Pass current sequence index to dice renderer
            const result = await this.diceRenderer.rollDiceForSequence(this.currentSequenceIndex);
            
            console.log('🎲 DICE RENDERER RETURNED:', result);
            console.log(`🎯 TARGET vs ACTUAL: Target(${this.currentLeftValue}, ${this.currentRightValue}) vs Actual(${result.left}, ${result.right})`);
            
            // Verify the dice landed on the expected values
            if (result.left !== this.currentLeftValue || result.right !== this.currentRightValue) {
                console.warn(`⚠️ Dice mismatch! Expected (${this.currentLeftValue}, ${this.currentRightValue}) but got (${result.left}, ${result.right})`);
            }
            
            // Enable buttons and show input boxes
            this.buttonsDisabled = false;
            if (window.ButtonBar) {
                window.ButtonBar.setButtonsEnabled(true);
            }
            this.showInputBoxes();
            this.startInactivityTimer();
            
            // Start question timer for stats tracking
            this.stats.startQuestionTimer();
            
        } catch (error) {
            console.error('Error rolling dice:', error);
            // Fallback with the target values
            this.buttonsDisabled = false;
            if (window.ButtonBar) {
                window.ButtonBar.setButtonsEnabled(true);
            }
            this.showInputBoxes();
            this.startInactivityTimer();
            
            this.stats.startQuestionTimer();
        }
    }

    giveStartingInstruction() {
        if (!this.isTabVisible || !this.initializationComplete) return;
        
        setTimeout(() => {
            let message;
            if (this.questionsCompleted === 0) {
                message = CONFIG.AUDIO.MESSAGES.FIRST_QUESTION;
            } else if (this.questionsCompleted === 1) {
                message = CONFIG.AUDIO.MESSAGES.SECOND_QUESTION;
            } else {
                message = CONFIG.AUDIO.MESSAGES.CONTINUE_QUESTION;
            }
            this.speakText(message);
        }, 500);
    }

    hideAllInputBoxes() {
        this.checkMark.classList.remove('visible');
        
        this.leftInputBox.textContent = '';
        this.rightInputBox.textContent = '';
        this.totalInputBox.textContent = '';
        
        this.leftInputBox.classList.remove('flashing', 'filled');
        this.rightInputBox.classList.remove('flashing', 'filled');
        this.totalInputBox.classList.remove('flashing', 'filled');
    }

    showInputBoxes() {
        if (!this.leftFilled) {
            this.leftInputBox.classList.add('flashing');
        } else if (!this.rightFilled) {
            this.rightInputBox.classList.add('flashing');
        } else if (!this.totalFilled) {
            this.totalInputBox.classList.add('flashing');
        }
        this.startFlashing();
    }

    handleNumberClick(selectedNumber, buttonElement) {
        this.clearKeyboardTimer();
        
        let correctAnswer = false;
        const wasFirstAttempt = !this.hasAttemptedAnswer();
        
        if (!this.leftFilled && selectedNumber === this.currentLeftValue) {
            this.fillBox('left', selectedNumber, buttonElement);
            correctAnswer = true;
        } else if (!this.rightFilled && selectedNumber === this.currentRightValue) {
            this.fillBox('right', selectedNumber, buttonElement);
            correctAnswer = true;
        } else if (!this.totalFilled && selectedNumber === this.currentTotal) {
            this.fillBox('total', selectedNumber, buttonElement);
            correctAnswer = true;
        }
        
        // Record stats for this question attempt
        if (correctAnswer) {
            this.stats.recordQuestionAttempt(wasFirstAttempt);
            this.checkQuestionCompletion();
        } else {
            this.stats.recordQuestionAttempt(false);
            this.handleIncorrectAnswer(buttonElement, selectedNumber);
        }
    }

    fillBox(boxType, selectedNumber, buttonElement) {
        if (!buttonElement && window.ButtonBar) {
            buttonElement = window.ButtonBar.findButtonByNumber(selectedNumber);
        }
        
        if (buttonElement && window.ButtonBar) {
            window.ButtonBar.animateButton(buttonElement, 'correct');
        }

        this.playCompletionSound();

        if (buttonElement) {
            this.createCelebrationStars(buttonElement);
        }

        switch (boxType) {
            case 'left':
                this.leftInputBox.textContent = selectedNumber;
                this.leftInputBox.classList.remove('flashing');
                this.leftInputBox.classList.add('filled');
                this.leftFilled = true;
                break;
            case 'right':
                this.rightInputBox.textContent = selectedNumber;
                this.rightInputBox.classList.remove('flashing');
                this.rightInputBox.classList.add('filled');
                this.rightFilled = true;
                break;
            case 'total':
                this.totalInputBox.textContent = selectedNumber;
                this.totalInputBox.classList.remove('flashing');
                this.totalInputBox.classList.add('filled');
                this.totalFilled = true;
                break;
        }

        const boxesFilledBefore = [this.leftFilled, this.rightFilled, this.totalFilled].filter(Boolean).length - 1;
        const wasLastBox = boxesFilledBefore === 2;
        
        if (wasLastBox) {
            this.buttonsDisabled = true;
            if (window.ButtonBar) {
                window.ButtonBar.setButtonsEnabled(false);
            }
            console.log('🔒 Final box filled - buttons disabled');
        }

        if (!wasLastBox) {
            this.updateFlashingBoxes();
        }
    }

    updateFlashingBoxes() {
        this.leftInputBox.classList.remove('flashing');
        this.rightInputBox.classList.remove('flashing');
        this.totalInputBox.classList.remove('flashing');
        
        if (!this.leftFilled) {
            this.leftInputBox.classList.add('flashing');
        } else if (!this.rightFilled) {
            this.rightInputBox.classList.add('flashing');
        } else if (!this.totalFilled) {
            this.totalInputBox.classList.add('flashing');
        }
        
        this.startFlashing();
    }

    checkQuestionCompletion() {
        if (this.leftFilled && this.rightFilled && this.totalFilled) {
            this.clearInactivityTimer();
            this.stopFlashing();
            
            this.checkMark.classList.add('visible');
            
            const pieces = this.rainbow.addPiece();
            console.log(`Rainbow pieces: ${pieces}`);
            
            // Random encouragement
            const encouragements = CONFIG.AUDIO.MESSAGES.CORRECT_ANSWERS;
            const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
            this.speakText(randomEncouragement);
            
            this.questionsCompleted++;
            
            // UPDATED: Advance to next question in sequence
            this.advanceToNextQuestion();
            
            if (this.rainbow.isComplete()) {
                this.stats.recordRoundCompletion();
                
                setTimeout(() => {
                    this.completeGame();
                }, 3000);
                return;
            }

            setTimeout(() => {
                this.fadeOutDice();
            }, CONFIG.NEXT_QUESTION_DELAY);
        }
    }

    handleIncorrectAnswer(buttonElement, selectedNumber) {
        if (!buttonElement && selectedNumber && window.ButtonBar) {
            buttonElement = window.ButtonBar.findButtonByNumber(selectedNumber);
        }
        
        this.clearInactivityTimer();
        
        this.playFailureSound();
        
        if (this.isTabVisible) {
            setTimeout(() => {
                this.speakText(CONFIG.AUDIO.MESSAGES.INCORRECT_ANSWER);
            }, 800);
        }
        
        this.buttonsDisabled = true;
        if (window.ButtonBar) {
            window.ButtonBar.setButtonsEnabled(false);
        }
        
        this.stopFlashing();
        
        if (buttonElement && window.ButtonBar) {
            window.ButtonBar.animateButton(buttonElement, 'incorrect');
        }

        let crossOverlay = null;
        if (buttonElement && window.ButtonBar) {
            crossOverlay = window.ButtonBar.addCrossOverlay(buttonElement);
        }

        if (buttonElement) {
            buttonElement.dataset.attempted = 'true';
        }
        
        this.fadeOtherButtons(buttonElement);

        setTimeout(() => {
            setTimeout(() => {
                this.fadeInAllButtons();
                
                if (crossOverlay && crossOverlay.parentNode) {
                    crossOverlay.style.transition = 'opacity 700ms ease-out';
                    crossOverlay.style.opacity = '0';
                }
                
                setTimeout(() => {
                    if (buttonElement && window.ButtonBar) {
                        window.ButtonBar.removeCrossOverlay(buttonElement);
                    }
                }, 700);
            }, 700);
            
            setTimeout(() => {
                this.buttonsDisabled = false;
                if (window.ButtonBar) {
                    window.ButtonBar.setButtonsEnabled(true);
                }
                this.startFlashing();
                this.startInactivityTimer();
            }, 1400);
        }, 700);
    }

    fadeOtherButtons(excludeButton) {
        if (window.ButtonBar && window.ButtonBar.buttons) {
            window.ButtonBar.buttons.forEach(btn => {
                if (btn !== excludeButton) {
                    btn.style.transition = 'opacity 700ms ease-in-out';
                    btn.style.opacity = '0.1';
                }
            });
        }
    }

    fadeInAllButtons() {
        if (window.ButtonBar && window.ButtonBar.buttons) {
            window.ButtonBar.buttons.forEach(btn => {
                btn.style.transition = 'opacity 700ms ease-in-out';
                btn.style.opacity = '1';
            });
            
            setTimeout(() => {
                window.ButtonBar.buttons.forEach(btn => {
                    btn.style.transition = '';
                });
            }, 700);
        }
    }

    async fadeOutDice() {
        console.log('Starting dice transition');
        
        await this.diceRenderer.fadeOutCurrentDice();
        this.startNewQuestion();
    }

    hasAttemptedAnswer() {
        if (window.ButtonBar && window.ButtonBar.buttons) {
            return window.ButtonBar.buttons.some(btn => 
                btn.dataset.attempted === 'true'
            );
        }
        return false;
    }

    resetButtonStates() {
        this.buttonsDisabled = false;
        
        if (window.ButtonBar && window.ButtonBar.buttons) {
            window.ButtonBar.setButtonsEnabled(true);
            window.ButtonBar.buttons.forEach(btn => {
                btn.dataset.attempted = 'false';
                btn.classList.remove('correct', 'incorrect');
                btn.style.opacity = '1';
                btn.style.transition = '';
                
                window.ButtonBar.removeCrossOverlay(btn);
            });
        }
    }

    completeGame() {
        this.gameComplete = true;
        this.clearInactivityTimer();
        this.clearKeyboardTimer();
        this.stopFlashing();
        this.modal.classList.remove('hidden');
        
        this.bear.startCelebration();
        
        if (this.isTabVisible) {
            setTimeout(() => {
                this.speakText(CONFIG.AUDIO.MESSAGES.GAME_COMPLETE);
            }, 1000);
        }
    }

    createCelebrationStars(buttonElement) {
        if (!buttonElement) return;
        
        const buttonRect = buttonElement.getBoundingClientRect();
        const centerX = buttonRect.left + buttonRect.width / 2;
        const centerY = buttonRect.top + buttonRect.height / 2;
        
        const starCount = 5;
        const radius = 60;
        
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.innerHTML = '⭐';
            star.className = 'completion-star';
            star.style.fontSize = '20px';
            
            const angle = (i / starCount) * 2 * Math.PI;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            star.style.left = x + 'px';
            star.style.top = y + 'px';
            star.style.animationDelay = (i * 0.1) + 's';
            
            document.body.appendChild(star);
            
            setTimeout(() => {
                if (star.parentNode) {
                    star.parentNode.removeChild(star);
                }
            }, 1500 + (i * 100));
        }
    }

    updateStatsDisplay() {
        if (this.stats && this.statsDisplay.accuracy) {
            const currentStats = this.stats.getCurrentStats();
            this.statsDisplay.accuracy.textContent = currentStats.accuracy;
            this.statsDisplay.resilience.textContent = currentStats.resilience;
            this.statsDisplay.speed.textContent = currentStats.speed;
            this.statsDisplay.variety.textContent = currentStats.variety;
            this.statsDisplay.questions.textContent = this.stats.totalQuestions;
        }
    }

    destroy() {
        this.clearInactivityTimer();
        this.clearKeyboardTimer();
        
        if (this.statsUpdateInterval) {
            clearInterval(this.statsUpdateInterval);
        }
        
        if (window.AudioSystem) {
            window.AudioSystem.stopAllAudio();
        }
        
        if (this.stats) {
            this.stats.destroy();
        }
        
        this.rainbow.reset();
        this.bear.reset();
        this.diceRenderer.reset();
        
        if (window.ButtonBar) {
            window.ButtonBar.destroy();
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎲 DOM loaded, creating TwoDiceGameController');
    window.twoDiceGame = new TwoDiceGameController();
});

// Clean up resources when page is unloaded
window.addEventListener('beforeunload', () => {
    if (window.twoDiceGame) {
        window.twoDiceGame.destroy();
    }
});
