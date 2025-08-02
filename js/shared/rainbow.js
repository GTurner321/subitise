console.log('🌈 LOADING RESPONSIVE RAINBOW FILE - Fixed transparency and centering');

class Rainbow {
    constructor() {
        console.log('Rainbow constructor - responsive sizing with proper transparency');
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
            // Arc thickness: 3% of game area width
            thicknessPercent: 3,
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
        const thickness = (gameAreaWidth * this.config.thicknessPercent) / 100;
        
        // Calculate radius for this arc (decreasing from outside to inside)
        const radius = maxRadius - (index * thickness);
        
        if (radius <= 0) return; // Skip if radius would be negative
        
        // Position and size the arc - FIXED: All arcs share the same center X position
        const centerX = gameAreaWidth / 2; // Fixed center position for all arcs
        
        arc.style.width = `${radius * 2}px`;
        arc.style.height = `${radius}px`; // Height is radius for semicircle
        arc.style.borderTopWidth = `${thickness}px`;
        arc.style.borderRadius = `${radius}px ${radius}px 0 0`;
        arc.style.left = `${centerX - radius}px`; // Position so center is at fixed centerX
        arc.style.top = `${centerY}px`;
        
        console.log(`🌈 Arc ${index}: radius=${Math.round(radius)}, thickness=${Math.round(thickness)}, centerX=${Math.round(centerX)}, left=${Math.round(centerX - radius)}`);
    }
    
    initializeArcs() {
        if (!this.container || !this.gameArea) {
            console.warn('🌈 Rainbow container or game area not found');
            return;
        }
        
        console.log('🌈 Initializing responsive rainbow arcs with transparency');
        
        // Clear existing arcs
        this.container.innerHTML = '';
        this.arcs = [];
        
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const gameAreaWidth = gameAreaRect.width;
        const gameAreaHeight = gameAreaRect.height;
        
        // Calculate responsive dimensions
        const maxRadius = (gameAreaWidth * this.config.maxRadiusPercent) / 100;
        const centerY = (gameAreaHeight * this.config.centerYPercent) / 100;
        const thickness = (gameAreaWidth * this.config.thicknessPercent) / 100;
        
        // FIXED: Calculate fixed center position for all arcs
        const centerX = gameAreaWidth / 2;
        
        console.log(`🌈 Game area: ${Math.round(gameAreaWidth)} x ${Math.round(gameAreaHeight)}`);
        console.log(`🌈 Max radius: ${Math.round(maxRadius)} (${this.config.maxRadiusPercent}% of width)`);
        console.log(`🌈 Center Y: ${Math.round(centerY)} (${this.config.centerYPercent}% of height)`);
        console.log(`🌈 Fixed Center X: ${Math.round(centerX)}`);
        console.log(`🌈 Arc thickness: ${Math.round(thickness)} (${this.config.thicknessPercent}% of width)`);
        
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
            arc.style.height = `${radius}px`; // Height is radius for semicircle
            arc.style.borderTopWidth = `${thickness}px`;
            arc.style.borderTopColor = 'transparent'; // Start transparent
            arc.style.borderLeftColor = 'transparent';
            arc.style.borderRightColor = 'transparent';
            arc.style.borderBottomColor = 'transparent';
            arc.style.borderStyle = 'solid';
            arc.style.borderRadius = `${radius}px ${radius}px 0 0`;
            arc.style.left = `${centerX - radius}px`; // FIXED: Position so center is at fixed centerX
            arc.style.top = `${centerY}px`;
            arc.style.background = 'transparent'; // FIXED: Ensure background is transparent
            arc.style.opacity = '1'; // Element is visible but transparent until border color is set
            arc.style.transform = 'scaleY(1)';
            arc.style.transformOrigin = 'bottom center';
            arc.style.transition = 'border-top-color 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            arc.style.pointerEvents = 'none';
            
            // Store the target color for later use
            arc.dataset.targetColor = this.config.colors[i];
            
            this.container.appendChild(arc);
            this.arcs.push(arc);
            
            console.log(`🌈 Created transparent arc ${i}: radius=${Math.round(radius)}, centerX=${Math.round(centerX)}, left=${Math.round(centerX - radius)}, color=${this.config.colors[i]}`);
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
        
        // Show the new piece by changing from transparent to colored
        const arc = this.arcs[this.pieces - 1];
        if (arc) {
            // Small delay for dramatic effect
            setTimeout(() => {
                arc.style.borderTopColor = arc.dataset.targetColor;
            }, 200);
        }
        
        return this.pieces;
    }
    
    updateVisiblePieces() {
        // Show all pieces that should be visible based on current count
        for (let i = 0; i < this.pieces; i++) {
            const arc = this.arcs[i];
            if (arc) {
                arc.style.borderTopColor = arc.dataset.targetColor;
            }
        }
        
        // Ensure remaining pieces are transparent
        for (let i = this.pieces; i < this.arcs.length; i++) {
            const arc = this.arcs[i];
            if (arc) {
                arc.style.borderTopColor = 'transparent';
            }
        }
    }
    
    isComplete() {
        const complete = this.pieces >= this.totalPieces;
        if (complete) {
            console.log('🌈 Rainbow is complete!');
            // Trigger final celebration with rotating colors
            this.startFinalCelebration();
        }
        return complete;
    }
    
    startFinalCelebration() {
        console.log('🌈 Starting final rainbow celebration');
        let currentArc = 0;
        
        const celebrateNextArc = () => {
            if (currentArc >= this.arcs.length) {
                currentArc = 0; // Start over for continuous celebration
            }
            
            const arc = this.arcs[currentArc];
            if (arc) {
                // Temporarily make it extra bright/solid
                arc.style.filter = 'brightness(1.3) saturate(1.5)';
                arc.style.transform = 'scaleY(1.1)';
                
                // Return to normal after 300ms
                setTimeout(() => {
                    arc.style.filter = '';
                    arc.style.transform = 'scaleY(1)';
                }, 300);
            }
            
            currentArc++;
            
            // Continue celebration for a few cycles
            if (currentArc < this.arcs.length * 3) {
                setTimeout(celebrateNextArc, 200);
            }
        };
        
        // Start the celebration
        setTimeout(celebrateNextArc, 500);
    }
    
    reset() {
        console.log('🌈 Resetting rainbow');
        this.pieces = 0;
        
        // Make all arcs transparent again
        this.arcs.forEach(arc => {
            if (arc) {
                arc.style.borderTopColor = 'transparent';
                arc.style.filter = '';
                arc.style.transform = 'scaleY(1)';
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
