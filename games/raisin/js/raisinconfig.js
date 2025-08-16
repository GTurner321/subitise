/**
 * Raisin Game Configuration
 * Contains all game settings, difficulty levels, audio messages, and timing configurations
 */
const CONFIG = {
    // Game progression
    RAINBOW_PIECES: 10,
    TOTAL_QUESTIONS: 10,
    
    // Tutorial mode settings (first 3 questions)
    TUTORIAL_MODE: {
        QUESTIONS: 3,
        TOTAL_RAISINS: 5,
        LEVEL_1: {
            possibleRaisinsToEat: [1, 2], // Either 1 or 2 missing
            name: 'Tutorial Level 1'
        },
        LEVEL_2: {
            possibleRaisinsToEat: [1, 2, 3, 4], // Any number 1-4 missing
            name: 'Tutorial Level 2'
        }
    },
    
    // Normal game settings (questions 4-10)
    NORMAL_MODE: {
        TOTAL_RAISINS: 10,
        LEVEL_1: {
            possibleRaisinsToEat: [1, 2], // Easier numbers
            name: 'Level 1'
        },
        LEVEL_2: {
            possibleRaisinsToEat: [1, 2, 3, 4, 5, 6, 7, 8, 9], // Full range
            name: 'Level 2'
        },
        LEVEL_3: {
            possibleRaisinsToEat: [1, 2, 5, 9], // Specific challenging numbers
            name: 'Level 3'
        }
    },
    
    // Timing configurations
    FLASH_DURATION: 800,
    NEXT_QUESTION_DELAY: 2000,
    GUINEA_PIG_3_INITIAL_DISPLAY: 4000, // 4 seconds initial display
    INITIAL_INSTRUCTION_DELAY: 1000, // 1 second after initial display
    RAISIN_STAGGER_START: 1000, // 1 second after game loads
    RAISIN_STAGGER_WINDOW: 3000, // 3 second window for raisins to appear
    RAISIN_FADE_DURATION: 500, // 0.5 seconds fade in
    GUINEA_PIG_ANIMATION_DURATION: 2000, // 2 seconds for each guinea pig to cross
    GUINEA_PIG_PAUSE_DURATION: 500, // Pause between guinea pigs
    
    // Guinea pig sizes (relative to game area width)
    GUINEA_PIG_3_SIZE: 0.1, // 10% of game area width
    GUINEA_PIG_2_SIZE: 0.22, // 22% of game area width (will be made 20% larger)
    GUINEA_PIG_1_SIZE: 0.22, // 22% of game area width (will be made 20% larger)
    
    // Raisin settings
    RAISIN_SIZE: 0.08, // 8% of game area width
    RAISIN_MIN_DISTANCE: 0.12, // Minimum distance between raisins
    
    // Game area exclusions - area to avoid placing raisins (for Guinea Pig 3)
    GUINEA_PIG_3_EXCLUSION: {
        x: 0,        // Start from left edge (percentage)
        y: 0,        // Start from top edge (percentage)
        width: 0.25, // 25% of game area width
        height: 0.25 // 25% of game area height
    },
    
    // Audio settings
    AUDIO: {
        // Guinea pig eating sound
        GUINEA_PIG_EATING_SOUND: '../../assets/raisin/guineapigeating.mp3',
        GUINEA_PIG_SOUND_VOLUME: 0.7, // Loud volume as requested
        
        // Game instructions
        TUTORIAL_MESSAGES: {
            FIRST_QUESTION: 'Watch the hungry guinea pig',
            FIRST_INSTRUCTION: 'There are 5 raisins. The hungry guinea pig is going to eat some of them.',
            QUESTION: 'How many raisins did the guinea pig eat?',
            SUBSEQUENT_QUESTION: 'How many of the 5 raisins does the guinea pig eat this time?'
        },
        
        NORMAL_MESSAGES: {
            FIRST_QUESTION: 'Watch the hungry guinea pig',
            FIRST_INSTRUCTION: 'There are 10 raisins. The hungry guinea pig is going to eat some of them.',
            QUESTION: 'How many raisins did the guinea pig eat?',
            SUBSEQUENT_QUESTION: 'How many of the 10 raisins does the guinea pig eat this time?'
        },
        
        ENCOURAGEMENTS: [
            'Well done!', 
            'Excellent!', 
            'Perfect!', 
            'Great counting!',
            'Super!',
            'Brilliant!'
        ],
        
        HINTS: [
            'Try counting how many more will make 5.',
            'Try counting how many more will make 10.',
            'Count how many raisins are left.',
            'Think about how many the guinea pig ate.'
        ],
        
        COMPLETION_MESSAGE: 'Well done! You have correctly counted how many raisins the guinea pig ate in all of the questions. Play again or return to the home page.'
    },
    
    // Button colors for the game
    COLORS: [
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', 
        '#eb4d4b', '#6c5ce7', '#a29bfe', '#fd79a8'
    ],
    
    // Helper functions
    isTutorialMode: function(questionNumber) {
        return questionNumber < this.TUTORIAL_MODE.QUESTIONS;
    },
    
    getTotalRaisins: function(questionNumber) {
        return this.isTutorialMode(questionNumber) ? 
            this.TUTORIAL_MODE.TOTAL_RAISINS : 
            this.NORMAL_MODE.TOTAL_RAISINS;
    },
    
    getDifficultyLevels: function(questionNumber) {
        return this.isTutorialMode(questionNumber) ? 
            this.TUTORIAL_MODE : 
            this.NORMAL_MODE;
    },
    
    getAudioMessages: function(questionNumber) {
        return this.isTutorialMode(questionNumber) ? 
            this.AUDIO.TUTORIAL_MESSAGES : 
            this.AUDIO.NORMAL_MESSAGES;
    },
    
    getHintMessage: function(questionNumber) {
        const hints = this.AUDIO.HINTS;
        return this.isTutorialMode(questionNumber) ? 
            hints[0] : // "Try counting how many more will make 5"
            hints[1];  // "Try counting how many more will make 10"
    }
};
