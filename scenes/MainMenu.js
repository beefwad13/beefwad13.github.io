class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
    }    create() {
        // Reset cursor to default
        this.input.setDefaultCursor('default');

        // Get the center coordinates of the game
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;        // Create the title
        const title = this.add.text(centerX, centerY - 100, 'Not A Doom Shooter', {
            font: '48px Arial',
            fill: '#ffffff',
            backgroundColor: '#222222',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        // Add game instructions
        const instructions = [
            'GAME NOTES:',
            'Enemies spawn in waves every 15 seconds.',
            'Armor absorbs 1/3 of damage.',
            'Select 1 of 3 random upgrades when you level up.'
        ];
        
        instructions.forEach((text, index) => {
            this.add.text(centerX, centerY - 20 + (index * 25), text, {
                font: '16px Arial',
                fill: '#cccccc',
                align: 'center'
            }).setOrigin(0.5);
        });

        // Create the start button
        const startButton = this.add.text(centerX, centerY + 100, 'Start Game', {
            font: '32px Arial',
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        // Add hover effect
        startButton.on('pointerover', () => {
            startButton.setStyle({ fill: '#ffff00' });
        });

        startButton.on('pointerout', () => {
            startButton.setStyle({ fill: '#ffffff' });
        });

        // Add click handler to start the game
        startButton.on('pointerdown', () => {
            this.scene.start('TestLevel');
        });
    }
}
