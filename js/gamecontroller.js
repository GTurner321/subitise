class GameController {
    constructor() {
        this.iconRenderer = new IconRenderer();
        this.rainbow = new Rainbow();
        
        // Game state
        this.currentDifficulty = CONFIG.DIFFICULTY.EASY;
        this.currentAnswer = 0;
        this.correctStreak = 0;
        this.wrongStreak = 0;
        this.questionsInLevel = 0;
        this.gameComplete = false;
        
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
        
        this.rainbow.reset();
        this.modal.classList.add('hidden');
        this.startNewQuestion();
    }

    startNewQuestion() {
        if (this.gameComplete) {
            return;
        }

        // Generate random number of icons based on current difficulty
        const min = this.currentDifficulty.min;
        const max = this.currentDifficulty.max;
        this.currentAnswer = Math.floor(Math.random() * (max - min + 1)) + min;
        
        // Render the icons
        this.iconRenderer.renderIcons(this.currentAnswer);
        
        // Reset button states
        this.resetButtonStates();
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
                }, CONFIG.NEXT_QUESTION_DELAY);
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
        
        // Reset streak counter for new level
        this.correctStreak = 0;
        this.questionsInLevel = 0;
    }

    dropDifficulty() {
        if (this.currentDifficulty === CONFIG.DIFFICULTY.HARD) {
            this.currentDifficulty = CONFIG.DIFFICULTY.MEDIUM;
        } else if (this.currentDifficulty === CONFIG.DIFFICULTY.MEDIUM) {
            this.currentDifficulty = CONFIG.DIFFICULTY.EASY;
        }
        
        // Reset streak counters
        this.wrongStreak = 0;
        this.correctStreak = 0;
        this.questionsInLevel = 0;
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
