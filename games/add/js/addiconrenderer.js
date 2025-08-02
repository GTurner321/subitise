console.log('🔍 LOADING ADD ICONRENDERER FILE - Enhanced version with proper bottom clearance and icon padding');

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
        
        // Regenerate positions for each side with proper sum row clearance
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
        const gameAreaRect = this.leftSide.parentElement.getBoundingClientRect();
        
        // Calculate sum row height dynamically (7vw boxes + 2vh padding + borders + clearance)
        const sumRowHeight = (gameAreaRect.width * 0.07) + (window.innerHeight * 0.02) + 20; // 7vw boxes
        const sumRowClearance = gameAreaRect.height * 0.03; // 3% clearance above sum row
        const totalBottomReduction = sumRowHeight + sumRowClearance;
        
        // Icon size for padding calculation (12% of container width)
        const iconSize = containerRect.width * 0.12;
        
        // Padding: 100% of icon size on all sides
        const iconPadding = iconSize;
        
        console.log(`📏 Icon size: ${Math.round(iconSize)}, padding: ${Math.round(iconPadding)} (100% of icon size)`);
        console.log(`📏 Sum row height: ${Math.round(sumRowHeight)}, clearance: ${Math.round(sumRowClearance)}`);
        console.log(`📏 Total bottom reduction: ${Math.round(totalBottomReduction)}`);
        console.log(`📐 Container size: ${Math.round(containerRect.width)} x ${Math.round(containerRect.height)}`);
        
        // Calculate usable area with icon padding and bottom clearance
        const usableWidth = containerRect.width - (iconPadding * 2); // Left + right padding
        const usableHeight = containerRect.height - iconPadding - totalBottomReduction; // Top padding + bottom clearance
        
        // Starting position accounts for icon padding
        const startX = iconPadding;
        const startY = iconPadding;
        
        // Calculate adaptive minimum distance: 1.2x icon width
        const minDistance = iconSize * 1.2;
        
        console.log(`📏 Adaptive minDistance: ${Math.round(minDistance)} (1.2x icon size)`);
        console.log(`📊 Usable area: ${Math.round(usableWidth)} x ${Math.round(usableHeight)}`);
        console.log(`📍 Start position: (${Math.round(startX)}, ${Math.round(startY)})`);
        
        if (usableHeight <= 0 || usableWidth <= 0) {
            console.warn(`⚠️ Invalid usable area: ${Math.round(usableWidth)} x ${Math.round(usableHeight)}`);
            return [];
        }
        
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
                
                // Check if position is far enough from existing positions
                validPosition = true;
                
                for (let pos of positions) {
                    const distance = Math.sqrt(
                        Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2)
                    );
                    
                    if (distance < minDistance) {
                        validPosition = false;
                        break;
                    }
                }
                
                attempts++;
            }
            
            if (!validPosition) {
                console.log(`❌ FALLBACK: Using grid position for icon ${i} after ${attempts} attempts`);
                const fallbackPos = this.getFallbackPosition(i, count, startX, startY, usableWidth, usableHeight);
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
    getFallbackPosition(index, totalCount, startX, startY, usableWidth, usableHeight) {
        // Create a simple grid based on the number of icons
        const cols = Math.ceil(Math.sqrt(totalCount));
        const rows = Math.ceil(totalCount / cols);
        
        const cellWidth = usableWidth / cols;
        const cellHeight = usableHeight / rows;
        
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        // Position icon in center of its grid cell with random offset
        const cellCenterX = startX + col * cellWidth + cellWidth / 2;
        const cellCenterY = startY + row * cellHeight + cellHeight / 2;
        
        // Add small random offset within the cell (30% of cell size)
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
        
        // Choose one icon type and color for all icons in this round
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

    // Helper method to get current icon count
    getCurrentCount() {
        return this.currentIcons.length;
    }

    // Reset method to clear previous choices
    reset() {
        this.previousIcon = null;
        this.previousColor = null;
        this.clearIcons();
    }
    
    // Add jiggle animation to all icons (for hints)
    jiggleIcons() {
        this.currentIcons.forEach(icon => {
            icon.style.animation = 'iconJiggle 0.5s ease-in-out';
            
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
