class Rainbow {
    constructor() {
        this.container = document.getElementById('rainbowContainer');
        this.pieces = 0;
        this.maxPieces = CONFIG.RAINBOW_PIECES;
        this.colors = CONFIG.RAINBOW_COLORS;
        this.arcWidth = 15; // Width of each arc strand
        this.isFlashing = false;
        this.flashInterval = null;
        
        this.initializeArcs();
    }

    initializeArcs() {
        // Clear existing arcs
        this.container.innerHTML = '';
        
        // Calculate the game area width to make rainbow 80% of it
        const gameArea = document.querySelector('.game-area');
        const gameAreaWidth = gameArea ? gameArea.clientWidth : window.innerWidth * 0.8;
        const rainbowWidth = gameAreaWidth * 0.8;
        
        // Create all 10 rainbow arcs (initially hidden)
        // Outermost arc first (largest radius)
        for (let i = 0; i < this.maxPieces; i++) {
            const arc = document.createElement('div');
            arc.className = 'rainbow-arc';
            arc.id = `arc-${i}`;
            
            // Calculate radius for this arc (outermost first)
            const baseRadius = rainbowWidth / 2;
            const radius = baseRadius - (i * this.arcWidth);
            
            // Set arc properties for semi-circle
            arc.style.width = radius * 2 + 'px';
            arc.style.height = radius + 'px';
            arc.style.borderTopWidth = this.arcWidth + 'px';
            arc.style.borderTopColor = this.colors[i];
            arc.style.borderRadius = radius + 'px ' + radius + 'px 0 0';
            arc.style.position = 'absolute';
            arc.style.bottom = '0';
            arc.style.left = '50%';
            arc.style.transform = 'translateX(-50%)';
            arc.style.opacity = '0';
            arc.style.transition = 'opacity 0.5s ease-in-out';
            arc.style.pointerEvents = 'none';
            
            this.container.appendChild(arc);
        }
    }

    addPiece() {
        if (this.pieces < this.maxPieces) {
            const arc = document.getElementById(`arc-${this.pieces}`);
            if (arc) {
                arc.style.opacity = '0.8';
                this.pieces++;
                
                // If rainbow is complete, start flashing
                if (this.pieces >= this.maxPieces) {
                    setTimeout(() => {
                        this.startFlashing();
                    }, 500);
                }
            }
        }
        return this.pieces;
    }

    startFlashing() {
        if (this.isFlashing) return;
        
        this.isFlashing = true;
        let currentFlashIndex = 0;
        
        this.flashInterval = setInterval(() => {
            // Set opacity for all arcs based on wave pattern
            for (let i = 0; i < this.maxPieces; i++) {
                const arc = document.getElementById(`arc-${i}`);
                if (arc) {
                    arc.style.opacity = this.getWaveOpacity(i, currentFlashIndex);
                }
            }
            
            // Move to next arc
            currentFlashIndex = (currentFlashIndex + 1) % this.maxPieces;
        }, 300);
    }

    getWaveOpacity(arcIndex, currentIndex) {
        // Calculate the distance between arcIndex and currentIndex (handling wrap-around)
        let distance = Math.abs(arcIndex - currentIndex);
        let wrapDistance = this.maxPieces - distance;
        distance = Math.min(distance, wrapDistance);
        
        switch (distance) {
            case 0:
                return '1'; // Fully visible (current position)
            case 1:
                return '0.6'; // Semi-transparent (adjacent positions)
            default:
                return '0.2'; // Transparent (all other positions)
        }
    }

    stopFlashing() {
        if (this.flashInterval) {
            clearInterval(this.flashInterval);
            this.flashInterval = null;
        }
        this.isFlashing = false;
        
        // Restore normal opacity for all visible arcs
        for (let i = 0; i < this.pieces; i++) {
            const arc = document.getElementById(`arc-${i}`);
            if (arc) {
                arc.style.opacity = '0.8';
            }
        }
    }

    reset() {
        this.stopFlashing();
        this.pieces = 0;
        
        // Hide all arcs
        for (let i = 0; i < this.maxPieces; i++) {
            const arc = document.getElementById(`arc-${i}`);
            if (arc) {
                arc.style.opacity = '0';
            }
        }
        
        // Reinitialize to handle any screen size changes
        this.initializeArcs();
    }

    isComplete() {
        return this.pieces >= this.maxPieces;
    }

    getPieces() {
        return this.pieces;
    }
}
