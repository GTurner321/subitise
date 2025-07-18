class SliderRenderer {
    constructor() {
        this.sliderContainer = document.getElementById('sliderContainer');
        this.topBar = document.getElementById('topBar');
        this.bottomBar = document.getElementById('bottomBar');
        this.beads = [];
        this.containerRect = null;
        this.frameImageRect = null;
        
        this.updateContainerRect();
        this.initializeBeads();
        
        // Update container rect on window resize
        window.addEventListener('resize', () => {
            this.updateContainerRect();
            this.repositionAllBeads();
        });
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
        // Move the block while checking for collisions
        // Rule: beads cannot pass through other beads
        
        const barIndex = block[0].barIndex;
        const barBeads = this.getBeadsOnBar(barIndex);
        const otherBeads = barBeads.filter(b => !block.includes(b));
        
        // Calculate where the block wants to go
        const blockStartPos = Math.min(...block.map(b => b.position));
        const blockEndPos = Math.max(...block.map(b => b.position));
        const blockLength = block.length;
        
        const newBlockStartPos = targetPosition;
        const newBlockEndPos = targetPosition + blockLength - 1;
        
        console.log(`Trying to move block from ${blockStartPos.toFixed(1)}-${blockEndPos.toFixed(1)} to ${newBlockStartPos.toFixed(1)}-${newBlockEndPos.toFixed(1)}`);
        
        // Check for collisions with other beads
        let canMove = true;
        let collisionBeads = [];
        
        for (let otherBead of otherBeads) {
            const otherPos = otherBead.position;
            
            // Check if the block would overlap with this bead
            if (newBlockStartPos <= otherPos && otherPos <= newBlockEndPos) {
                canMove = false;
                collisionBeads.push(otherBead);
                console.log(`Collision detected with bead ${otherBead.id} at position ${otherPos.toFixed(1)}`);
            }
        }
        
        if (canMove) {
            // No collisions - move freely
            console.log('No collisions - moving freely');
            this.moveBlockDirectly(block, targetPosition);
        } else {
            // Collision detected - check if we can push the colliding beads
            const direction = targetPosition > blockStartPos ? 1 : -1;
            console.log('Collision detected - checking if we can push beads');
            
            // Try to expand the block to include colliding beads
            const expandedBlock = [...block];
            for (let collisionBead of collisionBeads) {
                if (!expandedBlock.includes(collisionBead)) {
                    expandedBlock.push(collisionBead);
                }
            }
            
            // Sort expanded block
            expandedBlock.sort((a, b) => a.position - b.position);
            
            // Check if the expanded block can move
            const expandedLength = expandedBlock.length;
            const expandedNewStartPos = targetPosition;
            const expandedNewEndPos = targetPosition + expandedLength - 1;
            
            console.log(`Trying to move expanded block (${expandedLength} beads) to ${expandedNewStartPos.toFixed(1)}-${expandedNewEndPos.toFixed(1)}`);
            
            // Check if expanded block would collide with remaining beads
            const remainingBeads = barBeads.filter(b => !expandedBlock.includes(b));
            let expandedCanMove = true;
            
            for (let remainingBead of remainingBeads) {
                if (expandedNewStartPos <= remainingBead.position && remainingBead.position <= expandedNewEndPos) {
                    expandedCanMove = false;
                    console.log(`Expanded block would collide with ${remainingBead.id}`);
                    break;
                }
            }
            
            // Also check bounds
            if (expandedNewStartPos < 0 || expandedNewEndPos > 14) {
                expandedCanMove = false;
                console.log('Expanded block would go out of bounds');
            }
            
            if (expandedCanMove) {
                console.log('Moving expanded block');
                this.moveBlockDirectly(expandedBlock, targetPosition);
            } else {
                console.log('Cannot move - blocked by other beads or bounds');
                // Block is stopped - beads stay where they are
            }
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
        
        for (let i = 0; i < sortedBeads.length - 1; i++) {
            const currentBead = sortedBeads[i];
            const nextBead = sortedBeads[i + 1];
            const distance = nextBead.position - currentBead.position;
            
            // If beads are too close (overlapping), push them apart
            if (distance < 0.9) {
                const overlap = 0.9 - distance;
                const pushDistance = overlap / 2;
                
                console.log(`Resolving overlap between ${currentBead.id} and ${nextBead.id}`);
                
                // Push beads apart equally
                currentBead.position -= pushDistance;
                nextBead.position += pushDistance;
                
                // Make sure we don't push beads too far left
                currentBead.position = Math.max(0, currentBead.position);
            }
        }
        
        // Update visual positions
        sortedBeads.forEach(bead => this.positionBead(bead));
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
