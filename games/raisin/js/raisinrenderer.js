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
        
        // Calculate usable area (excluding guinea pig 3 area)
        const exclusionZone = CONFIG.GUINEA_PIG_3_EXCLUSION;
        const exclusionX = gameAreaRect.width * exclusionZone.x;
        const exclusionY = gameAreaRect.height * exclusionZone.y;
        const exclusionWidth = gameAreaRect.width * exclusionZone.width;
        const exclusionHeight = gameAreaRect.height * exclusionZone.height;
        
        const positions = [];
        let attempts = 0;
        const maxAttempts = 1000;
        
        // Generate exactly 10 raisin positions
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
            
            // Check distance from other raisins
            let tooClose = false;
            for (const pos of positions) {
                const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
                if (distance < minDistance) {
                    tooClose = true;
                    break;
                }
            }
            
            if (!tooClose) {
                positions.push({ x, y });
            }
        }
        
        // If we couldn't generate 10 positions, reduce minimum distance and try again
        if (positions.length < 10) {
            console.warn(`Only generated ${positions.length} raisin positions, reducing constraints...`);
            const reducedMinDistance = minDistance * 0.7;
            
            while (positions.length < 10 && attempts < maxAttempts + 500) {
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
                
                let tooClose = false;
                for (const pos of positions) {
                    const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
                    if (distance < reducedMinDistance) {
                        tooClose = true;
                        break;
                    }
                }
                
                if (!tooClose) {
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
    
    renderRaisins() {
        // Clear existing raisins
        this.clearRaisins();
        
        // Generate new positions
        this.raisins = this.generateRaisinPositions();
        
        // Create raisin elements using exactly the 10 different PNG files
        this.raisins.forEach((raisin, index) => {
            const raisinElement = document.createElement('img');
            raisinElement.src = `../../assets/raisin/raisin${index + 1}.png`; // Use raisin1.png through raisin10.png
            raisinElement.className = 'raisin fade-in';
            raisinElement.style.left = `${raisin.x}px`;
            raisinElement.style.top = `${raisin.y}px`;
            raisinElement.style.width = `${raisin.size}px`;
            raisinElement.style.height = `${raisin.size}px`;
            raisinElement.dataset.index = index;
            
            this.gameArea.appendChild(raisinElement);
            this.raisinElements.push(raisinElement);
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
            this.guineaPig1.style.right = `${-this.guineaPig1.offsetWidth}px`;
            this.guineaPig1.style.left = 'auto';
            
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
                resolve();
            }, CONFIG.GUINEA_PIG_ANIMATION_DURATION);
        });
    }
    
    eatRaisinsOnPath(guineaPig, raisinsToEat, direction) {
        const animationDuration = CONFIG.GUINEA_PIG_ANIMATION_DURATION;
        const checkInterval = 50; // Check every 50ms
        const totalChecks = animationDuration / checkInterval;
        
        let currentCheck = 0;
        const checkEating = setInterval(() => {
            currentCheck++;
            
            // Get current guinea pig position
            const guineaPigRect = guineaPig.getBoundingClientRect();
            const gameAreaRect = this.gameArea.getBoundingClientRect();
            
            // Check each raisin that should be eaten
            raisinsToEat.forEach(raisinIndex => {
                const raisinElement = this.raisinElements[raisinIndex];
                if (raisinElement && !raisinElement.classList.contains('eaten')) {
                    const raisinRect = raisinElement.getBoundingClientRect();
                    
                    // Check if guinea pig is over the raisin
                    const overlap = (
                        guineaPigRect.left < raisinRect.right &&
                        guineaPigRect.right > raisinRect.left &&
                        guineaPigRect.top < raisinRect.bottom &&
                        guineaPigRect.bottom > raisinRect.top
                    );
                    
                    if (overlap) {
                        this.eatRaisin(raisinIndex, raisinRect);
                    }
                }
            });
            
            // Stop checking when animation is complete
            if (currentCheck >= totalChecks) {
                clearInterval(checkEating);
            }
        }, checkInterval);
    }
    
    eatRaisin(raisinIndex, raisinRect) {
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
    
    addNomEffect(raisinRect) {
        // Remove this method - no visual nom effects
    }
    
    reset() {
        this.clearRaisins();
        this.guineaPig2.classList.add('hidden');
        this.guineaPig1.classList.add('hidden');
        
        // Reset guinea pig 3 to initial state
        this.guineaPig3.style.opacity = '1';
        this.guineaPig3.style.transition = '';
        this.showGuineaPig3();
        
        // Reset guinea pig positions
        this.guineaPig2.style.left = '-25%';
        this.guineaPig1.style.right = '-25%';
        
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
