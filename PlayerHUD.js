// PlayerHUD class for managing and updating the player HUD
class PlayerHUD {
    constructor(scene, playerStats, weapons, currentWeaponIndexRef) {
        this.scene = scene;
        this.playerStats = playerStats;
        this.weapons = weapons;
        this.currentWeaponIndexRef = currentWeaponIndexRef;
        this.createHUD();
    }    createHUD() {
        const barLeft = 20;
        // Level and XP text at the top
        this.levelText = this.scene.add.text(barLeft, 10, 'Level 1', { 
            font: '20px Arial', 
            fill: '#ffff00',
            fontStyle: 'bold' 
        }).setScrollFactor(0);
        
        this.expText = this.scene.add.text(barLeft + 100, 10, 'XP: 0/100', { 
            font: '18px Arial', 
            fill: '#ffff99'
        }).setScrollFactor(0);        this.healthBarBg = this.scene.add.rectangle(barLeft, 40, 204, 24, 0x222222).setScrollFactor(0).setOrigin(0,0.5);
        this.healthBar = this.scene.add.rectangle(barLeft + 2, 40, 200, 20, 0xff0000).setScrollFactor(0).setOrigin(0,0.5);
        this.healthText = this.scene.add.text(barLeft + 210, 32, `Health: ${this.playerStats.health}`, { font: '16px Arial', fill: '#ff6666', fontStyle: 'bold' }).setScrollFactor(0);
        this.armorBarBg = this.scene.add.rectangle(barLeft, 64, 204, 16, 0x222222).setScrollFactor(0).setOrigin(0,0.5);
        this.armorBar = this.scene.add.rectangle(barLeft + 2, 64, 200, 12, 0x3399ff).setScrollFactor(0).setOrigin(0,0.5);
        this.armorText = this.scene.add.text(barLeft + 210, 56, `Armor: ${this.playerStats.armor}`, { font: '16px Arial', fill: '#66ccff', fontStyle: 'bold' }).setScrollFactor(0);
        this.staminaBarBg = this.scene.add.rectangle(barLeft, 84, 204, 16, 0x222222).setScrollFactor(0).setOrigin(0,0.5);
        this.staminaBar = this.scene.add.rectangle(barLeft + 2, 84, 200, 12, 0x33ff66).setScrollFactor(0).setOrigin(0,0.5);
        // Weapon HUD
        const weaponTextY = 110;
        this.weaponText = this.scene.add.text(barLeft, weaponTextY, `Weapon: ${this.weapons[this.currentWeaponIndexRef.value].name}`,
            { font: '20px Arial', fill: '#66ccff', fontStyle: 'bold' }).setScrollFactor(0).setOrigin(0, 0);
        this.ammoText = this.scene.add.text(barLeft, weaponTextY + 28, '', { font: '18px Arial', fill: '#fff', fontFamily: 'monospace' }).setScrollFactor(0).setOrigin(0, 0);
    }    updateHUD() {
        // Level and Experience
        if (this.levelText) {
            this.levelText.setText(`Level ${this.playerStats.level}`);
        }
        if (this.expText) {
            const nextLevelXP = this.playerStats.level * 100;
            this.expText.setText(`XP: ${this.playerStats.experience}/${nextLevelXP}`);
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
            this.armorBar.width = 200 * (this.playerStats.armor / 100); // Assuming max armor is 100 for bar
            this.armorBar.fillColor = 0x3399ff;
        }
        if (this.armorText) {
            this.armorText.setText(`Armor: ${this.playerStats.armor}`);
        }
        // Stamina bar
        if (this.staminaBar && this.staminaBarBg) {
            this.staminaBar.width = 200 * (this.playerStats.stamina / this.playerStats.maxStamina);
        }
        // Weapon and ammo
        if (this.weaponText) {
            let w = this.weapons[this.currentWeaponIndexRef.value];
            this.weaponText.setText(`Weapon: ${w.name}`);
            if (typeof this.ammoText !== 'undefined') {
                if (w.magazineSize === -1) {
                    this.ammoText.setText('Ammo: ∞');
                } else if (w.reloading) {
                    this.ammoText.setText('Reloading...');
                } else {
                    // Visual magazine bar (e.g. [|||||     ])
                    let magBar = '[';
                    for (let i = 0; i < w.magazineSize; i++) {
                        magBar += i < w.ammo ? '|' : ' ';
                    }
                    magBar += ']';
                    this.ammoText.setText(`Ammo: ${w.ammo} / ${w.magazineSize}  ${magBar}`);
                }
            }
        }
    }
}

if (typeof module !== 'undefined') {
    module.exports = PlayerHUD;
}
