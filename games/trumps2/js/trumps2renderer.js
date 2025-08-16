/**
 * TRUMPS2 RENDERER - Core Coordination and Initialization
 * 
 * This file contains:
 * - Main constructor and initialization
 * - Layout calculations and positioning utilities
 * - API delegation to specialized managers
 * - Resize handling and coordination
 * 
 * Other renderer files:
 * - trumps2cards.js: Card creation, reveal animations, and card state management
 * - trumps2effects.js: Score system, visual effects (pulses, sparkles), and player interactions
 */

class Trumps2Renderer {
    constructor() {
        this.gameArea = document.querySelector('.game-area');
        this.cardGrid = null;
        this.rectContainer = null;
        
        // Track current layout mode
        this.currentMode = 'grid'; // 'grid' or 'rect'
        
        // Store player names for card labeling
        this.playerNames = { playerA: 'A', playerB: 'B' };
        
        // Initialize specialized managers
        this.cardManager = null;
        this.effectsManager = null;
        
        this.initializeLayout();
    }

    initializeLayout() {
        // Clear game area
        this.gameArea.innerHTML = '';
        
        // Create rainbow container first (so it's behind everything)
        const rainbowContainer = document.createElement('div');
        rainbowContainer.className = 'rainbow-container';
        rainbowContainer.id = 'rainbowContainer';
        rainbowContainer.style.position = 'absolute';
        rainbowContainer.style.top = '0';
        rainbowContainer.style.left = '0';
        rainbowContainer.style.width = '100%';
        rainbowContainer.style.height = '100%';
        rainbowContainer.style.zIndex = '1';
        rainbowContainer.style.pointerEvents = 'none';
        console.log('🌈 Created rainbow container:', rainbowContainer);
        this.gameArea.appendChild(rainbowContainer);
        
        // Create rectangular container (always present, transparent)
        this.createRectContainer();
        
        // Create grid layout elements
        this.createGridLayout();
        
        // Initialize ButtonBar for rainbow/bear compatibility
        this.initializeButtonBarForRainbow();
        
        // Initialize specialized managers
        this.cardManager = new Trumps2CardManager(this.rectContainer, this.gameArea, this);
        this.effectsManager = new Trumps2EffectsManager(this.rectContainer, this.gameArea, this);
        
        // Don't render any cards initially - wait for game controller to start
    }

    initializeButtonBarForRainbow() {
        // Create minimal ButtonBar setup for rainbow/bear systems
        if (window.ButtonBar && typeof window.ButtonBar.create === 'function') {
            // Create empty button bar with zero height to satisfy rainbow system
            window.ButtonBar.create(0, 0, 0, [], [], null);
            console.log('🔧 ButtonBar initialized for rainbow/bear compatibility');
        } else {
            console.warn('⚠️ ButtonBar not available - rainbow/bear may not work');
        }
    }

    createRectContainer() {
        // Create rectangular container - always present
        this.rectContainer = document.createElement('div');
        this.rectContainer.className = 'rect-container';
        this.rectContainer.style.pointerEvents = 'none'; // Allow clicks to pass through to grid cards
        
        // Position the rectangular container
        this.positionRectContainer();
        
        // Add to game area
        this.gameArea.appendChild(this.rectContainer);
    }

    createGridLayout() {
        // Create card grid container
        this.cardGrid = document.createElement('div');
        this.cardGrid.className = 'card-grid';
        
        // Add to game area
        this.gameArea.appendChild(this.cardGrid);
    }

    calculateRectDimensions() {
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const screenWidth = gameAreaRect.width;
        const screenHeight = gameAreaRect.height;
        
        let rectWidth, rectHeight, left, top;
        
        // Check if screen width is less than 1.62 times the height
        if (screenWidth < screenHeight * CONFIG.RECT_LAYOUT.ASPECT_RATIO) {
            // Width-constrained: rectangle width = 100vw
            rectWidth = screenWidth;
            rectHeight = rectWidth / CONFIG.RECT_LAYOUT.ASPECT_RATIO;
            left = 0;
            top = (screenHeight - rectHeight) / 2;
        } else {
            // Height-constrained: rectangle height = 100vh
            rectHeight = screenHeight;
            rectWidth = rectHeight * CONFIG.RECT_LAYOUT.ASPECT_RATIO;
            left = (screenWidth - rectWidth) / 2;
            top = 0;
        }
        
        return { rectWidth, rectHeight, left, top };
    }

    positionRectContainer() {
        const { rectWidth, rectHeight, left, top } = this.calculateRectDimensions();
        
        // Position rectangular container
        this.rectContainer.style.left = `${left}px`;
        this.rectContainer.style.top = `${top}px`;
        this.rectContainer.style.width = `${rectWidth}px`;
        this.rectContainer.style.height = `${rectHeight}px`;
    }

    positionRectElement(element, x, y, width, height, rectWidth, rectHeight) {
        element.style.position = 'absolute';
        element.style.left = `${(x / 100) * rectWidth}px`;
        element.style.top = `${(y / 100) * rectHeight}px`;
        element.style.width = `${(width / 100) * rectWidth}px`;
        element.style.height = `${(height / 100) * rectHeight}px`;
    }

