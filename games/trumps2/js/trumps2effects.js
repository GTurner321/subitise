/**
 * TRUMPS2 EFFECTS - Score System, Visual Effects, and Player Interactions
 * 
 * This file contains:
 * - Score system (creation, updates, animations)
 * - Visual effects (pulses, sparkles, stars)
 * - Player interactions and feedback
 * 
 * Other renderer files:
 * - trumps2renderer.js: Core coordination, layout calculations, and API delegation
 * - trumps2cards.js: Card creation, reveal animations, and card state management
 */

class Trumps2EffectsManager {
    constructor(rectContainer, gameArea, renderer) {
        this.rectContainer = rectContainer;
        this.gameArea = gameArea;
        this.renderer = renderer;
        
        // Score elements
        this.scoreElements = {
            user: { name: null, box: null },
            playerA: { name: null, box: null },
            playerB: { name: null, box: null }
        };
        
        // Store player names for card labeling
        this.playerNames = { playerA: 'A', playerB: 'B' };
        
        // Track card selection state for highest selection phase
        this.cardsEnabled = true;
        
        this.initializeScores();
    }

    initializeScores() {
        // Create score elements immediately
        this.createRectScores();
    }

    createRectScores() {
        const { rectWidth, rectHeight } = this.renderer.calculateRectDimensions();
        
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
        
        this.renderer.positionRectElement(element, layout.x, layout.y, layout.width, layout.height, rectWidth, rectHeight);
        
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

    async pulseCardOnClick(position) {
        console.log(`💓 Adding single click pulse to ${position} card`);
        
        // Find different types of elements for different pulse styles
        const cardAndPictureElements = this.rectContainer.querySelectorAll(
            `.rect-card-${position}, .rect-card-back-${position}, .${position}-picture, .rect-card-picture.${position}-picture`
        );
        
        const textElements = this.rectContainer.querySelectorAll(
            `.${position}-title, .${position}-number, .rect-card-title.${position}-title, .rect-card-number.${position}-number`
        );
        
        const allElements = this.rectContainer.querySelectorAll(
            `.rect-card-${position}, .rect-card-back-${position}, .${position}-title, .${position}-picture, .${position}-number, .rect-card-title.${position}-title, .rect-card-picture.${position}-picture, .rect-card-number.${position}-number`
        );
        
        console.log(`Found ${allElements.length} elements to pulse for ${position}`);
        
        // FIRST: Immediately disable hover animations to prevent any hover pulse
        allElements.forEach(element => {
            element.classList.add('card-selected-no-hover');
        });
        
        // Small delay to ensure hover animations stop
        await this.wait(50);
        
        // Apply different pulse animations to different element types
        cardAndPictureElements.forEach(element => {
            element.classList.add('card-click-pulse'); // Subtle pulse
        });
        
        textElements.forEach(element => {
            element.classList.add('text-click-pulse'); // More noticeable pulse
        });
        
        // Wait for pulse animation to complete (1 second)
        await this.wait(1000);
        
        // Remove pulse classes but keep no-hover class
        allElements.forEach(element => {
            element.classList.remove('card-click-pulse');
            element.classList.remove('text-click-pulse');
        });
        
        console.log(`✅ Single click pulse completed for ${position} card`);
    }

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
        
        // Create circular spiral of stars
        this.createStarSpiral(centerX, centerY, 20); // Score box stars
    }

    createStarSparkle(cardPosition) {
        // Find the card number element to center the sparkle on
        const numberElement = document.querySelector(`.${cardPosition}-number`);
        if (!numberElement) return;
        
        const rect = numberElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Create circular spiral of stars
        this.createStarSpiral(centerX, centerY, 24); // Card number stars
    }
    
    createStarSpiral(centerX, centerY, starSize) {
        const numStars = 5; // Reduced from 8 to 5 stars
        const maxRadius = 100; // Increased from 60 to 100 for more outward spiral
        
        for (let i = 0; i < numStars; i++) {
            // Calculate position in spiral - more spread out
            const angle = (i / numStars) * Math.PI * 4; // Increased from 2 to 4 for more spiral turns
            const radius = (i / numStars) * maxRadius; // Spiral outward more dramatically
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            // Create star element
            const star = document.createElement('div');
            star.innerHTML = '⭐';
            star.style.position = 'fixed';
            star.style.left = x + 'px';
            star.style.top = y + 'px';
            star.style.fontSize = starSize + 'px';
            star.style.pointerEvents = 'none';
            star.style.zIndex = '1000';
            star.style.transform = 'translate(-50%, -50%)';
            star.style.opacity = '1';
            
            // Stagger the animation start time more
            const delay = i * 150; // Increased from 100ms to 150ms delay between each star
            
            // Add pulsing animation
            star.style.animation = `starSpiral 2s ease-out ${delay}ms forwards`;
            
            document.body.appendChild(star);
            
            // Remove after animation completes (2s + delay)
            setTimeout(() => {
                if (star.parentNode) {
                    star.parentNode.removeChild(star);
                }
            }, 2000 + delay + 100);
        }
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

    handleResize() {
        // Reposition score elements
        const { rectWidth, rectHeight } = this.renderer.calculateRectDimensions();
        
        // Update score name elements
        Object.entries(this.scoreElements).forEach(([player, elements]) => {
            const nameLayout = player === 'user' ? CONFIG.RECT_LAYOUT.LEFT_SCORE_NAME :
                              player === 'playerA' ? CONFIG.RECT_LAYOUT.MIDDLE_SCORE_NAME :
                              CONFIG.RECT_LAYOUT.RIGHT_SCORE_NAME;
            const boxLayout = player === 'user' ? CONFIG.RECT_LAYOUT.LEFT_SCORE_BOX :
                             player === 'playerA' ? CONFIG.RECT_LAYOUT.MIDDLE_SCORE_BOX :
                             CONFIG.RECT_LAYOUT.RIGHT_SCORE_BOX;
            
            this.renderer.positionRectElement(elements.name, nameLayout.x, nameLayout.y, nameLayout.width, nameLayout.height, rectWidth, rectHeight);
            this.renderer.positionRectElement(elements.box, boxLayout.x, boxLayout.y, boxLayout.width, boxLayout.height, rectWidth, rectHeight);
            
            elements.name.style.fontSize = `${rectWidth * CONFIG.RECT_LAYOUT.FONT_SIZES.SCORE_NAME}px`;
            elements.box.style.fontSize = `${rectWidth * CONFIG.RECT_LAYOUT.FONT_SIZES.SCORE_BOX}px`;
        });
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    reset() {
        // Reset scores to 0
        Object.values(this.scoreElements).forEach(scoreEl => {
            scoreEl.box.textContent = '0';
        });
        
        // Reset player names
        this.scoreElements.playerA.name.textContent = 'A';
        this.scoreElements.playerB.name.textContent = 'B';
        
        // Reset card selection state
        this.cardsEnabled = true;
        
        // Reset player names
        this.playerNames = { playerA: 'A', playerB: 'B' };
        
        // Recreate scores with proper positioning
        this.initializeScores();
    }
}
