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
        
        // Audio functionality
        this.audioEnabled = CONFIG.AUDIO_ENABLED;
        this.audioContext = null;
        
        this.initializeGame();
        this.initializeEventListeners();
        this.initializeAudio();
    }

    async initializeAudio() {
        if (!this.audioEnabled) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            this.audioEnabled = false;
        }
    }

    initializeGame() {
        // Initialize cards with original positions
        this.availableCards = CONFIG.CARDS.map((card, index) => ({
            ...card,
            originalPosition: index
        }));
        
        this.startNewRound();
    }

    initializeEventListeners() {
        // Handle card selection
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
        const target = e.target.closest('[data-card-id], [data-category]');
        if (!target) return;
        
        if (this.gamePhase === 'selection' && target.dataset.cardId) {
            this.handleCardSelection(parseInt(target.dataset.cardId));
        } else if (this.gamePhase === 'category' && target.dataset.category) {
            this.handleCategorySelection(target.dataset.category);
        }
    }

    startNewRound() {
        console.log(`Starting round ${this.currentRound}`);
        
        this.gamePhase = 'selection';
        this.selectedCards = { user: null, computer: null };
        
        // Render the current card grid
        this.renderer.renderCardGrid(this.availableCards);
        
        // Give instructions
        this.speakText(`Round ${this.currentRound}. Choose a card to play.`);
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
        
        // Animate card selection and movement
        await this.renderer.selectAndMoveCards(userCard, computerCard);
        
        // Flip user's card first
        await this.renderer.flipCard(userCard.id, 'user');
        
        // Give instruction for category selection
        this.speakText('Choose a category: Fun, Cuddles, or Stars.');
    }

    async handleCategorySelection(category) {
        if (this.gamePhase !== 'category') return;
        
        console.log(`User selected category: ${category}`);
        
        this.gamePhase = 'comparison';
        
        // Flip computer's card
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
        
        // Update scores based on result
        if (result === 'user') {
            this.scores.user++;
            this.playSuccessSound();
            this.speakText('You win this round!');
        } else if (result === 'computer') {
            this.scores.computer++;
            this.playFailureSound();
            this.speakText('Computer wins this round.');
        } else {
            this.playNeutralSound();
            this.speakText('It\'s a draw! No points awarded.');
        }
        
        this.renderer.updateScores(this.scores.user, this.scores.computer);
        
        // Wait to show result
        await this.renderer.wait(CONFIG.RESULT_DISPLAY_DURATION);
        
        // Remove used cards from available cards
        this.availableCards = this.availableCards.filter(
            card => card.id !== this.selectedCards.user.id && 
                   card.id !== this.selectedCards.computer.id
        );
        
        // Clear center cards
        await this.renderer.clearCenterCards();
        
        // Check if game is complete
        if (this.currentRound >= CONFIG.ROUNDS) {
            this.completeGame();
        } else {
            // Next round
            this.currentRound++;
            await this.renderer.wait(CONFIG.RESET_DELAY);
            this.startNewRound();
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

    completeGame() {
        this.gameComplete = true;
        console.log(`Game complete! Final score: User ${this.scores.user} - Computer ${this.scores.computer}`);
        
        // Show game complete modal
        this.renderer.showGameComplete(this.scores.user, this.scores.computer);
        
        // Give final message
        let finalMessage;
        if (this.scores.user > this.scores.computer) {
            finalMessage = `Congratulations! You won ${this.scores.user} to ${this.scores.computer}!`;
        } else if (this.scores.computer > this.scores.user) {
            finalMessage = `Good game! The computer won ${this.scores.computer} to ${this.scores.user}.`;
        } else {
            finalMessage = `Amazing! It's a ${this.scores.user} to ${this.scores.computer} draw!`;
        }
        
        setTimeout(() => {
            this.speakText(finalMessage + ' Play again or return to the home page.');
        }, 1000);
    }

    restartGame() {
        // Reset all game state
        this.currentRound = 1;
        this.scores = { user: 0, computer: 0 };
        this.gamePhase = 'selection';
        this.selectedCards = { user: null, computer: null };
        this.gameComplete = false;
        
        // Hide modal
        const modal = document.getElementById('gameModal');
        modal.classList.add('hidden');
        
        // Reinitialize game
        this.initializeGame();
    }

    // Audio feedback methods
    playSuccessSound() {
        if (!this.audioEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Happy ascending tone
            oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime);
            oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(783.99, this.audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('Audio error:', error);
        }
    }

    playNeutralSound() {
        if (!this.audioEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Neutral tone
            oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.2);
        } catch (error) {
            console.log('Audio error:', error);
        }
    }

    speakText(text) {
        if (!this.audioEnabled) return;
        
        try {
            if ('speechSynthesis' in window) {
                speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = 0.9;
                utterance.pitch = 1.1;
                utterance.volume = 0.8;
                
                speechSynthesis.speak(utterance);
            }
        } catch (error) {
            console.log('Speech error:', error);
        }
    }

    destroy() {
        // Clean up audio
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        // Clean up renderer
        this.renderer.reset();
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
