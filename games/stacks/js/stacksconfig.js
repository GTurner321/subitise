// Stacks Game Configuration - Fixed positioning and simplified block placement
const STACKS_CONFIG = {
    // Game dimensions (percentage of viewport) - Square blocks
    BLOCK_HEIGHT_PERCENT: 9.6,  // 9.6% of viewport height
    BLOCK_WIDTH_PERCENT: 9.6,   // Same as height for square blocks
    BLOCK_WIDTH_WIDE_PERCENT: 11.5, // Slightly larger for 3-digit numbers
    
    // Tower positioning (percentage of viewport)
    TOWER_CENTER_X_PERCENT: 50,     // 50% from left
    TOWER_BASE_Y_PERCENT: 75,       // FIXED: Higher up to prevent overlap with grass
    COMPLETED_TOWER_LEFT_X_PERCENT: 10,
    COMPLETED_TOWER_RIGHT_X_PERCENT: 90,
    
    // FIXED: Grass area positioning - bottom 20% of screen (80-100%)
    GRASS_Y_MIN_PERCENT: 80,        // Top of grass area (20% from bottom)
    GRASS_Y_MAX_PERCENT: 100,       // Bottom of grass area (screen bottom)
    GRASS_Y_PERCENT: 90,            // Default ground level (middle of grass)
    
    // SIMPLIFIED: Block placement in grass area
    GRASS_BLOCK_ZONE_MIN: 80,       // Top of block placement zone
    GRASS_BLOCK_ZONE_MAX: 90,       // Bottom of block placement zone (top 50% of grass)
    
    // Block positioning settings
    GROUND_SPREAD_PERCENT: 70,      // Spread blocks across 70% of screen width
    GROUND_EXCLUSION_ZONE_PERCENT: 25, // INCREASED: Larger area around tower to avoid
    BLOCK_MIN_DISTANCE_PERCENT: 8,  // Minimum distance between blocks (no overlap)
    
    // FIXED: Completed tower spacing - one block width apart
    COMPLETED_TOWER_SPACING_PERCENT: 9.6, // One block width spacing
    
    // Completed tower opacity - REDUCED for less prominence
    COMPLETED_TOWER_OPACITY: 0.5,   // More transparent
    
    // Teddy size multiplier
    TEDDY_SIZE_MULTIPLIER: 2.3,
    
    // Font size multiplier for numbers in blocks
    BLOCK_FONT_SIZE_MULTIPLIER: 1.2,
    
    // Drag and drop settings
    DRAG_TOLERANCE_PERCENT: 4,
    HOVER_TRANSFORM_PERCENT: 0.5,
    DROP_OVERLAP_THRESHOLD: 0.5,
    
    // Animation timings
    TOWER_MOVE_DELAY: 3000,
    BLOCK_ANIMATION_DURATION: 500,
    TEDDY_APPEAR_DELAY: 1000,
    
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
            description: "Numbers 1-12, consecutive",
            generateNumbers: (count) => generateConsecutiveNumbers(1, 12, count),
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
            generateNumbers: (count) => generateConsecutiveFromSet([10,20,30,40,50,60,70,80,90], count),
            moveThreshold: 2
        },
        5: {
            name: "Level 5",
            description: "Numbers 1-99",
            generateNumbers: (count) => generateConsecutiveNumbers(1, 99, count),
            moveThreshold: 2
        },
        6: {
            name: "Level 6", 
            description: "Hundreds (##0)",
            generateNumbers: (count) => generateConsecutiveHundreds(count),
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
    
    // Teddy images
    TEDDY_IMAGES: [
        '../../assets/trumps/blackbear.png',
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

// SIMPLIFIED: Generate random ground position without overlap
function generateRandomGroundPosition(existingBlocks = []) {
    const centerX = STACKS_CONFIG.TOWER_CENTER_X_PERCENT;
    const exclusionZone = STACKS_CONFIG.GROUND_EXCLUSION_ZONE_PERCENT;
    const spread = STACKS_CONFIG.GROUND_SPREAD_PERCENT;
    const minDistance = STACKS_CONFIG.BLOCK_MIN_DISTANCE_PERCENT;
    
    // FIXED: Also avoid completed towers by checking for very low opacity blocks
    const allExistingBlocks = [...existingBlocks];
    
    // Add completed tower positions to avoid (check for towers with low opacity)
    const completedTowerBlocks = document.querySelectorAll('.block.completed-tower');
    completedTowerBlocks.forEach(block => {
        if (block._xPercent && block._yPercent) {
            allExistingBlocks.push({
                x: block._xPercent,
                y: block._yPercent
            });
        }
    });
    
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
        attempts++;
        
        // Generate random X position avoiding tower area
        let x;
        do {
            x = (50 - spread/2) + Math.random() * spread;
        } while (Math.abs(x - centerX) < exclusionZone);
        
        // Check for overlap with existing blocks
        let hasOverlap = false;
        for (let block of allExistingBlocks) {
            const distance = Math.abs(x - block.x);
            if (distance < minDistance) {
                hasOverlap = true;
                break;
            }
        }
        
        if (!hasOverlap) {
            // Generate Y position in top 50% of grass area
            const y = STACKS_CONFIG.GRASS_BLOCK_ZONE_MIN + 
                     Math.random() * (STACKS_CONFIG.GRASS_BLOCK_ZONE_MAX - STACKS_CONFIG.GRASS_BLOCK_ZONE_MIN);
            
            console.log(`Generated position after ${attempts} attempts: ${x.toFixed(1)}%, ${y.toFixed(1)}%`);
            return { x, y };
        }
    }
    
    // Fallback: allow overlaps but avoid tower area and completed towers
    console.warn('Could not find non-overlapping position, using fallback away from towers');
    const fallbackX = centerX > 50 ? 15 + Math.random() * 20 : 65 + Math.random() * 20; // Far from center
    const fallbackY = STACKS_CONFIG.GRASS_BLOCK_ZONE_MIN + 
                     Math.random() * (STACKS_CONFIG.GRASS_BLOCK_ZONE_MAX - STACKS_CONFIG.GRASS_BLOCK_ZONE_MIN);
    return { x: fallbackX, y: fallbackY };
}

// Helper function for container placement
function getContainerGroundY() {
    return STACKS_CONFIG.TOWER_BASE_Y_PERCENT; // Use the tower base position
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

// Get drag tolerance in pixels
function getDragTolerancePx() {
    const diagonal = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2);
    return (STACKS_CONFIG.DRAG_TOLERANCE_PERCENT * diagonal) / 100;
}

// Convert percentage coordinates to pixels
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
    const height = vhToPx(STACKS_CONFIG.BLOCK_HEIGHT_PERCENT);
    const widthPercent = isWide ? 
        STACKS_CONFIG.BLOCK_WIDTH_WIDE_PERCENT : 
        STACKS_CONFIG.BLOCK_WIDTH_PERCENT;
    const width = vhToPx(widthPercent); // Use viewport height for square blocks
    
    return { width, height };
}

// Number generation helper functions
function generateConsecutiveNumbers(min, max, count) {
    const maxStart = max - count + 1;
    if (maxStart < min) return null;
    
    const start = Math.floor(Math.random() * (maxStart - min + 1)) + min;
    const numbers = [];
    
    for (let i = 0; i < count; i++) {
        const num = start + i;
        if (num > max) break;
        numbers.push(num);
    }
    
    return shuffleArray([...numbers]);
}

function generateConsecutiveFromSet(set, count) {
    if (set.length < count) return null;
    
    const startIndex = Math.floor(Math.random() * (set.length - count + 1));
    const numbers = [];
    
    for (let i = 0; i < count; i++) {
        numbers.push(set[startIndex + i]);
    }
    
    return shuffleArray([...numbers]);
}

function generateConsecutiveHundreds(count) {
    const hundreds = [100, 200, 300, 400, 500, 600, 700, 800, 900];
    return generateConsecutiveFromSet(hundreds, count);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Make config available globally
window.CONFIG = STACKS_CONFIG;
