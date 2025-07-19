class SliderRenderer {
    constructor() {
        this.sliderContainer = document.getElementById('sliderContainer');
        this.topBar = document.getElementById('topBar');
        this.bottomBar = document.getElementById('bottomBar');
        this.beads = [];
        this.containerRect = null;
        this.frameImageRect = null;
        this.beadDiameter = 0;
        this.beadRadius = 0;
        
        // Bar state tracking - positions are continuous values along the bar
        this.barState = {
            0: [], // Top bar: array of {bead, position} sorted by position
            1: []  // Bottom bar: array of {bead, position} sorted by position
        };
        
        this.updateContainerRect();
        this.initializeBeads();
        this.updateBarState();
        
        // Update on window resize
        window.addEventListener('resize', () => {
            this.updateContainerRect();
            this.repositionAllBeads();
        });
    }
    
    updateContainerRect() {
        this.containerRect = this.sliderContainer.getBoundingClientRect();
        
        // Calculate actual frame image dimensions (1516x475 aspect ratio)
        const containerAspectRatio = this.containerRect.width / this.containerRect.height;
        const imageAspectRatio = 1516 / 475;
        
        if (containerAspectRatio > imageAspectRatio) {
            // Container wider than image - constrained by height
            this.frameImageRect = {
                width: this.containerRect.height * imageAspectRatio,
                height: this.containerRect.height,
                x: (this.containerRect.width - this.containerRect.height * imageAspectRatio) / 2,
                y: 0
            };
        } else {
            // Container taller than image - constrained by width
            this.frameImageRect = {
                width: this.containerRect.width,
                height: this.containerRect.width / imageAspectRatio,
                x: 0,
                y: (this.containerRect.height - this.containerRect.width / imageAspectRatio) / 2
            };
        }
        
        // Bead diameter is 12% of frame height, made 20% larger
        this.beadDiameter = this.frameImageRect.height * 0.12 * 1.2;
        this.beadRadius = this.beadDiameter / 2;
        
        this.updateBarDimensions();
    }
    
    updateBarDimensions() {
        if (!this.frameImageRect) return;
        
        const barHeight = this.frameImageRect.height * 0.05;
        const barWidth = this.frameImageRect.width * 0.86;
        const barLeft = this.frameImageRect.x + (this.frameImageRect.width * 0.07); // Changed from 0.06 to 0.07
        
        // Top bar at 34% of frame height - positioned so bead centers align with bar center
        const topBarTop = this.frameImageRect.y + (this.frameImageRect.height * 0.34) - (barHeight / 2);
        this.topBar.style.cssText = `
            position: absolute;
            left: ${barLeft}px;
            top: ${topBarTop}px;
            width: ${barWidth}px;
            height: ${barHeight}px;
        `;
        
        // Bottom bar at 60% of frame height - positioned so bead centers align with bar center
        const bottomBarTop = this.frameImageRect.y + (this.frameImageRect.height * 0.60) - (barHeight / 2);
        this.bottomBar.style.cssText = `
            position: absolute;
            left: ${barLeft}px;
            top: ${bottomBarTop}px;
            width: ${barWidth}px;
            height: ${barHeight}px;
        `;
    }
    
    initializeBeads() {
        // Clear existing beads
        this.beads.forEach(bead => {
            if (bead.element && bead.element.parentNode) {
                bead.element.parentNode.removeChild(bead.element);
            }
        });
        this.beads = [];
        
        // Create 20 beads (10 per bar)
        for (let barIndex = 0; barIndex < 2; barIndex++) {
            for (let beadIndex = 0; beadIndex < CONFIG.BEADS_PER_BAR; beadIndex++) {
                const bead = this.createBead(barIndex, beadIndex);
                this.beads.push(bead);
            }
        }
    }
    
    createBead(barIndex, beadIndex) {
        const beadElement = document.createElement('div');
        beadElement.className = 'bead';
        
        beadElement.style.cssText = `
            width: ${this.beadDiameter}px;
            height: ${this.beadDiameter}px;
            position: absolute;
        `;
        
        // Color: first 5 blue, last 5 red
        const isBlue = beadIndex < 5;
        beadElement.classList.add(isBlue ? 'blue' : 'red');
        
        // Initial position: consecutive positions 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
        const bead = {
            element: beadElement,
            barIndex: barIndex,
            position: beadIndex, // Continuous position along the bar
            id: `bead-${barIndex}-${beadIndex}`,
            isDragging: false,
            isBlue: isBlue
        };
        
        this.positionBead(bead);
        this.sliderContainer.appendChild(beadElement);
        return bead;
    }
    
    positionBead(bead) {
        if (!this.frameImageRect) return;
        
        const barY = bead.barIndex === 0 ? 0.34 : 0.60;
        
        // Calculate bead center position
        // Bar starts at 7% margin, bead centers start at 7% + radius
        const beadCenterX = this.frameImageRect.x + 
                           (this.frameImageRect.width * 0.07) + // Changed from 0.06 to 0.07
                           this.beadRadius + 
                           (bead.position * this.beadDiameter);
        
        const beadCenterY = this.frameImageRect.y + (this.frameImageRect.height * barY);
        
        // Position bead element
        const beadLeft = beadCenterX - this.beadRadius;
        const beadTop = beadCenterY - this.beadRadius;
        
        bead.element.style.left = `${beadLeft}px`;
        bead.element.style.top = `${beadTop}px`;
    }
    
    updateBarState() {
        // Update the tracking arrays for both bars
        for (let barIndex = 0; barIndex < 2; barIndex++) {
            const barBeads = this.beads.filter(bead => bead.barIndex === barIndex);
            this.barState[barIndex] = barBeads
                .map(bead => ({ bead, position: bead.position }))
                .sort((a, b) => a.position - b.position);
        }
        
        console.log('Bar state updated:');
        console.log('Top bar:', this.barState[0].map(item => `${item.bead.id}(${item.position.toFixed(2)})`));
        console.log('Bottom bar:', this.barState[1].map(item => `${item.bead.id}(${item.position.toFixed(2)})`));
    }
    
    calculateSpaces(barIndex) {
        // Calculate spaces between beads and at ends
        const barBeads = this.barState[barIndex];
        const spaces = [];
        
        // Calculate usable bar length (6% to 92% of frame width)
        const barStartX = this.frameImageRect.width * 0.06;
        const barEndX = this.frameImageRect.width * 0.92;
        const usableLength = barEndX - barStartX - (2 * this.beadRadius);
        const maxPosition = usableLength / this.beadDiameter;
        
        if (barBeads.length === 0) {
            spaces.push({ type: 'start', size: maxPosition });
            return spaces;
        }
        
        // Space before first bead
        const firstBeadPos = barBeads[0].position;
        const startSpace = firstBeadPos - this.beadRadius / this.beadDiameter;
        if (startSpace > 0) {
            spaces.push({ type: 'start', size: startSpace, beforeBead: barBeads[0].bead });
        }
        
        // Spaces between beads
        for (let i = 0; i < barBeads.length - 1; i++) {
            const currentBead = barBeads[i];
            const nextBead = barBeads[i + 1];
            const gap = nextBead.position - currentBead.position - 1; // 1 diameter apart
            
            if (gap > 0) {
                spaces.push({
                    type: 'between',
                    size: gap,
                    afterBead: currentBead.bead,
                    beforeBead: nextBead.bead
                });
            }
        }
        
        // Space after last bead
        const lastBeadPos = barBeads[barBeads.length - 1].position;
        const endSpace = maxPosition - lastBeadPos - this.beadRadius / this.beadDiameter;
        if (endSpace > 0) {
            spaces.push({ type: 'end', size: endSpace, afterBead: barBeads[barBeads.length - 1].bead });
        }
        
        console.log(`Spaces on bar ${barIndex}:`, spaces.map(s => `${s.type}:${s.size.toFixed(2)}`));
        return spaces;
    }
    
    getBeadAtPosition(x, y) {
        for (let bead of this.beads) {
            const beadRect = bead.element.getBoundingClientRect();
            
            // Create square touch target with side length = bead diameter
            const touchSize = this.beadDiameter;
            const touchLeft = beadRect.left + beadRect.width/2 - touchSize/2;
            const touchTop = beadRect.top + beadRect.height/2 - touchSize/2;
            const touchRight = touchLeft + touchSize;
            const touchBottom = touchTop + touchSize;
            
            if (x >= touchLeft && x <= touchRight &&
                y >= touchTop && y <= touchBottom) {
                return bead;
            }
        }
        return null;
    }
    
    getConnectedBeads(bead) {
        // For simplified individual bead movement, only return the single bead
        // This ensures each bead moves independently
        console.log(`Moving only individual bead: ${bead.id}`);
        return [bead];
    }
    
    canMoveBlock(block, direction, distance) {
        // Check if a block can move in the given direction by the given distance
        const barIndex = block[0].barIndex;
        const barBeads = this.barState[barIndex];
        
        // Find the leftmost and rightmost positions of the block
        const blockPositions = block.map(b => b.position).sort((a, b) => a - b);
        const blockStart = blockPositions[0];
        const blockEnd = blockPositions[blockPositions.length - 1];
        
        // Calculate bar bounds - beads can move from position 0 to maximum position
        // Bar goes from 7% to 92% of frame width, so we have 85% usable width
        const barStartX = this.frameImageRect.width * 0.07;
        const barEndX = this.frameImageRect.width * 0.92;
        const usableLength = barEndX - barStartX - (2 * this.beadRadius);
        const maxPosition = usableLength / this.beadDiameter;
        
        console.log(`Block bounds: ${blockStart.toFixed(2)} to ${blockEnd.toFixed(2)}, max position: ${maxPosition.toFixed(2)}, usable length: ${usableLength.toFixed(1)}, bead diameter: ${this.beadDiameter.toFixed(1)}`);
        
        if (direction > 0) {
            // Moving right - check space to the right of the block
            let availableSpace = maxPosition - blockEnd;
            
            // Find ALL beads to the right that are not in our block, get the nearest one
            let nearestObstacle = maxPosition;
            for (let beadInfo of barBeads) {
                if (!block.includes(beadInfo.bead) && beadInfo.position > blockEnd) {
                    // This bead is to our right - it's an obstacle
                    nearestObstacle = Math.min(nearestObstacle, beadInfo.position);
                }
            }
            
            // Available space is from our end to the nearest obstacle, minus 1 diameter for safety
            if (nearestObstacle < maxPosition) {
                availableSpace = nearestObstacle - blockEnd - 1.0; // Must leave 1 diameter gap
            }
            
            const allowedMovement = Math.max(0, Math.min(distance, availableSpace));
            console.log(`Moving right: nearest obstacle at ${nearestObstacle.toFixed(2)}, available space ${availableSpace.toFixed(3)}, allowed movement ${allowedMovement.toFixed(3)}`);
            return allowedMovement;
        } else {
            // Moving left - check space to the left of the block
            let availableSpace = blockStart;
            
            // Find ALL beads to the left that are not in our block, get the nearest one
            let nearestObstacle = 0;
            for (let beadInfo of barBeads) {
                if (!block.includes(beadInfo.bead) && beadInfo.position < blockStart) {
                    // This bead is to our left - it's an obstacle
                    nearestObstacle = Math.max(nearestObstacle, beadInfo.position);
                }
            }
            
            // Available space is from the nearest obstacle to our start, minus 1 diameter for safety
            if (nearestObstacle > 0) {
                availableSpace = blockStart - nearestObstacle - 1.0; // Must leave 1 diameter gap
            }
            
            const allowedMovement = Math.max(0, Math.min(distance, availableSpace));
            console.log(`Moving left: nearest obstacle at ${nearestObstacle.toFixed(2)}, available space ${availableSpace.toFixed(3)}, allowed movement ${allowedMovement.toFixed(3)}`);
            return allowedMovement;
        }
    }
    
    moveBlock(block, distance) {
        // Move all beads in the block by the given distance
        console.log(`moveBlock: Moving ${block.length} beads by ${distance.toFixed(3)}`);
        
        block.forEach(bead => {
            const oldPosition = bead.position;
            bead.position += distance;
            console.log(`  ${bead.id}: ${oldPosition.toFixed(3)} → ${bead.position.toFixed(3)}`);
            this.positionBead(bead);
        });
        
        this.updateBarState();
        
        // Log all bead positions after movement
        console.log('All bead positions after movement:');
        this.beads.forEach(bead => {
            const beadRect = bead.element.getBoundingClientRect();
            console.log(`  ${bead.id}: position ${bead.position.toFixed(3)}, screen coords (${beadRect.left.toFixed(1)}, ${beadRect.top.toFixed(1)}), visible: ${beadRect.width > 0 && beadRect.height > 0}`);
        });
    }
    
    snapToNearbyBeads(bead, snapRadius = 1.0) {
        // Check for magnetic snapping to nearby beads or bar ends
        const barBeads = this.barState[bead.barIndex];
        const currentIndex = barBeads.findIndex(item => item.bead === bead);
        
        if (currentIndex === -1) return false;
        
        let snapped = false;
        
        // Calculate bar bounds for end snapping
        const barStartX = this.frameImageRect.width * 0.07;
        const barEndX = this.frameImageRect.width * 0.92;
        const usableLength = barEndX - barStartX - (2 * this.beadRadius);
        const maxPosition = usableLength / this.beadDiameter;
        
        console.log(`Snap check for ${bead.id}: position ${bead.position.toFixed(2)}, max position ${maxPosition.toFixed(2)}`);
        
        // CRITICAL: First check if there are any beads that would block movement
        // Don't allow snapping if it would cause overlap
        
        // Check bead to the left - snap to its right side if within range
        if (currentIndex > 0) {
            const leftBead = barBeads[currentIndex - 1];
            const distance = bead.position - leftBead.position;
            console.log(`  Distance to left bead ${leftBead.bead.id}: ${distance.toFixed(3)}`);
            
            if (distance > 1.0 && distance <= 1.0 + snapRadius) {
                const targetPosition = leftBead.position + 1.0;
                console.log(`  Would snap to position ${targetPosition.toFixed(3)} (right of ${leftBead.bead.id})`);
                
                // Check if this position is safe (no bead to our right would be too close)
                let isSafe = true;
                if (currentIndex < barBeads.length - 1) {
                    const rightBead = barBeads[currentIndex + 1];
                    if (rightBead.position - targetPosition < 1.0) {
                        console.log(`  BLOCKED: Right bead ${rightBead.bead.id} at ${rightBead.position.toFixed(3)} too close`);
                        isSafe = false;
                    }
                }
                
                if (isSafe) {
                    bead.position = targetPosition;
                    this.positionBead(bead);
                    snapped = true;
                    console.log(`  SNAPPED ${bead.id} to right of ${leftBead.bead.id} at position ${bead.position.toFixed(2)}`);
                }
            }
        }
        
        // Check bead to the right - snap to its left side if within range
        if (!snapped && currentIndex < barBeads.length - 1) {
            const rightBead = barBeads[currentIndex + 1];
            const distance = rightBead.position - bead.position;
            console.log(`  Distance to right bead ${rightBead.bead.id}: ${distance.toFixed(3)}`);
            
            if (distance > 1.0 && distance <= 1.0 + snapRadius) {
                const targetPosition = rightBead.position - 1.0;
                console.log(`  Would snap to position ${targetPosition.toFixed(3)} (left of ${rightBead.bead.id})`);
                
                // Check if this position is safe (no bead to our left would be too close)
                let isSafe = true;
                if (currentIndex > 0) {
                    const leftBead = barBeads[currentIndex - 1];
                    if (targetPosition - leftBead.position < 1.0) {
                        console.log(`  BLOCKED: Left bead ${leftBead.bead.id} at ${leftBead.position.toFixed(3)} too close`);
                        isSafe = false;
                    }
                }
                
                if (isSafe) {
                    bead.position = targetPosition;
                    this.positionBead(bead);
                    snapped = true;
                    console.log(`  SNAPPED ${bead.id} to left of ${rightBead.bead.id} at position ${bead.position.toFixed(2)}`);
                }
            }
        }
        
        // Only snap to bar ends if no nearby beads AND it's safe to do so
        if (!snapped) {
            // Check for snapping to bar start (left end)
            if (bead.position <= snapRadius) {
                bead.position = 0;
                this.positionBead(bead);
                snapped = true;
                console.log(`  SNAPPED ${bead.id} to bar start`);
            }
            
            // Check for snapping to bar end (right end) - only if no other beads are in the way
            else if (bead.position >= maxPosition - snapRadius) {
                // Make sure there are no beads to the right that would block this
                let canSnapToEnd = true;
                for (let beadInfo of barBeads) {
                    if (beadInfo.bead !== bead && beadInfo.position >= maxPosition - 1.0) {
                        console.log(`  BLOCKED from bar end: Bead ${beadInfo.bead.id} at ${beadInfo.position.toFixed(3)} too close to end`);
                        canSnapToEnd = false;
                        break;
                    }
                }
                
                if (canSnapToEnd) {
                    bead.position = Math.min(maxPosition - 0.1, bead.position); // Leave small margin from edge
                    this.positionBead(bead);
                    snapped = true;
                    console.log(`  SNAPPED ${bead.id} to bar end at position ${bead.position.toFixed(2)}`);
                }
            }
        }
        
        if (snapped) {
            this.updateBarState();
            this.playSnapSound();
        }
        
        return snapped;
    }
    
    repositionAllBeads() {
        this.updateContainerRect();
        this.beads.forEach(bead => {
            bead.element.style.width = `${this.beadDiameter}px`;
            bead.element.style.height = `${this.beadDiameter}px`;
            this.positionBead(bead);
        });
    }
    
    countBeadsOnRightSide() {
        let count = 0;
        const threshold = CONFIG.BEADS_PER_BAR / 2; // Position 5 is the middle
        
        console.log(`Counting beads on right side (threshold: ${threshold}):`);
        
        this.beads.forEach(bead => {
            console.log(`Bead ${bead.id}: position ${bead.position.toFixed(2)} - ${bead.position >= threshold ? 'RIGHT' : 'LEFT'}`);
            if (bead.position >= threshold) {
                count++;
            }
        });
        
        console.log(`Total beads on right side: ${count}`);
        return count;
    }
    
    hasBeadsInMiddle() {
        const leftThreshold = 2;
        const rightThreshold = CONFIG.BEADS_PER_BAR - 3;
        
        return this.beads.some(bead => 
            bead.position > leftThreshold && bead.position < rightThreshold
        );
    }
    
    reset() {
        this.initializeBeads();
        this.updateBarState();
    }
    
    playSnapSound() {
        if (!CONFIG.AUDIO_ENABLED) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Metallic click sound
            oscillator.frequency.setValueAtTime(2000, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.05);
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.005);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
            
            oscillator.type = 'triangle';
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.08);
        } catch (error) {
            // Silent failure
        }
    }
}
