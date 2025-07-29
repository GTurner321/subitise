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
        
        // Preload click sound for better performance
        this.clickSound = new Audio('assets/slider/click.mp3');
        this.clickSound.volume = 0.7; // Set to 70% volume
        this.clickSound.preload = 'auto';
        
        // Bar state tracking - positions are continuous values along the bar
        this.barState = {
            0: [], // Top bar: array of {bead, position} sorted by position
            1: []  // Bottom bar: array of {bead, position} sorted by position
        };
        
        // Momentum tracking for each bead
        this.momentumBeads = new Map(); // beadId -> {velocity, lastPosition, lastTime, animationId}
        
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
        const barWidth = this.frameImageRect.width * 0.85; // 85% width (7% to 92%)
        const barLeft = this.frameImageRect.x + (this.frameImageRect.width * 0.07); // Start at 7%
        
        // Top bar at 34% of frame height
        const topBarTop = this.frameImageRect.y + (this.frameImageRect.height * 0.34) - (barHeight / 2);
        this.topBar.style.cssText = `
            position: absolute;
            left: ${barLeft}px;
            top: ${topBarTop}px;
            width: ${barWidth}px;
            height: ${barHeight}px;
        `;
        
        // Bottom bar at 60% of frame height
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
            transition: none;
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
            isTouched: false,
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
        const beadCenterX = this.frameImageRect.x + 
                           (this.frameImageRect.width * 0.07) + 
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
    
    // Calculate the maximum distance a bead can move in a direction
    calculateMaxMovement(bead, direction) {
        const barIndex = bead.barIndex;
        const barBeads = this.barState[barIndex];
        const currentIndex = barBeads.findIndex(item => item.bead === bead);
        
        if (currentIndex === -1) return 0;
        
        // Calculate bar bounds
        const barStartX = this.frameImageRect.width * 0.07;
        const barEndX = this.frameImageRect.width * 0.92;
        const barLength = barEndX - barStartX;
        const playableLength = barLength - (2 * this.beadRadius);
        const maxPosition = playableLength / this.beadDiameter;
        
        const currentPosition = bead.position;
        
        if (direction > 0) {
            // Moving right
            let maxMovement = maxPosition - currentPosition;
            
            // Check for beads to the right
            for (let i = currentIndex + 1; i < barBeads.length; i++) {
                const rightBead = barBeads[i];
                const distance = rightBead.position - currentPosition;
                maxMovement = Math.min(maxMovement, distance - 1.0); // Must leave 1 diameter gap
            }
            
            return Math.max(0, maxMovement);
        } else {
            // Moving left
            let maxMovement = currentPosition;
            
            // Check for beads to the left
            for (let i = currentIndex - 1; i >= 0; i--) {
                const leftBead = barBeads[i];
                const distance = currentPosition - leftBead.position;
                maxMovement = Math.min(maxMovement, distance - 1.0); // Must leave 1 diameter gap
            }
            
            return Math.max(0, maxMovement);
        }
    }
    
    // Find all beads that should move together as a connected block
    getConnectedBeads(bead, direction) {
        const barIndex = bead.barIndex;
        const barBeads = this.barState[barIndex];
        const currentIndex = barBeads.findIndex(item => item.bead === bead);
        
        if (currentIndex === -1) return [bead];
        
        const connectedBeads = [bead];
        const tolerance = 0.1; // Small tolerance for floating point comparisons
        
        if (direction > 0) {
            // Moving right - check for adjacent beads to the right
            for (let i = currentIndex + 1; i < barBeads.length; i++) {
                const rightBead = barBeads[i];
                const prevBead = barBeads[i - 1];
                const gap = rightBead.position - prevBead.position;
                
                if (Math.abs(gap - 1.0) <= tolerance) {
                    // Beads are touching, add to block
                    connectedBeads.push(rightBead.bead);
                } else {
                    // Gap found, stop adding beads
                    break;
                }
            }
        } else {
            // Moving left - check for adjacent beads to the left
            for (let i = currentIndex - 1; i >= 0; i--) {
                const leftBead = barBeads[i];
                const nextBead = barBeads[i + 1];
                const gap = nextBead.position - leftBead.position;
                
                if (Math.abs(gap - 1.0) <= tolerance) {
                    // Beads are touching, add to block
                    connectedBeads.unshift(leftBead.bead);
                } else {
                    // Gap found, stop adding beads
                    break;
                }
            }
        }
        
        console.log(`Connected block for ${bead.id} moving ${direction > 0 ? 'right' : 'left'}:`, 
                   connectedBeads.map(b => b.id));
        
        return connectedBeads;
    }
    
    // Calculate maximum movement for a block of connected beads
    calculateBlockMaxMovement(beads, direction) {
        if (beads.length === 0) return 0;
        
        // Sort beads by position
        const sortedBeads = beads.slice().sort((a, b) => a.position - b.position);
        const leadingBead = direction > 0 ? sortedBeads[sortedBeads.length - 1] : sortedBeads[0];
        
        return this.calculateMaxMovement(leadingBead, direction);
    }
    
    moveBeads(beads, distance) {
        beads.forEach(bead => {
            bead.position += distance;
            this.positionBead(bead);
        });
        this.updateBarState();
    }
    
    // Start momentum animation for a bead with given velocity
    startMomentum(bead, velocity) {
        // Stop any existing momentum for this bead
        this.stopMomentum(bead);
        
        const now = performance.now();
        const momentumData = {
            velocity: velocity,
            lastPosition: bead.position,
            lastTime: now,
            animationId: null
        };
        
        // Start momentum animation
        const animate = (currentTime) => {
            if (!this.momentumBeads.has(bead.id)) return;
            
            const data = this.momentumBeads.get(bead.id);
            const deltaTime = (currentTime - data.lastTime) / 1000; // Convert to seconds
            
            // Apply friction
            const friction = 0.95; // Adjust for how quickly beads slow down
            data.velocity *= Math.pow(friction, deltaTime * 60); // Frame-rate independent
            
            // Stop if velocity is too small
            if (Math.abs(data.velocity) < 0.01) {
                this.stopMomentum(bead);
                this.snapToNearbyBeads(bead);
                return;
            }
            
            // Calculate movement
            const movement = data.velocity * deltaTime;
            const direction = movement > 0 ? 1 : -1;
            
            // Get connected beads and check collision
            const connectedBeads = this.getConnectedBeads(bead, direction);
            const maxMovement = this.calculateBlockMaxMovement(connectedBeads, direction);
            const actualMovement = Math.sign(movement) * Math.min(Math.abs(movement), maxMovement);
            
            if (Math.abs(actualMovement) > 0.001) {
                this.moveBeads(connectedBeads, actualMovement);
                data.lastPosition = bead.position;
            } else {
                // Hit a wall or another bead - stop momentum
                this.stopMomentum(bead);
                this.snapToNearbyBeads(bead);
                return;
            }
            
            data.lastTime = currentTime;
            data.animationId = requestAnimationFrame(animate);
        };
        
        this.momentumBeads.set(bead.id, momentumData);
        momentumData.animationId = requestAnimationFrame(animate);
    }
    
    // Stop momentum animation for a bead
    stopMomentum(bead) {
        const momentumData = this.momentumBeads.get(bead.id);
        if (momentumData) {
            if (momentumData.animationId) {
                cancelAnimationFrame(momentumData.animationId);
            }
            this.momentumBeads.delete(bead.id);
        }
    }
    
    // Calculate dynamic touch target for a bead based on surrounding gaps
    getDynamicTouchTarget(bead) {
        const beadRect = bead.element.getBoundingClientRect();
        const barBeads = this.barState[bead.barIndex];
        const currentIndex = barBeads.findIndex(item => item.bead === bead);
        
        if (currentIndex === -1) {
            // Fallback to standard touch target
            return {
                left: beadRect.left,
                right: beadRect.right,
                top: beadRect.top + beadRect.height/2 - this.beadDiameter,
                bottom: beadRect.top + beadRect.height/2 + this.beadDiameter
            };
        }
        
        // Calculate gaps on both sides
        let leftGap = 0;
        let rightGap = 0;
        
        // Calculate bar bounds in position units
        const barStartX = this.frameImageRect.width * 0.07;
        const barEndX = this.frameImageRect.width * 0.92;
        const barLength = barEndX - barStartX;
        const playableLength = barLength - (2 * this.beadRadius);
        const maxPosition = playableLength / this.beadDiameter;
        
        // Left gap
        if (currentIndex > 0) {
            const leftBead = barBeads[currentIndex - 1];
            leftGap = bead.position - leftBead.position - 1.0; // Subtract 1 for bead width
        } else {
            // Gap to start of bar
            leftGap = bead.position;
        }
        
        // Right gap
        if (currentIndex < barBeads.length - 1) {
            const rightBead = barBeads[currentIndex + 1];
            rightGap = rightBead.position - bead.position - 1.0; // Subtract 1 for bead width
        } else {
            // Gap to end of bar
            rightGap = maxPosition - bead.position;
        }
        
        // Calculate extensions (max 1 diameter, half of available gap)
        const leftExtension = Math.min(this.beadDiameter, (leftGap * this.beadDiameter) / 2);
        const rightExtension = Math.min(this.beadDiameter, (rightGap * this.beadDiameter) / 2);
        
        return {
            left: beadRect.left - leftExtension,
            right: beadRect.right + rightExtension,
            top: beadRect.top + beadRect.height/2 - this.beadDiameter,
            bottom: beadRect.top + beadRect.height/2 + this.beadDiameter
        };
    }
    
    // Enhanced touch target detection with dynamic sizing
    getBeadAtPosition(x, y) {
        for (let bead of this.beads) {
            const touchTarget = this.getDynamicTouchTarget(bead);
            
            if (x >= touchTarget.left && x <= touchTarget.right &&
                y >= touchTarget.top && y <= touchTarget.bottom) {
                return bead;
            }
        }
        return null;
    }
    
    // Set bead touch state with visual feedback
    setBeadTouchState(bead, isTouched) {
        if (bead.isTouched === isTouched) return;
        
        bead.isTouched = isTouched;
        
        if (isTouched) {
            bead.element.classList.add('touched');
            // No pulse animation - just maintain the larger size
        } else {
            bead.element.classList.remove('touched');
        }
    }
    
    // Magnetic snapping with proper 1-diameter gap logic
    snapToNearbyBeads(bead, snapRadius = 1.0) {
        const barBeads = this.barState[bead.barIndex];
        const currentIndex = barBeads.findIndex(item => item.bead === bead);
        
        if (currentIndex === -1) return false;
        
        let snapped = false;
        
        // Calculate bar bounds
        const barStartX = this.frameImageRect.width * 0.07;
        const barEndX = this.frameImageRect.width * 0.92;
        const barLength = barEndX - barStartX;
        const playableLength = barLength - (2 * this.beadRadius);
        const maxPosition = playableLength / this.beadDiameter;
        
        // Check for snapping to nearby beads (1-diameter gap)
        if (currentIndex > 0) {
            const leftBead = barBeads[currentIndex - 1];
            const distance = bead.position - leftBead.position;
            
            if (distance > 0.5 && distance <= 1.0 + snapRadius) {
                const targetPosition = leftBead.position + 1.0;
                if (targetPosition <= maxPosition) {
                    bead.position = targetPosition;
                    this.positionBead(bead);
                    snapped = true;
                    console.log(`Snapped ${bead.id} to right of ${leftBead.bead.id}`);
                }
            }
        }
        
        if (!snapped && currentIndex < barBeads.length - 1) {
            const rightBead = barBeads[currentIndex + 1];
            const distance = rightBead.position - bead.position;
            
            if (distance > 0.5 && distance <= 1.0 + snapRadius) {
                const targetPosition = rightBead.position - 1.0;
                if (targetPosition >= 0) {
                    bead.position = targetPosition;
                    this.positionBead(bead);
                    snapped = true;
                    console.log(`Snapped ${bead.id} to left of ${rightBead.bead.id}`);
                }
            }
        }
        
        // Check for snapping to bar ends
        if (!snapped) {
            if (bead.position <= snapRadius) {
                bead.position = 0;
                this.positionBead(bead);
                snapped = true;
                console.log(`Snapped ${bead.id} to bar start`);
            } else if (bead.position >= maxPosition - snapRadius) {
                bead.position = maxPosition;
                this.positionBead(bead);
                snapped = true;
                console.log(`Snapped ${bead.id} to bar end`);
            }
        }
        
        if (snapped) {
            this.updateBarState();
            this.playSnapSound();
        }
        
        return snapped;
    }
    
    countBeadsOnRightSide() {
        // Calculate the actual bar end position
        const barStartX = this.frameImageRect.width * 0.07;
        const barEndX = this.frameImageRect.width * 0.92;
        const barLength = barEndX - barStartX;
        const playableLength = barLength - (2 * this.beadRadius);
        const maxPosition = playableLength / this.beadDiameter;
        
        let totalRightSideBeads = 0;
        
        // Check each bar separately
        for (let barIndex = 0; barIndex < 2; barIndex++) {
            const barBeads = this.beads.filter(bead => bead.barIndex === barIndex);
            const sortedBeads = barBeads.sort((a, b) => b.position - a.position); // Sort right to left
            
            let rightSideBeadsOnThisBar = 0;
            
            // Count continuous beads from the right end
            for (let i = 0; i < sortedBeads.length; i++) {
                const bead = sortedBeads[i];
                const expectedPosition = maxPosition - i; // Expected position for i-th bead from right
                
                // Check if this bead is in the correct position (within tolerance)
                if (Math.abs(bead.position - expectedPosition) <= 0.3) {
                    rightSideBeadsOnThisBar++;
                } else {
                    // Gap found - stop counting
                    break;
                }
            }
            
            totalRightSideBeads += rightSideBeadsOnThisBar;
        }
        
        console.log(`Total right-side beads: ${totalRightSideBeads}`);
        return totalRightSideBeads;
    }
    
    hasBeadsInMiddle() {
        // Check using the 11-gap criteria: valid arrangement has exactly 10 zero gaps per bar
        // (10 beads can create at most 10 zero gaps, with 1 non-zero gap remaining)
        const tolerance = 0.15; // Increased tolerance - 0.1 should definitely be accepted as zero
        
        console.log(`\n=== CHECKING FOR MIDDLE BEADS ===`);
        
        for (let barIndex = 0; barIndex < 2; barIndex++) {
            const gaps = this.calculateBarGaps(barIndex);
            
            // Count gaps that are effectively zero (within tolerance)
            const zeroGaps = gaps.filter(g => Math.abs(g) < tolerance).length;
            const nonZeroGaps = gaps.filter(g => Math.abs(g) >= tolerance);
            
            console.log(`Bar ${barIndex}: ${zeroGaps}/11 gaps are zero (tolerance: ${tolerance})`);
            console.log(`  All gap values:`, gaps.map((g, i) => `s${i}:${g.toFixed(4)}`));
            console.log(`  Zero gaps (< ${tolerance}):`, gaps.filter(g => Math.abs(g) < tolerance).map(g => g.toFixed(4)));
            console.log(`  Non-zero gaps (>= ${tolerance}):`, nonZeroGaps.map(g => g.toFixed(4)));
            
            // Need exactly 10 zero gaps for valid arrangement
            if (zeroGaps !== 10) {
                console.log(`  ❌ Bar ${barIndex} has middle beads (${zeroGaps} zero gaps, need exactly 10)`);
                console.log(`=== END CHECK - HAS MIDDLE BEADS ===\n`);
                return true; // Has middle beads
            } else {
                console.log(`  ✅ Bar ${barIndex} is valid (exactly 10 zero gaps)`);
            }
        }
        
        console.log(`✅ No middle beads - all bars have valid arrangements`);
        console.log(`=== END CHECK - NO MIDDLE BEADS ===\n`);
        return false; // No middle beads
    }
    
    calculateBarGaps(barIndex) {
        const barBeads = this.barState[barIndex];
        const gaps = new Array(11).fill(0);
        
        // Calculate playable bar bounds
        const barStartX = this.frameImageRect.width * 0.07;
        const barEndX = this.frameImageRect.width * 0.92;
        const barLength = barEndX - barStartX;
        const playableLength = barLength - (2 * this.beadRadius);
        const playableStart = this.beadRadius / this.beadDiameter;
        const playableEnd = playableLength / this.beadDiameter + playableStart;
        
        if (barBeads.length === 0) {
            // No beads - entire playable length is one big gap at s0
            gaps[0] = playableLength / this.beadDiameter;
            return gaps;
        }
        
        // Sort beads by position
        const sortedBeads = [...barBeads].sort((a, b) => a.position - b.position);
        
        // s0: Gap from playable start to left edge of first bead
        const firstBeadLeftEdge = sortedBeads[0].position - 0.5;
        gaps[0] = Math.max(0, firstBeadLeftEdge - playableStart);
        
        // s1 to s(n-1): Gaps between consecutive beads (edge to edge)
        for (let i = 0; i < sortedBeads.length - 1; i++) {
            const currentBeadRightEdge = sortedBeads[i].position + 0.5;
            const nextBeadLeftEdge = sortedBeads[i + 1].position - 0.5;
            const gapSize = nextBeadLeftEdge - currentBeadRightEdge;
            gaps[i + 1] = Math.max(0, gapSize);
        }
        
        // Fill remaining gaps with 0 (for bars with fewer than 10 beads)
        for (let i = sortedBeads.length; i < 10; i++) {
            gaps[i + 1] = 0;
        }
        
        // s10: Gap from right edge of last bead to playable end
        const lastBeadRightEdge = sortedBeads[sortedBeads.length - 1].position + 0.5;
        gaps[10] = Math.max(0, playableEnd - lastBeadRightEdge);
        
        return gaps;
    }
    
    repositionAllBeads() {
        this.updateContainerRect();
        this.beads.forEach(bead => {
            bead.element.style.width = `${this.beadDiameter}px`;
            bead.element.style.height = `${this.beadDiameter}px`;
            this.positionBead(bead);
        });
    }
    
    reset() {
        // Stop all momentum animations
        for (let bead of this.beads) {
            this.stopMomentum(bead);
        }
        this.momentumBeads.clear();
        
        this.initializeBeads();
        this.updateBarState();
    }
    
    playSnapSound() {
        if (!CONFIG.AUDIO_ENABLED) return;
        
        try {
            // Use preloaded audio and reset to beginning for rapid successive plays
            this.clickSound.currentTime = 0;
            this.clickSound.play().catch(error => {
                // Silent failure if audio can't play
                console.log('Click sound failed to play:', error);
            });
        } catch (error) {
            // Silent failure
        }
    }
}
