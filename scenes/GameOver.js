class GameOver extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOver' });
    }    create() {
        // Reset cursor to default
        this.input.setDefaultCursor('default');
        
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        // Create Game Over text
        const gameOverText = this.add.text(centerX, 80, 'Game Over', {
            font: '64px Arial',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 6
        })
        .setOrigin(0.5)
        .setScrollFactor(0);

        // Create Player Stats section
        const statsStyle = {
            font: '16px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        };

        // Stats title
        this.add.text(centerX, 160, 'Player Stats', {
            font: '24px Arial',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);        // Stats details          
        const stats = [
            `Level: ${this.registry.get('level') || 1}`,
            `Total XP: ${this.registry.get('experience') || 0}`,
            `Coins Earned: ${this.registry.get('coins') || 0}`,
            `Kills: ${window.playerStats.kills}`,
            `Time Survived: ${window.playerStats.getFormattedTime()}`,
            `Reached Wave: ${window.playerStats.lastWave}`
        ];

        stats.forEach((stat, index) => {
            this.add.text(centerX, 200 + (index * 20), stat, statsStyle)
                .setOrigin(0.5);
        });

        // Create Try Again button
        const tryAgainButton = this.add.text(centerX, centerY + 100, 'Try Again?', {
            font: '24px Arial',
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        // Create Main Menu button
        const mainMenuButton = this.add.text(centerX, centerY + 150, 'Back to Main Menu', {
            font: '24px Arial',
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        // Add hover effects
        [tryAgainButton, mainMenuButton].forEach(button => {
            button.on('pointerover', () => button.setStyle({ fill: '#ffff00' }));
            button.on('pointerout', () => button.setStyle({ fill: '#ffffff' }));
        });        // Add click handlers
        tryAgainButton.on('pointerdown', () => {
            this.scene.stop('GameOver'); // Stop the current scene
            this.scene.start('TestLevel');
        });

        mainMenuButton.on('pointerdown', () => {
            this.scene.stop('GameOver'); // Stop the current scene
            this.scene.start('MainMenu');
        });
    }
}
