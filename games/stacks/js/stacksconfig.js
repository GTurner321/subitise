// Stacks Game Configuration
const STACKS_CONFIG = {
    // Game dimensions
    SVG_WIDTH: window.innerWidth,
    SVG_HEIGHT: window.innerHeight,
    BLOCK_HEIGHT: window.innerHeight * 0.08, // 8% of screen height
    BLOCK_WIDTH: window.innerHeight * 0.08,  // Start square, will adjust for wide numbers
    BLOCK_WIDTH_WIDE: window.innerHeight * 0.12, // For 3-digit numbers
    
    // Tower positioning
    TOWER_CENTER_X: window.innerWidth * 0.5,
    TOWER_BASE_Y: window.innerHeight - 100, // Above grass band
    COMPLETED_TOWER_LEFT_X: window.innerWidth * 0.15,
    COMPLETED_TOWER_RIGHT_X: window.innerWidth * 0.85,
    COMPLETED_TOWER_SPACING: 80,
    
    // Block positioning on ground
    GROUND_Y: window.innerHeight - 90, // On grass level
    GROUND_SPREAD: window.innerWidth * 0.6, // How wide to spread blocks
    
    // Drag and drop
    DRAG_TOLERANCE: 20, // Pixels tolerance for drop zones
    HOVER_TRANSFORM: 5, // Pixels to move block when hovering
    
    // Animation timings
    TOWER_MOVE_DELAY: 3000, // 3 seconds before moving completed tower
    BLOCK_ANIMATION_DURATION: 500,
    TEDDY_APPEAR_DELAY: 1000,
    
    // Level system
    LEVELS: {
        1: {
            name: "Level 1",
            description: "Numbers 1-10, consecutive",
            generateNumbers: (count) => generateConsecutiveNumbers(1, 10, count),
            moveThreshold: 2 // If moves > 2 * (count), stay at same level
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
    
    // Colors for blocks - bright but not garish
    BLOCK_COLORS: [
        '#FF6B9D', // Pink
        '#4ECDC4', // Teal
        '#45B7D1', // Blue
        '#FFA726', // Orange
        '#66BB6A', // Green
        '#AB47BC', // Purple
        '#EF5350', // Red
        '#26C6DA', // Cyan
        '#FFCA28', // Yellow
        '#8D6E63', // Brown
        '#78909C', // Blue Grey
        '#FF7043'  // Deep Orange
    ],
    
    // Container (empty tower slot) styling
    CONTAINER_COLOR: '#E0E0E0',
    CONTAINER_STROKE: '#BDBDBD',
    CONTAINER_STROKE_WIDTH: 2,
    
    // Teddy images for completed towers
    TEDDY_IMAGES: [
        'subitise/assets/trumps/blackbear.png',
        'subitise/assets/trumps/dinosaur.png', 
        'subitise/assets/trumps/flabberjabber.png',
        'subitise/assets/raisin/guineapig1.png',
        'subitise/assets/bear.png',
        'subitise/assets/trumps/vowels.png',
        'subitise/assets/trumps/gemsbear.png',
        'subitise/assets/trumps/knightbear.png'
    ],
    
    // Audio settings
    AUDIO_ENABLED: true,
    
    // Rainbow settings (shared with other games)
    RAINBOW_PIECES: 10,
    RAINBOW_COLORS: [
        '#ff0000', // Red
        '#ff8000', // Orange  
        '#ffff00', // Yellow
        '#80ff00', // Lime
        '#00ff00', // Green
        '#00ff80', // Spring Green
        '#00ffff', // Cyan
        '#0080ff', // Blue
        '#0000ff', // Dark Blue
        '#8000ff'  // Purple
    ],
    
    // Total questions
    TOTAL_QUESTIONS: 8,
    
    // Game completion
    FINAL_RAINBOW_ARCS: 3 // Add 3 more arcs at end to complete rainbow
};

// Number generation helper functions
function generateConsecutiveNumbers(min, max, count) {
    const maxStart = max - count + 1;
    if (maxStart < min) return null; // Not enough range
    
    const start = Math.floor(Math.random() * (maxStart - min + 1)) + min;
    const numbers = [];
    for (let i = 0; i < count; i++) {
        numbers.push(start + i);
    }
    return shuffleArray([...numbers]);
}

function generateNonConsecutiveNumbers(min, max, count) {
    if (max - min + 1 < count) return null; // Not enough range
    
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
        const tens = Math.floor(Math.random() * 9) + 1; // 1-9
        const units = Math.floor(Math.random() * 9) + 1; // 1-9  
        const num = tens * 100 + units * 10; // ##0 format
        
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
