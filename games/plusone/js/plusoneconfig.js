// Plus One, Minus One, and Plus Two game configuration settings
const CONFIG = {
    // Game modes - UPDATED to include Plus Two
    GAME_MODES: {
        PLUS_ONE: 'plus_one',
        MINUS_ONE: 'minus_one',
        PLUS_TWO: 'plus_two'
    },
    
    // Plus One level definitions (same as before)
    PLUS_ONE_LEVELS: {
        1: { numbers: [1, 2, 3, 4], name: 'Level 1' },
        2: { numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9], name: 'Level 2' },
        3: { numbers: [10, 11, 12, 13, 14, 15, 16, 17, 18], name: 'Level 3' },
        4: { numbers: [20, 30, 40, 50, 60, 70, 80, 90], name: 'Level 4' },
        5: { numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9], name: 'Level 5' }, // Same as level 2
        6: { 
            // 20-98, excluding #9 format (19,29,39,49,59,69,79,89)
            numbers: Array.from({length: 79}, (_, i) => i + 20).filter(num => num % 10 !== 9), 
            name: 'Level 6' 
        },
        7: { 
            // Repeat level 6: 20-98, excluding #9 format
            numbers: Array.from({length: 79}, (_, i) => i + 20).filter(num => num % 10 !== 9), 
            name: 'Level 7' 
        },
        8: { numbers: [19, 29, 39, 49, 59, 69, 79, 89], name: 'Level 8' },
        9: { numbers: Array.from({length: 99}, (_, i) => i + 100), name: 'Level 9' }, // 100-198
        10: { 
            // ##0 format: numbers ending in 0 from 100 to 990
            numbers: Array.from({length: 90}, (_, i) => (i + 10) * 10), 
            name: 'Level 10' 
        }
    },
    
    // Minus One level definitions (same as before)
    MINUS_ONE_LEVELS: {
        1: { numbers: [2, 3, 4, 5], name: 'Level 1' },
        2: { numbers: [6, 7, 8, 9, 10, 11], name: 'Level 2' },
        3: { numbers: [12, 13, 14, 15, 16, 17, 18, 19], name: 'Level 3' },
        4: { numbers: [22, 23, 24, 25, 26, 27, 28, 29], name: 'Level 4' },
        5: { numbers: [21, 31, 41, 51, 61, 71, 81, 91, 101], name: 'Level 5' },
        6: { numbers: [20, 30, 40, 50, 60, 70, 80, 90, 100], name: 'Level 6' },
        7: { 
            // Random number from 2-101
            numbers: Array.from({length: 100}, (_, i) => i + 2), 
            name: 'Level 7' 
        },
        8: { 
            // Any number from level 5 and 6 sets combined
            numbers: [21, 31, 41, 51, 61, 71, 81, 91, 101, 20, 30, 40, 50, 60, 70, 80, 90, 100], 
            name: 'Level 8' 
        },
        9: { 
            // Repeat level 7: random number from 2-101
            numbers: Array.from({length: 100}, (_, i) => i + 2), 
            name: 'Level 9' 
        },
        10: { numbers: [200, 300, 400, 500, 600, 700, 800, 900, 1000], name: 'Level 10' }
    },
    
    // Plus Two level definitions - NEW (same ranges as Plus One)
    PLUS_TWO_LEVELS: {
        1: { numbers: [1, 2, 3, 4], name: 'Level 1' },
        2: { numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9], name: 'Level 2' },
        3: { numbers: [10, 11, 12, 13, 14, 15, 16, 17, 18], name: 'Level 3' },
        4: { numbers: [20, 30, 40, 50, 60, 70, 80, 90], name: 'Level 4' },
        5: { numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9], name: 'Level 5' }, // Same as level 2
        6: { 
            // 20-98, excluding #9 format (19,29,39,49,59,69,79,89)
            numbers: Array.from({length: 79}, (_, i) => i + 20).filter(num => num % 10 !== 9), 
            name: 'Level 6' 
        },
        7: { 
            // Repeat level 6: 20-98, excluding #9 format
            numbers: Array.from({length: 79}, (_, i) => i + 20).filter(num => num % 10 !== 9), 
            name: 'Level 7' 
        },
        8: { numbers: [19, 29, 39, 49, 59, 69, 79, 89], name: 'Level 8' },
        9: { numbers: Array.from({length: 99}, (_, i) => i + 100), name: 'Level 9' }, // 100-198
        10: { 
            // ##0 format: numbers ending in 0 from 100 to 990
            numbers: Array.from({length: 90}, (_, i) => (i + 10) * 10), 
            name: 'Level 10' 
        }
    },
    
    // Get appropriate levels based on game mode - UPDATED
    getLevels: function(gameMode) {
        if (gameMode === this.GAME_MODES.MINUS_ONE) {
            return this.MINUS_ONE_LEVELS;
        } else if (gameMode === this.GAME_MODES.PLUS_TWO) {
            return this.PLUS_TWO_LEVELS;
        } else {
            return this.PLUS_ONE_LEVELS;
        }
    },
    
    // Check if level uses picture format - UPDATED to include Plus Two
    usesPictureFormat: function(level, gameMode) {
        return (gameMode === this.GAME_MODES.PLUS_ONE || gameMode === this.GAME_MODES.PLUS_TWO) && 
               (level <= 2 || level === 5);
    },
    
    // Font Awesome icons suitable for nursery age children (levels 1-2 and 5 only)
    ICONS: [
        // Animals
        'fas fa-cat',
        'fas fa-dog',
        'fas fa-fish',
        'fas fa-dove',
        'fas fa-frog',
        'fas fa-bug',
        'fas fa-horse',
        'fas fa-hippo',
        
        // Home & Furniture
        'fas fa-home',
        'fas fa-bed',
        'fas fa-chair',
        
        // Vehicles & Transportation
        'fas fa-car',
        'fas fa-bicycle',
        'fas fa-plane',
        'fas fa-rocket',
        'fas fa-tractor',
        'fas fa-bus',
        'fas fa-train',
        
        // Sports & Games
        'fas fa-puzzle-piece',
        
        // Food
        'fas fa-apple-alt',
        'fas fa-carrot',
        'fas fa-ice-cream',
        'fas fa-birthday-cake',
        'fas fa-pepper-hot',
        
        // Nature & Weather
        'fas fa-tree',
        'fas fa-leaf',
        'fas fa-sun',
        'fas fa-cloud',
        'fas fa-rainbow',
        'fas fa-star',
        'fas fa-moon',
        'fas fa-snowflake',
        'fas fa-feather',
        
        // Shapes & Symbols
        'fas fa-heart',
        
        // Objects & Tools
        'fas fa-music',
        'fas fa-bell',
        'fas fa-umbrella',
        'fas fa-anchor',
        'fas fa-glasses',
        'fas fa-binoculars',
        'fas fa-tshirt',
        
        // Fantasy & Fun
        'fas fa-ghost',
        'fas fa-hat-wizard',
        
        // Gestures & Actions
        'fas fa-smile',
        'fas fa-thumbs-up',
        'fas fa-hand-paper',
    ],
    
    // Color palette for icons
    COLORS: [
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', 
        '#eb4d4b', '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894',
        '#00cec9', '#fdcb6e', '#e17055', '#74b9ff', '#0984e3',
        '#00a085', '#e84393', '#fd63a3', '#636e72', '#2d3436'
    ],
    
    // Rainbow colors (in order)
    RAINBOW_COLORS: [
        '#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00',
        '#00ff80', '#00ffff', '#0080ff', '#0000ff', '#8000ff'
    ],
    
    // Number to word conversion for levels 3+
    NUMBER_TO_WORD: {
        0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five',
        6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten',
        11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen',
        16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty',
        21: 'twenty-one', 22: 'twenty-two', 23: 'twenty-three', 24: 'twenty-four', 25: 'twenty-five',
        26: 'twenty-six', 27: 'twenty-seven', 28: 'twenty-eight', 29: 'twenty-nine', 30: 'thirty',
        31: 'thirty-one', 32: 'thirty-two', 33: 'thirty-three', 34: 'thirty-four', 35: 'thirty-five',
        36: 'thirty-six', 37: 'thirty-seven', 38: 'thirty-eight', 39: 'thirty-nine', 40: 'forty',
        41: 'forty-one', 42: 'forty-two', 43: 'forty-three', 44: 'forty-four', 45: 'forty-five',
        46: 'forty-six', 47: 'forty-seven', 48: 'forty-eight', 49: 'forty-nine', 50: 'fifty',
        51: 'fifty-one', 52: 'fifty-two', 53: 'fifty-three', 54: 'fifty-four', 55: 'fifty-five',
        56: 'fifty-six', 57: 'fifty-seven', 58: 'fifty-eight', 59: 'fifty-nine', 60: 'sixty',
        61: 'sixty-one', 62: 'sixty-two', 63: 'sixty-three', 64: 'sixty-four', 65: 'sixty-five',
        66: 'sixty-six', 67: 'sixty-seven', 68: 'sixty-eight', 69: 'sixty-nine', 70: 'seventy',
        71: 'seventy-one', 72: 'seventy-two', 73: 'seventy-three', 74: 'seventy-four', 75: 'seventy-five',
        76: 'seventy-six', 77: 'seventy-seven', 78: 'seventy-eight', 79: 'seventy-nine', 80: 'eighty',
        81: 'eighty-one', 82: 'eighty-two', 83: 'eighty-three', 84: 'eighty-four', 85: 'eighty-five',
        86: 'eighty-six', 87: 'eighty-seven', 88: 'eighty-eight', 89: 'eighty-nine', 90: 'ninety',
        91: 'ninety-one', 92: 'ninety-two', 93: 'ninety-three', 94: 'ninety-four', 95: 'ninety-five',
        96: 'ninety-six', 97: 'ninety-seven', 98: 'ninety-eight', 99: 'ninety-nine', 100: 'one hundred',
        199: 'one hundred ninety-nine', 200: 'two hundred', 300: 'three hundred', 400: 'four hundred',
        500: 'five hundred', 600: 'six hundred', 700: 'seven hundred', 800: 'eight hundred',
        900: 'nine hundred', 1000: 'one thousand'
    },
    
    // Audio messages for all three game modes - UPDATED
    AUDIO: {
        // Plus One messages (same as before)
        PLUS_ONE: {
            FIRST_QUESTION: 'Complete the plus one sum',
            SECOND_QUESTION: 'Try again and complete the sum',
            LATER_QUESTIONS: 'Complete the sum',
            NUMBER_FORMAT_QUESTION: (n) => `What number is one more than ${n}?`,
            HINTS: {
                COUNT_LEFT: 'Count the number of pictures on the left side',
                COUNT_RIGHT: 'Count the number of pictures on the right side',
                WHAT_IS_PLUS_ONE: (n) => `What is ${n} plus one?`
            },
            NUMBER_HINTS: {
                WHAT_COMES_AFTER: (n) => `What number comes after ${n}?`
            },
            SUM_REPETITION: (n, answer) => `One more than ${n} is ${answer}`,
            GAME_COMPLETE: 'Well done! Choose the top button to play again, the middle button to try subtracting one, or the bottom button to try adding two, or return to the home page.'
        },
        
        // Minus One messages (same as before)
        MINUS_ONE: {
            FIRST_QUESTION: 'Complete the minus one sum',
            SECOND_QUESTION: 'Try again and complete the sum',
            LATER_QUESTIONS: 'Complete the sum',
            FIRST_NUMBER_FORMAT_QUESTION: (n) => `What number is one less than ${n}?`,
            NUMBER_FORMAT_QUESTIONS: [
                (n) => `What number is 1 less than ${n}?`,
                (n) => `What is ${n} subtract 1?`,
                (n) => `What is ${n} take away 1?`,
                (n) => `What is ${n} minus 1?`,
                (n) => `What number comes before ${n}?`
            ],
            HINTS: {
                COUNT_LEFT: 'Count the number of pictures on the left side',
                COUNT_RIGHT: 'Count the number of pictures on the right side',
                WHAT_IS_MINUS_ONE: (n) => `What is ${n} subtract one?`
            },
            NUMBER_HINTS: {
                WHAT_COMES_BEFORE: (n) => `What number comes before ${n}?`
            },
            SUM_REPETITION: (n, answer) => `One less than ${n} is ${answer}`,
            GAME_COMPLETE: 'Well done! Choose the top button to play again, the middle button to play plus one, or the bottom button to try adding two, or return to the home page.'
        },
        
        // Plus Two messages - NEW
        PLUS_TWO: {
            FIRST_QUESTION: 'Complete the plus two sum',
            SECOND_QUESTION: 'Try again and complete the sum',
            LATER_QUESTIONS: 'Complete the sum',
            NUMBER_FORMAT_QUESTION: (n) => `What number is two more than ${n}?`,
            HINTS: {
                COUNT_LEFT: 'Count the number of pictures on the left side',
                COUNT_RIGHT: 'Count the number of pictures on the right side',
                WHAT_IS_PLUS_TWO: (n) => `What is ${n} plus two?`
            },
            NUMBER_HINTS: {
                WHAT_COMES_AFTER_TWO: (n) => `What number comes two after ${n}?`
            },
            SUM_REPETITION: (n, answer) => `Two more than ${n} is ${answer}`,
            GAME_COMPLETE: 'Well done! Choose the top button to play again, the middle button to try subtracting one, or the bottom button to try adding one, or return to the home page.'
        },
        
        // Common messages
        ENCOURAGEMENTS: ['Well done!', 'Excellent!', 'Perfect!'],
        TRY_AGAIN: 'Try again',
        AUDIO_ON: 'Audio enabled'
    },
    
    // Game mechanics
    TOTAL_QUESTIONS: 10,
    RAINBOW_PIECES: 10,
    
    // Icon positioning for split areas (levels 1-2 and 5)
    ICON_MARGIN: 60,
    MIN_ICON_DISTANCE: 100,
    MIDDLE_SECTION_WIDTH: 0.1,
    SIDE_WIDTH: 0.45,
    
    // Animation timings
    FLASH_DURATION: 800,
    ICON_FADE_DURATION: 500,
    NEXT_QUESTION_DELAY: 1500,
    INITIAL_FADE_DELAY: 1000, // 1 second before everything fades in
    
    // Inactivity settings
    INACTIVITY_DURATION: 20000, // 20 seconds
    KEYBOARD_WAIT_DURATION: 3000, // 3 seconds for multi-digit input
    MULTI_DIGIT_TIMEOUT: 3000, // 3 seconds maximum between digits
    
    // Level progression settings
    REDEMPTION_SYSTEM: true,
    
    // Button configurations
    BUTTON_CONFIGS: {
        PICTURE_FORMAT: {
            count: 10,
            width: 8,  // 8% of button panel width
            height: 8, // 8% of button panel width
            numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        },
        NUMBER_FORMAT: {
            count: 4,
            width: 14, // 14% of button panel width
            height: 8, // 8% of button panel width
            // numbers generated dynamically based on correct answer
        }
    },
    
    // System coordination timeouts
    SYSTEM_CHECK_INTERVAL: 50,
    BUTTON_SETUP_DELAY: 100,
    COORDINATION_DELAY: 200,
    DIMENSION_RETRY_DELAY: 50,
    FAILSAFE_TIMEOUT: 2000,
    MAX_READY_CHECKS: 40,
    
    // Local storage keys for session-only persistence (not cross-session) - UPDATED
    STORAGE_KEYS: {
        PLUS_ONE_LEVEL: 'session_plusone_current_level',
        MINUS_ONE_LEVEL: 'session_minusone_current_level',
        PLUS_TWO_LEVEL: 'session_plustwo_current_level'
    },
    
    // Session storage management - UPDATED
    clearStoredLevels: function() {
        try {
            sessionStorage.removeItem(this.STORAGE_KEYS.PLUS_ONE_LEVEL);
            sessionStorage.removeItem(this.STORAGE_KEYS.MINUS_ONE_LEVEL);
            sessionStorage.removeItem(this.STORAGE_KEYS.PLUS_TWO_LEVEL);
        } catch (error) {
            console.warn('Could not clear stored levels:', error);
        }
    }
};

