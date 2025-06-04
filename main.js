const config = {
    type: Phaser.AUTO,
    width: 1280, // Base width - good middle ground for most devices
    height: 720, // Base height - 16:9 aspect ratio
    backgroundColor: '#222',
    plugins: {
        scene: [{
            key: 'rexVirtualJoystick',
            plugin: rexvirtualjoystickplugin,
            mapping: 'rexVirtualJoystick'
        }]
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: 'game',
        min: {
            width: 320,
            height: 180
        },
        max: {
            width: 2560,
            height: 1440
        },
        zoom: 1
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
        }
    },
    scene: [MainMenu, TestLevel, GameOver, UpgradeDialog, PauseMenu, CoinStore]
};

const game = new Phaser.Game(config);
