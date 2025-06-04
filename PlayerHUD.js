// PlayerHUD class for managing and updating the player HUD
class PlayerHUD {
    constructor(scene, playerStats, weapons, currentWeaponIndexRef) {
        this.scene = scene;
        this.playerStats = playerStats;
        this.weapons = weapons;
        this.currentWeaponIndexRef = currentWeaponIndexRef;
        this.hudScale = 0.8; // 20% smaller
        this.createHUD();
    }

    createHUD() {
        const barLeft = 20;
        const HUD_DEPTH = 5000;
        
        // Level and XP text at the top
        this.levelText = this.scene.add.text(barLeft, 10, 'Level 1', { 
            font: `${Math.floor(20 * this.hudScale)}px Arial`, 
            fill: '#ffff00',
            fontStyle: 'bold' 
        }).setScrollFactor(0).setDepth(HUD_DEPTH);

        // Coin counters - scaled down 20%
        const coinPadding = Math.floor(20 * this.hudScale); // Scale the padding too
        const coinVerticalSpacing = Math.floor(25 * this.hudScale); // Scale the vertical spacing
        
        this.coinText = this.scene.add.text(this.scene.cameras.main.width - coinPadding, 10, 'This Run: 0', {
            font: `${Math.floor(20 * this.hudScale)}px Arial`,
            fill: '#ffdd00',
            fontStyle: 'bold'
        }).setScrollFactor(0).setDepth(HUD_DEPTH).setOrigin(1, 0);

        this.totalCoinsText = this.scene.add.text(this.scene.cameras.main.width - coinPadding, 10 + coinVerticalSpacing, 'Total: 0', {
            font: `${Math.floor(20 * this.hudScale)}px Arial`,
            fill: '#ffbb00',
            fontStyle: 'bold'
        }).setScrollFactor(0).setDepth(HUD_DEPTH).setOrigin(1, 0);

        // Make coin counters responsive to window resize
        this.scene.scale.on('resize', (gameSize) => {
            this.coinText.x = gameSize.width - coinPadding;
            this.totalCoinsText.x = gameSize.width - coinPadding;
        });
        
        this.expText = this.scene.add.text(barLeft + Math.floor(100 * this.hudScale), 10, 'XP: 0/100', { 
            font: `${Math.floor(18 * this.hudScale)}px Arial`, 
            fill: '#ffff99'
        }).setScrollFactor(0).setDepth(HUD_DEPTH);

        // Health bar
        const barWidth = Math.floor(200 * this.hudScale);
        const healthBarHeight = Math.floor(24 * this.hudScale);
        this.healthBarBg = this.scene.add.rectangle(barLeft, 40, barWidth + 4, healthBarHeight, 0x222222)
            .setScrollFactor(0).setOrigin(0,0.5).setDepth(HUD_DEPTH);
        this.healthBar = this.scene.add.rectangle(barLeft + 2, 40, barWidth, Math.floor(20 * this.hudScale), 0xff0000)
            .setScrollFactor(0).setOrigin(0,0.5).setDepth(HUD_DEPTH);
        this.healthText = this.scene.add.text(barLeft + Math.floor(210 * this.hudScale), Math.floor(32 * this.hudScale), 
            `Health: ${this.playerStats.health}`, 
            { font: `${Math.floor(16 * this.hudScale)}px Arial`, fill: '#ff6666', fontStyle: 'bold' })
            .setScrollFactor(0).setDepth(HUD_DEPTH);

        // Armor bar
        const armorBarHeight = Math.floor(16 * this.hudScale);
        this.armorBarBg = this.scene.add.rectangle(barLeft, Math.floor(64 * this.hudScale), barWidth + 4, armorBarHeight, 0x222222)
            .setScrollFactor(0).setOrigin(0,0.5).setDepth(HUD_DEPTH);
        this.armorBar = this.scene.add.rectangle(barLeft + 2, Math.floor(64 * this.hudScale), barWidth, Math.floor(12 * this.hudScale), 0x3399ff)
            .setScrollFactor(0).setOrigin(0,0.5).setDepth(HUD_DEPTH);
        this.armorText = this.scene.add.text(barLeft + Math.floor(210 * this.hudScale), Math.floor(56 * this.hudScale), 
            `Armor: ${this.playerStats.armor}`, 
            { font: `${Math.floor(16 * this.hudScale)}px Arial`, fill: '#66ccff', fontStyle: 'bold' })
            .setScrollFactor(0).setDepth(HUD_DEPTH);

        // Stamina bar
        this.staminaBarBg = this.scene.add.rectangle(barLeft, Math.floor(84 * this.hudScale), barWidth + 4, armorBarHeight, 0x222222)
            .setScrollFactor(0).setOrigin(0,0.5).setDepth(HUD_DEPTH);
        this.staminaBar = this.scene.add.rectangle(barLeft + 2, Math.floor(84 * this.hudScale), barWidth, Math.floor(12 * this.hudScale), 0x33ff66)
            .setScrollFactor(0).setOrigin(0,0.5).setDepth(HUD_DEPTH);
        this.staminaText = this.scene.add.text(barLeft + Math.floor(210 * this.hudScale), Math.floor(76 * this.hudScale), 
            `Stamina: ${this.playerStats.stamina}`, 
            { font: `${Math.floor(16 * this.hudScale)}px Arial`, fill: '#66ff99', fontStyle: 'bold' })
            .setScrollFactor(0).setDepth(HUD_DEPTH);

        // Weapon HUD
        const weaponTextY = Math.floor(110 * this.hudScale);

        // Create weapon slots background
        const slotSize = Math.floor(64 * this.hudScale);
        const slotPadding = Math.floor(10 * this.hudScale);
        const slotsStartX = barLeft;
        const slotsY = weaponTextY;

        // Create weapon slots
        this.weaponSlots = [];
        this.weapons.forEach((weapon, index) => {
            const slotBg = this.scene.add.rectangle(
                slotsStartX + (index * (slotSize + slotPadding)),
                slotsY,
                slotSize,
                slotSize,
                0x333333
            ).setScrollFactor(0).setOrigin(0, 0).setDepth(HUD_DEPTH);

            const weaponSprite = this.scene.add.sprite(
                slotBg.x + slotSize/2,
                slotBg.y + slotSize/2,
                weapon.sprite
            ).setScrollFactor(0).setScale(0.5 * this.hudScale).setDepth(HUD_DEPTH);

            // Dim weapons that aren't unlocked
            if (!weapon.unlocked) {
                weaponSprite.setAlpha(0.3);
            }

            this.weaponSlots.push({ bg: slotBg, sprite: weaponSprite });
        });

        this.ammoText = this.scene.add.text(barLeft, weaponTextY + Math.floor(74 * this.hudScale), '', 
            { font: `${Math.floor(18 * this.hudScale)}px Arial`, fill: '#fff', fontFamily: 'monospace' })
            .setScrollFactor(0).setOrigin(0, 0).setDepth(HUD_DEPTH);
    }    updateHUD() {
        const barWidth = Math.floor(200 * this.hudScale);
        
        // Level and Experience
        if (this.levelText) {
            this.levelText.setText(`Level ${this.playerStats.level}`);
        }
        
        // Update coin counters
        if (this.coinText) {
            this.coinText.setText(`This Run: ${this.playerStats.coins || 0}`);
        }
        if (this.totalCoinsText) {
            this.totalCoinsText.setText(`Total: ${window.playerStats.totalCoins}`);
        }

        if (this.expText) {
            const totalNeeded = window.playerStats.getTotalXPNeeded(this.playerStats.level);
            this.expText.setText(`XP: ${this.playerStats.experience}/${totalNeeded}`);
        }

        // Update weapon slots
        if (this.weaponSlots) {
            this.weaponSlots.forEach((slot, index) => {
                const weapon = this.weapons[index];
                // Update slot background color
                slot.bg.setFillStyle(index === this.currentWeaponIndexRef.value ? 0x666666 : 0x333333);
                // Update weapon sprite alpha
                slot.sprite.setAlpha(weapon.unlocked ? 1 : 0.3);
            });
        }

        // Health bar and text
        if (this.healthBar && this.healthBarBg) {
            this.healthBar.width = barWidth * (this.playerStats.health / this.playerStats.maxHealth);
            this.healthBar.fillColor = 0xff0000;
        }
        if (this.healthText) {
            this.healthText.setText(`Health: ${this.playerStats.health}`);
        }
        // Armor bar and text
        if (this.armorBar && this.armorBarBg) {
            this.armorBar.width = barWidth * (this.playerStats.armor / this.playerStats.maxArmor);
            this.armorBar.fillColor = 0x3399ff;
        }
        if (this.armorText) {
            this.armorText.setText(`Armor: ${this.playerStats.armor}`);
        }
        // Stamina bar and text
        if (this.staminaBar && this.staminaBarBg) {
            this.staminaBar.width = barWidth * (this.playerStats.stamina / this.playerStats.maxStamina);
        }
        if (this.staminaText) {
            this.staminaText.setText(`Stamina: ${Math.floor(this.playerStats.stamina)}`);
        }
        
        // Ammo display
        const currentWeapon = this.weapons[this.currentWeaponIndexRef.value];
        if (currentWeapon && this.ammoText) {
            if (currentWeapon.magazineSize === -1) {
                this.ammoText.setText('Ammo: ∞');
            } else if (currentWeapon.reloading) {
                this.ammoText.setText('Reloading...');
            } else {
                // Visual magazine bar (e.g. [|||||     ])
                let magBar = '[';
                for (let i = 0; i < currentWeapon.magazineSize; i++) {
                    magBar += i < currentWeapon.ammo ? '|' : ' ';
                }
                magBar += ']';
                this.ammoText.setText(`${currentWeapon.name}: ${currentWeapon.ammo} / ${currentWeapon.magazineSize}  ${magBar}`);
            }
        }
    }
}

if (typeof module !== 'undefined') {
    module.exports = PlayerHUD;
}
