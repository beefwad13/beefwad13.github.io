// Player class for Vampire Survivors clone
class Player {    constructor(scene, x, y) {
        this.scene = scene;
        this.sprite = scene.add.sprite(x, y, 'player', 0);
        this.sprite.setDisplaySize(104, 128);
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(true);
        this.speed = 400;
        this.isDodging = false;
        this.dodgeCooldown = 800;
        this.dodgeDistance = 180;
        this.dodgeDuration = 120;
        this.lastDodgeTime = -Infinity;

        // Get permanent upgrade levels
        const healthUpgradeLevel = parseInt(localStorage.getItem('upgrade_health')) || 0;
        const armorUpgradeLevel = parseInt(localStorage.getItem('upgrade_armor')) || 0;

        // Calculate base stats plus permanent upgrades
        const baseHealth = 100;
        const baseArmor = 50;
        const healthBonus = healthUpgradeLevel * 5;
        const armorBonus = armorUpgradeLevel * 5;
        
        this.stats = {
            health: baseHealth + healthBonus,
            maxHealth: baseHealth + healthBonus,
            armor: 0,
            maxArmor: baseArmor + armorBonus,
            stamina: 100,
            maxStamina: 100,
            level: 1,
            experience: 0
        };
        this.cursors = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.setupDodge();

        this.isInvulnerable = false;
        this.invulnerabilityDuration = 1000; // 1 second of invulnerability after hit
        this.isDead = false;

        // Create damage overlay for screen flash
        this.damageOverlay = scene.add.rectangle(0, 0, scene.game.config.width, scene.game.config.height, 0xff0000, 0)
            .setScrollFactor(0)
            .setDepth(9999)
            .setOrigin(0, 0);
    }

    setupDodge() {
        this.scene.input.keyboard.on('keydown-SPACE', () => {
            if (this.isDodging) return;
            const now = this.scene.time.now;
            if (now - this.lastDodgeTime < this.dodgeCooldown) return;
            if (this.stats.stamina < 40) return;
            let vx = 0, vy = 0;
            if (this.cursors.left.isDown) vx = -1;
            else if (this.cursors.right.isDown) vx = 1;
            if (this.cursors.up.isDown) vy = -1;
            else if (this.cursors.down.isDown) vy = 1;
            if (vx === 0 && vy === 0) return;
            if (vx !== 0 && vy !== 0) {
                vx *= 0.707;
                vy *= 0.707;
            }
            this.isDodging = true;
            this.lastDodgeTime = now;
            this.setStamina(this.stats.stamina - 40);
            const startX = this.sprite.x;
            const startY = this.sprite.y;
            const targetX = Phaser.Math.Clamp(startX + vx * this.dodgeDistance, 20, this.scene.physics.world.bounds.width - 20);
            const targetY = Phaser.Math.Clamp(startY + vy * this.dodgeDistance, 20, this.scene.physics.world.bounds.height - 20);
            this.scene.tweens.add({
                targets: this.sprite,
                x: targetX,
                y: targetY,
                duration: this.dodgeDuration,
                ease: 'Cubic.Out',
                onComplete: () => {
                    this.isDodging = false;
                }
            });
        });
    }

