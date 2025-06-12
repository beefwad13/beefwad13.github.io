// PlayerHUD class for managing and updating the player HUD
class PlayerHUD {
    constructor(scene, playerStats, weapons, currentWeaponIndexRef) {
        this.scene = scene;
        this.playerStats = playerStats;
        this.weapons = weapons;
        this.currentWeaponIndexRef = currentWeaponIndexRef;
        this.createHUD();    
    }
    
    createHUD() {
        const barLeft = 20;
        const HUD_DEPTH = 3000; // UI elements: 1000+ (keeping existing HUD elements at 3000+ for consistency)
        
        // Scale font sizes based on gameScale
        const baseFontSize = 26;
        const scaledFontSize = Math.round(baseFontSize * window.gameScale);
        const smallerFontSize = Math.round(24 * window.gameScale);
        const smallestFontSize = Math.round(22 * window.gameScale);
          
        // Level and XP text at the top
        this.levelText = this.scene.add.text(barLeft, 10, 'Level 1', { 
            font: `${scaledFontSize}px Arial`, 
            fill: '#ffff00',
            fontStyle: 'bold' 
        }).setScrollFactor(0).setDepth(HUD_DEPTH);        // Coin counters
        this.coinText = this.scene.add.text(this.scene.cameras.main.width - 20, 10, 'This Run: 0', {
            font: `${scaledFontSize}px Arial`,
            fill: '#ffdd00',
            fontStyle: 'bold'
        }).setScrollFactor(0).setDepth(HUD_DEPTH).setOrigin(1, 0);

        this.totalCoinsText = this.scene.add.text(this.scene.cameras.main.width - 20, 35, 'Total: 0', {
            font: `${scaledFontSize}px Arial`,
            fill: '#ffbb00',
            fontStyle: 'bold'
        }).setScrollFactor(0).setDepth(HUD_DEPTH).setOrigin(1, 0);

        // Make coin counters responsive to window resize
        this.scene.scale.on('resize', (gameSize) => {
            this.coinText.x = gameSize.width - 20;
            this.totalCoinsText.x = gameSize.width - 20;
        });
          this.expText = this.scene.add.text(barLeft + 100, 10, 'XP: 0/100', { 
            font: `${smallerFontSize}px Arial`, 
            fill: '#ffff99'        }).setScrollFactor(0).setDepth(HUD_DEPTH);
        
        // Scale bar dimensions
        const barWidth = 200 * window.gameScale;
        const barHeight = 20 * window.gameScale;
        const barBgWidth = 204 * window.gameScale;
        const barBgHeight = 24 * window.gameScale;
        
        this.healthBarBg = this.scene.add.rectangle(barLeft, 40, barBgWidth, barBgHeight, 0x222222).setScrollFactor(0).setOrigin(0,0.5).setDepth(HUD_DEPTH);
        this.healthBar = this.scene.add.rectangle(barLeft + 2, 40, barWidth, barHeight, 0xff0000).setScrollFactor(0).setOrigin(0,0.5).setDepth(HUD_DEPTH);
        this.healthText = this.scene.add.text(barLeft + (210 * window.gameScale), 32, `Health: ${this.playerStats.health}`, { font: `${smallestFontSize}px Arial`, fill: '#ff6666', fontStyle: 'bold' }).setScrollFactor(0).setDepth(HUD_DEPTH);        // Smaller bar dimensions for armor and stamina
        const smallBarHeight = 12 * window.gameScale;
        const smallBarBgHeight = 16 * window.gameScale;
        
        this.armorBarBg = this.scene.add.rectangle(barLeft, 64, barBgWidth, smallBarBgHeight, 0x222222).setScrollFactor(0).setOrigin(0,0.5).setDepth(HUD_DEPTH);
        this.armorBar = this.scene.add.rectangle(barLeft + 2, 64, barWidth, smallBarHeight, 0x3399ff).setScrollFactor(0).setOrigin(0,0.5).setDepth(HUD_DEPTH);
        this.armorText = this.scene.add.text(barLeft + (210 * window.gameScale), 56, `Armor: ${this.playerStats.armor}`, { font: `${smallestFontSize}px Arial`, fill: '#66ccff', fontStyle: 'bold' }).setScrollFactor(0).setDepth(HUD_DEPTH);
        
        this.staminaBarBg = this.scene.add.rectangle(barLeft, 84, barBgWidth, smallBarBgHeight, 0x222222).setScrollFactor(0).setOrigin(0,0.5).setDepth(HUD_DEPTH);
        this.staminaBar = this.scene.add.rectangle(barLeft + 2, 84, barWidth, smallBarHeight, 0x33ff66).setScrollFactor(0).setOrigin(0,0.5).setDepth(HUD_DEPTH);
        this.staminaText = this.scene.add.text(barLeft + (210 * window.gameScale), 76, `Stamina: ${this.playerStats.stamina}`, { font: `${smallestFontSize}px Arial`, fill: '#66ff99', fontStyle: 'bold' }).setScrollFactor(0).setDepth(HUD_DEPTH);        // Weapon HUD - Moved to bottom center
        // Calculate position at bottom center of screen
        const centerX = this.scene.cameras.main.width / 2;
        const bottomY = this.scene.cameras.main.height - 50; // 50px from bottom
        
        // Create weapon slots background with scaled dimensions
        const slotSize = 48;
        const slotPadding = 4;
        const totalWeapons = this.weapons.length;
        const totalWidth = (slotSize * totalWeapons) + (slotPadding * (totalWeapons - 1));
        const slotsStartX = centerX - (totalWidth / 2);
        const slotsY = bottomY;

        // Create weapon slots
        this.weaponSlots = [];
        this.weapons.forEach((weapon, index) => {
            const slotBg = this.scene.add.rectangle(
                slotsStartX + (index * (slotSize + slotPadding)),
                slotsY,
                slotSize,
                slotSize,
                0x333333
            ).setScrollFactor(0).setOrigin(0, 0).setDepth(HUD_DEPTH)
             .setInteractive() // Make the slot background interactive
             .on('pointerdown', () => this.selectWeapon(index)); // Add click handler

            const weaponSprite = this.scene.add.sprite(
                slotBg.x + slotSize/2,
                slotBg.y + slotSize/2,
                weapon.sprite
            ).setScrollFactor(0).setScale(0.5 * window.gameScale).setDepth(HUD_DEPTH + 1);

            // Dim weapons that aren't unlocked
            if (!weapon.unlocked) {
                weaponSprite.setAlpha(0.3);
            }
            
            this.weaponSlots.push({ bg: slotBg, sprite: weaponSprite });
        });
        
        // Add weapon name and ammo text above weapon slots
        this.weaponNameText = this.scene.add.text(
            centerX,
            slotsY - 40,
            '', 
            { 
                font: `16px Arial`, 
                fill: '#ffffff',
                fontStyle: 'bold'
            }
        ).setScrollFactor(0).setOrigin(0.5, 0).setDepth(HUD_DEPTH);

        // Ammo text below weapon name
        this.ammoText = this.scene.add.text(
            centerX,
            slotsY - 20, 
            '', 
            { 
                font: `16px Arial`, 
                fill: '#fff', 
                fontFamily: 'monospace' 
            }
        ).setScrollFactor(0).setOrigin(0.5, 0).setDepth(HUD_DEPTH);

        // Make weapon HUD responsive to window resize
        this.scene.scale.on('resize', (gameSize) => {
            // Update existing resize handlers
            this.coinText.x = gameSize.width - 20;
            this.totalCoinsText.x = gameSize.width - 20;
            
            // Update weapon HUD positions
            const newCenterX = gameSize.width / 2;
            const newBottomY = gameSize.height - 50;
            const newSlotsStartX = newCenterX - (totalWidth / 2);
            
            // Update weapon slots positions
            this.weaponSlots.forEach((slot, index) => {
                slot.bg.x = newSlotsStartX + (index * (slotSize + slotPadding));
                slot.bg.y = newBottomY;
                slot.sprite.x = slot.bg.x + slotSize/2;
                slot.sprite.y = slot.bg.y + slotSize/2;
            });
            
            // Update text positions
            this.weaponNameText.x = newCenterX;
            this.weaponNameText.y = newBottomY - 30;
            this.ammoText.x = newCenterX;
            this.ammoText.y = newBottomY - 10;
        });
    }
    
