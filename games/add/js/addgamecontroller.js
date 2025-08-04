class AddGameController {
    constructor() {
        // Initialize components in proper order
        this.iconRenderer = new AddIconRenderer();
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        
        // Simplified level-based progression
        this.currentLevel = 1;
        this.highestLevelReached = 1;
        this.sumsCompleted = 0;
        this.gameComplete = false;
        
        // Track used sums for level 6 avoidance
        this.usedSumsInSession = new Set(); // Stores canonical addition strings
        
        // Inactivity timer for audio hints
        this.inactivityTimer = null;
        this.inactivityDuration = 20000; // 20 seconds
        this.hintGiven = false; // Track if hint has been given for current question
        this.isTabVisible = true; // Track tab visibility
        
        // Keyboard two-digit handling for "10"
        this.keyboardBuffer = '';
        this.keyboardTimer = null;
        this.keyboardWaitDuration = 4000; // 4 seconds to wait for second digit
        
        // Game state
        this.currentLeftCount = 0;
        this.currentRightCount = 0;
        this.currentAnswer = 0;
        this.buttonsDisabled = false;
        
        // Simplified box state - track which boxes are filled
        this.leftFilled = false;
        this.rightFilled = false;
        this.totalFilled = false;
        
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
        this.sumRow = document.getElementById('sumRow');
        this.totalInputBox = document.getElementById('totalInputBox');
        this.checkMark = document.getElementById('checkMark');
        this.leftSide = document.getElementById('leftSide'); // Icon placement area
        this.rightSide = document.getElementById('rightSide'); // Icon placement area
        this.leftPulseArea = document.getElementById('leftPulseArea'); // Pulse area
        this.rightPulseArea = document.getElementById('rightPulseArea'); // Pulse area
        this.gameArea = document.querySelector('.game-area');
        
        // Level definitions
        this.levels = {
            1: [[1,1], [1,2], [1,3], [2,2], [2,3], [2,1], [3,1], [3,2]],
            2: [[3,3], [1,4], [1,5], [2,4], [4,1], [5,1], [4,2]],
            3: [[3,4], [2,5], [1,6], [1,7], [4,3], [5,2], [6,1], [7,1]],
            4: [[1,9], [4,4], [2,6], [2,7], [3,5], [1,8], [9,1], [6,2], [7,2], [5,3], [8,1]],
            5: [[3,6], [4,5], [4,6], [3,7], [5,5], [2,8], [6,3], [5,4], [6,4], [7,3], [8,2]],
            6: [[2,3], [3,2], [3,3], [1,4], [1,5], [2,4], [3,4], [2,5], [1,6], [1,7], [1,8], [1,9], [4,4], [2,6], [2,7], [3,5], [2,8], [3,6], [4,5], [4,6], [3,7], [5,5], [4,1], [5,1], [4,2], [4,3], [5,2], [6,1], [7,1], [8,1], [9,1], [6,2], [7,2], [5,3], [8,2], [6,3], [5,4], [6,4], [7,3]]
        };
        
        // Initialize in proper order
        this.initializeEventListeners();
        this.setupVisibilityHandling();
        this.waitForSystemsAndInitialize();
    }

    /**
     * Wait for both ButtonBar AND proper game area setup
     */
    waitForSystemsAndInitialize() {
        console.log('🎮 Checking system readiness...');
        
        // Check if ButtonBar is available and functional
        const buttonBarReady = window.ButtonBar && typeof window.ButtonBar.create === 'function';
        
        // Check if game area containers exist
        const gameAreaReady = this.gameArea && this.leftSide && this.rightSide && this.sumRow;
        
        if (buttonBarReady && gameAreaReady) {
            console.log('🎮 All systems ready, proceeding with initialization');
            this.buttonBarReady = true;
            this.gameAreaReady = true;
            
            // Create buttons first - this will trigger game area margin/sizing changes
            this.createButtons();
            
            // Wait longer for ButtonBar to fully coordinate with game area
            setTimeout(() => {
                console.log('🎮 ButtonBar coordination complete, initializing game');
                this.initializeGame();
            }, 800); // Increased delay for complete coordination
        } else {
            console.log(`⏳ Waiting for systems... ButtonBar: ${buttonBarReady}, GameArea: ${gameAreaReady}`);
            setTimeout(() => {
                this.waitForSystemsAndInitialize();
            }, 100);
        }
    }

    initializeGame() {
        console.log('🎮 Starting game initialization with loading sequence');
        
        // Hide all elements initially (except ButtonBar - it handles its own timing)
        this.hideGameElements();
        
        // Wait for elements to be hidden, then start fade-in
        setTimeout(() => {
            console.log('🎮 Starting fade-in sequence');
            this.showGameElements();
            this.isLoading = false;
            this.initializationComplete = true;
            
            // Start the first question after fade-in completes
            setTimeout(() => {
                this.startNewQuestion();
            }, 1000); // Wait for fade-in to complete
            
        }, 500); // Shorter loading delay since ButtonBar is already visible
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
        
        console.log('🎮 Game elements faded in (ButtonBar handles its own timing)');
    }

    createButtons() {
        // Create button colors and numbers arrays
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', 
            '#eb4d4b', '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894'
        ];
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        
        // Use the universal button bar system
        if (window.ButtonBar && this.buttonBarReady) {
            window.ButtonBar.create(
                10,                    // number of buttons
                8,                     // button width as % of button panel width
                8,                     // button height as % of button panel width
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
            // Fallback: get existing buttons
            this.numberButtons = document.querySelectorAll('.number-btn');
            this.numberButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    if (this.buttonsDisabled || !this.initializationComplete) return;
                    
                    this.clearInactivityTimer();
                    this.startInactivityTimer();
                    
                    const selectedNumber = parseInt(e.target.dataset.number);
                    this.handleNumberClick(selectedNumber, e.target);
                });
            });
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
            hintText = 'Count the number of pictures on the left side';
        } else if (!this.rightFilled) {
            hintText = 'Count the number of pictures on the right side';
        } else if (!this.totalFilled) {
            hintText = 'Count the number of pictures in total';
        }
        
        if (hintText) {
            this.speakText(hintText);
        }
        
        // Don't restart the timer - hint is only given once per question
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
    }

    handleKeyboardDigit(digit) {
        // If we're waiting for a second digit and this is 0, check if buffer is "1"
        if (this.keyboardBuffer === '1' && digit === 0) {
            // Complete the "10" input
            this.clearKeyboardTimer();
            this.handleNumberClick(10, null);
            return;
        }
        
        // Clear any existing keyboard timer
        this.clearKeyboardTimer();
        
        // If digit is 1, check if it's a valid answer first
        if (digit === 1) {
            // If 1 is a valid answer, process it immediately
            if (this.isDigitValidAnswer(1)) {
                this.handleNumberClick(1, null);
                return;
            }
            
            // If 1 is NOT valid but 10 could be valid, wait for potential "0"
            if (this.isDigitValidAnswer(10)) {
                this.keyboardBuffer = '1';
                this.keyboardTimer = setTimeout(() => {
                    // Timeout - treat the "1" as an incorrect answer
                    this.clearKeyboardTimer();
                    this.handleNumberClick(1, null);
                }, this.keyboardWaitDuration);
                return;
            }
        }
        
        // Handle normal single digit input for all other digits
        this.handleNumberClick(digit, null);
    }

    // Check if a digit would be a valid answer for any current empty box
    isDigitValidAnswer(number) {
        if (!this.leftFilled && number === this.currentLeftCount) {
            return true;
        }
        if (!this.rightFilled && number === this.currentRightCount) {
            return true;
        }
        if (!this.totalFilled && number === this.currentAnswer) {
            return true;
        }
        return false;
    }

    startNewGame() {
        // Start at highest reached level, but clear used sums cache
        this.currentLevel = this.highestLevelReached;
        this.sumsCompleted = 0;
        this.gameComplete = false;
        this.usedSumsInSession.clear();
        this.clearInactivityTimer();
        this.clearKeyboardTimer();
        this.resetBoxState();
        
        this.rainbow.reset();
        this.bear.reset();
        this.iconRenderer.reset();
        this.modal.classList.add('hidden');
        this.hideAllInputBoxes();
        
        // Keep initialization flags - systems should stay ready
        // Don't reset these flags on new game
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
        this.stopFlashing(); // Clear any existing interval
        
        const flashElements = () => {
            // Flash only the first uncompleted box from left to right
            if (!this.leftFilled) {
                this.leftPulseArea.classList.add('area-flash');
                this.leftInputBox.classList.add('box-flash');
            } else if (!this.rightFilled) {
                this.rightPulseArea.classList.add('area-flash');
                this.rightInputBox.classList.add('box-flash');
            } else if (!this.totalFilled) {
                // Flash both areas when total is the only remaining box
                this.leftPulseArea.classList.add('area-flash');
                this.rightPulseArea.classList.add('area-flash');
                this.totalInputBox.classList.add('box-flash');
            }
            
            // Remove flash classes after flash duration
            setTimeout(() => {
                this.leftPulseArea.classList.remove('area-flash');
                this.rightPulseArea.classList.remove('area-flash');
                this.leftInputBox.classList.remove('box-flash');
                this.rightInputBox.classList.remove('box-flash');
                this.totalInputBox.classList.remove('box-flash');
            }, 1000);
        };
        
        // Start flashing after 5 seconds
        this.flashingTimeout = setTimeout(() => {
            flashElements();
            
            // Set up interval to repeat every 5 seconds
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
        
        // Remove any existing flash classes
        this.leftPulseArea.classList.remove('area-flash');
        this.rightPulseArea.classList.remove('area-flash');
        this.leftInputBox.classList.remove('box-flash');
        this.rightInputBox.classList.remove('box-flash');
        this.totalInputBox.classList.remove('box-flash');
    }

    startNewQuestion() {
        if (this.gameComplete || !this.initializationComplete) {
            return;
        }

        this.resetBoxState();
        this.hideAllInputBoxes();

        // Reset hint tracking for new question
        this.hintGiven = false;

        // Generate a sum based on current level
        const addition = this.generateAdditionForCurrentLevel();
        
        // Set current game state
        this.currentLeftCount = addition.left;
        this.currentRightCount = addition.right;
        this.currentAnswer = addition.sum;
        
        console.log(`Question: ${addition.left} + ${addition.right} = ${addition.sum}, Level: ${this.currentLevel}`);
        
        // Render the icons - renderer will handle timing coordination
        this.iconRenderer.renderIcons(addition.left, addition.right);
        
        // Reset button states and show input boxes
        this.resetButtonStates();
        this.showInputBoxes();
        
        // Give audio instruction based on sum number
        this.giveStartingSumInstruction();
        
        // Start inactivity timer
        this.startInactivityTimer();
    }

    generateAdditionForCurrentLevel() {
        const levelSums = this.levels[this.currentLevel];
        let selectedSum;
        let attempts = 0;
        const maxAttempts = 100;
        
        do {
            // Randomly select from current level's sums
            selectedSum = levelSums[Math.floor(Math.random() * levelSums.length)];
            attempts++;
            
            // For level 6, check if this sum has been used before
            if (this.currentLevel === 6) {
                const canonical = this.getCanonicalAddition(selectedSum[0], selectedSum[1]);
                if (!this.usedSumsInSession.has(canonical)) {
                    break; // Found an unused sum
                }
                // If all sums have been used, allow repetition (break the loop)
                if (attempts >= maxAttempts) {
                    break;
                }
            } else {
                break; // For levels 1-5, any random selection is fine
            }
        } while (attempts < maxAttempts);
        
        // Add to used sums if level 6
        if (this.currentLevel === 6) {
            const canonical = this.getCanonicalAddition(selectedSum[0], selectedSum[1]);
            this.usedSumsInSession.add(canonical);
        }
        
        return {
            left: selectedSum[0],
            right: selectedSum[1],
            sum: selectedSum[0] + selectedSum[1]
        };
    }

    getCanonicalAddition(left, right) {
        const smaller = Math.min(left, right);
        const larger = Math.max(left, right);
        return `${smaller}+${larger}`;
    }

    giveStartingSumInstruction() {
        // Don't give audio during loading or if not initialized
        if (this.isLoading || !this.isTabVisible || !this.initializationComplete) return;
        
        setTimeout(() => {
            if (this.sumsCompleted === 0) {
                // First sum
                this.speakText('Complete the three numbers in the addition sum.');
            } else if (this.sumsCompleted === 1) {
                // Second sum
                this.speakText('Try again and complete the sum');
            } else {
                // Third sum onwards
                this.speakText('Complete the sum');
            }
        }, 1500); // Extra delay to ensure fade-in is complete
    }

    hideAllInputBoxes() {
        this.checkMark.classList.remove('visible');
        
        // Clear box contents
        this.leftInputBox.textContent = '';
        this.rightInputBox.textContent = '';
        this.totalInputBox.textContent = '';
        
        // Reset box states
        this.leftInputBox.classList.remove('flashing', 'filled');
        this.rightInputBox.classList.remove('flashing', 'filled');
        this.totalInputBox.classList.remove('flashing', 'filled');
    }

    showInputBoxes() {
        // Show only the first uncompleted box as actively flashing
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
        // Clear any pending keyboard timer since we're processing an answer
        this.clearKeyboardTimer();
        
        let correctAnswer = false;
        
        // Check boxes in left-to-right priority order for filling
        if (!this.leftFilled && selectedNumber === this.currentLeftCount) {
            this.fillBox('left', selectedNumber, buttonElement);
            correctAnswer = true;
        } else if (!this.rightFilled && selectedNumber === this.currentRightCount) {
            this.fillBox('right', selectedNumber, buttonElement);
            correctAnswer = true;
        } else if (!this.totalFilled && selectedNumber === this.currentAnswer) {
            this.fillBox('total', selectedNumber, buttonElement);
            correctAnswer = true;
        }
        
        if (correctAnswer) {
            this.checkQuestionCompletion();
        } else {
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

        // Play completion sound
        this.playCompletionSound();

        // Create celebration stars around the button (works for keyboard too now)
        if (buttonElement) {
            this.createCelebrationStars(buttonElement);
        }

        // Fill the appropriate box
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

        // Update flashing to show next priority box
        this.updateFlashingBoxes();
    }

    updateFlashingBoxes() {
        // Remove flashing from all boxes first
        this.leftInputBox.classList.remove('flashing');
        this.rightInputBox.classList.remove('flashing');
        this.totalInputBox.classList.remove('flashing');
        
        // Add flashing to the first uncompleted box (left-to-right priority)
        if (!this.leftFilled) {
            this.leftInputBox.classList.add('flashing');
        } else if (!this.rightFilled) {
            this.rightInputBox.classList.add('flashing');
        } else if (!this.totalFilled) {
            this.totalInputBox.classList.add('flashing');
        }
        
        // Restart flashing for the new priority box
        this.startFlashing();
    }

    checkQuestionCompletion() {
        if (this.leftFilled && this.rightFilled && this.totalFilled) {
            // All boxes completed - clear inactivity timer
            this.clearInactivityTimer();
            this.stopFlashing();
            
            // Show check mark
            this.checkMark.classList.add('visible');
            
            // Check if this was the first attempt for the entire question
            const wasFirstAttempt = !this.hasAttemptedAnswer();
            
            // Handle level progression BEFORE incrementing sumsCompleted
            this.handleLevelProgression(wasFirstAttempt);
            
            // Add rainbow piece
            const pieces = this.rainbow.addPiece();
            console.log(`Rainbow pieces: ${pieces}, wasFirstAttempt: ${wasFirstAttempt}, new level: ${this.currentLevel}`);
            
            // Give completion audio feedback
            if (wasFirstAttempt) {
                const encouragements = ['Well done!', 'Excellent!', 'Perfect!'];
                const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
                this.speakText(randomEncouragement);
            }
            
            this.sumsCompleted++;
            
            // Check if game is complete (10 sums total)
            if (this.rainbow.isComplete()) {
                setTimeout(() => {
                    this.completeGame();
                }, 3000);
                return;
            }

            // Start fade out after 2 seconds, then new question
            setTimeout(() => {
                this.fadeOutQuestion();
            }, 2000);
        }
    }

    handleLevelProgression(wasFirstAttempt) {
        if (wasFirstAttempt) {
            // Success - advance to next level (unless already at level 6)
            if (this.currentLevel < 6) {
                this.currentLevel++;
                console.log(`Advanced to level ${this.currentLevel}`);
            }
            // Update highest level reached
            if (this.currentLevel > this.highestLevelReached) {
                this.highestLevelReached = this.currentLevel;
            }
        } else {
            // Failure - handle level regression
            if (this.currentLevel <= 3) {
                // Levels 1-3: Special rules
                if (this.currentLevel === 1) {
                    // Stay at level 1
                    console.log('Failed at level 1, staying at level 1');
                } else if (this.currentLevel === 2) {
                    // Return to level 1
                    this.currentLevel = 1;
                    console.log('Failed at level 2, returning to level 1');
                } else if (this.currentLevel === 3) {
                    // Return to level 2
                    this.currentLevel = 2;
                    console.log('Failed at level 3, returning to level 2');
                }
            } else {
                // Levels 4-6: Return to level 3
                this.currentLevel = 3;
                console.log('Failed at level 4+, returning to level 3');
            }
        }
    }

    handleIncorrectAnswer(buttonElement, selectedNumber) {
        // Find button element if not provided (for keyboard input)
        if (!buttonElement && selectedNumber && window.ButtonBar) {
            buttonElement = window.ButtonBar.findButtonByNumber(selectedNumber);
            console.log(`🎯 Found button for keyboard input: ${selectedNumber}`, buttonElement);
        }
        
        // Clear inactivity timer and give immediate hint
        this.clearInactivityTimer();
        
        // Play failure sound
        this.playFailureSound();
        
        // Give immediate "Try again" message for wrong answer
        if (this.isTabVisible) {
            setTimeout(() => {
                this.speakText('Try again');
            }, 800); // Give hint after error animation
        }
        
        // Disable buttons during error handling
        this.buttonsDisabled = true;
        if (window.ButtonBar) {
            window.ButtonBar.setButtonsEnabled(false);
        }
        
        // Stop flashing during error handling
        this.stopFlashing();
        
        // Flash red on the clicked button
        if (buttonElement && window.ButtonBar) {
            window.ButtonBar.animateButton(buttonElement, 'incorrect');
        }

        // Add crimson cross overlay to the incorrect button
        let crossOverlay = null;
        if (buttonElement && window.ButtonBar) {
            crossOverlay = window.ButtonBar.addCrossOverlay(buttonElement);
        }

        // Mark that an attempt was made
        if (buttonElement) {
            buttonElement.dataset.attempted = 'true';
        }
        
        // Fade out all other buttons
        this.fadeOtherButtons(buttonElement);

        // After fade out completes, wait, then fade back in
        setTimeout(() => {
            setTimeout(() => {
                this.fadeInAllButtons();
                
                // Start fading out the cross
                if (crossOverlay && crossOverlay.parentNode) {
                    crossOverlay.style.transition = 'opacity 700ms ease-out';
                    crossOverlay.style.opacity = '0';
                }
                
                // Clean up after fade in completes
                setTimeout(() => {
                    // Remove the cross overlay
                    if (buttonElement && window.ButtonBar) {
                        window.ButtonBar.removeCrossOverlay(buttonElement);
                    }
                }, 700);
            }, 700);
            
            // Re-enable buttons and restart inactivity timer
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
            
            // Clean up transition styles after animation
            setTimeout(() => {
                window.ButtonBar.buttons.forEach(btn => {
                    btn.style.transition = '';
                });
            }, 700);
        }
    }

    fadeOutQuestion() {
        // Add fade out class to icons only
        const gameElements = [...this.iconRenderer.currentIcons];
        
        gameElements.forEach(element => {
            if (element) {
                element.classList.add('fade-out');
            }
        });
        
        // Start new question after fade out completes
        setTimeout(() => {
            this.startNewQuestion();
            
            // Remove fade out classes and add fade in to new icons
            setTimeout(() => {
                const newElements = [...this.iconRenderer.currentIcons];
                
                newElements.forEach(element => {
                    if (element) {
                        element.classList.remove('fade-out');
                        element.classList.add('fade-in');
                    }
                });
                
                // Clean up fade in classes
                setTimeout(() => {
                    newElements.forEach(element => {
                        if (element) {
                            element.classList.remove('fade-in');
                        }
                    });
                }, 1000);
            }, 100);
        }, 1000);
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
                
                // Remove any existing cross overlays
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
        
        // Start bear celebration when modal opens
        this.bear.startCelebration();
        
        // Give completion audio message
        if (this.isTabVisible) {
            setTimeout(() => {
                this.speakText('Well done! You have completed all ten sums! Try again or return to the home page.');
            }, 1000);
        }
    }

    createCelebrationStars(buttonElement) {
        if (!buttonElement) return;
        
        const buttonRect = buttonElement.getBoundingClientRect();
        const centerX = buttonRect.left + buttonRect.width / 2;
        const centerY = buttonRect.top + buttonRect.height / 2;
        
        const starCount = 5; // Number of stars to create
        const radius = 60; // Distance from button center
        
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.innerHTML = '⭐'; // Star emoji
            star.className = 'completion-star';
            star.style.fontSize = '20px';
            
            // Calculate position around the button in a circle
            const angle = (i / starCount) * 2 * Math.PI;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            star.style.left = x + 'px';
            star.style.top = y + 'px';
            
            // Add random delay to make stars appear slightly staggered
            star.style.animationDelay = (i * 0.1) + 's';
            
            document.body.appendChild(star);
            
            // Remove star after animation completes
            setTimeout(() => {
                if (star.parentNode) {
                    star.parentNode.removeChild(star);
                }
            }, 1500 + (i * 100)); // 1.5s animation + stagger delay
        }
    }

    destroy() {
        // Clean up audio and timers
        this.clearInactivityTimer();
        this.clearKeyboardTimer();
        
        if (window.AudioSystem) {
            window.AudioSystem.stopAllAudio();
        }
        
        // Clean up other resources
        this.rainbow.reset();
        this.bear.reset();
        this.iconRenderer.reset();
        
        // Clean up button bar
        if (window.ButtonBar) {
            window.ButtonBar.destroy();
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 DOM loaded, creating AddGameController');
    window.addGame = new AddGameController();
});

// Clean up resources when page is about to unload
window.addEventListener('beforeunload', () => {
    if (window.addGame) {
        window.addGame.destroy();
    }
});
