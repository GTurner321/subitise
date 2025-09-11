console.log('🌈 LOADING RESPONSIVE RAINBOW FILE - Height-based positioning');

class Rainbow {
    constructor() {
        console.log('Rainbow constructor - height-based positioning with larger arcs');
        this.container = document.getElementById('rainbowContainer');
        this.gameArea = document.querySelector('.game-area');
        this.pieces = 0;
        this.totalPieces = 10;
        this.arcs = [];
        
        // UPDATED: Height-based responsive configuration
        this.config = {
            // CHANGED: Largest arc radius: 70% of game area HEIGHT (increased from 55%)
            maxRadiusPercent: 70,
            // CHANGED: Center 20% of game area HEIGHT from the bottom (was 5% of width)
            centerFromBottomPercent: 20,
            // CHANGED: Arc thickness: 2.5% of game area HEIGHT (was 1.5% of width)
            thicknessPercent: 2.5,
            // Default transparency for arcs (25% opaque = 0.25 opacity)
            defaultOpacity: 0.25,
            // Celebration opacity (65% opaque = 0.65 opacity)
            celebrationOpacity: 0.65,
            // Arc coverage: 160 degrees (80 degrees each side of north)
            arcDegrees: 160,
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
        
        // Clear and recreate all arcs with new dimensions
        this.initializeArcs();
    }
    
    createArcPath(centerX, centerY, radius, startAngle, endAngle, horizontalStretch = 1) {
        // Convert angles to radians - adjusting for SVG coordinate system
        // In SVG, 0° is at 3 o'clock, we want our arc from about 10 o'clock to 2 o'clock
        const startRad = ((startAngle - 90) * Math.PI) / 180; // Subtract 90 to start from top
        const endRad = ((endAngle - 90) * Math.PI) / 180;
        
        // Calculate start and end points with horizontal stretch applied
        const startX = centerX + radius * Math.cos(startRad) * horizontalStretch;
        const startY = centerY + radius * Math.sin(startRad);
        const endX = centerX + radius * Math.cos(endRad) * horizontalStretch;
        const endY = centerY + radius * Math.sin(endRad);
        
        // Create elliptical arc path with different x and y radii for stretching
        const radiusX = radius * horizontalStretch;
        const radiusY = radius;
        const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
        
        const pathData = `M ${startX} ${startY} A ${radiusX} ${radiusY} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
        
        return pathData;
    }
    
    initializeArcs() {
        if (!this.container || !this.gameArea) {
            console.warn('🌈 Rainbow container or game area not found');
            return;
        }
        
        // Clear existing arcs
        this.container.innerHTML = '';
        this.arcs = [];
        
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const gameAreaWidth = gameAreaRect.width;
        const gameAreaHeight = gameAreaRect.height;
        
        // Calculate horizontal stretch factor for narrow screens
        const aspectRatio = gameAreaWidth / gameAreaHeight;
        const targetAspectRatio = 1.4; // 1.4:1 aspect ratio threshold
        let horizontalStretch = 1;
        
        if (aspectRatio < targetAspectRatio) {
            horizontalStretch = aspectRatio / targetAspectRatio;
            console.log('🌈 Applying horizontal stretch factor:', horizontalStretch, 'for aspect ratio:', aspectRatio);
        }
        
        // Calculate responsive dimensions based on game area HEIGHT
        const maxRadius = (gameAreaHeight * this.config.maxRadiusPercent) / 100;
        const thickness = (gameAreaHeight * this.config.thicknessPercent) / 100;
        const centerFromBottom = (gameAreaHeight * this.config.centerFromBottomPercent) / 100;
        
        // Calculate fixed center position for all arcs
        const centerX = gameAreaWidth / 2; // Horizontal center
        const centerY = gameAreaHeight - centerFromBottom; // Height-based bottom offset
        
        console.log('🌈 Rainbow dimensions:', {
            gameAreaWidth,
            gameAreaHeight,
            aspectRatio: aspectRatio.toFixed(2),
            horizontalStretch: horizontalStretch.toFixed(2),
            maxRadius: `${maxRadius}px (${this.config.maxRadiusPercent}% of ${gameAreaHeight}px)`,
            thickness: `${thickness}px (${this.config.thicknessPercent}% of height)`,
            centerFromBottom: `${centerFromBottom}px (${this.config.centerFromBottomPercent}% of height)`,
            centerPosition: { x: centerX, y: centerY }
        });
        
        // Create SVG container
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.overflow = 'visible';
        svg.style.zIndex = '1';
        
        // Arc parameters for 160 degrees centered on vertical (80 degrees each side of north)
        const startAngle = -80;  // 80 degrees counterclockwise from top
        const endAngle = 80;     // 80 degrees clockwise from top
        
        // Create all 10 arcs
        for (let i = 0; i < this.totalPieces; i++) {
            // Calculate radius for this arc (decreasing from outside to inside)
            const radius = maxRadius - (i * thickness) - (thickness / 2);
            
            if (radius <= thickness / 2) break; // Stop if radius would be too small
            
            // Create SVG path element
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const pathData = this.createArcPath(centerX, centerY, radius, startAngle, endAngle, horizontalStretch);
            
            path.setAttribute('d', pathData);
            path.setAttribute('stroke', 'transparent'); // Start transparent
            path.setAttribute('stroke-width', thickness);
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('fill', 'none');
            path.style.opacity = this.config.defaultOpacity;
            path.style.transition = 'stroke 1.5s ease-in-out';
            path.style.pointerEvents = 'none';
            
            // Store the target color for later use
            path.dataset.targetColor = this.config.colors[i];
            path.dataset.arcIndex = i;
            
            svg.appendChild(path);
            this.arcs.push(path);
        }
        
        this.container.appendChild(svg);
        
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
        
        // Show the new piece by fading in over 1.5 seconds
        const arc = this.arcs[this.pieces - 1];
        if (arc) {
            // Start the fade-in immediately (no delay)
            arc.setAttribute('stroke', arc.dataset.targetColor);
        }
        
        return this.pieces;
    }
    
    updateVisiblePieces() {
        // Show all pieces that should be visible based on current count
        for (let i = 0; i < this.pieces; i++) {
            const arc = this.arcs[i];
            if (arc) {
                arc.setAttribute('stroke', arc.dataset.targetColor);
            }
        }
        
        // Ensure remaining pieces are transparent
        for (let i = this.pieces; i < this.arcs.length; i++) {
            const arc = this.arcs[i];
            if (arc) {
                arc.setAttribute('stroke', 'transparent');
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
        console.log('🌈 Starting final rainbow celebration - rotating for 1 minute');
        let currentArc = 0;
        let celebrationStartTime = Date.now();
        const celebrationDuration = 60000; // 1 minute in milliseconds
        const arcDuration = 300; // 300ms per arc
        
        // Store the celebration interval so we can stop it if needed
        this.celebrationInterval = null;
        
        const celebrateNextArc = () => {
            // Check if 1 minute has passed
            if (Date.now() - celebrationStartTime >= celebrationDuration) {
                this.stopCelebration();
                return;
            }
            
            // Reset all arcs to default opacity first
            this.arcs.forEach(arc => {
                if (arc) {
                    arc.style.filter = '';
                    arc.style.opacity = `${this.config.defaultOpacity}`; // All back to 25% opacity
                }
            });
            
            // Handle wrap-around
            if (currentArc >= this.arcs.length) {
                currentArc = 0; // Start over for continuous celebration
            }
            
            // Use the actual arc at the current index (outermost first)
            const arcIndex = currentArc; // Arc 0 = outermost (red), Arc 9 = innermost (purple)
            const arc = this.arcs[arcIndex];
            if (arc) {
                // Make ONLY this arc enhanced with celebration opacity
                arc.style.filter = 'brightness(1.3) saturate(1.5)';
                arc.style.opacity = `${this.config.celebrationOpacity}`; // 65% opaque during celebration
            }
            
            currentArc++;
            
            // Schedule next arc celebration
            this.celebrationInterval = setTimeout(celebrateNextArc, arcDuration);
        };
        
        // Start the celebration
        setTimeout(celebrateNextArc, 500);
    }
    
    stopCelebration() {
        console.log('🌈 Stopping rainbow celebration');
        
        // Clear any pending celebration timeout
        if (this.celebrationInterval) {
            clearTimeout(this.celebrationInterval);
            this.celebrationInterval = null;
        }
        
        // Reset all arcs to normal state
        this.arcs.forEach(arc => {
            if (arc) {
                arc.style.filter = '';
                arc.style.opacity = `${this.config.defaultOpacity}`;
            }
        });
        
        console.log('🌈 Celebration stopped - all arcs back to normal opacity');
    }
    
    reset() {
        console.log('🌈 Resetting rainbow');
        
        // Stop any ongoing celebration
        this.stopCelebration();
        
        this.pieces = 0;
        
        // Make all arcs transparent again
        this.arcs.forEach(arc => {
            if (arc) {
                arc.setAttribute('stroke', 'transparent');
                arc.style.filter = '';
                arc.style.opacity = `${this.config.defaultOpacity}`; // Reset to 25% opacity
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
        // Stop any ongoing celebration
        this.stopCelebration();
        
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

// Global export for universal access
window.Rainbow = Rainbow;
console.log('🌈 Rainbow class exported to window.Rainbow - HEIGHT-BASED POSITIONING WITH HORIZONTAL STRETCH');
