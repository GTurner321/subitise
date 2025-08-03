console.log('🔍 LOADING FIXED ADD ICONRENDERER - Proper container-based positioning');

class AddIconRenderer {
    constructor() {
        console.log('AddIconRenderer constructor - using container-based positioning');
        this.gameArea = document.querySelector('.game-area');
        this.leftContainer = document.querySelector('.left-side');
        this.rightContainer = document.querySelector('.right-side');
        this.currentIcons = [];
        this.previousIcon = null;
        this.previousColor = null;
        
        // ButtonBar coordination
        this.buttonBarReady = false;
        this.pendingRender = null;
        this.gameAreaDimensions = null;
        
        // Icon positioning within containers (as percentages of container dimensions)
        this.containerBoundaries = {
            // Icons positioned within 15%-85% of container width and 25%-90% of container height
            horizontal: { start: 15, end: 85 },
            vertical: { start: 25, end: 90 }
        };
        
        // Minimum distance between icon centers (15% of container width)
        this.minDistancePercent = 15;
        
        this.setupButtonBarCoordination();
        this.setupResizeHandling();
    }

    setupButtonBarCoordination() {
        // Register with ButtonBar to be notified of dimension changes
        if (window.ButtonBar) {
            window.ButtonBar.addObserver((dimensionData) => {
                console.log('🎯 ButtonBar dimensions updated:', dimensionData);
                this.buttonBarReady = true;
                
                // CRITICAL: Wait for game area to stabilize after ButtonBar sets its margins
                setTimeout(() => {
                    this.updateGameAreaDimensions();
                    
                    // If we have a pending render, execute it now
                    if (this.pendingRender) {
                        console.log('🎮 Executing pending render with stable game area dimensions');
                        const { leftCount, rightCount } = this.pendingRender;
                        this.pendingRender = null;
                        this.renderIcons(leftCount, rightCount);
                    } else if (this.currentIcons.length > 0) {
                        // Update existing icon positions
                        this.updateIconSizesAndPositions();
                    }
                }, 300); // Wait for CSS transitions and layout to stabilize
            });
        } else {
            // ButtonBar not ready yet, wait for it
            const checkButtonBar = () => {
                if (window.ButtonBar) {
                    this.setupButtonBarCoordination();
                } else {
                    setTimeout(checkButtonBar, 100);
                }
            };
            setTimeout(checkButtonBar, 100);
        }
    }

    updateGameAreaDimensions() {
        if (!this.gameArea || !this.leftContainer || !this.rightContainer) {
            console.error('❌ Game area or containers not found when trying to update dimensions');
            return;
        }
        
        // Force a reflow to ensure we get accurate dimensions
        this.gameArea.offsetHeight;
        
        // Get the actual game area and container dimensions
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const leftRect = this.leftContainer.getBoundingClientRect();
        const rightRect = this.rightContainer.getBoundingClientRect();
        
        // Validate that we have reasonable dimensions
        if (gameAreaRect.width < 100 || gameAreaRect.height < 100) {
            console.warn('⚠️ Game area dimensions seem too small, retrying...', gameAreaRect);
            setTimeout(() => {
                this.updateGameAreaDimensions();
            }, 100);
            return;
        }
        
        this.gameAreaDimensions = {
            gameArea: {
                width: gameAreaRect.width,
                height: gameAreaRect.height,
                left: gameAreaRect.left,
                top: gameAreaRect.top
            },
            leftContainer: {
                width: leftRect.width,
                height: leftRect.height,
                left: leftRect.left,
                top: leftRect.top
            },
            rightContainer: {
                width: rightRect.width,
                height: rightRect.height,
                left: rightRect.left,
                top: rightRect.top
            }
        };
        
        console.log('📏 Game area and container dimensions updated:', this.gameAreaDimensions);
    }

