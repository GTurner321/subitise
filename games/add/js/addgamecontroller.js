class AddGameController {
    constructor() {
        this.iconRenderer = new AddIconRenderer();
        this.rainbow = new Rainbow();
        
        // Game state
        this.currentDifficulty = CONFIG.DIFFICULTY.EASY;
        this.currentAnswer = 0;
        this.currentLeftCount = 0;
        this.currentRightCount = 0;
        this.previousSum = 0; // Track previous sum to avoid duplicates
        this.previousAddition = null; // Track previous addition (e.g., "2+3")
        this.correctStreak = 0;
        this.wrongStreak = 0;
        this.questionsInLevel = 0;
        this.gameComplete = false;
        this.hasSeenHigherNumbers = false;
        this.buttonsDisabled = false;
        
        // DOM elements
        this.numberButtons = document.querySelectorAll('.number-btn');
        this.modal = document.getElementById('gameModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        
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
        
        this.rainbow.reset();
        this.iconRenderer.reset();
        this.modal.classList.add('hidden');
        this.startNewQuestion();
    }

    startNewQuestion() {
        if (this.gameComplete) {
            return;
        }

        // Check if we need to force higher numbers
        let forceHigherNumbers = false;
        if (this.correctStreak === 2 && !this.hasSeenHigherNumbers) {
            forceHigherNumbers = true;
        }

        let leftCount, rightCount, sum;
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
            
            const currentAddition = this.getCanonicalAddition(leftCount, rightCount);
            attempts++;
            
        } while (
            (sum === this.previousSum || 
             currentAddition === this.previousAddition ||
             this.isConsecutiveHighNumbers(sum, this.previousSum)) && 
            attempts < maxAttempts
        );
        
        // Update tracking variables
        this.previousSum = sum;
        this.previousAddition = this.getCanonicalAddition(leftCount, rightCount);
        
        // Check if this question contains higher numbers for current level
        this.checkForHigherNumbers(sum);
        
        // Set current game state
        this.currentLeftCount = leftCount;
        this.currentRightCount = rightCount;
        this.currentAnswer = sum;
        
        console.log(`Question: ${leftCount} + ${rightCount} = ${sum}, Level: ${this.currentDifficulty.name}`);
        
        // Render the icons
        this.iconRenderer.renderIcons(leftCount, rightCount);
        
        // Reset button states
        this.resetButtonStates();
    }

    generateForcedHigherAddition() {
        const higherNumbers = this.currentDifficulty.higherNumbers;
        if (!higherNumbers) return this.generateAdditionForDifficulty();
        
        // Force a sum from the higher numbers range
        const targetSum = higherNumbers[Math.floor(Math.random() * higherNumbers.length)];
        return this.generateAdditionForSum(targetSum);
    }

    generateAdditionForDifficulty() {
        const maxTotal = this.currentDifficulty.maxTotal;
        const minSum = 2; // At least 1+1
        
        // Generate random sum within difficulty range
        const sum = Math.floor(Math.random() * (maxTotal - minSum + 1)) + minSum;
        return this.generateAdditionForSum(sum);
    }

    generateAdditionForSum(targetSum) {
        // Generate all possible combinations for this sum
        const combinations = [];
        
        for (let left = CONFIG.MIN_ICONS_PER_SIDE; left <= CONFIG.MAX_ICONS_PER_SIDE; left++) {
            const right = targetSum - left;
            if (right >= CONFIG.MIN_ICONS_PER_SIDE && right <= CONFIG.MAX_ICONS_PER_SIDE) {
                combinations.push({ left, right, sum: targetSum });
            }
        }
        
        if (combinations.length === 0) {
            // Fallback - shouldn't happen with proper constraints
            return { left: 1, right: 1, sum: 2 };
        }
        
        // Choose random combination
        return combinations[Math.floor(Math.random() * combinations.length)];
    }

    getCanonicalAddition(left, right) {
        // Always represent as smaller + larger to detect equivalent additions
        const smaller = Math.min(left, right);
        const larger = Math.max(left, right);
        return `${smaller}+${larger}`;
    }

    isConsecutiveHighNumbers(currentSum, previousSum) {
        // In hard level, prevent consecutive high numbers (9-12)
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

    handleNumberClick(selectedNumber, buttonElement) {
        const isCorrect = selectedNumber === this.currentAnswer;
        
        if (isCorrect) {
            this.handleCorrectAnswer(buttonElement);
        } else {
            this.handleIncorrectAnswer(buttonElement);
        }
    }

    handleCorrectAnswer(buttonElement) {
        // Flash green
        buttonElement.classList.add('correct');
        setTimeout(() => {
            buttonElement.classList.remove('correct');
        }, CONFIG.FLASH_DURATION);

        // Check if this was the first attempt
        const wasFirstAttempt = !this.hasAttemptedAnswer();
        
        // Always add rainbow piece for any correct answer
        const pieces = this.rainbow.addPiece();
        
        // Update streaks and difficulty progression based on first attempt performance
        if (wasFirstAttempt) {
            // First attempt correct - positive progression
            this.correctStreak++;
            this.wrongStreak = 0;
            this.questionsInLevel++;
            
            // Check for difficulty progression
            if (this.correctStreak >= CONFIG.QUESTIONS_PER_LEVEL) {
                this.progressDifficulty();
            }
        } else {
            // Multiple attempts needed - treat as "incorrect on first attempt"
            this.wrongStreak++;
            this.correctStreak = 0;
            this.questionsInLevel++;
            
            // Check if we need to drop difficulty
            if (this.wrongStreak >= CONFIG.CONSECUTIVE_WRONG_TO_DROP) {
                this.dropDifficulty();
            }
        }
        
        // Check if game is complete
        if (this.rainbow.isComplete()) {
            setTimeout(() => {
                this.completeGame();
            }, CONFIG.NEXT_QUESTION_DELAY + 3000);
            return;
        }

        // Start next question after delay
        setTimeout(() => {
            this.startNewQuestion();
        }, CONFIG.NEXT_QUESTION_DELAY);
    }

    handleIncorrectAnswer(buttonElement) {
        // Disable buttons during the fade sequence
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
        
        // Fade out all other buttons (not the clicked one)
        this.numberButtons.forEach(btn => {
            if (btn !== buttonElement) {
                btn.style.transition = 'opacity 1s ease-in-out';
                btn.style.opacity = '0.1';
            }
        });

        // After 1 second (fade out complete), wait 1 second, then fade back in
        setTimeout(() => {
            // Start fading back in after the 1 second pause
            this.numberButtons.forEach(btn => {
                if (btn !== buttonElement) {
                    btn.style.opacity = '1';
                }
            });
            
            // Start fading out the cross during the last second
            if (crossOverlay && crossOverlay.parentNode) {
                crossOverlay.style.transition = 'opacity 1s ease-out';
                crossOverlay.style.opacity = '0';
            }
            
            // Re-enable buttons and remove cross after fade in completes
            setTimeout(() => {
                this.buttonsDisabled = false;
                if (crossOverlay && crossOverlay.parentNode) {
                    crossOverlay.parentNode.removeChild(crossOverlay);
                }
                this.numberButtons.forEach(btn => {
                    btn.style.transition = '';
                });
            }, 1000);
        }, 2000);
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
            const crossOverlay = btn.querySelector('.cross-overlay');
            if (crossOverlay) {
                crossOverlay.remove();
            }
        });
    }

    progressDifficulty() {
        if (this.currentDifficulty === CONFIG.DIFFICULTY.EASY) {
            this.currentDifficulty = CONFIG.DIFFICULTY.MEDIUM;
        } else if (this.currentDifficulty === CONFIG.DIFFICULTY.MEDIUM) {
            this.currentDifficulty = CONFIG.DIFFICULTY.HARD;
        }
        
        // Reset streak counter and higher numbers flag for new level
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
        
        // Reset streak counters and higher numbers flag
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
