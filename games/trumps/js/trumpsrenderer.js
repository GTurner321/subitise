class TrumpsRenderer {
    constructor() {
        this.gameArea = document.querySelector('.game-area');
        this.cardGrid = null;
        this.squareContainer = null;
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
        rainbowContainer.style.position = 'absolute';
        rainbowContainer.style.top = '0';
        rainbowContainer.style.left = '0';
        rainbowContainer.style.width = '100%';
        rainbowContainer.style.height = '100%';
        rainbowContainer.style.zIndex = '1';
        rainbowContainer.style.pointerEvents = 'none';
        console.log('🌈 Created rainbow container:', rainbowContainer);
        this.gameArea.appendChild(rainbowContainer);
        
        // Create square container (always present, transparent)
        this.createSquareContainer();
        
        // Create grid layout elements
        this.createGridLayout();
    }

    createSquareContainer() {
        // Create square container - always present
        this.squareContainer = document.createElement('div');
        this.squareContainer.className = 'square-container';
        this.squareContainer.style.pointerEvents = 'none'; // Allow clicks to pass through to grid cards
        
        // Position the square container
        this.positionSquareContainer();
        
        // Create square score boxes (always visible)
        this.createSquareScores();
        
        // Add to game area
        this.gameArea.appendChild(this.squareContainer);
    }

    createSquareScores() {
        const { squareSize } = this.calculateSquareDimensions();
        
        // Create user score box
        this.squareUserScoreElement = document.createElement('div');
        this.squareUserScoreElement.className = 'square-score-box user-score';
        this.squareUserScoreElement.textContent = '0';
        this.squareUserScoreElement.style.pointerEvents = 'auto'; // Score boxes should be clickable if needed
        this.positionSquareElement(this.squareUserScoreElement, 25, 4, 15, 15, squareSize);
        this.squareUserScoreElement.style.fontSize = `${squareSize * CONFIG.SQUARE_LAYOUT.FONT_SIZES.SCORE}px`;
        this.squareUserScoreElement.style.boxShadow = '0 3% 6% rgba(0,0,0,0.3)'; // Added shadow
        
        // Create computer score box
        this.squareComputerScoreElement = document.createElement('div');
        this.squareComputerScoreElement.className = 'square-score-box computer-score';
        this.squareComputerScoreElement.textContent = '0';
        this.squareComputerScoreElement.style.pointerEvents = 'auto'; // Score boxes should be clickable if needed
        this.positionSquareElement(this.squareComputerScoreElement, 60, 4, 15, 15, squareSize);
        this.squareComputerScoreElement.style.fontSize = `${squareSize * CONFIG.SQUARE_LAYOUT.FONT_SIZES.SCORE}px`;
        this.squareComputerScoreElement.style.boxShadow = '0 3% 6% rgba(0,0,0,0.3)'; // Added shadow
        
        this.squareContainer.appendChild(this.squareUserScoreElement);
        this.squareContainer.appendChild(this.squareComputerScoreElement);
    }

    createGridLayout() {
        // Create card grid container (no scores needed - using square scores)
        this.cardGrid = document.createElement('div');
        this.cardGrid.className = 'card-grid';
        
        // Add to game area
        this.gameArea.appendChild(this.cardGrid);
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

    positionSquareContainer() {
        const { squareSize, left, top } = this.calculateSquareDimensions();
        
        // Position square container
        this.squareContainer.style.left = `${left}px`;
        this.squareContainer.style.top = `${top}px`;
        this.squareContainer.style.width = `${squareSize}px`;
        this.squareContainer.style.height = `${squareSize}px`;
    }

    positionSquareElement(element, x, y, width, height, squareSize) {
        element.style.left = `${(x / 100) * squareSize}px`;
        element.style.top = `${(y / 100) * squareSize}px`;
        element.style.width = `${(width / 100) * squareSize}px`;
        element.style.height = `${(height / 100) * squareSize}px`;
    }

    renderCardGrid(availableCards) {
        this.currentMode = 'grid';
        
        // Show grid layout, hide square card elements
        this.cardGrid.classList.remove('hidden');
        this.hideSquareCardElements();
        
        this.cardGrid.innerHTML = '';
        
        // Create 16 card slots with direct positioning (no complex grid logic)
        for (let position = 0; position < 16; position++) {
            const cardElement = document.createElement('div');
            cardElement.className = 'card-slot';
            cardElement.dataset.position = position;
            
            // Check if this position has a card
            const card = availableCards.find(c => c.originalPosition === position);
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
        
        // Enable pointer events on square container for card interaction
        this.squareContainer.style.pointerEvents = 'auto';
        
        // Step 1: Create only the card backs first (blue faces)
        this.createCardBacks(userCard, 'user');
        this.createCardBacks(computerCard, 'computer');
        
        // Update square scores to match current scores
        this.squareUserScoreElement.textContent = this.squareUserScoreElement.textContent || '0';
        this.squareComputerScoreElement.textContent = this.squareComputerScoreElement.textContent || '0';
        
        // Step 2: Fade in the card backs over 1.5 seconds
        const cardBacks = this.squareContainer.querySelectorAll('.square-card-back');
        cardBacks.forEach(back => {
        back.style.opacity = '0';
        back.style.transition = 'opacity 1.5s ease-in';
        setTimeout(() => {
        back.style.opacity = '1';
        }, 200);
        });
        
        // Step 3: After 1.5 seconds (when fade in completes), create front faces and reveal user card
        setTimeout(() => {
        this.createCardFronts(userCard, 'user');
        this.createCardFronts(computerCard, 'computer');
    
        // Step 4: After front faces are ready, reveal user card
        setTimeout(async () => {
        await this.revealCard(userCard.id, 'user');
        }, 100); // Small delay to ensure front faces are rendered
    
        }, 1500); // Wait for 1.5s fade in to complete
    }

    createCardBacks(card, player) {
        const { squareSize } = this.calculateSquareDimensions();
        const isUser = player === 'user';
        const cardX = isUser ? 2 : 53;
        const cardY = 23;
        
        // Create only the card back face
        const cardBack = document.createElement('div');
        cardBack.className = `square-card-back square-card-element ${player}-card-back`;
        cardBack.dataset.cardId = card.id;
        cardBack.dataset.player = player;
        cardBack.style.position = 'absolute';
        this.positionSquareElement(cardBack, cardX, cardY, 45, 73, squareSize);
        cardBack.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        cardBack.style.borderRadius = '8%';
        cardBack.style.boxShadow = '0 4% 8% rgba(0,0,0,0.4)'; // Added stronger shadow
        cardBack.style.zIndex = '30'; // Highest z-index to cover everything
        
        // Add diagonal pattern to card back
        const pattern = document.createElement('div');
        pattern.style.position = 'absolute';
        pattern.style.top = '0';
        pattern.style.left = '0';
        pattern.style.right = '0';
        pattern.style.bottom = '0';
        pattern.style.background = `repeating-linear-gradient(
            45deg,
            rgba(255,255,255,0.1) 0,
            rgba(255,255,255,0.1) ${squareSize * 0.008}px,
            transparent ${squareSize * 0.008}px,
            transparent ${squareSize * 0.016}px
        )`;
        pattern.style.borderRadius = '8%';
        cardBack.appendChild(pattern);
        
        this.squareContainer.appendChild(cardBack);
    }

    createCardFronts(card, player) {
        const { squareSize } = this.calculateSquareDimensions();
        const isUser = player === 'user';
        const cardX = isUser ? 2 : 53;
        const cardY = 23;
        
        // Create card front face (underneath back)
        const cardFront = document.createElement('div');
        cardFront.className = `square-card-front square-card-element ${player}-card-front`;
        cardFront.dataset.cardId = card.id;
        cardFront.dataset.player = player;
        cardFront.style.position = 'absolute';
        this.positionSquareElement(cardFront, cardX, cardY, 45, 73, squareSize);
        cardFront.style.background = '#f5f5dc';
        cardFront.style.borderRadius = '8%';
        cardFront.style.boxShadow = '0 4% 8% rgba(0,0,0,0.4)'; // Added stronger shadow
        cardFront.style.border = `${squareSize * 0.005}px solid #667eea`;
        cardFront.style.zIndex = '25'; // Below back, visible when back is removed
        
        // Add diagonal pattern to card front
        const frontPattern = document.createElement('div');
        frontPattern.style.position = 'absolute';
        frontPattern.style.top = '0';
        frontPattern.style.left = '0';
        frontPattern.style.right = '0';
        frontPattern.style.bottom = '0';
        frontPattern.style.background = `repeating-linear-gradient(
            45deg,
            rgba(255, 215, 0, 0.3) 0,
            rgba(255, 215, 0, 0.3) ${squareSize * 0.008}px,
            transparent ${squareSize * 0.008}px,
            transparent ${squareSize * 0.016}px
        )`;
        frontPattern.style.borderRadius = '8%';
        frontPattern.style.pointerEvents = 'none';
        cardFront.appendChild(frontPattern);
        
        this.squareContainer.appendChild(cardFront);
        
        // Create title
        const title = document.createElement('div');
        title.className = `square-card-title square-card-element ${player}-title`;
        title.textContent = card.name;
        title.style.position = 'absolute';
        this.positionSquareElement(title, cardX + 5, cardY, 35, 9, squareSize);
        title.style.fontSize = `${squareSize * CONFIG.SQUARE_LAYOUT.FONT_SIZES.TITLE * 1.2}px`; // Smaller (was 1.5x, now 1.2x)
        title.style.fontFamily = 'Comic Sans MS, cursive';
        title.style.fontWeight = 'bold';
        title.style.color = '#333';
        title.style.textTransform = 'uppercase';
        title.style.display = 'flex';
        title.style.alignItems = 'center';
        title.style.justifyContent = 'center';
        title.style.lineHeight = '1.2';
        title.style.zIndex = '25'; // Same as front face
        this.squareContainer.appendChild(title);
        
        // Create picture area
        const pictureArea = document.createElement('div');
        pictureArea.className = `square-card-picture square-card-element ${player}-picture`;
        pictureArea.style.position = 'absolute';
        this.positionSquareElement(pictureArea, cardX + 5, cardY + 9, 35, 30, squareSize);
        pictureArea.style.borderRadius = '8%';
        pictureArea.style.background = 'linear-gradient(135deg, #e3f2fd, #f3e5f5)';
        pictureArea.style.boxShadow = 'inset 0 1% 3% rgba(135, 206, 250, 0.3)';
        pictureArea.style.border = `${squareSize * 0.005}px solid #667eea`;
        pictureArea.style.display = 'flex';
        pictureArea.style.alignItems = 'center';
        pictureArea.style.justifyContent = 'center';
        pictureArea.style.overflow = 'hidden';
        pictureArea.style.zIndex = '25'; // Same as front face
        
        const image = document.createElement('img');
        image.src = card.image;
        image.alt = card.name;
        image.style.maxWidth = '90%';
        image.style.maxHeight = '90%';
        image.style.objectFit = 'contain';
        image.style.borderRadius = '4%';
        image.style.background = 'transparent';
        pictureArea.appendChild(image);
        this.squareContainer.appendChild(pictureArea);
        
        // Create category buttons
        const buttonYOffsets = [41, 51, 61];
        const categories = Object.keys(CONFIG.CATEGORIES);
        
        categories.forEach((categoryKey, index) => {
            const category = CONFIG.CATEGORIES[categoryKey];
            const categoryInfo = CONFIG.CATEGORY_INFO[category];
            const value = card.stats[category];
            
            const button = document.createElement('div');
            button.className = `square-card-button square-card-element ${player}-button-${index + 1} ${isUser ? 'clickable' : 'display-only'}`;
            button.dataset.category = category;
            button.dataset.cardId = card.id;
            button.dataset.player = player;
            button.style.position = 'absolute';
            this.positionSquareElement(button, cardX + 5, cardY + buttonYOffsets[index], 35, 9, squareSize);
            button.style.fontSize = `${squareSize * CONFIG.SQUARE_LAYOUT.FONT_SIZES.BUTTON * 1.5}px`;
            button.style.fontFamily = 'Comic Sans MS, cursive';
            button.style.borderRadius = '8%';
            button.style.border = `${squareSize * 0.005}px solid #667eea`;
            button.style.display = 'flex';
            button.style.alignItems = 'center';
            button.style.paddingLeft = '2%';
            button.style.paddingRight = '2%';
            button.style.fontWeight = 'bold';
            button.style.textTransform = 'uppercase';
            button.style.transition = 'all 0.3s ease';
            button.style.boxShadow = '0 2% 4% rgba(0,0,0,0.2)';
            button.style.zIndex = '25'; // Same as front face
            
            if (isUser) {
                button.style.background = 'linear-gradient(135deg, #e3f2fd, #f3e5f5)';
                button.style.cursor = 'pointer';
                button.style.pointerEvents = 'auto';
            } else {
                button.style.background = 'linear-gradient(135deg, #f5f5f5, #eeeeee)';
                button.style.pointerEvents = 'none';
            }
            
            // Create label
            const label = document.createElement('span');
            label.className = 'square-card-button-label';
            label.textContent = category === 'cuddly' ? 'Cuddles' : categoryInfo.label;
            label.style.color = '#555';
            label.style.fontFamily = 'Comic Sans MS, cursive';
            button.appendChild(label);
            
            // Create value (stars or text)
            if (category === 'stars') {
                const starsContainer = document.createElement('div');
                starsContainer.className = 'square-stars';
                starsContainer.style.display = 'flex';
                starsContainer.style.alignItems = 'center';
                starsContainer.style.marginLeft = 'auto';
                starsContainer.style.marginRight = '2%';
                
                const fullStars = Math.floor(value);
                const hasHalfStar = value % 1 !== 0;
                
                // Add full stars
                for (let i = 0; i < fullStars; i++) {
                    const star = document.createElement('i');
                    star.className = 'fa-solid fa-star square-star';
                    star.style.color = '#FFD700';
                    star.style.textShadow = '0 0 6px rgba(0,0,0,0.8)';
                    star.style.marginRight = '2%';
                    star.style.fontSize = `${squareSize * CONFIG.SQUARE_LAYOUT.FONT_SIZES.STAR * 1.0}px`; // Smaller (was 1.2x, now 1.0x)
                    starsContainer.appendChild(star);
                }
                
                // Add half star if needed
                if (hasHalfStar) {
                    const halfStar = document.createElement('i');
                    halfStar.className = 'fa-solid fa-star-half-stroke square-star';
                    halfStar.style.color = '#FFD700';
                    halfStar.style.textShadow = '0 0 6px rgba(0,0,0,0.8)';
                    halfStar.style.fontSize = `${squareSize * CONFIG.SQUARE_LAYOUT.FONT_SIZES.STAR * 1.0}px`; // Smaller (was 1.2x, now 1.0x)
                    starsContainer.appendChild(halfStar);
                }
                
                button.appendChild(starsContainer);
            } else {
                const valueSpan = document.createElement('span');
                valueSpan.className = 'square-card-button-value';
                valueSpan.textContent = `${value}${categoryInfo.suffix}`;
                valueSpan.style.marginLeft = 'auto';
                valueSpan.style.marginRight = '0';
                valueSpan.style.color = '#333';
                valueSpan.style.fontFamily = 'Comic Sans MS, cursive';
                button.appendChild(valueSpan);
            }
            
            this.squareContainer.appendChild(button);
        });
    }

    async flipCard(cardId, player) {
        // Computer card reveals immediately after button click (no extra wait)
        await this.revealCard(cardId, player);
    }
    
    async revealCard(cardId, player) {
        // Sideways reveal - card back width reduces to 0 within card boundaries
        const cardBack = this.squareContainer.querySelector(`.${player}-card-back[data-card-id="${cardId}"]`);
        
        if (cardBack) {
            // Set up for width animation - blue moves to the right (reveals from right edge)
            cardBack.style.transformOrigin = 'right center'; // Blue disappears to the right
            cardBack.style.transition = 'transform 0.3s ease-out'; // Faster (0.3s instead of 0.6s)
            cardBack.style.transform = 'scaleX(0)';
            
            // Wait for animation to complete
            await this.wait(300); // Match the 0.3s duration
            
            // Hide the back completely
            cardBack.style.display = 'none';
        }
    }

    highlightWinner(userCard, computerCard, category, result) {
        // Find the category buttons for both cards
        const userButton = this.squareContainer.querySelector(`.user-button-1[data-category="${category}"], .user-button-2[data-category="${category}"], .user-button-3[data-category="${category}"]`);
        const computerButton = this.squareContainer.querySelector(`.computer-button-1[data-category="${category}"], .computer-button-2[data-category="${category}"], .computer-button-3[data-category="${category}"]`);
        
        // Highlight the selected category buttons
        if (userButton) {
            userButton.style.borderColor = '#ff6b6b';
            userButton.style.background = 'linear-gradient(135deg, #ffebee, #fce4ec)';
            userButton.style.boxShadow = '0 0 4% rgba(255, 107, 107, 0.5)';
        }
        
        if (computerButton) {
            computerButton.style.borderColor = '#ff6b6b';
            computerButton.style.background = 'linear-gradient(135deg, #ffebee, #fce4ec)';
            computerButton.style.boxShadow = '0 0 4% rgba(255, 107, 107, 0.5)';
        }
        
        // Apply result styling to card fronts
        const userCardFront = this.squareContainer.querySelector('.user-card-front');
        const computerCardFront = this.squareContainer.querySelector('.computer-card-front');
        
        if (result === 'user') {
            if (userCardFront) {
                userCardFront.style.background = 'linear-gradient(135deg, #c8e6c9, #4caf50)';
                userCardFront.style.boxShadow = '0 0 6% #4caf50';
                userCardFront.style.animation = 'pulse 1s infinite';
            }
            if (computerCardFront) {
                computerCardFront.style.background = 'linear-gradient(135deg, #ffcdd2, #f44336)';
                computerCardFront.style.opacity = '0.7';
            }
        } else if (result === 'computer') {
            if (computerCardFront) {
                computerCardFront.style.background = 'linear-gradient(135deg, #c8e6c9, #4caf50)';
                computerCardFront.style.boxShadow = '0 0 6% #4caf50';
                computerCardFront.style.animation = 'pulse 1s infinite';
            }
            if (userCardFront) {
                userCardFront.style.background = 'linear-gradient(135deg, #ffcdd2, #f44336)';
                userCardFront.style.opacity = '0.7';
            }
        } else {
            // Draw
            if (userCardFront) {
                userCardFront.style.background = 'linear-gradient(135deg, #fff3e0, #ff9800)';
            }
            if (computerCardFront) {
                computerCardFront.style.background = 'linear-gradient(135deg, #fff3e0, #ff9800)';
            }
        }
    }

    updateScores(userScore, computerScore) {
        // Update square score displays with animation (no grid scores)
        this.squareUserScoreElement.style.transform = 'scale(1.2)';
        this.squareComputerScoreElement.style.transform = 'scale(1.2)';
        
        setTimeout(() => {
            this.squareUserScoreElement.textContent = userScore;
            this.squareComputerScoreElement.textContent = computerScore;
            this.squareUserScoreElement.style.transform = 'scale(1)';
            this.squareComputerScoreElement.style.transform = 'scale(1)';
        }, 150);
    }

    async clearCenterCards() {
        // Clear square card elements with fade out only
        const squareCardElements = this.squareContainer.querySelectorAll('.square-card-element:not(.square-score-box)');
        
        squareCardElements.forEach(element => {
            element.style.transition = `opacity ${CONFIG.CARD_FADE_DURATION}ms ease-out`;
            element.style.opacity = '0';
        });
        
        await this.wait(CONFIG.CARD_FADE_DURATION);
        
        // Remove square card elements (keep score boxes)
        squareCardElements.forEach(element => element.remove());
        
        // Switch back to grid layout (but don't render cards yet - that will happen in startNewRound)
        this.switchToGridLayoutWithoutRender();
    }

    switchToGridLayoutWithoutRender() {
        this.currentMode = 'grid';
        
        // Disable pointer events on square container so grid cards can be clicked
        this.squareContainer.style.pointerEvents = 'none';
        
        // Show grid layout container but don't populate it yet
        this.cardGrid.classList.remove('hidden');
        
        // Clear any existing grid content to prevent showing old cards
        this.cardGrid.innerHTML = '';
    }

    hideSquareCardElements() {
        // Hide all square card elements except scores
        const cardElements = this.squareContainer.querySelectorAll('.square-card-element:not(.square-score-box)');
        cardElements.forEach(element => {
            element.classList.add('hidden');
        });
    }

    switchToGridLayout() {
        this.currentMode = 'grid';
        
        // Disable pointer events on square container so grid cards can be clicked
        this.squareContainer.style.pointerEvents = 'none';
        
        // Show grid layout
        this.cardGrid.classList.remove('hidden');
        
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

    // Handle window resize for responsive square layout
    handleResize() {
        // Reposition square container
        this.positionSquareContainer();
        
        // Reposition score boxes
        const { squareSize } = this.calculateSquareDimensions();
        this.positionSquareElement(this.squareUserScoreElement, 25, 4, 15, 15, squareSize);
        this.positionSquareElement(this.squareComputerScoreElement, 60, 4, 15, 15, squareSize);
        this.squareUserScoreElement.style.fontSize = `${squareSize * CONFIG.SQUARE_LAYOUT.FONT_SIZES.SCORE}px`;
        this.squareComputerScoreElement.style.fontSize = `${squareSize * CONFIG.SQUARE_LAYOUT.FONT_SIZES.SCORE}px`;
        
        // If in square mode, reposition all card elements
        if (this.currentMode === 'square') {
            const cardElements = this.squareContainer.querySelectorAll('.square-card-element:not(.square-score-box)');
            cardElements.forEach(element => element.remove());
            
            // Recreate card elements with new dimensions
            const userCardId = this.squareContainer.querySelector('[data-player="user"]')?.dataset.cardId;
            const computerCardId = this.squareContainer.querySelector('[data-player="computer"]')?.dataset.cardId;
            
            if (userCardId && computerCardId) {
                const userCard = CONFIG.CARDS.find(c => c.id == userCardId);
                const computerCard = CONFIG.CARDS.find(c => c.id == computerCardId);
                
                if (userCard && computerCard) {
                    this.createCardFronts(userCard, 'user');
                    this.createCardFronts(computerCard, 'computer');
                    
                    // Restore flipped state if cards were flipped
                    const userElements = this.squareContainer.querySelectorAll('.user-title, .user-picture, .user-button-1, .user-button-2, .user-button-3');
                    const computerElements = this.squareContainer.querySelectorAll('.computer-title, .computer-picture, .computer-button-1, .computer-button-2, .computer-button-3');
                    
                    userElements.forEach(el => el.classList.remove('hidden'));
                    computerElements.forEach(el => el.classList.remove('hidden'));
                }
            }
        }
    }

    // Utility method for waiting
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    reset() {
        this.currentMode = 'grid';
        
        // Reset scores to 0
        this.squareUserScoreElement.textContent = '0';
        this.squareComputerScoreElement.textContent = '0';
        
        this.initializeLayout();
    }
}

// Add resize listener for responsive behavior
window.addEventListener('resize', () => {
    if (window.trumpsGame && window.trumpsGame.renderer) {
        window.trumpsGame.renderer.handleResize();
    }
});
