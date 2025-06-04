class IconRenderer {
    constructor() {
        this.gameArea = document.querySelector('.game-area');
        this.currentIcons = [];
        this.previousIcon = null; // Track previous icon type
        this.previousColor = null; // Track previous color
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
        const icons = CONFIG.ICONS;
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
        const colors = CONFIG.COLORS;
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
        const positions = [];
        const gameArea = this.gameArea.getBoundingClientRect();
        const margin = CONFIG.ICON_MARGIN;
        const minDistance = CONFIG.MIN_ICON_DISTANCE;
        
        // Calculate usable area for positioning
        const usableWidth = gameArea.width - 2 * margin;
        const usableHeight = gameArea.height - 2 * margin;
        
        const maxAttempts = 200; // Increased attempts for better placement
        
        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let validPosition = false;
            let x, y;
            
            while (!validPosition && attempts < maxAttempts) {
                // Generate random position within usable bounds
                x = margin + Math.random() * usableWidth;
                y = margin + Math.random() * usableHeight;
                
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
            
            // If we couldn't find a non-overlapping position after many attempts,
            // use a grid-based fallback to ensure distinct placement
            if (!validPosition) {
                const fallbackPos = this.getFallbackPosition(i, count, gameArea, margin);
                x = fallbackPos.x;
                y = fallbackPos.y;
            }
            
            positions.push({ x, y });
        }
        
        return positions;
    }

    // Fallback grid-based positioning to ensure icons never overlap
    getFallbackPosition(index, totalCount, gameArea, margin) {
        const usableWidth = gameArea.width - 2 * margin;
        const usableHeight = gameArea.height - 2 * margin;
        
        // Create a simple grid based on the number of icons
        const cols = Math.ceil(Math.sqrt(totalCount));
        const rows = Math.ceil(totalCount / cols);
        
        const cellWidth = usableWidth / cols;
        const cellHeight = usableHeight / rows;
        
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        // Position icon in center of its grid cell with some randomness
        const cellCenterX = margin + col * cellWidth + cellWidth / 2;
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
        this.clearIcons();
        
        // Choose one icon type and color for all icons in this round (avoiding consecutive repeats)
        const iconClass = this.getRandomIcon();
        const iconColor = this.getRandomColor();
        
        // Generate non-overlapping positions
        const positions = this.generateNonOverlappingPositions(count);
        
        // Create and position icons
        for (let i = 0; i < count; i++) {
            const icon = document.createElement('i');
            icon.className = `game-icon ${iconClass}`;
            icon.style.color = iconColor;
            icon.style.left = positions[i].x + 'px';
            icon.style.top = positions[i].y + 'px';
            
            this.gameArea.appendChild(icon);
            this.currentIcons.push(icon);
        }
        
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
}
