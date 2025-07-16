const BALLOON_CONFIG = {
    // Game dimensions
    get SVG_WIDTH() {
        return window.innerWidth;
    },
    get SVG_HEIGHT() {
        return window.innerHeight - 80; // Minus grass band height
    },
    
    // Rainbow settings (for shared rainbow.js compatibility)
    RAINBOW_PIECES: 10,
    RAINBOW_COLORS: [
        '#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00',
        '#00ff80', '#00ffff', '#0080ff', '#0000ff', '#8000ff'
    ],
    
    // Level definitions
    LEVELS: {
        1: {
            name: "Single Digits",
            numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
            questionsNeeded: 2
        },
        2: {
            name: "Teen Numbers", 
            numbers: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
            questionsNeeded: 2
        },
        3: {
            name: "Round Numbers",
            numbers: [20, 30, 40, 50, 60, 70, 80, 90, 100],
            questionsNeeded: 2
        },
        4: {
            name: "All Numbers",
            numbers: (() => {
                const allNumbers = [];
                for (let i = 21; i <= 100; i++) {
                    if (![20, 30, 40, 50, 60, 70, 80, 90, 100].includes(i)) {
                        allNumbers.push(i);
                    }
                }
                return allNumbers;
            })(),
            questionsNeeded: 2
        }
    },
    
    // Balloon settings
    TOTAL_BALLOONS: 40,
    CORRECT_BALLOONS: 10,
    INCORRECT_BALLOONS: 30,
    
    // Success criteria
    MIN_CORRECT_BALLOONS: 8,
    MAX_INCORRECT_BALLOONS: 4,
    
    // Balloon physics
    BALLOON_RADIUS: 54,
    BALLOON_RISE_SPEED_MIN: 15,
    BALLOON_RISE_SPEED_MAX: 25,
    BALLOON_SIDEWAYS_SPEED: 30,
    
    // Animation settings
    BALLOON_SPAWN_INTERVAL: 200, // ms between balloon spawns
    FALLING_NUMBER_SPEED: 180,
    
    // Colors
    BALLOON_COLORS: [
        '#FF0000', '#FF8000', '#FFFF00', '#80FF00', '#00FF00',
        '#00FF80', '#00FFFF', '#0080FF', '#0000FF', '#8000FF',
        '#FF0080', '#FF4000', '#FFFF80', '#80FF80', '#80FFFF'
    ],
    
    // Audio settings
    AUDIO_ENABLED: true,
    
    // Number to word conversion
    NUMBER_TO_WORD: {
        1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five',
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
        96: 'ninety-six', 97: 'ninety-seven', 98: 'ninety-eight', 99: 'ninety-nine', 100: 'one hundred'
    },
    
    // Game state storage keys (not used in Claude.ai)
    STORAGE_KEY_LEVEL: 'balloonGame_currentLevel',
    STORAGE_KEY_PROGRESS: 'balloonGame_levelProgress', 
    STORAGE_KEY_USED_NUMBERS: 'balloonGame_usedNumbers',
    
    DEBUG_MODE: false
};
