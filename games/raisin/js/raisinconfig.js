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
    
    // Guinea pig sizes (relative to game area height - simpler system)
    GUINEA_PIG_SIZES: {
        GP3: 24,  // 24% of game area height (16% * 1.5)
        GP2: 60,  // 60% of game area height (40% * 1.5)
        GP1: 60   // 60% of game area height (40% * 1.5)
    },
    
    // Timing configurations
    FLASH_DURATION: 800,
    NEXT_QUESTION_DELAY: 2000,
    GUINEA_PIG_3_INITIAL_DISPLAY: 4000,
    INITIAL_INSTRUCTION_DELAY: 1000,
    RAISIN_STAGGER_START: 1000,
    RAISIN_STAGGER_WINDOW: 3000,
    RAISIN_FADE_DURATION: 500,
    GUINEA_PIG_ANIMATION_DURATION: 2000,
    GUINEA_PIG_PAUSE_DURATION: 500,
    
    // Raisin settings
    RAISIN_SIZE: 0.08,
    RAISIN_MIN_DISTANCE: 0.12,
    
    // Game area exclusions - area to avoid placing raisins (for Guinea Pig 3)
    GUINEA_PIG_3_EXCLUSION: {
        x: 0,
        y: 0,
        width: 0.25,
        height: 0.25
    },
    
    // Audio settings
    AUDIO: {
        GUINEA_PIG_EATING_SOUND: '../../assets/raisin/guineapigeating.mp3',
        GUINEA_PIG_SOUND_VOLUME: 0.7,
        
        TUTORIAL_MESSAGES: {
            FIRST_QUESTION: 'Watch the hungry guinea pig',
            FIRST_INSTRUCTION: 'There are 5 raisins. The hungry guinea pig is going to eat some of them.',
            QUESTION: 'How many raisins did the guinea pig eat?',
            SUBSEQUENT_QUESTION: 'There are 5 raisins. Watch the guinea pig.',
            WRONG_ANSWER_HINT: 'We started with 5 raisins. Count how many there are left now, then count how many are missing - you can use your fingers to help you.'
        },
        
        NORMAL_MESSAGES: {
            FIRST_QUESTION: 'Watch the hungry guinea pig',
            FIRST_INSTRUCTION: 'There are 10 raisins. The hungry guinea pig is going to eat some of them.',
            QUESTION: 'How many raisins did the guinea pig eat?',
            SUBSEQUENT_QUESTION: 'There are 10 raisins. Watch the guinea pig.',
            WRONG_ANSWER_HINT: 'We started with 10 raisins. Count how many there are left now, then count how many are missing - you can use your fingers to help you.'
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
        '#eb4d4b', '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894'
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
            hints[0] : 
            hints[1];
    }
};
