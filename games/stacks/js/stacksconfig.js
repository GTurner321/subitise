// Stacks Game Configuration - Fixed paths and percentage-based positioning
const STACKS_CONFIG = {
    // Game dimensions (percentage of viewport) - FIXED: Proper square blocks
    BLOCK_HEIGHT_PERCENT: 9.6,  // 9.6% of viewport height
    BLOCK_WIDTH_PERCENT: 9.6,   // SAME as height for truly square blocks
    BLOCK_WIDTH_WIDE_PERCENT: 11.5, // Slightly larger for 3-digit numbers
    
    // Tower positioning (percentage of viewport)
    TOWER_CENTER_X_PERCENT: 50,     // 50% from left
    TOWER_BASE_Y_PERCENT: 87.2,     // Moved down (75% of a block lower)
    COMPLETED_TOWER_LEFT_X_PERCENT: 10,
    COMPLETED_TOWER_RIGHT_X_PERCENT: 90,
    COMPLETED_TOWER_SPACING_PERCENT: 12, // Spacing for square blocks
    
    // Block positioning on ground - UPDATED: Raised grass area to match visual grass
    GROUND_Y_MIN_PERCENT: 75,       // RAISED: Top of grass area (was 89, now 75)
    GROUND_Y_MAX_PERCENT: 82,       // RAISED: Bottom of grass area (was 92, now 82)
    GROUND_Y_PERCENT: 78.5,         // RAISED: Default ground level (middle of grass area)
    GROUND_SPREAD_PERCENT: 70,      // Spread across screen
    GROUND_EXCLUSION_ZONE_PERCENT: 15, // Area around tower to avoid
    
    // Initial block placement variance
    INITIAL_BLOCK_Y_VARIANCE_PERCENT: 1.5, // ±1.5% height variance for initial blocks
    
    // Teddy size multiplier
    TEDDY_SIZE_MULTIPLIER: 2.3,      // 15% larger (was 2.0, now 2.3 = 2.0 * 1.15)
    
    // Font size multiplier for numbers in blocks
    BLOCK_FONT_SIZE_MULTIPLIER: 1.2, // 20% larger font size
    
    // Drag and drop settings - UPDATED: More forgiving tolerances
    DRAG_TOLERANCE_PERCENT: 4, // Increased from 3 to make targeting easier
    HOVER_TRANSFORM_PERCENT: 0.5,
    
    // Drop area settings - NEW: More forgiving drop detection
    DROP_OVERLAP_THRESHOLD: 0.5, // 50% overlap required (down from implied 100%)
    
    // Front exclusion zone - NEW: Prevent blocks in front of tower
    FRONT_EXCLUSION_ZONE_PERCENT: 20, // 20% exclusion zone in front of tower
    
    // Animation timings
    TOWER_MOVE_DELAY: 3000,
    BLOCK_ANIMATION_DURATION: 500,
    TEDDY_APPEAR_DELAY: 1000,
    
    // Completed tower opacity
    COMPLETED_TOWER_OPACITY: 0.75,
    
    // Level system
    LEVELS: {
        1: {
            name: "Level 1",
            description: "Numbers 1-10, consecutive",
            generateNumbers: (count) => generateConsecutiveNumbers(1, 10, count),
            moveThreshold: 2
        },
        2: {
            name: "Level 2", 
            description: "Numbers 1-12, non-consecutive",
            generateNumbers: (count) => generateNonConsecutiveNumbers(1, 12, count),
            moveThreshold: 2
        },
        3: {
            name: "Level 3",
            description: "Numbers 11-20, consecutive", 
            generateNumbers: (count) => generateConsecutiveNumbers(11, 20, count),
            moveThreshold: 2
        },
        4: {
            name: "Level 4",
            description: "Multiples of 10",
            generateNumbers: (count) => generateFromSet([10,20,30,40,50,60,70,80,90], count),
            moveThreshold: 2
        },
        5: {
            name: "Level 5",
            description: "Numbers 1-99",
            generateNumbers: (count) => generateRandomNumbers(1, 99, count),
            moveThreshold: 2
        },
        6: {
            name: "Level 6", 
            description: "Hundreds (##0)",
            generateNumbers: (count) => generateHundreds(count),
            moveThreshold: 2,
            useWideBlocks: true
        },
        7: {
            name: "Level 7",
            description: "Numbers 1-99 (Advanced)",
            generateNumbers: (count) => generateRandomNumbers(1, 99, count),
            moveThreshold: 2
        },
        8: {
            name: "Level 8",
            description: "Numbers 1-999",
            generateNumbers: (count) => generateRandomNumbers(1, 999, count),
            moveThreshold: 2,
            useWideBlocks: true
        }
    },
    
    // Colors for blocks
    BLOCK_COLORS: [
        '#FF6B9D', '#4ECDC4', '#45B7D1', '#FFA726', '#66BB6A', 
        '#AB47BC', '#EF5350', '#26C6DA', '#FFCA28', '#8D6E63', 
        '#78909C', '#FF7043'
    ],
    
    // Container styling
    CONTAINER_COLOR: '#E0E0E0',
    CONTAINER_STROKE: '#BDBDBD',
    CONTAINER_STROKE_WIDTH: 2,
    
    // FIXED: Teddy images with correct paths matching your working Teddy Trumps game
    TEDDY_IMAGES: [
        '../../assets/trumps/blackbear.png',      // Fixed: matches working Teddy Trumps pattern
        '../../assets/trumps/dinosaur.png', 
        '../../assets/trumps/flabberjabber.png',
        '../../assets/raisin/guineapig1.png',
        '../../assets/bear.png',
        '../../assets/trumps/vowels.png',
        '../../assets/trumps/gemsbear.png',
        '../../assets/trumps/knightbear.png'
    ],
    
    // Audio settings
    AUDIO_ENABLED: true,
    
    // Rainbow settings
    RAINBOW_PIECES: 10,
    RAINBOW_COLORS: [
        '#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00', 
        '#00ff80', '#00ffff', '#0080ff', '#0000ff', '#8000ff'
    ],
    
    // Game settings
    TOTAL_QUESTIONS: 8,
    FINAL_RAINBOW_ARCS: 3
};