    setHealth(newHealth) {
        this.stats.health = Phaser.Math.Clamp(newHealth, 0, this.stats.maxHealth);
    }    setArmor(newArmor) {
        this.stats.armor = Phaser.Math.Clamp(newArmor, 0, this.stats.maxArmor);
    }
    setStamina(newStamina) {
        this.stats.stamina = Phaser.Math.Clamp(newStamina, 0, this.stats.maxStamina);
    }    getExperienceToNextLevel() {
        return window.playerStats.getExperienceToNextLevel(this.stats.level);
    }    gainExperience(amount) {
        this.stats.experience += amount;
        if (this.stats.experience >= window.playerStats.getTotalXPNeeded(this.stats.level)) {
            this.levelUp();
        }
    }    levelUp() {
        this.stats.level++;

        // Play level up sound
        this.scene.sound.play('powerup', { volume: this.scene.audioVolume });

        // Show level up text
        const levelUpText = this.scene.add.text(
            this.sprite.x,
            this.sprite.y - 60,
            'Level Up!',
            {
                font: '24px Arial',
                fill: '#ffff00',
                stroke: '#000',
                strokeThickness: 4,
                fontStyle: 'bold'
            }
        ).setOrigin(0.5, 1).setDepth(2000);

        // Add floating animation and fade out
        this.scene.tweens.add({
            targets: levelUpText,
            y: levelUpText.y - 40,
            alpha: 0,
            duration: 1500,
            ease: 'Cubic.Out',
            onComplete: () => levelUpText.destroy()
        });        // Launch upgrade dialog scene
        this.scene.scene.launch('UpgradeDialog', { playerRef: this, parentScene: this.scene });
        this.scene.scene.pause('TestLevel');
    }    applyUpgrade(upgrade) {
        switch (upgrade.id) {
            case 'health':
                this.stats.maxHealth += 5;
                this.setHealth(this.stats.health + 5); // Also heal by 5
                break;
            case 'armor':
                this.stats.maxArmor += 5;
                this.setArmor(this.stats.armor + 5);
                break;
            case 'stamina':
                this.stats.maxStamina += 5;
                this.setStamina(this.stats.stamina + 5);
                break;            case 'pistol_damage':
            case 'shotgun_damage':
            case 'assault_rifle_damage':
            case 'pistol_mag_size':
            case 'pistol_reload':
            case 'shotgun_spread':
            case 'shotgun_reload':
            case 'shotgun_mag_size':
            case 'assault_rifle_reload':
            case 'assault_rifle_mag_size':
            case 'assault_rifle_rate':
                if (upgrade.weaponIndex !== undefined) {
                    const weapon = window.WEAPONS[upgrade.weaponIndex];
                    const currentValue = weapon[upgrade.upgradeType];
                    const increment = upgrade.increment || 1;
                    weapon[upgrade.upgradeType] = upgrade.isReverse ? 
                        Math.max(upgrade.maxValue, currentValue + increment) :
                        Math.min(upgrade.maxValue, currentValue + increment);

                    // If magazine size was increased, also increase current ammo
                    if (upgrade.upgradeType === 'magazineSize') {
                        weapon.ammo = Math.min(weapon.ammo + increment, weapon.magazineSize);
                    }
                }
                break;
        }
    }takeDamage(amount) {
        if (this.isInvulnerable || this.isDead) return;

        // New armor absorption system:
        // 1/3 of damage goes to armor, 2/3 to health
        // If not enough armor, remainder spills to health
        const armorDamageRatio = 1/3;
        // Calculate armor damage as whole number, minimum of current armor and 1/3 of damage
        let armorDamage = Math.min(this.stats.armor, Math.floor(amount * armorDamageRatio));
        // Any damage not absorbed by armor (including fractional parts) goes to health
        let healthDamage = Math.floor(amount - armorDamage);

        // Apply damage to both armor and health
        this.setArmor(this.stats.armor - armorDamage);
        this.setHealth(this.stats.health - healthDamage);

        // Visual feedback - screen flash
        this.scene.tweens.add({
            targets: this.damageOverlay,
            alpha: { from: 0.3, to: 0 },
            duration: 100,
            ease: 'Power1'
        });

        // Visual feedback - sprite flash
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: { from: 0.5, to: 1 },
            duration: 100,
            yoyo: true,
            repeat: 2
        });

        // Set invulnerability
        this.isInvulnerable = true;
        this.scene.time.delayedCall(this.invulnerabilityDuration, () => {
            this.isInvulnerable = false;
        });

        // Check for death
        if (this.stats.health <= 0 && !this.isDead) {
            this.die();
        }
    }    die() {
        this.isDead = true;
        this.sprite.body.setVelocity(0, 0);

        // Play death sound
        this.scene.sound.play('player_die', { volume: this.scene.audioVolume });

        // Death animation
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            scale: 0.5,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {                // Switch to the GameOver scene after a short delay and stop the TestLevel scene
                this.scene.time.delayedCall(500, () => {
                    // Store player stats before switching scenes
                    this.scene.registry.set('level', this.stats.level);
                    this.scene.registry.set('experience', this.stats.experience);
                    this.scene.scene.stop('TestLevel'); // Stop the current scene
                    this.scene.scene.start('GameOver'); // Start the GameOver scene
                });
            }
        });
    }

    update(delta) {
        if (this.isDead) return;

        let vx = 0, vy = 0;
        if (!this.isDodging) {
            if (this.cursors.left.isDown) vx = -this.speed;
            else if (this.cursors.right.isDown) vx = this.speed;
            if (this.cursors.up.isDown) vy = -this.speed;
            else if (this.cursors.down.isDown) vy = this.speed;
            this.sprite.body.setVelocity(vx, vy);
            if (vx !== 0 && vy !== 0) {
                this.sprite.body.setVelocity(vx * 0.707, vy * 0.707);
            }
        } else {
            this.sprite.body.setVelocity(0, 0);
        }
        // Set frame based on direction
        if (vx === 0 && vy === 0) {
            this.sprite.setFrame(0);
        } else if (vy > 0 && Math.abs(vy) >= Math.abs(vx)) {
            this.sprite.setFrame(0);
        } else if (vy < 0 && Math.abs(vy) >= Math.abs(vx)) {
            this.sprite.setFrame(1);
        } else if (vx < 0 && Math.abs(vx) > Math.abs(vy)) {
            this.sprite.setFrame(2);
        } else if (vx > 0 && Math.abs(vx) > Math.abs(vy)) {
            this.sprite.setFrame(3);
        }
        // Regenerate stamina
        if (this.stats.stamina < this.stats.maxStamina) {
            this.setStamina(this.stats.stamina + 10 * (delta / 1000));
        }

        // Add visual pulsing during invulnerability
        if (this.isInvulnerable) {
            this.sprite.alpha = 0.7 + Math.sin(this.scene.time.now * 0.01) * 0.3;
        }
    }
}

if (typeof module !== 'undefined') {
    module.exports = Player;
}
