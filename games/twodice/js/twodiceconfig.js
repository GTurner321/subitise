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
                topToBottom: 0.4,
                finalThreeMoves: {
                    diagonal: 0.4,
                    topToBottom: 0.3
                }
            },
            B: {
                diagonal: 0.58,
                topToBottom: 0.42,
                finalThreeMoves: {
                    diagonal: 0.4,
                    topToBottom: 0.3
                }
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
    
    // Audio settings and messages
    AUDIO: {
        ENABLED: true,
        
        MESSAGES: {
            // Game start messages
            FIRST_QUESTION: 'Watch the dice roll and complete the three numbers in the addition sum.',
            SECOND_QUESTION: 'Try again and complete the sum',
            CONTINUE_QUESTION: 'Complete the sum',
            
            // Feedback messages
            CORRECT_ANSWERS: ['Well done!', 'Excellent!', 'Perfect!', 'Great job!', 'Outstanding!'],
            INCORRECT_ANSWER: 'Try again',
            
            // Hint messages
            HINT_LEFT_DICE: 'Count the dots on the left dice',
            HINT_RIGHT_DICE: 'Count the dots on the right dice', 
            HINT_TOTAL: 'Add the two dice numbers together',
            
            // Completion messages
            GAME_COMPLETE: 'Well done! You\'re on a roll! Try again or return to the home page.',
            
            // Level progression (optional audio feedback)
            LEVEL_UP: 'Level up! Numbers are getting harder.',
            LEVEL_DOWN: 'Don\'t worry, let\'s try some easier numbers.'
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
