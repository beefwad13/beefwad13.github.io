// Simple Enemy engine for Vampire Survivors clone


class Enemy {
    constructor(scene, x, y, playerRef) {
        this.scene = scene;        this.health = 3;
        this.damage = 25; // Base damage dealt to player on collision
        this.sprite = scene.add.sprite(x, y, 'enemy_demon', 0);
        // Apply gameScale to enemy size
        const scaledWidth = 70 * window.gameScale;
        const scaledHeight = 128 * window.gameScale;
        this.sprite.setDisplaySize(scaledWidth, scaledHeight);
        // Set enemy depth in the enemies range (500-899)
        this.sprite.setDepth(600);
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.enemyRef = this; // Reference for callbacks
        this.alive = true;
        this.playerRef = playerRef; // Reference to player sprite
        this.speed = 120 * window.gameScale;
        // Knockback state
        this.isKnockback = false;
        this.knockbackTimer = 0;
        this.knockbackVelocity = { x: 0, y: 0 };
        // Flash state
        this.isFlashing = false;
        this.flashTimer = 0;
    }    update() {
        if (!this.alive || !this.playerRef) return;

        // Check flash state and revert to normal frame if flash is done
        if (this.isFlashing && this.scene.time.now >= this.flashTimer) {
            this.isFlashing = false;
            this.sprite.setFrame(0); // Normal frame
        }

        // If in knockback, apply knockback velocity and decrement timer
        if (this.isKnockback) {
            this.sprite.body.setVelocity(this.knockbackVelocity.x, this.knockbackVelocity.y);
            this.knockbackTimer -= this.scene.game.loop.delta;
            if (this.knockbackTimer <= 0) {
                this.isKnockback = false;
                this.knockbackVelocity = { x: 0, y: 0 };
            }
            return;
        }

        // Move towards player
        const dx = this.playerRef.x - this.sprite.x;
        const dy = this.playerRef.y - this.sprite.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 2) {
            const vx = (dx / dist) * this.speed;
            const vy = (dy / dist) * this.speed;
            this.sprite.body.setVelocity(vx, vy);
            
            // Flip sprite based on movement direction
            if (vx !== 0) {
                this.sprite.setFlipX(vx < 0);
            }
        } else {
            this.sprite.body.setVelocity(0, 0);
        }
    }

    /**
     * @param {number} amount - Damage amount
     * @param {object} [knockback] - Optional knockback vector {x, y}
     * @param {number} [knockback.duration] - Duration in ms
     */    takeDamage(amount, knockback) {
        if (!this.alive) return;
        this.health -= amount;
        // Set damage frame and flash timer
        this.sprite.setFrame(1); // Damage frame
        this.isFlashing = true;
        this.flashTimer = this.scene.time.now + 100; // Flash for 100ms

        if (knockback && knockback.x !== undefined && knockback.y !== undefined) {
            this.isKnockback = true;
            this.knockbackVelocity = { x: knockback.x, y: knockback.y };
            this.knockbackTimer = knockback.duration || 100;
        }
        if (this.health <= 0) {
            this.die();
        }
    }    die() {
        this.alive = false;
        this.sprite.setVisible(false);
        this.sprite.body.enable = false;
        
        // Grant experience to the player when enemy dies
        if (this.playerRef && this.playerRef.playerRef) {
            this.playerRef.playerRef.gainExperience(10);
        }

        // Roll for loot
        if (window.lootSystem) {
            const lootItem = window.lootSystem.rollForLoot('demon');
            if (lootItem) {
                // Spawn the item slightly offset from where the enemy died
                const offsetX = Math.random() * 20 - 10;
                const offsetY = Math.random() * 20 - 10;
                switch (lootItem) {
                    case 'medkit':
                        this.scene.spawnMedkitPickup(this.sprite.x + offsetX, this.sprite.y + offsetY);
                        break;
                    case 'armor_shard':
                        this.scene.spawnArmorShardPickup(this.sprite.x + offsetX, this.sprite.y + offsetY);
                        break;
                    case 'armor':
                        this.scene.spawnArmorPickup(this.sprite.x + offsetX, this.sprite.y + offsetY);
                        break;
                }
            }
        }
    }
}

window.Enemy = Enemy;
