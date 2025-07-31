/**
 * Responsive Icon Renderer
 * Renders icons using percentage-based positioning that adapts to game area dimensions
 */
class IconRenderer {
    constructor() {
        this.gameArea = null;
        this.icons = [];
        this.currentCount = 0;
        
        // Icon sets with different emoji types
        this.iconSets = [
            ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯'], // Animals
            ['🍎', '🍌', '🍊', '🍇', '🍓', '🥝', '🍑', '🍒', '🥭', '🍍'], // Fruits
            ['🚗', '🚕', '🚙', '🚌', '🚎', '🚐', '🛻', '🚚', '🚛', '🚜'], // Vehicles
            ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🏓'], // Sports
            ['🌟', '⭐', '✨', '💫', '🌠', '☀️', '🌙', '🌈', '⚡', '🔥']  // Stars & Effects
        ];
        
        // Predefined positioning patterns for different counts (as percentages of game area)
        this.positionPatterns = {
            1: [
                { x: 50, y: 50 } // Center
            ],
            2: [
                { x: 35, y: 45 },
                { x: 65, y: 55 }
            ],
            3: [
                { x: 50, y: 30 }, // Top center
                { x: 35, y: 65 }, // Bottom left
                { x: 65, y: 65 }  // Bottom right
            ],
            4: [
                { x: 35, y: 35 }, // Top left
                { x: 65, y: 35 }, // Top right
                { x: 35, y: 65 }, // Bottom left
                { x: 65, y: 65 }  // Bottom right
            ],
            5: [
                { x: 50, y: 25 }, // Top center
                { x: 25, y: 45 }, // Left
                { x: 75, y: 45 }, // Right
                { x: 35, y: 70 }, // Bottom left
                { x: 65, y: 70 }  // Bottom right
            ],
            6: [
                { x: 30, y: 30 }, // Top left
                { x: 70, y: 30 }, // Top right
                { x: 20, y: 55 }, // Middle left
                { x: 80, y: 55 }, // Middle right
                { x: 35, y: 75 }, // Bottom left
                { x: 65, y: 75 }  // Bottom right
            ],
            7: [
                { x: 50, y: 20 }, // Top center
                { x: 25, y: 35 }, // Upper left
                { x: 75, y: 35 }, // Upper right
                { x: 15, y: 60 }, // Lower left
                { x: 85, y: 60 }, // Lower right
                { x: 35, y: 80 }, // Bottom left
                { x: 65, y: 80 }  // Bottom right
            ],
            8: [
                { x: 35, y: 25 }, // Top left
                { x: 65, y: 25 }, // Top right
                { x: 20, y: 45 }, // Upper left
                { x: 80, y: 45 }, // Upper right
                { x: 15, y: 65 }, // Lower left
                { x: 85, y: 65 }, // Lower right
                { x: 35, y: 80 }, // Bottom left
                { x: 65, y: 80 }  // Bottom right
            ],
            9: [
                { x: 50, y: 15 }, // Top center
                { x: 25, y: 30 }, // Upper left
                { x: 75, y: 30 }, // Upper right
                { x: 15, y: 50 }, // Middle left
                { x: 85, y: 50 }, // Middle right
                { x: 30, y: 70 }, // Lower left
                { x: 70, y: 70 }, // Lower right
                { x: 40, y: 85 }, // Bottom left
                { x: 60, y: 85 }  // Bottom right
            ],
            10: [
                { x: 40, y: 15 }, // Top left
                { x: 60, y: 15 }, // Top right
                { x: 20, y: 30 }, // Upper left
                { x: 80, y: 30 }, // Upper right
                { x: 15, y: 50 }, // Middle left
                { x: 85, y: 50 }, // Middle right
                { x: 25, y: 70 }, // Lower left
                { x: 75, y: 70 }, // Lower right
                { x: 35, y: 85 }, // Bottom left
                { x: 65, y: 85 }  // Bottom right
            ]
        };
        
        // Track resize observer
        this.resizeObserver = null;
        
        this.initializeGameArea();
        this.setupResizeHandling();
    }
    
