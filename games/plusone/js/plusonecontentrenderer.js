console.log('🔍 LOADING PLUS ONE CONTENT RENDERER - Triple Mode Version');

class PlusOneContentRenderer {
    constructor() {
        console.log('PlusOneContentRenderer constructor - triple mode support');
        this.gameArea = document.querySelector('.game-area');
        this.leftSide = document.getElementById('leftSide');
        this.rightSide = document.getElementById('rightSide');
        this.currentContent = [];
        
        // Content size as percentage of game area width
        this.iconSizePercent = 6; // 6% of game area width for icons
        this.numberSizePercent = 12; // 12% of game area width for large numbers
        
        // Store persistent content positions (as percentages) to prevent re-randomization on resize
        this.storedPositions = {
            left: [],
            right: []
        };
        this.currentContentCount = { left: 0, right: 0 };
        
        // ButtonBar coordination - SIMPLIFIED
        this.buttonBarReady = false;
        this.pendingRender = null;
        this.gameAreaDimensions = null;
        
        // Content boundaries relative to game area (percentages)
        this.boundaries = {
            left: {
                horizontal: { start: 6, end: 40 },   // 6%-40% of game area width
                vertical: { start: 30, end: 90 }     // 30%-90% of game area height (from bottom)
            },
            right: {
                horizontal: { start: 60, end: 94 },  // 60%-94% of game area width  
                vertical: { start: 30, end: 90 }     // 30%-90% of game area height (from bottom)
            }
        };
        
        // Initialize helper utilities
        this.helpers = new PlusOneContentHelpers(this);
        
        // Setup immediate initialization
        this.setupResizeHandling();
        this.fastInitialization();
        
        console.log('🔍 PlusOneContentRenderer initialized with triple mode support');
    }

    /**
     * Fast initialization - check for ButtonBar immediately and set up coordination
     */
    fastInitialization() {
        // Check if ButtonBar is already available
        if (window.ButtonBar && typeof window.ButtonBar.create === 'function') {
            console.log('🚀 ButtonBar already available, setting up coordination immediately');
            this.buttonBarReady = true;
            this.setupButtonBarCoordination();
            // Update dimensions immediately
            setTimeout(() => {
                this.updateGameAreaDimensions();
            }, 50);
        } else {
            console.log('⏳ ButtonBar not yet available, setting up immediate readiness');
            // Don't wait - assume ButtonBar will be ready soon and proceed
            this.buttonBarReady = true;
            
            // Set up basic game area dimensions immediately
            setTimeout(() => {
                this.updateGameAreaDimensions();
            }, 100);
            
            // Still try to set up coordination when ButtonBar becomes available
            let checkCount = 0;
            const maxChecks = 10;
            
            const quickCheck = () => {
                checkCount++;
                
                if (window.ButtonBar && typeof window.ButtonBar.create === 'function') {
                    console.log(`🚀 ButtonBar became available after ${checkCount * 50}ms, setting up coordination`);
                    this.setupButtonBarCoordination();
                    return;
                }
                
                if (checkCount < maxChecks) {
                    setTimeout(quickCheck, 50);
                }
            };
            
            setTimeout(quickCheck, 50);
        }
    }

    setupButtonBarCoordination() {
        console.log('🔗 Setting up ButtonBar coordination for content renderer');
        
        // Register with ButtonBar to be notified of dimension changes
        if (window.ButtonBar) {
            console.log('✅ ButtonBar found, registering observer');
            window.ButtonBar.addObserver((dimensionData) => {
                console.log('🎯 ButtonBar dimensions updated for renderer:', dimensionData);
                this.buttonBarReady = true;
                
                // Update game area dimensions immediately with no delay
                this.updateGameAreaDimensions();
                
                // If we have a pending render, execute it now
                if (this.pendingRender) {
                    console.log('🎮 Executing pending render with ButtonBar dimensions');
                    const { leftCount, currentLevel, gameMode } = this.pendingRender;
                    this.pendingRender = null;
                    // No delay - execute immediately
                    this.renderContent(leftCount, currentLevel, gameMode);
                } else if (this.currentContent.length > 0) {
                    // Update existing content positions and sizes immediately
                    this.updateContentSizesAndPositions();
                }
            });
            
            // Check if ButtonBar is already ready (in case we missed the initial notification)
            if (window.ButtonBar.dimensions && window.ButtonBar.dimensions.buttonPanelWidth > 0) {
                console.log('🎯 ButtonBar already has dimensions, setting flag immediately');
                this.buttonBarReady = true;
                // No delay - update immediately
                this.updateGameAreaDimensions();
            }
        } else {
            console.warn('⚠️ ButtonBar not available when setting up coordination');
        }
    }

