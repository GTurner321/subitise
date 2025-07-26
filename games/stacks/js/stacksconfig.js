// Stacks Game Configuration - Fixed positioning and simplified block placement
const STACKS_CONFIG = {
    // Game dimensions (percentage of viewport) - Square blocks
    BLOCK_HEIGHT_PERCENT: 9.6,  // 9.6% of viewport height
    BLOCK_WIDTH_PERCENT: 9.6,   // Same as height for square blocks
    BLOCK_WIDTH_WIDE_PERCENT: 11.5, // Slightly larger for 3-digit numbers
    
    // Tower positioning (percentage of viewport)
    TOWER_CENTER_X_PERCENT: 50,     // 50% from left
    TOWER_BASE_Y_PERCENT: 100 - 13, // FIXED: 13% from bottom = 87% from top in CSS coordinates
    COMPLETED_TOWER_LEFT_X_PERCENT: 10,
    COMPLETED_TOWER_RIGHT_X_PERCENT: 90,
    
    // FIXED: Grass area positioning - bottom 20% of screen (80-100%)
    GRASS_Y_MIN_PERCENT: 80,        // Top of grass area (20% from bottom)
    GRASS_Y_MAX_PERCENT: 100,       // Bottom of grass area (screen bottom)
    GRASS_Y_PERCENT: 90,            // Default ground level (middle of grass)
    
    // SIMPLIFIED: Pre-defined block positions for initial placement
    // NOTE: These use bottom-left origin (0,0) = bottom-left, (100,100) = top-right
    // Need to convert Y coordinates: CSS_Y = 100 - Y_from_bottom
    PREDEFINED_BLOCK_POSITIONS: [
        { x: 37.0, y: 100 - 16.7 }, // Convert: 16.7% from bottom = 83.3% from top
        { x: 66.7, y: 100 - 8.2 },  // Convert: 8.2% from bottom = 91.8% from top
        { x: 31.8, y: 100 - 7.0 },  // Convert: 7% from bottom = 93% from top
        { x: 61.0, y: 100 - 13.0 }, // Convert: 13% from bottom = 87% from top
        { x: 44.3, y: 100 - 10.6 }, // Convert: 10.6% from bottom = 89.4% from top
        { x: 73.0, y: 100 - 10.6 }, // Convert: 10.6% from bottom = 89.4% from top
        { x: 55.8, y: 100 - 9.0 }   // Convert: 9% from bottom = 91% from top
    ],
    
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
    
    // Container styling
    CONTAINER_COLOR: '#E0E0E0',
    CONTAINER_STROKE: '#BDBDBD',
    CONTAINER_STROKE_WIDTH: 2,
    CONTAINER_OPACITY: 0.6, // FIXED: 60% opaque (40% transparent)
    
    // FIXED: Brighter color palette from previous game
    BLOCK_COLORS: [
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', 
        '#eb4d4b', '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894'
    ],
    
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
    TOTAL_QUESTIONS: 6,  // FIXED: Changed from 8 to 6 as per requirement
    FINAL_RAINBOW_ARCS: 3
};

// SIMPLIFIED: Generate random ground position using predefined locations
function generateRandomGroundPosition(existingBlocks = []) {
    // Get available positions (not yet used)
    const availablePositions = STACKS_CONFIG.PREDEFINED_BLOCK_POSITIONS.filter(pos => {
        // Check if this position is already taken
        return !existingBlocks.some(block => 
            Math.abs(block.x - pos.x) < 2 && Math.abs(block.y - pos.y) < 2
        );
    });
    
    if (availablePositions.length === 0) {
        // Fallback: use random position in grass area away from tower
        console.warn('All predefined positions taken, using random fallback');
        const centerX = STACKS_CONFIG.TOWER_CENTER_X_PERCENT;
        const exclusionZone = STACKS_CONFIG.GROUND_EXCLUSION_ZONE_PERCENT;
        
        let x;
        do {
            x = 15 + Math.random() * 70; // Spread across most of screen
        } while (Math.abs(x - centerX) < exclusionZone);
        
        const y = STACKS_CONFIG.GRASS_Y_MIN_PERCENT + Math.random() * 15; // Within grass area
        return { x, y };
    }
    
    // Randomly select from available positions
    const selectedPosition = availablePositions[Math.floor(Math.random() * availablePositions.length)];
    return { x: selectedPosition.x, y: selectedPosition.y };
}

