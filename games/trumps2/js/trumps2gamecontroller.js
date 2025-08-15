// Clean Animal Trumps Game Controller - Version 2.0 - Highest Selection Phase
console.log('🔄 Loading Clean Trumps2 Game Controller v2.0 - With Highest Selection Phase');

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
        this.gamePhase = 'waiting'; // waiting, selection, comparison, highest_selection, ai_turn
        this.currentRound = 1;
        this.scores = { user: 0, playerA: 0, playerB: 0 };
        this.selectedCards = [];
        this.selectedCardIds = new Set(); // Track selected card IDs to prevent duplicates
        this.availableCards = [];
        this.gameComplete = false;
        
        // Player state
        this.playerNames = this.generateUniquePlayerNames();
        this.firstCardSelection = true;
        this.userSelectedPosition = null;
        this.roundResults = [];
        this.currentTurn = null;
        this.aiFirstPlayer = Math.random() < 0.5 ? 'playerA' : 'playerB';
        
        // Highest selection phase state
        this.allCardsRevealed = false;
        this.highestCardPosition = null;
        this.userHighestAttempts = 0;
        this.inactivityTimeout = null;
        
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
        
        // Disable right-click context menu document-wide
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
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
        
        if (this.gamePhase === 'highest_selection' && this.renderer.currentMode === 'rect') {
            this.handleHighestSelectionClick(e);
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
    
    handleHighestSelectionClick(e) {
        // Similar to handleRectClick but for highest selection phase
        const rectCard = e.target.closest('.rect-card');
        const rectCardBack = e.target.closest('.rect-card-back');
        
        let position = null;
        
        if (rectCard && rectCard.dataset.position) {
            position = rectCard.dataset.position;
        } else if (rectCardBack && rectCardBack.dataset.position) {
            position = rectCardBack.dataset.position;
        } else {
            const cardElement = e.target.closest('[data-position]');
            if (cardElement && cardElement.dataset.position) {
                position = cardElement.dataset.position;
            } else {
                const element = e.target.closest('.left-title, .left-picture, .left-number, .middle-title, .middle-picture, .middle-number, .right-title, .right-picture, .right-number');
                if (element) {
                    const classes = element.className;
                    if (classes.includes('left-')) position = 'left';
                    else if (classes.includes('middle-')) position = 'middle';
                    else if (classes.includes('right-')) position = 'right';
                }
            }
        }
        
        if (position) {
            console.log('🎯 User selected highest card:', position);
            this.selectHighestCard(position);
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
        // Shuffle the cards for random order
        const shuffledCards = [...CONFIG.CARDS].sort(() => Math.random() - 0.5);
        
        this.availableCards = shuffledCards.map((card, index) => ({
            ...card,
            originalPosition: index
        }));
        console.log('🃏 Game cards shuffled and ready:', this.availableCards.length);
    }
    
    startNewRound() {
        console.log(`🎯 Starting Round ${this.currentRound}`);
        
        this.gamePhase = 'selection';
        this.selectedCards = [];
        this.selectedCardIds.clear(); // Clear selected card IDs for new round
        this.userSelectedPosition = null;
        this.roundResults = [];
        this.currentTurn = null;
        this.allCardsRevealed = false;
        this.highestCardPosition = null;
        this.userHighestAttempts = 0;
        
        // Clear any existing timeouts
        if (this.inactivityTimeout) {
            clearTimeout(this.inactivityTimeout);
            this.inactivityTimeout = null;
        }
        
        // Alternate AI first player
        this.aiFirstPlayer = this.currentRound % 2 === 1 ? 'playerA' : 'playerB';
        
        // Render grid
        this.renderer.renderCardGrid(this.availableCards);
        
        // Audio instruction with 10-second reminder
        if (this.currentRound === 1) {
            window.AudioSystem.speakText(CONFIG.AUDIO_MESSAGES.GAME_START);
        } else {
            window.AudioSystem.speakText(CONFIG.AUDIO_MESSAGES.ROUND_START);
        }
        
        // Set reminder timeout
        this.reminderTimeout = setTimeout(() => {
            if (this.gamePhase === 'selection' && this.selectedCards.length === 0) {
                window.AudioSystem.speakText(CONFIG.AUDIO_MESSAGES.START_REMIND);
            }
        }, 10000);
    }
    
    selectCard(cardId) {
        if (this.gamePhase !== 'selection' || this.selectedCards.length >= CONFIG.CARDS_PER_ROUND) {
            return;
        }
        
        // Check if this card has already been selected
        if (this.selectedCardIds.has(cardId)) {
            console.log(`⚠️ Card ${cardId} already selected - ignoring duplicate selection`);
            return;
        }
        
        // Clear reminder timeout
        if (this.reminderTimeout) {
            clearTimeout(this.reminderTimeout);
            this.reminderTimeout = null;
        }
        
        const selectedCard = this.availableCards.find(card => card.id === cardId);
        if (!selectedCard) return;
        
        // Add to selected cards and track ID
        this.selectedCards.push(selectedCard);
        this.selectedCardIds.add(cardId);
        
        console.log(`✅ Selected card ${this.selectedCards.length}: ${selectedCard.name} (${selectedCard.value})`);
        
        // Visual feedback
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
        if (cardElement) {
            cardElement.classList.add('card-selected');
            // Disable further clicks on this card
            cardElement.style.pointerEvents = 'none';
            cardElement.style.cursor = 'default';
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
        
        // Add click pulse effect and disable hover animations
        await this.renderer.pulseCardOnClick(position);
        
        // Announce user choice with delay (no animal name, just number)
        const userMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.USER_CARD_SELECTED, {
            number: selectedCard.value
        });
        window.AudioSystem.speakText(userMessage);
        
        // Mark card as revealed in renderer
        await this.renderer.revealCard(selectedCard, position);
        
        // Wait 2 seconds then add player name to card
        setTimeout(async () => {
            await this.renderer.addPlayerNameToCard(position, 'YOU', 'user');
        }, 2000);
        
        // Wait for speech + 1 second buffer + reveal delay
        await this.wait(3000);
        await this.handleAIDecisions(selectedCard, position);
    }
    
    async handleAIDecisions(userCard, userPosition) {
        console.log('🤖 AI Making Decisions');
        
        // Get remaining cards (excluding user's selection)
        const remainingCards = this.selectedCards.filter((_, index) => {
            const cardPosition = index === 0 ? 'left' : index === 1 ? 'middle' : 'right';
            return cardPosition !== userPosition;
        });
        
        const remainingPositions = ['left', 'middle', 'right'].filter(pos => pos !== userPosition);
        
        // First AI player makes strategic choice
        let firstAICardIndex;
        let firstAICard;
        let firstAIPosition;
        
        // Look for cards with value 14 or higher
        const highValueCardIndex = remainingCards.findIndex(card => card.value >= 14);
        
        if (highValueCardIndex !== -1) {
            // Pick the high value card (14+)
            firstAICardIndex = highValueCardIndex;
            firstAICard = remainingCards[firstAICardIndex];
            firstAIPosition = remainingPositions[firstAICardIndex];
            console.log(`🎯 AI chose high value card: ${firstAICard.name} (${firstAICard.value})`);
        } else {
            // No high value cards, pick randomly
            firstAICardIndex = Math.floor(Math.random() * remainingCards.length);
            firstAICard = remainingCards[firstAICardIndex];
            firstAIPosition = remainingPositions[firstAICardIndex];
            console.log(`🎲 AI chose randomly: ${firstAICard.name} (${firstAICard.value})`);
        }
        
        // Second AI player gets the last remaining card
        const secondAICard = remainingCards.find(card => card !== firstAICard);
        const secondAIPosition = remainingPositions.find(pos => pos !== firstAIPosition);
        
        // Announce and reveal first AI pick
        await this.announceAIPick(firstAICard, firstAIPosition, this.aiFirstPlayer, 'SECOND_PICK');
        
        // Announce and reveal second AI pick (the remaining card)
        const secondPlayerName = this.aiFirstPlayer === 'playerA' ? 'playerB' : 'playerA';
        await this.announceAIPick(secondAICard, secondAIPosition, secondPlayerName, 'THIRD_PICK');
        
        // All cards are now revealed - move to highest selection phase
        this.allCardsRevealed = true;
        await this.wait(1000);
        this.startHighestSelectionPhase(userCard, firstAICard, secondAICard, userPosition, firstAIPosition, secondAIPosition);
    }
    
    async announceAIPick(card, position, playerKey, pickType) {
        // Announce the pick
        const pickMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES[pickType], {
            player: this.playerNames[playerKey],
            position: AudioUtils.getPositionName(position)
        });
        window.AudioSystem.speakText(pickMessage);
        
        // Wait for speech to complete
        await this.wait(2500);
        
        // Reveal card
        await this.renderer.revealCard(card, position);
        
        // Wait 2 seconds then add player name to card
        setTimeout(async () => {
            await this.renderer.addPlayerNameToCard(position, this.playerNames[playerKey], playerKey);
        }, 2000);
        
        // Wait briefly after reveal animation
        await this.wait(500);
        
        // Announce the card details (just animal name, no number)
        const revealType = pickType === 'SECOND_PICK' ? 'SECOND_PICK_REVEAL' : 'THIRD_PICK_REVEAL';
        const revealMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES[revealType], {
            animal: card.name
        });
        window.AudioSystem.speakText(revealMessage);
        
        // Wait for speech + buffer before next action
        await this.wait(2500);
    }
    
    async startHighestSelectionPhase(userCard, firstAICard, secondAICard, userPos, firstAIPos, secondAIPos) {
        console.log('🔢 Starting Highest Selection Phase');
        
        this.gamePhase = 'highest_selection';
        
        // Store round data for later use
        this.roundData = {
            cards: [
                { card: userCard, player: 'user', position: userPos },
                { card: firstAICard, player: this.aiFirstPlayer, position: firstAIPos },
                { card: secondAICard, player: this.aiFirstPlayer === 'playerA' ? 'playerB' : 'playerA', position: secondAIPos }
            ]
        };
        
        // Determine the highest card position
        const maxValue = Math.max(userCard.value, firstAICard.value, secondAICard.value);
        if (userCard.value === maxValue) {
            this.highestCardPosition = userPos;
        } else if (firstAICard.value === maxValue) {
            this.highestCardPosition = firstAIPos;
        } else {
            this.highestCardPosition = secondAIPos;
        }
        
        console.log(`🎯 Highest card is at position: ${this.highestCardPosition} with value: ${maxValue}`);
        
        // Wait 2 seconds then ask user to identify highest card
        await this.wait(2000);
        window.AudioSystem.speakText(CONFIG.AUDIO_MESSAGES.HIGHEST_SELECTION);
        
        // Set inactivity timeout for 10 seconds
        this.inactivityTimeout = setTimeout(() => {
            if (this.gamePhase === 'highest_selection') {
                window.AudioSystem.speakText(CONFIG.AUDIO_MESSAGES.HIGHEST_SELECTION_PROMPT);
            }
        }, 10000);
    }
    
    async selectHighestCard(selectedPosition) {
        if (this.gamePhase !== 'highest_selection') {
            return;
        }
        
        // Clear inactivity timeout
        if (this.inactivityTimeout) {
            clearTimeout(this.inactivityTimeout);
            this.inactivityTimeout = null;
        }
        
        console.log(`🎯 User selected position ${selectedPosition} as highest. Correct is ${this.highestCardPosition}`);
        
        // Add click pulse effect
        await this.renderer.pulseCardOnClick(selectedPosition);
        
        if (selectedPosition === this.highestCardPosition) {
            // Correct selection
            console.log('✅ Correct highest card selected');
            this.userHighestAttempts++;
            
            // Find the winning card value
            const winningCard = this.roundData.cards.find(c => c.position === selectedPosition);
            const winnerPlayer = winningCard.player;
            let winnerName;
            
            if (winnerPlayer === 'user') {
                winnerName = 'You';
            } else {
                winnerName = this.playerNames[winnerPlayer];
            }
            
            // Play positive sound
            window.AudioSystem.playCompletionSound();
            
            // Announce correct selection and winner
            const correctMessage = AudioUtils.formatMessage(CONFIG.AUDIO_MESSAGES.HIGHEST_SELECTED_CORRECT, {
                number: winningCard.card.value,
                winner: winnerName,
                wins: winnerName === 'You' ? 'win' : 'wins'
            });
            window.AudioSystem.speakText(correctMessage);
            
            // Proceed to determine round winner
            await this.wait(3000);
            this.determineRoundWinner();
            
        } else {
            // Incorrect selection
            console.log('❌ Incorrect highest card selected');
            this.userHighestAttempts++;
            
            // Play negative sound
            window.AudioSystem.playFailureSound();
            
            // Make all cards partially transparent and disable clicks temporarily
            await this.renderer.showIncorrectSelection();
            
            // Announce try again
            window.AudioSystem.speakText(CONFIG.AUDIO_MESSAGES.HIGHEST_SELECTED_FAIL);
            
            // Re-enable cards after 2 seconds
            setTimeout(() => {
                this.renderer.enableCardSelection();
                // Reset inactivity timeout
                this.inactivityTimeout = setTimeout(() => {
                    if (this.gamePhase === 'highest_selection') {
                        window.AudioSystem.speakText(CONFIG.AUDIO_MESSAGES.HIGHEST_SELECTION_PROMPT);
                    }
                }, 10000);
            }, 2000);
        }
    }
    
    determineRoundWinner() {
        console.log('🏆 Determining Round Winner');
        
        const cards = this.roundData.cards;
        const maxValue = Math.max(...cards.map(c => c.card.value));
        const winners = cards.filter(c => c.card.value === maxValue);
        
        let results = ['loser', 'loser', 'loser'];
        
        if (winners.length === 1) {
            const winner = winners[0];
            const winnerIndex = cards.findIndex(c => c.position === winner.position);
            results[winnerIndex] = 'winner';
            
            this.scores[winner.player]++;
        } else {
            // Multiple winners (shouldn't happen with unique values 1-30)
            winners.forEach(winner => {
                const winnerIndex = cards.findIndex(c => c.position === winner.position);
                results[winnerIndex] = 'draw';
            });
        }
        
        // Visual feedback
        this.renderer.highlightWinner(null, results);
        this.renderer.updateScores(this.scores.user, this.scores.playerA, this.scores.playerB);
        
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
        
        // Clear any remaining timeouts
        if (this.inactivityTimeout) {
            clearTimeout(this.inactivityTimeout);
            this.inactivityTimeout = null;
        }
        
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
        
        // Clear any timeouts
        if (this.inactivityTimeout) {
            clearTimeout(this.inactivityTimeout);
            this.inactivityTimeout = null;
        }
        
        // Reset state
        this.currentRound = 1;
        this.scores = { user: 0, playerA: 0, playerB: 0 };
        this.gamePhase = 'waiting';
        this.selectedCards = [];
        this.selectedCardIds.clear();
        this.gameComplete = false;
        this.userSelectedPosition = null;
        this.roundResults = [];
        this.firstCardSelection = true;
        this.allCardsRevealed = false;
        this.highestCardPosition = null;
        this.userHighestAttempts = 0;
        
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
        if (this.inactivityTimeout) {
            clearTimeout(this.inactivityTimeout);
            this.inactivityTimeout = null;
        }
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
