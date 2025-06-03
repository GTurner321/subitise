class GameController {
    constructor() {
        this.iconRenderer = new IconRenderer();
        this.rainbow = new Rainbow();
        
        // Game state
        this.currentDifficulty = CONFIG.DIFFICULTY.EASY;
        this.currentAnswer = 0;
        this.previousAnswer = 0; // Track previous question to avoid duplicates
        this.correctStreak = 0;
        this.wrongStreak = 0;
        this.questionsInLevel = 0;
        this.gameComplete = false;
        this.hasSeenHigherNumbers = false; // Track if user has seen higher numbers in current level
        
        // DOM elements
        this.numberButtons = document.querySelectorAll('.number-btn');
        this.modal = document.getElementById('gameModal');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        
        this.initializeEventListeners();
        this.startNewQuestion();
    }

    initializeEventListeners() {
        // Number button clicks
        this.numberButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const selectedNumber = parseInt(e.target.dataset.number);
                this.handleNumberClick(selectedNumber, e.target);
            });
        });

        // Play again button
        this.playAgainBtn.addEventListener('click', () => {
            this.startNewGame();
        });
    }

    startNewGame() {
        // Keep current difficulty level but reset other stats
        this.correctStreak = 0;
        this.wrongStreak = 0;
        this.questionsInLevel = 0;
        this.gameComplete = false;
        this.previousAnswer = 0; // Reset previous answer tracking
        
        this.rainbow.reset();
        this.modal.classList.add('hidden');
        this.startNewQuestion();
    }

    startNewQuestion() {
        if (this.gameComplete) {
            return;
        }

        // Check if we need to force higher numbers before allowing progression
        let forceHigherNumbers = false;
        if (this.correctStreak === 2 && !this.hasSeenHigherNumbers) {
            forceHigherNumbers = true;
        }

        // Generate random number of icons based on current difficulty
        let questionNumber;
        let attempts = 0;
        const maxAttempts = 50; // Increased attempts for better coverage
        
        do {
            if (forceHigherNumbers) {
                // Force higher numbers in current level
                if (this.currentDifficulty === CONFIG.DIFFICULTY.EASY) {
                    // Force 4 (highest in easy level)
                    questionNumber = 4;
                } else if (this.currentDifficulty === CONFIG.DIFFICULTY.MEDIUM) {
                    // Force 5 or 6 (higher numbers in medium level)
                    questionNumber = Math.random() < 0.5 ? 5 : 6;
                } else if (this.currentDifficulty === CONFIG.DIFFICULTY.HARD) {
                    // Force 7-10 (higher numbers in hard level)
                    const higherNumbers = [7, 8, 9, 10];
                    questionNumber = higherNumbers[Math.floor(Math.random() * higherNumbers.length)];
                }
            } else if (this.currentDifficulty === CONFIG.DIFFICULTY.HARD) {
                // Use weighted probability for hard level
                questionNumber = this.getWeightedHardNumber();
            } else {
                // Use uniform distribution for easy and medium levels
                const min = this.currentDifficulty.min;
                const max = this.currentDifficulty.max;
                questionNumber = Math.floor(Math.random() * (max - min + 1)) + min;
            }
            attempts++;
            
            // Debug logging (remove in production)
            console.log(`Attempt ${attempts}: Generated ${questionNumber}, Previous was ${this.previousAnswer}, Difficulty: ${this.currentDifficulty.name}, Force higher: ${forceHigherNumbers}`);
            
        } while (
            (questionNumber === this.previousAnswer || // No consecutive duplicates
             (this.previousAnswer === 0 && questionNumber === 1) || // Don't start with 1
             (this.currentDifficulty === CONFIG.DIFFICULTY.HARD && 
              this.previousAnswer >= 7 && this.previousAnswer <= 10 && 
              questionNumber >= 7 && questionNumber <= 10)) && // In hard level, don't follow 7-10 with another 7-10
            attempts < maxAttempts
        );
        
        // Check if this question contains higher numbers for current level
        this.checkForHigherNumbers(questionNumber);
        
        // Store the current answer as previous for next time BEFORE updating currentAnswer
        this.previousAnswer = this.currentAnswer;
        this.currentAnswer = questionNumber;
        
        console.log(`Final: Using ${questionNumber}, storing ${this.previousAnswer} as previous, hasSeenHigher: ${this.hasSeenHigherNumbers}`);
        
        // Render the icons
        this.iconRenderer.renderIcons(this.currentAnswer);
        
        // Reset button states
        this.resetButtonStates();
    }

    checkForHigherNumbers(questionNumber) {
        if (this.currentDifficulty === CONFIG.DIFFICULTY.EASY && questionNumber === 4) {
            this.hasSeenHigherNumbers = true;
        } else if (this.currentDifficulty === CONFIG.DIFFICULTY.MEDIUM && (questionNumber === 5 || questionNumber === 6)) {
            this.hasSeenHigherNumbers = true;
        } else if (this.currentDifficulty === CONFIG.DIFFICULTY.HARD && questionNumber >= 7) {
            this.hasSeenHigherNumbers = true;
        }
    }

    getWeightedHardNumber() {
        // Weighted probabilities for hard level (3-10)
        const weights = [
            { number: 3, weight: 10 },  // 10%
            { number: 4, weight: 16 },  // 16%
            { number: 5, weight: 17 },  // 17%
            { number: 6, weight: 17 },  // 17%
            { number: 7, weight: 16 },  // 16%
            { number: 8, weight: 8 },   // 8%
            { number: 9, weight: 8 },   // 8%
            { number: 10, weight: 8 }   // 8%
        ];
        
        // Calculate total weight
        const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
        
        // Generate random number between 0 and total weight
        let random = Math.random() * totalWeight;
        
        // Find which number this random value corresponds to
        for (let item of weights) {
            random -= item.weight;
            if (random <= 0) {
                return item.number;
            }
        }
        
        // Fallback (shouldn't happen)
        return 5;
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
        
        if (wasFirstAttempt) {
            this.correctStreak++;
            this.wrongStreak = 0;
            this.questionsInLevel++;
            
            // Add rainbow piece
            const pieces = this.rainbow.addPiece();
            
            // Check if game is complete
            if (this.rainbow.isComplete()) {
                setTimeout(() => {
                    this.completeGame();
                }, CONFIG.NEXT_QUESTION_DELAY + 2000); // Extra 2 seconds to see rainbow flashing
                return;
            }
            
            // Check for difficulty progression
            if (this.correctStreak >= CONFIG.QUESTIONS_PER_LEVEL) {
                this.progressDifficulty();
            }
        }

        // Start next question after delay
        setTimeout(() => {
            this.startNewQuestion();
        }, CONFIG.NEXT_QUESTION_DELAY);
    }

    handleIncorrectAnswer(buttonElement) {
        // Flash red
        buttonElement.classList.add('incorrect');
        setTimeout(() => {
            buttonElement.classList.remove('incorrect');
        }, CONFIG.FLASH_DURATION);

        // Mark that an attempt was made
        buttonElement.dataset.attempted = 'true';
        
        // Check if this is the first incorrect attempt for this question
        if (!this.hasAttemptedAnswer()) {
            this.wrongStreak++;
            this.correctStreak = 0;
            this.questionsInLevel++;
            
            // Check if we need to drop difficulty
            if (this.wrongStreak >= CONFIG.CONSECUTIVE_WRONG_TO_DROP) {
                this.dropDifficulty();
            }
        }
    }

    hasAttemptedAnswer() {
        return Array.from(this.numberButtons).some(btn => 
            btn.dataset.attempted === 'true'
        );
    }

    resetButtonStates() {
        this.numberButtons.forEach(btn => {
            btn.dataset.attempted = 'false';
            btn.classList.remove('correct', 'incorrect');
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
    new GameController();
});
