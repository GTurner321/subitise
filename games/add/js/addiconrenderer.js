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
        
        // Reduced margins: 10% left/right, 8% top/bottom (was 15% and 12%)
        const marginHorizontal = 0.10;
        const marginVertical = 0.08;
        
        // Calculate usable area with smaller margins
        const usableWidth = containerRect.width * (1 - 2 * marginHorizontal);
        const usableHeight = (containerRect.height - 120) * (1 - 2 * marginVertical); // Subtract sum row space
        
        // Calculate cell dimensions for 4x4 grid with increased buffers
        const gridSize = 4;
        const bufferRatio = 0.25; // Increased from 0.15 to 0.25 (25% buffer between cells)
        
        // Cell size includes the buffer space
        const cellWidth = usableWidth / gridSize;
        const cellHeight = usableHeight / gridSize;
        
        // Actual icon placement area within each cell (excluding buffer)
        const iconAreaWidth = cellWidth * (1 - bufferRatio);
        const iconAreaHeight = cellHeight * (1 - bufferRatio);
        
        // Calculate starting position with smaller margins
        const startX = containerRect.width * marginHorizontal;
        const startY = containerRect.height * marginVertical;
        
        // Create array of all 16 grid positions (0-15) for 4x4 grid
        const allPositions = [];
        for (let i = 0; i < 16; i++) {
            allPositions.push(i);
        }
        
        // Shuffle and select the required number of positions
        const shuffled = allPositions.sort(() => Math.random() - 0.5);
        const selectedPositions = shuffled.slice(0, count);
        
        // Create a set of occupied positions for quick lookup
        const occupiedPositions = new Set(selectedPositions);
        
        // Convert grid numbers to actual coordinates
        const positions = selectedPositions.map(gridPos => {
            const row = Math.floor(gridPos / gridSize);
            const col = gridPos % gridSize;
            
            // Calculate center of grid cell
            const cellCenterX = startX + (col * cellWidth) + (cellWidth / 2);
            const cellCenterY = startY + (row * cellHeight) + (cellHeight / 2);
            
            // More generous random offset - up to 60% of the icon area
            const maxOffsetPercent = 0.6;
            const maxOffsetX = iconAreaWidth * maxOffsetPercent / 2;
            const maxOffsetY = iconAreaHeight * maxOffsetPercent / 2;
            
            // Generate random offset in any direction
            const offsetX = (Math.random() - 0.5) * 2 * maxOffsetX;
            const offsetY = (Math.random() - 0.5) * 2 * maxOffsetY;
            
            // Check if offset would move icon too close to adjacent occupied cells
            const finalOffsetX = this.constrainOffset(gridPos, offsetX, 'horizontal', occupiedPositions, maxOffsetX);
            const finalOffsetY = this.constrainOffset(gridPos, offsetY, 'vertical', occupiedPositions, maxOffsetY);
            
            // Convert from center position to top-left for CSS positioning
            const iconSize = 100; // 5rem ≈ 80px, but we use 100px for safety
            const iconRadius = iconSize / 2;
            
            return {
                x: cellCenterX + finalOffsetX - iconRadius,
                y: cellCenterY + finalOffsetY - iconRadius
            };
        });
        
        return positions;
    }

    constrainOffset(gridPos, offset, direction, occupiedPositions, maxOffset) {
        const gridSize = 4;
        const row = Math.floor(gridPos / gridSize);
        const col = gridPos % gridSize;
        
        let adjacentPositions = [];
        
        if (direction === 'horizontal') {
            // Check left and right neighbors
            if (offset < 0 && col > 0) { // Moving left
                adjacentPositions.push(row * gridSize + (col - 1));
            }
            if (offset > 0 && col < gridSize - 1) { // Moving right
                adjacentPositions.push(row * gridSize + (col + 1));
            }
        } else { // vertical
            // Check up and down neighbors
            if (offset < 0 && row > 0) { // Moving up
                adjacentPositions.push((row - 1) * gridSize + col);
            }
            if (offset > 0 && row < gridSize - 1) { // Moving down
                adjacentPositions.push((row + 1) * gridSize + col);
            }
        }
        
        // Check if any adjacent positions are occupied
        const hasOccupiedAdjacent = adjacentPositions.some(pos => occupiedPositions.has(pos));
        
        if (hasOccupiedAdjacent) {
            // Reduce offset to prevent icons from getting too close
            return offset * 0.3; // Reduce to 30% of original offset
        }
        
        // If at edge of grid or no occupied adjacent cells, allow full offset
        return offset;
    }

    renderIcons(leftCount, rightCount) {
        this.clearIcons();
        
        // Choose one icon type and color for all icons in this round
        const iconClass = this.getRandomIcon();
        const iconColor = this.getRandomColor();
        
        console.log(`Rendering ${leftCount} left icons and ${rightCount} right icons`);
        
        // Generate positions for left side using 4x4 grid
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
        
        // Generate positions for right side using 4x4 grid
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