// Generate number to word conversions for larger numbers
function generateNumberToWord(num) {
    const number = parseInt(num, 10);
    
    if (CONFIG.NUMBER_TO_WORD[number]) {
        return CONFIG.NUMBER_TO_WORD[number];
    }
    
    if (number <= 1000) {
        const hundreds = Math.floor(number / 100);
        const remainder = number % 100;
        
        let result = '';
        if (hundreds > 0) {
            result += (CONFIG.NUMBER_TO_WORD[hundreds] || hundreds.toString()) + ' hundred';
            if (remainder > 0) {
                result += ' ';
            }
        }
        
        if (remainder > 0) {
            if (remainder <= 20) {
                result += CONFIG.NUMBER_TO_WORD[remainder] || remainder.toString();
            } else if (remainder % 10 === 0) {
                result += CONFIG.NUMBER_TO_WORD[remainder] || remainder.toString();
            } else {
                const tens = Math.floor(remainder / 10) * 10;
                const ones = remainder % 10;
                result += (CONFIG.NUMBER_TO_WORD[tens] || tens.toString()) + '-' + 
                         (CONFIG.NUMBER_TO_WORD[ones] || ones.toString());
            }
        }
        
        return result || number.toString();
    }
    
    return number.toString();
}

// Extend the NUMBER_TO_WORD object dynamically
CONFIG.getNumberWord = generateNumberToWord;
