class SliderRenderer {
    constructor() {
        this.sliderContainer = document.getElementById('sliderContainer');
        this.topBar = document.getElementById('topBar');
        this.bottomBar = document.getElementById('bottomBar');
        this.beads = [];
        this.containerRect = null;
        this.frameImageRect = null;
        
        // Position tracking for both bars
        this.beadPositions = {
            0: [], // Top bar bead positions
            1: []  // Bottom bar bead positions
        };
        
        this.updateContainerRect();
        this.initializeBeads();
        this.updateBeadPositionTracking();
        
        // Update container rect on window resize
        window.addEventListener('resize', () => {
            this.updateContainerRect();
            this.repositionAllBeads();
        });
    }
    
    updateBeadPositionTracking() {
        // Update the position tracking arrays for both bars
        for (let barIndex = 0; barIndex < 2; barIndex++) {
            const barBeads = this.getBeadsOnBar(barIndex);
            this.beadPositions[barIndex] = barBeads
                .map(bead => ({
                    id: bead.id,
                    position: bead.position,
                    bead: bead
                }))
                .sort((a, b) => a.position - b.position);
        }
        
        console.log('Updated bead positions:');
        console.log('Top bar:', this.beadPositions[0].map(b => `${b.id}(${b.position.toFixed(2)})`));
        console.log('Bottom bar:', this.beadPositions[1].map(b => `${b.id}(${b.position.toFixed(2)})`));
    }
    
    getConnectedBlock(startBead) {
        // Find all beads connected to the start bead (within 1 diameter)
        const barIndex = startBead.barIndex;
        const barPositions = this.beadPositions[barIndex];
        const beadDiameter = this.beadDiameter;
        const connectionDistance = beadDiameter * 1.1; // Beads within 1.1 diameters are connected
        
        const connectedBeads = [startBead];
        const startPosition = startBead.position;
        
        // Find connected beads to the left
        for (let i = 0; i < barPositions.length; i++) {
            const beadInfo = barPositions[i];
            if (beadInfo.bead === startBead) continue;
            
            const distance = Math.abs(beadInfo.position - startPosition);
            if (distance <= connectionDistance) {
                connectedBeads.push(beadInfo.bead);
            }
        }
        
        // Sort the connected block by position
        connectedBeads.sort((a, b) => a.position - b.position);
        
        console.log('Connected block:', connectedBeads.map(b => `${b.id}(${b.position.toFixed(2)})`));
        return connectedBeads;
    }
    
    calculateAvailableSpace(block, direction) {
        // Calculate available space for the block to move in the given direction
        const barIndex = block[0].barIndex;
        const barPositions = this.beadPositions[barIndex];
        const beadDiameter = this.beadDiameter;
        
        // Get block boundaries
        const blockPositions = block.map(b => b.position).sort((a, b) => a - b);
        const blockStart = blockPositions[0];
        const blockEnd = blockPositions[blockPositions.length - 1];
        
        console.log(`Calculating space for block ${blockStart.toFixed(2)}-${blockEnd.toFixed(2)}, direction: ${direction > 0 ? 'right' : 'left'}`);
        
        // Calculate bar bounds
        const barStartX = this.frameImageRect.x + (this.frameImageRect.width * 0.06);
        const barEndX = this.frameImageRect.x + (this.frameImageRect.width * 0.92);
        const usableBarLength = barEndX - barStartX - (2 * this.beadRadius);
        const maxPosition = usableBarLength / beadDiameter;
        
        let availableSpace = 0;
        
        if (direction > 0) {
            // Moving right - find nearest bead to the right
            let nearestRightBead = null;
            let nearestDistance = Infinity;
            
            for (let beadInfo of barPositions) {
                if (!block.includes(beadInfo.bead) && beadInfo.position > blockEnd) {
                    const distance = beadInfo.position - blockEnd;
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestRightBead = beadInfo;
                    }
                }
            }
            
            if (nearestRightBead) {
                // Space = distance between centers - diameter (to account for both bead radii)
                availableSpace = nearestRightBead.position - blockEnd - beadDiameter;
                console.log(`Nearest right bead: ${nearestRightBead.id} at ${nearestRightBead.position.toFixed(2)}, space: ${availableSpace.toFixed(2)}`);
            } else {
                // No bead to the right - space to bar end
                availableSpace = maxPosition - blockEnd;
                console.log(`No right bead - space to bar end: ${availableSpace.toFixed(2)}`);
            }
        } else {
            // Moving left - find nearest bead to the left
            let nearestLeftBead = null;
            let nearestDistance = Infinity;
            
            for (let beadInfo of barPositions) {
                if (!block.includes(beadInfo.bead) && beadInfo.position < blockStart) {
                    const distance = blockStart - beadInfo.position;
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestLeftBead = beadInfo;
                    }
                }
            }
            
