// Simple Enemy engine for Vampire Survivors clone


class Enemy {
    constructor(scene, x, y, playerRef) {
        this.scene = scene;
        this.health = 3;
        this.sprite = scene.add.rectangle(x, y, 40, 40, 0xff2222);
        scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.enemyRef = this; // Reference for callbacks
        this.alive = true;
        this.playerRef = playerRef; // Reference to player sprite
        this.speed = 120;
        // Knockback state
        this.isKnockback = false;
        this.knockbackTimer = 0;
        this.knockbackVelocity = { x: 0, y: 0 };
    }

    update() {
        if (!this.alive || !this.playerRef) return;
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
        } else {
            this.sprite.body.setVelocity(0, 0);
        }
    }

    /**
     * @param {number} amount - Damage amount
     * @param {object} [knockback] - Optional knockback vector {x, y}
     * @param {number} [knockback.duration] - Duration in ms
     */
    takeDamage(amount, knockback) {
        if (!this.alive) return;
        this.health -= amount;
        if (knockback && knockback.x !== undefined && knockback.y !== undefined) {
            this.isKnockback = true;
            this.knockbackVelocity = { x: knockback.x, y: knockback.y };
            this.knockbackTimer = knockback.duration || 100;
        }
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.alive = false;
        this.sprite.setVisible(false);
        this.sprite.body.enable = false;
    }
}

window.Enemy = Enemy;
