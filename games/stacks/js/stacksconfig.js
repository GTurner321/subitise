// Stacks Game Configuration - Percentage-based positioning
const STACKS_CONFIG = {
    // Game dimensions (percentage of viewport) - UPDATED: Narrower blocks to match height
    BLOCK_HEIGHT_PERCENT: 9.6,  // 9.6% of viewport height
    BLOCK_WIDTH_PERCENT: 6.4,   // CHANGED: Narrower (2/3 of height) for better proportions
    BLOCK_WIDTH_WIDE_PERCENT: 8.5, // CHANGED: Adjusted for 3-digit numbers
    
    // Tower positioning (percentage of viewport) - UPDATED: Lower tower
    TOWER_CENTER_X_PERCENT: 50,     // 50% from left
    TOWER_BASE_Y_PERCENT: 87.2,     // CHANGED: Moved down from 80% to 87.2% (75% of a block lower)
    COMPLETED_TOWER_LEFT_X_PERCENT: 10,  // CHANGED: Further from edge
    COMPLETED_TOWER_RIGHT_X_PERCENT: 90, // CHANGED: Further from edge
    COMPLETED_TOWER_SPACING_PERCENT: 8,  // CHANGED: Closer spacing for narrower blocks
    
    // Block positioning on ground - UPDATED: Random placement in grass area
    GROUND_Y_MIN_PERCENT: 89,       // CHANGED: Top of grass area for random placement
    GROUND_Y_MAX_PERCENT: 92,       // CHANGED: Bottom range in grass area (top 40% of grass)
    GROUND_SPREAD_PERCENT: 70,      // CHANGED: Wider spread to avoid tower area
    GROUND_EXCLUSION_ZONE_PERCENT: 15, // CHANGED: Smaller exclusion zone for narrower blocks
    
    // Teddy size multiplier
    TEDDY_SIZE_MULTIPLIER: 2.0,      // NEW: 100% larger (double size)
    
    // Drag and drop (percentage of viewport diagonal)
    DRAG_TOLERANCE_PERCENT: 3,       // 3% of viewport diagonal for drop zones
    HOVER_TRANSFORM_PERCENT: 0.5,    // 0.5% move when hovering
    
    // Animation timings (unchanged)
    TOWER_MOVE_DELAY: 3000,
    BLOCK_ANIMATION_DURATION: 500,
    TEDDY_APPEAR_DELAY: 1000,
    
    // Completed tower opacity
    COMPLETED_TOWER_OPACITY: 0.75,   // NEW: 75% opacity for completed towers
    
    // Level system (unchanged)
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
    
    // Colors for blocks (unchanged)
    BLOCK_COLORS: [
        '#FF6B9D', '#4ECDC4', '#45B7D1', '#FFA726', '#66BB6A', 
        '#AB47BC', '#EF5350', '#26C6DA', '#FFCA28', '#8D6E63', 
        '#78909C', '#FF7043'
    ],
    
    // Container styling (unchanged)
    CONTAINER_COLOR: '#E0E0E0',
    CONTAINER_STROKE: '#BDBDBD',
    CONTAINER_STROKE_WIDTH: 2,
    
    // Teddy images with multiple path options
    TEDDY_IMAGES: [
        'assets/trumps/blackbear.png',              // Try without subitise/ prefix
        'assets/trumps/dinosaur.png', 
        'assets/trumps/flabberjabber.png',
        'assets/raisin/guineapig1.png',
        'assets/bear.png',
        'assets/trumps/vowels.png',
        'assets/trumps/gemsbear.png',
        'assets/trumps/knightbear.png'
    ],
    
    // Audio settings (unchanged)
    AUDIO_ENABLED: true,
    
    // Rainbow settings (unchanged)
    RAINBOW_PIECES: 10,
    RAINBOW_COLORS: [
        '#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00', 
        '#00ff80', '#00ffff', '#0080ff', '#0000ff', '#8000ff'
    ],
    
    // Game settings (unchanged)
    TOTAL_QUESTIONS: 8,
    FINAL_RAINBOW_ARCS: 3
};

