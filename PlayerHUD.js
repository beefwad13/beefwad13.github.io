// PlayerHUD class for managing and updating the player HUD
class PlayerHUD {
    constructor(scene, playerStats, weapons, currentWeaponIndexRef) {
        this.scene = scene;
        this.playerStats = playerStats;
        this.weapons = weapons;
        this.currentWeaponIndexRef = currentWeaponIndexRef;
        this.createHUD();    }createHUD() {
        const barLeft = 20;
        const HUD_DEPTH = 5000; // Highest depth for all HUD elements
        
        // Level and XP text at the top
        this.levelText = this.scene.add.text(barLeft, 10, 'Level 1', { 
            font: '20px Arial', 
            fill: '#ffff00',
            fontStyle: 'bold' 
        }).setScrollFactor(0).setDepth(HUD_DEPTH);
        
        this.expText = this.scene.add.text(barLeft + 100, 10, 'XP: 0/100', { 
            font: '18px Arial', 
            fill: '#ffff99'        }).setScrollFactor(0).setDepth(HUD_DEPTH);
        this.healthBarBg = this.scene.add.rectangle(barLeft, 40, 204, 24, 0x222222).setScrollFactor(0).setOrigin(0,0.5).setDepth(HUD_DEPTH);
        this.healthBar = this.scene.add.rectangle(barLeft + 2, 40, 200, 20, 0xff0000).setScrollFactor(0).setOrigin(0,0.5).setDepth(HUD_DEPTH);
        this.healthText = this.scene.add.text(barLeft + 210, 32, `Health: ${this.playerStats.health}`, { font: '16px Arial', fill: '#ff6666', fontStyle: 'bold' }).setScrollFactor(0).setDepth(HUD_DEPTH);        
        this.armorBarBg = this.scene.add.rectangle(barLeft, 64, 204, 16, 0x222222).setScrollFactor(0).setOrigin(0,0.5).setDepth(HUD_DEPTH);
        this.armorBar = this.scene.add.rectangle(barLeft + 2, 64, 200, 12, 0x3399ff).setScrollFactor(0).setOrigin(0,0.5).setDepth(HUD_DEPTH);
        this.armorText = this.scene.add.text(barLeft + 210, 56, `Armor: ${this.playerStats.armor}`, { font: '16px Arial', fill: '#66ccff', fontStyle: 'bold' }).setScrollFactor(0).setDepth(HUD_DEPTH);
        this.staminaBarBg = this.scene.add.rectangle(barLeft, 84, 204, 16, 0x222222).setScrollFactor(0).setOrigin(0,0.5).setDepth(HUD_DEPTH);
        this.staminaBar = this.scene.add.rectangle(barLeft + 2, 84, 200, 12, 0x33ff66).setScrollFactor(0).setOrigin(0,0.5).setDepth(HUD_DEPTH);
        this.staminaText = this.scene.add.text(barLeft + 210, 76, `Stamina: ${this.playerStats.stamina}`, { font: '16px Arial', fill: '#66ff99', fontStyle: 'bold' }).setScrollFactor(0).setDepth(HUD_DEPTH);

        // Weapon HUD
        const weaponTextY = 110;

        // Create weapon slots background
        const slotSize = 64;
        const slotPadding = 10;
        const slotsStartX = barLeft;
        const slotsY = weaponTextY;

        // Create weapon slots
        this.weaponSlots = [];
        this.weapons.forEach((weapon, index) => {            const slotBg = this.scene.add.rectangle(
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
            ).setScrollFactor(0).setScale(0.5).setDepth(HUD_DEPTH);

            // Dim weapons that aren't unlocked
            if (!weapon.unlocked) {
                weaponSprite.setAlpha(0.3);
            }

            this.weaponSlots.push({ bg: slotBg, sprite: weaponSprite });
        });        this.ammoText = this.scene.add.text(barLeft, weaponTextY + 74, '', 
            { font: '18px Arial', fill: '#fff', fontFamily: 'monospace' })
            .setScrollFactor(0).setOrigin(0, 0).setDepth(HUD_DEPTH);
    }    updateHUD() {        // Level and Experience
        if (this.levelText) {
            this.levelText.setText(`Level ${this.playerStats.level}`);
        }        if (this.expText) {
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
            this.healthBar.width = 200 * (this.playerStats.health / this.playerStats.maxHealth);
            this.healthBar.fillColor = 0xff0000;
        }
        if (this.healthText) {
            this.healthText.setText(`Health: ${this.playerStats.health}`);
        }
        // Armor bar and text
        if (this.armorBar && this.armorBarBg) {
            this.armorBar.width = 200 * (this.playerStats.armor / this.playerStats.maxArmor);
            this.armorBar.fillColor = 0x3399ff;
        }
        if (this.armorText) {
            this.armorText.setText(`Armor: ${this.playerStats.armor}`);
        }        // Stamina bar and text
        if (this.staminaBar && this.staminaBarBg) {
            this.staminaBar.width = 200 * (this.playerStats.stamina / this.playerStats.maxStamina);
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
