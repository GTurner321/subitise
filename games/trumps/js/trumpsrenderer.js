class TrumpsRenderer {
    constructor() {
        this.gameArea = document.querySelector('.game-area');
        this.cardGrid = null;
        this.centerArea = null;
        this.squareContainer = null;
        this.userScoreElement = null;
        this.computerScoreElement = null;
        this.squareUserScoreElement = null;
        this.squareComputerScoreElement = null;
        
        // Track current layout mode
        this.currentMode = 'grid'; // 'grid' or 'square'
        
        this.initializeLayout();
    }

    initializeLayout() {
        // Clear game area
        this.gameArea.innerHTML = '';
        
        // Create rainbow container first (so it's behind everything)
        const rainbowContainer = document.createElement('div');
        rainbowContainer.className = 'rainbow-container';
        rainbowContainer.id = 'rainbowContainer';
        this.gameArea.appendChild(rainbowContainer);
        
        // Create grid layout elements
        this.createGridLayout();
        
        // Create square layout elements (initially hidden)
        this.createSquareLayout();
    }

    createGridLayout() {
        // Create scores container for grid layout
        const scoresContainer = document.createElement('div');
        scoresContainer.className = 'scores-container';
        
        this.userScoreElement = document.createElement('div');
        this.userScoreElement.className = 'score-box user-score';
        this.userScoreElement.textContent = '0';
        
        this.computerScoreElement = document.createElement('div');
        this.computerScoreElement.className = 'score-box computer-score';
        this.computerScoreElement.textContent = '0';
        
        scoresContainer.appendChild(this.userScoreElement);
        scoresContainer.appendChild(this.computerScoreElement);
        
        // Create card grid container
        this.cardGrid = document.createElement('div');
        this.cardGrid.className = 'card-grid';
        
        // Create original center area (for backwards compatibility)
        this.centerArea = document.createElement('div');
        this.centerArea.className = 'center-area hidden';
        
        // Add to game area
        this.gameArea.appendChild(scoresContainer);
        this.gameArea.appendChild(this.cardGrid);
        this.gameArea.appendChild(this.centerArea);
    }

    createSquareLayout() {
        // Create square container
        this.squareContainer = document.createElement('div');
        this.squareContainer.className = 'square-container hidden';
        
        // Create square score boxes
        this.squareUserScoreElement = document.createElement('div');
        this.squareUserScoreElement.className = 'square-score-box user-score';
        this.squareUserScoreElement.textContent = '0';
        
        this.squareComputerScoreElement = document.createElement('div');
        this.squareComputerScoreElement.className = 'square-score-box computer-score';
        this.squareComputerScoreElement.textContent = '0';
        
        this.squareContainer.appendChild(this.squareUserScoreElement);
        this.squareContainer.appendChild(this.squareComputerScoreElement);
        
        // Add to game area
        this.gameArea.appendChild(this.squareContainer);
    }

    calculateSquareDimensions() {
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const width = gameAreaRect.width;
        const height = gameAreaRect.height;
        
        let squareSize, left, top;
        
        if (width > height) {
            // Width > height: square size = height, center horizontally
            squareSize = height;
            left = (width - height) / 2;
            top = 0;
        } else {
            // Height > width: square size = width, center vertically
            squareSize = width;
            left = 0;
            top = (height - width) / 2;
        }
        
        return { squareSize, left, top };
    }

    positionSquareElements() {
        const { squareSize, left, top } = this.calculateSquareDimensions();
        
        // Position square container
        this.squareContainer.style.left = `${left}px`;
        this.squareContainer.style.top = `${top}px`;
        this.squareContainer.style.width = `${squareSize}px`;
        this.squareContainer.style.height = `${squareSize}px`;
        
        // Position score boxes
        this.positionSquareElement(this.squareUserScoreElement, 25, 4, 15, 15, squareSize);
        this.positionSquareElement(this.squareComputerScoreElement, 60, 4, 15, 15, squareSize);
        
        // Set score box font size
        const scoreFontSize = squareSize * 0.08; // 8% of square size
        this.squareUserScoreElement.style.fontSize = `${scoreFontSize}px`;
        this.squareComputerScoreElement.style.fontSize = `${scoreFontSize}px`;
    }

    positionSquareElement(element, x, y, width, height, squareSize) {
        element.style.left = `${(x / 100) * squareSize}px`;
        element.style.top = `${(y / 100) * squareSize}px`;
        element.style.width = `${(width / 100) * squareSize}px`;
        element.style.height = `${(height / 100) * squareSize}px`;
    }

    renderCardGrid(availableCards) {
        this.currentMode = 'grid';
        
        // Show grid layout, hide square layout
        this.cardGrid.classList.remove('hidden');
        this.cardGrid.parentElement.querySelector('.scores-container').style.display = 'flex';
        this.squareContainer.classList.add('hidden');
        this.centerArea.classList.add('hidden');
        
        this.cardGrid.innerHTML = '';
        
        // Create 20 slots total: 2 margin slots + 8 card slots per row
        for (let i = 0; i < 20; i++) {
            const cardElement = document.createElement('div');
            cardElement.className = 'card-slot';
            
            // Skip margin slots (positions 0, 9, 10, 19)
            if (i === 0 || i === 9 || i === 10 || i === 19) {
                cardElement.style.visibility = 'hidden';
                this.cardGrid.appendChild(cardElement);
                continue;
            }
            
            // Calculate actual card position (0-15)
            let cardPosition;
            if (i >= 1 && i <= 8) {
                cardPosition = i - 1; // First row: positions 1-8 become 0-7
            } else if (i >= 11 && i <= 18) {
                cardPosition = i - 3; // Second row: positions 11-18 become 8-15
            }
            
            cardElement.dataset.position = cardPosition;
            
            // Check if this position has a card
            const card = availableCards.find(c => c.originalPosition === cardPosition);
            if (card) {
                cardElement.classList.add('card-back');
                cardElement.dataset.cardId = card.id;
                
                // Create card back design without bear image
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

    async selectAndMoveCards(userCard, computerCard) {
        // Get the selected card elements
        const userCardElement = this.cardGrid.querySelector(`[data-card-id="${userCard.id}"]`);
        const computerCardElement = this.cardGrid.querySelector(`[data-card-id="${computerCard.id}"]`);
        
        // Fade out all other cards
        const allCards = this.cardGrid.querySelectorAll('.card-slot:not(.empty-slot)');
        allCards.forEach(card => {
            if (card !== userCardElement && card !== computerCardElement) {
                card.style.transition = `opacity ${CONFIG.CARD_FADE_DURATION}ms ease-out`;
                card.style.opacity = '0';
            }
        });
        
        // Wait for fade out
        await this.wait(CONFIG.CARD_FADE_DURATION);
        
        // Switch to square layout
        this.switchToSquareLayout(userCard, computerCard);
        
        await this.wait(CONFIG.CARD_MOVE_DURATION);
    }

    switchToSquareLayout(userCard, computerCard) {
        this.currentMode = 'square';
        
        // Hide grid layout
        this.cardGrid.classList.add('hidden');
        this.cardGrid.parentElement.querySelector('.scores-container').style.display = 'none';
        this.centerArea.classList.add('hidden');
        
        // Position and show square layout
        this.positionSquareElements();
        this.squareContainer.classList.remove('hidden');
        
        // Create square cards
        this.createSquareCard(userCard, 'user');
        this.createSquareCard(computerCard, 'computer');
        
        // Update square scores to match current scores
        this.squareUserScoreElement.textContent = this.userScoreElement.textContent;
        this.squareComputerScoreElement.textContent = this.computerScoreElement.textContent;
        
        // Animate cards sliding in
        const squareCards = this.squareContainer.querySelectorAll('.square-card');
        squareCards.forEach(card => {
            card.style.animation = `cardSlideIn ${CONFIG.CARD_MOVE_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`;
        });
    }

    createSquareCard(card, player) {
        const { squareSize } = this.calculateSquareDimensions();
        
        // Calculate positions based on player
        const isUser = player === 'user';
        const cardX = isUser ? 2 : 53;
        const cardY = 23;
        const cardWidth = 45;
        const cardHeight = 73;
        
        // Create card container
        const cardElement = document.createElement('div');
        cardElement.className = `square-card ${player}-card`;
        cardElement.dataset.cardId = card.id;
        this.positionSquareElement(cardElement, cardX, cardY, cardWidth, cardHeight, squareSize);
        
        // Card inner container for flip effect
        const cardInner = document.createElement('div');
        cardInner.className = 'square-card-inner';
        
        // Card back
        const cardBack = document.createElement('div');
        cardBack.className = 'square-card-face square-card-back-face';
        
        // Card front
        const cardFront = document.createElement('div');
        cardFront.className = 'square-card-face square-card-front-face';
        
        // Create card elements
        this.createSquareCardElements(card, player, cardFront, squareSize);
        
        cardInner.appendChild(cardBack);
        cardInner.appendChild(cardFront);
        cardElement.appendChild(cardInner);
        
        this.squareContainer.appendChild(cardElement);
    }

    createSquareCardElements(card, player, cardFront, squareSize) {
        const isUser = player === 'user';
        const baseX = isUser ? 7 : 58;
        
        // Create title
        const title = document.createElement('div');
        title.className = 'square-card-title';
        title.textContent = card.name;
        this.positionSquareElement(title, baseX, 23, 35, 9, squareSize);
        title.style.fontSize = `${squareSize * 0.025}px`; // 2.5% of square size
        cardFront.appendChild(title);
        
        // Create picture area
        const pictureArea = document.createElement('div');
        pictureArea.className = 'square-card-picture';
        this.positionSquareElement(pictureArea, baseX, 32, 35, 30, squareSize);
        
        const image = document.createElement('img');
        image.src = card.image;
        image.alt = card.name;
        image.className = 'square-card-image';
        pictureArea.appendChild(image);
        cardFront.appendChild(pictureArea);
        
        // Create category buttons
        const buttonYPositions = [64, 74, 84];
        const categories = Object.keys(CONFIG.CATEGORIES);
        
        categories.forEach((categoryKey, index) => {
            const category = CONFIG.CATEGORIES[categoryKey];
            const categoryInfo = CONFIG.CATEGORY_INFO[category];
            const value = card.stats[category];
            
            const button = document.createElement('div');
            button.className = `square-card-button ${isUser ? 'clickable' : 'display-only'}`;
            button.dataset.category = category;
            this.positionSquareElement(button, baseX, buttonYPositions[index], 35, 9, squareSize);
            button.style.fontSize = `${squareSize * 0.02}px`; // 2% of square size
            
            // Create label
            const label = document.createElement('span');
            label.className = 'square-card-button-label';
            label.textContent = categoryInfo.label;
            button.appendChild(label);
            
            // Create value (stars or text)
            if (category === 'stars') {
                const starsContainer = document.createElement('div');
                starsContainer.className = 'square-stars';
                
                const fullStars = Math.floor(value);
                const hasHalfStar = value % 1 !== 0;
                
                // Add full stars
                for (let i = 0; i < fullStars; i++) {
                    const star = document.createElement('i');
                    star.className = 'fa-solid fa-star square-star';
                    star.style.fontSize = `${squareSize * 0.025}px`; // 2.5% of square size
                    starsContainer.appendChild(star);
                }
                
                // Add half star if needed
                if (hasHalfStar) {
                    const halfStar = document.createElement('i');
                    halfStar.className = 'fa-solid fa-star-half-stroke square-star';
                    halfStar.style.fontSize = `${squareSize * 0.025}px`; // 2.5% of square size
                    starsContainer.appendChild(halfStar);
                }
                
                button.appendChild(starsContainer);
            } else {
                const valueSpan = document.createElement('span');
                valueSpan.className = 'square-card-button-value';
                valueSpan.textContent = `${value}${categoryInfo.suffix}`;
                button.appendChild(valueSpan);
            }
            
            if (isUser) {
                button.style.cursor = 'pointer';
            }
            
            cardFront.appendChild(button);
        });
    }

    async flipCard(cardId, player) {
        const cardElement = this.squareContainer.querySelector(`[data-card-id="${cardId}"]`);
        const cardInner = cardElement.querySelector('.square-card-inner');
        
        cardInner.style.transform = 'rotateY(180deg)';
        cardInner.style.transition = `transform ${CONFIG.CARD_FLIP_DURATION}ms ease-in-out`;
        
        await this.wait(CONFIG.CARD_FLIP_DURATION);
    }

    highlightWinner(userCard, computerCard, category, result) {
        const userCardElement = this.squareContainer.querySelector('.user-card');
        const computerCardElement = this.squareContainer.querySelector('.computer-card');
        
        // Remove any existing highlights
        userCardElement.classList.remove('winner', 'loser', 'draw');
        computerCardElement.classList.remove('winner', 'loser', 'draw');
        
        // Highlight the selected category on both cards
        const userButton = userCardElement.querySelector(`[data-category="${category}"]`);
        const computerButton = computerCardElement.querySelector(`[data-category="${category}"]`);
        
        userButton.classList.add('selected-category');
        computerButton.classList.add('selected-category');
        
        // Apply result styling
        if (result === 'user') {
            userCardElement.classList.add('winner');
            computerCardElement.classList.add('loser');
        } else if (result === 'computer') {
            computerCardElement.classList.add('winner');
            userCardElement.classList.add('loser');
        } else {
            userCardElement.classList.add('draw');
            computerCardElement.classList.add('draw');
        }
    }

    updateScores(userScore, computerScore) {
        // Update both grid and square score displays
        
        // Grid scores
        this.userScoreElement.style.transform = 'scale(1.2)';
        this.computerScoreElement.style.transform = 'scale(1.2)';
        
        // Square scores
        this.squareUserScoreElement.style.transform = 'scale(1.2)';
        this.squareComputerScoreElement.style.transform = 'scale(1.2)';
        
        setTimeout(() => {
            // Update text content
            this.userScoreElement.textContent = userScore;
            this.computerScoreElement.textContent = computerScore;
            this.squareUserScoreElement.textContent = userScore;
            this.squareComputerScoreElement.textContent = computerScore;
            
            // Reset scale
            this.userScoreElement.style.transform = 'scale(1)';
            this.computerScoreElement.style.transform = 'scale(1)';
            this.squareUserScoreElement.style.transform = 'scale(1)';
            this.squareComputerScoreElement.style.transform = 'scale(1)';
        }, 150);
    }

    async clearCenterCards() {
        if (this.currentMode === 'square') {
            // Clear square cards
            const squareCards = this.squareContainer.querySelectorAll('.square-card');
            
            squareCards.forEach(card => {
                card.style.animation = `cardSlideOut ${CONFIG.CARD_FADE_DURATION}ms ease-in forwards`;
            });
            
            await this.wait(CONFIG.CARD_FADE_DURATION);
            
            // Remove square cards from container (keep score boxes)
            squareCards.forEach(card => card.remove());
            
            // Switch back to grid layout
            this.switchToGridLayout();
        } else {
            // Original center area clearing (for backwards compatibility)
            const centerCards = this.centerArea.querySelectorAll('.center-card');
            
            centerCards.forEach(card => {
                card.style.animation = `cardSlideOut ${CONFIG.CARD_FADE_DURATION}ms ease-in forwards`;
            });
            
            await this.wait(CONFIG.CARD_FADE_DURATION);
            this.centerArea.innerHTML = '';
        }
    }

    switchToGridLayout() {
        this.currentMode = 'grid';
        
        // Hide square layout
        this.squareContainer.classList.add('hidden');
        
        // Show grid layout
        this.cardGrid.classList.remove('hidden');
        this.cardGrid.parentElement.querySelector('.scores-container').style.display = 'flex';
        
        // Reset card opacities for next round
        const allCards = this.cardGrid.querySelectorAll('.card-slot');
        allCards.forEach(card => {
            card.style.opacity = '1';
            card.style.transition = '';
        });
    }

    showGameComplete() {
        const modal = document.getElementById('gameModal');
        modal.classList.remove('hidden');
    }

    createStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let starsHtml = '';
        
        // Add full stars
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<span class="star full-star">★</span>';
        }
        
        // Add half star if needed
        if (hasHalfStar) {
            starsHtml += '<span class="star half-star">★</span>';
        }
        
        return starsHtml;
    }

    // Handle window resize for responsive square layout
    handleResize() {
        if (this.currentMode === 'square') {
            this.positionSquareElements();
            
            // Reposition existing square cards
            const squareCards = this.squareContainer.querySelectorAll('.square-card');
            squareCards.forEach(card => {
                const isUser = card.classList.contains('user-card');
                const cardData = {
                    id: card.dataset.cardId,
                    name: card.querySelector('.square-card-title').textContent
                };
                
                // Remove and recreate the card with new dimensions
                const parent = card.parentElement;
                card.remove();
                
                // Get card data from CONFIG to recreate properly
                const configCard = CONFIG.CARDS.find(c => c.id == cardData.id);
                if (configCard) {
                    this.createSquareCard(configCard, isUser ? 'user' : 'computer');
                }
            });
        }
    }

    // Utility method for waiting
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    reset() {
        this.currentMode = 'grid';
        this.initializeLayout();
    }
}

// Add resize listener for responsive behavior
window.addEventListener('resize', () => {
    if (window.trumpsGame && window.trumpsGame.renderer) {
        window.trumpsGame.renderer.handleResize();
    }
});