// Helper function to generate random ground position avoiding tower area with overlap checking
function generateRandomGroundPosition(existingBlocks = []) {
    const centerX = STACKS_CONFIG.TOWER_CENTER_X_PERCENT;
    const exclusionZone = STACKS_CONFIG.GROUND_EXCLUSION_ZONE_PERCENT;
    const spread = STACKS_CONFIG.GROUND_SPREAD_PERCENT;
    const blockWidth = STACKS_CONFIG.BLOCK_WIDTH_PERCENT;
    const minDistance = blockWidth * 0.75; // 75% of block width minimum distance
    
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
        let x;
        do {
            // Generate random X within the spread area
            x = (50 - spread/2) + Math.random() * spread;
        } while (Math.abs(x - centerX) < exclusionZone); // Avoid tower area
        
        // Generate random Y within top 50% of grass area
        const grassTop = STACKS_CONFIG.GROUND_Y_MIN_PERCENT;
        const grassHeight = STACKS_CONFIG.GROUND_Y_MAX_PERCENT - grassTop;
        const y = grassTop + Math.random() * (grassHeight * 0.5); // Top 50% of grass
        
        // Check for overlap with existing blocks
        let hasOverlap = false;
        for (let block of existingBlocks) {
            const distance = Math.abs(x - block.x);
            if (distance < minDistance) {
                hasOverlap = true;
                break;
            }
        }
        
        if (!hasOverlap) {
            console.log('Generated ground position after', attempts + 1, 'attempts:', x, y);
            return { x, y };
        }
        
        attempts++;
    }
    
    // Fallback if no position found after max attempts
    console.warn('Could not find non-overlapping position after', maxAttempts, 'attempts, using fallback');
    const grassTop = STACKS_CONFIG.GROUND_Y_MIN_PERCENT;
    const grassHeight = STACKS_CONFIG.GROUND_Y_MAX_PERCENT - grassTop;
    const fallbackX = 20 + Math.random() * 60; // Random position across screen
    const fallbackY = grassTop + Math.random() * (grassHeight * 0.5);
    return { x: fallbackX, y: fallbackY };
}

// Helper function to calculate ground Y position (top 50% of grass)
function getRandomGroundY() {
    const grassTop = STACKS_CONFIG.GROUND_Y_MIN_PERCENT;
    const grassHeight = STACKS_CONFIG.GROUND_Y_MAX_PERCENT - grassTop;
    return grassTop + Math.random() * (grassHeight * 0.5); // Top 50% only
}
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

// Get block dimensions in pixels
function getBlockDimensions(isWide = false) {
    const widthPercent = isWide ? 
        STACKS_CONFIG.BLOCK_WIDTH_WIDE_PERCENT : 
        STACKS_CONFIG.BLOCK_WIDTH_PERCENT;
    
    return {
        width: vwToPx(widthPercent),
        height: vhToPx(STACKS_CONFIG.BLOCK_HEIGHT_PERCENT)
    };
}

// Number generation helper functions (unchanged)
function generateConsecutiveNumbers(min, max, count) {
    const maxStart = max - count + 1;
    if (maxStart < min) return null;
    
    const start = Math.floor(Math.random() * (maxStart - min + 1)) + min;
    const numbers = [];
    for (let i = 0; i < count; i++) {
        numbers.push(start + i);
    }
    return shuffleArray([...numbers]);
}

function generateNonConsecutiveNumbers(min, max, count) {
    if (max - min + 1 < count) return null;
    
    const numbers = [];
    const available = [];
    for (let i = min; i <= max; i++) {
        available.push(i);
    }
    
    for (let i = 0; i < count; i++) {
        const index = Math.floor(Math.random() * available.length);
        numbers.push(available[index]);
        available.splice(index, 1);
    }
    
    return numbers;
}

function generateFromSet(set, count) {
    if (set.length < count) return null;
    
    const numbers = [];
    const available = [...set];
    
    for (let i = 0; i < count; i++) {
        const index = Math.floor(Math.random() * available.length);
        numbers.push(available[index]);
        available.splice(index, 1);
    }
    
    return numbers;
}

function generateRandomNumbers(min, max, count) {
    if (max - min + 1 < count) return null;
    
    const numbers = [];
    const used = new Set();
    
    while (numbers.length < count) {
        const num = Math.floor(Math.random() * (max - min + 1)) + min;
        if (!used.has(num)) {
            numbers.push(num);
            used.add(num);
        }
    }
    
    return numbers;
}

function generateHundreds(count) {
    const hundreds = [];
    const used = new Set();
    
    while (hundreds.length < count) {
        const tens = Math.floor(Math.random() * 9) + 1;
        const units = Math.floor(Math.random() * 9) + 1;  
        const num = tens * 100 + units * 10;
        
        if (!used.has(num)) {
            hundreds.push(num);
            used.add(num);
        }
    }
    
    return hundreds;
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
