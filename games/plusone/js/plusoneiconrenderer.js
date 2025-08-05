console.log('🔍 LOADING PLUS ONE CONTENT RENDERER - Game area relative positioning');

class PlusOneContentRenderer {
    constructor() {
        console.log('PlusOneContentRenderer constructor - using game area relative positioning');
        this.gameArea = document.querySelector('.game-area');
        this.leftSide = document.getElementById('leftSide');
        this.rightSide = document.getElementById('rightSide');
        this.currentContent = [];
        this.previousIcon = null;
        this.previousColor = null;
        
        // Content size as percentage of game area width
        this.iconSizePercent = 6; // 6% of game area width for icons
        this.numberSizePercent = 12; // 12% of game area width for large numbers
        
        // Store persistent content positions (as percentages) to prevent re-randomization on resize
        this.storedPositions = {
            left: [],
            right: []
        };
        this.currentContentCount = { left: 0, right: 0 };
        
        // ButtonBar coordination
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
        
        // DON'T setup ButtonBar coordination in constructor
        // Let the game controller call setupButtonBarCoordination() explicitly
        // This ensures proper timing
        console.log('🔍 PlusOneContentRenderer ready for coordination setup');
        
        this.setupResizeHandling();
    }

    setupButtonBarCoordination() {
        console.log('🔗 Setting up ButtonBar coordination for content renderer');
        
        // Register with ButtonBar to be notified of dimension changes
        if (window.ButtonBar) {
            console.log('✅ ButtonBar found, registering observer');
            window.ButtonBar.addObserver((dimensionData) => {
                console.log('🎯 ButtonBar dimensions updated for renderer:', dimensionData);
                this.buttonBarReady = true;
                
                // Wait for game area to stabilize after ButtonBar sets its margins
                setTimeout(() => {
                    this.updateGameAreaDimensions();
                    
                    // If we have a pending render, execute it now
                    if (this.pendingRender) {
                        console.log('🎮 Executing pending render with stable game area dimensions');
                        const { leftCount, currentLevel } = this.pendingRender;
                        this.pendingRender = null;
                        this.renderContent(leftCount, currentLevel);
                    } else if (this.currentContent.length > 0) {
                        // Update existing content positions and sizes
                        this.updateContentSizesAndPositions();
                    }
                }, 400);
            });
            
            // Check if ButtonBar is already ready (in case we missed the initial notification)
            if (window.ButtonBar.dimensions && window.ButtonBar.dimensions.buttonPanelWidth > 0) {
                console.log('🎯 ButtonBar already has dimensions, setting flag immediately');
                this.buttonBarReady = true;
                setTimeout(() => {
                    this.updateGameAreaDimensions();
                }, 100);
            }
        } else {
            console.warn('⚠️ ButtonBar not available when setting up coordination');
            // ButtonBar not ready yet, wait for it
            const checkButtonBar = () => {
                if (window.ButtonBar) {
                    console.log('🔄 ButtonBar now available, retrying coordination setup');
                    this.setupButtonBarCoordination();
                } else {
                    setTimeout(checkButtonBar, 100);
                }
            };
            setTimeout(checkButtonBar, 100);
        }
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
        if (gameAreaRect.width < 100 || gameAreaRect.height < 100) {
            console.warn('⚠️ Game area dimensions seem too small, retrying...', gameAreaRect);
            setTimeout(() => {
                this.updateGameAreaDimensions();
            }, 100);
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
        
        console.log('📏 Game area dimensions updated and validated:', this.gameAreaDimensions);
    }

    setupResizeHandling() {
        window.addEventListener('resize', () => {
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }
            this.resizeTimeout = setTimeout(() => {
                if (this.buttonBarReady) {
                    this.updateGameAreaDimensions();
                    this.updateContentSizesAndPositions();
                }
            }, 100);
        });
    }
    
