class RaisinRenderer {
    constructor() {
        console.log('🍇 RaisinRenderer - Universal Systems Version');
        this.gameArea = document.querySelector('.game-area');
        this.raisins = [];
        this.raisinElements = [];
        this.guineaPig3 = document.getElementById('guineaPig3');
        this.guineaPig2 = document.getElementById('guineaPig2');
        this.guineaPig1 = document.getElementById('guineaPig1');
        
        // Wait for game area to be properly sized by ButtonBar
        this.setupResizeHandling();
        this.setupGuineaPigSizes();
    }
    
    setupResizeHandling() {
        // Listen for ButtonBar dimension updates
        if (window.ButtonBar) {
            window.ButtonBar.addObserver(() => {
                this.setupGuineaPigSizes();
            });
        }
        
        // Also handle window resize
        window.addEventListener('resize', () => {
            setTimeout(() => {
                this.setupGuineaPigSizes();
            }, 100);
        });
    }
    
    setupGuineaPigSizes() {
        if (!this.gameArea) return;
        
        // Get actual game area dimensions (set by ButtonBar)
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const gameAreaWidth = gameAreaRect.width;
        
        // Use game area width for sizing (more consistent than screen width)
        const gp3Size = gameAreaWidth * CONFIG.GUINEA_PIG_3_SIZE;
        const gp2Size = gameAreaWidth * CONFIG.GUINEA_PIG_2_SIZE * 1.2; // 20% larger
        const gp1Size = gameAreaWidth * CONFIG.GUINEA_PIG_1_SIZE * 1.2; // 20% larger
        
        if (this.guineaPig3) {
            this.guineaPig3.style.cssText = `
                width: ${gp3Size}px;
                height: ${gp3Size}px;
            `;
        }
        
        if (this.guineaPig2) {
            this.guineaPig2.style.cssText = `
                width: ${gp2Size}px;
                height: ${gp2Size}px;
            `;
        }
        
        if (this.guineaPig1) {
            this.guineaPig1.style.cssText = `
                width: ${gp1Size}px;
                height: ${gp1Size}px;
            `;
        }
        
        console.log('🐹 Guinea pig sizes updated:', {
            gp3: Math.round(gp3Size),
            gp2: Math.round(gp2Size), 
            gp1: Math.round(gp1Size),
            gameAreaWidth: Math.round(gameAreaWidth)
        });
    }
    
