const config = {
    type: Phaser.AUTO,
    width: window.innerWidth < 800 ? 800 : (window.innerWidth > 1920 ? 1920 : window.innerWidth),
    height: window.innerHeight < 600 ? 600 : (window.innerHeight > 1080 ? 1080 : window.innerHeight),
    backgroundColor: '#222',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 800,
            height: 600
        },
        max: {
            width: 1920,
            height: 1080
        }
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
        }    },    scene: [MainMenu, TestLevel, GameOver, UpgradeDialog, PauseMenu, CoinStore]
};

const game = new Phaser.Game(config);