    updateContentSizesAndPositions() {
        if (!this.gameArea || this.currentContent.length === 0 || !this.gameAreaDimensions) return;
        
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
                    textElement.style.fontSize = `${numberSize * 0.25}px`; // 25% of number size
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

    clearContent() {
        this.currentContent.forEach(content => {
            if (content.parentNode) {
                content.parentNode.removeChild(content);
            }
        });
        this.currentContent = [];
    }

    getRandomIcon() {
        const icons = CONFIG.ICONS;
        let selectedIcon;
        let attempts = 0;
        const maxAttempts = 50;
        
        do {
            selectedIcon = icons[Math.floor(Math.random() * icons.length)];
            attempts++;
        } while (selectedIcon === this.previousIcon && attempts < maxAttempts);
        
        this.previousIcon = selectedIcon;
        return selectedIcon;
    }

    getRandomColor() {
        const colors = CONFIG.COLORS;
        let selectedColor;
        let attempts = 0;
        const maxAttempts = 50;
        
        do {
            selectedColor = colors[Math.floor(Math.random() * colors.length)];
            attempts++;
        } while (selectedColor === this.previousColor && attempts < maxAttempts);
        
        this.previousColor = selectedColor;
        return selectedColor;
    }

    generateSmartPosition(existingPositions, side) {
        // Define midpoints for each side in game area coordinates
        let xMidpoint, yMidpoint;
        
        if (side === 'left') {
            xMidpoint = 23; // 23% - midpoint of left area (6%-40%)
            yMidpoint = 60; // 60% - midpoint of vertical area (30%-90%)
        } else { // right side
            xMidpoint = 77; // 77% - midpoint of right area (60%-94%)
            yMidpoint = 60; // 60% - same vertical midpoint as left
        }
        
        let avgX = xMidpoint;
        let avgY = yMidpoint;
        
        if (existingPositions.length > 0) {
            avgX = existingPositions.reduce((sum, pos) => sum + pos.x, 0) / existingPositions.length;
            avgY = existingPositions.reduce((sum, pos) => sum + pos.y, 0) / existingPositions.length;
        }
        
        // Smart positioning based on side-specific logic
        let xRange, yRange;
        
        if (side === 'left') {
            if (avgX >= 23) {
                xRange = { start: 6, end: 23 };
            } else {
                xRange = { start: 23, end: 40 };
            }
        } else {
            if (avgX >= 77) {
                xRange = { start: 60, end: 77 };
            } else {
                xRange = { start: 77, end: 94 };
            }
        }
        
        if (avgY >= 60) {
            yRange = { start: 30, end: 60 };
        } else {
            yRange = { start: 60, end: 90 };
        }
        
        const x = xRange.start + Math.random() * (xRange.end - xRange.start);
        const y = yRange.start + Math.random() * (yRange.end - yRange.start);
        
        console.log(`🧠 Smart positioning for ${side}: avgX=${avgX.toFixed(1)}%, avgY=${avgY.toFixed(1)}% → targeting (${x.toFixed(1)}%, ${y.toFixed(1)}%)`);
        
        return { x, y };
    }

    generatePositions(count, side, contentType) {
        console.log(`🎲 Generating positions for ${count} ${contentType}s on ${side} side`);
        
        if (count === 0) return [];
        
        const positions = [];
        const maxAttempts = 120;
        let totalFallbacks = 0;
        
        for (let i = 0; i < count; i++) {
            let validPosition = false;
            let attempts = 0;
            let x, y;
            
            // Try positioning with smart placement and progressive spacing relaxation
            while (!validPosition && attempts < maxAttempts) {
                const smartPos = this.generateSmartPosition(positions, side);
                x = smartPos.x;
                y = smartPos.y;
                
                // Check distance with progressive relaxation using Manhattan distance
                validPosition = this.checkManhattanDistance(x, y, positions, attempts, contentType);
                attempts++;
            }
            
            if (!validPosition) {
                console.log(`⚠️ Could not find valid position for ${side} ${contentType} ${i} after ${maxAttempts} attempts - using emergency smart placement`);
                const emergencyPos = this.generateSmartPosition(positions, side);
                x = emergencyPos.x;
                y = emergencyPos.y;
                totalFallbacks++;
            } else {
                console.log(`✅ Found position for ${side} ${contentType} ${i} at (${x.toFixed(1)}%, ${y.toFixed(1)}%) after ${attempts} attempts`);
            }
            
            positions.push({ x, y });
        }
        
        console.log(`📊 ${side} side: ${count - totalFallbacks} valid positions, ${totalFallbacks} emergency placements`);
        return positions;
    }

    checkManhattanDistance(x, y, existingPositions, attempts = 0, contentType = 'icon') {
        // Calculate minimum distance based on attempt count and content type
        let baseDistance = contentType === 'icon' ? this.iconSizePercent : this.numberSizePercent;
        let minDistance;
        
        if (attempts <= 50) {
            minDistance = baseDistance * 1.5; // 1.5 content widths spacing
        } else if (attempts <= 100) {
            minDistance = baseDistance; // 1 content width spacing
        } else if (attempts <= 120) {
            minDistance = baseDistance * 0.5; // 0.5 content width spacing
        } else {
            return true; // Emergency placement
        }
        
        // Check against all existing positions using Manhattan distance
        for (let i = 0; i < existingPositions.length; i++) {
            const pos = existingPositions[i];
            const manhattanDistance = Math.abs(x - pos.x) + Math.abs(y - pos.y);
            
            if (manhattanDistance < minDistance) {
                return false;
            }
        }
        
        // Also check against all currently placed content using Manhattan distance
        for (let i = 0; i < this.currentContent.length; i++) {
            const content = this.currentContent[i];
            const contentX = parseFloat(content.style.left);
            const contentY = parseFloat(content.style.bottom);
            
            const manhattanDistance = Math.abs(x - contentX) + Math.abs(y - contentY);
            
            if (manhattanDistance < minDistance) {
                return false;
            }
        }
        
        return true;
    }

    renderContent(leftCount, currentLevel) {
        console.log(`🎮 === RENDERING CONTENT FOR LEVEL ${currentLevel}: ${leftCount} + 1 ===`);
        
        // Check if ButtonBar is available and functional
        const buttonBarExists = window.ButtonBar && typeof window.ButtonBar.create === 'function';
        
        // Force check if ButtonBar is actually ready by looking at its internal state
        if (buttonBarExists) {
            // Check if ButtonBar has been initialized and has dimensions
            const hasValidDimensions = window.ButtonBar.dimensions && 
                                     window.ButtonBar.dimensions.screenWidth > 0 && 
                                     window.ButtonBar.dimensions.buttonPanelWidth > 0;
            
            if (hasValidDimensions && !this.buttonBarReady) {
                console.log('🔧 ButtonBar has valid dimensions but flag not set - correcting');
                this.buttonBarReady = true;
            }
        }
        
        // Check if ButtonBar is ready with proper dimensions
        if (!this.buttonBarReady || !buttonBarExists) {
            console.log(`⏳ ButtonBar not ready - storing render request for later (ready: ${this.buttonBarReady}, exists: ${buttonBarExists})`);
            this.pendingRender = { leftCount, currentLevel };
            
            // Force update check after a short delay
            setTimeout(() => {
                if (this.pendingRender && window.ButtonBar) {
                    console.log('🔄 Force-checking ButtonBar readiness');
                    const hasValidDimensions = window.ButtonBar.dimensions && 
                                             window.ButtonBar.dimensions.screenWidth > 0;
                    if (hasValidDimensions) {
                        console.log('🎮 ButtonBar dimensions found, proceeding with render');
                        this.buttonBarReady = true;
                        const { leftCount: retryLeft, currentLevel: retryLevel } = this.pendingRender;
                        this.pendingRender = null;
                        this.renderContent(retryLeft, retryLevel);
                    }
                }
            }, 500);
            return;
        }
        
        // Update dimensions to ensure we have the latest measurements
        this.updateGameAreaDimensions();
        
        // Check if we have valid game area dimensions
        if (!this.gameAreaDimensions || this.gameAreaDimensions.width < 100 || this.gameAreaDimensions.height < 100) {
            console.log('⏳ Game area dimensions not ready - storing render request for later');
            this.pendingRender = { leftCount, currentLevel };
            
            // Retry after a short delay
            setTimeout(() => {
                if (this.pendingRender) {
                    console.log('🔄 Retrying content render with updated dimensions');
                    const { leftCount: retryLeft, currentLevel: retryLevel } = this.pendingRender;
                    this.pendingRender = null;
                    this.renderContent(retryLeft, retryLevel);
                }
            }, 200);
            return;
        }
        
        this.clearContent();
        
        if (!this.gameArea) {
            console.error('❌ Game area not found!');
            return;
        }
        
        console.log('✅ Game area ready, proceeding with content render');
        
        // Wait a small amount for any layout changes to settle
        setTimeout(() => {
            this.doActualRender(leftCount, currentLevel);
        }, 50);
    }

    doActualRender(leftCount, currentLevel) {
        // Determine if this is a picture format level (icons) or number format (large numbers)
        const isPictureFormat = currentLevel <= 2 || currentLevel === 5;
        
        if (isPictureFormat) {
            this.renderIcons(leftCount);
        } else {
            this.renderNumbers(leftCount);
        }
        
        return { left: leftCount, right: 1, total: leftCount + 1 };
    }

    renderIcons(leftCount) {
        // Choose one icon type and color for all icons in this round
        const iconClass = this.getRandomIcon();
        const iconColor = this.getRandomColor();
        
        console.log(`🎨 Selected: ${iconClass} in color ${iconColor}`);
        console.log(`📐 Game area dimensions:`, this.gameAreaDimensions);
        
        // Store the new content counts
        this.currentContentCount = { left: leftCount, right: 1 };
        
        // Generate positions for both sides (as percentages of game area)
        const leftPositions = this.generatePositions(leftCount, 'left', 'icon');
        const rightPositions = this.generatePositions(1, 'right', 'icon'); // Always 1 icon on right
        
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
        
        // Create right side icons (always 1 for Plus One)
        rightPositions.forEach((pos, index) => {
            const icon = this.createIcon(iconClass, iconColor, iconSize, pos.x, pos.y, 'right', leftCount + index);
            icon.dataset.sideIndex = index;
            icon.dataset.contentType = 'icon';
            this.gameArea.appendChild(icon);
            this.currentContent.push(icon);
        });
        
        console.log(`🎉 Created ${this.currentContent.length} icons positioned relative to game area`);
    }

    renderNumbers(leftNumber) {
        console.log(`🔢 Rendering numbers: ${leftNumber} + 1`);
        
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
        
        // Create right side number display (always "1")
        const rightNumberDisplay = this.createNumberDisplay(1, numberSize, textSize, rightPositions[0].x, rightPositions[0].y, 'right', 1);
        rightNumberDisplay.dataset.sideIndex = 0;
        rightNumberDisplay.dataset.contentType = 'number';
        this.gameArea.appendChild(rightNumberDisplay);
        this.currentContent.push(rightNumberDisplay);
        
        console.log(`🎉 Created ${this.currentContent.length} number displays positioned relative to game area`);
    }

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

    // Helper method to get current content count
    getCurrentCount() {
        return this.currentContent.length;
    }

    // Reset method to clear previous choices but preserve readiness state
    reset() {
        this.previousIcon = null;
        this.previousColor = null;
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
