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
        
        // Track revealed cards at renderer level
        this.revealedCards = new Set();
        
        // Store player names for card labeling
        this.playerNames = { playerA: 'A', playerB: 'B' };
        
        // Track card selection state for highest selection phase
        this.cardsEnabled = true;
        
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
        
        // Don't render any cards initially - wait for game controller to start
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

        // Set player-specific colors for score names
        this.scoreElements.user.name.style.color = '#2E7D32'; // Dark green
        this.scoreElements.playerA.name.style.color = '#E65100'; // Dark orange  
        this.scoreElements.playerB.name.style.color = '#1565C0'; // Blue

        // Add all score elements to container
        Object.values(this.scoreElements).forEach(player => {
            this.rectContainer.appendChild(player.name);
            this.rectContainer.appendChild(player.box);
        });
    }

    createScoreElement(text, className, layout, rectWidth, rectHeight) {
        const element = document.createElement('div');
        element.className = `rect-score-element ${className}`;
        element.textContent = text;
        element.style.pointerEvents = 'auto';
        
        this.positionRectElement(element, layout.x, layout.y, layout.width, layout.height, rectWidth, rectHeight);
        
        // Style based on element type
        if (className.includes('rect-score-box')) {
            // Score boxes - centered text with shadow
            element.style.boxShadow = `0 ${rectWidth * 0.03}px ${rectWidth * 0.06}px rgba(0,0,0,0.3)`;
            element.style.fontSize = `${rectWidth * CONFIG.RECT_LAYOUT.FONT_SIZES.SCORE_BOX}px`;
            element.style.display = 'flex';
            element.style.alignItems = 'center';
            element.style.justifyContent = 'center';
            element.style.fontFamily = 'Arial, sans-serif';
            element.style.fontWeight = 'bold';
            element.style.color = 'white';
            element.style.borderRadius = '15%';
        } else {
            // Name labels - centered text both vertically and horizontally
            element.style.fontSize = `${rectWidth * CONFIG.RECT_LAYOUT.FONT_SIZES.SCORE_NAME}px`;
            element.style.display = 'flex';
            element.style.alignItems = 'center'; // Vertical centering
            element.style.justifyContent = 'center'; // Horizontal centering
            element.style.fontFamily = 'Comic Sans MS, cursive';
            element.style.fontWeight = 'bold';
            element.style.textTransform = 'uppercase';
            element.style.textAlign = 'center'; // Additional text centering
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
        
        // Reset revealed cards for new round
        this.revealedCards.clear();
        
        // Reset card selection state
        this.cardsEnabled = true;
        
        // Hide grid layout
        this.cardGrid.classList.add('hidden');
        
        // Enable pointer events on rect container for card interaction
        this.rectContainer.style.pointerEvents = 'auto';
        
        // Create blue backs for middle and right cards only
        this.createCardBacks(selectedCards[1], 'middle');
        this.createCardBacks(selectedCards[2], 'right');
        
        // Create front face for left card immediately (no blue back)
        this.createCardFronts(selectedCards[0], 'left');
        
        // Mark left card as revealed since it shows immediately
        this.revealedCards.add('left');
        
        // Fade in left front face elements
        const leftElements = this.rectContainer.querySelectorAll('.left-title, .left-picture, .left-number, .rect-card-left');
        leftElements.forEach(element => {
            element.style.opacity = '0';
            element.style.transition = 'none';
            
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    element.style.transition = 'opacity 1s ease-in';
                    element.style.opacity = '1';
                });
            });
        });
        
        // Fade in middle and right blue backs
        const cardBacks = this.rectContainer.querySelectorAll('.rect-card-back-middle, .rect-card-back-right');
        cardBacks.forEach(cardBack => {
            cardBack.style.opacity = '0';
            cardBack.style.transition = 'none';
            
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    cardBack.style.transition = 'opacity 1s ease-in';
                    cardBack.style.opacity = '1';
                });
            });
        });
        
        // After 1.1 seconds, create middle and right front faces behind blue backs
        setTimeout(() => {
            this.createCardFronts(selectedCards[1], 'middle');
            this.createCardFronts(selectedCards[2], 'right');
        }, 1100);
    }

    createCardFronts(card, position) {
        const { rectWidth, rectHeight } = this.calculateRectDimensions();
        const isLeft = position === 'left';
        const isMiddle = position === 'middle';
        const cardLayout = isLeft ? CONFIG.RECT_LAYOUT.LEFT_CARD : 
                          isMiddle ? CONFIG.RECT_LAYOUT.MIDDLE_CARD : 
                          CONFIG.RECT_LAYOUT.RIGHT_CARD;
        
        // Create card front face (underneath back)
        const cardFront = document.createElement('div');
        cardFront.className = `rect-card rect-card-${position}`;
        cardFront.dataset.cardId = card.id;
        cardFront.dataset.position = position;
        cardFront.style.position = 'absolute';
        this.positionRectElement(cardFront, cardLayout.x, cardLayout.y, cardLayout.width, cardLayout.height, rectWidth, rectHeight);
        cardFront.style.background = '#f5f5dc';
        cardFront.style.borderRadius = '8%';
        cardFront.style.boxShadow = `0 ${rectHeight * 0.04}px ${rectHeight * 0.08}px rgba(0,0,0,0.4)`;
        cardFront.style.zIndex = '25'; // Below back, visible when back is removed
        cardFront.style.cursor = 'pointer';
        cardFront.style.pointerEvents = 'auto';
        
        // Add specific class for left card to enable CSS hover effects
        if (position === 'left') {
            cardFront.classList.add('rect-card-front-left');
        }
        
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
            rgba(255, 215, 0, 0.3) ${rectWidth * 0.008}px,
            transparent ${rectWidth * 0.008}px,
            transparent ${rectWidth * 0.016}px
        )`;
        frontPattern.style.borderRadius = '8%';
        frontPattern.style.pointerEvents = 'none';
        cardFront.appendChild(frontPattern);
        
        this.rectContainer.appendChild(cardFront);
        
        // Create title (initially empty - no animal names)
        const title = document.createElement('div');
        title.className = `rect-card-title ${position}-title`;
        title.textContent = ''; // Start empty - player names will be added later
        title.style.position = 'absolute';
        title.dataset.position = position;
        this.positionRectElement(title, cardLayout.x + CONFIG.RECT_LAYOUT.CARD_ELEMENTS.TITLE.x, 
                                cardLayout.y + CONFIG.RECT_LAYOUT.CARD_ELEMENTS.TITLE.y,
                                CONFIG.RECT_LAYOUT.CARD_ELEMENTS.TITLE.width, 
                                CONFIG.RECT_LAYOUT.CARD_ELEMENTS.TITLE.height, rectWidth, rectHeight);
        title.style.fontSize = `${rectWidth * CONFIG.RECT_LAYOUT.FONT_SIZES.CARD_TITLE * 1.8}px`; // Increased from 1.2 to 1.8 (50% larger)
        title.style.fontFamily = 'Comic Sans MS, cursive';
        title.style.fontWeight = 'bold';
        title.style.color = '#333'; // Default color - will be changed when player assigned
        title.style.textTransform = 'uppercase';
        title.style.display = 'flex';
        title.style.alignItems = 'center';
        title.style.justifyContent = 'center';
        title.style.lineHeight = '1.2';
        title.style.zIndex = '25';
        this.rectContainer.appendChild(title);
        
        // Create picture area
        const pictureArea = document.createElement('div');
        pictureArea.className = `rect-card-picture ${position}-picture`;
        pictureArea.style.position = 'absolute';
        pictureArea.dataset.position = position;
        this.positionRectElement(pictureArea, cardLayout.x + CONFIG.RECT_LAYOUT.CARD_ELEMENTS.PICTURE.x,
                                cardLayout.y + CONFIG.RECT_LAYOUT.CARD_ELEMENTS.PICTURE.y,
                                CONFIG.RECT_LAYOUT.CARD_ELEMENTS.PICTURE.width,
                                CONFIG.RECT_LAYOUT.CARD_ELEMENTS.PICTURE.height, rectWidth, rectHeight);
        pictureArea.style.borderRadius = '8%';
        pictureArea.style.display = 'flex';
        pictureArea.style.alignItems = 'center';
        pictureArea.style.justifyContent = 'center';
        pictureArea.style.overflow = 'hidden';
        pictureArea.style.zIndex = '25';
        
        const image = document.createElement('img');
        image.src = card.image;
        image.alt = card.name;
        image.className = 'rect-card-image';
        image.style.borderRadius = '4%';
        image.style.background = 'transparent';
        image.style.border = `${rectHeight * 0.003}px solid #667eea`;
        image.style.boxShadow = `0 ${rectHeight * 0.003}px ${rectHeight * 0.006}px rgba(0,0,0,0.3)`;
        
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
        numberDisplay.className = `rect-card-number ${position}-number`;
        numberDisplay.textContent = card.value;
        numberDisplay.style.position = 'absolute';
        numberDisplay.dataset.position = position;
        this.positionRectElement(numberDisplay, cardLayout.x + CONFIG.RECT_LAYOUT.CARD_ELEMENTS.NUMBER.x,
                                cardLayout.y + CONFIG.RECT_LAYOUT.CARD_ELEMENTS.NUMBER.y,
                                CONFIG.RECT_LAYOUT.CARD_ELEMENTS.NUMBER.width,
                                CONFIG.RECT_LAYOUT.CARD_ELEMENTS.NUMBER.height, rectWidth, rectHeight);
        numberDisplay.style.fontSize = `${rectWidth * CONFIG.RECT_LAYOUT.FONT_SIZES.CARD_NUMBER}px`;
        numberDisplay.style.fontFamily = 'Arial, sans-serif';
        numberDisplay.style.fontWeight = 'bold';
        numberDisplay.style.color = '#d32f2f';
        numberDisplay.style.textAlign = 'center';
        numberDisplay.style.display = 'flex';
        numberDisplay.style.alignItems = 'center';
        numberDisplay.style.justifyContent = 'center';
        numberDisplay.style.zIndex = '25';
        numberDisplay.style.background = 'transparent';
        numberDisplay.style.borderRadius = '8%';
        this.rectContainer.appendChild(numberDisplay);
    }

    createCardBacks(card, position) {
        const { rectWidth, rectHeight } = this.calculateRectDimensions();
        const isLeft = position === 'left';
        const isMiddle = position === 'middle';
        const cardLayout = isLeft ? CONFIG.RECT_LAYOUT.LEFT_CARD : 
                          isMiddle ? CONFIG.RECT_LAYOUT.MIDDLE_CARD : 
                          CONFIG.RECT_LAYOUT.RIGHT_CARD;
        
        // Create only the card back face
        const cardBack = document.createElement('div');
        cardBack.className = `rect-card-back rect-card-back-${position}`;
        cardBack.dataset.cardId = card.id;
        cardBack.dataset.position = position;
        cardBack.style.position = 'absolute';
        this.positionRectElement(cardBack, cardLayout.x, cardLayout.y, cardLayout.width, cardLayout.height, rectWidth, rectHeight);
        cardBack.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        cardBack.style.borderRadius = '8%';
        cardBack.style.boxShadow = `0 ${rectHeight * 0.04}px ${rectHeight * 0.08}px rgba(0,0,0,0.4)`;
        cardBack.style.zIndex = '30'; // Highest z-index to cover everything
        cardBack.style.cursor = 'pointer';
        cardBack.style.pointerEvents = 'auto';
        
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
            rgba(255,255,255,0.1) ${rectWidth * 0.008}px,
            transparent ${rectWidth * 0.008}px,
            transparent ${rectWidth * 0.016}px
        )`;
        pattern.style.borderRadius = '8%';
        pattern.style.pointerEvents = 'none';
        cardBack.appendChild(pattern);
        
        this.rectContainer.appendChild(cardBack);
        console.log(`Creating card back for ${position}, opacity: ${cardBack.style.opacity}`);
    }

    async pulseCardOnClick(position) {
        console.log(`💓 Adding click pulse to ${position} card`);
        
        // Find ALL elements for this position including specific text elements
        const cardElements = this.rectContainer.querySelectorAll(
            `.rect-card-${position}, .rect-card-back-${position}, .${position}-title, .${position}-picture, .${position}-number, .rect-card-title.${position}-title, .rect-card-picture.${position}-picture, .rect-card-number.${position}-number`
        );
        
        console.log(`Found ${cardElements.length} elements to pulse for ${position}`);
        
        // Add click pulse class to ALL elements
        cardElements.forEach(element => {
            element.classList.add('card-click-pulse');
            // Disable hover animations once clicked (but only temporarily)
            element.classList.add('card-selected-no-hover');
        });
        
        // Wait for pulse animation to complete (1 second)
        await this.wait(1000);
        
        // Remove pulse class but keep no-hover class for now
        cardElements.forEach(element => {
            element.classList.remove('card-click-pulse');
        });
        
        console.log(`✅ Click pulse completed for ${position} card`);
    }

    async revealCard(card, position) {
        console.log(`🎭 Revealing card for ${position}`);
        
        // Check if card is already revealed
        if (this.revealedCards.has(position)) {
            console.log(`⚠️ Card ${position} already revealed`);
            return;
        }
        
        // For left card, there's no back to reveal - it's already visible
        if (position === 'left') {
            console.log(`👁️ Left card already visible`);
            this.revealedCards.add(position);
            return;
        }
        
        // Find the card back to flip
        const cardBack = this.rectContainer.querySelector(`.rect-card-back-${position}`);
        
        if (cardBack) {
            console.log(`🔄 Animating 90-degree vertical flip for ${position}`);
            
            // Set up the flip animation on the card back
            // Use center of the card (50% 50%) as transform-origin since it's positioned within the container
            cardBack.style.transformOrigin = '50% 50%';
            cardBack.style.transition = 'transform 0.6s ease-out';
            cardBack.style.backfaceVisibility = 'hidden'; // Hide back face when rotated
            
            // Small delay to ensure styles are applied
            await this.wait(50);
            
            // Start the 90-degree rotation around vertical axis
            requestAnimationFrame(() => {
                cardBack.style.transform = 'rotateY(90deg)';
            });
            
            // Wait for animation to reach 90 degrees (halfway point)
            await this.wait(300);
            
            // At 90 degrees, the card is edge-on and invisible - remove it completely
            if (cardBack.parentNode) {
                cardBack.remove();
                console.log(`🗑️ Card back removed at 90-degree point for ${position}`);
            }
            
            // Wait for the remaining animation time
            await this.wait(300);
            
            // Mark as revealed
            this.revealedCards.add(position);
            console.log(`✅ Card ${position} revealed with 90-degree vertical flip animation`);
        } else {
            console.log(`❌ No card back found for ${position}`);
            // Still mark as revealed even if no back found
            this.revealedCards.add(position);
        }
    }

    // UPDATED: Add player name to card after selection with shorter delay and faster fade-in - JOB 4 MODIFIED
    async addPlayerNameToCard(position, playerName, playerType) {
        console.log(`👤 Adding player name ${playerName} to ${position} card with 0.5s delay`);
        
        const titleElement = this.rectContainer.querySelector(`.${position}-title`);
        if (!titleElement) {
            console.warn(`No title element found for position ${position}`);
            return;
        }
        
        // Wait for 0.5 seconds before starting the name assignment (reduced from 1 second)
        await this.wait(500);
        
        // Set the player name and color
        titleElement.textContent = playerName.toUpperCase();
        
        // Set color based on player type
        const colors = {
            'user': '#2E7D32',    // Dark green
            'playerA': '#E65100', // Dark orange
            'playerB': '#1565C0'  // Blue
        };
        titleElement.style.color = colors[playerType] || '#333';
        
        // Start invisible and fade in over 0.8 seconds (reduced from 1.2 seconds)
        titleElement.style.opacity = '0';
        titleElement.style.transition = 'opacity 0.8s ease-in';
        
        // Trigger fade-in after a brief delay to ensure the transition takes effect
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                titleElement.style.opacity = '1';
            });
        });
        
        console.log(`✅ Player name ${playerName} added to ${position} card with 0.5s delay and 0.8s fade-in`);
    }

    // Show incorrect selection feedback for highest selection phase
    async showIncorrectSelection() {
        console.log('❌ Showing incorrect selection feedback');
        
        // Make all cards partially transparent
        const allCardElements = this.rectContainer.querySelectorAll(
            '.rect-card, .rect-card-back, .rect-card-title, .rect-card-picture, .rect-card-number'
        );
        
        allCardElements.forEach(element => {
            element.style.transition = 'opacity 0.3s ease';
            element.style.opacity = '0.3';
        });
        
        // Disable card clicks
        this.cardsEnabled = false;
        this.rectContainer.style.pointerEvents = 'none';
        
        console.log('✅ Cards made transparent and disabled');
    }

    // Re-enable card selection after incorrect attempt
    enableCardSelection() {
        console.log('✅ Re-enabling card selection');
        
        // Restore full opacity
        const allCardElements = this.rectContainer.querySelectorAll(
            '.rect-card, .rect-card-back, .rect-card-title, .rect-card-picture, .rect-card-number'
        );
        
        allCardElements.forEach(element => {
            element.style.transition = 'opacity 0.3s ease';
            element.style.opacity = '1';
        });
        
        // Re-enable card clicks
        this.cardsEnabled = true;
        this.rectContainer.style.pointerEvents = 'auto';
        
        console.log('✅ Cards restored and re-enabled');
    }
    
    // Enable hover effects for highest selection phase
    enableHoverEffectsForHighestSelection() {
        console.log('🎯 Enabling hover effects for highest selection phase');
        
        // Remove no-hover class from all card elements to re-enable hover effects
        const allCardElements = this.rectContainer.querySelectorAll(
            '.rect-card, .rect-card-title, .rect-card-picture, .rect-card-number'
        );
        
        allCardElements.forEach(element => {
            element.classList.remove('card-selected-no-hover');
        });
        
        console.log('✅ Hover effects enabled for all cards');
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

    updateScores(userScore, playerAScore, playerBScore, winningPlayer = null) {
        // Update score displays with animation - only pulse the winning player's score
        this.animateScoreUpdate(this.scoreElements.user.box, userScore, winningPlayer === 'user');
        this.animateScoreUpdate(this.scoreElements.playerA.box, playerAScore, winningPlayer === 'playerA');
        this.animateScoreUpdate(this.scoreElements.playerB.box, playerBScore, winningPlayer === 'playerB');
        
        // Create star sparkle on the winning player's score box
        if (winningPlayer) {
            this.createScoreStarSparkle(winningPlayer);
        }
    }

    animateScoreUpdate(scoreElement, newScore, shouldPulse = false) {
        // Only add pulse class if this is the winning score
        if (shouldPulse) {
            scoreElement.classList.add('score-update');
        }
        
        setTimeout(() => {
            scoreElement.textContent = newScore;
            if (shouldPulse) {
                scoreElement.classList.remove('score-update');
            }
        }, 400);
    }
    
    createScoreStarSparkle(winningPlayer) {
        const scoreBox = this.scoreElements[winningPlayer].box;
        if (!scoreBox) return;
        
        const rect = scoreBox.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Create star sparkle using the main.css animation
        const star = document.createElement('div');
        star.innerHTML = '⭐';
        star.className = 'completion-star';
        star.style.position = 'fixed';
        star.style.left = centerX + 'px';
        star.style.top = centerY + 'px';
        star.style.fontSize = '20px';
        star.style.pointerEvents = 'none';
        star.style.zIndex = '1000';
        star.style.transform = 'translate(-50%, -50%)'; // Center the star
        
        document.body.appendChild(star);
        
        // Remove after animation completes (1.5s from main.css)
        setTimeout(() => {
            if (star.parentNode) {
                star.parentNode.removeChild(star);
            }
        }, 1500);
    }

    setPlayerNames(playerAName, playerBName) {
        // Store player names for card labeling
        this.playerNames.playerA = playerAName;
        this.playerNames.playerB = playerBName;
        
        // Update score display names
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
        const rectCardElements = this.rectContainer.querySelectorAll('.rect-card, .rect-card-title, .rect-card-picture, .rect-card-number, .rect-card-back, .rect-card-player-name');
        
        rectCardElements.forEach(element => {
            element.style.transition = `opacity ${CONFIG.CARD_FADE_DURATION}ms ease-out`;
            element.style.opacity = '0';
        });
        
        await this.wait(CONFIG.CARD_FADE_DURATION);
        
        // Remove rect card elements (keep score boxes)
        rectCardElements.forEach(element => element.remove());
        
        // Reset revealed cards for next round
        this.revealedCards.clear();
        
        // Reset card selection state
        this.cardsEnabled = true;
        
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
        
        // Reset revealed cards
        this.revealedCards.clear();
        
        // Reset card selection state
        this.cardsEnabled = true;
        
        this.initializeLayout();
    }
}

// Add resize listener for responsive behavior
window.addEventListener('resize', () => {
    if (window.trumps2Game && window.trumps2Game.renderer) {
        window.trumps2Game.renderer.handleResize();
    }
});
