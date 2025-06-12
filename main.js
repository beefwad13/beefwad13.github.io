// Global game scale factor - use this to scale game elements
window.gameScale = 0.5; // 60% scale

// Aspect Ratio 16:9 - Portrait
const SIZE_WIDTH_SCREEN = 960;
const SIZE_HEIGHT_SCREEN = 540;
const MIN_SIZE_WIDTH_SCREEN = 480;
const MIN_SIZE_HEIGHT_SCREEN = 270;
const MAX_SIZE_WIDTH_SCREEN = 1920;
const MAX_SIZE_HEIGHT_SCREEN = 1080;

const config = {
    type: Phaser.AUTO,
    //width: window.innerWidth < 800 ? 800 : (window.innerWidth > 1920 ? 1920 : window.innerWidth),
    //height: window.innerHeight < 600 ? 600 : (window.innerHeight > 1080 ? 1080 : window.innerHeight),
    //width: window.innerWidth,
    //height: window.innerHeight,
    backgroundColor: '#222',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: SIZE_WIDTH_SCREEN,
        height: SIZE_HEIGHT_SCREEN,
        min: {
            width: MIN_SIZE_WIDTH_SCREEN,
            height: MIN_SIZE_HEIGHT_SCREEN
        },
        max: {
            width: MAX_SIZE_WIDTH_SCREEN,
            height: MAX_SIZE_HEIGHT_SCREEN
        }
        
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
        }    
    },    
    scene: [MainMenu, TestLevel, GameOver, UpgradeDialog, PauseMenu, CoinStore]
    ,input: {
        activePointers: 4, // Support at least 3 simultaneous touches
    }
};

const game = new Phaser.Game(config);