// Clean Animal Trumps Game Controller - Version 1.0
console.log('🔄 Loading Clean Trumps2 Game Controller v1.0');

class Trumps2GameController {
    constructor() {
        console.log('🚀 Clean Constructor Starting');
        
        // Initialize properties only - NO GAME STARTING
        this.initializeProperties();
        this.initializeComponents();
        this.setupEventListeners();
        
        // Show choice modal after brief delay
        setTimeout(() => {
            this.displayGameChoice();
        }, 500);
        
        console.log('✅ Constructor Complete - Waiting for User Choice');
    }
    
    initializeProperties() {
        console.log('📋 Initializing Properties');
        
        // Game state
        this.gamePhase = 'waiting';
        this.currentRound = 1;
        this.scores = { user: 0, playerA: 0, playerB: 0 };
        this.selectedCards = [];
        this.availableCards = [];
        this.gameComplete = false;
        
        // Player state
        this.playerNames = this.generateUniquePlayerNames();
        this.firstCardSelection = true;
        this.userSelectedPosition = null;
        this.revealedCards = new Set();
        this.roundResults = [];
        this.currentTurn = null;
        this.aiFirstPlayer = Math.random() < 0.5 ? 'playerA' : 'playerB';
        
        console.log('✅ Properties Initialized');
    }
    
    initializeComponents() {
        console.log('🔧 Initializing Components');
        
        // Create renderer
        this.renderer = new Trumps2Renderer();
        
        // Initialize celebration systems
        this.rainbow = null;
        this.bear = null;
        this.setupCelebrationSystems();
        
        // Create game choice modal
        this.gameChoice = new GameChoice();
        
        console.log('✅ Components Initialized');
    }
    
    setupCelebrationSystems() {
        // Initialize rainbow system
        try {
            if (window.Rainbow) {
                this.rainbow = new window.Rainbow();
                console.log('🌈 Rainbow system ready');
            }
        } catch (error) {
            console.warn('Rainbow system not available:', error);
        }
        
        // Initialize bear system
        try {
            if (window.Bear) {
                this.bear = new window.Bear();
                console.log('🐻 Bear system ready');
            }
        } catch (error) {
            console.warn('Bear system not available:', error);
        }
    }
    
