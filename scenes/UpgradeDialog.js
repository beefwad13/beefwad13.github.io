class UpgradeDialog extends Phaser.Scene {
    constructor() {
        super({ key: 'UpgradeDialog' });
        this.previousCursorState = null;
    }

    preload() {
        // Preload icons if they haven't been loaded yet
        // This is a safety check in case the icons weren't preloaded in the main scene
        const upgrades = window.upgradeSystem.upgrades;
        const allUpgrades = [...upgrades.stats, ...upgrades.weapons];
        
        // Create a Set of unique icon paths
        const uniqueIcons = new Set();
        allUpgrades.forEach(upgrade => {
            if (upgrade.icon) {
                uniqueIcons.add(upgrade.icon);
            }
        });
        
        // Preload each unique icon
        uniqueIcons.forEach(iconPath => {
            const key = this.getIconKey(iconPath);
            if (!this.textures.exists(key)) {
                this.load.image(key, iconPath);
            }
        });
    }

    // Helper method to convert icon path to a texture key
    getIconKey(iconPath) {
        return iconPath.split('/').pop().split('.')[0];
    }

    // Save the previous cursor state and show the default cursor
    create() {
        // Store the previous cursor state
        this.previousCursorState = this.input.defaultCursor;
        
        // Set cursor to default pointer
        this.input.setDefaultCursor('pointer');
        
        // Set up background
        const { width: gameWidth, height: gameHeight } = this.cameras.main;
        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2;
        
        // Create semi-transparent black overlay
        this.add.rectangle(0, 0, gameWidth, gameHeight, 0x000000, 0.7)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(3000);
        
        // Title text
        const titleY = centerY - 160;
        const titleFontSize = 28;
        const titleStrokeThickness = 4;
        
        this.add.text(centerX, titleY,
            'Leveled up! Choose Your Upgrade',
            {
                font: `${titleFontSize}px Arial`,
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: titleStrokeThickness,
                fontStyle: 'bold'
            })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(3001);
        
        // Styles for buttons and descriptions
        const buttonStyle = {
            font: '20px Arial',
            fill: '#ffffff',
            align: 'center'
        };
        
        const descStyle = {
            font: '14px Arial',
            fill: '#cccccc',
            wordWrap: { width: 280 }, // Reduced width to accommodate the icon
            align: 'center'
        };
        
        // Track button objects for hover effects
        this.buttons = [];
        this.buttonBgs = [];
        
        // Get upgrade choices from the upgrade system
        const upgradeChoices = window.upgradeSystem.getUpgradeChoices();
        
        // Create buttons at specific vertical positions
        const positions = [centerY - 60, centerY + 40, centerY + 140];
        
        upgradeChoices.forEach((upgrade, index) => {
            const y = positions[index];
            // Pass the styles as parameters to createUpgradeButton
            const buttonObj = this.createUpgradeButton(y, upgrade, buttonStyle, descStyle);
            this.buttons.push(buttonObj);
        });
        
        // Add keyboard handlers for selecting upgrades (1-3 keys)
        this.input.keyboard.on('keydown-ONE', () => this.selectUpgrade(0));
        this.input.keyboard.on('keydown-TWO', () => this.selectUpgrade(1));
        this.input.keyboard.on('keydown-THREE', () => this.selectUpgrade(2));
        
        // Store upgrade choices for reference
        this.upgradeChoices = upgradeChoices;
        
        // Start with all buttons active
        this.activateButtons();
    }

    createUpgradeButton(y, upgrade, buttonStyle, descStyle) {
        const centerX = this.cameras.main.width / 2;
        const HUD_DEPTH = 3001;
        
        // Create background rectangle for button
        const buttonWidth = 360; // Increased from 300 to 360 for wider buttons
        const buttonHeight = 70; 
        
        const buttonBg = this.add.rectangle(centerX, y, buttonWidth, buttonHeight, 0x444444)
            .setScrollFactor(0)
            .setDepth(HUD_DEPTH)
            .setInteractive()
            .on('pointerover', () => {
                buttonBg.setFillStyle(0x666666);
            })
            .on('pointerout', () => {
                buttonBg.setFillStyle(0x444444);
            })
            .on('pointerdown', () => {
                this.selectUpgrade(this.buttonBgs.indexOf(buttonBg));
            });
    
        this.buttonBgs.push(buttonBg);
    
        // Add the icon (made smaller)
        let icon = null;
        if (upgrade.icon) {
            const iconKey = this.getIconKey(upgrade.icon);
            icon = this.add.image(centerX - 140, y, iconKey)
                .setScrollFactor(0)
                .setDepth(HUD_DEPTH + 1)
                .setScale(0.4); // Reduced from 0.5 to 0.4 for smaller icons
        }
    
        // Adjust text position with more space for the wider button
        const button = this.add.text(centerX - 100, y - 15, upgrade.name, buttonStyle)
            .setOrigin(0, 0.5)
            .setScrollFactor(0)
            .setDepth(HUD_DEPTH + 1);
    
        // Update description text with more width for the wider button
        const desc = this.add.text(centerX - 100, y, upgrade.description, {
            ...descStyle,
            wordWrap: { width: 280 } // Increased wordwrap width for the wider button
        })
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(HUD_DEPTH);
    
        return { buttonBg, button, desc, icon };
    }

    activateButtons() {
        this.buttonBgs.forEach(bg => {
            bg.setInteractive();
        });
    }
    
    deactivateButtons() {
        this.buttonBgs.forEach(bg => {
            bg.disableInteractive();
        });
    }

    selectUpgrade(index) {
        if (index < 0 || index >= this.upgradeChoices.length) return;
        
        // Prevent multiple selections
        this.deactivateButtons();
        
        const selectedUpgrade = this.upgradeChoices[index];
        
        // Highlight the selected button
        const selectedBg = this.buttonBgs[index];
        if (selectedBg) {
            selectedBg.setFillStyle(0x00aa00); // Green highlight
        }
        
        // Apply upgrade effect based on type
        if (selectedUpgrade.type === 'stats') {
            this.applyStatsUpgrade(selectedUpgrade);
        } else if (selectedUpgrade.type === 'weapons') {
            this.applyWeaponUpgrade(selectedUpgrade);
        }
        
                
        // Close dialog after brief delay to show the selection
        this.time.delayedCall(500, () => {
            // Restore previous cursor state before returning to the game scene
            if (this.previousCursorState !== null) {
                this.input.setDefaultCursor(this.previousCursorState);
            }
            
            this.scene.resume('TestLevel');
            this.scene.stop();
        });
    }
    
    applyStatsUpgrade(upgrade) {
        // Get the player reference from the data passed when launching this scene
        const playerRef = this.scene.settings.data?.playerRef;
        
        if (playerRef && typeof playerRef.applyUpgrade === 'function') {
            // Call the player's applyUpgrade method directly
            playerRef.applyUpgrade(upgrade);
        } else {
            // Fallback to previous implementation using playerStats global
            const playerStats = window.playerStats;
            
            switch (upgrade.id) {
                case 'health':
                    playerStats.maxHealth += 5;
                    playerStats.health = Math.min(playerStats.health + 5, playerStats.maxHealth);
                    break;
                case 'armor':
                    playerStats.maxArmor += 5;
                    playerStats.armor = Math.min(playerStats.armor + 5, playerStats.maxArmor);
                    break;
                case 'stamina':
                    playerStats.maxStamina += 5;
                    playerStats.stamina = playerStats.maxStamina; // Refill stamina
                    break;
                // Handle any other stats upgrades
            }
        }
    }
    
    applyWeaponUpgrade(upgrade) {
        // The weapon upgrades might not need player reference since they modify global WEAPONS
        // This can remain largely the same as before
        const weapon = window.WEAPONS[upgrade.weaponIndex];
        
        if (!weapon) return;
        
        // Unlock weapon if it's not already unlocked
        if (upgrade.id.includes('unlock') && !weapon.unlocked) {
            weapon.unlocked = true;
            return;
        }
        
        // Handle various weapon attribute upgrades
        if (upgrade.upgradeType) {
            const currentValue = weapon[upgrade.upgradeType];
            const increment = upgrade.increment || 1;
            
            // Use the same logic from Player.applyUpgrade for weapon upgrades
            weapon[upgrade.upgradeType] = upgrade.isReverse ? 
                Math.max(upgrade.maxValue, currentValue + increment) :
                Math.min(upgrade.maxValue, currentValue + increment);
            
            // If this is an ammo-related upgrade, also update current ammo
            if (upgrade.upgradeType === 'magazineSize') {
                weapon.ammo = Math.min(weapon.ammo + increment, weapon.magazineSize);
            }
        }
    }

    shutdown() {
        // Ensure cursor state is restored if the scene is shut down
        if (this.previousCursorState !== null) {
            this.input.setDefaultCursor(this.previousCursorState);
        }
        
        // Clean up any other resources
        if (this.buttons) {
            this.buttons.forEach(button => {
                if (button.icon && button.icon.destroy) button.icon.destroy();
                if (button.button && button.button.destroy) button.button.destroy();
                if (button.desc && button.desc.destroy) button.desc.destroy();
                if (button.buttonBg && button.buttonBg.destroy) button.buttonBg.destroy();
            });
        }
        
        this.buttons = [];
        this.buttonBgs = [];
        this.upgradeChoices = null;
    }
}
