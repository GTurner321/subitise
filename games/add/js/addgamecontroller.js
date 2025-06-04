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
        this.equalsSection = document.getElementById('equalsSection');
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
        
        // Render the icons with input box avoidance
        this.iconRenderer.renderIcons(leftCount, rightCount, true);
        
        // Reset button states and start with left side
        this.resetButtonStates();
        this.showLeftInputBox();
    }

    hideAllInputBoxes() {
        this.leftInputBox.classList.add('hidden');
        this.rightInputBox.classList.add('hidden');
        this.equalsSection.classList.add('hidden');
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
        this.leftInputBox.classList.remove('hidden');
        this.leftInputBox.classList.add('flashing');
    }

    showRightInputBox() {
        this.gameStep = 'right';
        this.leftInputBox.classList.remove('flashing');
        this.leftInputBox.classList.add('filled');
        
        this.rightInputBox.classList.remove('hidden');
        this.rightInputBox.classList.add('flashing');
    }

    showTotalInputBox() {
        this.gameStep = 'total';
        this.rightInputBox.classList.remove('flashing');
        this.rightInputBox.classList.add('filled');
        
        this.equalsSection.classList.remove('hidden');
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
                    this.handleIncorrectStepAnswer(buttonElement);
                }
                break;
                
            case 'right':
                isCorrect = selectedNumber === this.currentRightCount;
                if (isCorrect) {
                    this.handleCorrectStepAnswer(buttonElement, selectedNumber, 'right');
                } else {
                    this.handleIncorrectStepAnswer(buttonElement);
                }
                break;
                
            case 'total':
                isCorrect = selectedNumber === this.currentAnswer;
                if (isCorrect) {
                    this.handleCorrectFinalAnswer(buttonElement, selectedNumber);
                } else {
                    this.handleIncorrectStepAnswer(buttonElement);
                }
                break;
        }
    }

    handleCorrectStepAnswer(buttonElement, selectedNumber, step) {
        // Flash green
        buttonElement.classList.add('correct');
        setTimeout(() => {
            buttonElement.classList.remove('correct');
        }, CONFIG.FLASH_DURATION);

        // Fill the box with the number
        if (step === 'left') {
            this.leftInputBox.textContent = selectedNumber;
            this.leftAnswered = true;
            setTimeout(() => {
                this.showRightInputBox();
            }, 800);
        } else if (step === 'right') {
            this.rightInputBox.textContent = selectedNumber;
            this.rightAnswered = true;
            setTimeout(() => {
                this.showTotalInputBox();
            }, 800);
        }
    }

    handleCorrectFinalAnswer(buttonElement, selectedNumber) {
        // Flash green
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

        // Check if this was the first attempt for the entire question
        const wasFirstAttempt = !this.hasAttemptedAnswer();
        
        // Add rainbow piece
        const pieces = this.rainbow.addPiece();
        
        // Update streaks and difficulty progression based on first attempt performance
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

    handleIncorrectStepAnswer(buttonElement) {
        // Use shared error handling logic with 3-second timeout
        this.buttonsDisabled = true;
        
        SharedErrorHandler.handleIncorrectAnswer(
            buttonElement, 
            this.numberButtons, 
            () => {
                // Callback to re-enable buttons
                this.buttonsDisabled = false;
            },
            {
                flashDuration: CONFIG.FLASH_DURATION,
                disableTimeout: 3000, // 3 seconds as requested
                fadeTransition: 1000
            }
        );
    }

    sharedIncorrectAnswerLogic(buttonElement) {
        // This method is now redundant - keeping for compatibility
        this.handleIncorrectStepAnswer(buttonElement);
    }

    fadeOutQuestion() {
        // Add fade out class to all game elements
        const gameElements = [
            ...this.iconRenderer.currentIcons,
            this.leftInputBox,
            this.rightInputBox,
            this.equalsSection
        ];
        
        gameElements.forEach(element => {
            element.classList.add('fade-out');
        });
        
        // Start new question after fade out completes
        setTimeout(() => {
            this.startNewQuestion();
            
            // Remove fade out classes and add fade in
            setTimeout(() => {
                gameElements.forEach(element => {
                    element.classList.remove('fade-out');
                    element.classList.add('fade-in');
                });
                
                // Clean up fade in classes
                setTimeout(() => {
                    gameElements.forEach(element => {
                        element.classList.remove('fade-in');
                    });
                }, 1000);
            }, 100);
        }, 1000); // 1 second fade out
    }

    hasAttemptedAnswer() {
        return SharedErrorHandler.hasAttemptedAnswer(this.numberButtons);
    }

    resetButtonStates() {
        this.buttonsDisabled = false;
        SharedErrorHandler.resetButtonStates(this.numberButtons);
    }

    // Addition generation methods (same as before)
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
            const highNumbers = [9, 10, 11, 12];
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
