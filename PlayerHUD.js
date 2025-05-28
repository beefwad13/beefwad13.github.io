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
        this.healthBarBg = this.scene.add.rectangle(barLeft, 30, 204, 24, 0x222222).setScrollFactor(0).setOrigin(0,0.5);
        this.healthBar = this.scene.add.rectangle(barLeft + 2, 30, 200, 20, 0xff0000).setScrollFactor(0).setOrigin(0,0.5);
        this.armorBarBg = this.scene.add.rectangle(barLeft, 54, 204, 16, 0x222222).setScrollFactor(0).setOrigin(0,0.5);
        this.armorBar = this.scene.add.rectangle(barLeft + 2, 54, 200, 12, 0x3399ff).setScrollFactor(0).setOrigin(0,0.5);
        this.armorText = this.scene.add.text(barLeft + 210, 46, `Armor: ${this.playerStats.armor}`, { font: '16px Arial', fill: '#66ccff', fontStyle: 'bold' }).setScrollFactor(0);
        this.staminaBarBg = this.scene.add.rectangle(barLeft, 74, 204, 16, 0x222222).setScrollFactor(0).setOrigin(0,0.5);
        this.staminaBar = this.scene.add.rectangle(barLeft + 2, 74, 200, 12, 0x33ff66).setScrollFactor(0).setOrigin(0,0.5);
        // Weapon HUD
        const weaponTextY = 100;
        this.weaponText = this.scene.add.text(barLeft, weaponTextY, `Weapon: ${this.weapons[this.currentWeaponIndexRef.value].name}`,
            { font: '20px Arial', fill: '#66ccff', fontStyle: 'bold' }).setScrollFactor(0).setOrigin(0, 0);
        this.ammoText = this.scene.add.text(barLeft, weaponTextY + 28, '', { font: '18px Arial', fill: '#fff', fontFamily: 'monospace' }).setScrollFactor(0).setOrigin(0, 0);
    }

    updateHUD() {
        // Health bar
        if (this.healthBar && this.healthBarBg) {
            this.healthBar.width = 200 * (this.playerStats.health / this.playerStats.maxHealth);
            this.healthBar.fillColor = 0xff0000;
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
