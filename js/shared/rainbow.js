console.log('🌈 LOADING RESPONSIVE RAINBOW FILE - Simple SVG arc approach');

class Rainbow {
    constructor() {
        console.log('Rainbow constructor - simple SVG arcs with stroke thickness');
        this.container = document.getElementById('rainbowContainer');
        this.gameArea = document.querySelector('.game-area');
        this.pieces = 0;
        this.totalPieces = 10;
        this.arcs = [];
        
        // Responsive configuration
        this.config = {
            // Largest arc radius: 42% of game area width
            maxRadiusPercent: 42,
            // Center 3% of game area width from the bottom
            centerFromBottomPercent: 3,
            // Arc thickness: 2% of game area width
            thicknessPercent: 2,
            // Default transparency for arcs (30% opaque = 0.3 opacity)
            defaultOpacity: 0.3,
            // Celebration opacity (75% opaque = 0.75 opacity)
            celebrationOpacity: 0.75,
            // Arc coverage: 150 degrees (75 degrees each side of north)
            arcDegrees: 150,
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
        
        // Clear and recreate all arcs with new dimensions
        this.initializeArcs();
    }
    
    createArcPath(centerX, centerY, radius, startAngle, endAngle) {
        // Convert angles to radians - adjusting for SVG coordinate system
        // In SVG, 0° is at 3 o'clock, we want our arc from about 10:30 to 1:30
        const startRad = ((startAngle - 90) * Math.PI) / 180; // Subtract 90 to start from top
        const endRad = ((endAngle - 90) * Math.PI) / 180;
        
        // Calculate start and end points
        const startX = centerX + radius * Math.cos(startRad);
        const startY = centerY + radius * Math.sin(startRad);
        const endX = centerX + radius * Math.cos(endRad);
        const endY = centerY + radius * Math.sin(endRad);
        
        // Create arc path - use sweep flag for clockwise direction
        const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
        
        const pathData = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
        
        console.log(`🌈 Arc path: start(${Math.round(startX)},${Math.round(startY)}) end(${Math.round(endX)},${Math.round(endY)}) radius=${radius}`);
        console.log(`🌈 Path data: ${pathData}`);
        
        return pathData;
    }
    
    initializeArcs() {
        if (!this.container || !this.gameArea) {
            console.warn('🌈 Rainbow container or game area not found');
            return;
        }
        
        console.log('🌈 Initializing responsive rainbow arcs with SVG');
        
        // Clear existing arcs
        this.container.innerHTML = '';
        this.arcs = [];
        
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const gameAreaWidth = gameAreaRect.width;
        const gameAreaHeight = gameAreaRect.height;
        
        // Calculate responsive dimensions based on game area width
        const maxRadius = (gameAreaWidth * this.config.maxRadiusPercent) / 100;
        const thickness = (gameAreaWidth * this.config.thicknessPercent) / 100;
        const centerFromBottom = (gameAreaWidth * this.config.centerFromBottomPercent) / 100;
        
        // Calculate fixed center position for all arcs
        const centerX = gameAreaWidth / 2; // Horizontal center
        const centerY = gameAreaHeight - centerFromBottom; // Fixed distance from bottom
        
        // Create SVG container
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.overflow = 'visible';
        svg.style.zIndex = '1'; // Same as rainbow container, below icons (z-index: 2)
        svg.style.border = '2px solid red'; // DEBUG: Add visible border to SVG
        svg.style.background = 'rgba(0,255,0,0.1)'; // DEBUG: Add slight green background
        
        console.log(`🌈 SVG container created with dimensions: ${svg.style.width} x ${svg.style.height}, z-index: ${svg.style.zIndex}`);
        
        // Arc parameters for 150 degrees centered on vertical
        // Starting from -75° from vertical (top) to +75° from vertical
        const startAngle = -75;  // 75 degrees counterclockwise from top
        const endAngle = 75;     // 75 degrees clockwise from top
        
        console.log(`🌈 Game area: ${Math.round(gameAreaWidth)} x ${Math.round(gameAreaHeight)}`);
        console.log(`🌈 Max radius: ${Math.round(maxRadius)} (${this.config.maxRadiusPercent}% of width)`);
        console.log(`🌈 Center X: ${Math.round(centerX)} (horizontal center)`);
        console.log(`🌈 Center Y: ${Math.round(centerY)} (${this.config.centerFromBottomPercent}% of width from bottom)`);
        console.log(`🌈 Arc thickness: ${Math.round(thickness)} (${this.config.thicknessPercent}% of width)`);
        console.log(`🌈 Default opacity: ${this.config.defaultOpacity} (70% transparent)`);
        console.log(`🌈 Arc coverage: ${this.config.arcDegrees} degrees (${startAngle}° to ${endAngle}°)`);
        
        // Create all 10 arcs
        for (let i = 0; i < this.totalPieces; i++) {
            // Calculate radius for this arc (decreasing from outside to inside)
            const radius = maxRadius - (i * thickness) - (thickness / 2); // Center the stroke on the ring
            
            if (radius <= thickness / 2) break; // Stop if radius would be too small
            
            // Create SVG path element
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const pathData = this.createArcPath(centerX, centerY, radius, startAngle, endAngle);
            
            path.setAttribute('d', pathData);
            path.setAttribute('stroke', '#ff0000'); // Test with visible color first
            path.setAttribute('stroke-width', thickness);
            path.setAttribute('stroke-linecap', 'round');
            path.setAttribute('fill', 'none');
            path.style.opacity = this.config.defaultOpacity;
            path.style.transition = 'stroke 1.5s ease-in-out'; // 1.5 second fade-in
            path.style.pointerEvents = 'none';
            
            console.log(`🌈 SVG path created with stroke: ${path.getAttribute('stroke')}, width: ${path.getAttribute('stroke-width')}`);
            console.log(`🌈 Path element:`, path);
            
            // Store the target color for later use
            path.dataset.targetColor = this.config.colors[i];
            path.dataset.arcIndex = i;
            
            svg.appendChild(path);
            this.arcs.push(path);
            
            console.log(`🌈 Created SVG arc ${i}: radius=${Math.round(radius)}, thickness=${Math.round(thickness)}, opacity=${this.config.defaultOpacity}, color=${this.config.colors[i]}`);
            console.log(`🌈 Path added to SVG, total arcs in SVG: ${svg.children.length}`);
        }
        
        this.container.appendChild(svg);
        console.log(`🌈 SVG appended to container. Container:`, this.container);
        console.log(`🌈 Container dimensions:`, this.container.getBoundingClientRect());
        
        // DEBUG: Add a simple test circle to verify SVG is working
        const testCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        testCircle.setAttribute('cx', centerX);
        testCircle.setAttribute('cy', centerY);
        testCircle.setAttribute('r', '20');
        testCircle.setAttribute('fill', 'blue');
        testCircle.setAttribute('stroke', 'yellow');
        testCircle.setAttribute('stroke-width', '3');
        svg.appendChild(testCircle);
        console.log(`🌈 Added test circle at center (${centerX}, ${centerY})`);
        
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
            console.log(`🌈 Setting stroke color for arc ${this.pieces - 1}:`, arc.dataset.targetColor);
            
            // Start the fade-in immediately (no delay)
            arc.setAttribute('stroke', arc.dataset.targetColor);
            console.log(`🌈 Arc stroke set to:`, arc.getAttribute('stroke'));
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
                    arc.style.transform = 'scaleY(1)';
                    arc.style.opacity = `${this.config.defaultOpacity}`; // All back to 30% opacity
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
                arc.style.opacity = `${this.config.celebrationOpacity}`; // 75% opaque during celebration
                
                console.log(`🌈 Celebrating arc ${arcIndex} (${this.config.colors[arcIndex]}) - now at ${this.config.celebrationOpacity} opacity while others stay at ${this.config.defaultOpacity}`);
            }
            
            currentArc++;
            
            // Schedule next arc celebration
            this.celebrationInterval = setTimeout(celebrateNextArc, arcDuration);
        };
        
        // Start the celebration
        setTimeout(celebrateNextArc, 500);
        
        console.log(`🌈 Celebration will run for ${celebrationDuration/1000} seconds with ${arcDuration}ms per arc (${this.arcs.length * arcDuration}ms per full wave = ${(this.arcs.length * arcDuration)/1000}s per wave)`);
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
                arc.style.opacity = `${this.config.defaultOpacity}`; // Reset to 30% opacity
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
