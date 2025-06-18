const CONFIG = {
    NUMBERS_TO_COMPLETE: 10,
    RAINBOW_PIECES: 10,
    
    SLIDER_SIZE: 40,
    PATH_TOLERANCE: 15,
    FILL_COLOR: '#90EE90',
    OUTLINE_COLOR: '#333333',
    SLIDER_COLOR: '#FF6B6B',
    ARROW_COLOR: '#4ECDC4',
    PATH_WIDTH: 8,
    OUTLINE_WIDTH: 3,
    ARROW_OFFSET: 50,
    ARROW_SIZE: 20,
    
    SVG_WIDTH: 400,
    SVG_HEIGHT: 400,
    NUMBER_RECT_HEIGHT: 200,
    NUMBER_RECT_WIDTH: 120,
    NUMBER_CENTER_X: 200,
    NUMBER_CENTER_Y: 200,
    
    COMPLETION_DELAY: 2000,
    SLIDER_TRANSITION_SPEED: '0.1s',
    
    AUDIO_ENABLED: true,
    
    NUMBER_WORDS: {
        0: 'zero',
        1: 'one', 
        2: 'two',
        3: 'three',
        4: 'four',
        5: 'five',
        6: 'six',
        7: 'seven',
        8: 'eight',
        9: 'nine'
    },
    
    STROKE_DEFINITIONS: {
        0: {
            strokes: [{
                id: 'oval',
                startPoint: { x: 200, y: 100 },
                path: 'M 200 100 C 240 100 260 125 260 200 C 260 275 240 300 200 300 C 160 300 140 275 140 200 C 140 125 160 100 200 100',
                description: 'Draw the oval'
            }]
        },
        1: {
            strokes: [{
                id: 'line',
                startPoint: { x: 200, y: 100 },
                path: 'M 200 100 L 200 300',
                description: 'Draw down'
            }]
        },
        2: {
            strokes: [{
                id: 'curve',
                startPoint: { x: 140, y: 130 },
                path: 'M 140 130 C 140 110 165 100 200 100 C 235 100 260 110 260 130 C 260 150 235 160 215 170 L 140 280 L 260 280',
                description: 'Draw 2'
            }]
        },
        3: {
            strokes: [{
                id: 'curves',
                startPoint: { x: 140, y: 100 },
                path: 'M 140 100 C 165 100 200 100 200 100 C 235 100 260 105 260 130 C 260 155 235 160 215 180 C 235 200 260 205 260 230 C 260 255 235 300 200 300 C 165 300 140 295 140 285',
                description: 'Draw 3'
            }]
        },
        4: {
            strokes: [{
                id: 'angle',
                startPoint: { x: 140, y: 100 },
                path: 'M 140 100 L 190 250 L 260 250',
                description: 'Draw angle'
            }, {
                id: 'vertical',
                startPoint: { x: 210, y: 100 },
                path: 'M 210 100 L 210 300',
                description: 'Draw line'
            }]
        },
        5: {
            strokes: [{
                id: 'top',
                startPoint: { x: 140, y: 100 },
                path: 'M 140 100 L 260 100',
                description: 'Draw top'
            }, {
                id: 'curve',
                startPoint: { x: 140, y: 100 },
                path: 'M 140 100 L 140 200 C 140 200 165 200 200 200 C 235 200 260 210 260 240 C 260 270 235 280 200 280 C 165 280 140 270 140 240',
                description: 'Draw curve'
            }]
        },
        6: {
            strokes: [{
                id: 'curve',
                startPoint: { x: 250, y: 140 },
                path: 'M 250 140 C 250 115 225 100 200 100 C 175 100 150 115 150 140 L 150 260 C 150 285 175 300 200 300 C 225 300 250 285 250 260 C 250 235 225 220 200 220 C 175 220 150 235 150 250',
                description: 'Draw 6'
            }]
        },
        7: {
            strokes: [{
                id: 'line',
                startPoint: { x: 140, y: 100 },
                path: 'M 140 100 L 260 100 L 180 300',
                description: 'Draw 7'
            }]
        },
        8: {
            strokes: [{
                id: 'eight',
                startPoint: { x: 230, y: 130 },
                path: 'M 230 130 C 230 110 215 100 200 100 C 185 100 170 110 170 130 C 170 150 185 160 200 160 C 215 160 230 170 230 200 C 230 230 215 240 200 240 C 185 240 170 250 170 270 C 170 290 185 300 200 300 C 215 300 230 290 230 270 C 230 250 215 240 200 240 C 185 240 170 230 170 200 C 170 170 185 160 200 160 C 215 160 230 150 230 130',
                description: 'Draw 8'
            }]
        },
        9: {
            strokes: [{
                id: 'nine',
                startPoint: { x: 250, y: 140 },
                path: 'M 250 140 C 250 115 225 100 200 100 C 175 100 150 115 150 140 C 150 165 175 180 200 180 C 225 180 250 165 250 140 L 250 300',
                description: 'Draw 9'
            }]
        }
    },
    
    RAINBOW_COLORS: [
        '#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00',
        '#00ff80', '#00ffff', '#0080ff', '#0000ff', '#8000ff'
    ],
    
    NUMBERS_SEQUENCE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    DEBUG_MODE: false,
    SHOW_START_POINTS: true
};
