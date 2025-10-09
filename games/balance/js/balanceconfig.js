// Balance Game Configuration
const BALANCE_CONFIG = {
    // Game dimensions (percentage of viewport) - UPDATED: Reduced from 9.6% to 8%
    BLOCK_HEIGHT_PERCENT: 8.0,
    BLOCK_WIDTH_PERCENT: 8.0,
    
    // Seesaw dimensions - UPDATED: Increased by 20% to maintain current sizes
    SEESAW_WIDTH_PERCENT: 60,
    SEESAW_BAR_THICKNESS_PERCENT: 0.8,
    PIVOT_HEIGHT_PERCENT: 12,
    EXTENSION_HEIGHT_PERCENT: 5.76, // Was 4.8, now 4.8 * 1.2 = 5.76
    PAN_WIDTH_BLOCKS: 6, // Was 5, now 5 * 1.2 = 6
    PAN_HEIGHT_BLOCKS: 2.4, // Was 2, now 2 * 1.2 = 2.4
    PAN_LIP_HEIGHT_PERCENT: 0.48, // Was 0.4, now 0.4 * 1.2 = 0.48
    
    // Positioning
    PIVOT_Y_PERCENT: 80, // Top of grass area (20% from bottom)
    GRASS_Y_MIN_PERCENT: 80,
    GRASS_Y_MAX_PERCENT: 100,
    
    // Ground block positions (12 predefined positions) - FIXED
    PREDEFINED_BLOCK_POSITIONS: [
        { x: 15.0, y: 85.0 },
        { x: 23.0, y: 87.0 },
        { x: 31.0, y: 84.0 },
        { x: 39.0, y: 86.5 },
        { x: 47.0, y: 85.5 },
        { x: 55.0, y: 87.5 },
        { x: 63.0, y: 84.5 },
        { x: 71.0, y: 86.0 },
        { x: 79.0, y: 85.0 },
        { x: 20.0, y: 91.0 },
        { x: 60.0, y: 90.5 },
        { x: 75.0, y: 91.5 }
    ],
    
    // Physics settings
    BALANCE_SETTLE_TIME: 2000, // 2 seconds to settle
    BALANCE_TOLERANCE: 0.001, // Tiny tolerance for balance detection
    ROTATION_SPEED: 0.5, // Degrees per frame when unbalanced
    MAX_ROTATION: 25, // Maximum rotation angle (degrees)
    OVERSHOOT_FACTOR: 0.15, // Amount of overshoot when balancing
    BOUNCE_DAMPENING: 0.6, // Bounce reduction factor
    DECELERATION_RATE: 0.92, // Slowdown when changing direction
    
    // Teddy size multiplier
    TEDDY_SIZE_MULTIPLIER: 2.3,
    
    // Font size multiplier
    BLOCK_FONT_SIZE_MULTIPLIER: 1.2,
    
    // Animation timings
    BLOCK_ANIMATION_DURATION: 500,
    TEDDY_APPEAR_DELAY: 1000,
    
    // Level system - UPDATED: Relaxed progression (2 correct, 30s time limit)
    LEVELS: {
        0: {
            name: "Level 0",
            description: "Balance with 1s only",
            targetRange: { min: 3, max: 9 },
            availableBlocks: [1], // Only 1s
            blockDistribution: {
                1: 12  // 12x 1s
            },
            otherSideStart: null, // Empty other side
            questionTime: 30000, // UPDATED: 30 seconds (was 20)
            consecutiveForPromotion: 2, // UPDATED: 2 correct (was 3)
            consecutiveForDemotion: 0 // Can't go below level 0
        },
        1: {
            name: "Level 1",
            description: "Balance with 1s and 2s",
            targetRange: { min: 3, max: 9 },
            availableBlocks: [1, 2, 3], // Include 3 in available set
            blockDistribution: {
                1: 6,  // 6x 1s
                2: 5,  // 5x 2s
                3: 1   // 1x 3
            },
            otherSideStart: null, // Empty other side
            questionTime: 30000, // UPDATED: 30 seconds (was 20)
            consecutiveForPromotion: 2, // UPDATED: 2 correct (was 3)
            consecutiveForDemotion: 2
        },
        2: {
            name: "Level 2",
            description: "Balance with numbers {1-4}",
            targetRange: { min: 3, max: 9 },
            otherSideRange: { min: 1, max: 4 },
            minDifference: 2,
            availableBlocks: [1, 2, 3, 4],
            blockDistribution: {
                1: 5,  // 5x 1s
                2: 4,  // 4x 2s
                3: 2,  // 2x 3s
                4: 1   // 1x 4
            },
            questionTime: 30000, // UPDATED: 30 seconds (was 20)
            consecutiveForPromotion: 2, // UPDATED: 2 correct (was 3)
            consecutiveForDemotion: 2
        },
        3: {
            name: "Level 3",
            description: "Balance with numbers {1-7}",
            targetRange: { min: 7, max: 12 },
            otherSideRange: { min: 1, max: 7 },
            minDifference: 3,
            availableBlocks: [1, 2, 3, 4, 5],
            blockDistribution: {
                1: 4,  // 4x 1s
                2: 4,  // 4x 2s
                3: 2,  // 2x 3s
                4: 1,  // 1x 4
                5: 1   // 1x 5
            },
            questionTime: 30000, // UPDATED: 30 seconds (was 20)
            consecutiveForPromotion: 2, // UPDATED: 2 correct (was 3)
            consecutiveForDemotion: 2
        }
    },
    
    // Colors
    SEESAW_COLOR: '#333333',
    PIVOT_COLOR: '#555555',
    PIVOT_STROKE: '#000000',
    PAN_COLOR: '#8B4513',
    PAN_STROKE: '#654321',
    FIXED_BLOCK_COLOR: '#666666',
    FIXED_BLOCK_TEXT: '#FFFFFF',
    
    // Success flash color
    SUCCESS_COLOR: '#4caf50',
    
    BLOCK_COLORS: [
        '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
        '#E1BAFF', '#FFE1FF', '#C9FFBA', '#FFCBA4', '#D4EDDA'
    ],
    
    // Audio settings
    AUDIO_ENABLED: true,
    
    // Rainbow settings
    RAINBOW_PIECES: 10,
    
    // Game settings
    TOTAL_QUESTIONS: 10
};

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

