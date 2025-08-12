class TrumpsRenderer {
    constructor() {
        this.gameArea = document.querySelector('.game-area');
        this.cardGrid = null;
        this.centerArea = null;
        this.userScoreElement = null;
        this.computerScoreElement = null;
        
        this.initializeLayout();
    }

    initializeLayout() {
        // Clear game area
        this.gameArea.innerHTML = '';
        
        // Create scores container
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
        
        // Create center area for selected cards
        this.centerArea = document.createElement('div');
        this.centerArea.className = 'center-area hidden';
        
        // Add everything to game area
        this.gameArea.appendChild(scoresContainer);
        this.gameArea.appendChild(this.cardGrid);
        this.gameArea.appendChild(this.centerArea);
    }

    renderCardGrid(availableCards) {
        this.cardGrid.innerHTML = '';
        this.cardGrid.classList.remove('hidden');
        this.centerArea.classList.add('hidden');
        
        // Create 20 slots total: 2 margin slots + 8 card slots per row
        // This allows us to use CSS grid positioning correctly
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
                
                // Create card back design with bear image using img element
                const cardBack = document.createElement('div');
                cardBack.className = 'card-back-design';
                
                const cardPattern = document.createElement('div');
                cardPattern.className = 'card-pattern';
                
                const cardBearContainer = document.createElement('div');
                cardBearContainer.className = 'card-bear-image';
                
                const bearImg = document.createElement('img');
                bearImg.src = '../../assets/bear.png';
                bearImg.alt = 'Bear';
                bearImg.style.width = '100%';
                bearImg.style.height = '100%';
                bearImg.style.objectFit = 'contain';
                bearImg.style.filter = 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)';
                bearImg.style.opacity = '0.8';
                
                cardBearContainer.appendChild(bearImg);
                cardBack.appendChild(cardPattern);
                cardBack.appendChild(cardBearContainer);
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
        
        // Hide grid and show center area
        this.cardGrid.classList.add('hidden');
        this.centerArea.classList.remove('hidden');
        
        // Apply ButtonBar margins and white background when showing center cards
        this.applyButtonBarMargins();
        
        // Create center cards
        this.createCenterCard(userCard, 'user');
        this.createCenterCard(computerCard, 'computer');
        
        // Animate cards moving to center (they appear with move animation)
        const centerCards = this.centerArea.querySelectorAll('.center-card');
        centerCards.forEach(card => {
            card.style.animation = `cardSlideIn ${CONFIG.CARD_MOVE_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`;
        });
        
        await this.wait(CONFIG.CARD_MOVE_DURATION);
    }
    
    applyButtonBarMargins() {
        const gameArea = document.querySelector('.game-area');
        if (gameArea && window.ButtonBar) {
            // Get current outside margin from ButtonBar system
            const outsideMargin = window.ButtonBar.getOutsideMarginPercent();
            
            // Apply margins to game area for center card phase
            gameArea.style.marginLeft = `${outsideMargin}vw`;
            gameArea.style.marginRight = `${outsideMargin}vw`;
            gameArea.style.width = `${100 - (2 * outsideMargin)}vw`;
            gameArea.style.background = 'white'; // White background for center area
            gameArea.style.zIndex = '20'; // Higher z-index to hide rainbow during card selection
            
            console.log(`📐 Applied ButtonBar margins: ${outsideMargin}vw`);
        }
    }
    
    removeButtonBarMargins() {
        const gameArea = document.querySelector('.game-area');
        if (gameArea) {
            // Reset to full width for card grid phase
            gameArea.style.marginLeft = '0';
            gameArea.style.marginRight = '0';
            gameArea.style.width = '100vw';
            gameArea.style.background = 'linear-gradient(135deg, #e3f2fd, #f3e5f5)'; // Back to gradient
            gameArea.style.zIndex = ''; // Reset z-index to show rainbow
            
            console.log('📐 Removed ButtonBar margins - back to full width');
        }
    }

    createCenterCard(card, player) {
        const cardElement = document.createElement('div');
        cardElement.className = `center-card ${player}-card`;
        cardElement.dataset.cardId = card.id;
        
        // Card inner container for flip effect
        const cardInner = document.createElement('div');
        cardInner.className = 'card-inner';
        
        // Card back
        const cardBack = document.createElement('div');
        cardBack.className = 'card-face card-back-face';
        
        const cardPattern = document.createElement('div');
        cardPattern.className = 'card-pattern';
        
        const cardBearContainer = document.createElement('div');
        cardBearContainer.className = 'card-bear-image';
        
        const bearImg = document.createElement('img');
        bearImg.src = '../../assets/bear.png';
        bearImg.alt = 'Bear';
        bearImg.style.width = '100%';
        bearImg.style.height = '100%';
        bearImg.style.objectFit = 'contain';
        bearImg.style.filter = 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)';
        bearImg.style.opacity = '0.8';
        
        cardBearContainer.appendChild(bearImg);
        cardBack.appendChild(cardPattern);
        cardBack.appendChild(cardBearContainer);
        
        // Card front
        const cardFront = document.createElement('div');
        cardFront.className = 'card-face card-front-face';
        
        const cardName = document.createElement('h3');
        cardName.className = 'card-name';
        cardName.textContent = card.name;
        
        // Create square image window
        const imageWindow = document.createElement('div');
        imageWindow.className = 'card-image-window';
        
        const cardImage = document.createElement('img');
        cardImage.src = card.image;
        cardImage.alt = card.name;
        cardImage.className = 'card-image';
        
        imageWindow.appendChild(cardImage);
        
        const statsContainer = document.createElement('div');
        statsContainer.className = 'card-stats';
        
        // Create category buttons (only for user card)
        Object.keys(CONFIG.CATEGORIES).forEach(categoryKey => {
            const category = CONFIG.CATEGORIES[categoryKey];
            const categoryInfo = CONFIG.CATEGORY_INFO[category];
            const value = card.stats[category];
            
            const statElement = document.createElement('div');
            statElement.className = `card-stat ${player === 'user' ? 'stat-button' : 'stat-display'}`;
            statElement.dataset.category = category;
            
            const statLabel = document.createElement('div');
            statLabel.className = 'stat-label';
            statLabel.textContent = categoryInfo.label;
            
            const statValue = document.createElement('div');
            statValue.className = 'stat-value';
            
            // Handle star rating display
            if (category === 'stars') {
                statValue.innerHTML = this.createStarRating(value);
            } else {
                statValue.textContent = `${value}${categoryInfo.suffix}`;
            }
            
            statElement.appendChild(statLabel);
            statElement.appendChild(statValue);
            
            if (player === 'user') {
                statElement.style.cursor = 'pointer';
            }
            
            statsContainer.appendChild(statElement);
        });
        
        cardFront.appendChild(cardName);
        cardFront.appendChild(imageWindow);
        cardFront.appendChild(statsContainer);
        
        cardInner.appendChild(cardBack);
        cardInner.appendChild(cardFront);
        cardElement.appendChild(cardInner);
        
        this.centerArea.appendChild(cardElement);
    }

    async flipCard(cardId, player) {
        const cardElement = this.centerArea.querySelector(`[data-card-id="${cardId}"]`);
        const cardInner = cardElement.querySelector('.card-inner');
        
        cardInner.style.transform = 'rotateY(180deg)';
        cardInner.style.transition = `transform ${CONFIG.CARD_FLIP_DURATION}ms ease-in-out`;
        
        await this.wait(CONFIG.CARD_FLIP_DURATION);
    }

    highlightWinner(userCard, computerCard, category, result) {
        const userCardElement = this.centerArea.querySelector('.user-card');
        const computerCardElement = this.centerArea.querySelector('.computer-card');
        
        // Remove any existing highlights
        userCardElement.classList.remove('winner', 'loser', 'draw');
        computerCardElement.classList.remove('winner', 'loser', 'draw');
        
        // Highlight the selected category on both cards
        const userStat = userCardElement.querySelector(`[data-category="${category}"]`);
        const computerStat = computerCardElement.querySelector(`[data-category="${category}"]`);
        
        userStat.classList.add('selected-category');
        computerStat.classList.add('selected-category');
        
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
        // Animate score change
        this.userScoreElement.style.transform = 'scale(1.2)';
        this.computerScoreElement.style.transform = 'scale(1.2)';
        
        setTimeout(() => {
            this.userScoreElement.textContent = userScore;
            this.computerScoreElement.textContent = computerScore;
            
            this.userScoreElement.style.transform = 'scale(1)';
            this.computerScoreElement.style.transform = 'scale(1)';
        }, 150);
    }

    async clearCenterCards() {
        const centerCards = this.centerArea.querySelectorAll('.center-card');
        
        centerCards.forEach(card => {
            card.style.animation = `cardSlideOut ${CONFIG.CARD_FADE_DURATION}ms ease-in forwards`;
        });
        
        await this.wait(CONFIG.CARD_FADE_DURATION);
        this.centerArea.innerHTML = '';
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

    // Utility method for waiting
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    reset() {
        this.initializeLayout();
    }
}
