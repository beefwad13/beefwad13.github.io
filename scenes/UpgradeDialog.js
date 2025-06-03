class UpgradeDialog extends Phaser.Scene {
    constructor() {
        super({ key: 'UpgradeDialog' });
        this.buttonBgs = [];
    }

    init(data) {
        this.playerRef = data.playerRef;
        this.parentScene = data.parentScene;
    }

    create() {
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

        // Add "Please wait..." text that will fade out
        const waitText = this.add.text(centerX, centerY - 120,
            'Please wait...',
            {
                font: '20px Arial',
                fill: '#ffff00',
                align: 'center'
            })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(HUD_DEPTH + 1);

        // Title
        this.add.text(centerX, centerY - 160,
            'Leveled up! Choose Your Upgrade',
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

        const createUpgradeButton = (y, upgrade) => {
            // Create background rectangle for button
            const buttonBg = this.add.rectangle(centerX, y, 300, 40, 0x444444)
                .setScrollFactor(0)
                .setDepth(HUD_DEPTH);
            
            this.buttonBgs.push(buttonBg);

            const button = this.add.text(centerX, y, upgrade.name, buttonStyle)
                .setOrigin(0.5)
                .setScrollFactor(0)
                .setDepth(HUD_DEPTH + 1);

            const desc = this.add.text(centerX, y + 25, upgrade.description, descStyle)
                .setOrigin(0.5, 0)
                .setScrollFactor(0)
                .setDepth(HUD_DEPTH);

            // Start with a darker color to indicate inactivity
            buttonBg.setFillStyle(0x333333);

            return { buttonBg, button, desc };
        };

        // Get random upgrades from the upgrade system
        const upgrades = window.upgradeSystem.getUpgradeChoices();
        const positions = [centerY - 80, centerY + 20, centerY + 120];

        // Create upgrade buttons and store their elements
        const buttons = upgrades.map((upgrade, index) => {
            return {
                ...createUpgradeButton(positions[index], upgrade),
                upgrade
            };
        });        // Enable buttons after 1 second
        this.time.delayedCall(1000, () => {
            // Enable all buttons
            buttons.forEach(({ buttonBg, button, upgrade }) => {
                buttonBg.setFillStyle(0x444444);
                buttonBg.setInteractive({ useHandCursor: true });

                // Add hover effects
                buttonBg.on('pointerover', () => {
                    buttonBg.setFillStyle(0x666666);
                    button.setStyle({ ...buttonStyle, fill: '#ffff00' });
                });

                buttonBg.on('pointerout', () => {
                    buttonBg.setFillStyle(0x444444);
                    button.setStyle(buttonStyle);
                });

                // Add click handler
                buttonBg.on('pointerdown', () => {
                    this.playerRef.applyUpgrade(upgrade);
                    // Reset cursor back to none (crosshair) before resuming game
                    this.input.setDefaultCursor('none');
                    this.scene.resume('TestLevel');
                    this.scene.stop();
                });
            });
            
            // Fade out the wait text
            this.tweens.add({
                targets: waitText,
                alpha: 0,
                duration: 500,
                onComplete: () => waitText.destroy()
            });
        });
    }
}