    generateRaisinPositions() {
        if (!this.gameArea) {
            console.error('Game area not found for raisin positioning');
            return [];
        }
        
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const gameAreaWidth = gameAreaRect.width;
        const gameAreaHeight = gameAreaRect.height;
        
        // Calculate raisin size based on game area
        const raisinSize = gameAreaWidth * CONFIG.RAISIN_SIZE;
        const minDistance = gameAreaWidth * CONFIG.RAISIN_MIN_DISTANCE;
        
        // Calculate usable area (excluding guinea pig 3 area - top left)
        const exclusionZone = CONFIG.GUINEA_PIG_3_EXCLUSION;
        const exclusionX = gameAreaWidth * exclusionZone.x;
        const exclusionY = gameAreaHeight * exclusionZone.y;
        const exclusionWidth = gameAreaWidth * exclusionZone.width;
        const exclusionHeight = gameAreaHeight * exclusionZone.height;
        
        // Add margin to prevent raisins from going off-screen
        const margin = raisinSize / 2;
        const usableWidth = gameAreaWidth - (2 * margin);
        const usableHeight = gameAreaHeight - (2 * margin);
        
        const positions = [];
        let attempts = 0;
        const maxAttempts = 2000;
        
        console.log('🍇 Generating raisin positions:', {
            gameAreaSize: `${Math.round(gameAreaWidth)}x${Math.round(gameAreaHeight)}`,
            raisinSize: Math.round(raisinSize),
            minDistance: Math.round(minDistance),
            exclusionZone: {
                x: Math.round(exclusionX),
                y: Math.round(exclusionY),
                width: Math.round(exclusionWidth),
                height: Math.round(exclusionHeight)
            }
        });
        
        // Generate exactly 10 raisin positions with proper overlap detection
        while (positions.length < 10 && attempts < maxAttempts) {
            attempts++;
            
            // Generate random position within usable area (with margin)
            const x = margin + (Math.random() * usableWidth);
            const y = margin + (Math.random() * usableHeight);
            
            // Check if position is in exclusion zone (guinea pig 3 area)
            const inExclusionZone = (
                x < exclusionX + exclusionWidth &&
                x + raisinSize > exclusionX &&
                y < exclusionY + exclusionHeight &&
                y + raisinSize > exclusionY
            );
            
            if (inExclusionZone) {
                continue;
            }
            
            // Check for overlap with existing raisins
            let overlaps = false;
            for (const pos of positions) {
                // Check if rectangles overlap (both x and y dimensions)
                const xOverlap = (x < pos.x + raisinSize && x + raisinSize > pos.x);
                const yOverlap = (y < pos.y + raisinSize && y + raisinSize > pos.y);
                
                if (xOverlap && yOverlap) {
                    overlaps = true;
                    break;
                }
                
                // Also check minimum distance for spacing
                const centerX1 = x + raisinSize / 2;
                const centerY1 = y + raisinSize / 2;
                const centerX2 = pos.x + raisinSize / 2;
                const centerY2 = pos.y + raisinSize / 2;
                const distance = Math.sqrt(Math.pow(centerX1 - centerX2, 2) + Math.pow(centerY1 - centerY2, 2));
                
                if (distance < minDistance) {
                    overlaps = true;
                    break;
                }
            }
            
            if (!overlaps) {
                positions.push({ x, y });
            }
        }
        
        // If we couldn't generate 10 positions, reduce constraints progressively
        if (positions.length < 10) {
            console.warn(`🍇 Only generated ${positions.length} raisin positions, reducing constraints...`);
            const reducedMinDistance = minDistance * 0.5;
            
            while (positions.length < 10 && attempts < maxAttempts + 1000) {
                attempts++;
                
                const x = margin + (Math.random() * usableWidth);
                const y = margin + (Math.random() * usableHeight);
                
                const inExclusionZone = (
                    x < exclusionX + exclusionWidth &&
                    x + raisinSize > exclusionX &&
                    y < exclusionY + exclusionHeight &&
                    y + raisinSize > exclusionY
                );
                
                if (inExclusionZone) {
                    continue;
                }
                
                let overlaps = false;
                for (const pos of positions) {
                    const xOverlap = (x < pos.x + raisinSize && x + raisinSize > pos.x);
                    const yOverlap = (y < pos.y + raisinSize && y + raisinSize > pos.y);
                    
                    if (xOverlap && yOverlap) {
                        overlaps = true;
                        break;
                    }
                    
                    const centerX1 = x + raisinSize / 2;
                    const centerY1 = y + raisinSize / 2;
                    const centerX2 = pos.x + raisinSize / 2;
                    const centerY2 = pos.y + raisinSize / 2;
                    const distance = Math.sqrt(Math.pow(centerX1 - centerX2, 2) + Math.pow(centerY1 - centerY2, 2));
                    
                    if (distance < reducedMinDistance) {
                        overlaps = true;
                        break;
                    }
                }
                
                if (!overlaps) {
                    positions.push({ x, y });
                }
            }
        }
        
        console.log(`🍇 Generated ${positions.length} raisin positions after ${attempts} attempts`);
        
        return positions.map(pos => ({
            x: pos.x,
            y: pos.y,
            size: raisinSize
        }));
    }
    
    async renderRaisinsStaggered() {
        // Clear existing raisins
        this.clearRaisins();
        
        // Generate new positions
        this.raisins = this.generateRaisinPositions();
        
        if (this.raisins.length === 0) {
            console.error('🍇 No raisin positions generated!');
            return;
        }
        
        // Create raisin elements using exactly the 10 different PNG files
        this.raisins.forEach((raisin, index) => {
            const raisinElement = document.createElement('img');
            raisinElement.src = `../../assets/raisin/raisin${index + 1}.png`; // Use raisin1.png through raisin10.png
            raisinElement.className = 'raisin staggered-appear';
            raisinElement.style.cssText = `
                position: absolute;
                left: ${raisin.x}px;
                top: ${raisin.y}px;
                width: ${raisin.size}px;
                height: ${raisin.size}px;
                opacity: 0;
                z-index: 2;
                pointer-events: none;
                transition: all 0.3s ease;
                image-rendering: -webkit-optimize-contrast;
                image-rendering: crisp-edges;
                object-fit: contain;
                filter: brightness(1.3) contrast(0.8);
            `;
            raisinElement.dataset.index = index;
            
            // Calculate staggered appearance timing
            const staggerDelay = CONFIG.RAISIN_STAGGER_START + (Math.random() * CONFIG.RAISIN_STAGGER_WINDOW);
            
            // Add to DOM
            this.gameArea.appendChild(raisinElement);
            this.raisinElements.push(raisinElement);
            
            // Schedule appearance with pat sound
            setTimeout(() => {
                raisinElement.style.opacity = '1';
                raisinElement.style.animation = 'raisinStaggeredAppear 0.5s ease-in forwards';
                
                // Play pat sound with reduced volume using AudioSystem
                this.playPatSound();
            }, staggerDelay);
        });
        
        console.log(`🍇 Created ${this.raisinElements.length} raisin elements`);
    }
    
