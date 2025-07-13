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
    
    // Dice face patterns (dots for each number 1-6)
    DICE_FACES: {
        1: [
            [0, 0, 0],
            [0, 1, 0],
            [0, 0, 0]
        ],
        2: [
            [1, 0, 0],
            [0, 0, 0],
            [0, 0, 1]
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
            [1, 0, 1],
            [0, 1, 0],
            [1, 0, 1]
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
