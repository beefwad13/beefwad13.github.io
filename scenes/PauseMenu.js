class PauseMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseMenu' });
    }

    create() {
        this.parentScene = this.scene.get(this.scene.key);

        // Create semi-transparent black background
        this.bg = this.add.rectangle(0, 0, 
            this.cameras.main.width, 
            this.cameras.main.height, 
            0x000000, 0.7)
            .setOrigin(0)
            .setScrollFactor(0)
            .setInteractive();

        // Create modal container
        const modalWidth = 400;
        const modalHeight = 300;
        const x = this.cameras.main.centerX;
        const y = this.cameras.main.centerY;

        // Create dark modal background
        this.modalBg = this.add.rectangle(x, y, modalWidth, modalHeight, 0x333333)
            .setOrigin(0.5);

        // Add title
        this.add.text(x, y - 100, 'PAUSED', {
            font: '28px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);

        // Button style
        const buttonBgWidth = 200;
        const buttonBgHeight = 40;

        // Add Continue button background
        const continueBg = this.add.rectangle(x, y, buttonBgWidth, buttonBgHeight, 0x444444)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        // Add Continue button text
        const continueButton = this.add.text(x, y, 'Continue', {
            font: '20px Arial',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Add Quit button background
        const quitBg = this.add.rectangle(x, y + 50, buttonBgWidth, buttonBgHeight, 0x444444)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        // Add Quit button text
        const quitButton = this.add.text(x, y + 50, 'Quit to Main Menu', {
            font: '20px Arial',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Add hover effects for Continue button
        continueBg.on('pointerover', () => {
            continueBg.setFillStyle(0x666666);
            continueButton.setStyle({ fill: '#ffff00' });
        });
        continueBg.on('pointerout', () => {
            continueBg.setFillStyle(0x444444);
            continueButton.setStyle({ fill: '#ffffff' });
        });
        continueBg.on('pointerdown', () => this.resumeGame());

        // Add hover effects for Quit button
        quitBg.on('pointerover', () => {
            quitBg.setFillStyle(0x666666);
            quitButton.setStyle({ fill: '#ffff00' });
        });
        quitBg.on('pointerout', () => {
            quitBg.setFillStyle(0x444444);
            quitButton.setStyle({ fill: '#ffffff' });
        });
        quitBg.on('pointerdown', () => this.showQuitConfirmation());

        // Setup ESC key to resume
        this.input.keyboard.on('keydown-ESC', () => {
            this.resumeGame();
        });
    }

    showQuitConfirmation() {
        const x = this.cameras.main.centerX;
        const y = this.cameras.main.centerY;
        
        // Darken existing modal
        this.modalBg.setFillStyle(0x222222);

        // Create confirmation panel background
        const confirmPanelBg = this.add.rectangle(x, y, 300, 150, 0x333333)
            .setOrigin(0.5);
        
        // Add confirmation text
        const confirmText = this.add.text(x, y - 25, 'Are you sure you want to quit?', {
            font: '20px Arial',
            fill: '#ffffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Button style
        const buttonBgWidth = 80;
        const buttonBgHeight = 40;

        // Add Yes button background
        const yesBg = this.add.rectangle(x - 50, y + 25, buttonBgWidth, buttonBgHeight, 0x444444)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        // Add Yes button text
        const yesButton = this.add.text(x - 50, y + 25, 'Yes', {
            font: '20px Arial',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Add No button background
        const noBg = this.add.rectangle(x + 50, y + 25, buttonBgWidth, buttonBgHeight, 0x444444)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        // Add No button text
        const noButton = this.add.text(x + 50, y + 25, 'No', {
            font: '20px Arial',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // Add hover effects for Yes button
        yesBg.on('pointerover', () => {
            yesBg.setFillStyle(0x666666);
            yesButton.setStyle({ fill: '#ffff00' });
        });
        yesBg.on('pointerout', () => {
            yesBg.setFillStyle(0x444444);
            yesButton.setStyle({ fill: '#ffffff' });
        });
        yesBg.on('pointerdown', () => {
            this.scene.stop('TestLevel');
            this.scene.start('MainMenu');
        });

        // Add hover effects for No button
        noBg.on('pointerover', () => {
            noBg.setFillStyle(0x666666);
            noButton.setStyle({ fill: '#ffff00' });
        });
        noBg.on('pointerout', () => {
            noBg.setFillStyle(0x444444);
            noButton.setStyle({ fill: '#ffffff' });
        });
        noBg.on('pointerdown', () => {
            // Remove confirmation elements
            confirmText.destroy();
            yesButton.destroy();
            noButton.destroy();
            yesBg.destroy();
            noBg.destroy();
            confirmPanelBg.destroy();
            this.modalBg.setFillStyle(0x333333);
        });
    }

    resumeGame() {
        this.scene.resume('TestLevel');
        this.scene.stop();
    }
}

if (typeof module !== 'undefined') {
    module.exports = PauseMenu;
}