    clearRaisins() {
        this.raisinElements.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        this.raisinElements = [];
        this.raisins = [];
        console.log('🍇 Cleared all raisins');
    }
    
    hideGuineaPig3() {
        if (this.guineaPig3) {
            this.guineaPig3.classList.add('hidden');
            this.guineaPig3.classList.remove('bounce');
        }
    }
    
    showGuineaPig3() {
        if (this.guineaPig3) {
            this.guineaPig3.classList.remove('hidden');
            this.guineaPig3.classList.add('bounce');
        }
    }
    
    async fadeOutGuineaPig3() {
        return new Promise((resolve) => {
            if (!this.guineaPig3) {
                resolve();
                return;
            }
            
            this.guineaPig3.style.transition = 'opacity 0.5s ease-out';
            this.guineaPig3.style.opacity = '0';
            this.guineaPig3.classList.remove('bounce');
            
            setTimeout(() => {
                this.guineaPig3.classList.add('hidden');
                resolve();
            }, 500);
        });
    }
    
    async fadeInGuineaPig3() {
        return new Promise((resolve) => {
            if (!this.guineaPig3) {
                resolve();
                return;
            }
            
            this.guineaPig3.classList.remove('hidden');
            this.guineaPig3.style.transition = 'opacity 0.5s ease-in';
            this.guineaPig3.style.opacity = '1';
            this.guineaPig3.classList.add('bounce');
            
            setTimeout(() => {
                resolve();
            }, 500);
        });
    }
    
    async moveGuineaPig2(raisinsToEat) {
        return new Promise((resolve) => {
            if (!this.guineaPig2 || !this.gameArea) {
                resolve();
                return;
            }
            
            const gameAreaRect = this.gameArea.getBoundingClientRect();
            const startX = -this.guineaPig2.offsetWidth;
            const endX = gameAreaRect.width;
            
            // Show guinea pig 2
            this.guineaPig2.classList.remove('hidden');
            this.guineaPig2.classList.add('moving');
            this.guineaPig2.style.left = `${startX}px`;
            
            // Start moving
            setTimeout(() => {
                this.guineaPig2.style.left = `${endX}px`;
            }, 100);
            
            // Eat raisins as guinea pig passes over them
            this.eatRaisinsOnPath(this.guineaPig2, raisinsToEat, 'left-to-right');
            
            // Hide guinea pig after animation
            setTimeout(() => {
                this.guineaPig2.classList.add('hidden');
                this.guineaPig2.classList.remove('moving');
                resolve();
            }, CONFIG.GUINEA_PIG_ANIMATION_DURATION);
        });
    }
    
    async moveGuineaPig1(raisinsToEat) {
        return new Promise((resolve) => {
            if (!this.guineaPig1 || !this.gameArea) {
                resolve();
                return;
            }
            
            const gameAreaRect = this.gameArea.getBoundingClientRect();
            
            // Show guinea pig 1 and position it on the right side
            this.guineaPig1.classList.remove('hidden');
            this.guineaPig1.classList.add('moving');
            
            // Reset any previous positioning
            this.guineaPig1.style.left = 'auto';
            this.guineaPig1.style.right = `${-this.guineaPig1.offsetWidth}px`;
            
            // Start moving from right to left
            setTimeout(() => {
                this.guineaPig1.style.right = `${gameAreaRect.width + this.guineaPig1.offsetWidth}px`;
            }, 100);
            
            // Eat raisins as guinea pig passes over them
            this.eatRaisinsOnPath(this.guineaPig1, raisinsToEat, 'right-to-left');
            
            // Hide guinea pig after animation
            setTimeout(() => {
                this.guineaPig1.classList.add('hidden');
                this.guineaPig1.classList.remove('moving');
                // Reset position for next time
                this.guineaPig1.style.right = '-25%';
                this.guineaPig1.style.left = 'auto';
                resolve();
            }, CONFIG.GUINEA_PIG_ANIMATION_DURATION);
        });
    }
    