// Helper function to generate position close to tower for displaced blocks
function generateCloseToTowerPosition() {
    const towerCenterX = STACKS_CONFIG.TOWER_CENTER_X_PERCENT;
    const displacementRange = 20; // 20% of game area on each side
    
    // Calculate bounds: tower center ± 20%
    const leftBound = Math.max(5, towerCenterX - displacementRange);
    const rightBound = Math.min(95, towerCenterX + displacementRange);
    
    // Generate random X within the close-to-tower area
    const x = leftBound + Math.random() * (rightBound - leftBound);
    
    // Generate Y in TOP 50% of grass area (front layer for displaced blocks)
    const grassTop = STACKS_CONFIG.GROUND_Y_MIN_PERCENT;
    const grassHeight = STACKS_CONFIG.GROUND_Y_MAX_PERCENT - grassTop;
    const y = grassTop + Math.random() * (grassHeight * 0.5); // Top 50% of grass
    
    console.log('Generated close-to-tower position:', x.toFixed(1) + '%,', y.toFixed(1) + '%', 
                '(tower at', towerCenterX + '%, range:', leftBound.toFixed(1) + '%-' + rightBound.toFixed(1) + '%)');
    
    return { x, y };
}

// Helper function to generate random ground position with proper spacing and height variance
function generateRandomGroundPosition(existingBlocks = [], isInitialPlacement = false) {
    const centerX = STACKS_CONFIG.TOWER_CENTER_X_PERCENT;
    const exclusionZone = STACKS_CONFIG.GROUND_EXCLUSION_ZONE_PERCENT;
    const spread = STACKS_CONFIG.GROUND_SPREAD_PERCENT;
    const blockWidth = STACKS_CONFIG.BLOCK_WIDTH_PERCENT;
    const minDistance = blockWidth * 0.75; // 75% minimum distance (max 25% overlap)
    
    // Grass area bounds
    const grassTop = STACKS_CONFIG.GROUND_Y_MIN_PERCENT;
    const grassBottom = STACKS_CONFIG.GROUND_Y_MAX_PERCENT;
    const grassHeight = grassBottom - grassTop;
    const grassMidpoint = grassTop + (grassHeight * 0.5); // 50% down grass area
    
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
        let x;
        do {
            // Generate random X within the spread area
            x = (50 - spread/2) + Math.random() * spread;
        } while (Math.abs(x - centerX) < exclusionZone); // Avoid tower area
        
        // Check for overlap with existing blocks
        let overlappingBlock = null;
        let hasOverlap = false;
        
        for (let block of existingBlocks) {
            const distance = Math.abs(x - block.x);
            if (distance < minDistance) {
                hasOverlap = true;
                // Find the frontmost (lowest Y/highest on screen) overlapping block
                if (!overlappingBlock || block.y > overlappingBlock.y) {
                    overlappingBlock = block;
                }
            }
        }
        
        let y;
        if (isInitialPlacement) {
            // INITIAL PLACEMENT: All blocks get varied heights in back layer
            const baseY = grassTop + (grassHeight * 0.25); // Start 25% down grass
            const variance = STACKS_CONFIG.INITIAL_BLOCK_Y_VARIANCE_PERCENT;
            y = baseY + (Math.random() - 0.5) * variance * 2; // ±variance around base
            
            // Ensure it stays within grass bounds
            y = Math.max(grassTop, Math.min(y, grassMidpoint));
            
        } else if (hasOverlap && overlappingBlock) {
            // PERSPECTIVE LAYERING: Place IN FRONT of (lower/closer than) the overlapping block
            const overlapBlockPosition = overlappingBlock.y;
            
            // New block goes from overlapping block's position to 50% down grass (closer to viewer)
            const minY = overlapBlockPosition; // Start from overlapping block's position
            const maxY = grassMidpoint; // Go to 50% down grass
            
            if (minY >= maxY) {
                // Edge case: overlapping block is already at or past 50% down
                y = maxY;
            } else {
                y = minY + Math.random() * (maxY - minY);
            }
            
            console.log('Block overlaps with block at', overlapBlockPosition.toFixed(1) + '%, placing IN FRONT at', y.toFixed(1) + '%');
        } else {
            // No overlap - place in back layer with slight variance
            const baseY = grassTop + (grassHeight * 0.2); // Back layer
            const variance = STACKS_CONFIG.INITIAL_BLOCK_Y_VARIANCE_PERCENT * 0.5; // Less variance for non-initial
            y = baseY + (Math.random() - 0.5) * variance * 2;
            y = Math.max(grassTop, Math.min(y, grassMidpoint * 0.8)); // Stay in back area
        }
        
        console.log('Generated ground position after', attempts + 1, 'attempts:', x.toFixed(1) + '%,', y.toFixed(1) + '%');
        return { x, y };
    }
    
    // Fallback if no position found after max attempts
    console.warn('Could not find suitable position after', maxAttempts, 'attempts, using fallback');
    const fallbackX = 20 + Math.random() * 60;
    const baseY = grassTop + (grassHeight * 0.25);
    const variance = STACKS_CONFIG.INITIAL_BLOCK_Y_VARIANCE_PERCENT;
    const fallbackY = baseY + (Math.random() - 0.5) * variance * 2;
    return { x: fallbackX, y: Math.max(grassTop, Math.min(fallbackY, grassMidpoint)) };
}

