class Rainbow {
    constructor() {
        this.container = document.getElementById('rainbowContainer');
        this.pieces = 0;
        this.maxPieces = CONFIG.RAINBOW_PIECES;
        this.arcDegrees = CONFIG.RAINBOW_ARC_DEGREES;
        this.colors = CONFIG.RAINBOW_COLORS;
        
        this.initializeArcs();
    }

    initializeArcs() {
        // Clear existing arcs
        this.container.innerHTML = '';
        
        // Create all 10 rainbow arcs (initially hidden)
        for (let i = 0; i < this.maxPieces; i++) {
            const arc = document.createElement('div');
            arc.className = 'rainbow-arc';
            arc.id = `arc-${i}`;
            
            // Calculate rotation for this arc
            const rotation = i * this.arcDegrees - 90; // Start from left (-90 degrees)
            
            // Set arc properties
            arc.style.width = '100%';
            arc.style.height = '100%';
            arc.style.borderTopWidth = '20px';
            arc.style.borderTopColor = this.colors[i];
            arc.style.transform = `rotate(${rotation}deg)`;
            arc.style.opacity = '0';
            arc.style.transition = 'opacity 0.5s ease-in-out';
            
            this.container.appendChild(arc);
        }
    }

    addPiece() {
        if (this.pieces < this.maxPieces) {
            const arc = document.getElementById(`arc-${this.pieces}`);
            if (arc) {
                arc.style.opacity = '0.6';
                this.pieces++;
            }
        }
        return this.pieces;
    }

    reset() {
        this.pieces = 0;
        // Hide all arcs
        for (let i = 0; i < this.maxPieces; i++) {
            const arc = document.getElementById(`arc-${i}`);
            if (arc) {
                arc.style.opacity = '0';
            }
        }
    }

    isComplete() {
        return this.pieces >= this.maxPieces;
    }

    getPieces() {
        return this.pieces;
    }
}
