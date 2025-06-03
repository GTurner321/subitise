class IconRenderer {
    constructor() {
        this.gameArea = document.querySelector('.game-area');
        this.currentIcons = [];
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
        return icons[Math.floor(Math.random() * icons.length)];
    }

    getRandomColor() {
        const colors = CONFIG.COLORS;
        return colors[Math.floor(Math.random() * colors.length)];
    }

    generateNonOverlappingPositions(count) {
        const positions = [];
        const gameArea = this.gameArea.getBoundingClientRect();
        const margin = CONFIG.ICON_MARGIN;
        const minDistance = CONFIG.MIN_ICON_DISTANCE;
        
        const maxAttempts = 100; // Prevent infinite loops
        
        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let validPosition = false;
            let x, y;
            
            while (!validPosition && attempts < maxAttempts) {
                // Generate random position within bounds
                x = margin + Math.random() * (gameArea.width - 2 * margin);
                y = margin + Math.random() * (gameArea.height - 2 * margin);
                
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
            
            // If we couldn't find a non-overlapping position, use the last generated one
            positions.push({ x, y });
        }
        
        return positions;
    }

    renderIcons(count) {
        this.clearIcons();
        
        // Choose one icon type and color for all icons in this round
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
}
