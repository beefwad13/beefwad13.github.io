class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
    }    create() {
        // Reset cursor to default
        this.input.setDefaultCursor('default');

        // Get the center coordinates of the game
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;        
        
        // Create the title
        const title = this.add.text(centerX, centerY - 100, 'Not A Doom Shooter', {
            font: '48px Arial',
            fill: '#ffffff',
            backgroundColor: '#222222',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        // Add total coins display
        const totalCoins = parseInt(localStorage.getItem('totalCoins')) || 0;
        this.add.text(centerX, centerY - 40, `Total Coins: ${totalCoins}`, {
            font: '24px Arial',
            fill: '#ffdd00',
            stroke: '#000000',
            strokeThickness: 2,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Add game instructions
        const instructions = [
            'GAME NOTES:',
            'Enemies spawn in waves every 15 seconds.',
            'Armor absorbs 1/3 of damage.',
            'Select 1 of 3 random upgrades when you level up.'
        ];
        
        instructions.forEach((text, index) => {
            this.add.text(centerX, centerY + 20 + (index * 25), text, {
                font: '16px Arial',
                fill: '#cccccc',
                align: 'center'
            }).setOrigin(0.5);
        });

        // Create the buttons
        const startButton = this.add.text(centerX, centerY + 140, 'Start Game', {
            font: '24px Arial',
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        const storeButton = this.add.text(centerX, centerY + 210, 'Store', {
            font: '24px Arial',
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        // Add hover effects
        [startButton, storeButton].forEach(button => {
            button.on('pointerover', () => {
                button.setStyle({ fill: '#ffff00' });
            });
            button.on('pointerout', () => {
                button.setStyle({ fill: '#ffffff' });
            });
        });

        // Add click handlers
        startButton.on('pointerdown', () => {
            this.scene.start('TestLevel');
        });

        storeButton.on('pointerdown', () => {
            this.scene.start('CoinStore');
        });
    }
}
