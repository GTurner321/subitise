class Trumps2Renderer {
    constructor() {
        this.gameArea = document.querySelector('.game-area');
        this.cardGrid = null;
        this.rectContainer = null;
        
        // Score elements
        this.scoreElements = {
            user: { name: null, box: null },
            playerA: { name: null, box: null },
            playerB: { name: null, box: null }
        };
        
        // Track current layout mode
        this.currentMode = 'grid'; // 'grid' or 'rect'
        
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
    }

    createRectContainer() {
        // Create rectangular container - always present
        this.rectContainer = document.createElement('div');
        this.rectContainer.className = 'rect-container';
        this.rectContainer.style.pointerEvents = 'none'; // Allow clicks to pass through to grid cards
        
        // Position the rectangular container
        this.positionRectContainer();
        
        // Create score elements (always visible)
        this.createRectScores();
        
        // Add to game area
        this.gameArea.appendChild(this.rectContainer);
    }

    createRectScores() {
        const { rectWidth, rectHeight } = this.calculateRectDimensions();
        
        // Create user score elements
        this.scoreElements.user.name = this.createScoreElement('YOU', 'user-score-name', CONFIG.RECT_LAYOUT.LEFT_SCORE_NAME, rectWidth, rectHeight);
        this.scoreElements.user.box = this.createScoreElement('0', 'user-score rect-score-box user-score', CONFIG.RECT_LAYOUT.LEFT_SCORE_BOX, rectWidth, rectHeight);
        
        // Player A score elements (name will be set when game starts)
        this.scoreElements.playerA.name = this.createScoreElement('A', 'player-a-score-name', CONFIG.RECT_LAYOUT.MIDDLE_SCORE_NAME, rectWidth, rectHeight);
        this.scoreElements.playerA.box = this.createScoreElement('0', 'player-a-score rect-score-box player-a-score', CONFIG.RECT_LAYOUT.MIDDLE_SCORE_BOX, rectWidth, rectHeight);
        
        // Player B score elements (name will be set when game starts)
        this.scoreElements.playerB.name = this.createScoreElement('B', 'player-b-score-name', CONFIG.RECT_LAYOUT.RIGHT_SCORE_NAME, rectWidth, rectHeight);
        this.scoreElements.playerB.box = this.createScoreElement('0', 'player-b-score rect-score-box player-b-score', CONFIG.RECT_LAYOUT.RIGHT_SCORE_BOX, rectWidth, rectHeight);

        // Add all score elements to container
        Object.values(this.scoreElements).forEach(player => {
            this.rectContainer.appendChild(player.name);
            this.rectContainer.appendChild(player.box);
        });
    }

    createScoreElement(text, className, layout, rectWidth, rectHeight) {
        const element = document.createElement('div');
        element.className = `rect-score-name ${className}`;
        element.textContent = text;
        element.style.pointerEvents = 'auto';
        
        this.positionRectElement(element, layout.x, layout.y, layout.width, layout.height, rectWidth, rectHeight);
        
        // Add shadow to score boxes
        if (className.includes('rect-score-box')) {
            element.style.boxShadow = `0 ${rectWidth * 0.03}px ${rectWidth * 0.06}px rgba(0,0,0,0.3)`;
        }
        
        // Set font size based on element type
        if (className.includes('rect-score-box')) {
            element.style.fontSize = `${rectWidth * CONFIG.RECT_LAYOUT.FONT_SIZES.SCORE_BOX}px`;
        } else {
            element.style.fontSize = `${rectWidth * CONFIG.RECT_LAYOUT.FONT_SIZES.SCORE_NAME}px`;
        }
        
        return element;
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
        this.hideRectCardElements();
        
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
        
        // Create the three cards
        this.createRectCards(selectedCards);
        
        // Left card is revealed immediately (no back)
        this.revealCard(selectedCards[0], 'left');
        
        // Create card backs for middle and right cards AFTER a delay
        setTimeout(() => {
            this.createCardBack(selectedCards[1], 'middle');
            this.createCardBack(selectedCards[2], 'right');
        }, 1000); // Delay to ensure front cards are hidden
        
        // Fade in card elements (but not the backs yet)
        const cardElements = this.rectContainer.querySelectorAll('.rect-card, .rect-card-title, .rect-card-picture, .rect-card-number');
        cardElements.forEach(element => {
            element.style.opacity = '0';
            element.style.transition = 'opacity 1s ease-in';
            
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    element.style.opacity = '1';
                });
            });
        });
    }

    createRectCards(cards) {
        const { rectWidth, rectHeight } = this.calculateRectDimensions();
        const positions = ['left', 'middle', 'right'];
        const layouts = [CONFIG.RECT_LAYOUT.LEFT_CARD, CONFIG.RECT_LAYOUT.MIDDLE_CARD, CONFIG.RECT_LAYOUT.RIGHT_CARD];
        
        cards.forEach((card, index) => {
            const position = positions[index];
            const layout = layouts[index];
            
            // Create card container
            const cardElement = document.createElement('div');
            cardElement.className = `rect-card rect-card-${position}`;
            cardElement.dataset.cardId = card.id;
            cardElement.dataset.position = position;
            
            this.positionRectElement(cardElement, layout.x, layout.y, layout.width, layout.height, rectWidth, rectHeight);
            
            // Add shadow to card
            cardElement.style.boxShadow = `0 ${rectHeight * 0.04}px ${rectHeight * 0.08}px rgba(0,0,0,0.4)`;
            
            // Make all cards clickable (including left)
            cardElement.style.cursor = 'pointer';
            cardElement.style.pointerEvents = 'auto';
            
            // Create card front face content
            this.createCardContent(cardElement, card, position, rectWidth, rectHeight);
            
            this.rectContainer.appendChild(cardElement);
        });
    }

    createCardContent(cardElement, card, position, rectWidth, rectHeight) {
        const cardLayout = position === 'left' ? CONFIG.RECT_LAYOUT.LEFT_CARD : 
                          position === 'middle' ? CONFIG.RECT_LAYOUT.MIDDLE_CARD : 
                          CONFIG.RECT_LAYOUT.RIGHT_CARD;
        
        // Create title
        const title = document.createElement('div');
        title.className = `rect-card-title rect-card-title-${position}`;
        title.textContent = card.name;
        this.positionRectElement(title, cardLayout.x + CONFIG.RECT_LAYOUT.CARD_ELEMENTS.TITLE.x, 
                                cardLayout.y + CONFIG.RECT_LAYOUT.CARD_ELEMENTS.TITLE.y,
                                CONFIG.RECT_LAYOUT.CARD_ELEMENTS.TITLE.width, 
                                CONFIG.RECT_LAYOUT.CARD_ELEMENTS.TITLE.height, rectWidth, rectHeight);
        title.style.fontSize = `${rectWidth * CONFIG.RECT_LAYOUT.FONT_SIZES.CARD_TITLE}px`;
        this.rectContainer.appendChild(title);
        
        // Create picture area
        const pictureArea = document.createElement('div');
        pictureArea.className = `rect-card-picture rect-card-picture-${position}`;
        this.positionRectElement(pictureArea, cardLayout.x + CONFIG.RECT_LAYOUT.CARD_ELEMENTS.PICTURE.x,
                                cardLayout.y + CONFIG.RECT_LAYOUT.CARD_ELEMENTS.PICTURE.y,
                                CONFIG.RECT_LAYOUT.CARD_ELEMENTS.PICTURE.width,
                                CONFIG.RECT_LAYOUT.CARD_ELEMENTS.PICTURE.height, rectWidth, rectHeight);
        
        const image = document.createElement('img');
        image.src = card.image;
        image.alt = card.name;
        image.className = 'rect-card-image';
        
        // Calculate image size to fit within picture area while maintaining aspect ratio
        const pictureWidth = (CONFIG.RECT_LAYOUT.CARD_ELEMENTS.PICTURE.width / 100) * rectWidth;
        const pictureHeight = (CONFIG.RECT_LAYOUT.CARD_ELEMENTS.PICTURE.height / 100) * rectHeight;
        
        image.onload = () => {
            const imageAspect = image.naturalWidth / image.naturalHeight;
            const areaAspect = pictureWidth / pictureHeight;
            
            if (imageAspect > areaAspect) {
                // Image is wider - fit to width
                image.style.width = '90%';
                image.style.height = 'auto';
            } else {
                // Image is taller - fit to height
                image.style.height = '90%';
                image.style.width = 'auto';
            }
        };
        
        pictureArea.appendChild(image);
        this.rectContainer.appendChild(pictureArea);
        
        // Create number display
        const numberDisplay = document.createElement('div');
        numberDisplay.className = `rect-card-number rect-card-number-${position}`;
        numberDisplay.textContent = card.value;
        this.positionRectElement(numberDisplay, cardLayout.x + CONFIG.RECT_LAYOUT.CARD_ELEMENTS.NUMBER.x,
                                cardLayout.y + CONFIG.RECT_LAYOUT.CARD_ELEMENTS.NUMBER.y,
                                CONFIG.RECT_LAYOUT.CARD_ELEMENTS.NUMBER.width,
                                CONFIG.RECT_LAYOUT.CARD_ELEMENTS.NUMBER.height, rectWidth, rectHeight);
        numberDisplay.style.fontSize = `${rectWidth * CONFIG.RECT_LAYOUT.FONT_SIZES.CARD_NUMBER}px`;
        this.rectContainer.appendChild(numberDisplay);
    }

    createCardBack(card, position) {
        const cardElement = this.rectContainer.querySelector(`.rect-card-${position}`);
        if (!cardElement) return;
        
        // Create card back overlay
        const cardBack = document.createElement('div');
        cardBack.className = `rect-card-back rect-card-back-${position}`;
        cardBack.dataset.cardId = card.id;
        cardBack.dataset.position = position;
        cardBack.style.cursor = 'pointer';
        cardBack.style.pointerEvents = 'auto';
        
        // Start invisible and fade in
        cardBack.style.opacity = '0';
        cardBack.style.transition = 'opacity 1s ease-in';
        
        cardElement.appendChild(cardBack);
        
        // Fade in the back after a short delay
        setTimeout(() => {
            cardBack.style.opacity = '1';
        }, 100);
    }

    async revealCard(card, position) {
        // Remove the card back if it exists
        const cardBack = this.rectContainer.querySelector(`.rect-card-back-${position}`);
        if (cardBack) {
            cardBack.style.transition = 'transform 0.3s ease-out';
            cardBack.style.transform = 'scaleX(0)';
            
            await this.wait(300);
            cardBack.remove();
        }
        
        // Mark card as revealed
        const cardElement = this.rectContainer.querySelector(`.rect-card-${position}`);
        if (cardElement) {
            cardElement.classList.add('revealed');
        }
    }

    highlightWinner(winnerPosition, results) {
        const positions = ['left', 'middle', 'right'];
        
        positions.forEach((position, index) => {
            const cardElement = this.rectContainer.querySelector(`.rect-card-${position}`);
            if (!cardElement) return;
            
            if (results[index] === 'winner') {
                cardElement.classList.add('winner');
            } else if (results[index] === 'loser') {
                cardElement.classList.add('loser');
            } else if (results[index] === 'draw') {
                cardElement.classList.add('draw');
            }
        });
    }

    updateScores(userScore, playerAScore, playerBScore) {
        // Update score displays with animation
        this.animateScoreUpdate(this.scoreElements.user.box, userScore);
        this.animateScoreUpdate(this.scoreElements.playerA.box, playerAScore);
        this.animateScoreUpdate(this.scoreElements.playerB.box, playerBScore);
    }

    animateScoreUpdate(scoreElement, newScore) {
        scoreElement.classList.add('score-update');
        
        setTimeout(() => {
            scoreElement.textContent = newScore;
            scoreElement.classList.remove('score-update');
        }, 400);
    }

    setPlayerNames(playerAName, playerBName) {
        this.scoreElements.playerA.name.textContent = playerAName.toUpperCase();
        this.scoreElements.playerB.name.textContent = playerBName.toUpperCase();
    }

    showPlayerTurn(player) {
        // Remove previous turn indicators
        Object.values(this.scoreElements).forEach(scoreEl => {
            scoreEl.box.classList.remove('player-turn');
        });
        
        // Add turn indicator to current player
        if (player === 'user') {
            this.scoreElements.user.box.classList.add('player-turn');
        } else if (player === 'playerA') {
            this.scoreElements.playerA.box.classList.add('player-turn');
        } else if (player === 'playerB') {
            this.scoreElements.playerB.box.classList.add('player-turn');
        }
    }

    clearPlayerTurns() {
        Object.values(this.scoreElements).forEach(scoreEl => {
            scoreEl.box.classList.remove('player-turn');
        });
    }

    async clearRectCards() {
        // Clear rectangular card elements with fade out
        const rectCardElements = this.rectContainer.querySelectorAll('.rect-card, .rect-card-title, .rect-card-picture, .rect-card-number, .rect-card-back');
        
        rectCardElements.forEach(element => {
            element.style.transition = `opacity ${CONFIG.CARD_FADE_DURATION}ms ease-out`;
            element.style.opacity = '0';
        });
        
        await this.wait(CONFIG.CARD_FADE_DURATION);
        
        // Remove rect card elements (keep score boxes)
        rectCardElements.forEach(element => element.remove());
        
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

    hideRectCardElements() {
        // Hide all rect card elements except scores
        const cardElements = this.rectContainer.querySelectorAll('.rect-card, .rect-card-title, .rect-card-picture, .rect-card-number, .rect-card-back');
        cardElements.forEach(element => {
            element.classList.add('hidden');
        });
    }

    showGameComplete() {
        const modal = document.getElementById('gameModal');
        modal.classList.remove('hidden');
    }

    // Handle window resize for responsive rectangular layout
    handleResize() {
        // Reposition rectangular container
        this.positionRectContainer();
        
        // Reposition score elements
        const { rectWidth, rectHeight } = this.calculateRectDimensions();
        
        // Update score name elements
        Object.entries(this.scoreElements).forEach(([player, elements]) => {
            const nameLayout = player === 'user' ? CONFIG.RECT_LAYOUT.LEFT_SCORE_NAME :
                              player === 'playerA' ? CONFIG.RECT_LAYOUT.MIDDLE_SCORE_NAME :
                              CONFIG.RECT_LAYOUT.RIGHT_SCORE_NAME;
            const boxLayout = player === 'user' ? CONFIG.RECT_LAYOUT.LEFT_SCORE_BOX :
                             player === 'playerA' ? CONFIG.RECT_LAYOUT.MIDDLE_SCORE_BOX :
                             CONFIG.RECT_LAYOUT.RIGHT_SCORE_BOX;
            
            this.positionRectElement(elements.name, nameLayout.x, nameLayout.y, nameLayout.width, nameLayout.height, rectWidth, rectHeight);
            this.positionRectElement(elements.box, boxLayout.x, boxLayout.y, boxLayout.width, boxLayout.height, rectWidth, rectHeight);
            
            elements.name.style.fontSize = `${rectWidth * CONFIG.RECT_LAYOUT.FONT_SIZES.SCORE_NAME}px`;
            elements.box.style.fontSize = `${rectWidth * CONFIG.RECT_LAYOUT.FONT_SIZES.SCORE_BOX}px`;
        });
        
        // If in rect mode, reposition all card elements
        if (this.currentMode === 'rect') {
            const cardElements = this.rectContainer.querySelectorAll('.rect-card, .rect-card-title, .rect-card-picture, .rect-card-number');
            cardElements.forEach(element => {
                // Recalculate positions based on element classes
                // This would need more specific logic based on the element type and position
                // For now, we'll let the game controller handle recreation if needed
            });
        }
    }

    // Utility method for waiting
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    reset() {
        this.currentMode = 'grid';
        
        // Reset scores to 0
        Object.values(this.scoreElements).forEach(scoreEl => {
            scoreEl.box.textContent = '0';
        });
        
        // Reset player names
        this.scoreElements.playerA.name.textContent = 'A';
        this.scoreElements.playerB.name.textContent = 'B';
        
        this.initializeLayout();
    }
}

// Add resize listener for responsive behavior
window.addEventListener('resize', () => {
    if (window.trumps2Game && window.trumps2Game.renderer) {
        window.trumps2Game.renderer.handleResize();
    }
});
