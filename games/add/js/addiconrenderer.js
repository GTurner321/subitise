console.log('🔍 LOADING SIMPLIFIED ADD ICONRENDERER - Fixed positioning with ButtonBar coordination');

class AddIconRenderer {
    constructor() {
        console.log('AddIconRenderer constructor - using simplified positioning system with ButtonBar coordination');
        this.gameArea = document.querySelector('.game-area');
        this.currentIcons = [];
        this.previousIcon = null;
        this.previousColor = null;
        
        // ButtonBar coordination
        this.buttonBarReady = false;
        this.pendingRender = null;
        
        // Game area boundaries (as percentages of full game area)
        this.boundaries = {
            left: {
                horizontal: { start: 6, end: 40 },   // 6%-40% of game area width
                vertical: { start: 21, end: 94 }     // 21%-94% of game area height
            },
            right: {
                horizontal: { start: 60, end: 94 },  // 60%-94% of game area width  
                vertical: { start: 21, end: 94 }     // 21%-94% of game area height
            }
        };
        
        // Minimum distance between icon centers (12% of game area width)
        this.minDistancePercent = 12;
        
        this.setupButtonBarCoordination();
        this.setupResizeHandling();
    }

    setupButtonBarCoordination() {
        // Register with ButtonBar to be notified of dimension changes
        if (window.ButtonBar) {
            window.ButtonBar.addObserver((dimensionData) => {
                console.log('🎯 ButtonBar dimensions updated, marking as ready');
                this.buttonBarReady = true;
                
                // If we have a pending render, execute it now
                if (this.pendingRender) {
                    console.log('🎮 Executing pending render with proper game area dimensions');
                    const { leftCount, rightCount } = this.pendingRender;
                    this.pendingRender = null;
                    this.renderIcons(leftCount, rightCount);
                } else if (this.currentIcons.length > 0) {
                    // Update existing icon positions
                    this.updateIconSizesAndPositions();
                }
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

    setupResizeHandling() {
        // Simple resize handler
        window.addEventListener('resize', () => {
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }
            this.resizeTimeout = setTimeout(() => {
                if (this.buttonBarReady) {
                    this.updateIconSizesAndPositions();
                }
            }, 100);
        });
    }
    
    updateIconSizesAndPositions() {
        if (!this.gameArea || this.currentIcons.length === 0) return;
        
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const iconSize = gameAreaRect.width * 0.06; // 6% of game area width
        
        // Update size for all current icons
        this.currentIcons.forEach(icon => {
            icon.style.fontSize = `${iconSize}px`;
        });
        
        // Regenerate all positions to maintain proper spacing
        this.repositionExistingIcons();
    }

    repositionExistingIcons() {
        if (this.currentIcons.length === 0) return;
        
        // Count left and right icons
        const leftIcons = this.currentIcons.filter(icon => icon.dataset.side === 'left');
        const rightIcons = this.currentIcons.filter(icon => icon.dataset.side === 'right');
        
        // Generate new positions
        const leftPositions = this.generatePositions(leftIcons.length, 'left');
        const rightPositions = this.generatePositions(rightIcons.length, 'right');
        
        // Apply new positions
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

    generatePositions(count, side) {
        console.log(`🎲 Generating positions for ${count} icons on ${side} side`);
        
        if (count === 0) return [];
        
        const positions = [];
        const boundary = this.boundaries[side];
        const maxAttempts = 100;
        let totalFallbacks = 0;
        
        for (let i = 0; i < count; i++) {
            let validPosition = false;
            let attempts = 0;
            let x, y;
            
            // Try random positioning first
            while (!validPosition && attempts < maxAttempts) {
                // Generate random position within boundary
                x = boundary.horizontal.start + 
                    Math.random() * (boundary.horizontal.end - boundary.horizontal.start);
                y = boundary.vertical.start + 
                    Math.random() * (boundary.vertical.end - boundary.vertical.start);
                
                // Check distance from all existing positions (both sides)
                validPosition = this.isPositionValid(x, y, positions);
                attempts++;
            }
            
            if (!validPosition) {
                console.log(`❌ Using fallback grid position for ${side} icon ${i}`);
                const fallbackPos = this.getFallbackPosition(i, count, side);
                x = fallbackPos.x;
                y = fallbackPos.y;
                totalFallbacks++;
            } else {
                console.log(`✅ Found random position for ${side} icon ${i}: (${x.toFixed(1)}%, ${y.toFixed(1)}%)`);
            }
            
            positions.push({ x, y });
        }
        
        console.log(`📊 ${side} side: ${count - totalFallbacks} random, ${totalFallbacks} fallback positions`);
        return positions;
    }

    isPositionValid(x, y, existingPositions) {
        // Check against all existing positions in this render
        for (let pos of existingPositions) {
            const distance = Math.sqrt(
                Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2)
            );
            
            // Distance is in percentage units, so 12% minimum
            if (distance < this.minDistancePercent) {
                return false;
            }
        }
        
        // Also check against all currently placed icons from both sides
        for (let icon of this.currentIcons) {
            const iconX = parseFloat(icon.style.left);
            const iconY = parseFloat(icon.style.top);
            
            const distance = Math.sqrt(
                Math.pow(x - iconX, 2) + Math.pow(y - iconY, 2)
            );
            
            if (distance < this.minDistancePercent) {
                return false;
            }
        }
        
        return true;
    }

    getFallbackPosition(index, totalCount, side) {
        const boundary = this.boundaries[side];
        
        // Create 4x4 grid within the boundary
        const cols = 4;
        const rows = 4;
        
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
        
        this.clearIcons();
        
        if (!this.gameArea) {
            console.error('❌ Game area not found!');
            return;
        }
        
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
        
        // Generate positions for both sides
        const leftPositions = this.generatePositions(leftCount, 'left');
        const rightPositions = this.generatePositions(rightCount, 'right');
        
        // Calculate icon size (6% of game area width)
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const iconSize = gameAreaRect.width * 0.06;
        
        console.log(`📏 Icon size: ${Math.round(iconSize)}px`);
        
        // Create left side icons
        leftPositions.forEach((pos, index) => {
            const icon = this.createIcon(iconClass, iconColor, iconSize, pos.x, pos.y, 'left', index);
            this.gameArea.appendChild(icon);
            this.currentIcons.push(icon);
        });
        
        // Create right side icons  
        rightPositions.forEach((pos, index) => {
            const icon = this.createIcon(iconClass, iconColor, iconSize, pos.x, pos.y, 'right', leftCount + index);
            this.gameArea.appendChild(icon);
            this.currentIcons.push(icon);
        });
        
        console.log(`🎉 Created ${this.currentIcons.length} icons with simplified positioning`);
        
        return { left: leftCount, right: rightCount, total: leftCount + rightCount };
    }

    createIcon(iconClass, iconColor, iconSize, x, y, side, animationIndex) {
        const icon = document.createElement('i');
        icon.className = `game-icon ${iconClass}`;
        icon.dataset.side = side;
        
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
        
        console.log(`✅ Created ${side} icon at (${x.toFixed(1)}%, ${y.toFixed(1)}%)`);
        
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
            window.ButtonBar.removeObserver(this.updateIconSizesAndPositions);
        }
        
        window.removeEventListener('resize', this.handleResize);
    }
}
