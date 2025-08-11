// Multi-Dice Game configuration settings
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
    
    // UPDATED: Game modes
    GAME_MODES: {
        TWO_DICE: 'two_dice',
        THREE_DICE: 'three_dice', 
        FOUR_DICE: 'four_dice'
    },
    
    // UPDATED: Dice positioning for different modes (percentages of game area)
    DICE_POSITIONS: {
        TWO_DICE: {
            left: { x: 23, y: 50 },      // (23%, 50%)
            right: { x: 77, y: 50 }      // (77%, 50%)
        },
        THREE_DICE: {
            left: { x: 23, y: 40 },      // (23%, 40%) 
            right: { x: 77, y: 40 },     // (77%, 40%)
            bottom: { x: 50, y: 80 }     // (50%, 80%)
        },
        FOUR_DICE: {
            topLeft: { x: 24, y: 24 },       // (24%, 24%)
            topRight: { x: 77, y: 25 },      // (77%, 25%)
            bottomLeft: { x: 22, y: 76 },    // (22%, 76%)
            bottomRight: { x: 78, y: 75 }    // (78%, 75%)
        }
    },
    
    // FIXED: Plus symbol positioning for all modes with proper coordinates
    PLUS_POSITIONS: {
        TWO_DICE: { x: 50, y: 50 },    // Center between two dice
        THREE_DICE: { x: 50, y: 30 },  // Upper center above the triangle
        FOUR_DICE: { x: 50, y: 50 }    // Center of the four dice square
    },
    
    // UPDATED: Sum bar configurations
    SUM_BAR_CONFIG: {
        TWO_DICE: {
            boxes: 2,
            widthMultiplier: 6.5,
            inputOrder: ['left', 'right'] // Maps to dice positions
        },
        THREE_DICE: {
            boxes: 3,
            widthMultiplier: 8.5, // Updated from 8.1
            inputOrder: ['left', 'bottom', 'right'] // Box1=left, Box2=bottom, Box3=right
        },
        FOUR_DICE: {
            boxes: 4,
            widthMultiplier: 10.5, // Updated from 9.7
            inputOrder: ['topLeft', 'bottomLeft', 'topRight', 'bottomRight'] // As specified
        }
    },
    
    // Dice settings
    DICE_SIZE: 120, // Size of each dice in pixels
    DICE_FADE_IN_DURATION: 1000, // Time for dice to fade in and grow (1 second)
    DICE_MIN_SCALE: 0.3, // Starting scale (30% of final size - appears distant)
    DICE_MAX_SCALE: 1.0, // Final scale (100% of final size)
    
    // New dice rolling system
    DICE_ROLLING: {
        MIN_MOVES: 8, // Minimum moves before checking for target
        MAX_MOVES: 18, // Maximum moves before giving up
        TARGET_CHECK_START: 9, // Start checking for target on 9th move
        MAX_SEQUENCE_ATTEMPTS: 5, // Max attempts to find target sequence
        FALLBACK_STOP_MOVE: 12, // Stop on this move if all attempts fail
        
        // Movement probabilities
        DIAGONAL_PROBABILITY: 0.4, // 40% each for the two diagonal moves
        TOP_TO_BOTTOM_PROBABILITY: 0.2, // 20% for forward roll
        
        // Speed sets (assigned randomly to left/right dice)
        SPEED_SETS: {
            A: {
                diagonal: 0.55,
                forward: 0.4,
                penultimate: { diagonal: 0.7, forward: 0.53 },
                last: { diagonal: 0.95, forward: 0.75 }
            },
            B: {
                diagonal: 0.58,
                forward: 0.42,
                penultimate: { diagonal: 0.7, forward: 0.53 },
                last: { diagonal: 0.95, forward: 0.75 }
            }
        }
    },
    
    // Level system
    LEVEL_SYSTEM: {
        L1: {
            name: "Level 1",
            diceRange: [1, 2, 3],
            description: "Numbers 1-3"
        },
        L2: {
            name: "Level 2", 
            diceRange: [2, 3, 4],
            description: "Numbers 2-4"
        },
        L3: {
            name: "Level 3",
            diceRange: [1, 2, 3, 4, 5, 6],
            description: "All numbers 1-6"
        },
        
        STARTING_LEVEL: 'L1',
        MAX_SUM_GENERATION_ATTEMPTS: 10 // Allow repeats after this many attempts
    },
    
    // Animation timings
    FLASH_DURATION: 800,
    NEXT_QUESTION_DELAY: 2000,
    
    // FIXED: Audio settings and messages - simplified modal messages
    AUDIO: {
        ENABLED: true,
        
        MESSAGES: {
            // Game start messages
            FIRST_QUESTION: 'Watch the dice roll and complete the addition sum.',
            SECOND_QUESTION: 'Try again and complete the sum',
            CONTINUE_QUESTION: 'Complete the sum',
            
            // Feedback messages
            CORRECT_ANSWERS: ['Well done!', 'Excellent!', 'Perfect!', 'Great job!', 'Outstanding!'],
            INCORRECT_ANSWER: 'Try again',
            
            // UPDATED: Hint messages for multi-dice
            HINT_LEFT_DICE: 'Count the dots on the left dice',
            HINT_RIGHT_DICE: 'Count the dots on the right dice',
            HINT_BOTTOM_DICE: 'Count the dots on the bottom dice',
            HINT_TOP_LEFT_DICE: 'Count the dots on the top left dice',
            HINT_TOP_RIGHT_DICE: 'Count the dots on the top right dice', 
            HINT_BOTTOM_LEFT_DICE: 'Count the dots on the bottom left dice',
            HINT_BOTTOM_RIGHT_DICE: 'Count the dots on the bottom right dice',
            
            // UPDATED: Total hints for different modes
            HINT_TOTAL: 'Add the two dice numbers together',
            HINT_TOTAL_THREE: 'Add the three dice numbers together',
            HINT_TOTAL_FOUR: 'Add the four dice numbers together',
            
            // FIXED: Audio-only completion messages (more detailed for speech)
            GAME_TWODICE_COMPLETE_AUDIO: 'Well done! You\'re on a roll! Play again, or try the game with 3 dice.',
            GAME_THREEDICE_COMPLETE_AUDIO: 'Well done! You\'re on a roll! Play again, return to 2 dice, or try the game with 4 dice.',
            GAME_FOURDICE_COMPLETE_AUDIO: 'Well done! You\'ve completed all the games! Play again, return to 2 or 3 dice.',
            
            // FIXED: Brief modal text messages
            GAME_MODAL_TITLE: 'Well done!'
        }
    },
    
    // Dice face patterns (dots for each number 1-6)
    DICE_FACES: {
        1: [
            [0, 0, 0],
            [0, 1, 0],
            [0, 0, 0]
        ],
        2: [
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
    ]
};