// FIXED: For user-placed blocks - apply gravity and handle coordinate conversion properly
function generateUserPlacedGroundPosition(dropX, dropY, excludeBlocks = []) {
    // FIXED: Ensure we're working with valid pixel coordinates
    if (isNaN(dropX) || isNaN(dropY)) {
        console.error('Invalid coordinates passed to generateUserPlacedGroundPosition:', dropX, dropY);
        return { x: 50, y: 85 }; // Safe fallback
    }
    
    // Convert pixel coordinates to percentages - FIXED coordinate system
    const xPercent = (dropX * 100) / window.innerWidth;
    const yPercent = (dropY * 100) / window.innerHeight;
    
    console.log('User placement: pixels', dropX, dropY, 'to percentages', xPercent.toFixed(1), yPercent.toFixed(1));
    
    // Ensure block lands in grass area (bottom 20% = 80-100% in CSS coordinates)
    const grassTop = 80; // Top of grass area
    const grassBottom = 95; // Leave some margin at very bottom
    let adjustedY = Math.max(grassTop, Math.min(grassBottom, yPercent));
    
    // If dropped above grass, force it into grass
    if (yPercent < grassTop) {
        adjustedY = grassTop + 5; // Place in top part of grass
    }
    
    // Check for overlap with existing blocks
    const minDistance = 8; // Block width in percentage
    let overlappingBlocks = [];
    
    for (let block of excludeBlocks) {
        const distance = Math.abs(xPercent - block.x);
        if (distance < minDistance) {
            overlappingBlocks.push(block);
        }
    }
    
    if (overlappingBlocks.length > 0) {
        // Find the frontmost (highest Y value = closest to bottom) overlapping block
        const frontmostBlock = overlappingBlocks.reduce((front, current) => 
            current.y > front.y ? current : front
        );
        
        // Place in front of (higher Y than) the frontmost block
        adjustedY = Math.min(frontmostBlock.y + 3, grassBottom);
    }
    
    console.log('Adjusted position:', xPercent.toFixed(1), adjustedY.toFixed(1));
    return { x: xPercent, y: adjustedY };
}

// FIXED: For displaced blocks - place close to tower with proper coordinates
function generateDisplacedBlockPosition(excludeBlocks = []) {
    const centerX = 50; // Tower center
    
    // FIXED: Place within 38-62% as requested (12% either side of center)
    const side = Math.random() < 0.5 ? -1 : 1; // Left or right of tower
    const x = centerX + (side * (5 + Math.random() * 7)); // 5-12% away from center = 38-62% range
    
    // Place in grass area (80-95% in CSS coordinates)
    const grassTop = 80;
    const grassBottom = 95;
    let y = grassTop + Math.random() * 10; // Top part of grass area
    
    // Check for overlap with existing blocks
    const minDistance = 8;
    let overlappingBlocks = [];
    
    for (let block of excludeBlocks) {
        const distance = Math.abs(x - block.x);
        if (distance < minDistance) {
            overlappingBlocks.push(block);
        }
    }
    
    if (overlappingBlocks.length > 0) {
        // Find the frontmost overlapping block
        const frontmostBlock = overlappingBlocks.reduce((front, current) => 
            current.y > front.y ? current : front
        );
        
        // Place in front of the frontmost block
        y = Math.min(frontmostBlock.y + 3, grassBottom);
    }
    
    console.log('Displaced block position:', x.toFixed(1), y.toFixed(1));
    return { x, y };
}

// Helper function for container placement - FIXED to use tower base position
function getContainerGroundY() {
    return STACKS_CONFIG.TOWER_BASE_Y_PERCENT; // Use the tower base position consistently
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