    updateHUD() {        // Level and Experience
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
        }        // Health bar and text
        if (this.healthBar && this.healthBarBg) {
            this.healthBar.width = 200 * window.gameScale * (this.playerStats.health / this.playerStats.maxHealth);
            this.healthBar.fillColor = 0xff0000;
        }
        if (this.healthText) {
            this.healthText.setText(`Health: ${this.playerStats.health}`);
        }
        // Armor bar and text
        if (this.armorBar && this.armorBarBg) {
            this.armorBar.width = 200 * window.gameScale * (this.playerStats.armor / this.playerStats.maxArmor);
            this.armorBar.fillColor = 0x3399ff;
        }
        if (this.armorText) {
            this.armorText.setText(`Armor: ${this.playerStats.armor}`);
        }// Stamina bar and text
        if (this.staminaBar && this.staminaBarBg) {
            this.staminaBar.width = 200 * window.gameScale * (this.playerStats.stamina / this.playerStats.maxStamina);
        }
        if (this.staminaText) {
            this.staminaText.setText(`Stamina: ${Math.floor(this.playerStats.stamina)}`);
        }
        
        // Update weapon name and ammo display
        const currentWeapon = this.weapons[this.currentWeaponIndexRef.value];
        if (currentWeapon) {
            // Update weapon name
            if (this.weaponNameText) {
                this.weaponNameText.setText(currentWeapon.name);
            }
            
            // Update ammo text
            if (this.ammoText) {
                if (currentWeapon.magazineSize === -1) {
                    this.ammoText.setText('Ammo: ∞');
                } else if (currentWeapon.reloading) {
                    if (currentWeapon.name === 'Shotgun') {
                        // For shotgun, show shells being loaded during reload
                        let magBar = '[';
                        for (let i = 0; i < currentWeapon.magazineSize; i++) {
                            magBar += i < currentWeapon.ammo ? '|' : ' ';
                        }
                        magBar += ']';
                        this.ammoText.setText(`${currentWeapon.ammo}/${currentWeapon.magazineSize} ${magBar} Loading...`);
                    } else {
                        this.ammoText.setText('Reloading...');
                    }
                } else {
                    // Visual magazine bar (e.g. [|||||     ])
                    let magBar = '[';
                    for (let i = 0; i < currentWeapon.magazineSize; i++) {
                        magBar += i < currentWeapon.ammo ? '|' : ' ';
                    }
                    magBar += ']';
                    this.ammoText.setText(`${currentWeapon.ammo}/${currentWeapon.magazineSize} ${magBar}`);
                }
            }
        }
    }
    
    // Add this new method to handle weapon selection
    selectWeapon(index) {
        const weapon = this.weapons[index];
        
        // Only allow selection if weapon is unlocked
        if (weapon && weapon.unlocked) {
            // Update the weapon index reference (passed from game scene)
            this.currentWeaponIndexRef.value = index;
            
            // Play a sound effect (optional)
            if (this.scene.sound && this.scene.sound.add) {
                this.scene.sound.play('weapon_switch', { volume: 0.5 });
            }
            
            // Update HUD immediately to reflect change
            this.updateHUD();
        }
    }
}

if (typeof module !== 'undefined') {
    module.exports = PlayerHUD;
}
