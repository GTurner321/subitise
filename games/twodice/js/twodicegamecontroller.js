class TwoDiceGameController {
    constructor() {
        // Initialize components in proper order
        this.diceRenderer = new DiceRenderer();
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        this.stats = new TwoDiceStats(); // Initialize stats tracking
        
        // NEW: Level-based difficulty system
        this.levelController = new LevelBasedDiceController();
        
        // Game state
        this.questionsCompleted = 0;
        this.gameComplete = false;
        
        // Current question state - will be set by level controller
        this.currentQuestion = null;
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
        
        // NEW: Level display elements
        this.levelDisplay = document.getElementById('levelDisplay');
        this.roundProgress = document.getElementById('roundProgress');
        
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
            this.updateLevelDisplay(); // NEW: Update level info
        }, 1000);
        
        // Initialize in proper order
        this.initializeEventListeners();
        this.setupVisibilityHandling();
        this.waitForSystemsAndInitialize();
    }

    /**
     * Wait for both ButtonBar AND proper game area setup
     */
    waitForSystemsAndInitialize() {
        console.log('🎲 Checking system readiness...');
        
        // Check if ButtonBar is available and functional
        const buttonBarReady = window.ButtonBar && typeof window.ButtonBar.create === 'function';
        
        // Check if game area containers exist
        const gameAreaReady = this.gameArea && this.leftSide && this.rightSide && this.sumRow;
        
        if (buttonBarReady && gameAreaReady) {
            console.log('🎲 All systems ready, proceeding with initialization');
            this.buttonBarReady = true;
            this.gameAreaReady = true;
            
            // Create buttons first - this will trigger game area margin/sizing changes
            this.createButtons();
            
            // Set up ButtonBar coordination for CSS custom properties
            this.setupButtonBarCoordination();
            
            // Wait for ButtonBar to fully coordinate with game area
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
        // Register with ButtonBar to be notified of dimension changes
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
        
        // Force a reflow to ensure we get accurate dimensions
        this.gameArea.offsetHeight;
        
        // Get the actual game area dimensions after ButtonBar has set them
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        
        // Validate that we have reasonable dimensions
        if (gameAreaRect.width < 100 || gameAreaRect.height < 100) {
            console.warn('⚠️ Game area dimensions seem too small, retrying...', gameAreaRect);
            setTimeout(() => {
                this.updateGameAreaDimensions();
            }, 100);
            return;
        }
        
        // CRITICAL FIX: Update CSS custom property with actual game area width in pixels
        document.documentElement.style.setProperty('--game-area-width', `${gameAreaRect.width}px`);
        
        console.log('📏 Game area dimensions updated and CSS custom property set:', gameAreaRect.width, 'px');
        
        // Force a style recalculation for all elements using CSS custom properties
        this.forceStyleRecalculation();
    }
    
    /**
     * Force recalculation of styles for elements that depend on --game-area-width
     */
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
                // Force recalculation by temporarily changing and restoring a property
                const originalDisplay = element.style.display;
                element.style.display = 'none';
                element.offsetHeight; // Trigger reflow
                element.style.display = originalDisplay;
            }
        });
        
        console.log('🔄 Forced style recalculation for CSS custom property dependent elements');
    }

    initializeGame() {
        console.log('🎲 Starting game initialization with loading sequence');
        
        // Hide all elements initially (except ButtonBar)
        this.hideGameElements();
        
        // Wait for elements to be hidden, then start fade-in
        setTimeout(() => {
            console.log('🎲 Starting fade-in sequence');
            this.showGameElements();
            this.isLoading = false;
            this.initializationComplete = true;
            
            // Start the first question after fade-in completes
            setTimeout(() => {
                this.startNewQuestion();
            }, 1000);
            
        }, 500);
    }

    hideGameElements() {
        // Hide game area and sum row (but NOT button bar)
        if (this.gameArea) this.gameArea.classList.remove('loaded');
        if (this.sumRow) this.sumRow.classList.remove('loaded');
    }

    showGameElements() {
        // Fade in game area and sum row (ButtonBar handles its own timing)
        if (this.gameArea) {
            this.gameArea.classList.add('loaded');
        }
        
        if (this.sumRow) {
            this.sumRow.classList.add('loaded');
        }
        
        console.log('🎲 Game elements faded in');
    }

    createButtons() {
        // Create button colors and numbers arrays for 1-12
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', 
            '#eb4d4b', '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894',
            '#00cec9', '#e17055'
        ];
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        
        // Use the universal button bar system
        if (window.ButtonBar && this.buttonBarReady) {
            window.ButtonBar.create(
                12,                    // number of buttons (1-12 for dice sums)
                6.7,                   // button width as % of button panel width (12 × 6.7% + 11 × 1.5% = 96.9%)
                6.7,                   // button height as % of button panel width (square buttons)
                colors,                // array of button colors
                numbers,               // array of button numbers/labels
                (selectedNumber, buttonElement) => {  // click handler
                    if (this.buttonsDisabled || !this.initializationComplete) return;
                    
                    // Clear inactivity timer on user interaction
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
        // Only start timer if tab is visible, game is initialized, and hint hasn't been given
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
        
        // Mark that hint has been given for this question
        this.hintGiven = true;
        
        // Determine which hint to give based on current flashing box
        let hintText = '';
        if (!this.leftFilled) {
            hintText = 'Count the dots on the left dice';
        } else if (!this.rightFilled) {
            hintText = 'Count the dots on the right dice';
        } else if (!this.totalFilled) {
            hintText = 'Add the two dice numbers together';
        }
        
        if (hintText) {
            this.speakText(hintText);
        }
    }

    initializeEventListeners() {
        this.playAgainBtn.addEventListener('click', () => {
            this.startNewGame();
        });

        // Add keyboard event listener
        document.addEventListener('keydown', (e) => {
            if (this.buttonsDisabled || this.gameComplete || !this.initializationComplete) {
                return;
            }
            
            // Handle number keys 0-9
            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                
                // Clear inactivity timer on user interaction
                this.clearInactivityTimer();
                this.startInactivityTimer();
                
                const digit = parseInt(e.key);
                this.handleKeyboardDigit(digit);
            }
        });

        // Setup cleanup when user navigates away
        window.addEventListener('beforeunload', () => {
            this.destroy();
        });
    }

    handleKeyboardDigit(digit) {
        // Handle two-digit numbers 10, 11, 12
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
            // Check if 1 is a valid answer first
            if (this.isDigitValidAnswer(1)) {
                this.handleNumberClick(1, null);
                return;
            }
            
            // If 1 is not valid but 10, 11, or 12 could be valid, wait for second digit
            if (this.isDigitValidAnswer(10) || this.isDigitValidAnswer(11) || this.isDigitValidAnswer(12)) {
                this.keyboardBuffer = '1';
                this.keyboardTimer = setTimeout(() => {
                    this.clearKeyboardTimer();
                    this.handleNumberClick(1, null);
                }, this.keyboardWaitDuration);
                return;
            }
        }
        
        // Handle normal single digit input
        if (digit >= 1 && digit <= 9) {
            this.handleNumberClick(digit, null);
        }
    }

    isDigitValidAnswer(number) {
        if (!this.currentQuestion) return false;
        
        if (!this.leftFilled && number === this.currentQuestion.leftValue) return true;
        if (!this.rightFilled && number === this.currentQuestion.rightValue) return true;
        if (!this.totalFilled && number === this.currentQuestion.targetSum) return true;
        return false;
    }

    startNewGame() {
        this.questionsCompleted = 0;
        this.gameComplete = false;
        this.clearInactivityTimer();
        this.clearKeyboardTimer();
        this.resetBoxState();
        
        // NEW: Reset level controller for new game
        this.levelController = new LevelBasedDiceController();
        
        this.rainbow.reset();
        this.bear.reset();
        this.diceRenderer.reset();
        this.modal.classList.add('hidden');
        this.hideAllInputBoxes();
        
        // Keep initialization flags - systems should stay ready
        this.initializationComplete = true;
        
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

    // NEW: Level-based question generation
    async startNewQuestion() {
        if (this.gameComplete || !this.initializationComplete) {
            return;
        }

        this.resetBoxState();
        this.hideAllInputBoxes();

        // Reset hint tracking for new question
        this.hintGiven = false;

        // NEW: Generate question using level controller
        try {
            this.currentQuestion = this.levelController.generateNextQuestion();
            console.log(`🎯 Generated Level ${this.currentQuestion.level} question:`, this.currentQuestion);
        } catch (error) {
            console.error('Error generating question:', error);
            // Fallback to starting new round
            this.levelController.startNewRound();
            this.currentQuestion = this.levelController.generateNextQuestion();
        }

        console.log(`Starting question ${this.questionsCompleted + 1} - Level ${this.currentQuestion.level}`);
        
        this.resetButtonStates();
        this.giveStartingInstruction();
        
        // Disable buttons during dice roll
        this.buttonsDisabled = true;
        if (window.ButtonBar) {
            window.ButtonBar.setButtonsEnabled(false);
        }
        
        try {
            // NEW: Roll dice with controlled outcome
            const result = await this.diceRenderer.rollControlledDice(this.currentQuestion);
            
            console.log(`🎲 Controlled dice result:`, result);
            
            // Verify the result matches our question
            if (result.left !== this.currentQuestion.leftValue || 
                result.right !== this.currentQuestion.rightValue) {
                console.warn('⚠️ Dice result doesn\'t match expected values!', {
                    expected: { left: this.currentQuestion.leftValue, right: this.currentQuestion.rightValue },
                    actual: result
                });
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
            console.error('Error rolling controlled dice:', error);
            // Fallback with current question values
            this.buttonsDisabled = false;
            if (window.ButtonBar) {
                window.ButtonBar.setButtonsEnabled(true);
            }
            this.showInputBoxes();
            this.startInactivityTimer();
            
            // Start question timer for stats tracking
            this.stats.startQuestionTimer();
        }
    }

    giveStartingInstruction() {
        if (!this.isTabVisible || !this.initializationComplete) return;
        
        setTimeout(() => {
            const levelInfo = this.levelController.getCurrentLevelInfo();
            
            if (this.questionsCompleted === 0) {
                this.speakText(`Level ${levelInfo.level.slice(1)} - ${levelInfo.name}. Watch the dice roll and complete the three numbers in the addition sum.`);
            } else if (this.questionsCompleted === 1) {
                this.speakText('Try again and complete the sum');
            } else {
                this.speakText('Complete the sum');
            }
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

    // MODIFIED: Enhanced answer handling with level progression
    handleNumberClick(selectedNumber, buttonElement) {
        this.clearKeyboardTimer();
        
        let correctAnswer = false;
        
        if (!this.leftFilled && selectedNumber === this.currentQuestion.leftValue) {
            this.fillBox('left', selectedNumber, buttonElement);
            correctAnswer = true;
        } else if (!this.rightFilled && selectedNumber === this.currentQuestion.rightValue) {
            this.fillBox('right', selectedNumber, buttonElement);
            correctAnswer = true;
        } else if (!this.totalFilled && selectedNumber === this.currentQuestion.targetSum) {
            this.fillBox('total', selectedNumber, buttonElement);
            correctAnswer = true;
        }
        
        // Record stats for this question attempt
        if (correctAnswer) {
            // Check if this is the first attempt on this question
            const isFirstAttempt = !this.hasAttemptedAnswer();
            this.stats.recordQuestionAttempt(isFirstAttempt);
            
            // NEW: Handle level progression
            this.levelController.handleCorrectAnswer(isFirstAttempt);
            
            this.checkQuestionCompletion();
        } else {
            // This is an incorrect answer, so definitely not first attempt success
            this.stats.recordQuestionAttempt(false);
            
            // NEW: Handle level progression for incorrect answers
            this.levelController.handleIncorrectAnswer();
            
            this.handleIncorrectAnswer(buttonElement, selectedNumber);
        }
    }

    fillBox(boxType, selectedNumber, buttonElement) {
        // Find button element if not provided (for keyboard input)
        if (!buttonElement && window.ButtonBar) {
            buttonElement = window.ButtonBar.findButtonByNumber(selectedNumber);
        }
        
        // Flash green on correct answer
        if (buttonElement && window.ButtonBar) {
            window.ButtonBar.animateButton(buttonElement, 'correct');
        }

        this.playCompletionSound();

        // Create celebration stars
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

        // Check if this was the final box
        const boxesFilledBefore = [this.leftFilled, this.rightFilled, this.totalFilled].filter(Boolean).length - 1;
        const wasLastBox = boxesFilledBefore === 2;
        
        if (wasLastBox) {
            // Final box filled - disable buttons
            this.buttonsDisabled = true;
            if (window.ButtonBar) {
                window.ButtonBar.setButtonsEnabled(false);
            }
            console.log('🔒 Final box filled - buttons disabled');
        }

        // Update flashing if not the final box
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
            
            // NEW: Level-aware encouragement
            const levelInfo = this.levelController.getCurrentLevelInfo();
            const encouragements = [
                `Well done on Level ${levelInfo.level.slice(1)}!`, 
                `Excellent ${levelInfo.name} work!`, 
                `Perfect Level ${levelInfo.level.slice(1)} answer!`
            ];
            const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
            this.speakText(randomEncouragement);
            
            this.questionsCompleted++;
            
            if (this.rainbow.isComplete()) {
                // Record round completion for stats
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
        // Find button element if not provided (for keyboard input)
        if (!buttonElement && selectedNumber && window.ButtonBar) {
            buttonElement = window.ButtonBar.findButtonByNumber(selectedNumber);
        }
        
        this.clearInactivityTimer();
        
        this.playFailureSound();
        
        if (this.isTabVisible) {
            setTimeout(() => {
                this.speakText('Try again');
            }, 800);
        }
        
        this.buttonsDisabled = true;
        if (window.ButtonBar) {
            window.ButtonBar.setButtonsEnabled(false);
        }
        
        this.stopFlashing();
        
        // Flash red on the clicked button
        if (buttonElement && window.ButtonBar) {
            window.ButtonBar.animateButton(buttonElement, 'incorrect');
        }

        // Add cross overlay
        let crossOverlay = null;
        if (buttonElement && window.ButtonBar) {
            crossOverlay = window.ButtonBar.addCrossOverlay(buttonElement);
        }

        if (buttonElement) {
            buttonElement.dataset.attempted = 'true';
        }
        
        // Fade other buttons
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
        
        // NEW: Level-aware completion message
        const levelInfo = this.levelController.getCurrentLevelInfo();
        
        if (this.isTabVisible) {
            setTimeout(() => {
                this.speakText(`Fantastic! You completed the rainbow at Level ${levelInfo.level.slice(1)} - ${levelInfo.name}! Try again or return to the home page.`);
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

    // NEW: Enhanced stats display with level information
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

    // NEW: Update level display
    updateLevelDisplay() {
        if (!this.levelController) return;
        
        const levelInfo = this.levelController.getCurrentLevelInfo();
        
        // Update level display if element exists
        if (this.levelDisplay) {
            this.levelDisplay.textContent = `Level ${levelInfo.level.slice(1)}: ${levelInfo.name}`;
        }
        
        // Update round progress if element exists
        if (this.roundProgress) {
            this.roundProgress.textContent = `Question ${levelInfo.roundProgress}`;
        }
        
        // Update stats display with level info if available
        if (this.statsDisplay.level) {
            this.statsDisplay.level.textContent = levelInfo.level.slice(1);
        }
        
        // Log level changes
        const currentDisplayedLevel = this.levelDisplay?.dataset.currentLevel;
        if (currentDisplayedLevel !== levelInfo.level) {
            console.log(`🎯 Level display updated: ${levelInfo.level} - ${levelInfo.name}`);
            if (this.levelDisplay) {
                this.levelDisplay.dataset.currentLevel = levelInfo.level;
            }
        }
    }

    destroy() {
        this.clearInactivityTimer();
        this.clearKeyboardTimer();
        
        // Clear stats update interval
        if (this.statsUpdateInterval) {
            clearInterval(this.statsUpdateInterval);
        }
        
        if (window.AudioSystem) {
            window.AudioSystem.stopAllAudio();
        }
        
        // Cleanup stats tracking
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
