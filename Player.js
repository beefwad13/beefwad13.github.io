// Player class for Vampire Survivors clone
class Player {
    constructor(scene, x, y) {
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
        this.stats = {
            health: 100,
            maxHealth: 100,
            armor: 25,
            stamina: 100,
            maxStamina: 100
        };
        this.cursors = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.setupDodge();
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
    }
    setArmor(newArmor) {
        this.stats.armor = Math.max(0, newArmor);
    }
    setStamina(newStamina) {
        this.stats.stamina = Phaser.Math.Clamp(newStamina, 0, this.stats.maxStamina);
    }

    update(delta) {
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
            this.setStamina(this.stats.stamina + 10 * (delta/1000));
        }
    }
}

if (typeof module !== 'undefined') {
    module.exports = Player;
}
