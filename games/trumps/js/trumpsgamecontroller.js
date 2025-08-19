class TrumpsGameController {
    constructor() {
        this.renderer = new TrumpsRenderer();
        
        // Game state
        this.availableCards = [];
        this.currentRound = 1;
        this.scores = { user: 0, computer: 0 };
        this.gamePhase = 'selection'; // 'selection', 'category', 'comparison', 'reset'
        this.selectedCards = { user: null, computer: null };
        this.gameComplete = false;
        
        // Track questions completed for different instructions
        this.questionsCompleted = 0;
        
        // Initialize celebration systems
        this.rainbow = null;
        this.bear = null;
        this.initializeCelebrationSystems();
        
        this.initializeGame();
        this.initializeEventListeners();
    }
    
    initializeCelebrationSystems() {
        // Initialize rainbow system
        try {
            if (window.Rainbow) {
                this.rainbow = new window.Rainbow();
                console.log('🌈 Rainbow celebration system initialized');
            }
        } catch (error) {
            console.warn('Rainbow system not available:', error);
        }
        
        // Initialize bear system
        try {
            if (window.Bear) {
                this.bear = new window.Bear();
                console.log('🐻 Bear celebration system initialized');
            }
        } catch (error) {
            console.warn('Bear system not available:', error);
        }
    }

initializeGame() {
    // Start game immediately
    this.availableCards = CONFIG.CARDS.map((card, index) => ({
        ...card,
        originalPosition: index
    }));
    
    this.startNewRound();
    
    // Preload in background (don't await)
    ImagePreloader.preloadImages().then(() => {
        console.log('Images preloaded in background');
    });
}

    initializeEventListeners() {
        // Handle card selection and category selection
        document.addEventListener('click', (e) => {
            this.handleClick(e);
        });
        
        // Handle play again button (delegated event handling)
        document.addEventListener('click', (e) => {
            if (e.target.id === 'playAgainBtn') {
                this.restartGame();
            }
        });
    }

    handleClick(e) {
        // Handle clicks on card slots in grid mode
        const cardSlot = e.target.closest('[data-card-id]');
        if (cardSlot && this.gamePhase === 'selection' && this.renderer.currentMode === 'grid') {
            this.handleCardSelection(parseInt(cardSlot.dataset.cardId));
            return;
        }
        
        // Handle clicks on category buttons in square mode
        const categoryButton = e.target.closest('[data-category]');
        if (categoryButton && this.gamePhase === 'category' && this.renderer.currentMode === 'square') {
            // Only allow clicks on user's card buttons (clickable class)
            if (categoryButton.classList.contains('clickable')) {
                this.handleCategorySelection(categoryButton.dataset.category);
            }
            return;
        }
    }

    startNewRound() {
        console.log(`Starting round ${this.currentRound}`);
        
        this.gamePhase = 'selection';
        this.selectedCards = { user: null, computer: null };
        
        // Render the current card grid
        this.renderer.renderCardGrid(this.availableCards);
        
        // Give instructions using universal audio system
        window.AudioSystem.speakText(`Round ${this.currentRound}. Choose a card.`);
    }

    async handleCardSelection(cardId) {
        if (this.gamePhase !== 'selection') return;
        
        // Find the selected card
        const userCard = this.availableCards.find(card => card.id === cardId);
        if (!userCard) return;
        
        this.selectedCards.user = userCard;
        
        // Computer selects a random card from remaining cards
        const remainingCards = this.availableCards.filter(card => card.id !== cardId);
        const computerCard = remainingCards[Math.floor(Math.random() * remainingCards.length)];
        this.selectedCards.computer = computerCard;
        
        console.log(`User selected: ${userCard.name}, Computer selected: ${computerCard.name}`);
        
        // Move to next phase
        this.gamePhase = 'category';
        
        // Animate card selection and movement to square layout
        await this.renderer.selectAndMoveCards(userCard, computerCard);
        
        // Give instruction for category selection - different for first vs subsequent questions
        if (this.questionsCompleted === 0) {
            // First question - longer explanation
            const longInstruction = 'Choose a category: Fun, Cuddles, or Stars. Fun goes up to 100%, cuddles goes up to 10, and the star rating is out of 5 stars';
            window.AudioSystem.speakText(longInstruction);
            
            // Calculate speech duration and wait before showing computer card back
            const speechDuration = this.calculateSpeechDuration(longInstruction);
            await this.renderer.wait(speechDuration);
        } else {
            // Subsequent questions - short instruction
            window.AudioSystem.speakText('Choose a category');
        }
    }

    calculateSpeechDuration(text) {
        // Estimate speech duration based on text length and speaking rate
        // Average speaking rate is about 150-200 words per minute
        // We use 180 WPM (3 words per second) for estimation
        const words = text.split(' ').length;
        const baseDuration = (words / 3) * 1000; // Convert to milliseconds
        
        // Add extra time for punctuation and natural pauses
        const punctuationCount = (text.match(/[,.!?:;]/g) || []).length;
        const pauseTime = punctuationCount * 300; // 300ms per punctuation mark
        
        // Add buffer time to ensure speech completes
        const bufferTime = 1000; // 1 second buffer
        
        return Math.max(baseDuration + pauseTime + bufferTime, 2000); // Minimum 2 seconds
    }

    async handleCategorySelection(category) {
        if (this.gamePhase !== 'category') return;
        
        console.log(`User selected category: ${category}`);
        
        this.gamePhase = 'comparison';
        
        // Wait 2 seconds before flipping computer's card
        await this.renderer.wait(1500);
        await this.renderer.flipCard(this.selectedCards.computer.id, 'computer');
        
        // Wait a moment for dramatic effect
        await this.renderer.wait(500);
        
        // Compare values and determine winner
        const result = this.compareCards(category);
        
        // Highlight winner and update scores
        this.renderer.highlightWinner(
            this.selectedCards.user, 
            this.selectedCards.computer, 
            category, 
            result
        );
        
        // Update scores based on result and provide audio feedback
        if (result === 'user') {
            this.scores.user++;
            window.AudioSystem.playCompletionSound();
            window.AudioSystem.speakText('You win this round!');
        } else if (result === 'computer') {
            this.scores.computer++;
            window.AudioSystem.playFailureSound();
            window.AudioSystem.speakText('Computer wins this round.');
        } else {
            // No sound method for neutral/draw in AudioSystem, so we'll use a tone
            window.AudioSystem.playTone(440, 0.2, 'sine', 0.2);
            window.AudioSystem.speakText('It\'s a draw! No points awarded.');
        }
        
        this.renderer.updateScores(this.scores.user, this.scores.computer);
        
        // Add rainbow piece after each round (celebration regardless of who wins)
        this.addRainbowPiece();
        
        // Wait to show result
        await this.renderer.wait(CONFIG.RESULT_DISPLAY_DURATION);
        
        // Remove used cards from available cards BEFORE any UI changes
        this.availableCards = this.availableCards.filter(
            card => card.id !== this.selectedCards.user.id && 
                   card.id !== this.selectedCards.computer.id
        );
        
        // Clear center cards (this will also call switchToGridLayout internally)
        await this.renderer.clearCenterCards();
        
        // Check if game is complete
        if (this.currentRound >= CONFIG.ROUNDS) {
            this.completeGame();
        } else {
            // Next round - the grid should already be showing the correct remaining cards
            this.currentRound++;
            this.questionsCompleted++; // Increment questions completed
            await this.renderer.wait(CONFIG.RESET_DELAY);
            this.startNewRound(); // This will re-render the grid with correct cards
        }
    }

    compareCards(category) {
        const userValue = this.selectedCards.user.stats[category];
        const computerValue = this.selectedCards.computer.stats[category];
        
        console.log(`Comparing ${category}: User ${userValue} vs Computer ${computerValue}`);
        
        if (userValue > computerValue) {
            return 'user';
        } else if (computerValue > userValue) {
            return 'computer';
        } else {
            return 'draw';
        }
    }

    addRainbowPiece() {
        if (this.rainbow) {
            const pieces = this.rainbow.addPiece();
            console.log(`🌈 Rainbow now has ${pieces} pieces`);
            
            // Special handling for 8th round - add the final 2 pieces
            if (this.currentRound === CONFIG.ROUNDS) {
                setTimeout(() => {
                    if (this.rainbow) {
                        this.rainbow.addPiece(); // 9th piece
                        console.log(`🌈 Rainbow now has ${this.rainbow.getPieces()} pieces`);
                        setTimeout(() => {
                            if (this.rainbow) {
                                this.rainbow.addPiece(); // 10th piece
                                console.log(`🌈 Rainbow now has ${this.rainbow.getPieces()} pieces - Complete!`);
                                // Final celebration is automatically triggered when rainbow is complete
                            }
                        }, 500);
                    }
                }, 1000);
            }
        }
    }

    completeGame() {
        this.gameComplete = true;
        console.log(`Game complete! Final score: User ${this.scores.user} - Computer ${this.scores.computer}`);
        
        // Show game complete modal
        this.renderer.showGameComplete();
        
        // Start bear celebration when modal appears
        if (this.bear) {
            setTimeout(() => {
                this.bear.startCelebration();
            }, 500); // Short delay after modal appears
        }
        
        // Give final message using universal audio system
        const finalMessage = `Congratulations! You completed all ${CONFIG.ROUNDS} rounds! Play again or return to the home page.`;
        
        setTimeout(() => {
            window.AudioSystem.speakText(finalMessage);
        }, 1000);
    }

    restartGame() {
        // Stop any ongoing celebrations
        if (this.rainbow) {
            this.rainbow.reset();
        }
        if (this.bear) {
            this.bear.stopCelebration();
        }
        
        // Reset all game state
        this.currentRound = 1;
        this.scores = { user: 0, computer: 0 };
        this.gamePhase = 'selection';
        this.selectedCards = { user: null, computer: null };
        this.gameComplete = false;
        this.questionsCompleted = 0; // Reset questions completed
        
        // Hide modal
        const modal = document.getElementById('gameModal');
        modal.classList.add('hidden');
        
        // Reset scores in renderer
        this.renderer.squareUserScoreElement.textContent = '0';
        this.renderer.squareComputerScoreElement.textContent = '0';
        
        // Reinitialize game
        this.initializeGame();
    }

    destroy() {
        // Clean up celebration systems
        if (this.rainbow) {
            this.rainbow.destroy();
        }
        if (this.bear) {
            this.bear.stopCelebration();
        }
        
        // Clean up renderer
        this.renderer.reset();
        
        // Universal AudioSystem will handle its own cleanup
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.trumpsGame = new TrumpsGameController();
});

// Clean up resources when page is about to unload
window.addEventListener('beforeunload', () => {
    if (window.trumpsGame) {
        window.trumpsGame.destroy();
    }
});