    setupResizeHandling() {
        // Simple resize handler
        window.addEventListener('resize', () => {
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }
            this.resizeTimeout = setTimeout(() => {
                if (this.buttonBarReady) {
                    this.updateGameAreaDimensions();
                    this.updateIconSizesAndPositions();
                }
            }, 100);
        });
    }
    
    updateIconSizesAndPositions() {
        if (!this.gameAreaDimensions || this.currentIcons.length === 0) return;
        
        // Calculate icon size (6% of game area width)
        const iconSize = this.gameAreaDimensions.gameArea.width * 0.06;
        
        // Update size for all current icons
        this.currentIcons.forEach(icon => {
            icon.style.fontSize = `${iconSize}px`;
        });
        
        // Regenerate all positions to maintain proper spacing
        this.repositionExistingIcons();
    }

    repositionExistingIcons() {
        if (this.currentIcons.length === 0 || !this.gameAreaDimensions) return;
        
        // Count left and right icons
        const leftIcons = this.currentIcons.filter(icon => icon.dataset.side === 'left');
        const rightIcons = this.currentIcons.filter(icon => icon.dataset.side === 'right');
        
        // Generate new positions
        const leftPositions = this.generateContainerPositions(leftIcons.length, 'left');
        const rightPositions = this.generateContainerPositions(rightIcons.length, 'right');
        
        // Apply new positions (relative to their containers)
        leftIcons.forEach((icon, index) => {
            if (leftPositions[index]) {
                icon.style.left = leftPositions[index].x + '%';
                icon.style.top = leftPositions[index].y + '%';
            }
        });
        
        rightIcons.forEach((icon, index) => {
            if (rightPositions[index]) {
                icon.style.left = rightPositions[index].x + '%';
                icon.style.top = rightPositions[index].y + '%';
            }
        });
    }

    clearIcons() {
        this.currentIcons.forEach(icon => {
            if (icon.parentNode) {
                icon.parentNode.removeChild(icon);
            }
        });
        this.currentIcons = [];
    }

    getRandomIcon() {
        const icons = (typeof CONFIG !== 'undefined' && CONFIG.ICONS) ? CONFIG.ICONS : [
            'fas fa-cat', 'fas fa-dog', 'fas fa-fish', 'fas fa-dove', 'fas fa-frog',
            'fas fa-car', 'fas fa-bicycle', 'fas fa-plane', 'fas fa-tree', 'fas fa-star'
        ];
        
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
        const colors = (typeof CONFIG !== 'undefined' && CONFIG.COLORS) ? CONFIG.COLORS : [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b',
            '#eb4d4b', '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894'
        ];
        
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

    generateContainerPositions(count, side) {
        console.log(`🎲 Generating ${count} positions for ${side} container`);
        
        if (count === 0) return [];
        
        const positions = [];
        const boundary = this.containerBoundaries;
        const maxAttempts = 100;
        let totalFallbacks = 0;
        
        for (let i = 0; i < count; i++) {
            let validPosition = false;
            let attempts = 0;
            let x, y;
            
            // Try random positioning first
            while (!validPosition && attempts < maxAttempts) {
                // Generate random position within boundary (relative to container)
                x = boundary.horizontal.start + 
                    Math.random() * (boundary.horizontal.end - boundary.horizontal.start);
                y = boundary.vertical.start + 
                    Math.random() * (boundary.vertical.end - boundary.vertical.start);
                
                // Check distance from all existing positions in this batch
                validPosition = this.isContainerPositionValid(x, y, positions);
                attempts++;
            }
            
            if (!validPosition) {
                console.log(`❌ Using fallback grid position for ${side} icon ${i}`);
                const fallbackPos = this.getFallbackContainerPosition(i, count);
                x = fallbackPos.x;
                y = fallbackPos.y;
                totalFallbacks++;
            } else {
                console.log(`✅ Found random position for ${side} icon ${i}: (${x.toFixed(1)}%, ${y.toFixed(1)}%)`);
            }
            
            positions.push({ x, y });
        }
        
        console.log(`📊 ${side} container: ${count - totalFallbacks} random, ${totalFallbacks} fallback positions`);
        return positions;
    }

    isContainerPositionValid(x, y, existingPositions) {
        // Check against all existing positions in this render
        for (let pos of existingPositions) {
            const distance = Math.sqrt(
                Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2)
            );
            
            // Distance is in percentage units relative to container
            if (distance < this.minDistancePercent) {
                return false;
            }
        }
        
        return true;
    }

    getFallbackContainerPosition(index, totalCount) {
        const boundary = this.containerBoundaries;
        
        // Create 3x3 grid within the boundary
        const cols = 3;
        const rows = 3;
        
        // Calculate grid cell size
        const cellWidth = (boundary.horizontal.end - boundary.horizontal.start) / cols;
        const cellHeight = (boundary.vertical.end - boundary.vertical.start) / rows;
        
        // Get grid position for this index
        const row = Math.floor(index / cols) % rows;
        const col = index % cols;
        
        // Calculate center of grid cell
        const cellCenterX = boundary.horizontal.start + (col * cellWidth) + (cellWidth / 2);
        const cellCenterY = boundary.vertical.start + (row * cellHeight) + (cellHeight / 2);
        
        // Add random offset within cell (±25% of cell size)
        const offsetX = (Math.random() - 0.5) * cellWidth * 0.5;
        const offsetY = (Math.random() - 0.5) * cellHeight * 0.5;
        
        return {
            x: Math.max(boundary.horizontal.start, Math.min(boundary.horizontal.end, cellCenterX + offsetX)),
            y: Math.max(boundary.vertical.start, Math.min(boundary.vertical.end, cellCenterY + offsetY))
        };
    }

    renderIcons(leftCount, rightCount) {
        console.log(`🎮 === RENDERING ${leftCount} + ${rightCount} ICONS ===`);
        
        // Check if ButtonBar is ready with proper dimensions
        if (!this.buttonBarReady) {
            console.log('⏳ ButtonBar not ready - storing render request for later');
            this.pendingRender = { leftCount, rightCount };
            return;
        }
        
        // Update dimensions to ensure we have the latest measurements
        this.updateGameAreaDimensions();
        
        // Check if we have valid dimensions
        if (!this.gameAreaDimensions || 
            !this.gameAreaDimensions.gameArea || 
            this.gameAreaDimensions.gameArea.width < 100) {
            console.log('⏳ Game area dimensions not ready - storing render request for later');
            this.pendingRender = { leftCount, rightCount };
            
            // Retry after a short delay
            setTimeout(() => {
                if (this.pendingRender) {
                    console.log('🔄 Retrying icon render with updated dimensions');
                    const { leftCount: retryLeft, rightCount: retryRight } = this.pendingRender;
                    this.pendingRender = null;
                    this.renderIcons(retryLeft, retryRight);
                }
            }, 200);
            return;
        }
        
        this.clearIcons();
        
        if (!this.leftContainer || !this.rightContainer) {
            console.error('❌ Left or right containers not found!');
            return;
        }
        
        console.log('✅ Containers ready, proceeding with icon render');
        
        // Wait a small amount for any layout changes to settle
        setTimeout(() => {
            this.doActualRender(leftCount, rightCount);
        }, 50);
    }

    doActualRender(leftCount, rightCount) {
        // Choose one icon type and color for all icons
        const iconClass = this.getRandomIcon();
        const iconColor = this.getRandomColor();
        
        console.log(`🎨 Selected: ${iconClass} in color ${iconColor}`);
        console.log(`📐 Container dimensions:`, this.gameAreaDimensions);
        
        // Generate positions for both sides (relative to their containers)
        const leftPositions = this.generateContainerPositions(leftCount, 'left');
        const rightPositions = this.generateContainerPositions(rightCount, 'right');
        
        // Calculate icon size (6% of game area width)
        const iconSize = this.gameAreaDimensions.gameArea.width * 0.06;
        
        console.log(`📏 Icon size: ${Math.round(iconSize)}px`);
        
        // Create left side icons (positioned relative to left container)
        leftPositions.forEach((pos, index) => {
            const icon = this.createIcon(iconClass, iconColor, iconSize, pos.x, pos.y, 'left', index);
            this.leftContainer.appendChild(icon);
            this.currentIcons.push(icon);
        });
        
        // Create right side icons (positioned relative to right container)
        rightPositions.forEach((pos, index) => {
            const icon = this.createIcon(iconClass, iconColor, iconSize, pos.x, pos.y, 'right', leftCount + index);
            this.rightContainer.appendChild(icon);
            this.currentIcons.push(icon);
        });
        
        console.log(`🎉 Created ${this.currentIcons.length} icons in their respective containers`);
        
        return { left: leftCount, right: rightCount, total: leftCount + rightCount };
    }

    createIcon(iconClass, iconColor, iconSize, x, y, side, animationIndex) {
        const icon = document.createElement('i');
        icon.className = `game-icon ${iconClass}`;
        icon.dataset.side = side;
        
        // Position relative to the container (not the game area)
        icon.style.cssText = `
            color: ${iconColor};
            left: ${x}%;
            top: ${y}%;
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
            transform: translate(-50%, -50%);
        `;
        
        console.log(`✅ Created ${side} icon at (${x.toFixed(1)}%, ${y.toFixed(1)}%) within ${side} container`);
        
        return icon;
    }

    // Helper method to get current icon count
    getCurrentCount() {
        return this.currentIcons.length;
    }

    // Reset method to clear previous choices
    reset() {
        this.previousIcon = null;
        this.previousColor = null;
        this.buttonBarReady = false;
        this.pendingRender = null;
        this.gameAreaDimensions = null;
        this.clearIcons();
    }
    
    // Add jiggle animation to all icons (for hints)
    jiggleIcons() {
        this.currentIcons.forEach(icon => {
            icon.style.animation = 'iconJiggle 0.5s ease-in-out';
            
            setTimeout(() => {
                icon.style.animation = 'fadeIn 0.5s ease-in';
                icon.style.animationFillMode = 'both';
            }, 500);
        });
    }
    
    // Highlight icons with a glow effect
    highlightIcons() {
        this.currentIcons.forEach((icon, index) => {
            setTimeout(() => {
                icon.style.filter = 'drop-shadow(0 0 10px #ffd700)';
                
                setTimeout(() => {
                    icon.style.filter = '';
                }, 2000);
            }, index * 100);
        });
    }
    
    // Destroy the icon renderer and clean up resources
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
