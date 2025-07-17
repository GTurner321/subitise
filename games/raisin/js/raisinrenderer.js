class RaisinRenderer {
    constructor() {
        this.gameArea = document.querySelector('.game-area');
        this.raisins = [];
        this.raisinElements = [];
        this.guineaPig3 = document.getElementById('guineaPig3');
        this.guineaPig2 = document.getElementById('guineaPig2');
        this.guineaPig1 = document.getElementById('guineaPig1');
        
        this.setupGuineaPigSizes();
    }
    
    setupGuineaPigSizes() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Set guinea pig sizes
        const gp3Size = screenWidth * CONFIG.GUINEA_PIG_3_SIZE;
        const gp2Size = screenWidth * CONFIG.GUINEA_PIG_2_SIZE;
        const gp1Size = screenWidth * CONFIG.GUINEA_PIG_1_SIZE;
        
        this.guineaPig3.style.width = `${gp3Size}px`;
        this.guineaPig3.style.height = `${gp3Size}px`;
        
        this.guineaPig2.style.width = `${gp2Size}px`;
        this.guineaPig2.style.height = `${gp2Size}px`;
        
        this.guineaPig1.style.width = `${gp1Size}px`;
        this.guineaPig1.style.height = `${gp1Size}px`;
    }
    
    generateRaisinPositions() {
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Calculate raisin size
        const raisinSize = Math.min(screenWidth * CONFIG.RAISIN_SIZE, screenHeight * CONFIG.RAISIN_SIZE);
        const minDistance = Math.min(screenWidth * CONFIG.RAISIN_MIN_DISTANCE, screenHeight * CONFIG.RAISIN_MIN_DISTANCE);
        
        // Calculate usable area (excluding guinea pig 3 area - top left)
        const exclusionZone = CONFIG.GUINEA_PIG_3_EXCLUSION;
        const exclusionX = gameAreaRect.width * exclusionZone.x;
        const exclusionY = gameAreaRect.height * exclusionZone.y;
        const exclusionWidth = gameAreaRect.width * exclusionZone.width;
        const exclusionHeight = gameAreaRect.height * exclusionZone.height;
        
        const positions = [];
        let attempts = 0;
        const maxAttempts = 2000;
        
        // Generate exactly 10 raisin positions with proper overlap detection
        while (positions.length < 10 && attempts < maxAttempts) {
            attempts++;
            
            // Generate random position within game area
            const x = Math.random() * (gameAreaRect.width - raisinSize);
            const y = Math.random() * (gameAreaRect.height - raisinSize);
            
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
            console.warn(`Only generated ${positions.length} raisin positions, reducing constraints...`);
            const reducedMinDistance = minDistance * 0.5;
            
            while (positions.length < 10 && attempts < maxAttempts + 1000) {
                attempts++;
                
                const x = Math.random() * (gameAreaRect.width - raisinSize);
                const y = Math.random() * (gameAreaRect.height - raisinSize);
                
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
        
        // Create raisin elements using exactly the 10 different PNG files
        this.raisins.forEach((raisin, index) => {
            const raisinElement = document.createElement('img');
            raisinElement.src = `../../assets/raisin/raisin${index + 1}.png`; // Use raisin1.png through raisin10.png
            raisinElement.className = 'raisin staggered-appear';
            raisinElement.style.left = `${raisin.x}px`;
            raisinElement.style.top = `${raisin.y}px`;
            raisinElement.style.width = `${raisin.size}px`;
            raisinElement.style.height = `${raisin.size}px`;
            raisinElement.dataset.index = index;
            
            // Calculate staggered appearance timing
            const staggerDelay = CONFIG.RAISIN_STAGGER_START + (Math.random() * CONFIG.RAISIN_STAGGER_WINDOW);
            
            // Add to DOM but keep hidden initially
            raisinElement.style.opacity = '0';
            this.gameArea.appendChild(raisinElement);
            this.raisinElements.push(raisinElement);
            
            // Schedule appearance with pat sound
            setTimeout(() => {
                raisinElement.style.opacity = '1';
                raisinElement.style.animation = 'raisinStaggeredAppear 0.5s ease-in forwards';
                
                // Play pat sound
                this.playPatSound();
            }, staggerDelay);
        });
    }
    
    clearRaisins() {
        this.raisinElements.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
        this.raisinElements = [];
        this.raisins = [];
    }
    
    hideGuineaPig3() {
        this.guineaPig3.classList.add('hidden');
        this.guineaPig3.classList.remove('bounce');
    }
    
    showGuineaPig3() {
        this.guineaPig3.classList.remove('hidden');
        this.guineaPig3.classList.add('bounce');
    }
    
    async fadeOutGuineaPig3() {
        return new Promise((resolve) => {
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
            
            // Remove from DOM after animation (no visual "nom" effect)
            setTimeout(() => {
                if (raisinElement.parentNode) {
                    raisinElement.parentNode.removeChild(raisinElement);
                }
            }, 800);
        }
    }
    
    playPatSound() {
        // Simple pat sound - short, quiet beep
        if (window.raisinGame && window.raisinGame.audioContext && window.raisinGame.audioEnabled) {
            try {
                const oscillator = window.raisinGame.audioContext.createOscillator();
                const gainNode = window.raisinGame.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(window.raisinGame.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(800, window.raisinGame.audioContext.currentTime);
                oscillator.type = 'square';
                
                gainNode.gain.setValueAtTime(0.1, window.raisinGame.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, window.raisinGame.audioContext.currentTime + 0.1);
                
                oscillator.start(window.raisinGame.audioContext.currentTime);
                oscillator.stop(window.raisinGame.audioContext.currentTime + 0.1);
            } catch (error) {
                // Silent failure
            }
        }
    }
    
    reset() {
        this.clearRaisins();
        this.guineaPig2.classList.add('hidden');
        this.guineaPig1.classList.add('hidden');
        
        // Reset guinea pig 3 to initial state
        this.guineaPig3.style.opacity = '1';
        this.guineaPig3.style.transition = '';
        this.showGuineaPig3();
        
        // Reset guinea pig positions properly
        this.guineaPig2.style.left = '-25%';
        this.guineaPig2.style.right = 'auto';
        this.guineaPig1.style.right = '-25%';
        this.guineaPig1.style.left = 'auto';
        
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
}