    initializeGameArea() {
        this.gameArea = document.querySelector('.game-area');
        if (!this.gameArea) {
            console.error('Game area not found');
            return;
        }
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
            this.updateIconPositions();
            this.updateIconSizes();
        }, 100);
    }
    
    updateIconSizes() {
        if (!this.gameArea || this.icons.length === 0) return;
        
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const gameAreaWidth = gameAreaRect.width;
        
        // Calculate icon size as 12% of game area width
        const iconSize = gameAreaWidth * 0.12;
        
        // Update size for all current icons
        this.icons.forEach(iconData => {
            if (iconData.element) {
                iconData.element.style.fontSize = `${iconSize}px`;
                // Store the size for position calculations
                iconData.size = iconSize;
            }
        });
        
        // Update positions after size change (since centering depends on size)
        this.updateIconPositions();
    }
    
    updateIconPositions() {
        if (!this.gameArea || this.icons.length === 0) return;
        
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const gameAreaWidth = gameAreaRect.width;
        const gameAreaHeight = gameAreaRect.height;
        
        // Update positions for all current icons
        this.icons.forEach((iconData, index) => {
            if (iconData.element && iconData.position) {
                const pixelX = (iconData.position.x / 100) * gameAreaWidth;
                const pixelY = (iconData.position.y / 100) * gameAreaHeight;
                
                // Center the icon on the calculated position using current size
                const iconSize = iconData.size || (gameAreaWidth * 0.12);
                const offsetX = pixelX - (iconSize / 2);
                const offsetY = pixelY - (iconSize / 2);
                
                iconData.element.style.left = `${offsetX}px`;
                iconData.element.style.top = `${offsetY}px`;
            }
        });
    }
    
    /**
     * Render icons for the given count
     * @param {number} count - Number of icons to render
     */
    renderIcons(count) {
        this.clearIcons();
        this.currentCount = count;
        
        if (!this.gameArea) {
            console.error('Game area not available for icon rendering');
            return;
        }
        
        if (count < 1 || count > 10) {
            console.warn('Icon count out of range:', count);
            return;
        }
        
        // Get positions for this count
        const positions = this.positionPatterns[count];
        if (!positions) {
            console.error('No position pattern available for count:', count);
            return;
        }
        
        // Select random icon set
        const iconSet = this.iconSets[Math.floor(Math.random() * this.iconSets.length)];
        
        // Create icons with percentage-based positioning
        for (let i = 0; i < count; i++) {
            const icon = this.createIcon(iconSet[i % iconSet.length], positions[i], i);
            
            // Calculate and store the size for this icon
            const gameAreaRect = this.gameArea.getBoundingClientRect();
            const iconSize = gameAreaRect.width * 0.12;
            
            this.icons.push({
                element: icon,
                position: positions[i],
                index: i,
                size: iconSize
            });
        }
        
        // Initial position update
        setTimeout(() => {
            this.updateIconPositions();
        }, 50); // Small delay to ensure DOM is ready
    }
    
    /**
     * Create a single icon element
     * @param {string} emoji - The emoji to display
     * @param {Object} position - Position as percentage {x, y}
     * @param {number} index - Icon index for animation delay
     */
    createIcon(emoji, position, index) {
        const icon = document.createElement('div');
        icon.className = 'game-icon';
        icon.textContent = emoji;
        
        // Calculate initial size as 12% of game area width
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const iconSize = gameAreaRect.width * 0.12;
        
        // Set initial styles
        icon.style.cssText = `
            position: absolute;
            font-size: ${iconSize}px;
            z-index: 2;
            pointer-events: none;
            user-select: none;
            animation: fadeIn 0.5s ease-in;
            animation-delay: ${index * 0.1}s;
            animation-fill-mode: both;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            transition: filter 0.3s ease;
        `;
        
        // Add to game area
        this.gameArea.appendChild(icon);
        
        return icon;
    }
    
    /**
     * Clear all icons from the game area
     */
    clearIcons() {
        this.icons.forEach(iconData => {
            if (iconData.element && iconData.element.parentNode) {
                iconData.element.parentNode.removeChild(iconData.element);
            }
        });
        this.icons = [];
        this.currentCount = 0;
    }
    
    /**
     * Add jiggle animation to all icons (for hints)
     */
    jiggleIcons() {
        this.icons.forEach(iconData => {
            if (iconData.element) {
                iconData.element.style.animation = 'iconJiggle 0.5s ease-in-out';
                
                // Remove animation class after animation completes
                setTimeout(() => {
                    if (iconData.element) {
                        iconData.element.style.animation = '';
                    }
                }, 500);
            }
        });
    }
    
    /**
     * Highlight icons with a glow effect
     */
    highlightIcons() {
        this.icons.forEach((iconData, index) => {
            if (iconData.element) {
                setTimeout(() => {
                    if (iconData.element) {
                        iconData.element.style.filter = 'drop-shadow(0 0 10px #ffd700)';
                        
                        // Remove highlight after 2 seconds
                        setTimeout(() => {
                            if (iconData.element) {
                                iconData.element.style.filter = '';
                            }
                        }, 2000);
                    }
                }, index * 100); // Stagger the highlighting
            }
        });
    }
    
    /**
     * Get current icon count
     */
    getCurrentCount() {
        return this.currentCount;
    }
    
    /**
     * Get game area dimensions
     */
    getGameAreaDimensions() {
        if (!this.gameArea) return { width: 0, height: 0 };
        
        const rect = this.gameArea.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height
        };
    }
    
    /**
     * Reset the icon renderer
     */
    reset() {
        this.clearIcons();
        
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
    }
    
    /**
     * Destroy the icon renderer and clean up resources
     */
    destroy() {
        this.reset();
        
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
    }
}

// Add CSS for icon jiggle animation
const style = document.createElement('style');
style.textContent = `
    @keyframes iconJiggle {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
        20%, 40%, 60%, 80% { transform: translateX(3px); }
    }
    
    .game-icon {
        transition: filter 0.3s ease;
    }
`;
document.head.appendChild(style);
