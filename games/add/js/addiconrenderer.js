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

    generateGridPositions(count, container) {
        const containerRect = container.getBoundingClientRect();
        
        // Calculate usable area (90% of width and height)
        const usableWidth = containerRect.width * 0.9;
        const usableHeight = (containerRect.height - 120) * 0.9; // Subtract sum row space
        
        // Calculate cell dimensions for 5x5 grid
        const cellWidth = usableWidth / 5;
        const cellHeight = usableHeight / 5;
        
        // Calculate starting position (5% margin)
        const startX = containerRect.width * 0.05;
        const startY = containerRect.height * 0.05;
        
        // Create array of all 25 grid positions (0-24)
        const allPositions = [];
        for (let i = 0; i < 25; i++) {
            allPositions.push(i);
        }
        
        // Shuffle and select the required number of positions
        const shuffled = allPositions.sort(() => Math.random() - 0.5);
        const selectedPositions = shuffled.slice(0, count);
        
        // Convert grid numbers to actual coordinates
        const positions = selectedPositions.map(gridPos => {
            const row = Math.floor(gridPos / 5);
            const col = gridPos % 5;
            
    generateGridPositions(count, container) {
        const containerRect = container.getBoundingClientRect();
        
        // Calculate usable area (90% of width and height)
        const usableWidth = containerRect.width * 0.9;
        const usableHeight = (containerRect.height - 120) * 0.9; // Subtract sum row space
        
        // Calculate cell dimensions for 5x5 grid
        const cellWidth = usableWidth / 5;
        const cellHeight = usableHeight / 5;
        
        // Calculate starting position (5% margin)
        const startX = containerRect.width * 0.05;
        const startY = containerRect.height * 0.05;
        
        // Create array of all 25 grid positions (0-24)
        const allPositions = [];
        for (let i = 0; i < 25; i++) {
            allPositions.push(i);
        }
        
        // Shuffle and select the required number of positions
        const shuffled = allPositions.sort(() => Math.random() - 0.5);
        const selectedPositions = shuffled.slice(0, count);
        
        // Create a set of occupied positions for quick lookup
        const occupiedPositions = new Set(selectedPositions);
        
        // Convert grid numbers to actual coordinates
        const positions = selectedPositions.map(gridPos => {
            const row = Math.floor(gridPos / 5);
            const col = gridPos % 5;
            
            // Calculate center of grid cell
            const centerX = startX + (col * cellWidth) + (cellWidth / 2);
            const centerY = startY + (row * cellHeight) + (cellHeight / 2);
            
            // Choose random offset magnitude (10%, 20%, 30%, or 40%)
            const offsetMagnitudes = [0.1, 0.2, 0.3, 0.4];
            const offsetPercent = offsetMagnitudes[Math.floor(Math.random() * offsetMagnitudes.length)];
            
            // Calculate actual offset distances
            const maxOffsetX = cellWidth * offsetPercent;
            const maxOffsetY = cellHeight * offsetPercent;
            
            // Try to apply random offset, checking adjacent cells
            let finalOffsetX = 0;
            let finalOffsetY = 0;
            
            // Generate random offset direction
            const offsetX = (Math.random() - 0.5) * maxOffsetX;
            const offsetY = (Math.random() - 0.5) * maxOffsetY;
            
            // Check if this offset would bring us closer to an occupied adjacent cell
            const canOffsetX = this.canOffsetInDirection(gridPos, offsetX > 0 ? 'right' : 'left', occupiedPositions);
            const canOffsetY = this.canOffsetInDirection(gridPos, offsetY > 0 ? 'down' : 'up', occupiedPositions);
            
            // Apply offsets only if safe
            if (canOffsetX) {
                finalOffsetX = offsetX;
            }
            if (canOffsetY) {
                finalOffsetY = offsetY;
            }
            
            // Convert from center position to top-left for CSS positioning
            const iconSize = 100; // 5rem ≈ 80px, but we use 100px for safety
            const iconRadius = iconSize / 2;
            
            return {
                x: centerX + finalOffsetX - iconRadius,
                y: centerY + finalOffsetY - iconRadius
            };
        });
        
        return positions;
    }

    canOffsetInDirection(gridPos, direction, occupiedPositions) {
        const row = Math.floor(gridPos / 5);
        const col = gridPos % 5;
        
        let adjacentPos;
        
        switch (direction) {
            case 'left':
                if (col === 0) return true; // Edge of grid, safe to offset
                adjacentPos = row * 5 + (col - 1);
                break;
            case 'right':
                if (col === 4) return true; // Edge of grid, safe to offset
                adjacentPos = row * 5 + (col + 1);
                break;
            case 'up':
                if (row === 0) return true; // Edge of grid, safe to offset
                adjacentPos = (row - 1) * 5 + col;
                break;
            case 'down':
                if (row === 4) return true; // Edge of grid, safe to offset
                adjacentPos = (row + 1) * 5 + col;
                break;
            default:
                return false;
        }
        
        // Return true if adjacent cell is empty (safe to offset toward it)
        return !occupiedPositions.has(adjacentPos);
    }
        });
        
        return positions;
    }

    renderIcons(leftCount, rightCount) {
        this.clearIcons();
        
        // Choose one icon type and color for all icons in this round
        const iconClass = this.getRandomIcon();
        const iconColor = this.getRandomColor();
        
        console.log(`Rendering ${leftCount} left icons and ${rightCount} right icons`);
        
        // Generate positions for left side using 5x5 grid
        if (leftCount > 0) {
            const leftPositions = this.generateGridPositions(leftCount, this.leftSide);
            
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
                console.log(`Added left icon at grid position, final: ${leftPositions[i].x}, ${leftPositions[i].y}`);
            }
        }
        
        // Generate positions for right side using 5x5 grid
        if (rightCount > 0) {
            const rightPositions = this.generateGridPositions(rightCount, this.rightSide);
            
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
                console.log(`Added right icon at grid position, final: ${rightPositions[i].x}, ${rightPositions[i].y}`);
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