// Helper function to calculate ground Y position with perspective for specific cases
function getRandomGroundYWithPerspective(existingBlocks = [], targetX = null) {
    if (!targetX || existingBlocks.length === 0) {
        // No overlap check needed - use back layer with variance
        const grassTop = STACKS_CONFIG.GROUND_Y_MIN_PERCENT;
        const grassHeight = STACKS_CONFIG.GROUND_Y_MAX_PERCENT - grassTop;
        const baseY = grassTop + (grassHeight * 0.2);
        const variance = STACKS_CONFIG.INITIAL_BLOCK_Y_VARIANCE_PERCENT * 0.5;
        return baseY + (Math.random() - 0.5) * variance * 2;
    }
    
    // Check for overlap and apply perspective
    const blockWidth = STACKS_CONFIG.BLOCK_WIDTH_PERCENT;
    const minDistance = blockWidth * 0.75; // 75% minimum distance
    const grassTop = STACKS_CONFIG.GROUND_Y_MIN_PERCENT;
    const grassBottom = STACKS_CONFIG.GROUND_Y_MAX_PERCENT;
    const grassHeight = grassBottom - grassTop;
    const grassMidpoint = grassTop + (grassHeight * 0.5);
    
    let overlappingBlock = null;
    for (let block of existingBlocks) {
        const distance = Math.abs(targetX - block.x);
        if (distance < minDistance) {
            // Find the frontmost (highest Y) overlapping block
            if (!overlappingBlock || block.y > overlappingBlock.y) {
                overlappingBlock = block;
            }
        }
    }
    
    if (overlappingBlock) {
        // Place IN FRONT of (lower/closer than) the overlapping block
        const minY = overlappingBlock.y;
        const maxY = grassMidpoint;
        
        return minY >= maxY ? maxY : minY + Math.random() * (maxY - minY);
    } else {
        // Back layer with variance
        const baseY = grassTop + (grassHeight * 0.2);
        const variance = STACKS_CONFIG.INITIAL_BLOCK_Y_VARIANCE_PERCENT * 0.5;
        return baseY + (Math.random() - 0.5) * variance * 2;
    }
}

