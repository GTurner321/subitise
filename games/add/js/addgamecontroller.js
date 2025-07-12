class AddGameController {
    constructor() {
        this.iconRenderer = new AddIconRenderer();
        this.rainbow = new Rainbow();
        this.bear = new Bear();
        
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
        
        // NEW: Track if 1+? format has been used and answered correctly in current level
        this.hasUsedOnePlusFormat = false;
        this.currentLevelTurn = 0; // Track which "turn" of this level we're on
        
        // Simplified box state - track which boxes are filled
        this.leftFilled = false;
        this.rightFilled = false;
        this.totalFilled = false;
        
        // Flashing intervals
        this.flashingInterval = null;
        this.flashingTimeout = null;
        
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
        this.hasUsedOnePlusFormat = false;
        this.currentLevelTurn = 0;
        this.resetBoxState();
        
        this.rainbow.reset();
        this.bear.reset();
        this.iconRenderer.reset();
        this.modal.classList.add('hidden');
        this.hideAllInputBoxes();
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
                this.leftSide.classList.add('area-flash');
                this.leftInputBox.classList.add('box-flash');
            } else if (!this.rightFilled) {
                this.rightSide.classList.add('area-flash');
                this.rightInputBox.classList.add('box-flash');
            } else if (!this.totalFilled) {
                // Flash both areas when total is the only remaining box
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

        this.resetBoxState();
        this.hideAllInputBoxes();

        // Check if we need to force higher numbers
        let forceHigherNumbers = false;
        if (this.correctStreak === 1 && !this.hasSeenHigherNumbers) { // Changed from 2 to 1
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
             this.isConsecutiveHighNumbers(sum, this.previousSum) ||
             this.shouldAvoidOnePlusFormat(leftCount, rightCount)) && 
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
        
        console.log(`Question: ${leftCount} + ${rightCount} = ${sum}, Level: ${this.currentDifficulty.name}, HasUsedOnePlus: ${this.hasUsedOnePlusFormat}`);
        
        // Render the icons
        this.iconRenderer.renderIcons(leftCount, rightCount);
        
        // Reset button states and show input boxes
        this.resetButtonStates();
        this.showInputBoxes();
    }

    // NEW: Check if we should avoid 1+? format
    shouldAvoidOnePlusFormat(leftCount, rightCount) {
        // If we haven't used 1+? format yet in this level, allow it
        if (!this.hasUsedOnePlusFormat) {
            return false;
        }
        
        // If we have used it, avoid any 1+? or ?+1 combinations
        return (leftCount === 1 || rightCount === 1);
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
        let correctAnswer = false;
        
        // Check boxes in left-to-right priority order for filling
        // This ensures duplicates fill left box first, then right box
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
            this.handleIncorrectAnswer(buttonElement);
        }
    }

    fillBox(boxType, selectedNumber, buttonElement) {
        // Flash green on correct answer
        buttonElement.classList.add('correct');
        setTimeout(() => {
            buttonElement.classList.remove('correct');
        }, CONFIG.FLASH_DURATION);

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
            // All boxes completed
            this.stopFlashing();
            
            // Show check mark
            this.checkMark.classList.add('visible');
            
            // Check if this was the first attempt for the entire question
            const wasFirstAttempt = !this.hasAttemptedAnswer();
            
            // NEW: Mark that we've used 1+? format if this question was 1+? or ?+1
            if (wasFirstAttempt && (this.currentLeftCount === 1 || this.currentRightCount === 1)) {
                this.hasUsedOnePlusFormat = true;
                console.log('Marked 1+? format as used in this level');
            }
            
            // Add rainbow piece
            const pieces = this.rainbow.addPiece();
            console.log(`Rainbow pieces: ${pieces}, wasFirstAttempt: ${wasFirstAttempt}`);
            
            // Update streaks and difficulty progression
            if (wasFirstAttempt) {
                this.correctStreak++;
                this.wrongStreak = 0;
                this.questionsInLevel++;
                
                // MODIFIED: Different requirements for progression
                const progressionRequirement = this.getProgressionRequirement();
                if (this.correctStreak >= progressionRequirement) {
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
                }, 3000);
                return;
            }

            // Start fade out after 2 seconds, then new question
            setTimeout(() => {
                this.fadeOutQuestion();
            }, 2000);
        }
    }

    // NEW: Get progression requirement based on current difficulty
    getProgressionRequirement() {
        if (this.currentDifficulty === CONFIG.DIFFICULTY.EASY) {
            return 2; // Easy to Medium: 2 correct
        } else if (this.currentDifficulty === CONFIG.DIFFICULTY.MEDIUM) {
            return 3; // Medium to Hard: 3 correct (unchanged)
        } else {
            return 2; // Hard level: 2 correct (for potential future levels)
        }
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
        
        // Fade out all other buttons
        this.numberButtons.forEach(btn => {
            if (btn !== buttonElement) {
                btn.style.transition = 'opacity 700ms ease-in-out';
                btn.style.opacity = '0.1';
            }
        });

        // After fade out completes, wait, then fade back in
        setTimeout(() => {
            setTimeout(() => {
                this.numberButtons.forEach(btn => {
                    if (btn !== buttonElement) {
                        btn.style.transition = 'opacity 700ms ease-in-out';
                        btn.style.opacity = '1';
                    }
                });
                
                // Start fading out the cross
                if (crossOverlay && crossOverlay.parentNode) {
                    crossOverlay.style.transition = 'opacity 700ms ease-out';
                    crossOverlay.style.opacity = '0';
                }
                
                // Clean up after fade in completes
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
            
            // Re-enable buttons
            setTimeout(() => {
                this.buttonsDisabled = false;
                // Resume flashing
                this.startFlashing();
            }, 1400);
        }, 700);
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

    // Addition generation methods (unchanged)
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
            if (right >= CONFIG.MIN_ICONS_PER_SIDE && right <= CONFIG.MAX_ICONS_PER_SIDE) {
                combinations.push({ left, right, sum: targetSum });
            }
        }
        
        if (combinations.length === 0) {
            return { left: 1, right: 1, sum: 2 };
        }
        
        return combinations[Math.floor(Math.random() * combinations.length)];
    }

    getCanonicalAddition(left, right) {
        const smaller = Math.min(left, right);
        const larger = Math.max(left, right);
        return `${smaller}+${larger}`;
    }

    isConsecutiveHighNumbers(currentSum, previousSum) {
        if (this.currentDifficulty.name === 'hard') {
            const highNumbers = [8, 9, 10];
            return highNumbers.includes(currentSum) && highNumbers.includes(previousSum);
        }
        return false;
    }

    checkForHigherNumbers(sum) {
        const higherNumbers = this.currentDifficulty.higherNumbers;
        if (higherNumbers && higherNumbers.includes(sum)) {
            this.hasSeenHigherNumbers = true;
        }
    }

    progressDifficulty() {
        if (this.currentDifficulty === CONFIG.DIFFICULTY.EASY) {
            this.currentDifficulty = CONFIG.DIFFICULTY.MEDIUM;
        } else if (this.currentDifficulty === CONFIG.DIFFICULTY.MEDIUM) {
            this.currentDifficulty = CONFIG.DIFFICULTY.HARD;
        }
        
        this.correctStreak = 0;
        this.questionsInLevel = 0;
        this.hasSeenHigherNumbers = false;
        // NEW: Reset 1+? format tracking when advancing difficulty
        this.hasUsedOnePlusFormat = false;
        this.currentLevelTurn++;
        console.log(`Advanced to ${this.currentDifficulty.name}, reset 1+? tracking`);
    }

    dropDifficulty() {
        if (this.currentDifficulty === CONFIG.DIFFICULTY.HARD) {
            this.currentDifficulty = CONFIG.DIFFICULTY.MEDIUM;
        } else if (this.currentDifficulty === CONFIG.DIFFICULTY.MEDIUM) {
            this.currentDifficulty = CONFIG.DIFFICULTY.EASY;
        }
        
        this.wrongStreak = 0;
        this.correctStreak = 0;
        this.questionsInLevel = 0;
        this.hasSeenHigherNumbers = false;
        // NEW: Reset 1+? format tracking when dropping difficulty (new turn of this level)
        this.hasUsedOnePlusFormat = false;
        this.currentLevelTurn++;
        console.log(`Dropped to ${this.currentDifficulty.name}, reset 1+? tracking`);
    }

    completeGame() {
        this.gameComplete = true;
        this.stopFlashing();
        this.modal.classList.remove('hidden');
        
        // Start bear celebration when modal opens
        this.bear.startCelebration();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AddGameController();
});
