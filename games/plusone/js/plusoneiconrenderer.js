class PlusOneIconRenderer {
    constructor() {
        this.leftSide = document.getElementById('leftSide');
        this.rightSide = document.getElementById('rightSide');
        this.currentIcons = [];
        this.previousIcon = null;
        this.previousColor = null;
    }

    clearContent() {
        // Remove all existing icons and numbers from both sides
        this.currentIcons.forEach(icon => {
            if (icon.parentNode) {
                icon.parentNode.removeChild(icon);
            }
        });
        this.currentIcons = [];
        
        // Clear any text content
        this.leftSide.innerHTML = '';
        this.rightSide.innerHTML = '';
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
        
        // Use same margins as AddIconRenderer
        const marginHorizontal = 0.10;
        const marginTop = 0.08;
        const marginBottom = 0.02;
        
        const isLeftSide = container.id === 'leftSide' || container.classList.contains('left-side');
        const marginLeft = isLeftSide ? marginHorizontal : 0.03;
        const marginRight = isLeftSide ? 0.03 : marginHorizontal;
        
        const usableWidth = containerRect.width * (1 - marginLeft - marginRight);
        const usableHeight = (containerRect.height - 120) * (1 - marginTop - marginBottom);
        
        const gridSize = 4;
        const bufferRatio = 0.25;
        
        const cellWidth = usableWidth / gridSize;
        const cellHeight = usableHeight / gridSize;
        
        const iconAreaWidth = cellWidth * (1 - bufferRatio);
        const iconAreaHeight = cellHeight * (1 - bufferRatio);
        
        const startX = containerRect.width * marginLeft;
        const startY = containerRect.height * marginTop;
        
        const allPositions = [];
        for (let i = 0; i < 16; i++) {
            allPositions.push(i);
        }
        
        const shuffled = allPositions.sort(() => Math.random() - 0.5);
        const selectedPositions = shuffled.slice(0, count);
        const occupiedPositions = new Set(selectedPositions);
        
        const positions = selectedPositions.map(gridPos => {
            const row = Math.floor(gridPos / gridSize);
            const col = gridPos % gridSize;
            
            const cellCenterX = startX + (col * cellWidth) + (cellWidth / 2);
            const cellCenterY = startY + (row * cellHeight) + (cellHeight / 2);
            
            const maxOffsetPercent = 0.6;
            const maxOffsetX = iconAreaWidth * maxOffsetPercent / 2;
            const maxOffsetY = iconAreaHeight * maxOffsetPercent / 2;
            
            const offsetX = (Math.random() - 0.5) * 2 * maxOffsetX;
            const offsetY = (Math.random() - 0.5) * 2 * maxOffsetY;
            
            const finalOffsetX = this.constrainOffset(gridPos, offsetX, 'horizontal', occupiedPositions, maxOffsetX);
            const finalOffsetY = this.constrainOffset(gridPos, offsetY, 'vertical', occupiedPositions, maxOffsetY);
            
            const iconSize = 100;
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
            if (offset < 0 && col > 0) {
                adjacentPositions.push(row * gridSize + (col - 1));
            }
            if (offset > 0 && col < gridSize - 1) {
                adjacentPositions.push(row * gridSize + (col + 1));
            }
        } else {
            if (offset < 0 && row > 0) {
                adjacentPositions.push((row - 1) * gridSize + col);
            }
            if (offset > 0 && row < gridSize - 1) {
                adjacentPositions.push((row + 1) * gridSize + col);
            }
        }
        
        const hasOccupiedAdjacent = adjacentPositions.some(pos => occupiedPositions.has(pos));
        
        if (hasOccupiedAdjacent) {
            return offset * 0.3;
        }
        
        return offset;
    }

    renderContent(leftCount, currentLevel) {
        this.clearContent();
        
        if (currentLevel <= 2) {
            // Render icons for levels 1-2
            this.renderIcons(leftCount);
        } else {
            // Render numbers for levels 3+
            this.renderNumbers(leftCount);
        }
        
        return { left: leftCount, right: 1, total: leftCount + 1 };
    }

    renderIcons(leftCount) {
        // Choose one icon type and color for all icons in this round
        const iconClass = this.getRandomIcon();
        const iconColor = this.getRandomColor();
        
        console.log(`Rendering ${leftCount} left icons and 1 right icon`);
        
        // Generate positions for left side
        if (leftCount > 0) {
            const leftPositions = this.generateGridPositions(leftCount, this.leftSide);
            
            for (let i = 0; i < leftCount; i++) {
                const icon = document.createElement('i');
                icon.className = `game-icon ${iconClass}`;
                icon.style.color = iconColor;
                icon.style.left = leftPositions[i].x + 'px';
                icon.style.top = leftPositions[i].y + 'px';
                icon.style.position = 'absolute';
                
                this.leftSide.appendChild(icon);
                this.currentIcons.push(icon);
            }
        }
        
        // Always render one icon on the right side for Plus One
        const rightPositions = this.generateGridPositions(1, this.rightSide);
        const rightIcon = document.createElement('i');
        rightIcon.className = `game-icon ${iconClass}`;
        rightIcon.style.color = iconColor;
        rightIcon.style.left = rightPositions[0].x + 'px';
        rightIcon.style.top = rightPositions[0].y + 'px';
        rightIcon.style.position = 'absolute';
        
        this.rightSide.appendChild(rightIcon);
        this.currentIcons.push(rightIcon);
        
        console.log(`Total icons rendered: ${this.currentIcons.length}`);
    }

    renderNumbers(leftNumber) {
        // Clear sides
        this.leftSide.innerHTML = '';
        this.rightSide.innerHTML = '';
        
        // Render large number on left side
        this.renderLargeNumber(this.leftSide, leftNumber);
        
        // Always render "1" on right side
        this.renderLargeNumber(this.rightSide, 1);
    }

    renderLargeNumber(container, number) {
        // Create number display container
        const numberContainer = document.createElement('div');
        numberContainer.className = 'large-number-display';
        
        // Large number
        const numberElement = document.createElement('div');
        numberElement.className = 'large-number';
        numberElement.textContent = number.toString();
        
        // Text version below
        const textElement = document.createElement('div');
        textElement.className = 'number-text';
        textElement.textContent = CONFIG.getNumberWord(number);
        
        numberContainer.appendChild(numberElement);
        numberContainer.appendChild(textElement);
        container.appendChild(numberContainer);
        
        // Add to current icons array for fade animations
        this.currentIcons.push(numberContainer);
    }

    getCurrentCount() {
        return this.currentIcons.length;
    }

    reset() {
        this.previousIcon = null;
        this.previousColor = null;
        this.clearContent();
    }
}
