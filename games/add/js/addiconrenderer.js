console.log('🔍 LOADING ADD ICONRENDERER FILE - Enhanced version with adaptive distance and responsive sizing');

class AddIconRenderer {
    constructor() {
        console.log('AddIconRenderer constructor - using RANDOM positioning with adaptive distance for two-sided layout');
        this.leftSide = document.getElementById('leftSide');
        this.rightSide = document.getElementById('rightSide');
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
            
            if (this.leftSide) {
                this.resizeObserver.observe(this.leftSide);
            }
            if (this.rightSide) {
                this.resizeObserver.observe(this.rightSide);
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
        if (!this.leftSide || !this.rightSide || this.currentIcons.length === 0) return;
        
        const leftRect = this.leftSide.getBoundingClientRect();
        const iconSize = leftRect.width * 0.12; // 12% of side area width - responsive sizing
        
        // Update size for all current icons
        this.currentIcons.forEach(icon => {
            icon.style.fontSize = `${iconSize}px`;
        });
        
        // Find left and right icons separately
        const leftIcons = this.currentIcons.filter(icon => 
            this.leftSide.contains(icon)
        );
        const rightIcons = this.currentIcons.filter(icon => 
            this.rightSide.contains(icon)
        );
        
        // Regenerate positions for each side
        if (leftIcons.length > 0) {
            const leftPositions = this.generateNonOverlappingPositions(leftIcons.length, this.leftSide);
            leftIcons.forEach((icon, index) => {
                if (leftPositions[index]) {
                    icon.style.left = leftPositions[index].x + 'px';
                    icon.style.top = leftPositions[index].y + 'px';
                }
            });
        }
        
        if (rightIcons.length > 0) {
            const rightPositions = this.generateNonOverlappingPositions(rightIcons.length, this.rightSide);
            rightIcons.forEach((icon, index) => {
                if (rightPositions[index]) {
                    icon.style.left = rightPositions[index].x + 'px';
                    icon.style.top = rightPositions[index].y + 'px';
                }
            });
        }
    }

    clearIcons() {
        // Remove all existing icons from both sides
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

    generateNonOverlappingPositions(count, container) {
        console.log(`🎲 Generating RANDOM positions for ${count} icons in ${container.id}`);
        
        const positions = [];
        const containerRect = container.getBoundingClientRect();
        
        // Account for container padding (1% on all sides, 6% bottom for sum row)
        const paddingPercent = 0.01; // 1% padding
        const bottomPaddingPercent = 0.06; // 6% bottom padding for sum row clearance
        
        const horizontalPadding = containerRect.width * paddingPercent;
        const topPadding = containerRect.height * paddingPercent;
        const bottomPadding = containerRect.height * bottomPaddingPercent;
        
        // Additional responsive margin based on container size
        const baseMargin = Math.max(20, containerRect.width * 0.04); // 4% of container width, min 20px
        
        // Calculate adaptive minimum distance: 1.2x icon width
        const iconSize = containerRect.width * 0.12; // 12% of container width
        const minDistance = iconSize * 1.2; // 1.2x icon width as minimum distance
        
        console.log(`📏 Container padding: H:${Math.round(horizontalPadding)}, T:${Math.round(topPadding)}, B:${Math.round(bottomPadding)}`);
        console.log(`📏 Using margin: ${Math.round(baseMargin)}, adaptive minDistance: ${Math.round(minDistance)} (1.2x icon size of ${Math.round(iconSize)})`);
        console.log(`📐 Container size: ${Math.round(containerRect.width)} x ${Math.round(containerRect.height)}`);
        
        // Calculate usable area accounting for both padding and margins
        const totalHorizontalReduction = horizontalPadding * 2 + baseMargin * 2;
        const totalVerticalReduction = topPadding + bottomPadding + baseMargin * 2;
        
        const usableWidth = containerRect.width - totalHorizontalReduction;
        const usableHeight = containerRect.height - totalVerticalReduction;
        
        // Starting position accounts for left padding and margin
        const startX = horizontalPadding + baseMargin;
        const startY = topPadding + baseMargin;
        
        console.log(`📊 Usable area: ${Math.round(usableWidth)} x ${Math.round(usableHeight)}`);
        console.log(`📍 Start position: (${Math.round(startX)}, ${Math.round(startY)})`);
        
        const maxAttempts = 200;
        let totalRandomSuccess = 0;
        let totalFallbackUsed = 0;
        
        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let validPosition = false;
            let x, y;
            
            console.log(`\n🎯 Finding position for icon ${i} in ${container.id}`);
            
            while (!validPosition && attempts < maxAttempts) {
                // Generate RANDOM position within usable bounds
                x = startX + Math.random() * usableWidth;
                y = startY + Math.random() * usableHeight;
                
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
                const fallbackPos = this.getFallbackPosition(i, count, containerRect, startX, startY, usableWidth, usableHeight);
                x = fallbackPos.x;
                y = fallbackPos.y;
                totalFallbackUsed++;
            } else {
                console.log(`✅ SUCCESS: Found random position for icon ${i}: (${Math.round(x)}, ${Math.round(y)}) after ${attempts} attempts`);
                totalRandomSuccess++;
            }
            
            positions.push({ x, y });
        }
        
        console.log(`\n📈 POSITIONING SUMMARY for ${container.id}:`);
        console.log(`✅ Random successes: ${totalRandomSuccess}`);
        console.log(`❌ Grid fallbacks used: ${totalFallbackUsed}`);
        console.log(`📊 Fallback percentage: ${Math.round((totalFallbackUsed / count) * 100)}%`);
        
        return positions;
    }

    // Grid-based fallback positioning when random fails
    getFallbackPosition(index, totalCount, containerRect, startX, startY, usableWidth, usableHeight) {
        // Create a simple grid based on the number of icons
        const cols = Math.ceil(Math.sqrt(totalCount));
        const rows = Math.ceil(totalCount / cols);
        
        const cellWidth = usableWidth / cols;
        const cellHeight = usableHeight / rows;
        
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        // Position icon in center of its grid cell with some randomness
        const cellCenterX = startX + col * cellWidth + cellWidth / 2;
        const cellCenterY = startY + row * cellHeight + cellHeight / 2;
        
        // Add small random offset within the cell (but not too close to edges)
        const offsetRange = Math.min(cellWidth, cellHeight) * 0.3;
        const offsetX = (Math.random() - 0.5) * offsetRange;
        const offsetY = (Math.random() - 0.5) * offsetRange;
        
        return {
            x: cellCenterX + offsetX,
            y: cellCenterY + offsetY
        };
    }

    renderIcons(leftCount, rightCount) {
        console.log('🎯 ACTUAL renderIcons() called with leftCount:', leftCount, 'rightCount:', rightCount);
        console.log(`🎮 === RENDERING ${leftCount} + ${rightCount} ICONS WITH RANDOM POSITIONING ===`);
        
        this.clearIcons();
        
        if (!this.leftSide || !this.rightSide) {
            console.error('❌ Left or right side not found!');
            return;
        }
        
        // Choose one icon type and color for all icons in this round (avoiding consecutive repeats)
        const iconClass = this.getRandomIcon();
        const iconColor = this.getRandomColor();
        
        console.log(`🎨 Selected: ${iconClass} in color ${iconColor}`);
        
        // Generate positions for left side
        let leftPositions = [];
        if (leftCount > 0) {
            console.log('🎲 Generating RANDOM positions for LEFT side...');
            leftPositions = this.generateNonOverlappingPositions(leftCount, this.leftSide);
            console.log('📍 Generated LEFT positions:', leftPositions);
        }
        
        // Generate positions for right side
        let rightPositions = [];
        if (rightCount > 0) {
            console.log('🎲 Generating RANDOM positions for RIGHT side...');
            rightPositions = this.generateNonOverlappingPositions(rightCount, this.rightSide);
            console.log('📍 Generated RIGHT positions:', rightPositions);
        }
        
        // Calculate responsive icon size (12% of side area width)
        const leftRect = this.leftSide.getBoundingClientRect();
        const iconSize = leftRect.width * 0.12;
        
        console.log(`📏 Icon size: ${Math.round(iconSize)}px`);
        
        // Create and position left side icons
        for (let i = 0; i < leftCount; i++) {
            console.log(`🔨 Creating LEFT icon ${i} at RANDOM position:`, leftPositions[i]);
            
            const icon = document.createElement('i');
            icon.className = `game-icon ${iconClass}`;
            icon.style.cssText = `
                color: ${iconColor};
                left: ${leftPositions[i].x}px;
                top: ${leftPositions[i].y}px;
                font-size: ${iconSize}px;
                position: absolute;
                z-index: 5;
                pointer-events: none;
                user-select: none;
                animation: fadeIn 0.5s ease-in;
                animation-delay: ${i * 0.1}s;
                animation-fill-mode: both;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                transition: filter 0.3s ease;
            `;
            
            this.leftSide.appendChild(icon);
            this.currentIcons.push(icon);
            
            console.log(`✅ LEFT Icon ${i} created and added to DOM at RANDOM position (${Math.round(leftPositions[i].x)}, ${Math.round(leftPositions[i].y)})`);
        }
        
        // Create and position right side icons
        for (let i = 0; i < rightCount; i++) {
            console.log(`🔨 Creating RIGHT icon ${i} at RANDOM position:`, rightPositions[i]);
            
            const icon = document.createElement('i');
            icon.className = `game-icon ${iconClass}`;
            icon.style.cssText = `
                color: ${iconColor};
                left: ${rightPositions[i].x}px;
                top: ${rightPositions[i].y}px;
                font-size: ${iconSize}px;
                position: absolute;
                z-index: 5;
                pointer-events: none;
                user-select: none;
                animation: fadeIn 0.5s ease-in;
                animation-delay: ${(leftCount + i) * 0.1}s;
                animation-fill-mode: both;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                transition: filter 0.3s ease;
            `;
            
            this.rightSide.appendChild(icon);
            this.currentIcons.push(icon);
            
            console.log(`✅ RIGHT Icon ${i} created and added to DOM at RANDOM position (${Math.round(rightPositions[i].x)}, ${Math.round(rightPositions[i].y)})`);
        }
        
        console.log(`🎉 Created ${this.currentIcons.length} icons with RANDOM positioning - NO PATTERNS!`);
        
        return { left: leftCount, right: rightCount, total: leftCount + rightCount };
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
