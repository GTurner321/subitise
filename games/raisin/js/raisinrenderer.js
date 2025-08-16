class RaisinRenderer {
    constructor() {
        console.log('🍇 RaisinRenderer - Universal Systems Version');
        this.gameArea = document.querySelector('.game-area');
        this.raisins = [];
        this.raisinElements = [];
        this.guineaPig3 = document.getElementById('guineaPig3');
        this.guineaPig2 = document.getElementById('guineaPig2');
        this.guineaPig1 = document.getElementById('guineaPig1');
        
        // Debug: Log initial state of guinea pig elements
        console.log('🐹 Guinea pig elements found:', {
            gp3: !!this.guineaPig3,
            gp2: !!this.guineaPig2,
            gp1: !!this.guineaPig1,
            gp3Element: this.guineaPig3,
            gp2Element: this.guineaPig2,
            gp1Element: this.guineaPig1
        });
        
        if (this.guineaPig3) {
            console.log('🐹 GP3 initial state:', {
                classList: Array.from(this.guineaPig3.classList),
                style: this.guineaPig3.style.cssText,
                offsetWidth: this.guineaPig3.offsetWidth,
                offsetHeight: this.guineaPig3.offsetHeight
            });
        }
        
        if (this.guineaPig2) {
            console.log('🐹 GP2 initial state:', {
                classList: Array.from(this.guineaPig2.classList),
                style: this.guineaPig2.style.cssText,
                offsetWidth: this.guineaPig2.offsetWidth,
                offsetHeight: this.guineaPig2.offsetHeight
            });
        }
        
        if (this.guineaPig1) {
            console.log('🐹 GP1 initial state:', {
                classList: Array.from(this.guineaPig1.classList),
                style: this.guineaPig1.style.cssText,
                offsetWidth: this.guineaPig1.offsetWidth,
                offsetHeight: this.guineaPig1.offsetHeight
            });
        }
        
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
        const gp3Size = gameAreaWidth * CONFIG.GUINEA_PIG_3_SIZE * 1.6; // 60% larger (1.0 + 0.6)
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
        
        // UPDATED: Internal padding of 1.5 * raisin width from all edges
        const padding = raisinSize * 1.5;
        const usableWidth = gameAreaWidth - (2 * padding);
        const usableHeight = gameAreaHeight - (2 * padding);
        
        // UPDATED: Small left exclusion only for guinea pig 3 (no top-right exclusion)
        const exclusionZone = {
            x: 0,
            y: 0,
            width: gameAreaWidth * 0.15, // Small 15% width exclusion for GP3
            height: gameAreaHeight * 0.15 // Small 15% height exclusion for GP3
        };
        
        const positions = [];
        let attempts = 0;
        const maxAttempts = 2000;
        
        console.log('🍇 Generating raisin positions:', {
            gameAreaSize: `${Math.round(gameAreaWidth)}x${Math.round(gameAreaHeight)}`,
            raisinSize: Math.round(raisinSize),
            padding: Math.round(padding),
            minDistance: Math.round(minDistance),
            exclusionZone: {
                x: Math.round(exclusionZone.x),
                y: Math.round(exclusionZone.y),
                width: Math.round(exclusionZone.width),
                height: Math.round(exclusionZone.height)
            }
        });
        
        // Generate exactly 10 raisin positions with proper overlap detection
        while (positions.length < 10 && attempts < maxAttempts) {
            attempts++;
            
            // Generate random position within usable area (with padding)
            const x = padding + (Math.random() * usableWidth);
            const y = padding + (Math.random() * usableHeight);
            
            // Check if position is in small exclusion zone (guinea pig 3 area)
            const inExclusionZone = (
                x < exclusionZone.x + exclusionZone.width &&
                x + raisinSize > exclusionZone.x &&
                y < exclusionZone.y + exclusionZone.height &&
                y + raisinSize > exclusionZone.y
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
                
                const x = padding + (Math.random() * usableWidth);
                const y = padding + (Math.random() * usableHeight);
                
                const inExclusionZone = (
                    x < exclusionZone.x + exclusionZone.width &&
                    x + raisinSize > exclusionZone.x &&
                    y < exclusionZone.y + exclusionZone.height &&
                    y + raisinSize > exclusionZone.y
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
                z-index: 3;
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
        console.log('🐹 hideGuineaPig3 called');
        if (this.guineaPig3) {
            this.guineaPig3.classList.add('hidden');
            this.guineaPig3.classList.remove('bounce');
            console.log('🐹 GP3 hidden, classes:', Array.from(this.guineaPig3.classList));
        } else {
            console.warn('🐹 GP3 element not found in hideGuineaPig3');
        }
    }
    
    showGuineaPig3() {
        console.log('🐹 showGuineaPig3 called');
        if (this.guineaPig3) {
            this.guineaPig3.classList.remove('hidden');
            this.guineaPig3.classList.add('bounce');
            console.log('🐹 GP3 shown, classes:', Array.from(this.guineaPig3.classList));
        } else {
            console.warn('🐹 GP3 element not found in showGuineaPig3');
        }
    }
    
    async fadeOutGuineaPig3() {
        console.log('🐹 fadeOutGuineaPig3 called');
        return new Promise((resolve) => {
            if (!this.guineaPig3) {
                console.warn('🐹 GP3 element not found in fadeOutGuineaPig3');
                resolve();
                return;
            }
            
            console.log('🐹 Starting GP3 fade out');
            this.guineaPig3.style.transition = 'opacity 0.5s ease-out';
            this.guineaPig3.style.opacity = '0';
            this.guineaPig3.classList.remove('bounce');
            
            setTimeout(() => {
                this.guineaPig3.classList.add('hidden');
                console.log('🐹 GP3 fade out complete, classes:', Array.from(this.guineaPig3.classList));
                resolve();
            }, 500);
        });
    }
    
    async fadeInGuineaPig3() {
        console.log('🐹 fadeInGuineaPig3 called');
        return new Promise((resolve) => {
            if (!this.guineaPig3) {
                console.warn('🐹 GP3 element not found in fadeInGuineaPig3');
                resolve();
                return;
            }
            
            console.log('🐹 Starting GP3 fade in');
            this.guineaPig3.classList.remove('hidden');
            this.guineaPig3.style.transition = 'opacity 0.5s ease-in';
            this.guineaPig3.style.opacity = '1';
            this.guineaPig3.classList.add('bounce');
            
            setTimeout(() => {
                console.log('🐹 GP3 fade in complete, classes:', Array.from(this.guineaPig3.classList));
                resolve();
            }, 500);
        });
    }
    
    async moveGuineaPig2(raisinsToEat) {
        console.log('🐹 === STARTING GUINEA PIG 2 MOVEMENT ===');
        console.log('🐹 Raisins to eat:', raisinsToEat);
        
        return new Promise((resolve) => {
            if (!this.guineaPig2) {
                console.error('🐹 ❌ Guinea pig 2 element not found!');
                resolve();
                return;
            }
            
            if (!this.gameArea) {
                console.error('🐹 ❌ Game area not found!');
                resolve();
                return;
            }
            
            // Log initial state
            console.log('🐹 GP2 initial state:', {
                classList: Array.from(this.guineaPig2.classList),
                style: this.guineaPig2.style.cssText,
                offsetWidth: this.guineaPig2.offsetWidth,
                offsetHeight: this.guineaPig2.offsetHeight,
                computedStyle: {
                    display: window.getComputedStyle(this.guineaPig2).display,
                    visibility: window.getComputedStyle(this.guineaPig2).visibility,
                    opacity: window.getComputedStyle(this.guineaPig2).opacity,
                    zIndex: window.getComputedStyle(this.guineaPig2).zIndex,
                    left: window.getComputedStyle(this.guineaPig2).left,
                    top: window.getComputedStyle(this.guineaPig2).top
                }
            });
            
            const gameAreaRect = this.gameArea.getBoundingClientRect();
            const gpWidth = this.guineaPig2.offsetWidth;
            const startX = -gpWidth;
            const endX = gameAreaRect.width + gpWidth;
            
            console.log('🐹 GP2 movement setup:', {
                gameAreaWidth: gameAreaRect.width,
                gameAreaHeight: gameAreaRect.height,
                gpWidth,
                startX,
                endX,
                animationDuration: CONFIG.GUINEA_PIG_ANIMATION_DURATION
            });
            
            // Show guinea pig 2 and set initial position
            this.guineaPig2.classList.remove('hidden');
            this.guineaPig2.classList.add('moving');
            this.guineaPig2.style.left = `${startX}px`;
            
            console.log('🐹 GP2 after setup:', {
                classList: Array.from(this.guineaPig2.classList),
                left: this.guineaPig2.style.left,
                computedLeft: window.getComputedStyle(this.guineaPig2).left,
                visibility: window.getComputedStyle(this.guineaPig2).visibility,
                opacity: window.getComputedStyle(this.guineaPig2).opacity,
                zIndex: window.getComputedStyle(this.guineaPig2).zIndex,
                boundingRect: this.guineaPig2.getBoundingClientRect()
            });
            
            // Start moving after brief delay
            setTimeout(() => {
                console.log('🐹 Starting GP2 animation to endX:', endX);
                this.guineaPig2.style.left = `${endX}px`;
                
                // Log position after animation start
                setTimeout(() => {
                    console.log('🐹 GP2 mid-animation check:', {
                        left: this.guineaPig2.style.left,
                        computedLeft: window.getComputedStyle(this.guineaPig2).left,
                        boundingRect: this.guineaPig2.getBoundingClientRect()
                    });
                }, 1000);
                
            }, 100);
            
            // Eat raisins as guinea pig passes over them
            this.eatRaisinsOnPath(this.guineaPig2, raisinsToEat, 'left-to-right');
            
            // Hide guinea pig after animation
            setTimeout(() => {
                console.log('🐹 GP2 animation complete, hiding...');
                this.guineaPig2.classList.add('hidden');
                this.guineaPig2.classList.remove('moving');
                this.guineaPig2.style.left = '-25%'; // Reset position
                
                console.log('🐹 GP2 final state:', {
                    classList: Array.from(this.guineaPig2.classList),
                    left: this.guineaPig2.style.left
                });
                
                console.log('🐹 === GUINEA PIG 2 MOVEMENT COMPLETE ===');
                resolve();
            }, CONFIG.GUINEA_PIG_ANIMATION_DURATION);
        });
    }
    
    async moveGuineaPig1(raisinsToEat) {
        console.log('🐹 === STARTING GUINEA PIG 1 MOVEMENT ===');
        console.log('🐹 Raisins to eat:', raisinsToEat);
        
        return new Promise((resolve) => {
            if (!this.guineaPig1) {
                console.error('🐹 ❌ Guinea pig 1 element not found!');
                resolve();
                return;
            }
            
            if (!this.gameArea) {
                console.error('🐹 ❌ Game area not found!');
                resolve();
                return;
            }
            
            // Log initial state
            console.log('🐹 GP1 initial state:', {
                classList: Array.from(this.guineaPig1.classList),
                style: this.guineaPig1.style.cssText,
                offsetWidth: this.guineaPig1.offsetWidth,
                offsetHeight: this.guineaPig1.offsetHeight,
                computedStyle: {
                    display: window.getComputedStyle(this.guineaPig1).display,
                    visibility: window.getComputedStyle(this.guineaPig1).visibility,
                    opacity: window.getComputedStyle(this.guineaPig1).opacity,
                    zIndex: window.getComputedStyle(this.guineaPig1).zIndex,
                    left: window.getComputedStyle(this.guineaPig1).left,
                    right: window.getComputedStyle(this.guineaPig1).right,
                    top: window.getComputedStyle(this.guineaPig1).top
                }
            });
            
            const gameAreaRect = this.gameArea.getBoundingClientRect();
            const gpWidth = this.guineaPig1.offsetWidth;
            const startRight = -gpWidth;
            const endRight = gameAreaRect.width + gpWidth;
            
            console.log('🐹 GP1 movement setup:', {
                gameAreaWidth: gameAreaRect.width,
                gameAreaHeight: gameAreaRect.height,
                gpWidth,
                startRight,
                endRight,
                animationDuration: CONFIG.GUINEA_PIG_ANIMATION_DURATION
            });
            
            // Show guinea pig 1 and position it on the right side
            this.guineaPig1.classList.remove('hidden');
            this.guineaPig1.classList.add('moving');
            this.guineaPig1.style.left = 'auto';
            this.guineaPig1.style.right = `${startRight}px`;
            
            console.log('🐹 GP1 after setup:', {
                classList: Array.from(this.guineaPig1.classList),
                right: this.guineaPig1.style.right,
                left: this.guineaPig1.style.left,
                computedRight: window.getComputedStyle(this.guineaPig1).right,
                computedLeft: window.getComputedStyle(this.guineaPig1).left,
                visibility: window.getComputedStyle(this.guineaPig1).visibility,
                opacity: window.getComputedStyle(this.guineaPig1).opacity,
                zIndex: window.getComputedStyle(this.guineaPig1).zIndex,
                boundingRect: this.guineaPig1.getBoundingClientRect()
            });
            
            // Start moving from right to left after brief delay
            setTimeout(() => {
                console.log('🐹 Starting GP1 animation to endRight:', endRight);
                this.guineaPig1.style.right = `${endRight}px`;
                
                // Log position after animation start
                setTimeout(() => {
                    console.log('🐹 GP1 mid-animation check:', {
                        right: this.guineaPig1.style.right,
                        computedRight: window.getComputedStyle(this.guineaPig1).right,
                        boundingRect: this.guineaPig1.getBoundingClientRect()
                    });
                }, 1000);
                
            }, 100);
            
            // Eat raisins as guinea pig passes over them
            this.eatRaisinsOnPath(this.guineaPig1, raisinsToEat, 'right-to-left');
            
            // Hide guinea pig after animation
            setTimeout(() => {
                console.log('🐹 GP1 animation complete, hiding...');
                this.guineaPig1.classList.add('hidden');
                this.guineaPig1.classList.remove('moving');
                this.guineaPig1.style.right = '-25%'; // Reset position
                this.guineaPig1.style.left = 'auto';
                
                console.log('🐹 GP1 final state:', {
                    classList: Array.from(this.guineaPig1.classList),
                    right: this.guineaPig1.style.right,
                    left: this.guineaPig1.style.left
                });
                
                console.log('🐹 === GUINEA PIG 1 MOVEMENT COMPLETE ===');
                resolve();
            }, CONFIG.GUINEA_PIG_ANIMATION_DURATION);
        });
    }
    
    eatRaisinsOnPath(guineaPig, raisinsToEat, direction) {
        if (!guineaPig || !this.gameArea) return;
        
        console.log(`🍽️ Starting raisin eating for ${direction}:`, raisinsToEat);
        
        const animationDuration = CONFIG.GUINEA_PIG_ANIMATION_DURATION;
        const checkInterval = 20; // Check every 20ms for smoother detection
        const totalChecks = animationDuration / checkInterval;
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        
        let currentCheck = 0;
        let raisinsEaten = 0;
        
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
                        console.log(`🍽️ Eating raisin ${raisinIndex} (${direction})`);
                        this.eatRaisin(raisinIndex);
                        raisinsEaten++;
                    }
                }
            });
            
            // Stop checking when animation is complete
            if (currentCheck >= totalChecks) {
                console.log(`🍽️ Eating complete for ${direction}. Raisins eaten: ${raisinsEaten}/${raisinsToEat.length}`);
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
            this.guineaPig2.style.left = '-25%';
            this.guineaPig2.style.right = 'auto';
        }
        
        if (this.guineaPig1) {
            this.guineaPig1.classList.add('hidden');
            this.guineaPig1.style.right = '-25%';
            this.guineaPig1.style.left = 'auto';
        }
        
        // Reset guinea pig 3 to initial state
        if (this.guineaPig3) {
            this.guineaPig3.style.opacity = '1';
            this.guineaPig3.style.transition = '';
            this.showGuineaPig3();
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