    eatRaisinsOnPath(guineaPig, raisinsToEat, direction) {
        if (!guineaPig || !this.gameArea) return;
        
        const animationDuration = CONFIG.GUINEA_PIG_ANIMATION_DURATION;
        const checkInterval = 20; // Check every 20ms for smoother detection
        const totalChecks = animationDuration / checkInterval;
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        
        let currentCheck = 0;
        const checkEating = setInterval(() => {
            currentCheck++;
            
            // Get current guinea pig position
            const guineaPigRect = guineaPig.getBoundingClientRect();
            
            // Determine which edge of the guinea pig to use for detection
            let triggerX;
            if (direction === 'left-to-right') {
                triggerX = guineaPigRect.right; // Right edge for left-to-right movement
            } else {
                triggerX = guineaPigRect.left; // Left edge for right-to-left movement
            }
            
            // Check each raisin that should be eaten
            raisinsToEat.forEach(raisinIndex => {
                const raisinElement = this.raisinElements[raisinIndex];
                if (raisinElement && !raisinElement.classList.contains('eaten')) {
                    const raisinRect = raisinElement.getBoundingClientRect();
                    
                    // Determine if this raisin is in the correct half for this guinea pig
                    const raisinCenterY = raisinRect.top + raisinRect.height / 2;
                    const gameAreaTop = gameAreaRect.top;
                    const gameAreaHeight = gameAreaRect.height;
                    const raisinGameAreaY = (raisinCenterY - gameAreaTop) / gameAreaHeight;
                    
                    let shouldEat = false;
                    
                    if (direction === 'left-to-right') {
                        // First guinea pig eats raisins in top half (0% to 50%)
                        if (raisinGameAreaY <= 0.5) {
                            // Check if guinea pig's right edge has passed raisin's center
                            const raisinCenterX = raisinRect.left + raisinRect.width / 2;
                            if (triggerX >= raisinCenterX) {
                                shouldEat = true;
                            }
                        }
                    } else {
                        // Second guinea pig eats raisins in bottom half (50% to 100%)
                        if (raisinGameAreaY > 0.5) {
                            // Check if guinea pig's left edge has passed raisin's center
                            const raisinCenterX = raisinRect.left + raisinRect.width / 2;
                            if (triggerX <= raisinCenterX) {
                                shouldEat = true;
                            }
                        }
                    }
                    
                    if (shouldEat) {
                        this.eatRaisin(raisinIndex);
                    }
                }
            });
            
            // Stop checking when animation is complete
            if (currentCheck >= totalChecks) {
                clearInterval(checkEating);
            }
        }, checkInterval);
    }
    
    eatRaisin(raisinIndex) {
        const raisinElement = this.raisinElements[raisinIndex];
        if (raisinElement && !raisinElement.classList.contains('eaten')) {
            raisinElement.classList.add('eaten');
            
            // Use requestAnimationFrame for smoother removal to reduce lag
            requestAnimationFrame(() => {
                setTimeout(() => {
                    if (raisinElement.parentNode) {
                        raisinElement.parentNode.removeChild(raisinElement);
                    }
                }, 800);
            });
        }
    }
    
    playPatSound() {
        // Use AudioSystem for pat sound with reduced complexity to minimize lag
        if (window.AudioSystem) {
            window.AudioSystem.playTone(800, 0.08, 'sine', 0.05); // Reduced volume and duration
        }
    }
    
    reset() {
        console.log('🍇 Resetting raisin renderer');
        
        this.clearRaisins();
        
        if (this.guineaPig2) {
            this.guineaPig2.classList.add('hidden');
        }
        
        if (this.guineaPig1) {
            this.guineaPig1.classList.add('hidden');
        }
        
        // Reset guinea pig 3 to initial state
        if (this.guineaPig3) {
            this.guineaPig3.style.opacity = '1';
            this.guineaPig3.style.transition = '';
            this.showGuineaPig3();
        }
        
        // Reset guinea pig positions properly
        if (this.guineaPig2) {
            this.guineaPig2.style.left = '-25%';
            this.guineaPig2.style.right = 'auto';
        }
        
        if (this.guineaPig1) {
            this.guineaPig1.style.right = '-25%';
            this.guineaPig1.style.left = 'auto';
        }
        
        // Clear any remaining nom effects
        const nomEffects = this.gameArea.querySelectorAll('.nom-effect');
        nomEffects.forEach(effect => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        });
    }
    
    getRemainingRaisins() {
        return this.raisinElements.filter(element => 
            !element.classList.contains('eaten') && element.parentNode
        ).length;
    }
    
    destroy() {
        // Clean up resize observer
        if (window.ButtonBar) {
            window.ButtonBar.removeObserver(this.setupGuineaPigSizes);
        }
        
        window.removeEventListener('resize', this.setupGuineaPigSizes);
        
        this.reset();
    }
}
