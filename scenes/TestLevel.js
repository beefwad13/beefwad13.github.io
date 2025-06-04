class TestLevel extends Phaser.Scene {
    constructor() {
        super({ key: 'TestLevel' });
    }

    preload() {
        // Weapons.js must be loaded before main.js in index.html
        // Preload weapon shoot and reload sounds
        this.load.audio('pistol_shoot', 'assets/audio/pistol_shoot.wav');
        this.load.audio('shotgun_shoot', 'assets/audio/shotgun_shoot.wav');
        this.load.audio('assault_rifle_shoot', 'assets/audio/assault_rifle_shoot.wav');
        this.load.audio('generic_reload', 'assets/audio/generic_reload.wav');
        this.load.audio('shotgun_reload', 'assets/audio/shotgun_reload.wav');
        this.load.audio('bullet_hit', 'assets/audio/bullet_hit1.wav');
        this.load.audio('bullet_hit_kill', 'assets/audio/bullet_hit2.wav');
        this.load.audio('player_die', 'assets/audio/ba_die2.wav');
        this.load.audio('pickup_sound', 'assets/audio/ammopickup2.wav');
        this.load.audio('pickup_sound_small', 'assets/audio/ammopickup1.wav');
        this.load.audio('weapon_pickup', 'assets/audio/gunpickup2.wav');
        this.load.audio('powerup', 'assets/audio/smb_powerup.wav');
        this.load.audio('coin_pickup', 'assets/audio/9mmclip1.wav');        // Item sprites
        this.load.image('item_armor', 'assets/sprites/item_armor.png');
        this.load.image('item_armor_shard', 'assets/sprites/item_armor_shard.png');
        this.load.image('item_medkit', 'assets/sprites/item_medkit.png');
        this.load.image('item_coin', 'assets/sprites/item_coin.png');

        // Load weapon sprites
        this.load.image('item_pistol', 'assets/sprites/item_pistol.png');
        this.load.image('item_shotgun', 'assets/sprites/item_shotgun.png');
        this.load.image('item_assaultrifle', 'assets/sprites/item_assaultrifle.png');

        // Preload player sprite sheet
        this.load.spritesheet('player', 'assets/sprites/player_sprite.png', {
            frameWidth: 104,
            frameHeight: 128
        });

        // Preload enemy demon sprite sheet
        this.load.spritesheet('enemy_demon', 'assets/sprites/enemy_demon1.png', {
            frameWidth: 70,
            frameHeight: 128
        });

        // Preload crosshair sprite
        this.load.image('crosshair', 'assets/sprites/player_xhair_cross.png');
        
        // Load background tile
        this.load.image('tile_hell', 'assets/sprites/tile_hell1.png');
    }    create() {
        // Reset player stats and registry at the start of the level
        window.playerStats.reset();
        this.registry.set('level', 1);
        this.registry.set('experience', 0);
        
        // Initialize properties
        this.mapWidth = 2560;
        this.mapHeight = 2560;
        this.bulletSpeed = 600;
        this.bulletLifetime = 1200;
        this.currentWeaponIndex = 0;
        this.audioVolume = 0.2;

        this.setupBackground();
        this.setupBullets();
        this.setupPlayer();
        this.setupEnemies();
        this.setupItems();
        this.setupUI();
        this.setupInput();
        this.setupCollisions();

        // Initialize wave system
        this.waveSystem = new WaveSystem(this);
    }    setupBackground() {
        const tileSize = 64;
        for (let x = 0; x < this.mapWidth; x += tileSize) {
            for (let y = 0; y < this.mapHeight; y += tileSize) {
                const tile = this.add.image(x + tileSize/2, y + tileSize/2, 'tile_hell');
                tile.setDisplaySize(tileSize, tileSize); // Scale the tile to 64x64
            }
        }
    }setupBullets() {
        // Reset all weapons to locked except pistol
        window.WEAPONS.forEach((weapon, index) => {
            weapon.unlocked = index === 0; // Only pistol (index 0) starts unlocked
        });

        this.bullets = this.physics.add.group({
            classType: Phaser.GameObjects.Rectangle,
            maxSize: 50,
            runChildUpdate: true
        });
    }    setupPlayer() {
        this.player = new Player(this, this.mapWidth / 2, this.mapHeight / 2);
        this.player.stats.coins = 0; // Initialize coins
        this.registry.set('coins', 0); // Initialize coins in registry
        this.playerStats = this.player.stats;
        
        // Set world bounds
        this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);
        
        // Camera setup
        this.cameras.main.startFollow(this.player.sprite, false, 1, 1);
        this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
    }

    setupEnemies() {
        this.enemies = [];
        this.enemyGroup = this.physics.add.group();
        window._enemies = this.enemies;
    }

    setupItems() {
        this.itemGroup = this.physics.add.group();

        // Helper function to create floating items with bob animation
        const createFloatingItem = (x, y, sprite, scale = 0.5) => {
            const item = this.add.sprite(x, y, sprite);
            item.setScale(scale);
            this.physics.add.existing(item);
            this.itemGroup.add(item);
            
            // Add floating animation
            this.tweens.add({
                targets: item,
                y: item.y - 10,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            return item;
        };

        // Spawn test items
        const baseX = this.mapWidth / 2 + 250;
        const baseY = this.mapHeight / 2;

        // Spawn armor
        const armorPickup = createFloatingItem(baseX, baseY, 'item_armor');
        armorPickup.itemType = 'armor';

        // Spawn medkit
        const medkitPickup = createFloatingItem(baseX, baseY - 100, 'item_medkit');
        medkitPickup.itemType = 'medkit';

        // Spawn shotgun
        const shotgunPickup = createFloatingItem(baseX + 100, baseY, 'item_shotgun');
        shotgunPickup.itemType = 'weapon';
        shotgunPickup.weaponIndex = 1; // Index in WEAPONS array

        // Spawn assault rifle
        const arPickup = createFloatingItem(baseX + 100, baseY - 100, 'item_assaultrifle');
        arPickup.itemType = 'weapon';
        arPickup.weaponIndex = 2; // Index in WEAPONS array
        
        // // Spawn armor shards
        // for (let i = 0; i < 20; i++) {
        //     const shard = createFloatingItem(
        //         baseX + (i % 5) * 30 - 60,
        //         baseY + 100 + Math.floor(i / 5) * 30,
        //         'item_armor_shard'
        //     );
        //     shard.itemType = 'armor_shard';
        // }
    }

    setupUI() {
        // Add tooltip text
        const tooltipText = this.add.text(
            this.cameras.main.width - 24,
            18,
            'WASD = move, R = reload, Space = dodge, K = toggle enemies',
            {
                font: '16px Arial',
                fill: '#cccccc',
                backgroundColor: 'rgba(34,34,34,0.7)',
                padding: { left: 8, right: 8, top: 4, bottom: 4 },
                align: 'right',
                fontStyle: 'bold'
            }
        ).setOrigin(1, 0).setScrollFactor(0).setDepth(2000);

        this.scale.on('resize', (gameSize) => {
            tooltipText.x = gameSize.width - 24;
        });

        // Custom cursor (crosshair)
        this.input.setDefaultCursor('none');
        this.crosshair = this.add.image(0, 0, 'crosshair').setDepth(1000);
        this.crosshair.setOrigin(0.5, 0.5);
        this.crosshair.setScale(1);
        this.crosshair.setScrollFactor(0);        // Set up HUD
        this.currentWeaponIndexRef = { value: this.currentWeaponIndex };
        this.currentWeapon = window.WEAPONS[this.currentWeaponIndex];
        this.playerHUD = new PlayerHUD(this, this.playerStats, window.WEAPONS, this.currentWeaponIndexRef);
        this.updateHUD = () => this.playerHUD.updateHUD();
        this.updateHUD();
    }    setupInput() {
        // Crosshair movement
        this.input.on('pointermove', pointer => {
            this.crosshair.x = pointer.x;
            this.crosshair.y = pointer.y;
        });

        // Set custom cursor to none (show crosshair instead)
        this.input.setDefaultCursor('none');

        // Make sure cursor is reset to none when scene resumes
        this.events.on('resume', () => {
            this.input.setDefaultCursor('none');
        });

        // Add click handling for shooting
        this.input.on('pointerdown', pointer => {
            if (!this.player.isDead && !this.currentWeapon.reloading) {
                this.shootBullet(pointer);
            }
        });
          // Add continuous firing check for automatic weapons
        this.time.addEvent({
            delay: 16, // Check roughly every frame
            loop: true,
            callback: () => {
                if (this.input.activePointer.isDown && !this.player.isDead && !this.currentWeapon.reloading) {
                    // Only auto-fire if the weapon is full auto
                    if (this.currentWeapon && this.currentWeapon.rateOfFire === 'fullauto') {
                        this.shootBullet(this.input.activePointer);
                    }
                }
            }
        });

        // Weapon switching
        this.input.keyboard.on('keydown-ONE', () => this.selectWeapon(0));
        this.input.keyboard.on('keydown-TWO', () => {
            if (window.WEAPONS[1].unlocked) {
                this.selectWeapon(1);
            }
        });
        this.input.keyboard.on('keydown-THREE', () => {
            if (window.WEAPONS[2].unlocked) {
                this.selectWeapon(2);
            }
        });

        // Manual reload
        this.input.keyboard.on('keydown-R', () => this.reloadWeapon(this.currentWeaponIndex));

        // Add ESC key handler for pause
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.launch('PauseMenu');
            this.scene.pause();
            this.input.setDefaultCursor('default');
        });
    }

    setupCollisions() {
        // Bullet-enemy collision
        this.physics.add.overlap(
            this.bullets,
            this.enemyGroup,
            this.handleBulletEnemyCollision,
            null,
            this
        );

        // Player-enemy collision
        this.physics.add.overlap(
            this.player.sprite,
            this.enemyGroup,
            this.handlePlayerEnemyCollision,
            null,
            this
        );

        // Item pickup collision
        this.physics.add.overlap(
            this.player.sprite,
            this.itemGroup,
            this.handleItemPickup,
            null,
            this
        );
    }

    update(time, delta) {
        // Update enemies
        if (this.enemies) {
            for (let enemy of this.enemies) {
                if (enemy && typeof enemy.update === 'function') {
                    enemy.update();
                }
            }
        }

        // Update player
        this.player.update(delta);

        // Update HUD
        if (typeof this.updateHUD === 'function') {
            this.updateHUD();
        }

        // Update wave system
        if (this.waveSystem) {
            this.waveSystem.update(time, delta);
        }

        // Update player stats time
        window.playerStats.updateTime(this.waveSystem ? this.waveSystem.elapsedTime : 0);

        // Update bullets
        this.bullets.children.iterate((bullet) => {
            if (!bullet.active) return;
            if (
                bullet.x < 0 || bullet.x > this.mapWidth ||
                bullet.y < 0 || bullet.y > this.mapHeight ||
                (time - bullet.spawnTime > this.bulletLifetime)
            ) {
                bullet.setActive(false);
                bullet.setVisible(false);
                bullet.body.setVelocity(0, 0);
                bullet.body.enable = false;
            }
        });

        // Ensure crosshair is always on top
        if (this.crosshair) {
            this.crosshair.depth = 1000;
        }
    }

    // Helper methods
    selectWeapon(index) {
        if (window.WEAPONS[index].unlocked) {
            this.currentWeaponIndex = index;
            this.currentWeaponIndexRef.value = index;
            this.currentWeapon = window.WEAPONS[index];
            if (typeof this.updateHUD === 'function') {
                this.updateHUD();
            }
        }
    }    shootBullet(pointer) {
        const now = this.time.now;

        // Initialize last shot time if not set
        if (!this.currentWeapon.lastShotTime) this.currentWeapon.lastShotTime = 0;
        
        // Check if enough time has passed since last shot based on weapon cooldown
        const timeSinceLastShot = now - this.currentWeapon.lastShotTime;
        if (timeSinceLastShot < this.currentWeapon.cooldown) {
            return; // Still in cooldown period
        }
        
        // Handle ammo and reloading
        if (this.currentWeapon.magazineSize !== -1) {
            if (this.currentWeapon.reloading) return;
            if (this.currentWeapon.ammo < 1) {
                this.reloadWeapon(this.currentWeaponIndex);
                if (typeof this.updateHUD === 'function') this.updateHUD();
                return;
            }
            this.currentWeapon.ammo -= 1;
            if (typeof this.updateHUD === 'function') this.updateHUD();
        }

        this.currentWeapon.lastShotTime = now;

        if (this.currentWeapon.shootSound) {
            this.sound.play(this.currentWeapon.shootSound, { volume: this.audioVolume });
        }

        const worldPoint = pointer.positionToCamera(this.cameras.main);
        const dx = worldPoint.x - this.player.sprite.x;
        const dy = worldPoint.y - this.player.sprite.y;
        const baseAngle = Math.atan2(dy, dx);

        for (let i = 0; i < this.currentWeapon.bulletsPerShot; i++) {
            let angle = baseAngle;
            if (this.currentWeapon.spread && this.currentWeapon.bulletsPerShot > 1) {
                const spreadRad = Phaser.Math.DegToRad(this.currentWeapon.spread);
                angle = baseAngle - spreadRad/2 + (spreadRad/(this.currentWeapon.bulletsPerShot-1))*i;
            }

            let bullet = this.bullets.get();
            if (!bullet) continue;

            if (!bullet.body) {
                this.physics.add.existing(bullet);
            }

            bullet.setFillStyle(this.currentWeapon.color);
            bullet.setSize(12, 12);
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.x = this.player.sprite.x;
            bullet.y = this.player.sprite.y;
            bullet.body.enable = true;
            bullet.body.setAllowGravity(false);
            bullet.body.setVelocity(
                Math.cos(angle) * this.bulletSpeed,
                Math.sin(angle) * this.bulletSpeed
            );
            bullet.spawnTime = now;
        }
    }

    reloadWeapon(index) {
        let w = window.WEAPONS[index];
        if (w.reloading || w.magazineSize === -1) return;
        
        w.reloading = true;
        if (typeof this.updateHUD === 'function') this.updateHUD();

        // Create reload progress bar
        const barWidth = 80;
        const barHeight = 12;
        const barY = 80;

        const reloadBarBg = this.add.rectangle(
            this.player.sprite.x,
            this.player.sprite.y + barY,
            barWidth,
            barHeight,
            0x000000,
            0.8
        ).setDepth(999);

        const reloadBar = this.add.rectangle(
            this.player.sprite.x - barWidth/2,
            this.player.sprite.y + barY,
            0,
            barHeight - 2,
            0x00ff00,
            1
        ).setDepth(999);
        reloadBar.setOrigin(0, 0.5);

        let totalReloadTime = w.reloadTime;
        if (w.name === 'Shotgun') {
            const shellsToReload = w.magazineSize - w.ammo;
            totalReloadTime = w.reloadTime * shellsToReload;
            
            for (let i = 0; i < shellsToReload; i++) {
                this.time.delayedCall(i * w.reloadTime, () => {
                    if (w.reloadSound) {
                        this.sound.play(w.reloadSound, { volume: this.audioVolume });
                    }
                });
            }
        } else if (w.reloadSound) {
            this.sound.play(w.reloadSound, { volume: this.audioVolume });
        }

        const updateBarPosition = () => {
            if (reloadBarBg && reloadBarBg.active) {
                reloadBarBg.x = this.player.sprite.x;
                reloadBarBg.y = this.player.sprite.y + barY;
                reloadBar.x = this.player.sprite.x - barWidth/2;
                reloadBar.y = this.player.sprite.y + barY;
            }
        };

        const updateEvent = this.events.addListener('postupdate', updateBarPosition);

        this.tweens.add({
            targets: reloadBar,
            width: barWidth,
            duration: totalReloadTime,
            ease: 'Linear',
            onComplete: () => {
                reloadBarBg.destroy();
                reloadBar.destroy();
            }
        });

        this.time.delayedCall(totalReloadTime, () => {
            w.ammo = w.magazineSize;
            w.reloading = false;
            this.events.removeListener('postupdate', updateBarPosition);
            if (typeof this.updateHUD === 'function') this.updateHUD();
        });
    }

    handleBulletEnemyCollision(bullet, enemySprite) {
        if (!bullet.active || !enemySprite.visible) return;

        let enemyObj = enemySprite.enemyRef;
        if (enemyObj && enemyObj.alive) {
            const impactVec = new Phaser.Math.Vector2(
                enemySprite.x - bullet.x,
                enemySprite.y - bullet.y
            ).normalize().scale(40);

            let dmg = 1;
            if (bullet && bullet.fillColor !== undefined) {
                for (let w of window.WEAPONS) {
                    if (w.color === bullet.fillColor) {
                        dmg = w.damage || 1;
                        break;
                    }
                }
            }

            const isKillingBlow = enemyObj.health <= dmg;
            this.sound.play(isKillingBlow ? 'bullet_hit_kill' : 'bullet_hit', { volume: this.audioVolume });            // Track kills if this is a killing blow
            if (isKillingBlow) {
                window.playerStats.incrementKills();
                
                // 30% chance to spawn a coin
                if (Math.random() < 0.3) {
                    const coin = this.createFloatingItem(enemySprite.x, enemySprite.y, 'item_coin', 'coin', 32);
                }
            }

            this.showDamageNumber(enemySprite.x, enemySprite.y, dmg);
            enemyObj.takeDamage(dmg, { x: impactVec.x, y: impactVec.y, duration: 100 });
            
            bullet.setActive(false);
            bullet.setVisible(false);
            bullet.body.enable = false;
        }
    }

    handlePlayerEnemyCollision(playerSprite, enemySprite) {
        let enemyObj = enemySprite.enemyRef;
        if (enemyObj && enemyObj.alive) {
            const knockbackVec = new Phaser.Math.Vector2(
                enemySprite.x - playerSprite.x,
                enemySprite.y - playerSprite.y
            ).normalize().scale(60);            
            enemyObj.takeDamage(0, { x: knockbackVec.x, y: knockbackVec.y, duration: 400 });            
            if (!this.player.isInvulnerable) {
                this.sound.play('bullet_hit', { volume: this.audioVolume });
            }
            this.player.takeDamage(enemyObj.damage);
        }
    }    handleItemPickup(playerSprite, item) {
        if (!item.active) return;

        let canPickup = false;
        let pickupText = '';
        let textColor = '#ffffff';
        
        switch (item.itemType) {            case 'coin':
                canPickup = true;
                if (canPickup) {
                    this.player.stats.coins = (this.player.stats.coins || 0) + 1;
                    window.playerStats.addCoins(1);
                    this.registry.set('coins', this.player.stats.sessionCoins); // Update registry with session coins
                    this.sound.play('coin_pickup', { volume: this.audioVolume });
                    pickupText = '+1 Coin';
                    textColor = '#ffdd00';
                    if (typeof this.updateHUD === 'function') this.updateHUD();
                }
                break;
            case 'weapon':
                canPickup = !window.WEAPONS[item.weaponIndex].unlocked;
                if (canPickup) {
                    window.WEAPONS[item.weaponIndex].unlocked = true;
                    window.WEAPONS[item.weaponIndex].ammo = window.WEAPONS[item.weaponIndex].magazineSize;
                    this.sound.play('weapon_pickup', { volume: this.audioVolume });
                    pickupText = `Picked up ${window.WEAPONS[item.weaponIndex].name}!`;
                    textColor = '#ffff00';
                    // Auto-switch to new weapon
                    this.selectWeapon(item.weaponIndex);
                }
                break;            case 'armor':
                canPickup = this.player.stats.armor < this.player.stats.maxArmor;
                if (canPickup) {
                    const newArmor = Math.min(this.player.stats.maxArmor, this.player.stats.armor + 50);
                    this.player.setArmor(newArmor);
                    this.sound.play('pickup_sound', { volume: this.audioVolume });
                    pickupText = '+50 Armor';
                    textColor = '#3399ff';
                }
                break;
            case 'armor_shard':
                canPickup = this.player.stats.armor < this.player.stats.maxArmor;
                if (canPickup) {
                    const newArmor = Math.min(this.player.stats.maxArmor, this.player.stats.armor + 5);
                    this.player.setArmor(newArmor);
                    this.sound.play('pickup_sound_small', { volume: this.audioVolume });
                    pickupText = '+5 Armor';
                    textColor = '#3399ff';
                }
                break;            case 'medkit':
                canPickup = this.player.stats.health < this.player.stats.maxHealth;
                if (canPickup) {
                    const healAmount = 50;
                    const actualHeal = Math.min(healAmount, this.player.stats.maxHealth - this.player.stats.health);
                    this.player.setHealth(this.player.stats.health + actualHeal);
                    this.sound.play('pickup_sound', { volume: this.audioVolume });
                    pickupText = `+${actualHeal} Health`;
                    textColor = '#ff6666';
                }
                break;
            default:
                canPickup = true;
                break;
        }

        if (canPickup) {
            item.active = false;

            if (pickupText) {
                this.showPickupText(this.player.sprite.x, this.player.sprite.y, pickupText, textColor);
            }

            this.tweens.add({
                targets: item,
                scaleX: 0,
                scaleY: 0,
                alpha: 0,
                duration: 200,
                ease: 'Back.In',
                onComplete: () => item.destroy()
            });
        }
    }

    updateWaveSystem() {
        // Wave system logic
        if (!this.waveStarted && this.enemySpawningEnabled) {
            this.startWave();
        }

        if (this.waveStarted) {
            let allEnemiesDefeated = true;
            for (let enemy of this.enemies) {
                if (enemy && enemy.alive) {
                    allEnemiesDefeated = false;
                    break;
                }
            }

            if (allEnemiesDefeated) {
                this.endWave();
            }
        }
    }

    startWave() {
        this.waveStarted = true;
        this.currentWave++;

        this.showMessage(`Wave ${this.currentWave}`, '#ffff00');

        // Spawn initial enemies for the wave
        const numEnemies = Phaser.Math.Between(5, 10);
        for (let i = 0; i < numEnemies; i++) {
            this.time.delayedCall(i * 500, () => {
                this.spawnEnemy();
            });
        }

        // Increase difficulty gradually
        this.time.delayedCall(2000, () => {
            this.enemySpawnRate = Math.max(500, this.enemySpawnRate - 100);
        }, [], this);

        this.time.delayedCall(3000, () => {
            this.enemyDamageMultiplier += 0.1;
        }, [], this);
    }

    endWave() {
        this.waveStarted = false;

        this.time.delayedCall(2000, () => {
            this.showMessage('Wave Cleared!', '#00ff00');
        });
    }

    spawnEnemy() {
        const margin = 40;
        const cam = this.cameras.main;

        let edge = Phaser.Math.Between(0, 3);
        let ex, ey;

        if (edge === 0) {
            ex = Phaser.Math.Between(cam.worldView.left + margin, cam.worldView.right - margin);
            ey = cam.worldView.top - margin;
        } else if (edge === 1) {
            ex = cam.worldView.right + margin;
            ey = Phaser.Math.Between(cam.worldView.top + margin, cam.worldView.bottom - margin);
        } else if (edge === 2) {
            ex = Phaser.Math.Between(cam.worldView.left + margin, cam.worldView.right - margin);
            ey = cam.worldView.bottom + margin;
        } else {
            ex = cam.worldView.left - margin;
            ey = Phaser.Math.Between(cam.worldView.top + margin, cam.worldView.bottom - margin);
        }

        ex = Phaser.Math.Clamp(ex, 0, this.mapWidth);
        ey = Phaser.Math.Clamp(ey, 0, this.mapHeight);

        let enemy = new Enemy(this, ex, ey, null);
        this.enemies.push(enemy);
        this.enemyGroup.add(enemy.sprite);
        this.children.bringToTop(enemy.sprite);
        enemy.sprite.setAlpha(1);
        
        // Set player reference after a frame
        this.time.delayedCall(0, () => {
            enemy.playerRef = this.player.sprite;
            this.player.sprite.playerRef = this.player;
        });
    }

    showDamageNumber(x, y, amount) {
        const text = this.add.text(x, y - 40, `-${amount}`, {
            font: '20px Arial',
            fill: '#ffffff',
            stroke: '#000',
            strokeThickness: 3,
            fontStyle: 'bold'
        }).setOrigin(0.5, 1).setDepth(1500);

        this.tweens.add({
            targets: text,
            y: text.y - 32,
            alpha: 0,
            duration: 600,
            ease: 'Cubic.Out',
            onComplete: () => text.destroy()
        });
    }

    showPickupText(x, y, message, color) {
        const text = this.add.text(x, y - 60, message, {
            font: '32px Arial',
            fill: color,
            stroke: '#000',
            strokeThickness: 3,
            fontStyle: 'bold'
        }).setOrigin(0.5, 1).setDepth(2000);

        this.tweens.add({
            targets: text,
            y: text.y - 40,
            alpha: 0,
            duration: 2500,
            ease: 'Cubic.Out',
            onComplete: () => text.destroy()
        });
    }

    toggleEnemySpawner() {
        this.enemySpawningEnabled = !this.enemySpawningEnabled;
        
        if (this.enemySpawningEnabled) {
            this.enemySpawnerEvent = this.time.addEvent({
                delay: 1000,
                loop: true,
                callback: () => {
                    const n = Phaser.Math.Between(1, 3);
                    this.spawnEnemiesAroundPlayer(n);
                }
            });
            this.showMessage('Enemy Spawning: ON', '#ff6666');
        } else {
            if (this.enemySpawnerEvent) {
                this.enemySpawnerEvent.remove(false);
            }
            this.enemySpawnerEvent = null;
            this.showMessage('Enemy Spawning: OFF', '#cccccc');
        }
    }

    spawnEnemiesAroundPlayer(num) {
        if (!this.enemies) return;

        const SPAWN_RADIUS = 400;
        const SPAWN_MARGIN = 60;

        for (let i = 0; i < num; i++) {
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const dist = Phaser.Math.Between(SPAWN_RADIUS, SPAWN_RADIUS + SPAWN_MARGIN);
            let ex = this.player.sprite.x + Math.cos(angle) * dist;
            let ey = this.player.sprite.y + Math.sin(angle) * dist;

            ex = Phaser.Math.Clamp(ex, 0, this.mapWidth);
            ey = Phaser.Math.Clamp(ey, 0, this.mapHeight);

            let enemy = new Enemy(this, ex, ey, this.player.sprite);
            this.enemies.push(enemy);
            this.enemyGroup.add(enemy.sprite);
            this.children.bringToTop(enemy.sprite);
            enemy.sprite.setAlpha(1);
        }
    }

    showMessage(text, color) {
        const msg = this.add.text(this.player.sprite.x, this.player.sprite.y - 80, text, {
            font: '18px Arial',
            fill: color,
            fontStyle: 'bold',
            backgroundColor: '#222',
            padding: { left: 8, right: 8, top: 4, bottom: 4 }
        }).setOrigin(0.5, 1).setDepth(2000);

        this.tweens.add({
            targets: msg,
            alpha: 0,
            duration: 1200,
            onComplete: () => msg.destroy()
        });
    }

    // Item spawn helper methods
    createFloatingItem(x, y, spriteKey, itemType, size = 64) {
        const item = this.add.sprite(x, y, spriteKey);
        item.setDisplaySize(size, size);
        this.itemGroup.add(item);
        this.children.bringToTop(item);
        
        this.tweens.add({
            targets: item,
            y: item.y - 10,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
        });

        item.itemType = itemType;
        return item;
    }

    spawnArmorPickup(x, y) {
        return this.createFloatingItem(x, y, 'item_armor', 'armor');
    }

    spawnArmorShardPickup(x, y) {
        return this.createFloatingItem(x, y, 'item_armor_shard', 'armor_shard', 48);
    }

    spawnMedkitPickup(x, y) {
        return this.createFloatingItem(x, y, 'item_medkit', 'medkit');
    }    showUpgradeDialog() {
        // Pause the scene but keep input events active
        this.scene.pause('TestLevel');
        
        // Reset cursor to default and make it visible
        this.input.setDefaultCursor('default');
        
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        const HUD_DEPTH = 6000; // Above regular HUD

        // Create semi-transparent background
        this.add.rectangle(0, 0, 
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000, 0.7)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(HUD_DEPTH);

        // Create upgrade panel
        this.add.rectangle(centerX, centerY,
            500, 400, // Increased panel size
            0x333333)
            .setScrollFactor(0)
            .setDepth(HUD_DEPTH);

        // Title
        this.add.text(centerX, centerY - 160,
            'Choose Your Upgrade',
            {
                font: '28px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                fontStyle: 'bold'
            })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(HUD_DEPTH);            const buttonStyle = {
            font: '20px Arial',
            fill: '#ffffff',
            align: 'center'
        };

        const descStyle = {
            font: '16px Arial',
            fill: '#cccccc',
            wordWrap: { width: 300 },
            align: 'center'
        };

        const createUpgradeOption = (y, title, description, type) => {            // Create background rectangle for button
            const buttonBg = this.add.rectangle(centerX, y, 300, 40, 0x444444)
                .setScrollFactor(0)
                .setDepth(HUD_DEPTH)
                .setInteractive({ useHandCursor: true });

            const button = this.add.text(centerX, y, title, buttonStyle)
                .setOrigin(0.5)
                .setScrollFactor(0)
                .setDepth(HUD_DEPTH + 1); // Put text above background

            const desc = this.add.text(centerX, y + 25, description, descStyle)
                .setOrigin(0.5, 0)
                .setScrollFactor(0)
                .setDepth(HUD_DEPTH);            // Add hover effects
            buttonBg.on('pointerover', () => {
                buttonBg.setFillStyle(0x666666);
                button.setStyle({ ...buttonStyle, fill: '#ffff00' });
            });
            buttonBg.on('pointerout', () => {
                buttonBg.setFillStyle(0x444444);
                button.setStyle(buttonStyle);
            });

            // Add click handler
            buttonBg.on('pointerdown', () => {
                this.player.applyUpgrade(type);
                this.cleanupUpgradeDialog([buttonBg, button, desc]);
                this.scene.resume('TestLevel');
            });

            return [button, desc];
        };

        const elements = [
            ...createUpgradeOption(
                centerY - 80,
                'Increase Max Health',
                'Gain +5 max health and heal for 5 points',
                'health'
            ),
            ...createUpgradeOption(
                centerY + 20,
                'Increase Armor',
                'Gain +5 armor protection against enemy attacks',
                'armor'
            ),
            ...createUpgradeOption(
                centerY + 120,
                'Increase Max Stamina',
                'Gain +5 max stamina for more frequent dodge rolls',
                'stamina'
            )
        ];
    }

    cleanupUpgradeDialog(elements) {
        elements.forEach(element => element.destroy());
        this.input.setDefaultCursor('none');
    }
}