// Get block dimensions in pixels - UPDATED to support weight scaling
function getBlockDimensions(weight = 1) {
    const baseHeight = vhToPx(BALANCE_CONFIG.BLOCK_HEIGHT_PERCENT);
    const baseWidth = vhToPx(BALANCE_CONFIG.BLOCK_WIDTH_PERCENT);
    
    // Scale by sqrt(weight) so area scales linearly with weight
    const scaleFactor = Math.sqrt(weight);
    
    return { 
        width: baseWidth * scaleFactor, 
        height: baseHeight * scaleFactor 
    };
}

// Get pan dimensions in pixels
function getPanDimensions() {
    const blockDims = getBlockDimensions(1); // Use weight 1 for base size
    const width = blockDims.width * BALANCE_CONFIG.PAN_WIDTH_BLOCKS;
    const height = blockDims.height * BALANCE_CONFIG.PAN_HEIGHT_BLOCKS;
    const lipHeight = vhToPx(BALANCE_CONFIG.PAN_LIP_HEIGHT_PERCENT);
    return { width, height, lipHeight };
}

// Generate ground block positions
function generateGroundBlockPositions(count) {
    const positions = [];
    const availablePositions = [...BALANCE_CONFIG.PREDEFINED_BLOCK_POSITIONS];
    
    // Ensure we don't request more positions than available
    const positionsToGenerate = Math.min(count, availablePositions.length);
    
    for (let i = 0; i < positionsToGenerate; i++) {
        const randomIndex = Math.floor(Math.random() * availablePositions.length);
        positions.push(availablePositions.splice(randomIndex, 1)[0]);
    }
    
    console.log(`Generated ${positions.length} positions for ${count} blocks`);
    
    return positions;
}

// Shuffle array helper
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Make config available globally
window.BALANCE_CONFIG = BALANCE_CONFIG;
