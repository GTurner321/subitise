console.log('🔍 LOADING FIXED ADD ICONRENDERER - Game area relative positioning');

class AddIconRenderer {
    constructor() {
        console.log('AddIconRenderer constructor - using game area relative positioning');
        this.gameArea = document.querySelector('.game-area');
        this.leftSide = document.getElementById('leftSide');
        this.rightSide = document.getElementById('rightSide');
        this.currentIcons = [];
        this.previousIcon = null;
        this.previousColor = null;
        
        // Icon size as percentage of game area width
        this.iconSizePercent = 6; // 6% of game area width
        
        // Store persistent icon positions (as percentages) to prevent re-randomization on resize
        this.storedPositions = {
            left: [],
            right: []
        };
        this.currentIconCount = { left: 0, right: 0 };
        
        // ButtonBar coordination
        this.buttonBarReady = false;
        this.pendingRender = null;
        this.gameAreaDimensions = null;
        
        // Icon boundaries relative to game area (percentages)
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
        
        this.setupButtonBarCoordination();
        this.setupResizeHandling();
    }

    setupButtonBarCoordination() {
        // Register with ButtonBar to be notified of dimension changes
        if (window.ButtonBar) {
            window.ButtonBar.addObserver((dimensionData) => {
                console.log('🎯 ButtonBar dimensions updated:', dimensionData);
                this.buttonBarReady = true;
                
                // Wait for game area to stabilize after ButtonBar sets its margins
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
                }, 400); // Wait for CSS transitions and layout to stabilize
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
                    this.updateIconSizesAndPositions();
                }
            }, 100);
        });
    }
    
    updateIconSizesAndPositions() {
        if (!this.gameArea || this.currentIcons.length === 0 || !this.gameAreaDimensions) return;
        
        // Use stored positions instead of regenerating random ones
        const iconSize = this.gameAreaDimensions.width * (this.iconSizePercent / 100);
        
        // Update size and apply stored positions for all current icons
        this.currentIcons.forEach((icon, index) => {
            icon.style.fontSize = `${iconSize}px`;
            
            // Find the stored position for this icon
            const side = icon.dataset.side;
            const sideIndex = icon.dataset.sideIndex ? parseInt(icon.dataset.sideIndex) : index;
            const storedPos = this.storedPositions[side][sideIndex];
            
            if (storedPos) {
                icon.style.left = storedPos.x + '%';
                icon.style.bottom = storedPos.y + '%';
                console.log(`🔄 Repositioned ${side} icon ${sideIndex} to stored position (${storedPos.x.toFixed(1)}%, ${storedPos.y.toFixed(1)}%)`);
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
        
        let avgX = xMidpoint; // Default to midpoint if no existing positions
        let avgY = yMidpoint; // Default to midpoint if no existing positions
        
        if (existingPositions.length > 0) {
            // Calculate actual averages using game area coordinates
            avgX = existingPositions.reduce((sum, pos) => sum + pos.x, 0) / existingPositions.length;
            avgY = existingPositions.reduce((sum, pos) => sum + pos.y, 0) / existingPositions.length;
        }
        
        // Smart positioning based on side-specific logic
        let xRange, yRange;
        
        if (side === 'left') {
            // Left side logic: 6%-40% horizontal range
            if (avgX >= 23) {
                // Crowded right half of left area, place in left half
                xRange = { start: 6, end: 23 };
            } else {
                // Crowded left half of left area, place in right half
                xRange = { start: 23, end: 40 };
            }
        } else {
            // Right side logic: 60%-94% horizontal range
            if (avgX >= 77) {
                // Crowded right half of right area, place in left half
                xRange = { start: 60, end: 77 };
            } else {
                // Crowded left half of right area, place in right half
                xRange = { start: 77, end: 94 };
            }
        }
        
        // Vertical logic (same for both sides): 30%-90% range
        if (avgY >= 60) {
            // Crowded upper half, place in lower half
            yRange = { start: 30, end: 60 };
        } else {
            // Crowded lower half, place in upper half
            yRange = { start: 60, end: 90 };
        }
        
        // Generate random position within the smart ranges
        const x = xRange.start + Math.random() * (xRange.end - xRange.start);
        const y = yRange.start + Math.random() * (yRange.end - yRange.start);
        
        console.log(`🧠 Smart positioning for ${side}: avgX=${avgX.toFixed(1)}%, avgY=${avgY.toFixed(1)}% → targeting (${x.toFixed(1)}%, ${y.toFixed(1)}%)`);
        
        return { x, y };
    }

    generatePositions(count, side) {
        console.log(`🎲 Generating positions for ${count} icons on ${side} side`);
        
        if (count === 0) return [];
        
        const positions = [];
        const maxAttempts = 120;
        let totalFallbacks = 0;
        
        for (let i = 0; i < count; i++) {
            let validPosition = false;
            let attempts = 0;
            let x, y;
            
            // Try positioning with smart placement from attempt 1 and progressive spacing relaxation
            while (!validPosition && attempts < maxAttempts) {
                // Use smart spacing for ALL attempts
                const smartPos = this.generateSmartPosition(positions, side);
                x = smartPos.x;
                y = smartPos.y;
                
                // Check distance with progressive relaxation using Manhattan distance
                validPosition = this.checkManhattanDistance(x, y, positions, attempts);
                attempts++;
            }
            
            if (!validPosition) {
                console.log(`⚠️ Could not find valid position for ${side} icon ${i} after ${maxAttempts} attempts - using emergency smart placement`);
                // Emergency: use smart placement with no distance restrictions
                const emergencyPos = this.generateSmartPosition(positions, side);
                x = emergencyPos.x;
                y = emergencyPos.y;
                totalFallbacks++;
            } else {
                console.log(`✅ Found position for ${side} icon ${i} at (${x.toFixed(1)}%, ${y.toFixed(1)}%) after ${attempts} attempts`);
            }
            
            positions.push({ x, y });
        }
        
        console.log(`📊 ${side} side: ${count - totalFallbacks} valid positions, ${totalFallbacks} emergency placements`);
        return positions;
    }

    checkManhattanDistance(x, y, existingPositions, attempts = 0) {
        // Calculate minimum distance based on attempt count (progressive relaxation)
        let minDistance;
        
        if (attempts <= 50) {
            // Attempts 1-50: 1.5 icon width spacing
            minDistance = this.iconSizePercent * 1.5; // 9% = 1.5 icon widths
        } else if (attempts <= 100) {
            // Attempts 51-100: 1 icon width spacing
            minDistance = this.iconSizePercent; // 6% = 1 icon width
        } else if (attempts <= 120) {
            // Attempts 101-120: 0.5 icon width spacing  
            minDistance = this.iconSizePercent * 0.5; // 3% = 0.5 icon width
        } else {
            // Attempts 121+: Emergency placement (no restrictions)
            return true;
        }
        
        // DEBUG: Log what we're checking
        console.log(`🔍 Manhattan check (${x.toFixed(1)}%, ${y.toFixed(1)}%) - minDistance: ${minDistance.toFixed(1)}%, attempts: ${attempts}`);
        
        // Check against all existing positions using Manhattan distance
        for (let i = 0; i < existingPositions.length; i++) {
            const pos = existingPositions[i];
            const manhattanDistance = Math.abs(x - pos.x) + Math.abs(y - pos.y);
            
            console.log(`  📐 Manhattan distance to position ${i} (${pos.x.toFixed(1)}%, ${pos.y.toFixed(1)}%): ${manhattanDistance.toFixed(2)}%`);
            
            if (manhattanDistance < minDistance) {
                console.log(`  ❌ TOO CLOSE! ${manhattanDistance.toFixed(2)}% < ${minDistance.toFixed(1)}%`);
                return false;
            }
        }
        
        // Also check against all currently placed icons from both sides using Manhattan distance
        for (let i = 0; i < this.currentIcons.length; i++) {
            const icon = this.currentIcons[i];
            const iconX = parseFloat(icon.style.left);
            const iconY = parseFloat(icon.style.bottom);
            
            const manhattanDistance = Math.abs(x - iconX) + Math.abs(y - iconY);
            
            console.log(`  📐 Manhattan distance to current icon ${i} (${iconX.toFixed(1)}%, ${iconY.toFixed(1)}%): ${manhattanDistance.toFixed(2)}%`);
            
            if (manhattanDistance < minDistance) {
                console.log(`  ❌ TOO CLOSE to current icon! ${manhattanDistance.toFixed(2)}% < ${minDistance.toFixed(1)}%`);
                return false;
            }
        }
        
        console.log(`  ✅ Position valid - all Manhattan distances >= ${minDistance.toFixed(1)}%`);
        return true;
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
        
        // Check if we have valid game area dimensions
        if (!this.gameAreaDimensions || this.gameAreaDimensions.width < 100 || this.gameAreaDimensions.height < 100) {
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
        
        if (!this.gameArea) {
            console.error('❌ Game area not found!');
            return;
        }
        
        console.log('✅ Game area ready, proceeding with icon render');
        
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
        console.log(`📐 Game area dimensions:`, this.gameAreaDimensions);
        
        // Store the new icon counts
        this.currentIconCount = { left: leftCount, right: rightCount };
        
        // Generate positions for both sides (as percentages of game area)
        const leftPositions = this.generatePositions(leftCount, 'left');
        const rightPositions = this.generatePositions(rightCount, 'right');
        
        // Store positions for future resize events
        this.storedPositions.left = [...leftPositions];
        this.storedPositions.right = [...rightPositions];
        
        // Calculate icon size (use the iconSizePercent parameter)
        const iconSize = this.gameAreaDimensions.width * (this.iconSizePercent / 100);
        
        console.log(`📏 Icon size: ${Math.round(iconSize)}px (${this.iconSizePercent}% of game area width)`);
        
        // Create left side icons (positioned relative to game area)
        leftPositions.forEach((pos, index) => {
            const icon = this.createIcon(iconClass, iconColor, iconSize, pos.x, pos.y, 'left', index);
            icon.dataset.sideIndex = index; // Store index for repositioning
            this.gameArea.appendChild(icon);
            this.currentIcons.push(icon);
        });
        
        // Create right side icons (positioned relative to game area)
        rightPositions.forEach((pos, index) => {
            const icon = this.createIcon(iconClass, iconColor, iconSize, pos.x, pos.y, 'right', leftCount + index);
            icon.dataset.sideIndex = index; // Store index for repositioning
            this.gameArea.appendChild(icon);
            this.currentIcons.push(icon);
        });
        
        console.log(`🎉 Created ${this.currentIcons.length} icons positioned relative to game area`);
        
        return { left: leftCount, right: rightCount, total: leftCount + rightCount };
    }

    createIcon(iconClass, iconColor, iconSize, x, y, side, animationIndex) {
        const icon = document.createElement('i');
        icon.className = `game-icon ${iconClass}`;
        icon.dataset.side = side;
        
        // Position relative to game area using percentages with centering transform for game area icons ONLY
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

    // Helper method to get current icon count
    getCurrentCount() {
        return this.currentIcons.length;
    }

    // Reset method to clear previous choices but preserve readiness state
    reset() {
        this.previousIcon = null;
        this.previousColor = null;
        // Clear stored positions for new game
        this.storedPositions = { left: [], right: [] };
        this.currentIconCount = { left: 0, right: 0 };
        // Keep buttonBarReady and gameAreaDimensions for subsequent renders
        this.pendingRender = null;
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