            if (nearestLeftBead) {
                // Space = distance between centers - diameter
                availableSpace = blockStart - nearestLeftBead.position - beadDiameter;
                console.log(`Nearest left bead: ${nearestLeftBead.id} at ${nearestLeftBead.position.toFixed(2)}, space: ${availableSpace.toFixed(2)}`);
            } else {
                // No bead to the left - space to bar start
                availableSpace = blockStart - 0;
                console.log(`No left bead - space to bar start: ${availableSpace.toFixed(2)}`);
            }
        }
        
        // Ensure space is not negative
        availableSpace = Math.max(0, availableSpace);
        console.log(`Final available space: ${availableSpace.toFixed(2)}`);
        
        return availableSpace;
    }
    
    updateContainerRect() {
        this.containerRect = this.sliderContainer.getBoundingClientRect();
        
        // Calculate the actual frame image dimensions within the container
        // The frame image uses "contain" so we need to find its actual rendered size
        const containerAspectRatio = this.containerRect.width / this.containerRect.height;
        const imageAspectRatio = 1516 / 475; // Exact aspect ratio of slider frame (1516x475)
        
        if (containerAspectRatio > imageAspectRatio) {
            // Container is wider than image - image is constrained by height
            this.frameImageRect = {
                width: this.containerRect.height * imageAspectRatio,
                height: this.containerRect.height,
                x: (this.containerRect.width - this.containerRect.height * imageAspectRatio) / 2,
                y: 0
            };
        } else {
            // Container is taller than image - image is constrained by width
            this.frameImageRect = {
                width: this.containerRect.width,
                height: this.containerRect.width / imageAspectRatio,
                x: 0,
                y: (this.containerRect.height - this.containerRect.width / imageAspectRatio) / 2
            };
        }
        
        // Calculate bead diameter as 12% of frame image height, then make it 20% larger
        this.beadDiameter = this.frameImageRect.height * 0.12 * 1.2; // 20% larger
        this.beadRadius = this.beadDiameter / 2;
        
        // Update bar dimensions
        this.updateBarDimensions();
    }
    
    updateBarDimensions() {
        if (!this.frameImageRect) return;
        
        const barHeight = this.frameImageRect.height * 0.05; // 5% of frame height
        const barWidth = this.frameImageRect.width * 0.86; // 86% of frame width
        const barLeft = this.frameImageRect.x + (this.frameImageRect.width * 0.06); // 6% from left of frame
        
        // Top bar at 34% of frame height
        const topBarTop = this.frameImageRect.y + (this.frameImageRect.height * 0.34);
        this.topBar.style.position = 'absolute';
        this.topBar.style.left = `${barLeft}px`;
        this.topBar.style.top = `${topBarTop}px`;
        this.topBar.style.width = `${barWidth}px`;
        this.topBar.style.height = `${barHeight}px`;
        
        // Bottom bar at 60% of frame height
        const bottomBarTop = this.frameImageRect.y + (this.frameImageRect.height * 0.60);
        this.bottomBar.style.position = 'absolute';
        this.bottomBar.style.left = `${barLeft}px`;
        this.bottomBar.style.top = `${bottomBarTop}px`;
        this.bottomBar.style.width = `${barWidth}px`;
        this.bottomBar.style.height = `${barHeight}px`;
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
        for (let bar = 0; bar < 2; bar++) {
            for (let i = 0; i < CONFIG.BEADS_PER_BAR; i++) {
                const bead = this.createBead(bar, i);
                this.beads.push(bead);
            }
        }
    }
    
    createBead(barIndex, beadIndex) {
        const beadElement = document.createElement('div');
        beadElement.className = 'bead';
        
        // Set circular size - diameter is 12% of frame image height
        beadElement.style.width = `${this.beadDiameter}px`;
        beadElement.style.height = `${this.beadDiameter}px`;
        beadElement.style.position = 'absolute';
        
        // Color: first 5 blue, last 5 red on each bar
        const isBlue = beadIndex < 5;
        beadElement.classList.add(isBlue ? 'blue' : 'red');
        
        // Initial position: All beads start on the left, aligned with no gaps
        // Positions 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 (consecutive, no overlapping)
        const startPosition = beadIndex;
        
        const bead = {
            element: beadElement,
            barIndex: barIndex, // 0 = top, 1 = bottom
            position: startPosition, // Consecutive positions 0-9
            id: `bead-${barIndex}-${beadIndex}`,
            isDragging: false,
            isBlue: isBlue
        };
        
        // Set initial position
        this.positionBead(bead);
        
        this.sliderContainer.appendChild(beadElement);
        return bead;
    }
    
    positionBead(bead) {
        if (!this.frameImageRect) return;
        
        const barY = bead.barIndex === 0 ? 0.34 : 0.60; // 34% or 60% of frame height
        
        // Calculate bead center position based on frame image dimensions
        // First bead center is at 6% margin + 6% radius = 12% from left edge of frame
        const beadCenterX = this.frameImageRect.x + 
                           (this.frameImageRect.width * 0.06) + // Left margin
                           this.beadRadius + // Half bead width to center
                           (bead.position * this.beadDiameter); // Spacing between beads
        
        const beadCenterY = this.frameImageRect.y + (this.frameImageRect.height * barY);
        
        // Position bead so its center is at the calculated position
        const beadLeft = beadCenterX - this.beadRadius;
        const beadTop = beadCenterY - this.beadRadius;
        
        bead.element.style.left = `${beadLeft}px`;
        bead.element.style.top = `${beadTop}px`;
    }
    
    repositionAllBeads() {
        this.updateContainerRect(); // Recalculate dimensions
        this.beads.forEach(bead => {
            if (!bead.isDragging) {
                // Update bead size for new container dimensions
                bead.element.style.width = `${this.beadDiameter}px`;
                bead.element.style.height = `${this.beadDiameter}px`;
                this.positionBead(bead);
            }
        });
    }
    
    getBeadAtPosition(x, y) {
        // Convert screen coordinates to check against bead positions
        for (let bead of this.beads) {
            const beadRect = bead.element.getBoundingClientRect();
            
            if (x >= beadRect.left && 
                x <= beadRect.right &&
                y >= beadRect.top && 
                y <= beadRect.bottom) {
                return bead;
            }
        }
        return null;
    }
    
    getBeadsOnBar(barIndex) {
        return this.beads.filter(bead => bead.barIndex === barIndex);
    }
    
    getBeadsAtPosition(barIndex, position) {
        return this.beads.filter(bead => 
            bead.barIndex === barIndex && 
            Math.abs(bead.position - position) < 0.1
        );
    }
    
    moveBeadToPosition(bead, newPosition, animate = true) {
        // Clamp position to valid range
        newPosition = Math.max(0, Math.min(CONFIG.BEADS_PER_BAR - 1, newPosition));
        
        bead.position = newPosition;
        
        if (animate) {
            bead.element.style.transition = 'left 0.2s ease-out, top 0.2s ease-out';
            setTimeout(() => {
                bead.element.style.transition = 'none';
            }, 200);
        }
        
        this.positionBead(bead);
    }
    
    getConnectedBeads(startBead) {
        const connectedBeads = [startBead];
        const barBeads = this.getBeadsOnBar(startBead.barIndex)
            .sort((a, b) => a.position - b.position);
        
        const startIndex = barBeads.indexOf(startBead);
        
        // Check left connected beads (consecutive positions)
        for (let i = startIndex - 1; i >= 0; i--) {
            if (Math.abs(barBeads[i].position - barBeads[i + 1].position) < 1.1) {
                connectedBeads.unshift(barBeads[i]);
            } else {
                break;
            }
        }
        
        // Check right connected beads (consecutive positions)
        for (let i = startIndex + 1; i < barBeads.length; i++) {
            if (Math.abs(barBeads[i].position - barBeads[i - 1].position) < 1.1) {
                connectedBeads.push(barBeads[i]);
            } else {
                break;
            }
        }
        
        return connectedBeads;
    }
    
    getInitialMovingBlock(draggedBead, direction) {
        // Determine which beads form the initial block that should move together
        // This includes the dragged bead and any beads it's directly touching
        const block = [draggedBead];
        const barBeads = this.getBeadsOnBar(draggedBead.barIndex);
        const touchDistance = 1.1; // Beads within 1.1 positions are considered touching
        
        // Find beads that are touching the dragged bead
        for (let otherBead of barBeads) {
            if (otherBead === draggedBead) continue;
            
            const distance = Math.abs(otherBead.position - draggedBead.position);
            if (distance <= touchDistance) {
                block.push(otherBead);
            }
        }
        
        // Sort block by position
        block.sort((a, b) => a.position - b.position);
        
        console.log('Initial moving block:', block.map(b => `${b.id}(${b.position.toFixed(1)})`));
        return block;
    }
    
    moveBlockWithCollisions(block, targetPosition) {
        // Move the block while checking for collisions (continuous movement)
        const barIndex = block[0].barIndex;
        const barBeads = this.getBeadsOnBar(barIndex);
        const otherBeads = barBeads.filter(b => !block.includes(b));
        
        // Calculate bar bounds
        const barStartX = this.frameImageRect.x + (this.frameImageRect.width * 0.06);
        const barEndX = this.frameImageRect.x + (this.frameImageRect.width * 0.92);
        const usableBarLength = barEndX - barStartX - (2 * this.beadRadius);
        const maxPosition = usableBarLength / this.beadDiameter;
        
        // Calculate where the block wants to go
        const blockStartPos = Math.min(...block.map(b => b.position));
        const blockEndPos = Math.max(...block.map(b => b.position));
        const blockLength = block.length;
        
        const newBlockStartPos = targetPosition;
        const newBlockEndPos = targetPosition + blockLength - 1;
        
        console.log(`Trying to move block from ${blockStartPos.toFixed(2)}-${blockEndPos.toFixed(2)} to ${newBlockStartPos.toFixed(2)}-${newBlockEndPos.toFixed(2)}`);
        
        // Check bounds first
        if (newBlockStartPos < 0 || newBlockEndPos > maxPosition) {
            console.log('Block would go out of bounds - clamping');
            const clampedStart = Math.max(0, Math.min(maxPosition - blockLength + 1, targetPosition));
            this.moveBlockDirectly(block, clampedStart);
            return;
        }
        
        // Check for collisions with other beads
        let canMove = true;
        let collisionBeads = [];
        const collisionBuffer = 0.9; // Beads need at least 0.9 units spacing
        
        for (let otherBead of otherBeads) {
            const otherPos = otherBead.position;
            
            // Check if the block would overlap or get too close to this bead
            if ((newBlockStartPos - collisionBuffer) <= otherPos && otherPos <= (newBlockEndPos + collisionBuffer)) {
                canMove = false;
                collisionBeads.push(otherBead);
                console.log(`Collision detected with bead ${otherBead.id} at position ${otherPos.toFixed(2)}`);
            }
        }
        
        if (canMove) {
            // No collisions - move freely
            console.log('No collisions - moving freely');
            this.moveBlockDirectly(block, targetPosition);
        } else {
            // Collision detected - find maximum possible movement
            const direction = targetPosition > blockStartPos ? 1 : -1;
            console.log('Collision detected - finding maximum movement');
            
            this.findMaximumMovement(block, targetPosition, direction, otherBeads);
        }
    }
    
    moveBlockDirectly(block, targetPosition) {
        // Move beads directly to the target position 
        console.log('moveBlockDirectly:', block.length, 'beads to position', targetPosition);
        
        // Move each bead in the block to consecutive positions
        block.forEach((bead, index) => {
            const newPosition = targetPosition + index;
            // Clamp to new bounds (0 to 19 positions, covering 6% to 92% of bar)
            const clampedPosition = Math.max(0, Math.min(19, newPosition));
            
            console.log(`Moving bead ${bead.id} to position ${clampedPosition.toFixed(1)}`);
            bead.position = clampedPosition;
            this.positionBead(bead);
        });
    }
    
    findMaximumMovement(block, targetPosition, direction, otherBeads) {
        // Find the maximum distance the block can move without collision
        const blockStartPos = Math.min(...block.map(b => b.position));
        const blockEndPos = Math.max(...block.map(b => b.position));
        const blockLength = block.length;
        
        let maxPosition = targetPosition;
        const collisionBuffer = 0.9;
        const maxBarPosition = 19; // Updated to new maximum position
        
        if (direction > 0) {
            // Moving right - find the nearest bead on the right
            let nearestRightBead = null;
            let nearestDistance = Infinity;
            
            for (let otherBead of otherBeads) {
                if (otherBead.position > blockEndPos) {
                    const distance = otherBead.position - blockEndPos;
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestRightBead = otherBead;
                    }
                }
            }
            
            if (nearestRightBead) {
                maxPosition = Math.min(targetPosition, nearestRightBead.position - blockLength - collisionBuffer + blockStartPos);
            }
            
            // Also check bounds (position 19 is at 92% of bar)
            maxPosition = Math.min(maxPosition, maxBarPosition - blockLength + 1);
        } else {
            // Moving left - find the nearest bead on the left
            let nearestLeftBead = null;
            let nearestDistance = Infinity;
            
            for (let otherBead of otherBeads) {
                if (otherBead.position < blockStartPos) {
                    const distance = blockStartPos - otherBead.position;
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestLeftBead = otherBead;
                    }
                }
            }
            
            if (nearestLeftBead) {
                maxPosition = Math.max(targetPosition, nearestLeftBead.position + collisionBuffer);
            }
            
            // Also check bounds
            maxPosition = Math.max(maxPosition, 0);
        }
        
        // Only move if there's actual movement possible
        if (Math.abs(maxPosition - blockStartPos) > 0.1) {
            console.log(`Moving to maximum position: ${maxPosition.toFixed(1)}`);
            this.moveBlockDirectly(block, maxPosition);
        } else {
            console.log('No movement possible - already at maximum position');
        }
    }
    
    canBlockMoveToPosition(block, targetPosition, direction) {
        // Simplified logic: beads can always move if there's physical space
        // They can push other beads forward
        if (block.length === 0) return false;
        
        // Check bounds with extended range
        const maxAvailablePositions = 15; // Allow more positions for movement
        const leftmostPosition = targetPosition;
        const rightmostPosition = targetPosition + block.length - 1;
        
        // Make sure we don't go out of bounds
        if (leftmostPosition < 0 || rightmostPosition >= maxAvailablePositions) {
            return false;
        }
        
        return true; // Always allow movement within bounds
    }
    
    findNearestValidPosition(block, targetPosition, direction) {
        // Allow movement to the target position, just ensure it's within bounds
        let testPosition = targetPosition;
        
        // The bar has positions 0 through 9, but we need to allow beads to move
        // beyond the initial 10 positions. Let's increase the available space.
        const maxAvailablePositions = 15; // Allow more positions for movement
        const maxPosition = maxAvailablePositions - block.length;
        
        // Only clamp if we're really going out of bounds
        testPosition = Math.max(0, Math.min(maxPosition, testPosition));
        
        console.log(`findNearestValidPosition: target=${targetPosition}, clamped=${testPosition}, maxPos=${maxPosition}`);
        
        return testPosition;
    }
    
    moveBlockToPosition(block, targetPosition) {
        console.log('moveBlockToPosition called with:', block.length, 'beads, target:', targetPosition);
        
        // Move all beads in the block to consecutive positions starting from targetPosition
        // Also handle pushing other beads out of the way
        
        const barIndex = block[0].barIndex;
        const barBeads = this.getBeadsOnBar(barIndex);
        const otherBeads = barBeads.filter(b => !block.includes(b));
        
        console.log('Other beads on bar:', otherBeads.length);
        
        // Calculate the positions this block will occupy
        const blockPositions = [];
        for (let i = 0; i < block.length; i++) {
            blockPositions.push(targetPosition + i);
        }
        
        console.log('Block will occupy positions:', blockPositions);
        
        // Find any beads that would be displaced and push them
        for (let otherBead of otherBeads) {
            const otherPosition = Math.round(otherBead.position);
            
            // Check if this bead is in the way
            if (blockPositions.includes(otherPosition)) {
                console.log('Pushing bead', otherBead.id, 'from position', otherPosition);
                
                // Push the bead out of the way
                // Find the nearest free position
                let newPosition = otherPosition;
                
                // Try to push right first
                while (newPosition < CONFIG.BEADS_PER_BAR) {
                    if (!blockPositions.includes(newPosition) && 
                        !otherBeads.some(b => b !== otherBead && Math.round(b.position) === newPosition)) {
                        break;
                    }
                    newPosition++;
                }
                
                // If couldn't push right, try left
                if (newPosition >= CONFIG.BEADS_PER_BAR) {
                    newPosition = otherPosition;
                    while (newPosition >= 0) {
                        if (!blockPositions.includes(newPosition) && 
                            !otherBeads.some(b => b !== otherBead && Math.round(b.position) === newPosition)) {
                            break;
                        }
                        newPosition--;
                    }
                }
                
                // Move the displaced bead
                if (newPosition >= 0 && newPosition < CONFIG.BEADS_PER_BAR) {
                    console.log('Moved displaced bead to position:', newPosition);
                    otherBead.position = newPosition;
                    this.positionBead(otherBead);
                }
            }
        }
        
        // Now move the block to its target position
        console.log('Moving block to target positions starting at:', targetPosition);
        block.forEach((bead, index) => {
            const newPosition = targetPosition + index;
            const clampedPosition = Math.max(0, Math.min(14, newPosition)); // Allow positions 0-14
            console.log(`Moving bead ${bead.id} from ${bead.position} to ${clampedPosition}`);
            bead.position = clampedPosition;
            this.positionBead(bead);
        });
    }
    
    moveBlockDirectly(block, targetPosition) {
        // Move beads directly to the target position 
        console.log('moveBlockDirectly:', block.length, 'beads to position', targetPosition);
        
        // Move each bead in the block to consecutive positions
        block.forEach((bead, index) => {
            const newPosition = targetPosition + index;
            // Clamp to reasonable bounds
            const clampedPosition = Math.max(0, Math.min(14, newPosition));
            
            console.log(`Moving bead ${bead.id} to position ${clampedPosition.toFixed(1)}`);
            bead.position = clampedPosition;
            this.positionBead(bead);
        });
    }
    
    applyMagneticSnapping(movingBlock) {
        // Apply magnetic snapping only to nearby beads within magnetic range
        const magneticRange = 0.7; // Magnetic attraction range
        const barIndex = movingBlock[0].barIndex;
        const barBeads = this.getBeadsOnBar(barIndex);
        const otherBeads = barBeads.filter(b => !movingBlock.includes(b));
        
        for (let movingBead of movingBlock) {
            for (let otherBead of otherBeads) {
                const distance = Math.abs(movingBead.position - otherBead.position);
                
                if (distance <= magneticRange && distance > 0.1) {
                    console.log(`Magnetic snap: ${movingBead.id} to ${otherBead.id}, distance: ${distance}`);
                    
                    // Snap to the other bead's position (with small offset to avoid overlap)
                    if (movingBead.position < otherBead.position) {
                        movingBead.position = otherBead.position - 1.0; // Snap to left side
                    } else {
                        movingBead.position = otherBead.position + 1.0; // Snap to right side
                    }
                    
                    this.playSnapSound();
                    break; // Only snap to one bead
                }
            }
        }
    }
    
    resolveOverlaps(barIndex) {
        // Resolve any overlapping beads by pushing them apart
        const barBeads = this.getBeadsOnBar(barIndex);
        const sortedBeads = barBeads.sort((a, b) => a.position - b.position);
        const minSpacing = 1.0; // Minimum spacing between beads
        
        console.log('Resolving overlaps for bar', barIndex);
        
        // Multiple passes to ensure all overlaps are resolved
        for (let pass = 0; pass < 3; pass++) {
            let hasOverlaps = false;
            
            for (let i = 0; i < sortedBeads.length - 1; i++) {
                const currentBead = sortedBeads[i];
                const nextBead = sortedBeads[i + 1];
                const distance = nextBead.position - currentBead.position;
                
                // If beads are too close, push them apart
                if (distance < minSpacing) {
                    hasOverlaps = true;
                    const overlap = minSpacing - distance;
                    const pushDistance = overlap / 2;
                    
                    console.log(`Pass ${pass}: Resolving overlap between ${currentBead.id} and ${nextBead.id}, distance: ${distance.toFixed(2)}`);
                    
                    // Push beads apart equally, but respect bounds
                    const newCurrentPos = currentBead.position - pushDistance;
                    const newNextPos = nextBead.position + pushDistance;
                    
                    // Make sure we don't push beads out of bounds
                    if (newCurrentPos >= 0) {
                        currentBead.position = newCurrentPos;
                    } else {
                        // If current bead can't move left, push next bead further right
                        currentBead.position = 0;
                        nextBead.position = minSpacing;
                    }
                    
                    if (newNextPos <= 19) {
                        nextBead.position = newNextPos;
                    } else {
                        // If next bead can't move right, push current bead further left
                        nextBead.position = 19;
                        currentBead.position = 19 - minSpacing;
                    }
                }
            }
            
            // Re-sort after position changes
            sortedBeads.sort((a, b) => a.position - b.position);
            
            if (!hasOverlaps) break; // No more overlaps found
        }
        
        // Update visual positions
        sortedBeads.forEach(bead => {
            this.positionBead(bead);
            console.log(`Final position: ${bead.id} at ${bead.position.toFixed(2)}`);
        });
    }
    
    countBeadsOnRightSide() {
        let rightSideCount = 0;
        const threshold = CONFIG.BEADS_PER_BAR / 2; // Middle point
        
        this.beads.forEach(bead => {
            if (bead.position >= threshold) {
                rightSideCount++;
            }
        });
        
        return rightSideCount;
    }
    
    hasBeadsInMiddle() {
        // Check if there are any beads isolated in the middle
        const leftThreshold = 2; // First 2 positions are "left"
        const rightThreshold = CONFIG.BEADS_PER_BAR - 3; // Last 2 positions are "right"
        
        for (let barIndex = 0; barIndex < 2; barIndex++) {
            const barBeads = this.getBeadsOnBar(barIndex);
            
            for (let bead of barBeads) {
                if (bead.position > leftThreshold && bead.position < rightThreshold) {
                    // Check if this bead is connected to others on left or right
                    const connectedBeads = this.getConnectedBeads(bead);
                    const minPos = Math.min(...connectedBeads.map(b => b.position));
                    const maxPos = Math.max(...connectedBeads.map(b => b.position));
                    
                    // If the connected group doesn't extend to left or right edge, it's in middle
                    if (minPos > leftThreshold && maxPos < rightThreshold) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    reset() {
        this.initializeBeads();
    }
    
    playSnapSound() {
        // Metallic clicking sound like two metal balls tapping
        if (CONFIG.AUDIO_ENABLED) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // Create a sharp metallic click - high frequency, quick decay
                oscillator.frequency.setValueAtTime(2000, audioContext.currentTime); // High pitched
                oscillator.frequency.exponentialRampToValueAtTime(1500, audioContext.currentTime + 0.02);
                oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.05);
                
                // Sharp attack, quick decay like metal balls tapping
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.005); // Quick attack
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08); // Quick decay
                
                oscillator.type = 'triangle'; // Softer than square, more metallic than sine
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.08);
            } catch (error) {
                // Silent failure
            }
        }
    }
}
