class AddIconRenderer {
    constructor() {
        this.leftSide = document.getElementById('leftSide');
        this.rightSide = document.getElementById('rightSide');
        this.currentIcons = [];
        this.previousIcon = null;
        this.previousColor = null;
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

    generateNonOverlappingPositions(count, container) {
        const positions = [];
        const containerRect = container.getBoundingClientRect();
        const margin = CONFIG.ICON_MARGIN;
        const minDistance = CONFIG.MIN_ICON_DISTANCE;
        
        // Icon size estimation (font-size is 5rem = 80px, but icons can be wider)
        const iconSize = 80; // Approximate icon dimensions
        const iconRadius = iconSize / 2;
        
        // Calculate usable area - account for icon size and sum row
        const sumRowHeight = 120; // Height to reserve for sum row at bottom
        const usableWidth = Math.max(containerRect.width - 2 * margin - iconSize, 100);
        const usableHeight = Math.max(containerRect.height - 2 * margin - sumRowHeight - iconSize, 100);
        
        const maxAttempts = 300; // Increased attempts for better placement
        
        for (let i = 0; i < count; i++) {
            let attempts = 0;
            let validPosition = false;
            let x, y;
            
            while (!validPosition && attempts < maxAttempts) {
                // Generate random position within safe bounds (icon positioned by top-left)
                x = margin + iconRadius + Math.random() * (usableWidth - iconRadius * 2);
                y = margin + iconRadius + Math.random() * (usableHeight - iconRadius * 2);
                
                // Check if position is far enough from existing positions (center-to-center)
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
            
            // Fallback grid positioning if needed
            if (!validPosition) {
                const fallbackPos = this.getFallbackPosition(i, count, containerRect, margin, sumRowHeight, iconRadius);
                x = fallbackPos.x;
                y = fallbackPos.y;
            }
            
            // Convert from center position to top-left position for CSS
            positions.push({ 
                x: x - iconRadius, 
                y: y - iconRadius 
            });
        }
        
        return positions;
    }

    getFallbackPosition(index, totalCount, containerRect, margin, sumRowHeight, iconRadius) {
        const usableWidth = containerRect.width - 2 * margin - iconRadius * 2;
        const usableHeight = containerRect.height - 2 * margin - sumRowHeight - iconRadius * 2;
        
        const cols = Math.ceil(Math.sqrt(totalCount));
        const rows = Math.ceil(totalCount / cols);
        
        const cellWidth = usableWidth / cols;
        const cellHeight = usableHeight / rows;
        
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        // Calculate center of grid cell
        const cellCenterX = margin + iconRadius + col * cellWidth + cellWidth / 2;
        const cellCenterY = margin + iconRadius + row * cellHeight + cellHeight / 2;
        
        // Add small random offset within safe bounds
        const maxOffset = Math.min(cellWidth, cellHeight) * 0.15;
        const offsetX = (Math.random() - 0.5) * maxOffset;
        const offsetY = (Math.random() - 0.5) * maxOffset;
        
        return {
            x: cellCenterX + offsetX,
            y: cellCenterY + offsetY
        };
    }

    renderIcons(leftCount, rightCount) {
        this.clearIcons();
        
        // Choose one icon type and color for all icons in this round
        const iconClass = this.getRandomIcon();
        const iconColor = this.getRandomColor();
        
        console.log(`Rendering ${leftCount} left icons and ${rightCount} right icons`);
        
        // Generate positions for left side (avoiding sum row and middle section)
        if (leftCount > 0) {
            const leftPositions = this.generateNonOverlappingPositions(leftCount, this.leftSide);
            
            // Create and position left side icons
            for (let i = 0; i < leftCount; i++) {
                const icon = document.createElement('i');
                icon.className = `game-icon ${iconClass}`;
                icon.style.color = iconColor;
                icon.style.left = leftPositions[i].x + 'px';
                icon.style.top = leftPositions[i].y + 'px';
                icon.style.position = 'absolute';
                
                this.leftSide.appendChild(icon);
                this.currentIcons.push(icon);
                console.log(`Added left icon at ${leftPositions[i].x}, ${leftPositions[i].y}`);
            }
        }
        
        // Generate positions for right side (avoiding sum row and middle section)
        if (rightCount > 0) {
            const rightPositions = this.generateNonOverlappingPositions(rightCount, this.rightSide);
            
            // Create and position right side icons
            for (let i = 0; i < rightCount; i++) {
                const icon = document.createElement('i');
                icon.className = `game-icon ${iconClass}`;
                icon.style.color = iconColor;
                icon.style.left = rightPositions[i].x + 'px';
                icon.style.top = rightPositions[i].y + 'px';
                icon.style.position = 'absolute';
                
                this.rightSide.appendChild(icon);
                this.currentIcons.push(icon);
                console.log(`Added right icon at ${rightPositions[i].x}, ${rightPositions[i].y}`);
            }
        }
        
        console.log(`Total icons rendered: ${this.currentIcons.length}`);
        return { left: leftCount, right: rightCount, total: leftCount + rightCount };
    }

    getCurrentCount() {
        return this.currentIcons.length;
    }

    reset() {
        this.previousIcon = null;
        this.previousColor = null;
        this.clearIcons();
    }
}