// Helper function for container placement (back layer, no variance)
function getRandomGroundY() {
    const grassTop = STACKS_CONFIG.GROUND_Y_MIN_PERCENT;
    const grassHeight = STACKS_CONFIG.GROUND_Y_MAX_PERCENT - grassTop;
    return grassTop + (grassHeight * 0.15); // Containers in stable back position
}

// Viewport conversion functions
function vwToPx(vw) {
    return (vw * window.innerWidth) / 100;
}

function vhToPx(vh) {
    return (vh * window.innerHeight) / 100;
}

function pxToVw(px) {
    return (px * 100) / window.innerWidth;
}

function pxToVh(px) {
    return (px * 100) / window.innerHeight;
}

// Get drag tolerance in pixels based on viewport diagonal
function getDragTolerancePx() {
    const diagonal = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2);
    return (STACKS_CONFIG.DRAG_TOLERANCE_PERCENT * diagonal) / 100;
}

// Convert percentage coordinates to pixels for the current viewport
function percentToPx(xPercent, yPercent) {
    return {
        x: vwToPx(xPercent),
        y: vhToPx(yPercent)
    };
}

// Convert pixel coordinates to percentages
function pxToPercent(x, y) {
    return {
        x: pxToVw(x),
        y: pxToVh(y)
    };
}

// Get block dimensions in pixels - FIXED: Width based on HEIGHT for square blocks
function getBlockDimensions(isWide = false) {
    const height = vhToPx(STACKS_CONFIG.BLOCK_HEIGHT_PERCENT);
    
    // CORRECTED: Width should also be based on viewport HEIGHT for true squares
    const widthPercent = isWide ? 
        STACKS_CONFIG.BLOCK_WIDTH_WIDE_PERCENT : 
        STACKS_CONFIG.BLOCK_WIDTH_PERCENT;
    const width = vhToPx(widthPercent); // Using vhToPx instead of vwToPx for squares
    
    return { width, height };
}

// Number generation helper functions - UPDATED for consecutive-only approach
function generateConsecutiveNumbers(min, max, count) {
    const maxStart = max - count + 1;
    if (maxStart < min) return null;
    
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
        const start = Math.floor(Math.random() * (maxStart - min + 1)) + min;
        const numbers = [];
        let valid = true;
        
        // Generate consecutive sequence
        for (let i = 0; i < count; i++) {
            const num = start + i;
            if (num > max) {
                valid = false;
                break;
            }
            numbers.push(num);
        }
        
        if (valid) {
            return shuffleArray([...numbers]);
        }
        attempts++;
    }
    
    console.warn(`Could not generate ${count} consecutive numbers in range ${min}-${max} after ${maxAttempts} attempts`);
    return null;
}

function generateConsecutiveFromSet(set, count) {
    if (set.length < count) return null;
    
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
        const startIndex = Math.floor(Math.random() * (set.length - count + 1));
        const numbers = [];
        
        for (let i = 0; i < count; i++) {
            numbers.push(set[startIndex + i]);
        }
        
        return shuffleArray([...numbers]);
    }
    
    return null;
}

function generateConsecutiveHundreds(count) {
    const hundreds = [100, 200, 300, 400, 500, 600, 700, 800, 900];
    if (hundreds.length < count) return null;
    
    const startIndex = Math.floor(Math.random() * (hundreds.length - count + 1));
    const numbers = [];
    
    for (let i = 0; i < count; i++) {
        numbers.push(hundreds[startIndex + i]);
    }
    
    return shuffleArray([...numbers]);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Make config available globally for shared Rainbow and Bear classes
window.CONFIG = STACKS_CONFIG;
