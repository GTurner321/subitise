console.log('🌈 LOADING RESPONSIVE RAINBOW FILE');

class Rainbow {
    constructor() {
        console.log('Rainbow constructor - responsive sizing');
        this.container = document.getElementById('rainbowContainer');
        this.gameArea = document.querySelector('.game-area');
        this.pieces = 0;
        this.totalPieces = 10;
        this.arcs = [];
        
        // Responsive configuration
        this.config = {
            // Largest arc radius: 42% of game area width
            maxRadiusPercent: 42,
            // Center horizontally, 3% from top
            centerYPercent: 3,
            // Arc thickness as percentage of radius
            thicknessPercent: 8,
            // Colors for the rainbow arcs
            colors: [
                '#ff0000', // Red (outermost)
                '#ff8000', // Orange  
                '#ffff00', // Yellow
                '#80ff00', // Yellow-Green
                '#00ff00', // Green
                '#00ff80', // Green-Cyan
                '#00ffff', // Cyan
                '#0080ff', // Blue-Cyan
                '#0000ff', // Blue
                '#8000ff'  // Purple (innermost)
            ]
        };
        
        // Track resize observer for responsive behavior
        this.resizeObserver = null;
        this.setupResizeHandling();
        
        this.initializeArcs();
    }
    
    setupResizeHandling() {
        // Use ResizeObserver for efficient resize tracking
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                this.handleResize();
            });
            
            if (this.gameArea) {
                this.resizeObserver.observe(this.gameArea);
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
            this.updateArcDimensions();
        }, 100);
    }
    
    updateArcDimensions() {
        if (!this.gameArea || !this.container) return;
        
        console.log('🌈 Updating rainbow dimensions for responsive behavior');
        
        // Recalculate all arc dimensions
        this.arcs.forEach((arc, index) => {
            if (arc) {
                this.updateSingleArcDimensions(arc, index);
            }
        });
    }
    
    updateSingleArcDimensions(arc, index) {
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const gameAreaWidth = gameAreaRect.width;
        const gameAreaHeight = gameAreaRect.height;
        
        // Calculate responsive dimensions
        const maxRadius = (gameAreaWidth * this.config.maxRadiusPercent) / 100;
        const centerY = (gameAreaHeight * this.config.centerYPercent) / 100;
        const thickness = (maxRadius * this.config.thicknessPercent) / 100;
        
        // Calculate radius for this arc (decreasing from outside to inside)
        const radius = maxRadius - (index * thickness);
        
        if (radius <= 0) return; // Skip if radius would be negative
        
        // Position and size the arc
        arc.style.width = `${radius * 2}px`;
        arc.style.height = `${radius}px`;
        arc.style.borderTopWidth = `${thickness}px`;
        arc.style.borderRadius = `${radius}px ${radius}px 0 0`;
        arc.style.left = `50%`;
        arc.style.top = `${centerY}px`;
        arc.style.marginLeft = `-${radius}px`;
        
        console.log(`🌈 Arc ${index}: radius=${Math.round(radius)}, thickness=${Math.round(thickness)}, centerY=${Math.round(centerY)}`);
    }
    
    initializeArcs() {
        if (!this.container || !this.gameArea) {
            console.warn('🌈 Rainbow container or game area not found');
            return;
        }
        
        console.log('🌈 Initializing responsive rainbow arcs');
        
        // Clear existing arcs
        this.container.innerHTML = '';
        this.arcs = [];
        
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const gameAreaWidth = gameAreaRect.width;
        const gameAreaHeight = gameAreaRect.height;
        
        // Calculate responsive dimensions
        const maxRadius = (gameAreaWidth * this.config.maxRadiusPercent) / 100;
        const centerY = (gameAreaHeight * this.config.centerYPercent) / 100;
        const thickness = (maxRadius * this.config.thicknessPercent) / 100;
        
        console.log(`🌈 Game area: ${Math.round(gameAreaWidth)} x ${Math.round(gameAreaHeight)}`);
        console.log(`🌈 Max radius: ${Math.round(maxRadius)} (${this.config.maxRadiusPercent}% of width)`);
        console.log(`🌈 Center Y: ${Math.round(centerY)} (${this.config.centerYPercent}% of height)`);
        console.log(`🌈 Arc thickness: ${Math.round(thickness)} (${this.config.thicknessPercent}% of radius)`);
        
        // Create all 10 arcs
        for (let i = 0; i < this.totalPieces; i++) {
            const arc = document.createElement('div');
            arc.className = 'rainbow-arc';
            
            // Calculate radius for this arc (decreasing from outside to inside)
            const radius = maxRadius - (i * thickness);
            
            if (radius <= 0) break; // Stop if radius would be negative
            
            // Set arc properties
            arc.style.position = 'absolute';
            arc.style.width = `${radius * 2}px`;
            arc.style.height = `${radius}px`;
            arc.style.borderTopWidth = `${thickness}px`;
            arc.style.borderTopColor = this.config.colors[i];
            arc.style.borderRadius = `${radius}px ${radius}px 0 0`;
            arc.style.left = `50%`;
            arc.style.top = `${centerY}px`;
            arc.style.marginLeft = `-${radius}px`;
            arc.style.opacity = '0';
            arc.style.transform = 'scaleY(0)';
            arc.style.transformOrigin = 'bottom center';
            arc.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            
            this.container.appendChild(arc);
            this.arcs.push(arc);
            
            console.log(`🌈 Created arc ${i}: radius=${Math.round(radius)}, color=${this.config.colors[i]}`);
        }
        
        // Show the pieces that should already be visible
        this.updateVisiblePieces();
    }
    
    addPiece() {
        if (this.pieces >= this.totalPieces) {
            console.log('🌈 Rainbow already complete');
            return this.pieces;
        }
        
        this.pieces++;
        console.log(`🌈 Adding rainbow piece ${this.pieces}/${this.totalPieces}`);
        
        // Show the new piece with animation
        const arc = this.arcs[this.pieces - 1];
        if (arc) {
            // Small delay for dramatic effect
            setTimeout(() => {
                arc.style.opacity = '1';
                arc.style.transform = 'scaleY(1)';
            }, 200);
        }
        
        return this.pieces;
    }
    
    updateVisiblePieces() {
        // Show all pieces that should be visible based on current count
        for (let i = 0; i < this.pieces; i++) {
            const arc = this.arcs[i];
            if (arc) {
                arc.style.opacity = '1';
                arc.style.transform = 'scaleY(1)';
            }
        }
    }
    
    isComplete() {
        const complete = this.pieces >= this.totalPieces;
        if (complete) {
            console.log('🌈 Rainbow is complete!');
        }
        return complete;
    }
    
    reset() {
        console.log('🌈 Resetting rainbow');
        this.pieces = 0;
        
        // Hide all arcs
        this.arcs.forEach(arc => {
            if (arc) {
                arc.style.opacity = '0';
                arc.style.transform = 'scaleY(0)';
            }
        });
    }
    
    // Get current number of pieces (for debugging)
    getPieces() {
        return this.pieces;
    }
    
    // Set specific number of pieces (for testing)
    setPieces(count) {
        this.pieces = Math.max(0, Math.min(count, this.totalPieces));
        this.updateVisiblePieces();
        return this.pieces;
    }
    
    // Destroy the rainbow and clean up resources
    destroy() {
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
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        this.arcs = [];
        this.pieces = 0;
        
        console.log('🌈 Rainbow destroyed and cleaned up');
    }
}
