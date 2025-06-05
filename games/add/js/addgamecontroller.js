class AddGameController {
    constructor() {
        this.iconRenderer = new AddIconRenderer();
        this.rainbow = new Rainbow();
        this.bear = new Bear(); // Add this line
        
        // Game state
        this.currentDifficulty = CONFIG.DIFFICULTY.EASY;
        this.currentAnswer = 0;
        this.currentLeftCount = 0;
        this.currentRightCount = 0;
        this.previousSum = 0;
        this.previousAddition = null;
        this.correctStreak = 0;
        this.wrongStreak = 0;
        this.questionsInLevel = 0;
        this.gameComplete = false;
        this.hasSeenHigherNumbers = false;
        this.buttonsDisabled = false;
        
        // Step-by-step game state
        this.gameStep = 'left'; // 'left', 'right', 'total'
        this.leftAnswered = false;
        this.rightAnswered = false;
        this.totalAnswered = false; // Track if total was answered early
        
        // Flashing intervals
        this.flashingInterval = null;
        
        // DOM elements
        this.numberButtons = document.querySelectorAll('.number-btn');
        this.modal = document.getElementById('gameModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.leftInputBox = document.getElementById('leftInputBox');
        this.rightInputBox = document.getElementById('rightInputBox');
        this.sumRow = document.getElementById('sumRow');
        this.totalInputBox = document.getElementById('totalInputBox');
        this.checkMark = document.getElementById('checkMark');
        this.leftSide = document.getElementById('leftSide');
        this.rightSide = document.getElementById('rightSide');
        
        this.initializeEventListeners();
        this.startNewQuestion();
    }

    initializeEventListeners() {
        this.numberButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.buttonsDisabled) {
                    return;
                }
                
                const selectedNumber = parseInt(e.target.dataset.number);
                this.handleNumberClick(selectedNumber, e.target);
            });
        });

        this.playAgainBtn.addEventListener('click', () => {
            this.startNewGame();
        });

        // Add keyboard event listener
        document.addEventListener('keydown', (e) => {
            if (this.buttonsDisabled || this.gameComplete) {
                return;
            }
            
            // Handle number keys 1-9
            if (e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                const selectedNumber = parseInt(e.key);
                // Find the corresponding button to pass to handleNumberClick
                const button = Array.from(this.numberButtons).find(btn => 
                    parseInt(btn.dataset.number) === selectedNumber
                );
                if (button) {
                    this.handleNumberClick(selectedNumber, button);
                }
            }
        });
    }

    startNewGame() {
        this.correctStreak = 0;
        this.wrongStreak = 0;
        this.questionsInLevel = 0;
        this.gameComplete = false;
        this.previousSum = 0;
        this.previousAddition = null;
        this.hasSeenHigherNumbers = false;
        this.buttonsDisabled = false;
        this.resetStepState();
        
        this.rainbow.reset();
        this.bear.reset(); // Add this line to stop bears
        this.iconRenderer.reset();
        this.modal.classList.add('hidden');
        this.hideAllInputBoxes();
        this.startNewQuestion();
    }

    resetStepState() {
        this.gameStep = 'left';
        this.leftAnswered = false;
        this.rightAnswered = false;
        this.totalAnswered = false;
        this.stopFlashing();
    }

    startFlashing() {
        this.stopFlashing(); // Clear any existing interval
        
        const flashElements = () => {
            // Remove existing flash classes
            this.leftSide.classList.remove('area-flash');
            this.rightSide.classList.remove('area-flash');
            this.leftInputBox.classList.remove('box-flash');
            this.rightInputBox.classList.remove('box-flash');
            this.totalInputBox.classList.remove('box-flash');
            
            setTimeout(() => {
                // Determine what should flash based on current step
                if (this.gameStep === 'left' && !this.leftAnswered) {
                    this.leftSide.classList.add('area-flash');
                    this.leftInputBox.classList.add('box-flash');
                } else if (this.gameStep === 'right' && !this.rightAnswered) {
                    this.rightSide.classList.add('area-flash');
                    this.rightInputBox.classList.add('box-flash');
                } else if (this.gameStep === 'total' && !this.totalAnswered) {
                    this.leftSide.classList.add('area-flash');
                    this.rightSide.classList.add('area-flash');
                    this.totalInputBox.classList.add('box-flash');
                }
                
                // Remove flash classes after flash duration
                setTimeout(() => {
                    this.leftSide.classList.remove('area-flash');
                    this.rightSide.classList.remove('area-flash');
                    this.leftInputBox.classList.remove('box-flash');
                    this.rightInputBox.classList.remove('box-flash');
                    this.totalInputBox.classList.remove('box-flash');
                }, 200); // Flash duration
            }, 50);
        };
        
        // Flash twice immediately
        flashElements();
        setTimeout(flashElements, 300);
        
        // Set up interval to repeat every 5 seconds
        this.flashingInterval = setInterval(() => {
            flashElements();
            setTimeout(flashElements, 300);
        }, 5000);
    }

    stopFlashing() {
        if (this.flashingInterval) {
            clearInterval(this.flashingInterval);
            this.flashingInterval = null;
        }
        
        // Remove any existing flash classes
        this.leftSide.classList.remove('area-flash');
        this.rightSide.classList.remove('area-flash');
        this.leftInputBox.classList.remove('box-flash');
        this.rightInputBox.classList.remove('box-flash');
        this.totalInputBox.classList.remove('box-flash');
    }

    startNewQuestion() {
        if (this.gameComplete) {
            return;
        }

        this.resetStepState();
        this.hideAllInputBoxes();

        // Check if we need to force higher numbers
        let forceHigherNumbers = false;
        if (this.correctStreak === 2 && !this.hasSeenHigherNumbers) {
            forceHigherNumbers = true;
        }

        let leftCount, rightCount, sum, currentAddition;
        let attempts = 0;
        const maxAttempts = 100;
        
        do {
            if (forceHigherNumbers) {
                const addition = this.generateForcedHigherAddition();
                leftCount = addition.left;
                rightCount = addition.right;
                sum = addition.sum;
            } else {
                const addition = this.generateAdditionForDifficulty();
                leftCount = addition.left;
                rightCount = addition.right;
                sum = addition.sum;
            }
            
            currentAddition = this.getCanonicalAddition(leftCount, rightCount);
            attempts++;
            
        } while (
            (sum === this.previousSum || 
             currentAddition === this.previousAddition ||
             this.isConsecutiveHighNumbers(sum, this.previousSum)) && 
            attempts < maxAttempts
        );
        
        // Update tracking variables
        this.previousSum = sum;
        this.previousAddition = currentAddition;
        
        // Check if this question contains higher numbers for current level
        this.checkForHigherNumbers(sum);
        
        // Set current game state
        this.currentLeftCount = leftCount;
        this.currentRightCount = rightCount;
        this.currentAnswer = sum;
        
        console.log(`Question: ${leftCount} + ${rightCount} = ${sum}, Level: ${this.currentDifficulty.name}`);
        
        // Render the icons (avoiding sum row area)
        this.iconRenderer.renderIcons(leftCount, rightCount);
        
        // Reset button states and immediately show flashing left box
        this.resetButtonStates();
        this.showLeftInputBox(); // No delay - immediate
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

    showLeftInputBox() {
        this.gameStep = 'left';
        this.leftInputBox.classList.add('flashing');
        this.startFlashing();
    }

    showRightInputBox() {
        this.gameStep = 'right';
        this.leftInputBox.classList.remove('flashing');
        this.leftInputBox.classList.add('filled');
        
        this.rightInputBox.classList.add('flashing');
        this.startFlashing();
    }

    showTotalInputBox() {
        this.gameStep = 'total';
        this.rightInputBox.classList.remove('flashing');
        this.rightInputBox.classList.add('filled');
        
        this.totalInputBox.classList.add('flashing');
        this.startFlashing();
    }

    handleNumberClick(selectedNumber, buttonElement) {
        // Check if this could be the total answer (even if not the current step)
        if (!this.totalAnswered && selectedNumber === this.currentAnswer) {
            if (this.gameStep !== 'total') {
                // User entered total early - accept it
                this.handleEarlyTotalAnswer(buttonElement, selectedNumber);
                return;
            }
        }
        
        let isCorrect = false;
        
        switch (this.gameStep) {
            case 'left':
                isCorrect = selectedNumber === this.currentLeftCount;
                if (isCorrect) {
                    this.handleCorrectStepAnswer(buttonElement, selectedNumber, 'left');
                } else {
                    this.handleIncorrectAnswer(buttonElement);
                }
                break;
                
            case 'right':
                isCorrect = selectedNumber === this.currentRightCount;
                if (isCorrect) {
                    this.handleCorrectStepAnswer(buttonElement, selectedNumber, 'right');
                } else {
                    this.handleIncorrectAnswer(buttonElement);
                }
                break;
                
            case 'total':
                isCorrect = selectedNumber === this.currentAnswer;
                if (isCorrect) {
                    this.handleCorrectFinalAnswer(buttonElement, selectedNumber);
                } else {
                    this.handleIncorrectAnswer(buttonElement);
                }
                break;
        }
    }

    handleEarlyTotalAnswer(buttonElement, selectedNumber) {
        // Flash green on correct answer
        buttonElement.classList.add('correct');
        setTimeout(() => {
            buttonElement.classList.remove('correct');
        }, CONFIG.FLASH_DURATION);

        // Fill the total box
        this.totalInputBox.textContent = selectedNumber;
        this.totalInputBox.classList.remove('flashing');
        this.totalInputBox.classList.add('filled');
        this.totalAnswered = true;

        // Continue with the current step (left or right)
        // The flashing will automatically adjust since totalAnswered is now true
    }

    handleCorrectStepAnswer(buttonElement, selectedNumber, step) {
        // Flash green on correct answer
        buttonElement.classList.add('correct');
        setTimeout(() => {
            buttonElement.classList.remove('correct');
        }, CONFIG.FLASH_DURATION);

        // Fill the box with the number and immediately move to next step
        if (step === 'left') {
            this.leftInputBox.textContent = selectedNumber;
            this.leftAnswered = true;
            
            if (this.totalAnswered) {
                // If total is already answered, check if we're done
                this.checkQuestionCompletion();
            } else {
                // Immediately show right input box (no delay)
                this.showRightInputBox();
            }
        } else if (step === 'right') {
            this.rightInputBox.textContent = selectedNumber;
            this.rightAnswered = true;
            
            if (this.totalAnswered) {
                // All parts completed
                this.checkQuestionCompletion();
            } else {
                // Immediately show total input box (no delay)
                this.showTotalInputBox();
            }
        }
    }

    checkQuestionCompletion() {
        if (this.leftAnswered && this.rightAnswered && this.totalAnswered) {
            // All parts completed - treat as correct final answer
            this.stopFlashing();
            
            // Show check mark
            this.checkMark.classList.add('visible');
            
            // Check if this was the first attempt for the entire question
            const wasFirstAttempt = !this.hasAttemptedAnswer();
            
            // Add rainbow piece
            const pieces = this.rainbow.addPiece();
            console.log(`Rainbow pieces: ${pieces}, wasFirstAttempt: ${wasFirstAttempt}`);
            
            // Update streaks and difficulty progression
            if (wasFirstAttempt) {
                this.correctStreak++;
                this.wrongStreak = 0;
                this.questionsInLevel++;
                
                if (this.correctStreak >= CONFIG.QUESTIONS_PER_LEVEL) {
                    this.progressDifficulty();
                }
            } else {
                this.wrongStreak++;
                this.correctStreak = 0;
                this.questionsInLevel++;
                
                if (this.wrongStreak >= CONFIG.CONSECUTIVE_WRONG_TO_DROP) {
                    this.dropDifficulty();
                }
            }
            
            // Check if game is complete
            if (this.rainbow.isComplete()) {
                setTimeout(() => {
                    this.completeGame();
                }, 3000); // 2 seconds display + 1 second fade
                return;
            }

            // Start fade out after 2 seconds, then new question (reduced from 3)
            setTimeout(() => {
                this.fadeOutQuestion();
            }, 2000);
        }
    }

    handleCorrectFinalAnswer(buttonElement, selectedNumber) {
        // Check if this was the first attempt for the entire question BEFORE any processing
        const wasFirstAttempt = !this.hasAttemptedAnswer();
        
        // Flash green on correct answer
        buttonElement.classList.add('correct');
        setTimeout(() => {
            buttonElement.classList.remove('correct');
        }, CONFIG.FLASH_DURATION);

        // Fill the total box
        this.totalInputBox.textContent = selectedNumber;
        this.totalInputBox.classList.remove('flashing');
        this.totalInputBox.classList.add('filled');
        this.totalAnswered = true;
        
        this.stopFlashing();

        // Show check mark
        this.checkMark.classList.add('visible');
        
        // Add rainbow piece - THIS IS CRITICAL!
        const pieces = this.rainbow.addPiece();
        console.log(`Rainbow pieces: ${pieces}, wasFirstAttempt: ${wasFirstAttempt}`);
        
        // Update streaks and difficulty progression
        if (wasFirstAttempt) {
            this.correctStreak++;
            this.wrongStreak = 0;
            this.questionsInLevel++;
            
            if (this.correctStreak >= CONFIG.QUESTIONS_PER_LEVEL) {
                this.progressDifficulty();
            }
        } else {
            this.wrongStreak++;
            this.correctStreak = 0;
            this.questionsInLevel++;
            
            if (this.wrongStreak >= CONFIG.CONSECUTIVE_WRONG_TO_DROP) {
                this.dropDifficulty();
            }
        }
        
        // Check if game is complete
        if (this.rainbow.isComplete()) {
            setTimeout(() => {
                this.completeGame();
            }, 3000); // 2 seconds display + 1 second fade
            return;
        }

        // Start fade out after 2 seconds, then new question (reduced from 3)
        setTimeout(() => {
            this.fadeOutQuestion();
        }, 2000);
    }

    handleIncorrectAnswer(buttonElement) {
        // Disable buttons during error handling
        this.buttonsDisabled = true;
        
        // Stop flashing during error handling
        this.stopFlashing();
        
        // Flash red on the clicked button
        buttonElement.classList.add('incorrect');
        setTimeout(() => {
            buttonElement.classList.remove('incorrect');
        }, CONFIG.FLASH_DURATION);

        // Add crimson cross overlay to the incorrect button
        const crossOverlay = document.createElement('div');
        crossOverlay.className = 'cross-overlay';
        buttonElement.appendChild(crossOverlay);

        // Mark that an attempt was made
        buttonElement.dataset.attempted = 'true';
        
        // Fade out all other buttons (not the clicked one) - 0.7 seconds (reduced from 1)
        this.numberButtons.forEach(btn => {
            if (btn !== buttonElement) {
                btn.style.transition = 'opacity 700ms ease-in-out';
                btn.style.opacity = '0.1';
            }
        });

        // After fade out completes, wait 0.7 seconds, then fade back in (reduced from 1)
        setTimeout(() => {
            // After 0.7 second pause, start fading back in - 0.7 seconds (reduced from 1)
            setTimeout(() => {
                this.numberButtons.forEach(btn => {
                    if (btn !== buttonElement) {
                        btn.style.transition = 'opacity 700ms ease-in-out';
                        btn.style.opacity = '1';
                    }
                });
                
                // Start fading out the cross during the last 0.7 seconds
                if (crossOverlay && crossOverlay.parentNode) {
                    crossOverlay.style.transition = 'opacity 700ms ease-out';
                    crossOverlay.style.opacity = '0';
                }
                
                // Clean up after fade in completes (0.7 seconds later)
                setTimeout(() => {
                    // Remove the cross overlay
                    if (crossOverlay && crossOverlay.parentNode) {
                        crossOverlay.parentNode.removeChild(crossOverlay);
                    }
                    
                    // Clean up transition styles
                    this.numberButtons.forEach(btn => {
                        btn.style.transition = '';
                    });
                }, 700);
            }, 700);
            
            // Re-enable buttons at 1.4 seconds total (reduced from 2)
            setTimeout(() => {
                this.buttonsDisabled = false;
                // Resume flashing
                this.startFlashing();
            }, 1400);
        }, 700);
    }

    fadeOutQuestion() {
        // Add fade out class to icons only, NOT the sum row
        const gameElements = [...this.iconRenderer.currentIcons];
        
        gameElements.forEach(element => {
            if (element) {
                element.classList.add('fade-out');
            }
        });
        
        // Start new question after fade out completes
        setTimeout(() => {
            this.startNewQuestion();
            
            // Remove fade out classes and add fade in to new icons only
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
        }, 1000); // 1 second fade out
    }

    hasAttemptedAnswer() {
        return Array.from(this.numberButtons).some(btn => 
            btn.dataset.attempted === 'true'
        );
    }

    resetButtonStates() {
        this.buttonsDisabled = false;
        this.numberButtons.forEach(btn => {
            btn.dataset.attempted = 'false';
            btn.classList.remove('correct', 'incorrect');
            btn.style.opacity = '1';
            btn.style.transition = '';
            
            // Remove any existing cross overlays
            const crossOverlay = btn.querySelector('.cross-overlay');
            if (crossOverlay) {
                crossOverlay.remove();
            }
        });
    }

    // Addition generation methods
    generateForcedHigherAddition() {
        const higherNumbers = this.currentDifficulty.higherNumbers;
        if (!higherNumbers) return this.generateAdditionForDifficulty();
        
        const targetSum = higherNumbers[Math.floor(Math.random() * higherNumbers.length)];
        return this.generateAdditionForSum(targetSum);
    }

    generateAdditionForDifficulty() {
        const maxTotal = this.currentDifficulty.maxTotal;
        const minSum = 2;
        
        const sum = Math.floor(Math.random() * (maxTotal - minSum + 1)) + minSum;
        return this.generateAdditionForSum(sum);
    }

    generateAdditionForSum(targetSum) {
        const combinations = [];
        
        for (let left = CONFIG.MIN_ICONS_PER_SIDE; left <= CONFIG.MAX_ICONS_PER_SIDE; left++) {
            const right = targetSum - left;
            if (right >= CONFIG.MIN_ICONS_PER_SIDE && right <= CONFIG.MAX_ICONS
