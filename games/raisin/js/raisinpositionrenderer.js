/**
 * Raisin Position Renderer
 * Handles raisin positioning, collision detection, and rendering.
 * Works with RaisinAnimationRenderer which handles guinea pig movements and animations.
 * This file focuses on: raisin placement algorithms, overlap detection, visual rendering,
 * and responsive positioning based on game area dimensions.
 */
class RaisinPositionRenderer {
    constructor() {
        console.log('🍇 RaisinPositionRenderer initialized');
        this.gameArea = document.querySelector('.game-area');
        this.raisins = [];
        this.raisinElements = [];
        
        // Current question tracking for tutorial/normal mode
        this.currentQuestionNumber = 0;
        
        // Setup responsive handling
        this.setupResizeHandling();
        
        if (!this.gameArea) {
            console.error('Game area not found for raisin positioning');
        }
    }
    
    setupResizeHandling() {
        // Listen for ButtonBar dimension updates
        if (window.ButtonBar) {
            window.ButtonBar.addObserver(() => {
                // Reposition existing raisins if needed
                this.updateExistingRaisinPositions();
            });
        }
        
        // Also handle window resize
        window.addEventListener('resize', () => {
            setTimeout(() => {
                this.updateExistingRaisinPositions();
            }, 100);
        });
    }
    
    updateExistingRaisinPositions() {
        // Update existing raisin positions if game area dimensions change
        if (this.raisinElements.length > 0 && this.gameArea) {
            const gameAreaRect = this.gameArea.getBoundingClientRect();
            const totalRaisins = CONFIG.getTotalRaisins(this.currentQuestionNumber);
            const raisinSize = gameAreaRect.width * CONFIG.RAISIN_SIZE;
            
            this.raisinElements.forEach((element, index) => {
                if (element && this.raisins[index]) {
                    element.style.width = `${raisinSize}px`;
                    element.style.height = `${raisinSize}px`;
                }
            });
        }
    }
    
