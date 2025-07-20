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
        
        // NEW: Gap tracking system - 11 gaps per bar (s0 to s10)
        this.barGaps = {
            0: new Array(11).fill(0), // Top bar gaps
            1: new Array(11).fill(0)  // Bottom bar gaps
        };
        
        // Bar state tracking - positions are continuous values along the bar
        this.barState = {
            0: [], // Top bar: array of {bead, position} sorted by position
            1: []  // Bottom bar: array of {bead, position} sorted by position
        };
        
        this.updateContainerRect();
        this.initializeBeads();
        this.updateBarState();
        this.calculateAllGaps();
        
        // Update on window resize
        window.addEventListener('resize', () => {
            this.updateContainerRect();
            this.repositionAllBeads();
        });
    }
    
    calculateAllGaps() {
        // Calculate the 11 gaps for each bar after any bead movement
        for (let barIndex = 0; barIndex < 2; barIndex++) {
            this.barGaps[barIndex] = this.calculateBarGaps(barIndex);
        }
        
        console.log('\n=== GAP TRACKING UPDATE ===');
        console.log(`Top bar gaps:`, this.barGaps[0].map(g => g.toFixed(2)));
        console.log(`Bottom bar gaps:`, this.barGaps[1].map(g => g.toFixed(2)));
        
        // Count zeros for validation
        const topZeros = this.barGaps[0].filter(g => Math.abs(g) < 0.1).length;
        const bottomZeros = this.barGaps[1].filter(g => Math.abs(g) < 0.1).length;
        console.log(`Zero gaps - Top: ${topZeros}/11, Bottom: ${bottomZeros}/11`);
        console.log(`Valid arrangement: ${topZeros === 10 && bottomZeros === 10 ? 'YES' : 'NO'}`);
        console.log('=== END GAP TRACKING ===\n');
    }
    
    calculateBarGaps(barIndex) {
        const barBeads = this.barState[barIndex];
        const gaps = new Array(11).fill(0);
        
        // Calculate playable bar bounds (bar length - 1 radius at each end)
        const barStartX = this.frameImageRect.width * 0.07;
        const barEndX = this.frameImageRect.width * 0.92;
        const barLength = barEndX - barStartX;
        const playableLength = barLength - this.beadRadius - this.beadRadius; // Subtract radius at each end
        const playableStart = this.beadRadius / this.beadDiameter; // Start position in diameter units
        const playableEnd = playableLength / this.beadDiameter + playableStart; // End position in diameter units
        
        console.log(`Bar ${barIndex}: playable from ${playableStart.toFixed(2)} to ${playableEnd.toFixed(2)} (diameter units)`);
        
        if (barBeads.length === 0) {
            // No beads - entire playable length is one big gap at s0
            gaps[0] = playableLength / this.beadDiameter;
            console.log(`Bar ${barIndex} empty - full gap at s0: ${gaps[0].toFixed(2)}`);
            return gaps;
        }
        
        // Sort beads by position
        const sortedBeads = [...barBeads].sort((a, b) => a.position - b.position);
        
        console.log(`Bar ${barIndex} bead positions:`, sortedBeads.map(b => `${b.bead.id}(${b.position.toFixed(2)})`));
        
        // CRITICAL: Use exact bead edge positions for gap calculations
        // s0: Gap from playable start to left edge of first bead
        const firstBeadLeftEdge = sortedBeads[0].position - 0.5;
        gaps[0] = Math.max(0, firstBeadLeftEdge - playableStart);
        
        // s1 to s(n-1): Gaps between consecutive beads (edge to edge)
        for (let i = 0; i < sortedBeads.length - 1; i++) {
            const currentBeadRightEdge = sortedBeads[i].position + 0.5;
            const nextBeadLeftEdge = sortedBeads[i + 1].position - 0.5;
            const gapSize = nextBeadLeftEdge - currentBeadRightEdge;
            gaps[i + 1] = Math.max(0, gapSize);
            
            console.log(`Gap s${i + 1}: from ${sortedBeads[i].bead.id} right edge (${currentBeadRightEdge.toFixed(2)}) to ${sortedBeads[i + 1].bead.id} left edge (${nextBeadLeftEdge.toFixed(2)}) = ${gapSize.toFixed(2)}`);
        }
        
        // Fill remaining gaps with 0 (for bars with fewer than 10 beads)
        for (let i = sortedBeads.length; i < 10; i++) {
            gaps[i + 1] = 0;
        }
        
        // s10: Gap from right edge of last bead to playable end
        const lastBeadRightEdge = sortedBeads[sortedBeads.length - 1].position + 0.5;
        gaps[10] = Math.max(0, playableEnd - lastBeadRightEdge);
        
        console.log(`Bar ${barIndex} calculated gaps:`, gaps.map((g, i) => `s${i}:${g.toFixed(2)}`));
        
        // VALIDATION: Check for any negative gaps (would indicate overlap)
        const negativeGaps = gaps.filter(g => g < -0.01);
        if (negativeGaps.length > 0) {
            console.error(`❌ OVERLAP DETECTED: Negative gaps found on bar ${barIndex}!`);
            console.error(`Gaps:`, gaps.map((g, i) => `s${i}:${g.toFixed(2)}`));
        }
        
        return gaps;
    }
    
    getMovableBlockAndDistance(bead, direction) {
        // Use gap tracking to determine which beads can move together and how far
        const barIndex = bead.barIndex;
        const barBeads = this.barState[barIndex];
        const beadIndex = barBeads.findIndex(item => item.bead === bead);
        
        if (beadIndex === -1) return { beads: [bead], maxDistance: 0 };
        
        const gaps = this.barGaps[barIndex];
        const movableBeads = [bead];
        let maxDistance = 0;
        
        console.log(`\nAnalyzing movement for ${bead.id} in direction ${direction > 0 ? 'right' : 'left'}`);
        console.log(`Bead is at index ${beadIndex} in sorted bar array`);
        console.log(`Current gaps:`, gaps.map((g, i) => `s${i}:${g.toFixed(2)}`));
        
        if (direction > 0) {
            // Moving right - check consecutive zeros to the right
            console.log(`Checking gaps to the right starting from s${beadIndex + 1}...`);
            
            // Count consecutive zero gaps to the right
            let consecutiveZeros = 0;
            for (let i = beadIndex + 1; i < gaps.length - 1; i++) { // Don't include s10 in block detection
                if (Math.abs(gaps[i]) < 0.1) { // Consider < 0.1 as zero (floating point tolerance)
                    consecutiveZeros++;
                    console.log(`  s${i} = ${gaps[i].toFixed(2)} (zero) - adding bead to block`);
                } else {
                    console.log(`  s${i} = ${gaps[i].toFixed(2)} (non-zero) - stopping block detection`);
                    break;
                }
            }
            
            // Add connected beads to the right
            for (let i = 1; i <= consecutiveZeros; i++) {
                if (beadIndex + i < barBeads.length) {
                    movableBeads.push(barBeads[beadIndex + i].bead);
                }
            }
            
            // Maximum distance is the first non-zero gap after the consecutive zeros
            const limitingGapIndex = beadIndex + 1 + consecutiveZeros;
            if (limitingGapIndex < gaps.length) {
                maxDistance = gaps[limitingGapIndex];
            }
            
            console.log(`Found ${consecutiveZeros} consecutive zero gaps to right`);
            console.log(`Limiting gap s${limitingGapIndex} = ${maxDistance.toFixed(2)}`);
            
        } else {
            // Moving left - check consecutive zeros to the left
            console.log(`Checking gaps to the left starting from s${beadIndex}...`);
            
            // Count consecutive zero gaps to the left
            let consecutiveZeros = 0;
            for (let i = beadIndex; i > 0; i--) { // Don't include s0 in block detection
                if (Math.abs(gaps[i]) < 0.1) { // Consider < 0.1 as zero
                    consecutiveZeros++;
                    console.log(`  s${i} = ${gaps[i].toFixed(2)} (zero) - adding bead to block`);
                } else {
                    console.log(`  s${i} = ${gaps[i].toFixed(2)} (non-zero) - stopping block detection`);
                    break;
                }
            }
            
            // Add connected beads to the left
            for (let i = 1; i <= consecutiveZeros; i++) {
                if (beadIndex - i >= 0) {
                    movableBeads.unshift(barBeads[beadIndex - i].bead);
                }
            }
            
            // Maximum distance is the first non-zero gap before the consecutive zeros
            const limitingGapIndex = beadIndex - consecutiveZeros;
            if (limitingGapIndex >= 0) {
                maxDistance = gaps[limitingGapIndex];
            }
            
            console.log(`Found ${consecutiveZeros} consecutive zero gaps to left`);
            console.log(`Limiting gap s${limitingGapIndex} = ${maxDistance.toFixed(2)}`);
        }
        
        console.log(`Movable block: ${movableBeads.map(b => b.id)}, max distance: ${maxDistance.toFixed(2)}`);
        
        return {
            beads: movableBeads,
            maxDistance: Math.max(0, maxDistance)
        };
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
        const barWidth = this.frameImageRect.width * 0.85; // Now 85% width (7% to 92% = 85%)
        const barLeft = this.frameImageRect.x + (this.frameImageRect.width * 0.07); // Start at 7%
        
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
        
        // Update gaps after state change
        this.calculateAllGaps();
        
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
        
        // Calculate bar bounds - Bar goes from 7% to 92% (85% total width)
        const barStartX = this.frameImageRect.width * 0.07;
        const barEndX = this.frameImageRect.width * 0.92; // End stays at 92%
        const usableLength = barEndX - barStartX - (2 * this.beadRadius);
        const maxPosition = usableLength / this.beadDiameter;
        
        console.log(`Block bounds: ${blockStart.toFixed(2)} to ${blockEnd.toFixed(2)}, max position: ${maxPosition.toFixed(2)}, bar: 7%-92% (85% width), usable length: ${usableLength.toFixed(1)}, bead diameter: ${this.beadDiameter.toFixed(1)}`);
        
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
        // Move all beads in the block by the given distance using gap-tracking validation
        console.log(`\nmoveBlock: Moving ${block.length} beads by ${distance.toFixed(3)}`);
        
        // Move each bead in the block
        block.forEach(bead => {
            const oldPosition = bead.position;
            bead.position += distance;
            console.log(`  ${bead.id}: ${oldPosition.toFixed(3)} → ${bead.position.toFixed(3)}`);
            this.positionBead(bead);
        });
        
        // Update bar state and recalculate gaps
        this.updateBarState();
        this.calculateAllGaps();
    }
    
    countBeadsOnRightSide() {
        // Count beads that are properly arranged from the right end with no gaps
        // Using gap tracking: valid arrangement has exactly 10 zero gaps per bar
        
        console.log(`\n=== COUNTING RIGHT-SIDE BEADS (GAP METHOD) ===`);
        
        let totalRightSideBeads = 0;
        const tolerance = 0.15; // Same lenient tolerance as middle beads check
        
        for (let barIndex = 0; barIndex < 2; barIndex++) {
            const gaps = this.barGaps[barIndex];
            const zeroGaps = gaps.filter(g => Math.abs(g) < tolerance).length;
            
            console.log(`Bar ${barIndex}: ${zeroGaps}/11 gaps are effectively zero (tolerance: ${tolerance})`);
            console.log(`  Gap details:`, gaps.map((g, i) => `s${i}:${g.toFixed(4)}`));
            
            if (zeroGaps >= 10) {
                // Valid arrangement - find the largest gap (should be the middle gap)
                const gapSizes = gaps.map((g, i) => ({ index: i, value: Math.abs(g) }));
                const largestGap = gapSizes.reduce((max, current) => 
                    current.value > max.value ? current : max
                );
                
                console.log(`  ✅ VALID: Largest gap is s${largestGap.index} (${largestGap.value.toFixed(4)})`);
                
                // Count beads to the right of the largest gap
                const beadsToRight = 10 - largestGap.index;
                console.log(`  Beads to right of largest gap: ${beadsToRight}`);
                totalRightSideBeads += beadsToRight;
            } else if (zeroGaps === 11) {
                // All gaps zero - means all beads in one spot (error)
                console.log(`  ❌ ERROR: All 11 gaps are zero - beads overlapping!`);
            } else {
                console.log(`  ❌ INVALID: Beads scattered (only ${zeroGaps} zero gaps, need ≥ 10)`);
                
                // Debug: show which gaps are non-zero
                const nonZeroGaps = gaps.map((g, i) => ({ index: i, value: g }))
                    .filter(item => Math.abs(item.value) >= tolerance);
                console.log(`  Non-zero gaps:`, nonZeroGaps.map(item => `s${item.index}:${item.value.toFixed(4)}`));
            }
        }
        
        console.log(`\n*** TOTAL RIGHT-SIDE BEADS: ${totalRightSideBeads} ***`);
        console.log(`Expected for button activation: ${window.sliderGame ? window.sliderGame.expectedBeadsOnRight : 'unknown'}`);
        console.log(`=== END COUNTING ===\n`);
        
        return totalRightSideBeads;
    }
    
    hasBeadsInMiddle() {
        // Using gap tracking: if EACH bar INDIVIDUALLY has exactly 10 zero gaps, 
        // then that bar has no middle beads (beads are in two groups from the ends)
        
        console.log(`\n=== MIDDLE BEADS CHECK (GAP METHOD) ===`);
        
        let hasMiddleBeads = false;
        const tolerance = 0.15; // Much more lenient tolerance (1.5 mm if 1 unit = 1cm)
        
        for (let barIndex = 0; barIndex < 2; barIndex++) {
            const gaps = this.barGaps[barIndex];
            
            // Count gaps that are effectively zero (within tolerance)
            const zeroGaps = gaps.filter(g => Math.abs(g) < tolerance).length;
            
            console.log(`Bar ${barIndex}: ${zeroGaps}/11 gaps are effectively zero (tolerance: ${tolerance})`);
            console.log(`  All gap values:`, gaps.map((g, i) => `s${i}:${g.toFixed(4)}`));
            
            // Also show which gaps are considered "non-zero"
            const nonZeroGaps = gaps.map((g, i) => ({ index: i, value: g }))
                .filter(item => Math.abs(item.value) >= tolerance);
            console.log(`  Non-zero gaps (>=${tolerance}):`, nonZeroGaps.map(item => `s${item.index}:${item.value.toFixed(4)}`));
            
            if (zeroGaps >= 10) {
                // Valid: 10 or 11 gaps are effectively zero
                console.log(`  ✅ Bar ${barIndex} is VALID (${zeroGaps} effectively zero gaps ≥ 10)`);
            } else {
                // Invalid: too many significant gaps
                console.log(`  ❌ Bar ${barIndex} has MIDDLE BEADS (only ${zeroGaps} zero gaps, need ≥ 10)`);
                hasMiddleBeads = true;
            }
        }
        
        console.log(`\n*** FINAL RESULT: ${hasMiddleBeads ? 'HAS MIDDLE BEADS' : 'NO MIDDLE BEADS'} ***`);
        console.log(`=== END MIDDLE BEADS CHECK ===\n`);
        
        return hasMiddleBeads;
    }
    
    snapToNearbyBeads(bead, snapRadius = 1.0) {
        // Check for magnetic snapping to nearby beads or bar ends
        const barBeads = this.barState[bead.barIndex];
        const currentIndex = barBeads.findIndex(item => item.bead === bead);
        
        if (currentIndex === -1) return false;
        
        let snapped = false;
        
        // Calculate bar bounds for end snapping - Bar goes from 7% to 92% (85% width)
        const barStartX = this.frameImageRect.width * 0.07;
        const barEndX = this.frameImageRect.width * 0.92;
        const usableLength = barEndX - barStartX - (2 * this.beadRadius);
        const maxPosition = usableLength / this.beadDiameter;
        
        console.log(`\nSnap check for ${bead.id}: position ${bead.position.toFixed(2)}, max position ${maxPosition.toFixed(2)}`);
        
        // PRIORITY 1: Check for snapping to nearby beads FIRST (most important)
        
        // Check bead to the left - snap to its right side if within range
        if (currentIndex > 0) {
            const leftBead = barBeads[currentIndex - 1];
            const distance = bead.position - leftBead.position;
            console.log(`  Distance to left bead ${leftBead.bead.id}: ${distance.toFixed(3)}`);
            
            if (distance > 0.8 && distance <= 1.0 + snapRadius) {
                const targetPosition = leftBead.position + 1.0;
                console.log(`  Would snap to position ${targetPosition.toFixed(3)} (right of ${leftBead.bead.id})`);
                
                // Check if this position is safe
                let isSafe = true;
                if (currentIndex < barBeads.length - 1) {
                    const rightBead = barBeads[currentIndex + 1];
                    if (rightBead.position - targetPosition < 0.8) {
                        console.log(`  BLOCKED: Right bead ${rightBead.bead.id} too close`);
                        isSafe = false;
                    }
                }
                
                if (isSafe) {
                    bead.position = targetPosition;
                    this.positionBead(bead);
                    snapped = true;
                    console.log(`  ✓ SNAPPED ${bead.id} to right of ${leftBead.bead.id} at ${bead.position.toFixed(2)}`);
                }
            }
        }
        
        // Check bead to the right - snap to its left side if within range
        if (!snapped && currentIndex < barBeads.length - 1) {
            const rightBead = barBeads[currentIndex + 1];
            const distance = rightBead.position - bead.position;
            console.log(`  Distance to right bead ${rightBead.bead.id}: ${distance.toFixed(3)}`);
            
            if (distance > 0.8 && distance <= 1.0 + snapRadius) {
                const targetPosition = rightBead.position - 1.0;
                console.log(`  Would snap to position ${targetPosition.toFixed(3)} (left of ${rightBead.bead.id})`);
                
                // Check if this position is safe
                let isSafe = true;
                if (currentIndex > 0) {
                    const leftBead = barBeads[currentIndex - 1];
                    if (targetPosition - leftBead.position < 0.8) {
                        console.log(`  BLOCKED: Left bead ${leftBead.bead.id} too close`);
                        isSafe = false;
                    }
                }
                
                if (isSafe) {
                    bead.position = targetPosition;
                    this.positionBead(bead);
                    snapped = true;
                    console.log(`  ✓ SNAPPED ${bead.id} to left of ${rightBead.bead.id} at ${bead.position.toFixed(2)}`);
                }
            }
        }
        
        // PRIORITY 2: Only snap to bar ends if NO nearby beads AND position is truly available
        if (!snapped) {
            // Check for snapping to bar start (left end)
            if (bead.position <= snapRadius) {
                // Make sure no other bead is at position 0
                let positionFree = true;
                for (let beadInfo of barBeads) {
                    if (beadInfo.bead !== bead && Math.abs(beadInfo.position - 0) < 0.5) {
                        positionFree = false;
                        break;
                    }
                }
                
                if (positionFree) {
                    bead.position = 0;
                    this.positionBead(bead);
                    snapped = true;
                    console.log(`  ✓ SNAPPED ${bead.id} to bar start`);
                }
            }
            
            // Check for snapping to bar end (right end) - CRITICAL: Check if end position is actually free
            else if (bead.position >= maxPosition - snapRadius) {
                console.log(`  Checking if bar end is available...`);
                
                // Find the rightmost available position by checking existing beads
                let rightmostOccupiedPosition = -1;
                for (let beadInfo of barBeads) {
                    if (beadInfo.bead !== bead) {
                        rightmostOccupiedPosition = Math.max(rightmostOccupiedPosition, beadInfo.position);
                    }
                }
                
                let targetEndPosition;
                if (rightmostOccupiedPosition >= 0) {
                    // There are other beads - position to the left of the rightmost one
                    targetEndPosition = rightmostOccupiedPosition - 1.0;
                    console.log(`  Other beads present, rightmost at ${rightmostOccupiedPosition.toFixed(2)}, targeting ${targetEndPosition.toFixed(2)}`);
                    
                    // But if we're very close to the actual end, and end is free, use the actual end
                    let endIsFree = true;
                    for (let beadInfo of barBeads) {
                        if (beadInfo.bead !== bead && Math.abs(beadInfo.position - maxPosition) < 0.5) {
                            endIsFree = false;
                            break;
                        }
                    }
                    
                    if (endIsFree && bead.position >= maxPosition - 0.5) {
                        targetEndPosition = maxPosition;
                        console.log(`  End position is free and bead is very close, snapping to actual end`);
                    }
                } else {
                    // No other beads - can use the actual end
                    targetEndPosition = maxPosition;
                    console.log(`  No other beads, snapping to actual end`);
                }
                
                // Make sure target position is valid
                if (targetEndPosition >= 0 && targetEndPosition <= maxPosition) {
                    bead.position = targetEndPosition;
                    this.positionBead(bead);
                    snapped = true;
                    console.log(`  ✓ SNAPPED ${bead.id} to position ${bead.position.toFixed(2)} (end area)`);
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
        // Count beads that are properly arranged from the right end with no gaps
        // Only beads in a continuous block starting from the bar end count as "on the right"
        
        // Calculate the actual bar end position where beads should be
        const barStartX = this.frameImageRect.width * 0.07;
        const barEndX = this.frameImageRect.width * 0.92;
        const usableLength = barEndX - barStartX - (2 * this.beadRadius);
        const maxPosition = usableLength / this.beadDiameter;
        
        console.log(`\n=== COUNTING RIGHT-SIDE BEADS ===`);
        console.log(`Bar: 7% to 92% of frame width`);
        console.log(`Frame width: ${this.frameImageRect.width.toFixed(1)}px`);
        console.log(`Bar start: ${(this.frameImageRect.width * 0.07).toFixed(1)}px`);
        console.log(`Bar end: ${(this.frameImageRect.width * 0.92).toFixed(1)}px`);
        console.log(`Usable length: ${usableLength.toFixed(1)}px`);
        console.log(`Bead diameter: ${this.beadDiameter.toFixed(1)}px`);
        console.log(`Max bead position: ${maxPosition.toFixed(2)}`);
        
        let totalRightSideBeads = 0;
        
        // Check each bar separately
        for (let barIndex = 0; barIndex < 2; barIndex++) {
            const barBeads = this.beads.filter(bead => bead.barIndex === barIndex);
            const sortedBeads = barBeads.sort((a, b) => b.position - a.position); // Sort right to left
            
            console.log(`\nBar ${barIndex} beads (right to left):`, sortedBeads.map(b => `${b.id}(${b.position.toFixed(2)})`));
            
            let rightSideBeadsOnThisBar = 0;
            
            // Start from the rightmost bead and count continuous beads from the end
            for (let i = 0; i < sortedBeads.length; i++) {
                const bead = sortedBeads[i];
                const expectedPosition = maxPosition - i; // Expected position for i-th bead from right
                
                console.log(`  Checking ${bead.id}: actual=${bead.position.toFixed(2)}, expected=${expectedPosition.toFixed(2)}, diff=${Math.abs(bead.position - expectedPosition).toFixed(2)}`);
                
                // Check if this bead is in the correct position (within 0.3 tolerance)
                if (Math.abs(bead.position - expectedPosition) <= 0.3) {
                    rightSideBeadsOnThisBar++;
                    console.log(`    ✓ COUNTS as right-side bead #${rightSideBeadsOnThisBar} on this bar`);
                } else {
                    // Gap found - stop counting
                    console.log(`    ✗ GAP DETECTED - stopping count (difference too large)`);
                    break;
                }
            }
            
            totalRightSideBeads += rightSideBeadsOnThisBar;
            console.log(`Bar ${barIndex} contributes ${rightSideBeadsOnThisBar} right-side beads`);
        }
        
        console.log(`\n*** TOTAL RIGHT-SIDE BEADS: ${totalRightSideBeads} ***\n`);
        return totalRightSideBeads;
    }
    
    getBeadsOnBar(barIndex) {
        return this.beads.filter(bead => bead.barIndex === barIndex);
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
