class AddGameController {
    constructor() {
        this.iconRenderer = new AddIconRenderer();
        this.rainbow = new Rainbow();
        
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
        
        // DOM elements
        this.numberButtons = document.querySelectorAll('.number-btn');
        this.modal = document.getElementById('gameModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.leftInputBox = document.getElementById('leftInputBox');
        this.rightInputBox = document.getElementById('rightInputBox');
        this.sumRow = document.getElementById('sumRow');
        this.totalInputBox = document.getElementById('totalInputBox');
        this.checkMark = document.getElementById('checkMark');
        
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
        this.iconRenderer.reset();
        this.modal.classList.add('hidden');
        this.hideAllInputBoxes();
        this.startNewQuestion();
    }

    resetStepState() {
        this.gameStep = 'left';
        this.leftAnswered = false;
        this.rightAnswered = false;
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
    }

    showRightInputBox() {
        this.gameStep = 'right';
        this.leftInputBox.classList.remove('flashing');
        this.leftInputBox.classList.add('filled');
        
        this.rightInputBox.classList.add('flashing');
    }

    showTotalInputBox() {
        this.gameStep = 'total';
        this.rightInputBox.classList.remove('flashing');
        this.rightInputBox.classList.add('filled');
        
        this.totalInputBox.classList.add('flashing');
    }

    handleNumberClick(selectedNumber, buttonElement) {
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
            // Immediately show right input box (no delay)
            this.showRightInputBox();
        } else if (step === 'right') {
            this.rightInputBox.textContent = selectedNumber;
            this.rightAnswered = true;
            // Immediately show total input box (no delay)
            this.showTotalInputBox();
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
            }, 4000); // 3 seconds display + 1 second fade
            return;
        }

        // Start fade out after 3 seconds, then new question
        setTimeout(() => {
            this.fadeOutQuestion();
        }, 3000);
    }

    handleIncorrectAnswer(buttonElement) {
        // Disable buttons during error handling
        this.buttonsDisabled = true;
        
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
        
        // Fade out all other buttons (not the clicked one) - 1 second
        this.numberButtons.forEach(btn => {
            if (btn !== buttonElement) {
                btn.style.transition = 'opacity 1000ms ease-in-out';
                btn.style.opacity = '0.1';
            }
        });

        // After fade out completes, wait 1 second, then fade back in
        setTimeout(() => {
            // After 1 second pause, start fading back in - 1 second
            setTimeout(() => {
                this.numberButtons.forEach(btn => {
                    if (btn !== buttonElement) {
                        btn.style.transition = 'opacity 1000ms ease-in-out';
                        btn.style.opacity = '1';
                    }
                });
                
                // Start fading out the cross during the last second
                if (crossOverlay && crossOverlay.parentNode) {
                    crossOverlay.style.transition = 'opacity 1000ms ease-out';
                    crossOverlay.style.opacity = '0';
                }
                
                // Re-enable buttons as soon as fade-in starts (after 2 seconds total)
                this.buttonsDisabled = false;
                
                // Clean up after fade in completes (1 second later)
                setTimeout(() => {
                    // Remove the cross overlay
                    if (crossOverlay && crossOverlay.parentNode) {
                        crossOverlay.parentNode.removeChild(crossOverlay);
                    }
                    
                    // Clean up transition styles
                    this.numberButtons.forEach(btn => {
                        btn.style.transition = '';
                    });
                }, 1000);
            }, 1000);
        }, 1000);
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
            const highNumbers = [8, 9, 10]; // Updated: removed 11, 12
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
    }

    completeGame() {
        this.gameComplete = true;
        this.modal.classList.remove('hidden');
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AddGameController();
});