    renderCardGrid(availableCards) {
        this.currentMode = 'grid';
        
        // Show grid layout, hide rect card elements
        this.cardGrid.classList.remove('hidden');
        this.cardManager.hideRectCardElements();
        
        this.cardGrid.innerHTML = '';
        
        // Create 30 card slots with direct positioning
        for (let position = 0; position < CONFIG.TOTAL_CARDS; position++) {
            const cardElement = document.createElement('div');
            cardElement.className = 'card-slot';
            cardElement.dataset.position = position;
            
            // Position using CONFIG coordinates
            const pos = CONFIG.GRID_LAYOUT.POSITIONS[position];
            cardElement.style.left = `${pos.x}vw`;
            cardElement.style.top = `${pos.y}vh`;
            cardElement.style.width = `${CONFIG.GRID_LAYOUT.CARD_WIDTH}vw`;
            cardElement.style.height = `${CONFIG.GRID_LAYOUT.CARD_HEIGHT}vw`;
            
            // Check if this position has a card
            const card = availableCards.find(c => c.originalPosition === position);
            if (card) {
                cardElement.classList.add('card-back');
                cardElement.dataset.cardId = card.id;
                
                // Create card back design
                const cardBack = document.createElement('div');
                cardBack.className = 'card-back-design';
                cardElement.appendChild(cardBack);
                
                // Make clickable
                cardElement.style.cursor = 'pointer';
            } else {
                cardElement.classList.add('empty-slot');
            }
            
            this.cardGrid.appendChild(cardElement);
        }
    }

    async selectAndMoveCards(selectedCards) {
        // Get the selected card elements
        const cardElements = selectedCards.map(card => 
            this.cardGrid.querySelector(`[data-card-id="${card.id}"]`)
        );
        
        // Fade out all other cards
        const allCards = this.cardGrid.querySelectorAll('.card-slot:not(.empty-slot)');
        allCards.forEach(card => {
            if (!cardElements.includes(card)) {
                card.style.transition = `opacity ${CONFIG.CARD_FADE_DURATION}ms ease-out`;
                card.style.opacity = '0';
            }
        });
        
        // Wait for fade out
        await this.wait(CONFIG.CARD_FADE_DURATION);
        
        // Switch to rectangular layout
        this.switchToRectLayout(selectedCards);
        
        await this.wait(CONFIG.CARD_MOVE_DURATION);
    }

    switchToRectLayout(selectedCards) {
        this.currentMode = 'rect';
        
        // Hide grid layout
        this.cardGrid.classList.add('hidden');
        
        // Enable pointer events on rect container for card interaction
        this.rectContainer.style.pointerEvents = 'auto';
        
        // Delegate to card manager
        this.cardManager.setupRectLayout(selectedCards);
    }

    // Delegation methods to specialized managers
    async pulseCardOnClick(position) {
        return this.effectsManager.pulseCardOnClick(position);
    }

    async revealCard(card, position) {
        return this.cardManager.revealCard(card, position);
    }

    async addPlayerNameToCard(position, playerName, playerType) {
        return this.effectsManager.addPlayerNameToCard(position, playerName, playerType);
    }

    async showIncorrectSelection() {
        return this.effectsManager.showIncorrectSelection();
    }

    enableCardSelection() {
        this.effectsManager.enableCardSelection();
    }

    enableHoverEffectsForHighestSelection() {
        this.effectsManager.enableHoverEffectsForHighestSelection();
    }

    highlightWinner(winnerPosition, results) {
        this.effectsManager.highlightWinner(winnerPosition, results);
    }

    updateScores(userScore, playerAScore, playerBScore, winningPlayer = null) {
        this.effectsManager.updateScores(userScore, playerAScore, playerBScore, winningPlayer);
    }

    createStarSparkle(cardPosition) {
        this.effectsManager.createStarSparkle(cardPosition);
    }

    setPlayerNames(playerAName, playerBName) {
        // Store player names for card labeling
        this.playerNames.playerA = playerAName;
        this.playerNames.playerB = playerBName;
        
        // Update effects manager
        this.effectsManager.setPlayerNames(playerAName, playerBName);
    }

    showPlayerTurn(player) {
        this.effectsManager.showPlayerTurn(player);
    }

    clearPlayerTurns() {
        this.effectsManager.clearPlayerTurns();
    }

    async clearRectCards() {
        // Delegate to card manager
        await this.cardManager.clearRectCards();
        
        // Switch back to grid layout
        this.switchToGridLayoutWithoutRender();
    }

    switchToGridLayoutWithoutRender() {
        this.currentMode = 'grid';
        
        // Disable pointer events on rect container so grid cards can be clicked
        this.rectContainer.style.pointerEvents = 'none';
        
        // Show grid layout container but don't populate it yet
        this.cardGrid.classList.remove('hidden');
        
        // Clear any existing grid content to prevent showing old cards
        this.cardGrid.innerHTML = '';
    }

    showGameComplete() {
        const modal = document.getElementById('gameModal');
        modal.classList.remove('hidden');
    }

    // Handle window resize for responsive layout
    handleResize() {
        // Reposition rectangular container
        this.positionRectContainer();
        
        // Update effects manager for score repositioning
        if (this.effectsManager) {
            this.effectsManager.handleResize();
        }
        
        // Reinitialize rainbow if available
        setTimeout(() => {
            if (window.rainbow && typeof window.rainbow.initializeArcs === 'function') {
                window.rainbow.initializeArcs();
                console.log('🌈 Rainbow reinitialized after resize');
            }
        }, 100);
    }

    // Utility method for waiting
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    reset() {
        this.currentMode = 'grid';
        
        // Reset specialized managers
        if (this.cardManager) {
            this.cardManager.reset();
        }
        if (this.effectsManager) {
            this.effectsManager.reset();
        }
        
        // Reset player names
        this.playerNames = { playerA: 'A', playerB: 'B' };
        
        this.initializeLayout();
    }
}

// Add resize listener for responsive behavior
window.addEventListener('resize', () => {
    if (window.trumps2Game && window.trumps2Game.renderer) {
        window.trumps2Game.renderer.handleResize();
    }
});
