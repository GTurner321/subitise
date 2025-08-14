class Trumps2GameController {
    constructor() {
        this.renderer = new Trumps2Renderer();
        
        // Game state
        this.availableCards = [];
        this.currentRound = 1;
        this.scores = { user: 0, playerA: 0, playerB: 0 };
        this.gamePhase = 'selection'; // 'selection', 'comparison', 'ai_turn', 'result', 'reset'
        this.selectedCards = [];
        this.gameComplete = false;
        
        // Player names - ensure they are different
        this.playerNames = this.generateUniquePlayerNames();
        
        // Round state
        this.userSelectedPosition = null;
        this.revealedCards = new Set();
        this.roundResults = [];
        this.currentTurn = null;
        
        // AI decision making
        this.aiFirstPlayer = Math.random() < 0.5 ? 'playerA' : 'playerB';
        
        // Initialize celebration systems
        this.rainbow = null;
        this.bear = null;
        this.initializeCelebrationSystems();
        
        this.initializeGame();
        this.initializeEventListeners();
    }
    
    generateUniquePlayerNames() {
        const playerA = AudioUtils.getRandomPlayerName();
        let playerB;
        
        // Ensure playerB is different from playerA
        do {
            playerB = AudioUtils.getRandomPlayerName();
        } while (playerB === playerA);
        
        return { playerA, playerB };
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
        // Set up available cards with original positions
        this.availableCards = CONFIG.CARDS.map((card, index) => ({
            ...card,
            originalPosition: index
        }));
        
        // Set player names in the renderer
        this.renderer.setPlayerNames(this.playerNames.playerA, this.playerNames.playerB);
        
        this.startNewRound();
        
        // Preload images in background
        ImagePreloader.preloadImages().then(() => {
            console.log('Images preloaded in background');
        });
    }

    initializeEventListeners() {
        // Handle card selection
        document.addEventListener('click', (e) => {
            this.handleClick(e);
        });
        
        // Handle play again button
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
        
        // Handle clicks on cards in rectangular mode
        const rectCard = e.target.closest('.rect-card');
        if (rectCard && this.gamePhase === 'comparison' && this.renderer.currentMode === 'rect') {
            const position = rectCard.dataset.position;
            this.handleUserCardChoice(position);
            return;
        }
    }

    startNewRound() {
        console.log(`Starting round ${this.currentRound}`);
        
        this.gamePhase = 'selection';
        this.selectedCards = [];
        this.userSelectedPosition = null;
        this.revealedCards.clear();
        this.roundResults = [];
        this.currentTurn = null;
        
        // Alternate who goes first each round
        this.aiFirstPlayer = this.currentRound % 2 === 1 ? 'playerA' : 'playerB';
        
        // Render the current card grid
        this.renderer.renderCardGrid(this.availableCards);
        
        // Give instructions
        const message = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.ROUND_START, {
            round: this.currentRound
        });
        window.AudioSystem.speakText(message);
    }

    async handleCardSelection(cardId) {
        if (this.gamePhase !== 'selection' || this.selectedCards.length >= CONFIG.CARDS_PER_ROUND) return;
        
        // Find the selected card
        const selectedCard = this.availableCards.find(card => card.id === cardId);
        if (!selectedCard) return;
        
        // Add to selected cards
        this.selectedCards.push(selectedCard);
        
        // Visual feedback
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
        if (cardElement) {
            cardElement.classList.add('card-selected');
        }
        
        console.log(`Selected card ${this.selectedCards.length}: ${selectedCard.name} (${selectedCard.value})`);
        
        // Check if we have 3 cards
        if (this.selectedCards.length === CONFIG.CARDS_PER_ROUND) {
            // Move to comparison phase
            this.gamePhase = 'comparison';
            
            // Animate card selection and movement to rectangular layout
            await this.renderer.selectAndMoveCards(this.selectedCards);
            
            // Give instruction for card choice
            window.AudioSystem.speakText(CONFIG.AUDIO_MESSAGES.CARD_SELECTION_PHASE);
        }
    }

    async handleUserCardChoice(position) {
        if (this.gamePhase !== 'comparison' || this.userSelectedPosition !== null) return;
        
        this.userSelectedPosition = position;
        this.gamePhase = 'ai_turn';
        
        // Get the selected card
        const positionIndex = position === 'left' ? 0 : position === 'middle' ? 1 : 2;
        const selectedCard = this.selectedCards[positionIndex];
        
        // Announce user's choice
        const userMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.USER_CARD_SELECTED, {
            number: selectedCard.value,
            animal: selectedCard.name
        });
        window.AudioSystem.speakText(userMessage);
        
        // Mark user's card as revealed
        this.revealedCards.add(position);
        
        // Wait for speech to finish
        await this.wait(CONFIG.SPEECH_COMPLETION_BUFFER);
        
        // Now handle AI decisions
        await this.handleAIDecisions(selectedCard, position);
    }

    async handleAIDecisions(userCard, userPosition) {
        const remainingPositions = ['left', 'middle', 'right'].filter(pos => pos !== userPosition);
        const remainingCards = this.selectedCards.filter((_, index) => {
            const cardPosition = index === 0 ? 'left' : index === 1 ? 'middle' : 'right';
            return cardPosition !== userPosition;
        });
        
        let firstAIPosition, secondAIPosition, firstAICard, secondAICard;
        
        if (userPosition === 'left') {
            // User picked left card, AI needs to decide between middle and right
            const leftCardValue = userCard.value;
            
            if (leftCardValue < 15) {
                // AI first player chooses one of the remaining cards
                const chosenIndex = Math.random() < 0.5 ? 0 : 1;
                firstAIPosition = remainingPositions[chosenIndex];
                secondAIPosition = remainingPositions[1 - chosenIndex];
                firstAICard = remainingCards[chosenIndex];
                secondAICard = remainingCards[1 - chosenIndex];
                
                // Announce first AI player's choice
                const firstChoiceMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.AI_CHOOSES_CARD, {
                    player: this.playerNames[this.aiFirstPlayer],
                    position: AudioUtils.getPositionName(firstAIPosition)
                });
                window.AudioSystem.speakText(firstChoiceMessage);
                
                await this.wait(CONFIG.PAUSE_BETWEEN_REVEALS);
                
                // Reveal first AI card
                await this.renderer.revealCard(firstAICard, firstAIPosition);
                this.revealedCards.add(firstAIPosition);
                
                const firstRevealMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.AI_REVEALED, {
                    player: this.playerNames[this.aiFirstPlayer],
                    number: firstAICard.value,
                    animal: firstAICard.name
                });
                window.AudioSystem.speakText(firstRevealMessage);
                
                await this.wait(CONFIG.PAUSE_BETWEEN_REVEALS);
                
                // Second AI player gets the remaining card
                const secondPlayerName = this.aiFirstPlayer === 'playerA' ? this.playerNames.playerB : this.playerNames.playerA;
                const secondRevealMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.AI_REVEALED, {
                    player: secondPlayerName,
                    number: secondAICard.value,
                    animal: secondAICard.name
                });
                
                await this.renderer.revealCard(secondAICard, secondAIPosition);
                this.revealedCards.add(secondAIPosition);
                window.AudioSystem.speakText(secondRevealMessage);
                
            } else {
                // AI first player chooses the left card (user's card)
                const firstTakeMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.AI_TAKES_FIRST, {
                    player: this.playerNames[this.aiFirstPlayer]
                });
                window.AudioSystem.speakText(firstTakeMessage);
                
                await this.wait(CONFIG.PAUSE_BETWEEN_REVEALS);
                
                // Remaining cards go to the other AI player
                const chosenIndex = Math.random() < 0.5 ? 0 : 1;
                secondAIPosition = remainingPositions[chosenIndex];
                secondAICard = remainingCards[chosenIndex];
                
                const secondPlayerName = this.aiFirstPlayer === 'playerA' ? this.playerNames.playerB : this.playerNames.playerA;
                const secondRevealMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.AI_REVEALED, {
                    player: secondPlayerName,
                    number: secondAICard.value,
                    animal: secondAICard.name
                });
                
                await this.renderer.revealCard(secondAICard, secondAIPosition);
                this.revealedCards.add(secondAIPosition);
                window.AudioSystem.speakText(secondRevealMessage);
                
                // Set AI assignments
                firstAIPosition = userPosition; // First AI gets user's card
                firstAICard = userCard;
            }
        } else {
            // User picked middle or right card - reveal user's card first
            await this.renderer.revealCard(userCard, userPosition);
            
            await this.wait(1000);
            
            // Check left card value for AI decision
            const leftCard = this.selectedCards[0];
            const leftCardValue = leftCard.value;
            
            if (leftCardValue < 15) {
                // First AI player chooses the other non-user card
                const nonUserPositions = remainingPositions.filter(pos => pos !== 'left');
                firstAIPosition = nonUserPositions[0];
                firstAICard = remainingCards.find((_, index) => {
                    const cardPos = remainingPositions[index];
                    return cardPos === firstAIPosition;
                });
                
                const firstSelectMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.AI_TAKES_REMAINING, {
                    player: this.playerNames[this.aiFirstPlayer],
                    position: AudioUtils.getPositionName(firstAIPosition)
                });
                window.AudioSystem.speakText(firstSelectMessage);
                
                await this.wait(CONFIG.PAUSE_BETWEEN_REVEALS);
                
                // Second AI player gets the left card
                secondAIPosition = 'left';
                secondAICard = leftCard;
                
                const secondPlayerName = this.aiFirstPlayer === 'playerA' ? this.playerNames.playerB : this.playerNames.playerA;
                const secondRevealMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.AI_REVEALED, {
                    player: secondPlayerName,
                    number: secondAICard.value,
                    animal: secondAICard.name
                });
                
                await this.renderer.revealCard(secondAICard, secondAIPosition);
                this.revealedCards.add(secondAIPosition);
                window.AudioSystem.speakText(secondRevealMessage);
                
                await this.wait(CONFIG.PAUSE_BETWEEN_REVEALS);
                
                // Reveal first AI card
                await this.renderer.revealCard(firstAICard, firstAIPosition);
                this.revealedCards.add(firstAIPosition);
                
                const firstRevealMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.AI_REVEALED, {
                    player: this.playerNames[this.aiFirstPlayer],
                    number: firstAICard.value,
                    animal: firstAICard.name
                });
                window.AudioSystem.speakText(firstRevealMessage);
                
            } else {
                // First AI player chooses the left card
                firstAIPosition = 'left';
                firstAICard = leftCard;
                
                const firstSelectMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.AI_TAKES_FIRST, {
                    player: this.playerNames[this.aiFirstPlayer]
                });
                window.AudioSystem.speakText(firstSelectMessage);
                
                await this.wait(1500);
                
                // Reveal first AI card
                await this.renderer.revealCard(firstAICard, firstAIPosition);
                this.revealedCards.add(firstAIPosition);
                
                const firstRevealMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.AI_REVEALED, {
                    player: this.playerNames[this.aiFirstPlayer],
                    number: firstAICard.value,
                    animal: firstAICard.name
                });
                window.AudioSystem.speakText(firstRevealMessage);
                
                await this.wait(1500);
                
                // Second AI player gets the remaining card
                const remainingPosition = remainingPositions.find(pos => pos !== firstAIPosition);
                secondAIPosition = remainingPosition;
                secondAICard = remainingCards.find((_, index) => {
                    const cardPos = remainingPositions[index];
                    return cardPos === secondAIPosition;
                });
                
                const secondPlayerName = this.aiFirstPlayer === 'playerA' ? this.playerNames.playerB : this.playerNames.playerA;
                const secondRevealMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.AI_REVEALED, {
                    player: secondPlayerName,
                    number: secondAICard.value,
                    animal: secondAICard.name
                });
                
                await this.renderer.revealCard(secondAICard, secondAIPosition);
                this.revealedCards.add(secondAIPosition);
                window.AudioSystem.speakText(secondRevealMessage);
            }
        }
        
        await this.wait(1500);
        
        // Determine winners and update scores
        this.determineRoundWinner(userCard, firstAICard, secondAICard, userPosition, firstAIPosition, secondAIPosition);
    }

    determineRoundWinner(userCard, firstAICard, secondAICard, userPos, firstAIPos, secondAIPos) {
        const cards = [
            { card: userCard, player: 'user', position: userPos },
            { card: firstAICard, player: this.aiFirstPlayer, position: firstAIPos },
            { card: secondAICard, player: this.aiFirstPlayer === 'playerA' ? 'playerB' : 'playerA', position: secondAIPos }
        ];
        
        // Find the highest value
        const maxValue = Math.max(...cards.map(c => c.card.value));
        const winners = cards.filter(c => c.card.value === maxValue);
        
        let results = ['loser', 'loser', 'loser'];
        let winnerName = '';
        
        if (winners.length === 1) {
            // Single winner
            const winner = winners[0];
            const winnerIndex = cards.findIndex(c => c.position === winner.position);
            results[winnerIndex] = 'winner';
            
            // Update scores
            this.scores[winner.player]++;
            
            // Get winner name for announcement
            if (winner.player === 'user') {
                winnerName = 'You';
            } else {
                winnerName = this.playerNames[winner.player];
            }
            
            // Play appropriate sound
            if (winner.player === 'user') {
                window.AudioSystem.playCompletionSound();
            } else {
                window.AudioSystem.playFailureSound();
            }
            
        } else {
            // Draw (multiple winners)
            winners.forEach(winner => {
                const winnerIndex = cards.findIndex(c => c.position === winner.position);
                results[winnerIndex] = 'draw';
            });
            
            // Play neutral sound
            window.AudioSystem.playTone(440, 0.2, 'sine', 0.2);
            winnerName = 'draw';
        }
        
        // Visual feedback
        this.renderer.highlightWinner(null, results);
        this.renderer.updateScores(this.scores.user, this.scores.playerA, this.scores.playerB);
        
        // Announce winner
        if (winnerName === 'draw') {
            window.AudioSystem.speakText(CONFIG.AUDIO_MESSAGES.DRAW_ANNOUNCEMENT);
        } else {
            const winnerMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.WINNER_ANNOUNCEMENT, {
                winner: winnerName
            });
            window.AudioSystem.speakText(winnerMessage);
        }
        
        // Add rainbow piece
        this.addRainbowPiece();
        
        // Continue to next round
        setTimeout(() => {
            this.completeRound();
        }, CONFIG.RESULT_DISPLAY_DURATION);
    }

    addRainbowPiece() {
        if (this.rainbow) {
            const pieces = this.rainbow.addPiece();
            console.log(`🌈 Rainbow now has ${pieces} pieces`);
            
            // Special handling for 10th round - add the final rainbow piece
            if (this.currentRound === CONFIG.ROUNDS) {
                setTimeout(() => {
                    if (this.rainbow) {
                        this.rainbow.addPiece(); // Final piece to complete rainbow
                        console.log(`🌈 Rainbow now has ${this.rainbow.getPieces()} pieces - Complete!`);
                    }
                }, 1000);
            }
        }
    }

    async completeRound() {
        // Remove used cards from available cards
        this.availableCards = this.availableCards.filter(
            card => !this.selectedCards.some(selected => selected.id === card.id)
        );
        
        // Clear the rectangular cards
        await this.renderer.clearRectCards();
        
        // Check if game is complete
        if (this.currentRound >= CONFIG.ROUNDS) {
            this.completeGame();
        } else {
            // Next round
            this.currentRound++;
            await this.wait(CONFIG.RESET_DELAY);
            this.startNewRound();
        }
    }

    completeGame() {
        this.gameComplete = true;
        console.log(`Game complete! Final scores: User ${this.scores.user} - ${this.playerNames.playerA} ${this.scores.playerA} - ${this.playerNames.playerB} ${this.scores.playerB}`);
        
        // Show game complete modal
        this.renderer.showGameComplete();
        
        // Start bear celebration when modal appears
        if (this.bear) {
            setTimeout(() => {
                this.bear.startCelebration();
            }, 500);
        }
        
        // Give final message
        const finalMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.GAME_COMPLETE, {
            rounds: CONFIG.ROUNDS
        });
        
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
        this.scores = { user: 0, playerA: 0, playerB: 0 };
        this.gamePhase = 'selection';
        this.selectedCards = [];
        this.gameComplete = false;
        this.userSelectedPosition = null;
        this.revealedCards.clear();
        this.roundResults = [];
        
        // Generate new unique player names
        this.playerNames = this.generateUniquePlayerNames();
        
        // Hide modal
        const modal = document.getElementById('gameModal');
        modal.classList.add('hidden');
        
        // Reset renderer
        this.renderer.reset();
        
        // Reinitialize game
        this.initializeGame();
    }

    // Utility method for waiting
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.trumps2Game = new Trumps2GameController();
});

// Clean up resources when page is about to unload
window.addEventListener('beforeunload', () => {
    if (window.trumps2Game) {
        window.trumps2Game.destroy();
    }
});