    setupResizeHandling() {
        // More responsive resize handler with shorter debounce
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            // Clear any existing timeout
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            
            // Immediate response for ButtonBar updates
            if (window.ButtonBar && typeof window.ButtonBar.handleResize === 'function') {
                window.ButtonBar.handleResize();
            }
            
            // Quick update of our dimensions
            resizeTimeout = setTimeout(() => {
                if (this.buttonBarReady) {
                    console.log('🔄 Handling resize event - fast response');
                    this.updateGameAreaDimensions();
                    this.updateContentSizesAndPositions();
                }
            }, 50);
        });
        
        // Also listen for orientation changes on mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (this.buttonBarReady) {
                    console.log('📱 Handling orientation change');
                    this.updateGameAreaDimensions();
                    this.updateContentSizesAndPositions();
                    
                    // Force ButtonBar resize after orientation change
                    if (window.ButtonBar && typeof window.ButtonBar.handleResize === 'function') {
                        window.ButtonBar.handleResize();
                    }
                }
            }, 100);
        });
    }

    updateGameAreaDimensions() {
        if (!this.gameArea) {
            console.error('❌ Game area not found when trying to update dimensions');
            return;
        }
        
        // Force a reflow to ensure we get accurate dimensions
        this.gameArea.offsetHeight;
        
        // Get the actual game area dimensions after ButtonBar has set them
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        
        // Validate that we have reasonable dimensions
        if (gameAreaRect.width < 50 || gameAreaRect.height < 50) {
            console.log('⏳ Game area dimensions not ready, retrying...', gameAreaRect);
            setTimeout(() => {
                this.updateGameAreaDimensions();
            }, 50);
            return;
        }
        
        this.gameAreaDimensions = {
            width: gameAreaRect.width,
            height: gameAreaRect.height,
            left: gameAreaRect.left,
            top: gameAreaRect.top
        };
        
        // Update CSS custom property with actual game area width
        document.documentElement.style.setProperty('--game-area-width', `${gameAreaRect.width}px`);
        
        // Mark game area as dimensions-ready
        if (this.gameArea) {
            this.gameArea.classList.add('dimensions-ready');
        }
        
        console.log('📏 Game area dimensions updated and marked ready:', this.gameAreaDimensions);
    }

    updateContentSizesAndPositions() {
        if (!this.gameArea || this.currentContent.length === 0 || !this.gameAreaDimensions) {
            console.log('📐 Skipping content update - missing requirements');
            return;
        }
        
        console.log('📐 Updating content sizes and positions for', this.currentContent.length, 'elements');
        
        // Update size and apply stored positions for all current content
        this.currentContent.forEach((content, index) => {
            const side = content.dataset.side;
            const sideIndex = content.dataset.sideIndex ? parseInt(content.dataset.sideIndex) : index;
            const contentType = content.dataset.contentType;
            
            // Update size based on content type
            if (contentType === 'icon') {
                const iconSize = this.gameAreaDimensions.width * (this.iconSizePercent / 100);
                content.style.fontSize = `${iconSize}px`;
            } else if (contentType === 'number') {
                const numberSize = this.gameAreaDimensions.width * (this.numberSizePercent / 100);
                const numberElement = content.querySelector('.large-number');
                const textElement = content.querySelector('.number-text');
                if (numberElement) {
                    numberElement.style.fontSize = `${numberSize}px`;
                }
                if (textElement) {
                    textElement.style.fontSize = `${numberSize * 0.25}px`;
                }
            }
            
            // Find and apply stored position
            const storedPos = this.storedPositions[side][sideIndex];
            if (storedPos) {
                content.style.left = storedPos.x + '%';
                content.style.bottom = storedPos.y + '%';
                console.log(`🔄 Repositioned ${side} ${contentType} ${sideIndex} to stored position (${storedPos.x.toFixed(1)}%, ${storedPos.y.toFixed(1)}%)`);
            }
        });
    }

    // ===== MAIN RENDERING ENTRY POINT =====
    
    renderContent(leftCount, currentLevel, gameMode = CONFIG.GAME_MODES.PLUS_ONE) {
        console.log(`🎮 === RENDERING CONTENT FOR LEVEL ${currentLevel}: ${leftCount} ${gameMode === CONFIG.GAME_MODES.MINUS_ONE ? '-' : gameMode === CONFIG.GAME_MODES.PLUS_TWO ? '+' : '+'} ${gameMode === CONFIG.GAME_MODES.PLUS_TWO ? '2' : '1'} ===`);
        
        // Don't wait for ButtonBar - proceed immediately if we have basic requirements
        this.clearContent();
        
        if (!this.gameArea) {
            console.error('❌ Game area not found!');
            return;
        }
        
        // Update dimensions immediately - don't wait for ButtonBar
        this.updateGameAreaDimensions();
        
        // If we don't have dimensions yet, use fallback values to get started
        if (!this.gameAreaDimensions || this.gameAreaDimensions.width < 50) {
            console.log('🔧 Using fallback dimensions for immediate rendering');
            // Use viewport-based fallback dimensions
            const fallbackWidth = window.innerWidth * 0.8; // 80% of viewport
            const fallbackHeight = window.innerHeight * 0.6; // 60% of viewport
            
            this.gameAreaDimensions = {
                width: fallbackWidth,
                height: fallbackHeight,
                left: window.innerWidth * 0.1,
                top: window.innerHeight * 0.1
            };
            
            // Update CSS custom property
            document.documentElement.style.setProperty('--game-area-width', `${fallbackWidth}px`);
            
            // Mark as ready
            if (this.gameArea) {
                this.gameArea.classList.add('dimensions-ready');
            }
        }
        
        console.log('✅ Proceeding with content render - dimensions:', this.gameAreaDimensions);
        
        // Start actual rendering immediately
        this.doActualRender(leftCount, currentLevel, gameMode);
    }

    doActualRender(leftCount, currentLevel, gameMode) {
        // Determine if this is a picture format level (icons) or number format (large numbers)
        const isPictureFormat = CONFIG.usesPictureFormat(currentLevel, gameMode);
        
        if (isPictureFormat) {
            this.renderIcons(leftCount, gameMode);
        } else {
            this.renderNumbers(leftCount, gameMode);
        }
        
        const rightCount = gameMode === CONFIG.GAME_MODES.PLUS_TWO ? 2 : 1; // Right side shows operator value
        const totalValue = gameMode === CONFIG.GAME_MODES.MINUS_ONE ? leftCount - 1 : 
                          gameMode === CONFIG.GAME_MODES.PLUS_TWO ? leftCount + 2 : leftCount + 1;
        
        return { left: leftCount, right: rightCount, total: totalValue };
    }

    renderIcons(leftCount, gameMode = CONFIG.GAME_MODES.PLUS_ONE) {
        // Choose one icon type and color for all icons in this round
        const iconClass = this.helpers.getRandomIcon();
        const iconColor = this.helpers.getRandomColor();
        
        console.log(`🎨 Selected: ${iconClass} in color ${iconColor}`);
        console.log(`📐 Game area dimensions:`, this.gameAreaDimensions);
        
        // Determine right side count based on game mode
        const rightCount = gameMode === CONFIG.GAME_MODES.PLUS_TWO ? 2 : 1; // 2 for Plus Two, 1 for Plus One/Minus One
        
        console.log(`🎮 Game mode: ${gameMode}, Right side icons: ${rightCount}`);
        
        // Store the new content counts
        this.currentContentCount = { left: leftCount, right: rightCount };
        
        // Generate positions for both sides (as percentages of game area)
        const leftPositions = this.helpers.generatePositions(leftCount, 'left', 'icon');
        const rightPositions = this.helpers.generatePositions(rightCount, 'right', 'icon');
        
        // Store positions for future resize events
        this.storedPositions.left = [...leftPositions];
        this.storedPositions.right = [...rightPositions];
        
        // Calculate icon size
        const iconSize = this.gameAreaDimensions.width * (this.iconSizePercent / 100);
        
        console.log(`📏 Icon size: ${Math.round(iconSize)}px (${this.iconSizePercent}% of game area width)`);
        
        // Create left side icons
        leftPositions.forEach((pos, index) => {
            const icon = this.createIcon(iconClass, iconColor, iconSize, pos.x, pos.y, 'left', index);
            icon.dataset.sideIndex = index;
            icon.dataset.contentType = 'icon';
            this.gameArea.appendChild(icon);
            this.currentContent.push(icon);
        });
        
        // Create right side icons (always 1 for Plus One/Minus One, always 2 for Plus Two)
        rightPositions.forEach((pos, index) => {
            const icon = this.createIcon(iconClass, iconColor, iconSize, pos.x, pos.y, 'right', leftCount + index);
            icon.dataset.sideIndex = index;
            icon.dataset.contentType = 'icon';
            this.gameArea.appendChild(icon);
            this.currentContent.push(icon);
        });
        
        console.log(`🎉 Created ${this.currentContent.length} icons positioned relative to game area`);
    }

    renderNumbers(leftNumber, gameMode) {
        console.log(`🔢 Rendering numbers: ${leftNumber} ${gameMode === CONFIG.GAME_MODES.MINUS_ONE ? '-' : '+'} ${gameMode === CONFIG.GAME_MODES.PLUS_TWO ? '2' : '1'}`);
        
        // Store the new content counts
        this.currentContentCount = { left: 1, right: 1 }; // One number display per side
        
        // Generate positions for number displays (centered in each area)
        const leftPositions = [{ x: 23, y: 60 }]; // Center of left area
        const rightPositions = [{ x: 77, y: 60 }]; // Center of right area
        
        // Store positions for future resize events
        this.storedPositions.left = [...leftPositions];
        this.storedPositions.right = [...rightPositions];
        
        // Calculate number size
        const numberSize = this.gameAreaDimensions.width * (this.numberSizePercent / 100);
        const textSize = numberSize * 0.25; // 25% of number size
        
        console.log(`📏 Number size: ${Math.round(numberSize)}px, Text size: ${Math.round(textSize)}px`);
        
        // Create left side number display
        const leftNumberDisplay = this.createNumberDisplay(leftNumber, numberSize, textSize, leftPositions[0].x, leftPositions[0].y, 'left', 0);
        leftNumberDisplay.dataset.sideIndex = 0;
        leftNumberDisplay.dataset.contentType = 'number';
        this.gameArea.appendChild(leftNumberDisplay);
        this.currentContent.push(leftNumberDisplay);
        
        // Create right side number display (shows operator value: 1 for Plus One/Minus One, 2 for Plus Two)
        const operatorValue = gameMode === CONFIG.GAME_MODES.PLUS_TWO ? 2 : 1;
        const rightNumberDisplay = this.createNumberDisplay(operatorValue, numberSize, textSize, rightPositions[0].x, rightPositions[0].y, 'right', 1);
        rightNumberDisplay.dataset.sideIndex = 0;
        rightNumberDisplay.dataset.contentType = 'number';
        this.gameArea.appendChild(rightNumberDisplay);
        this.currentContent.push(rightNumberDisplay);
        
        console.log(`🎉 Created ${this.currentContent.length} number displays positioned relative to game area`);
    }

    // ===== ELEMENT CREATION =====
    
    createIcon(iconClass, iconColor, iconSize, x, y, side, animationIndex) {
        const icon = document.createElement('i');
        icon.className = `game-icon ${iconClass}`;
        icon.dataset.side = side;
        
        // Position relative to game area using percentages with centering transform
        icon.style.cssText = `
            color: ${iconColor};
            left: ${x}%;
            bottom: ${y}%;
            font-size: ${iconSize}px;
            position: absolute;
            z-index: 5;
            pointer-events: none;
            user-select: none;
            animation: fadeIn 0.5s ease-in;
            animation-delay: ${animationIndex * 0.1}s;
            animation-fill-mode: both;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            transition: filter 0.3s ease;
            transform: translate(-50%, 50%);
        `;
        
        console.log(`✅ Created ${side} icon at (${x.toFixed(1)}%, ${y.toFixed(1)}% from bottom) within game area`);
        
        return icon;
    }

    createNumberDisplay(number, numberSize, textSize, x, y, side, animationIndex) {
        // Create number display container
        const numberContainer = document.createElement('div');
        numberContainer.className = 'large-number-display';
        numberContainer.dataset.side = side;
        
        // Position relative to game area using percentages with centering transform
        numberContainer.style.cssText = `
            left: ${x}%;
            bottom: ${y}%;
            position: absolute;
            z-index: 5;
            pointer-events: none;
            user-select: none;
            animation: fadeIn 0.5s ease-in;
            animation-delay: ${animationIndex * 0.1}s;
            animation-fill-mode: both;
            transform: translate(-50%, 50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        `;
        
        // Large number
        const numberElement = document.createElement('div');
        numberElement.className = 'large-number';
        numberElement.textContent = number.toString();
        numberElement.style.cssText = `
            font-size: ${numberSize}px;
            font-weight: bold;
            color: #dc3545;
            font-family: Arial, sans-serif;
            line-height: 1;
            margin-bottom: ${textSize * 0.4}px;
            text-shadow: 2px 2px 4px rgba(220, 53, 69, 0.3);
            white-space: nowrap;
        `;
        
        // Text version below
        const textElement = document.createElement('div');
        textElement.className = 'number-text';
        textElement.textContent = CONFIG.getNumberWord(number);
        textElement.style.cssText = `
            font-size: ${textSize}px;
            font-weight: bold;
            color: #dc3545;
            font-family: Arial, sans-serif;
            text-align: center;
            text-shadow: 1px 1px 2px rgba(220, 53, 69, 0.2);
            white-space: nowrap;
        `;
        
        numberContainer.appendChild(numberElement);
        numberContainer.appendChild(textElement);
        
        console.log(`✅ Created ${side} number display for ${number} at (${x.toFixed(1)}%, ${y.toFixed(1)}% from bottom) within game area`);
        
        return numberContainer;
    }

    // ===== UTILITY METHODS =====
    
    clearContent() {
        this.currentContent.forEach(content => {
            if (content.parentNode) {
                content.parentNode.removeChild(content);
            }
        });
        this.currentContent = [];
    }

    // Helper method to get current content count
    getCurrentCount() {
        return this.currentContent.length;
    }

    // Reset method to clear previous choices but preserve readiness state
    reset() {
        // Clear stored positions for new game
        this.storedPositions = { left: [], right: [] };
        this.currentContentCount = { left: 0, right: 0 };
        // Keep buttonBarReady and gameAreaDimensions for subsequent renders
        this.pendingRender = null;
        this.clearContent();
    }
    
    // Add jiggle animation to all content (for hints)
    jiggleContent() {
        this.currentContent.forEach(content => {
            content.style.animation = 'contentJiggle 0.5s ease-in-out';
            
            setTimeout(() => {
                content.style.animation = 'fadeIn 0.5s ease-in';
                content.style.animationFillMode = 'both';
            }, 500);
        });
    }
    
    // Highlight content with a glow effect
    highlightContent() {
        this.currentContent.forEach((content, index) => {
            setTimeout(() => {
                content.style.filter = 'drop-shadow(0 0 10px #ffd700)';
                
                setTimeout(() => {
                    content.style.filter = '';
                }, 2000);
            }, index * 100);
        });
    }
    
    // Destroy the content renderer and clean up resources
    destroy() {
        this.reset();
        
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
        
        // Remove from ButtonBar observers
        if (window.ButtonBar) {
            window.ButtonBar.removeObserver(this.updateGameAreaDimensions);
        }
        
        window.removeEventListener('resize', this.handleResize);
    }
}
