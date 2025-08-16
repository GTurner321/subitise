/**
 * TRUMPS2 CARDS - Card Creation, Reveal Animations, and State Management
 * 
 * This file contains:
 * - All card creation (grid backs, rect fronts/backs)
 * - Card reveal logic and flip animations
 * - Card state management (revealed cards tracking)
 * 
 * Other renderer files:
 * - trumps2renderer.js: Core coordination, layout calculations, and API delegation
 * - trumps2effects.js: Score system, visual effects (pulses, sparkles), and player interactions
 */

class Trumps2CardManager {
    constructor(rectContainer, gameArea, renderer) {
        this.rectContainer = rectContainer;
        this.gameArea = gameArea;
        this.renderer = renderer;
        
        // Track revealed cards at manager level
        this.revealedCards = new Set();
        
        // Track card selection state for highest selection phase
        this.cardsEnabled = true;
    }

    setupRectLayout(selectedCards) {
        // Reset revealed cards for new round
        this.revealedCards.clear();
        
        // Reset card selection state
        this.cardsEnabled = true;
        
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
        const { rectWidth, rectHeight } = this.renderer.calculateRectDimensions();
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
        this.renderer.positionRectElement(cardFront, cardLayout.x, cardLayout.y, cardLayout.width, cardLayout.height, rectWidth, rectHeight);
        cardFront.style.background = '#f5f5dc';
        cardFront.style.borderRadius = '8%';
        cardFront.style.boxShadow = `0 ${rectHeight * 0.04}px ${rectHeight * 0.08}px rgba(0,0,0,0.4)`;
        cardFront.style.zIndex = '25'; // Below back, visible when back is removed
        cardFront.style.cursor = 'pointer';
        cardFront.style.pointerEvents = 'auto';
        
        // For middle and right cards, start them rotated 180 degrees (back side)
        if (position === 'middle' || position === 'right') {
            cardFront.style.transform = 'rotateY(180deg)'; // Start as back side
            cardFront.style.transformOrigin = '50% 50%';
        }
        
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
        this.renderer.positionRectElement(title, cardLayout.x + CONFIG.RECT_LAYOUT.CARD_ELEMENTS.TITLE.x, 
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
        
        // For middle and right cards, start title rotated 180 degrees
        if (position === 'middle' || position === 'right') {
            title.style.transform = 'rotateY(180deg)'; // Start as back side
            title.style.transformOrigin = '50% 50%';
        }
        
        this.rectContainer.appendChild(title);
        
        // Create picture area
        const pictureArea = document.createElement('div');
        pictureArea.className = `rect-card-picture ${position}-picture`;
        pictureArea.style.position = 'absolute';
        pictureArea.dataset.position = position;
        this.renderer.positionRectElement(pictureArea, cardLayout.x + CONFIG.RECT_LAYOUT.CARD_ELEMENTS.PICTURE.x,
                                cardLayout.y + CONFIG.RECT_LAYOUT.CARD_ELEMENTS.PICTURE.y,
                                CONFIG.RECT_LAYOUT.CARD_ELEMENTS.PICTURE.width,
                                CONFIG.RECT_LAYOUT.CARD_ELEMENTS.PICTURE.height, rectWidth, rectHeight);
        pictureArea.style.borderRadius = '8%';
        pictureArea.style.display = 'flex';
        pictureArea.style.alignItems = 'center';
        pictureArea.style.justifyContent = 'center';
        pictureArea.style.overflow = 'hidden';
        pictureArea.style.zIndex = '25';
        
        // For middle and right cards, start picture rotated 180 degrees
        if (position === 'middle' || position === 'right') {
            pictureArea.style.transform = 'rotateY(180deg)'; // Start as back side
            pictureArea.style.transformOrigin = '50% 50%';
        }
        
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
        this.renderer.positionRectElement(numberDisplay, cardLayout.x + CONFIG.RECT_LAYOUT.CARD_ELEMENTS.NUMBER.x,
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
        
        // For middle and right cards, start number rotated 180 degrees
        if (position === 'middle' || position === 'right') {
            numberDisplay.style.transform = 'rotateY(180deg)'; // Start as back side
            numberDisplay.style.transformOrigin = '50% 50%';
        }
        
        this.rectContainer.appendChild(numberDisplay);
    }

    createCardBacks(card, position) {
        const { rectWidth, rectHeight } = this.renderer.calculateRectDimensions();
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
        this.renderer.positionRectElement(cardBack, cardLayout.x, cardLayout.y, cardLayout.width, cardLayout.height, rectWidth, rectHeight);
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
        
        // Find the card back and all yellow elements to flip together
        const cardBack = this.rectContainer.querySelector(`.rect-card-back-${position}`);
        const yellowCard = this.rectContainer.querySelector(`.rect-card-${position}`);
        const yellowTitle = this.rectContainer.querySelector(`.${position}-title`);
        const yellowPicture = this.rectContainer.querySelector(`.${position}-picture`);
        const yellowNumber = this.rectContainer.querySelector(`.${position}-number`);
        
        if (cardBack) {
            console.log(`🔄 Animating complete 180-degree card flip for ${position}`);
            
            // Collect all elements that need to flip
            const allElements = [cardBack, yellowCard, yellowTitle, yellowPicture, yellowNumber].filter(el => el);
            
            // Set up the flip animation for ALL elements
            allElements.forEach(element => {
                element.style.transformOrigin = '50% 50%';
                element.style.transition = 'transform 0.6s ease-out';
                element.style.backfaceVisibility = 'hidden';
            });
            
            // Small delay to ensure styles are applied
            await this.wait(50);
            
            // Start the 180-degree rotation for ALL elements
            requestAnimationFrame(() => {
                allElements.forEach(element => {
                    const currentTransform = element.style.transform || '';
                    // If element was rotated 180deg (back side), rotate to 0deg (front side)
                    // If element was normal (blue back), rotate to 180deg (disappear)
                    if (currentTransform.includes('rotateY(180deg)')) {
                        element.style.transform = 'rotateY(0deg)'; // Yellow elements flip to front
                    } else {
                        element.style.transform = 'rotateY(180deg)'; // Blue back flips away
                    }
                });
            });
            
            // Wait for animation to reach 90 degrees (halfway)
            await this.wait(300);
            
            // At 90 degrees, remove the blue back and make yellow elements visible
            if (cardBack.parentNode) {
                cardBack.remove();
                console.log(`🗑️ Blue back removed at 90-degree point for ${position}`);
            }
            
            // Wait for the remaining animation to complete (300ms more)
            await this.wait(300);
            
            // After 180 degrees, ensure yellow elements are in normal front-facing position
            [yellowCard, yellowTitle, yellowPicture, yellowNumber].forEach(element => {
                if (element) {
                    element.style.transform = 'rotateY(0deg)'; // Normal front-facing orientation
                    element.style.transition = 'none'; // Remove transition for instant fix
                }
            });
            
            // Mark as revealed
            this.revealedCards.add(position);
            console.log(`✅ Card ${position} revealed with complete 180-degree flip animation`);
        } else {
            console.log(`❌ No card back found for ${position}`);
            // Still mark as revealed even if no back found
            this.revealedCards.add(position);
        }
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
    }

    hideRectCardElements() {
        // Hide all rect card elements except scores
        const cardElements = this.rectContainer.querySelectorAll('.rect-card, .rect-card-title, .rect-card-picture, .rect-card-number, .rect-card-back');
        cardElements.forEach(element => {
            element.classList.add('hidden');
        });
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    reset() {
        // Reset revealed cards
        this.revealedCards.clear();
        
        // Reset card selection state
        this.cardsEnabled = true;
    }
}
