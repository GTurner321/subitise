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
        this.questionsCompleted = 0; // Track total questions for different instructions
        
        // Mute button references
        this.muteButton = null;
        this.muteContainer = null;
        
        this.initializeGame();
        this.initializeEventListeners();
        this.initializeAudio();
        this.createMuteButton();
    }

    createMuteButton() {
        // Create mute button container
        const muteContainer = document.createElement('div');
        muteContainer.style.position = 'fixed';
        muteContainer.style.top = '20px';
        muteContainer.style.right = '20px';
        muteContainer.style.zIndex = '1000';
        muteContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        muteContainer.style.borderRadius = '50%';
        muteContainer.style.width = '60px';
        muteContainer.style.height = '60px';
        muteContainer.style.display = 'flex';
        muteContainer.style.alignItems = 'center';
        muteContainer.style.justifyContent = 'center';
        muteContainer.style.cursor = 'pointer';
        muteContainer.style.transition = 'all 0.3s ease';
        muteContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        
        // Create button
        this.muteButton = document.createElement('button');
        this.muteButton.style.background = 'none';
        this.muteButton.style.border = 'none';
        this.muteButton.style.color = 'white';
        this.muteButton.style.fontSize = '24px';
        this.muteButton.style.cursor = 'pointer';
        this.muteButton.style.width = '100%';
        this.muteButton.style.height = '100%';
        this.muteButton.style.display = 'flex';
        this.muteButton.style.alignItems = 'center';
        this.muteButton.style.justifyContent = 'center';
        
        // Set initial icon
        this.updateMuteButtonIcon();
        
        // Add event listeners
        this.muteButton.addEventListener('click', () => this.toggleAudio());
        this.muteButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.toggleAudio();
        });
        
        // Hover effects
        muteContainer.addEventListener('mouseenter', () => {
            muteContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
            muteContainer.style.transform = 'scale(1.1)';
        });
        
        muteContainer.addEventListener('mouseleave', () => {
            muteContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            muteContainer.style.transform = 'scale(1)';
        });
        
        muteContainer.appendChild(this.muteButton);
        document.body.appendChild(muteContainer);
        
        this.muteContainer = muteContainer;
    }

    updateMuteButtonIcon() {
        if (this.muteButton) {
            this.muteButton.innerHTML = this.audioEnabled ? '🔊' : '🔇';
            this.muteButton.title = this.audioEnabled ? 'Mute Audio' : 'Unmute Audio';
        }
    }

    toggleAudio() {
        this.audioEnabled = !this.audioEnabled;
        this.updateMuteButtonIcon();
        
        // Stop any current speech
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        // Provide feedback
        if (this.audioEnabled) {
            setTimeout(() => {
                this.speakText('Sound on');
            }, 100);
        }
    }
        if (!this.audioEnabled) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            this.audioEnabled = false;
        }
    }

    async initializeAudio() {
        if (!this.audioEnabled) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            this.audioEnabled = false;
        }
    }
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
        
        // Give instructions - shortened message
        this.speakText(`Round ${this.currentRound}. Choose a card.`);
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
            this.questionsCompleted++; // Increment questions completed
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
            finalMessage = `Congratulations! You won ${this.scores.user} to ${this.scores.computer}! Play again or return to the home page.`;
        } else if (this.scores.computer > this.scores.user) {
            finalMessage = `Good game! The computer won this time, ${this.scores.computer} to ${this.scores.user}. Play again or return to the home page.`;
        } else {
            finalMessage = `It's a ${this.scores.user} to ${this.scores.computer} draw! Play again or return to the home page.`;
        }
        
        setTimeout(() => {
            this.speakText(finalMessage);
        }, 1000);
    }

    restartGame() {
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
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
        } catch (error) {
            // Silent failure
        }
    }

    playFailureSound() {
        if (!this.audioEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        } catch (error) {
            // Silent failure
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
            // Silent failure
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
            // Silent failure
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
        
        // Clean up mute button
        if (this.muteContainer && this.muteContainer.parentNode) {
            this.muteContainer.parentNode.removeChild(this.muteContainer);
        }
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