    generateRaisinPositions(questionNumber) {
        this.currentQuestionNumber = questionNumber;
        
        if (!this.gameArea) {
            console.error('Game area not found for raisin positioning');
            return [];
        }
        
        const gameAreaRect = this.gameArea.getBoundingClientRect();
        const gameAreaWidth = gameAreaRect.width;
        const gameAreaHeight = gameAreaRect.height;
        
        // Get total raisins based on tutorial/normal mode
        const totalRaisins = CONFIG.getTotalRaisins(questionNumber);
        
        // Calculate raisin size and spacing based on game area
        const raisinSize = gameAreaWidth * CONFIG.RAISIN_SIZE;
        const minDistance = gameAreaWidth * CONFIG.RAISIN_MIN_DISTANCE;
        
        // Internal padding of 1.5 * raisin width from all edges
        const padding = raisinSize * 1.5;
        const usableWidth = gameAreaWidth - (2 * padding);
        const usableHeight = gameAreaHeight - (2 * padding);
        
        // Define exclusion zone for Guinea Pig 3 (top-left area)
        const exclusionZone = {
            x: gameAreaWidth * CONFIG.GUINEA_PIG_3_EXCLUSION.x,
            y: gameAreaHeight * CONFIG.GUINEA_PIG_3_EXCLUSION.y,
            width: gameAreaWidth * CONFIG.GUINEA_PIG_3_EXCLUSION.width,
            height: gameAreaHeight * CONFIG.GUINEA_PIG_3_EXCLUSION.height
        };
        
        console.log(`🍇 Generating ${totalRaisins} raisin positions:`, {
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
        
        const positions = [];
        let attempts = 0;
        const maxAttempts = 2000;
        
        // Generate positions with proper overlap detection
        while (positions.length < totalRaisins && attempts < maxAttempts) {
            attempts++;
            
            // Generate random position within usable area (with padding)
            const x = padding + (Math.random() * usableWidth);
            const y = padding + (Math.random() * usableHeight);
            
            // Check if position is in exclusion zone (guinea pig 3 area)
            const inExclusionZone = this.isInExclusionZone(x, y, raisinSize, exclusionZone);
            
            if (inExclusionZone) {
                continue;
            }
            
            // Check for overlap with existing raisins
            const overlaps = this.checkForOverlaps(x, y, raisinSize, positions, minDistance);
            
            if (!overlaps) {
                positions.push({ x, y });
            }
        }
        
        // If we couldn't generate enough positions, reduce constraints progressively
        if (positions.length < totalRaisins) {
            console.warn(`🍇 Only generated ${positions.length} raisin positions, reducing constraints...`);
            const reducedMinDistance = minDistance * 0.5;
            
            while (positions.length < totalRaisins && attempts < maxAttempts + 1000) {
                attempts++;
                
                const x = padding + (Math.random() * usableWidth);
                const y = padding + (Math.random() * usableHeight);
                
                const inExclusionZone = this.isInExclusionZone(x, y, raisinSize, exclusionZone);
                
                if (inExclusionZone) {
                    continue;
                }
                
                const overlaps = this.checkForOverlaps(x, y, raisinSize, positions, reducedMinDistance);
                
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
    
    isInExclusionZone(x, y, raisinSize, exclusionZone) {
        // Check if raisin overlaps with exclusion zone
        return (
            x < exclusionZone.x + exclusionZone.width &&
            x + raisinSize > exclusionZone.x &&
            y < exclusionZone.y + exclusionZone.height &&
            y + raisinSize > exclusionZone.y
        );
    }
    
    checkForOverlaps(x, y, raisinSize, existingPositions, minDistance) {
        for (const pos of existingPositions) {
            // Check if rectangles overlap (both x and y dimensions)
            const xOverlap = (x < pos.x + raisinSize && x + raisinSize > pos.x);
            const yOverlap = (y < pos.y + raisinSize && y + raisinSize > pos.y);
            
            if (xOverlap && yOverlap) {
                return true;
            }
            
            // Also check minimum distance for spacing
            const centerX1 = x + raisinSize / 2;
            const centerY1 = y + raisinSize / 2;
            const centerX2 = pos.x + raisinSize / 2;
            const centerY2 = pos.y + raisinSize / 2;
            const distance = Math.sqrt(Math.pow(centerX1 - centerX2, 2) + Math.pow(centerY1 - centerY2, 2));
            
            if (distance < minDistance) {
                return true;
            }
        }
        
        return false;
    }
    
    async renderRaisinsStaggered(questionNumber) {
        // Clear existing raisins
        this.clearRaisins();
        
        // Generate new positions
        this.raisins = this.generateRaisinPositions(questionNumber);
        
        if (this.raisins.length === 0) {
            console.error('🍇 No raisin positions generated!');
            return;
        }
        
        // Create raisin elements using different PNG files
        const totalRaisins = CONFIG.getTotalRaisins(questionNumber);
        this.raisins.forEach((raisin, index) => {
            const raisinElement = document.createElement('img');
            
            // Use different raisin images based on total count
            const raisinImageNumber = (index % 10) + 1; // Cycle through raisin1.png to raisin10.png
            raisinElement.src = `../../assets/raisin/raisin${raisinImageNumber}.png`;
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
        
        console.log(`🍇 Created ${this.raisinElements.length} raisin elements for question ${questionNumber + 1}`);
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
    
    playPatSound() {
        // Use AudioSystem for pat sound with reduced complexity to minimize lag
        if (window.AudioSystem) {
            window.AudioSystem.playTone(800, 0.08, 'sine', 0.05); // Reduced volume and duration
        }
    }
    
    getRemainingRaisins() {
        return this.raisinElements.filter(element => 
            !element.classList.contains('eaten') && element.parentNode
        ).length;
    }
    
    getRaisinElements() {
        return this.raisinElements;
    }
    
    reset() {
        console.log('🍇 Resetting raisin position renderer');
        this.clearRaisins();
        this.currentQuestionNumber = 0;
    }
    
    destroy() {
        // Clean up resize observer
        if (window.ButtonBar) {
            window.ButtonBar.removeObserver(this.updateExistingRaisinPositions);
        }
        
        window.removeEventListener('resize', this.updateExistingRaisinPositions);
        this.reset();
    }
}
