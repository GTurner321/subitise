console.log('🔍 LOADING ICONRENDERER FILE - Clean version with adaptive distance and random positioning');

class IconRenderer {
    constructor() {
        console.log('IconRenderer constructor - using RANDOM positioning with adaptive distance');
        this.gameArea = document.querySelector('.game-area');
        this.currentIcons = [];
        this.previousIcon = null; // Track previous icon type
        this.previousColor = null; // Track previous color
        
        // Track resize observer for responsive behavior
        this.resizeObserver = null;
        this.setupResizeHandling();
    }

    setupResizeHandling() {
        // Use ResizeObserver for efficient resize tracking
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                this.handleResize();
            });
            
            if (this.gameArea) {
                this.resizeObserver.observe(this.gameArea);
            }
        } else {
            // Fallback to window resize for older browsers
            window.addEventListener('resize', () => {
                this.handleResize();
            });
        }
        
        // Also listen for ButtonBar dimension changes
        if (window.ButtonBar) {
            window.ButtonBar.addObserver(() => {
                this.handleResize();
            });
        }
    }
    
    handleResize() {
        // Debounce resize handling
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        this.resizeTimeout = setTimeout(() => {
            this.updateIconSizesAndPositions();
        }, 100);
    }
    
    updateIconSizesAndPositions() {
        if (!this.gameArea || this.currentIcons.length === 0) return;
        
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const iconSize = gameAreaRect.width * 0.084; // 8.4% of game area width (30% smaller than 12%)
        
        // Update size for all current icons
        this.currentIcons.forEach(icon => {
            icon.style.fontSize = `${iconSize}px`;
        });
        
        // Regenerate RANDOM positions for current icon count with new dimensions
        if (this.currentIcons.length > 0) {
            const count = this.currentIcons.length;
            const positions = this.generateNonOverlappingPositions(count);
            
            // Update positions
            this.currentIcons.forEach((icon, index) => {
                if (positions[index]) {
                    icon.style.left = positions[index].x + 'px';
                    icon.style.top = positions[index].y + 'px';
                }
            });
        }
    }

    clearIcons() {
        // Remove all existing icons
        this.currentIcons.forEach(icon => {
            if (icon.parentNode) {
                icon.parentNode.removeChild(icon);
            }
        });
        this.currentIcons = [];
    }

    getRandomIcon() {
        // Check if CONFIG is available, use fallback if not
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
        
        // Update previous icon for next time
        this.previousIcon = selectedIcon;
        return selectedIcon;
    }

    getRandomColor() {
        // Check if CONFIG is available, use fallback if not
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
        
        // Update previous color for next time
        this.previousColor = selectedColor;
        return selectedColor;
    }

    generateNonOverlappingPositions(count) {
        console.log(`🎲 Generating RANDOM positions for ${count} icons`);
        
        const positions = [];
        const gameArea = this.gameArea.getBoundingClientRect();
        
        // Use CONFIG values if available, otherwise use fallbacks  
        const margin = (typeof CONFIG !== 'undefined' && CONFIG.ICON_MARGIN) ? CONFIG.ICON_MARGIN : 120;
        
        // Calculate adaptive minimum distance: 1.5x icon width
        const iconSize = gameArea.width * 0.084; // Current icon size
        const minDistance = iconSize * 1.5; // 1.5x icon width as minimum distance
        
        console.log(`📏 Using margin: ${margin}, adaptive minDistance: ${Math.round(minDistance)} (1.5x icon size of ${Math.round(iconSize)})`);
        console.log(`📐 Game area size: ${gameArea.width} x ${gameArea.height}`);
        
        // Reduce usable width to 90% of game area (centered)
        const widthReduction = 0.9;
        const fullUsableWidth = gameArea.width - 2 * margin;
        const reducedUsableWidth = fullUsableWidth * widthReduction;
        const horizontalOffset = (fullUsableWidth - reducedUsableWidth) / 2;
        
        // Calculate usable area for positioning
        const usableWidth = reducedUsableWidth;
        const usableHeight = gameArea.height - 2 * margin;
        
        console.log(`📊 Usable area: ${usableWidth} x ${usableHeight}`);
        
        const maxAttempts = 200;
        let totalRandomSuccess = 0;
        let totalFallbackUsed = 0;
        
        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let validPosition = false;
            let x, y;
            
            console.log(`\n🎯 Finding position for icon ${i}`);
            
            while (!validPosition && attempts < maxAttempts) {
                // Generate RANDOM position within reduced usable bounds
                x = margin + horizontalOffset + Math.random() * usableWidth;
                y = margin + Math.random() * usableHeight;
                
                // Check if position is far enough from existing positions using ADAPTIVE distance
                validPosition = true;
                let closestDistance = Infinity;
                
                for (let pos of positions) {
                    const distance = Math.sqrt(
                        Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2)
                    );
                    closestDistance = Math.min(closestDistance, distance);
                    
                    if (distance < minDistance) {
                        validPosition = false;
                        break;
                    }
                }
                
                attempts++;
            }
            
            if (!validPosition) {
                console.log(`❌ FALLBACK: Using grid position for icon ${i} after ${attempts} attempts`);
                const fallbackPos = this.getFallbackPosition(i, count, gameArea, margin, horizontalOffset, usableWidth, usableHeight);
                x = fallbackPos.x;
                y = fallbackPos.y;
                totalFallbackUsed++;
            } else {
                console.log(`✅ SUCCESS: Found random position for icon ${i}: (${Math.round(x)}, ${Math.round(y)}) after ${attempts} attempts`);
                totalRandomSuccess++;
            }
            
            positions.push({ x, y });
        }
        
        console.log(`\n📈 POSITIONING SUMMARY:`);
        console.log(`✅ Random successes: ${totalRandomSuccess}`);
        console.log(`❌ Grid fallbacks used: ${totalFallbackUsed}`);
        console.log(`📊 Fallback percentage: ${Math.round((totalFallbackUsed / count) * 100)}%`);
        
        if (totalFallbackUsed > 0) {
            console.log(`⚠️  REGULAR PATTERNS DETECTED: ${totalFallbackUsed} icons using grid fallback!`);
        } else {
            console.log(`🎉 TRUE RANDOM: All icons positioned randomly - NO PATTERNS!`);
        }
        
        return positions;
    }

    // Grid-based fallback positioning when random fails
    getFallbackPosition(index, totalCount, gameArea, margin, horizontalOffset, usableWidth, usableHeight) {
        // Create a simple grid based on the number of icons
        const cols = Math.ceil(Math.sqrt(totalCount));
        const rows = Math.ceil(totalCount / cols);
        
        const cellWidth = usableWidth / cols;
        const cellHeight = usableHeight / rows;
        
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        // Position icon in center of its grid cell with some randomness
        const cellCenterX = margin + horizontalOffset + col * cellWidth + cellWidth / 2;
        const cellCenterY = margin + row * cellHeight + cellHeight / 2;
        
        // Add small random offset within the cell (but not too close to edges)
        const offsetRange = Math.min(cellWidth, cellHeight) * 0.3;
        const offsetX = (Math.random() - 0.5) * offsetRange;
        const offsetY = (Math.random() - 0.5) * offsetRange;
        
        return {
            x: cellCenterX + offsetX,
            y: cellCenterY + offsetY
        };
    }
        
    renderIcons(count) {
        console.log('🎯 ACTUAL renderIcons() called with count:', count);
        console.log(`🎮 === RENDERING ${count} ICONS WITH RANDOM POSITIONING ===`);
        
        this.clearIcons();
        
        if (!this.gameArea) {
            console.error('❌ Game area not found!');
            return;
        }
        
        console.log('📦 Game area dimensions:', this.gameArea.getBoundingClientRect());
        
        // Choose one icon type and color for all icons in this round (avoiding consecutive repeats)
        const iconClass = this.getRandomIcon();
        const iconColor = this.getRandomColor();
        
        console.log(`🎨 Selected: ${iconClass} in color ${iconColor}`);
        
        // Generate non-overlapping RANDOM positions using adaptive distance algorithm
        console.log('🎲 About to generate RANDOM positions...');
        const positions = this.generateNonOverlappingPositions(count);
        console.log('📍 Generated RANDOM positions:', positions);
        
        // Calculate responsive icon size (8.4% of game area width - 30% smaller than 12%)
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const iconSize = gameAreaRect.width * 0.084;
        
        console.log(`📏 Icon size: ${Math.round(iconSize)}px`);
        
        // Create and position icons using RANDOM positions
        for (let i = 0; i < count; i++) {
            console.log(`🔨 Creating icon ${i} at RANDOM position:`, positions[i]);
            
            const icon = document.createElement('i');
            icon.className = `game-icon ${iconClass}`;
            icon.style.cssText = `
                color: ${iconColor};
                left: ${positions[i].x}px;
                top: ${positions[i].y}px;
                font-size: ${iconSize}px;
                position: absolute;
                z-index: 2;
                pointer-events: none;
                user-select: none;
                animation: fadeIn ${(CONFIG && CONFIG.ICON_FADE_DURATION ? CONFIG.ICON_FADE_DURATION : 500) / 1000}s ease-in;
                animation-delay: ${i * 0.1}s;
                animation-fill-mode: both;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                transition: filter 0.3s ease;
            `;
            
            this.gameArea.appendChild(icon);
            this.currentIcons.push(icon);
            
            console.log(`✅ Icon ${i} created and added to DOM at RANDOM position (${Math.round(positions[i].x)}, ${Math.round(positions[i].y)})`);
        }
        
        console.log(`🎉 Created ${this.currentIcons.length} icons with RANDOM positioning - NO PATTERNS!`);
        
        return count;
    }

    // Helper method to get current icon count (for verification)
    getCurrentCount() {
        return this.currentIcons.length;
    }

    // Reset method to clear previous choices (useful for new games)
    reset() {
        this.previousIcon = null;
        this.previousColor = null;
        this.clearIcons();
    }
    
    // Add jiggle animation to all icons (for hints)
    jiggleIcons() {
        this.currentIcons.forEach(icon => {
            icon.style.animation = 'iconJiggle 0.5s ease-in-out';
            
            // Remove animation class after animation completes
            setTimeout(() => {
                icon.style.animation = '';
            }, 500);
        });
    }
    
    // Highlight icons with a glow effect
    highlightIcons() {
        this.currentIcons.forEach((icon, index) => {
            setTimeout(() => {
                icon.style.filter = 'drop-shadow(0 0 10px #ffd700)';
                
                // Remove highlight after 2 seconds
                setTimeout(() => {
                    icon.style.filter = '';
                }, 2000);
            }, index * 100); // Stagger the highlighting
        });
    }
    
    // Destroy the icon renderer and clean up resources
    destroy() {
        this.reset();
        
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
        
        // Clean up resize observer
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        
        // Remove from ButtonBar observers
        if (window.ButtonBar) {
            window.ButtonBar.removeObserver(this.handleResize);
        }
        
        // Remove window resize listener (fallback)
        window.removeEventListener('resize', this.handleResize);
    }
}
