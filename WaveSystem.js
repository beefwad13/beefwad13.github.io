class WaveSystem {
    constructor(scene) {
        this.scene = scene;
        this.elapsedTime = 0;
        this.currentWave = 0;
        this.waveInterval = 15000; // 15 seconds
        this.lastWaveTime = 0;
        this.hudScale = 0.8; // Match PlayerHUD scale
        
        // Create timer text
        this.timerText = scene.add.text(
            scene.cameras.main.centerX,
            Math.floor(20 * this.hudScale),
            '0:00',
            {
                font: `${Math.floor(24 * this.hudScale)}px Arial`,
                fill: '#ffffff'
            }
        )
        .setScrollFactor(0)
        .setDepth(2000)
        .setOrigin(0.5, 0);

        // Create wave announcement text
        this.waveText = scene.add.text(
            scene.cameras.main.centerX,
            Math.floor(80 * this.hudScale),
            '',
            {
                font: `${Math.floor(48 * this.hudScale)}px Arial`,
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        )
        .setScrollFactor(0)
        .setDepth(2000)
        .setOrigin(0.5, 0)
        .setAlpha(0);
    }

    update(time, delta) {
        // Update elapsed time
        this.elapsedTime += delta;
        
        // Update timer display
        const minutes = Math.floor(this.elapsedTime / 60000);
        const seconds = Math.floor((this.elapsedTime % 60000) / 1000);
        this.timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);

        // Check if it's time for a new wave
        if (this.elapsedTime - this.lastWaveTime >= this.waveInterval || this.currentWave === 0) {
            this.startNewWave();
        }
    }    startNewWave() {
        this.currentWave++;
        this.lastWaveTime = this.elapsedTime;
        
        // Update player stats with current wave
        window.playerStats.updateWave(this.currentWave);

        // Show wave announcement
        this.waveText.setText(`Wave ${this.currentWave}`);
        this.waveText.setAlpha(1);

        // Fade out wave announcement after 3 seconds
        this.scene.tweens.add({
            targets: this.waveText,
            alpha: 0,
            duration: 1000,
            delay: 2000
        });

        // Spawn enemies
        const enemiesToSpawn = this.currentWave + 4;
        for (let i = 0; i < enemiesToSpawn; i++) {
            this.spawnEnemy();
        }
    }

    spawnEnemy() {
        const margin = 100;
        const cam = this.scene.cameras.main;
        const player = this.scene.player;
        
        // Get a random edge of the screen
        let edge = Phaser.Math.Between(0, 3);
        let x, y;

        // Calculate spawn position based on the edge
        switch (edge) {
            case 0: // Top
                x = Phaser.Math.Between(cam.worldView.left + margin, cam.worldView.right - margin);
                y = cam.worldView.top - margin;
                break;
            case 1: // Right
                x = cam.worldView.right + margin;
                y = Phaser.Math.Between(cam.worldView.top + margin, cam.worldView.bottom - margin);
                break;
            case 2: // Bottom
                x = Phaser.Math.Between(cam.worldView.left + margin, cam.worldView.right - margin);
                y = cam.worldView.bottom + margin;
                break;
            case 3: // Left
                x = cam.worldView.left - margin;
                y = Phaser.Math.Between(cam.worldView.top + margin, cam.worldView.bottom - margin);
                break;
        }

        // Clamp coordinates to map bounds
        x = Phaser.Math.Clamp(x, 0, this.scene.mapWidth);
        y = Phaser.Math.Clamp(y, 0, this.scene.mapHeight);

        // Create enemy
        const enemy = new Enemy(this.scene, x, y);
        this.scene.enemies.push(enemy);
        this.scene.enemyGroup.add(enemy.sprite);
        enemy.sprite.setAlpha(1);
        
        // Set player reference
        this.scene.time.delayedCall(0, () => {
            enemy.playerRef = player.sprite;
            player.sprite.playerRef = player;
        });
    }
}