    setupEventListeners() {
        console.log('📡 Setting up Event Listeners');
        
        // Main click handler
        document.addEventListener('click', (e) => {
            this.handleAllClicks(e);
        });
        
        // Touch support
        document.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleAllClicks(e);
        });
        
        // Keyboard shortcuts for testing
        document.addEventListener('keydown', (e) => {
            if (e.key === 's' || e.key === 'S') {
                console.log('🎮 Manual game start triggered');
                this.startAnimalTrumpsGame();
            }
            if (e.key === 'g' || e.key === 'G') {
                console.log('🎪 Manual game choice triggered');
                this.displayGameChoice();
            }
        });
        
        console.log('✅ Event Listeners Ready');
        console.log('💡 Press S to start Animal Trumps, G to show choice');
    }
    
    handleAllClicks(e) {
        console.log('🖱️ Click:', e.target.tagName, e.target.className);
        console.log('🎯 Phase:', this.gamePhase, 'Mode:', this.renderer?.currentMode);
        
        // Handle different game phases
        if (this.gamePhase === 'waiting') {
            console.log('⏳ Game waiting - clicks ignored');
            return;
        }
        
        if (this.gamePhase === 'selection' && this.renderer.currentMode === 'grid') {
            this.handleGridClick(e);
        }
        
        if (this.gamePhase === 'comparison' && this.renderer.currentMode === 'rect') {
            this.handleRectClick(e);
        }
        
        // Handle play again button
        if (e.target.id === 'playAgainBtn') {
            this.restartGame();
        }
    }
    
    handleGridClick(e) {
        const cardSlot = e.target.closest('[data-card-id]');
        if (cardSlot) {
            const cardId = parseInt(cardSlot.dataset.cardId);
            console.log('🃏 Grid card clicked:', cardId);
            this.selectCard(cardId);
        }
    }
    
    handleRectClick(e) {
        // Check for card containers first
        const rectCard = e.target.closest('.rect-card');
        const rectCardBack = e.target.closest('.rect-card-back');
        
        let position = null;
        
        if (rectCardBack && rectCardBack.dataset.position) {
            position = rectCardBack.dataset.position;
            console.log('🔵 Card back clicked:', position);
        } else if (rectCard && rectCard.dataset.position) {
            position = rectCard.dataset.position;
            console.log('🟡 Card front clicked:', position);
        } else {
            // Check for card elements with position data
            const cardElement = e.target.closest('[data-position]');
            if (cardElement && cardElement.dataset.position) {
                position = cardElement.dataset.position;
                console.log('🟢 Card element clicked:', position);
            } else {
                // Fallback: parse from class names
                const element = e.target.closest('.left-title, .left-picture, .left-number, .middle-title, .middle-picture, .middle-number, .right-title, .right-picture, .right-number');
                if (element) {
                    const classes = element.className;
                    if (classes.includes('left-')) position = 'left';
                    else if (classes.includes('middle-')) position = 'middle';
                    else if (classes.includes('right-')) position = 'right';
                    console.log('🔍 Position from class:', position);
                }
            }
        }
        
        if (position) {
            console.log('✅ User selected card:', position);
            this.selectUserCard(position);
        } else {
            console.log('❌ No valid card position found');
        }
    }
    
    displayGameChoice() {
        console.log('🎪 Displaying Game Choice Modal');
        
        if (this.gameChoice) {
            this.gameChoice.show((selectedGame) => {
                console.log('🎮 User selected:', selectedGame);
                if (selectedGame === 'animal') {
                    this.startAnimalTrumpsGame();
                }
                // Teddy redirects are handled by GameChoice class
            });
        } else {
            console.error('❌ GameChoice not available');
        }
    }
    
    startAnimalTrumpsGame() {
        console.log('🦁 Starting Animal Trumps Game');
        
        this.gamePhase = 'selection';
        this.setupGameCards();
        this.renderer.setPlayerNames(this.playerNames.playerA, this.playerNames.playerB);
        this.startNewRound();
        
        // Preload images
        ImagePreloader.preloadImages().then(() => {
            console.log('🖼️ Images preloaded');
        });
    }
    
    setupGameCards() {
        this.availableCards = CONFIG.CARDS.map((card, index) => ({
            ...card,
            originalPosition: index
        }));
        console.log('🃏 Game cards ready:', this.availableCards.length);
    }
    
    startNewRound() {
        console.log(`🎯 Starting Round ${this.currentRound}`);
        
        this.gamePhase = 'selection';
        this.selectedCards = [];
        this.userSelectedPosition = null;
        this.revealedCards.clear();
        this.roundResults = [];
        this.currentTurn = null;
        
        // Alternate AI first player
        this.aiFirstPlayer = this.currentRound % 2 === 1 ? 'playerA' : 'playerB';
        
        // Render grid
        this.renderer.renderCardGrid(this.availableCards);
        
        // Audio instruction
        if (this.currentRound === 1) {
            window.AudioSystem.speakText(CONFIG.AUDIO_MESSAGES.GAME_START);
        } else {
            window.AudioSystem.speakText(CONFIG.AUDIO_MESSAGES.ROUND_START);
        }
    }
    
    selectCard(cardId) {
        if (this.gamePhase !== 'selection' || this.selectedCards.length >= CONFIG.CARDS_PER_ROUND) {
            return;
        }
        
        const selectedCard = this.availableCards.find(card => card.id === cardId);
        if (!selectedCard) return;
        
        this.selectedCards.push(selectedCard);
        console.log(`✅ Selected card ${this.selectedCards.length}: ${selectedCard.name} (${selectedCard.value})`);
        
        // Visual feedback
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
        if (cardElement) {
            cardElement.classList.add('card-selected');
        }
        
        if (this.selectedCards.length === CONFIG.CARDS_PER_ROUND) {
            this.moveToComparisonPhase();
        }
    }
    
    async moveToComparisonPhase() {
        console.log('🔄 Moving to Comparison Phase');
        
        this.gamePhase = 'comparison';
        
        // Animate transition
        await this.renderer.selectAndMoveCards(this.selectedCards);
        
        // Audio instruction
        if (this.firstCardSelection) {
            const message = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.CARD_SELECTION_PHASE_START, {
                playerA: this.playerNames.playerA,
                playerB: this.playerNames.playerB
            });
            window.AudioSystem.speakText(message);
            this.firstCardSelection = false;
        } else {
            window.AudioSystem.speakText(CONFIG.AUDIO_MESSAGES.CARD_SELECTION_PHASE);
        }
    }
    
    async selectUserCard(position) {
        if (this.gamePhase !== 'comparison' || this.userSelectedPosition !== null) {
            return;
        }
        
        this.userSelectedPosition = position;
        this.gamePhase = 'ai_turn';
        
        // Get selected card
        const positionIndex = position === 'left' ? 0 : position === 'middle' ? 1 : 2;
        const selectedCard = this.selectedCards[positionIndex];
        
        console.log(`🎯 User selected: ${position} (${selectedCard.name} - ${selectedCard.value})`);
        
        // Announce user choice
        const userMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.USER_CARD_SELECTED, {
            number: selectedCard.value,
            animal: selectedCard.name
        });
        window.AudioSystem.speakText(userMessage);
        
        this.revealedCards.add(position);
        
        // Wait for speech then handle AI
        await this.wait(CONFIG.SPEECH_COMPLETION_BUFFER);
        await this.handleAIDecisions(selectedCard, position);
    }
    
    async handleAIDecisions(userCard, userPosition) {
        console.log('🤖 AI Making Decisions');
        
        const remainingPositions = ['left', 'middle', 'right'].filter(pos => pos !== userPosition);
        const remainingCards = this.selectedCards.filter((_, index) => {
            const cardPosition = index === 0 ? 'left' : index === 1 ? 'middle' : 'right';
            return cardPosition !== userPosition;
        });
        
        let firstAIPosition, secondAIPosition, firstAICard, secondAICard;
        
        if (userPosition === 'left') {
            // User picked first card
            const leftCardValue = userCard.value;
            
            if (leftCardValue < 15) {
                // AI chooses one of remaining cards
                const chosenIndex = Math.random() < 0.5 ? 0 : 1;
                firstAIPosition = remainingPositions[chosenIndex];
                secondAIPosition = remainingPositions[1 - chosenIndex];
                firstAICard = remainingCards[chosenIndex];
                secondAICard = remainingCards[1 - chosenIndex];
                
                await this.announceAndRevealAI(firstAICard, firstAIPosition, this.aiFirstPlayer);
                await this.wait(CONFIG.PAUSE_BETWEEN_REVEALS);
                
                const secondPlayerName = this.aiFirstPlayer === 'playerA' ? this.playerNames.playerB : this.playerNames.playerA;
                await this.announceAICard(secondAICard, secondAIPosition, secondPlayerName);
                
            } else {
                // AI takes first card
                firstAIPosition = userPosition;
                firstAICard = userCard;
                
                const takeFirstMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.AI_TAKES_FIRST, {
                    player: this.playerNames[this.aiFirstPlayer]
                });
                window.AudioSystem.speakText(takeFirstMessage);
                
                await this.wait(CONFIG.PAUSE_BETWEEN_REVEALS);
                
                const chosenIndex = Math.random() < 0.5 ? 0 : 1;
                secondAIPosition = remainingPositions[chosenIndex];
                secondAICard = remainingCards[chosenIndex];
                
                const secondPlayerName = this.aiFirstPlayer === 'playerA' ? this.playerNames.playerB : this.playerNames.playerA;
                await this.announceAICard(secondAICard, secondAIPosition, secondPlayerName);
            }
        } else {
            // User picked middle or right card
            await this.renderer.revealCard(userCard, userPosition);
            await this.wait(1000);
            
            const leftCard = this.selectedCards[0];
            
            if (leftCard.value < 15) {
                // First AI takes remaining non-left card
                const nonUserPositions = remainingPositions.filter(pos => pos !== 'left');
                firstAIPosition = nonUserPositions[0];
                firstAICard = remainingCards.find((_, index) => {
                    const cardPos = remainingPositions[index];
                    return cardPos === firstAIPosition;
                });
                
                const selectMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.AI_TAKES_REMAINING, {
                    player: this.playerNames[this.aiFirstPlayer],
                    position: AudioUtils.getPositionName(firstAIPosition)
                });
                window.AudioSystem.speakText(selectMessage);
                
                await this.wait(CONFIG.PAUSE_BETWEEN_REVEALS);
                
                secondAIPosition = 'left';
                secondAICard = leftCard;
                
                const secondPlayerName = this.aiFirstPlayer === 'playerA' ? this.playerNames.playerB : this.playerNames.playerA;
                await this.announceAICard(secondAICard, secondAIPosition, secondPlayerName);
                
                await this.wait(CONFIG.PAUSE_BETWEEN_REVEALS);
                await this.announceAndRevealAI(firstAICard, firstAIPosition, this.aiFirstPlayer);
                
            } else {
                // First AI takes left card
                firstAIPosition = 'left';
                firstAICard = leftCard;
                
                const selectFirstMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.AI_TAKES_FIRST, {
                    player: this.playerNames[this.aiFirstPlayer]
                });
                window.AudioSystem.speakText(selectFirstMessage);
                
                await this.wait(CONFIG.PAUSE_BETWEEN_REVEALS);
                await this.announceAndRevealAI(firstAICard, firstAIPosition, this.aiFirstPlayer);
                
                await this.wait(CONFIG.PAUSE_BETWEEN_REVEALS);
                
                const remainingPosition = remainingPositions.find(pos => pos !== firstAIPosition);
                secondAIPosition = remainingPosition;
                secondAICard = remainingCards.find((_, index) => {
                    const cardPos = remainingPositions[index];
                    return cardPos === secondAIPosition;
                });
                
                const secondPlayerName = this.aiFirstPlayer === 'playerA' ? this.playerNames.playerB : this.playerNames.playerA;
                await this.announceAICard(secondAICard, secondAIPosition, secondPlayerName);
            }
        }
        
        await this.wait(CONFIG.PAUSE_BETWEEN_REVEALS);
        this.determineRoundWinner(userCard, firstAICard, secondAICard, userPosition, firstAIPosition, secondAIPosition);
    }
    
    async announceAndRevealAI(card, position, playerKey) {
        const choiceMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.AI_CHOOSES_CARD, {
            player: this.playerNames[playerKey],
            position: AudioUtils.getPositionName(position)
        });
        window.AudioSystem.speakText(choiceMessage);
        
        await this.wait(CONFIG.PAUSE_BETWEEN_REVEALS);
        await this.renderer.revealCard(card, position);
        this.revealedCards.add(position);
        
        const revealMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.AI_REVEALED, {
            player: this.playerNames[playerKey],
            number: card.value,
            animal: card.name
        });
        window.AudioSystem.speakText(revealMessage);
    }
    
    async announceAICard(card, position, playerName) {
        await this.renderer.revealCard(card, position);
        this.revealedCards.add(position);
        
        const revealMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.AI_REVEALED, {
            player: playerName,
            number: card.value,
            animal: card.name
        });
        window.AudioSystem.speakText(revealMessage);
    }
    
    determineRoundWinner(userCard, firstAICard, secondAICard, userPos, firstAIPos, secondAIPos) {
        console.log('🏆 Determining Round Winner');
        
        const cards = [
            { card: userCard, player: 'user', position: userPos },
            { card: firstAICard, player: this.aiFirstPlayer, position: firstAIPos },
            { card: secondAICard, player: this.aiFirstPlayer === 'playerA' ? 'playerB' : 'playerA', position: secondAIPos }
        ];
        
        const maxValue = Math.max(...cards.map(c => c.card.value));
        const winners = cards.filter(c => c.card.value === maxValue);
        
        let results = ['loser', 'loser', 'loser'];
        let winnerName = '';
        
        if (winners.length === 1) {
            const winner = winners[0];
            const winnerIndex = cards.findIndex(c => c.position === winner.position);
            results[winnerIndex] = 'winner';
            
            this.scores[winner.player]++;
            
            if (winner.player === 'user') {
                winnerName = 'You';
                window.AudioSystem.playCompletionSound();
            } else {
                winnerName = this.playerNames[winner.player];
                window.AudioSystem.playFailureSound();
            }
        } else {
            // Multiple winners (shouldn't happen with unique values 1-30)
            winners.forEach(winner => {
                const winnerIndex = cards.findIndex(c => c.position === winner.position);
                results[winnerIndex] = 'draw';
            });
            window.AudioSystem.playTone(440, 0.2, 'sine', 0.2);
            winnerName = 'draw';
        }
        
        // Visual feedback
        this.renderer.highlightWinner(null, results);
        this.renderer.updateScores(this.scores.user, this.scores.playerA, this.scores.playerB);
        
        // Audio announcement
        const winnerMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.WINNER_ANNOUNCEMENT, {
            winner: winnerName
        });
        window.AudioSystem.speakText(winnerMessage);
        
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
            console.log(`🌈 Rainbow pieces: ${pieces}`);
            
            if (this.currentRound === CONFIG.ROUNDS) {
                setTimeout(() => {
                    if (this.rainbow) {
                        this.rainbow.addPiece();
                        console.log('🌈 Rainbow complete!');
                    }
                }, 1000);
            }
        }
    }
    
    async completeRound() {
        console.log('✅ Round Complete');
        
        // Remove used cards
        this.availableCards = this.availableCards.filter(
            card => !this.selectedCards.some(selected => selected.id === card.id)
        );
        
        // Clear display
        await this.renderer.clearRectCards();
        
        if (this.currentRound >= CONFIG.ROUNDS) {
            this.completeGame();
        } else {
            this.currentRound++;
            await this.wait(CONFIG.RESET_DELAY);
            this.startNewRound();
        }
    }
    
    completeGame() {
        console.log('🎊 Game Complete!');
        this.gameComplete = true;
        
        const maxScore = Math.max(this.scores.user, this.scores.playerA, this.scores.playerB);
        const winners = [];
        
        if (this.scores.user === maxScore) winners.push('user');
        if (this.scores.playerA === maxScore) winners.push('playerA');
        if (this.scores.playerB === maxScore) winners.push('playerB');
        
        let finalMessage;
        
        if (winners.length > 1) {
            finalMessage = CONFIG.AUDIO_MESSAGES.GAME_COMPLETE_DRAW;
        } else if (winners[0] === 'user') {
            finalMessage = CONFIG.AUDIO_MESSAGES.GAME_COMPLETE_WIN;
        } else {
            const winnerName = winners[0] === 'playerA' ? this.playerNames.playerA : this.playerNames.playerB;
            finalMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.GAME_COMPLETE_LOSE, {
                winner: winnerName
            });
        }
        
        this.renderer.showGameComplete();
        
        if (this.bear) {
            setTimeout(() => {
                this.bear.startCelebration();
            }, 500);
        }
        
        setTimeout(() => {
            window.AudioSystem.speakText(finalMessage);
        }, 1000);
    }
    
    restartGame() {
        console.log('🔄 Restarting Game');
        
        // Stop celebrations
        if (this.rainbow) this.rainbow.reset();
        if (this.bear) this.bear.stopCelebration();
        
        // Reset state
        this.currentRound = 1;
        this.scores = { user: 0, playerA: 0, playerB: 0 };
        this.gamePhase = 'waiting';
        this.selectedCards = [];
        this.gameComplete = false;
        this.userSelectedPosition = null;
        this.revealedCards.clear();
        this.roundResults = [];
        this.firstCardSelection = true;
        
        // Generate new names
        this.playerNames = this.generateUniquePlayerNames();
        
        // Hide modal
        const modal = document.getElementById('gameModal');
        modal.classList.add('hidden');
        
        // Reset renderer
        this.renderer.reset();
        
        // Show choice again
        this.displayGameChoice();
    }
    
    generateUniquePlayerNames() {
        const playerA = AudioUtils.getRandomPlayerName();
        let playerB;
        
        do {
            playerB = AudioUtils.getRandomPlayerName();
        } while (playerB === playerA);
        
        return { playerA, playerB };
    }
    
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    destroy() {
        if (this.rainbow) this.rainbow.destroy();
        if (this.bear) this.bear.stopCelebration();
        if (this.gameChoice) this.gameChoice.destroy();
        this.renderer.reset();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌐 DOM Ready - Creating Game Controller');
    window.trumps2Game = new Trumps2GameController();
    console.log('✅ Game Controller Ready');
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.trumps2Game) {
        window.trumps2Game.destroy();
    }
});
