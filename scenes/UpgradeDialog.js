class UpgradeDialog extends Phaser.Scene {
    constructor() {
        super({ key: 'UpgradeDialog' });
    }

    init(data) {
        this.playerRef = data.playerRef;
        this.parentScene = data.parentScene;
    }    create() {
        // Set cursor to default for the dialog
        this.input.setDefaultCursor('default');

        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        const HUD_DEPTH = 6000;

        // Create semi-transparent background
        this.add.rectangle(0, 0, 
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000, 0.7)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(HUD_DEPTH);

        // Create upgrade panel
        this.add.rectangle(centerX, centerY,
            500, 400,
            0x333333)
            .setScrollFactor(0)
            .setDepth(HUD_DEPTH);

        // Title
        this.add.text(centerX, centerY - 160,
            'Choose Your Upgrade',
            {
                font: '28px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                fontStyle: 'bold'
            })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(HUD_DEPTH);

        const buttonStyle = {
            font: '20px Arial',
            fill: '#ffffff',
            align: 'center'
        };

        const descStyle = {
            font: '16px Arial',
            fill: '#cccccc',
            wordWrap: { width: 300 },
            align: 'center'
        };

        const createUpgradeOption = (y, title, description, type) => {
            // Create background rectangle for button
            const buttonBg = this.add.rectangle(centerX, y, 300, 40, 0x444444)
                .setScrollFactor(0)
                .setDepth(HUD_DEPTH)
                .setInteractive({ useHandCursor: true });

            const button = this.add.text(centerX, y, title, buttonStyle)
                .setOrigin(0.5)
                .setScrollFactor(0)
                .setDepth(HUD_DEPTH + 1);

            const desc = this.add.text(centerX, y + 25, description, descStyle)
                .setOrigin(0.5, 0)
                .setScrollFactor(0)
                .setDepth(HUD_DEPTH);

            // Add hover effects
            buttonBg.on('pointerover', () => {
                buttonBg.setFillStyle(0x666666);
                button.setStyle({ ...buttonStyle, fill: '#ffff00' });
            });

            buttonBg.on('pointerout', () => {
                buttonBg.setFillStyle(0x444444);
                button.setStyle(buttonStyle);
            });            // Add click handler
            buttonBg.on('pointerdown', () => {
                this.playerRef.applyUpgrade(type);
                // Reset cursor back to none (crosshair) before resuming game
                this.input.setDefaultCursor('none');
                this.scene.resume('TestLevel');
                this.scene.stop();
            });
        };

        createUpgradeOption(
            centerY - 80,
            'Increase Max Health',
            'Gain +5 max health and heal for 5 points',
            'health'
        );

        createUpgradeOption(
            centerY + 20,
            'Increase Armor',
            'Gain +5 armor protection against enemy attacks',
            'armor'
        );

        createUpgradeOption(
            centerY + 120,
            'Increase Max Stamina',
            'Gain +5 max stamina for more frequent dodge rolls',
            'stamina'
        );
    }
}
