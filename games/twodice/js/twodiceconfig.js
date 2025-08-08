// Two Dice Game configuration settings
const CONFIG = {
    // Rainbow colors (in order)
    RAINBOW_COLORS: [
        '#ff0000', // Red
        '#ff8000', // Orange  
        '#ffff00', // Yellow
        '#80ff00', // Yellow-Green
        '#00ff00', // Green
        '#00ff80', // Green-Cyan
        '#00ffff', // Cyan
        '#0080ff', // Blue-Cyan
        '#0000ff', // Blue
        '#8000ff'  // Purple
    ],
    
    // Game mechanics
    RAINBOW_PIECES: 10, // Complete rainbow after 10 correct answers
    
    // Dice settings
    DICE_SIZE: 120, // Size of each dice in pixels
    DICE_ROLL_MIN_DURATION: 2000, // Minimum roll duration in ms (2.0 seconds)
    DICE_ROLL_MAX_DURATION: 5000, // Maximum roll duration in ms (5.0 seconds)
    DICE_CHANGE_SPEED: 150, // How fast numbers change during roll (ms between changes)
    DICE_FADE_IN_DURATION: 1000, // Time for dice to fade in and grow (1 second)
    DICE_MIN_SCALE: 0.3, // Starting scale (30% of final size - appears distant)
    DICE_MAX_SCALE: 1.0, // Final scale (100% of final size)
    
    // Animation timings
    FLASH_DURATION: 800,
    NEXT_QUESTION_DELAY: 2000,
    
    // Audio settings
    AUDIO_ENABLED: true,
    
    // Educational level system
    DIFFICULTY_LEVELS: {
        1: { 
            name: "Level 1", 
            diceRange: [1, 2, 3], 
            possibleSums: [2, 3, 4, 5, 6],
            description: "Easy sums with small numbers"
        },
        2: { 
            name: "Level 2", 
            diceRange: [2, 3, 4], 
            possibleSums: [4, 5, 6, 7, 8],
            description: "Medium sums with mid-range numbers"
        },
        3: { 
            name: "Level 3", 
            diceRange: [1, 2, 3, 4, 5, 6], 
            possibleSums: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            description: "All possible sums with full dice range"
        }
    },
    
    // Diagonal transform moves and their inverses
    TRANSFORM_MOVES: {
        'down-right': { rotX: 90, rotY: 90, inverse: 'up-left' },
        'up-right': { rotX: -90, rotY: 90, inverse: 'down-left' },
        'down-left': { rotX: 90, rotY: -90, inverse: 'up-right' },
        'up-left': { rotX: -90, rotY: -90, inverse: 'down-right' }
    },
    
    // Pre-computed dice state transitions for target-driven rolling
    // Format: "frontFace,rotation": { "move": { frontFace: newFace, rotation: newRotation } }
    // frontFace: 1-6 (which face is toward viewer)
    // rotation: 0, 90, 180, 270 (rotation of that face)
    DICE_STATE_TRANSITIONS: {
        // Face 1 (front) orientations
        "1,0": {
            "down-right": { frontFace: 3, rotation: 90 },
            "up-right": { frontFace: 4, rotation: 270 },
            "down-left": { frontFace: 4, rotation: 90 },
            "up-left": { frontFace: 3, rotation: 270 }
        },
        "1,90": {
            "down-right": { frontFace: 2, rotation: 90 },
            "up-right": { frontFace: 3, rotation: 0 },
            "down-left": { frontFace: 5, rotation: 180 },
            "up-left": { frontFace: 4, rotation: 0 }
        },
        "1,180": {
            "down-right": { frontFace: 4, rotation: 90 },
            "up-right": { frontFace: 3, rotation: 270 },
            "down-left": { frontFace: 3, rotation: 90 },
            "up-left": { frontFace: 4, rotation: 270 }
        },
        "1,270": {
            "down-right": { frontFace: 5, rotation: 0 },
            "up-right": { frontFace: 4, rotation: 180 },
            "down-left": { frontFace: 2, rotation: 270 },
            "up-left": { frontFace: 3, rotation: 180 }
        },
        
        // Face 2 (right) orientations
        "2,0": {
            "down-right": { frontFace: 3, rotation: 0 },
            "up-right": { frontFace: 4, rotation: 0 },
            "down-left": { frontFace: 1, rotation: 270 },
            "up-left": { frontFace: 6, rotation: 90 }
        },
        "2,90": {
            "down-right": { frontFace: 6, rotation: 90 },
            "up-right": { frontFace: 1, rotation: 270 },
            "down-left": { frontFace: 3, rotation: 0 },
            "up-left": { frontFace: 4, rotation: 0 }
        },
        "2,180": {
            "down-right": { frontFace: 4, rotation: 180 },
            "up-right": { frontFace: 3, rotation: 180 },
            "down-left": { frontFace: 6, rotation: 90 },
            "up-left": { frontFace: 1, rotation: 270 }
        },
        "2,270": {
            "down-right": { frontFace: 1, rotation: 90 },
            "up-right": { frontFace: 6, rotation: 270 },
            "down-left": { frontFace: 4, rotation: 180 },
            "up-left": { frontFace: 3, rotation: 180 }
        },
        
        // Face 3 (top) orientations
        "3,0": {
            "down-right": { frontFace: 6, rotation: 0 },
            "up-right": { frontFace: 1, rotation: 0 },
            "down-left": { frontFace: 2, rotation: 0 },
            "up-left": { frontFace: 5, rotation: 0 }
        },
        "3,90": {
            "down-right": { frontFace: 5, rotation: 90 },
            "up-right": { frontFace: 2, rotation: 90 },
            "down-left": { frontFace: 6, rotation: 90 },
            "up-left": { frontFace: 1, rotation: 90 }
        },
        "3,180": {
            "down-right": { frontFace: 1, rotation: 180 },
            "up-right": { frontFace: 6, rotation: 180 },
            "down-left": { frontFace: 5, rotation: 180 },
            "up-left": { frontFace: 2, rotation: 180 }
        },
        "3,270": {
            "down-right": { frontFace: 2, rotation: 270 },
            "up-right": { frontFace: 5, rotation: 270 },
            "down-left": { frontFace: 1, rotation: 270 },
            "up-left": { frontFace: 6, rotation: 270 }
        },
        
        // Face 4 (bottom) orientations
        "4,0": {
            "down-right": { frontFace: 1, rotation: 180 },
            "up-right": { frontFace: 6, rotation: 0 },
            "down-left": { frontFace: 5, rotation: 90 },
            "up-left": { frontFace: 2, rotation: 270 }
        },
        "4,90": {
            "down-right": { frontFace: 2, rotation: 0 },
            "up-right": { frontFace: 5, rotation: 180 },
            "down-left": { frontFace: 1, rotation: 180 },
            "up-left": { frontFace: 6, rotation: 0 }
        },
        "4,180": {
            "down-right": { frontFace: 6, rotation: 180 },
            "up-right": { frontFace: 1, rotation: 0 },
            "down-left": { frontFace: 2, rotation: 90 },
            "up-left": { frontFace: 5, rotation: 270 }
        },
        "4,270": {
            "down-right": { frontFace: 5, rotation: 180 },
            "up-right": { frontFace: 2, rotation: 0 },
            "down-left": { frontFace: 6, rotation: 180 },
            "up-left": { frontFace: 1, rotation: 0 }
        },
        
        // Face 5 (left) orientations
        "5,0": {
            "down-right": { frontFace: 4, rotation: 0 },
            "up-right": { frontFace: 3, rotation: 0 },
            "down-left": { frontFace: 6, rotation: 270 },
            "up-left": { frontFace: 1, rotation: 90 }
        },
        "5,90": {
            "down-right": { frontFace: 1, rotation: 90 },
            "up-right": { frontFace: 6, rotation: 270 },
            "down-left": { frontFace: 4, rotation: 0 },
            "up-left": { frontFace: 3, rotation: 0 }
        },
        "5,180": {
            "down-right": { frontFace: 3, rotation: 180 },
            "up-right": { frontFace: 4, rotation: 180 },
            "down-left": { frontFace: 1, rotation: 90 },
            "up-left": { frontFace: 6, rotation: 270 }
        },
        "5,270": {
            "down-right": { frontFace: 6, rotation: 90 },
            "up-right": { frontFace: 1, rotation: 270 },
            "down-left": { frontFace: 3, rotation: 180 },
            "up-left": { frontFace: 4, rotation: 180 }
        },
        
        // Face 6 (back) orientations
        "6,0": {
            "down-right": { frontFace: 4, rotation: 270 },
            "up-right": { frontFace: 3, rotation: 90 },
            "down-left": { frontFace: 3, rotation: 270 },
            "up-left": { frontFace: 4, rotation: 90 }
        },
        "6,90": {
            "down-right": { frontFace: 5, rotation: 180 },
            "up-right": { frontFace: 4, rotation: 0 },
            "down-left": { frontFace: 2, rotation: 0 },
            "up-left": { frontFace: 3, rotation: 180 }
        },
        "6,180": {
            "down-right": { frontFace: 3, rotation: 270 },
            "up-right": { frontFace: 4, rotation: 90 },
            "down-left": { frontFace: 4, rotation: 270 },
            "up-left": { frontFace: 3, rotation: 90 }
        },
        "6,270": {
            "down-right": { frontFace: 2, rotation: 180 },
            "up-right": { frontFace: 3, rotation: 0 },
            "down-left": { frontFace: 5, rotation: 0 },
            "up-left": { frontFace: 4, rotation: 180 }
        }
    },
    
    // Dice face patterns (dots for each number 1-6)
    // FIXED: Swapped patterns for 2 and 5 to match visual dice layout
    DICE_FACES: {
        1: [
            [0, 0, 0],
            [0, 1, 0],
            [0, 0, 0]
        ],
        2: [
            // FIXED: This was the 5 pattern, now correctly shows 2 dots diagonally
            [1, 0, 1],
            [0, 1, 0],
            [1, 0, 1]
        ],
        3: [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ],
        4: [
            [1, 0, 1],
            [0, 0, 0],
            [1, 0, 1]
        ],
        5: [
            // FIXED: This was the 2 pattern, now correctly shows 5 dots with center
            [1, 0, 0],
            [0, 0, 0],
            [0, 0, 1]
        ],
        6: [
            [1, 0, 1],
            [1, 0, 1],
            [1, 0, 1]
        ]
    },
    
    // Dice colors - alternating for visual variety
    DICE_COLORS: [
        '#ffffff', // White
        '#ff6b6b', // Red
        '#4ecdc4', // Teal
        '#45b7d1', // Blue
        '#f9ca24', // Yellow
        '#f0932b', // Orange
    ],
    
    // All possible dice combinations (to avoid repeats)
    // Each combination is [smaller, larger] to treat (1,2) same as (2,1)
    ALL_COMBINATIONS: [
        [1,1], [1,2], [1,3], [1,4], [1,5], [1,6],
        [2,2], [2,3], [2,4], [2,5], [2,6],
        [3,3], [3,4], [3,5], [3,6],
        [4,4], [4,5], [4,6],
        [5,5], [5,6],
        [6,6]
    ]
};
