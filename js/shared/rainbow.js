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
            // Center 3% of game area width from the bottom
            centerFromBottomPercent: 3,
            // Arc thickness: 3% of game area width
            thicknessPercent: 3,
            // Default transparency for arcs (40% opaque = 0.4 opacity)
            defaultOpacity: 0.4,
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
        
        // Calculate responsive dimensions based on game area width
        const maxRadius = (gameAreaWidth * this.config.maxRadiusPercent) / 100;
        const thickness = (gameAreaWidth * this.config.thicknessPercent) / 100;
        const centerFromBottom = (gameAreaWidth * this.config.centerFromBottomPercent) / 100;
        
        // Calculate outer and inner radius for this arc
        const outerRadius = maxRadius - (index * thickness);
        const innerRadius = outerRadius - thickness;
        
        if (outerRadius <= 0) return; // Skip if radius would be negative
        
        // Position arc center at fixed position from bottom
        const centerX = gameAreaWidth / 2; // Horizontal center
        const centerY = gameAreaHeight - centerFromBottom; // Fixed distance from bottom
        
        const outerArc = arc.querySelector('.outer-arc');
        const innerArc = arc.querySelector('.inner-arc');
        
        if (outerArc && innerArc) {
            // Update outer semicircle
            outerArc.style.width = `${outerRadius * 2}px`;
            outerArc.style.height = `${outerRadius}px`;
            outerArc.style.borderRadius = `${outerRadius}px ${outerRadius}px 0 0`;
            
            // Update inner semicircle (only if we have inner radius > 0)
            if (innerRadius > 0) {
                innerArc.style.width = `${innerRadius * 2}px`;
                innerArc.style.height = `${innerRadius}px`;
                innerArc.style.borderRadius = `${innerRadius}px ${innerRadius}px 0 0`;
                innerArc.style.left = `${(outerRadius - innerRadius)}px`;
                innerArc.style.top = `${(outerRadius - innerRadius)}px`;
                innerArc.style.display = 'block';
            } else {
                innerArc.style.display = 'none';
            }
        }
        
        // Position the main arc container
        arc.style.left = `${centerX - outerRadius}px`;
        arc.style.top = `${centerY - outerRadius}px`;
        arc.style.width = `${outerRadius * 2}px`;
        arc.style.height = `${outerRadius}px`;
        
        console.log(`🌈 Arc ${index}: outerRadius=${Math.round(outerRadius)}, innerRadius=${Math.round(innerRadius)}, thickness=${Math.round(thickness)}, centerX=${Math.round(centerX)}, centerY=${Math.round(centerY)}`);
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
        
        // Calculate responsive dimensions based on game area width
        const maxRadius = (gameAreaWidth * this.config.maxRadiusPercent) / 100;
        const thickness = (gameAreaWidth * this.config.thicknessPercent) / 100;
        const centerFromBottom = (gameAreaWidth * this.config.centerFromBottomPercent) / 100;
        
        // Calculate fixed center position for all arcs
        const centerX = gameAreaWidth / 2; // Horizontal center
        const centerY = gameAreaHeight - centerFromBottom; // Fixed distance from bottom
        
        console.log(`🌈 Game area: ${Math.round(gameAreaWidth)} x ${Math.round(gameAreaHeight)}`);
        console.log(`🌈 Max radius: ${Math.round(maxRadius)} (${this.config.maxRadiusPercent}% of width)`);
        console.log(`🌈 Center X: ${Math.round(centerX)} (horizontal center)`);
        console.log(`🌈 Center Y: ${Math.round(centerY)} (${this.config.centerFromBottomPercent}% of width from bottom)`);
        console.log(`🌈 Arc thickness: ${Math.round(thickness)} (${this.config.thicknessPercent}% of width)`);
        console.log(`🌈 Default opacity: ${this.config.defaultOpacity} (40% transparent)`);
        
        // Create all 10 arcs
        for (let i = 0; i < this.totalPieces; i++) {
            const arcContainer = document.createElement('div');
            arcContainer.className = 'rainbow-arc';
            
            // Calculate outer and inner radius for this arc
            const outerRadius = maxRadius - (i * thickness);
            const innerRadius = outerRadius - thickness;
            
            if (outerRadius <= 0) break; // Stop if radius would be negative
            
            // Create outer semicircle (colored part)
            const outerArc = document.createElement('div');
            outerArc.className = 'outer-arc';
            outerArc.style.position = 'absolute';
            outerArc.style.top = '0';
            outerArc.style.left = '0';
            outerArc.style.width = `${outerRadius * 2}px`;
            outerArc.style.height = `${outerRadius}px`;
            outerArc.style.background = 'transparent'; // Start transparent
            outerArc.style.borderRadius = `${outerRadius}px ${outerRadius}px 0 0`;
            outerArc.style.transition = 'background-color 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            
            // Create inner semicircle (transparent cutout)
            const innerArc = document.createElement('div');
            innerArc.className = 'inner-arc';
            innerArc.style.position = 'absolute';
            innerArc.style.background = 'transparent';
            innerArc.style.transition = 'background-color 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            
            if (innerRadius > 0) {
                innerArc.style.width = `${innerRadius * 2}px`;
                innerArc.style.height = `${innerRadius}px`;
                innerArc.style.borderRadius = `${innerRadius}px ${innerRadius}px 0 0`;
                innerArc.style.left = `${(outerRadius - innerRadius)}px`;
                innerArc.style.top = `${(outerRadius - innerRadius)}px`;
                innerArc.style.display = 'block';
            } else {
                innerArc.style.display = 'none';
            }
            
            // Set up the container
            arcContainer.style.position = 'absolute';
            arcContainer.style.left = `${centerX - outerRadius}px`;
            arcContainer.style.top = `${centerY - outerRadius}px`;
            arcContainer.style.width = `${outerRadius * 2}px`;
            arcContainer.style.height = `${outerRadius}px`;
            arcContainer.style.opacity = `${this.config.defaultOpacity}`;
            arcContainer.style.transform = 'scaleY(1)';
            arcContainer.style.transformOrigin = 'bottom center';
            arcContainer.style.pointerEvents = 'none';
            
            // Store the target color for later use
            arcContainer.dataset.targetColor = this.config.colors[i];
            
            // Append elements
            arcContainer.appendChild(outerArc);
            arcContainer.appendChild(innerArc);
            this.container.appendChild(arcContainer);
            this.arcs.push(arcContainer);
            
            console.log(`🌈 Created transparent arc ${i}: outerRadius=${Math.round(outerRadius)}, innerRadius=${Math.round(innerRadius)}, thickness=${Math.round(thickness)}, opacity=${this.config.defaultOpacity}, color=${this.config.colors[i]}`);
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
            const outerArc = arc.querySelector('.outer-arc');
            const innerArc = arc.querySelector('.inner-arc');
            
            // Small delay for dramatic effect
            setTimeout(() => {
                if (outerArc) {
                    outerArc.style.background = arc.dataset.targetColor;
                }
                if (innerArc) {
                    // Get the background color of the game area or container
                    const gameAreaStyle = window.getComputedStyle(this.gameArea);
                    const backgroundColor = gameAreaStyle.backgroundColor || '#ffffff';
                    innerArc.style.background = backgroundColor;
                }
            }, 200);
        }
        
        return this.pieces;
    }
    
    updateVisiblePieces() {
        // Show all pieces that should be visible based on current count
        for (let i = 0; i < this.pieces; i++) {
            const arc = this.arcs[i];
            if (arc) {
                const outerArc = arc.querySelector('.outer-arc');
                const innerArc = arc.querySelector('.inner-arc');
                
                if (outerArc) {
                    outerArc.style.background = arc.dataset.targetColor;
                }
                if (innerArc) {
                    // Get the background color of the game area or container
                    const gameAreaStyle = window.getComputedStyle(this.gameArea);
                    const backgroundColor = gameAreaStyle.backgroundColor || '#ffffff';
                    innerArc.style.background = backgroundColor;
                }
            }
        }
        
        // Ensure remaining pieces are transparent
        for (let i = this.pieces; i < this.arcs.length; i++) {
            const arc = this.arcs[i];
            if (arc) {
                const outerArc = arc.querySelector('.outer-arc');
                const innerArc = arc.querySelector('.inner-arc');
                
                if (outerArc) {
                    outerArc.style.background = 'transparent';
                }
                if (innerArc) {
                    innerArc.style.background = 'transparent';
                }
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
                    arc.style.opacity = `${this.config.defaultOpacity}`; // All back to 40% opacity
                }
            });
            
            // Handle wrap-around
            if (currentArc >= this.arcs.length) {
                currentArc = 0; // Start over for continuous celebration
            }
            
            const arc = this.arcs[currentArc];
            if (arc) {
                // Make ONLY this arc fully opaque and enhanced
                arc.style.filter = 'brightness(1.3) saturate(1.5)';
                arc.style.transform = 'scaleY(1.1)';
                arc.style.opacity = '1.0'; // Only this arc becomes fully opaque
                
                console.log(`🌈 Celebrating arc ${currentArc} - now fully opaque while others stay at ${this.config.defaultOpacity}`);
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
                arc.style.transform = 'scaleY(1)';
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
                const outerArc = arc.querySelector('.outer-arc');
                const innerArc = arc.querySelector('.inner-arc');
                
                if (outerArc) {
                    outerArc.style.background = 'transparent';
                }
                if (innerArc) {
                    innerArc.style.background = 'transparent';
                }
                
                arc.style.filter = '';
                arc.style.transform = 'scaleY(1)';
                arc.style.opacity = `${this.config.defaultOpacity}`; // Reset to 40% opacity
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
