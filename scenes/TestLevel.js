class TestLevel extends Phaser.Scene {
    constructor() {
        super({ key: 'TestLevel' });
        this.isMobile = false;
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
        this.load.audio('coin_pickup', 'assets/audio/9mmclip1.wav');        
        this.load.audio('weapon_switch', 'assets/audio/guncock1.wav');
        
        // Item sprites
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
        // Check if we're on a mobile device
        this.isMobile = DeviceDetector.isMobileDevice();

        // Reset player stats and registry at the start of the level
        window.playerStats.reset();
        this.registry.set('level', 1);
        this.registry.set('experience', 0);
          // Initialize properties
        const baseMapDimension = 2200;
        this.mapWidth = baseMapDimension;
        this.mapHeight = baseMapDimension; 
        this.bulletSpeed = 600 * window.gameScale;
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
        // Apply gameScale to tile size
        const baseTileSize = 64;
        const tileSize = baseTileSize * window.gameScale;
        
        // Calculate needed tiles based on map dimensions and scaled tile size
        for (let x = 0; x < this.mapWidth; x += tileSize) {
            for (let y = 0; y < this.mapHeight; y += tileSize) {
                const tile = this.add.image(x + tileSize/2, y + tileSize/2, 'tile_hell');
                tile.setDisplaySize(tileSize, tileSize); // Scale the tile according to gameScale
                tile.setDepth(0) // Background elements: 0-99
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
    }    
    setupPlayer() {
        this.player = new Player(this, this.mapWidth / 2, this.mapHeight / 2);
        this.player.stats.coins = 0; // Initialize coins
        this.registry.set('coins', 0); // Initialize coins in registry
        this.playerStats = this.player.stats;
        this.player.sprite.setDepth(999); // Use a high value to ensure it's above other objects
        
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
    }    setupItems() {
        this.itemGroup = this.physics.add.group();

        // Helper function to create floating items with bob animation
        const createFloatingItem = (x, y, sprite, baseScale = 0.5) => {
            const item = this.add.sprite(x, y, sprite);
            // Apply gameScale to item scale
            item.setScale(baseScale * window.gameScale);
            this.physics.add.existing(item);
            this.itemGroup.add(item);
              // Add floating animation with scaled bobbing height
            this.tweens.add({
                targets: item,
                y: item.y - (10 * window.gameScale),
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
    }    setupUI() {        // Add tooltip text - different for mobile vs desktop
        const tooltipMessage = this.isMobile ? 
            'Use joysticks to move and shoot, tap weapon icons to switch' :
            'WASD = move, R = reload, Space = dodge';
        
        const tooltipText = this.add.text(
            this.cameras.main.width - 24,
            18,
            tooltipMessage,
            {
                font: `${Math.round(18 * window.gameScale)}px Arial`,
                fill: '#cccccc',
                backgroundColor: 'rgba(34,34,34,0.7)',
                padding: { 
                    left: Math.round(8 * window.gameScale), 
                    right: Math.round(8 * window.gameScale), 
                    top: Math.round(4 * window.gameScale), 
                    bottom: Math.round(4 * window.gameScale) 
                },
                align: 'right',
                fontStyle: 'bold'
            }
        ).setOrigin(1, 0).setScrollFactor(0).setDepth(2000);

        this.scale.on('resize', (gameSize) => {
            tooltipText.x = gameSize.width - 24;
        });// Custom cursor (crosshair)
        this.input.setDefaultCursor('none');
        this.crosshair = this.add.image(0, 0, 'crosshair').setDepth(1000);
        this.crosshair.setOrigin(0.5, 0.5);
        this.crosshair.setScale(window.gameScale); // Scale the crosshair
        this.crosshair.setScrollFactor(0);// Set up HUD
        this.currentWeaponIndexRef = { value: this.currentWeaponIndex };
        this.currentWeapon = window.WEAPONS[this.currentWeaponIndex];
        this.playerHUD = new PlayerHUD(this, this.playerStats, window.WEAPONS, this.currentWeaponIndexRef);
        this.updateHUD = () => this.playerHUD.updateHUD();
        this.updateHUD();
    }    setupInput() {
        // Detect device type and set up appropriate controls
        if (this.isMobile) {
            this.setupMobileControls();
        } else {
            this.setupDesktopControls();
        }
        
        // Make sure cursor is reset to appropriate type when scene resumes
        this.events.on('resume', () => {
            if (!this.isMobile) {
                this.input.setDefaultCursor('none');
            }
        });

        // Add continuous firing check for automatic weapons (works for both mobile and desktop)
        this.time.addEvent({
            delay: 16, // Check roughly every frame
            loop: true,
            callback: () => {
                if (this.isMobile) {
                    // For mobile, check the shooting joystick
                    if (this.mobileControls && 
                        this.mobileControls.isShooting && 
                        !this.player.isDead && 
                        !this.currentWeapon.reloading) {
                        
                        // Handle all weapon types with proper rate of fire
                        const now = this.time.now;
                        const timeSinceLastShot = now - (this.currentWeapon.lastShotTime || 0);
                        
                        if (timeSinceLastShot >= this.currentWeapon.cooldown) {
                            // For automatic weapons, shoot continuously
                            if (this.currentWeapon.rateOfFire === 'fullauto') {
                                this.shootWithMobileJoystick();
                            } 
                            // For semi-auto weapons, shoot only when joystick direction changes
                            else if (this.mobileControls.justStartedShooting) {
                                this.shootWithMobileJoystick();
                            }
                        }
                    }
                } else {
                    // For desktop, use the pointer
                    if (this.input.activePointer.isDown && 
                        !this.player.isDead && 
                        !this.currentWeapon.reloading) {
                        if (this.currentWeapon && this.currentWeapon.rateOfFire === 'fullauto') {
                            this.shootBullet(this.input.activePointer);
                        }
                    }
                }
            }
        });
    }

    setupDesktopControls() {
        // Crosshair movement
        this.input.on('pointermove', pointer => {
            this.crosshair.x = pointer.x;
            this.crosshair.y = pointer.y;
        });

        // Set custom cursor to none (show crosshair instead)
        this.input.setDefaultCursor('none');

        // Add click handling for shooting
        this.input.on('pointerdown', pointer => {
            if (!this.player.isDead && !this.currentWeapon.reloading) {
                this.shootBullet(pointer);
            }
        });

        // Weapon switching with keyboard
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
    
    setupMobileControls() {
        // Create mobile controls
        this.mobileControls = new MobileControls(this);
        this.mobileControls.create();
        
        // Hide crosshair on mobile
        if (this.crosshair) {
            this.crosshair.setVisible(false);
        }
        
        // Set default cursor for mobile
        this.input.setDefaultCursor('default');
        
        // Setup touch handling for weapon selection
        this.makeWeaponSlotsInteractive();
    }

    makeWeaponSlotsInteractive() {
        // Make weapon slots interactive for mobile touch
        if (this.playerHUD && this.playerHUD.weaponSlots) {
            this.playerHUD.weaponSlots.forEach((slot, index) => {
                if (slot.bg && window.WEAPONS[index].unlocked) {
                    slot.bg.setInteractive();
                    slot.sprite.setInteractive();
                    
                    // Touch handlers for weapon selection
                    const touchHandler = () => {
                        this.selectWeapon(index);
                    };
                    
                    slot.bg.on('pointerdown', touchHandler);
                    slot.sprite.on('pointerdown', touchHandler);
                }
            });
        }
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

        // Update mobile controls
        if (this.isMobile && this.mobileControls) {
            this.mobileControls.update();
            
            // Process mobile shooting for non-automatic weapons
            if (this.mobileControls.isShooting && 
                !this.player.isDead && 
                !this.currentWeapon.reloading && 
                this.currentWeapon.rateOfFire !== 'fullauto') {
                this.shootWithMobileJoystick();
            }
            
            // Update crosshair position for mobile (hidden but used for calculating shot direction)
            if (this.crosshair) {
                const shootJoyX = this.mobileControls.shootJoyX;
                const shootJoyY = this.mobileControls.shootJoyY;
                
                if (shootJoyX !== 0 || shootJoyY !== 0) {
                    // Calculate where the crosshair would be based on joystick
                    const distance = 100; // Virtual distance
                    this.crosshair.x = this.player.sprite.x + (shootJoyX * distance);
                    this.crosshair.y = this.player.sprite.y + (shootJoyY * distance);
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

        // Add this code to check for weapon changes from the HUD
        if (this.currentWeaponIndexRef && this.currentWeaponIndex !== this.currentWeaponIndexRef.value) {
            // Update the current weapon index to match what was selected in HUD
            this.currentWeaponIndex = this.currentWeaponIndexRef.value;
            // Update the current weapon reference
            this.currentWeapon = window.WEAPONS[this.currentWeaponIndex];
            
            // Optional - play sound effect to confirm weapon change
            if (this.sound) {
                this.sound.play('weapon_switch', { volume: this.audioVolume });
            }
        }

        // Update reload bar position to follow player if it exists
        if (this.reloadBarBg && this.player && this.player.sprite) {
            const barY = this.player.sprite.y - 80 * window.gameScale;
            
            this.reloadBarBg.x = this.player.sprite.x;
            this.reloadBarBg.y = barY;
            
            if (this.reloadBarFill) {
                this.reloadBarFill.x = this.player.sprite.x - (this.reloadBarFill.width / 2);
                this.reloadBarFill.y = barY;
            }
            
            if (this.reloadBarText) {
                this.reloadBarText.x = this.player.sprite.x;
                this.reloadBarText.y = barY - 5 * window.gameScale;
            }
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
    }    
    
    shootBullet(pointer) {
        const currentWeapon = this.currentWeapon;
        
        // Check if weapon is reloading
        if (currentWeapon.reloading) {
            // Allow shotgun to fire mid-reload, cancelling the remaining reload
            if (currentWeapon.name === 'Shotgun' && currentWeapon.canCancelReload && currentWeapon.ammo > 0) {
                // Cancel the reload event
                if (this.shellReloadEvent) {
                    this.shellReloadEvent.remove();
                }
                currentWeapon.reloading = false;
                this.destroyReloadBar(); // Remove the reload bar when cancelling reload
            } else {
                // Other weapons can't fire while reloading
                return;
            }
        }
        
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
            }            bullet.setFillStyle(this.currentWeapon.color);
            // Scale bullet size according to gameScale
            const bulletSize = Math.round(12 * window.gameScale);
            bullet.setSize(bulletSize, bulletSize);
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.x = this.player.sprite.x;
            bullet.y = this.player.sprite.y;
            bullet.body.enable = true;
            bullet.body.setAllowGravity(false);
            // Set depth for bullets slightly higher than items but below enemies
            bullet.setDepth(300);
            bullet.body.setVelocity(
                Math.cos(angle) * this.bulletSpeed,
                Math.sin(angle) * this.bulletSpeed
            );
            bullet.spawnTime = now;
        }
    }

    shootWithMobileJoystick() {
        if (!this.mobileControls || this.player.isDead || this.currentWeapon.reloading) {
            return;
        }
        
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
        
        // Get shooting angle from joystick
        const joyX = this.mobileControls.shootJoyX;
        const joyY = this.mobileControls.shootJoyY;
        
        if (joyX === 0 && joyY === 0) return; // No direction to shoot
        
        const angle = Math.atan2(joyY, joyX);
        
        for (let i = 0; i < this.currentWeapon.bulletsPerShot; i++) {
            let shotAngle = angle;
            if (this.currentWeapon.spread && this.currentWeapon.bulletsPerShot > 1) {
                const spreadRad = Phaser.Math.DegToRad(this.currentWeapon.spread);
                shotAngle = angle - spreadRad/2 + (spreadRad/(this.currentWeapon.bulletsPerShot-1))*i;
            }
            
            let bullet = this.bullets.get();
            if (!bullet) continue;
            
            if (!bullet.body) {
                this.physics.add.existing(bullet);
            }
            
            bullet.setFillStyle(this.currentWeapon.color);
            
            // Scale bullet size according to gameScale
            const bulletSize = Math.round(12 * window.gameScale);
            bullet.setSize(bulletSize, bulletSize);
            
            // Set bullet position to start from player
            bullet.x = this.player.sprite.x;
            bullet.y = this.player.sprite.y;
            
            // Set bullet active and visible
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.body.enable = true;
            
            // Calculate velocity
            const vx = Math.cos(shotAngle) * this.bulletSpeed;
            const vy = Math.sin(shotAngle) * this.bulletSpeed;
            
            // Set bullet velocity and track spawn time
            bullet.body.setVelocity(vx, vy);
            bullet.spawnTime = now;
            bullet.damage = this.currentWeapon.damage;
            
            // Critical hit calculation based on player's critical hit chance
            const criticalHitChance = this.player.stats.criticalHitChance;
            bullet.isCritical = Phaser.Math.Between(0, 99) < criticalHitChance;
            
            // If critical, double the damage
            if (bullet.isCritical) {
                bullet.damage *= 2;
                bullet.setFillStyle(0xff9900); // Yellow-orange for crits
            }
        }
    }

    reloadWeapon() {
        const currentWeapon = this.currentWeapon;
        
        // Don't reload if already reloading or magazine is full
        if (!currentWeapon.reloading && currentWeapon.ammo < currentWeapon.magazineSize) {
            // Start the reload process
            currentWeapon.reloading = true;
            
            // Create reload progress bar
            this.createReloadBar();
            
            // Special handling for shotgun - reload one shell at a time
            if (currentWeapon.name === 'Shotgun') {
                // Calculate how many shells need to be loaded
                const shellsToLoad = currentWeapon.magazineSize - currentWeapon.ammo;
                
                // Play initial reload sound
                this.sound.play('shotgun_reload', { volume: this.audioVolume });
                
                // Increment ammo by 1 for first shell
                currentWeapon.ammo++;
                
                // Update reload bar for first shell
                this.updateReloadBar(1/shellsToLoad);
                
                // If only one shell needs to be loaded, we're done after the first shell
                if (shellsToLoad === 1) {
                    this.time.delayedCall(currentWeapon.reloadTime, () => {
                        currentWeapon.reloading = false;
                        this.destroyReloadBar();
                        
                        if (this.updateHUD) {
                            this.updateHUD();
                        }
                    });
                    return;
                }
                
                // For multiple shells, set up a recurring event
                let shellsLoaded = 1; // Already loaded one shell
                
                this.shellReloadEvent = this.time.addEvent({
                    delay: currentWeapon.reloadTime,
                    callback: () => {
                        // Add one shell
                        currentWeapon.ammo++;
                        shellsLoaded++;
                        
                        // Update reload bar
                        this.updateReloadBar(shellsLoaded/shellsToLoad);
                        
                        // Play reload sound for each shell
                        this.sound.play('shotgun_reload', { volume: this.audioVolume * 0.7 });
                        
                        // Update HUD after each shell
                        if (this.updateHUD) {
                            this.updateHUD();
                        }
                        
                        // Check if magazine is full or reload was interrupted
                        if (currentWeapon.ammo >= currentWeapon.magazineSize || !currentWeapon.reloading) {
                            // Finish reloading
                            currentWeapon.reloading = false;
                            this.destroyReloadBar();
                            this.shellReloadEvent.remove();
                        }
                    },
                    callbackScope: this,
                    repeat: shellsToLoad - 2  // We've already loaded 1, and repeat is 0-indexed
                });
                
                // Allow player to cancel reload by firing
                currentWeapon.canCancelReload = true;
            } else {
                // Regular weapons reload all at once
                currentWeapon.lastShotTime = this.time.now; // Prevent shooting during reload
                
                // Play reload sound
                this.sound.play('generic_reload', { volume: this.audioVolume });
                
                // Create reload progress tween
                this.reloadTween = this.tweens.add({
                    targets: { progress: 0 },
                    progress: 1,
                    duration: currentWeapon.reloadTime,
                    ease: 'Linear',
                    onUpdate: (tween) => {
                        const progress = tween.getValue();
                        this.updateReloadBar(progress);
                    },
                    onComplete: () => {
                        // Only complete reload if still reloading (not cancelled)
                        if (currentWeapon.reloading) {
                            // Refill ammo
                            currentWeapon.ammo = currentWeapon.magazineSize;
                            currentWeapon.reloading = false;
                            this.destroyReloadBar();
                            
                            // Update HUD
                            if (this.updateHUD) {
                                this.updateHUD();
                            }
                        }
                    }
                });
                
                currentWeapon.canCancelReload = false;
            }
            
            // Update HUD to show "Reloading..." status
            if (this.updateHUD) {
                this.updateHUD();
            }
        }
    }

    // Add these new methods to create, update, and destroy the reload bar
    createReloadBar() {
        // Destroy existing reload bar if it exists
        this.destroyReloadBar();
        
        const barWidth = 80 * window.gameScale;
        const barHeight = 10 * window.gameScale;
        const padding = 2 * window.gameScale;
        const HUD_DEPTH = 3500;
        
        // Position near the player
        const barY = this.player.sprite.y - 60 * window.gameScale;
        
        // Create background bar
        this.reloadBarBg = this.add.rectangle(
            this.player.sprite.x,
            barY,
            barWidth + padding * 2,
            barHeight + padding * 2,
            0x000000, 0.7
        ).setDepth(HUD_DEPTH);
        
        // Create fill bar
        this.reloadBarFill = this.add.rectangle(
            this.player.sprite.x - barWidth/2,
            barY,
            0, // Start with 0 width
            barHeight,
            0x00ff00, 0.9
        ).setOrigin(0, 0.5).setDepth(HUD_DEPTH + 1);
        
        // Create text
        this.reloadBarText = this.add.text(
            this.player.sprite.x,
            barY - barHeight - 5 * window.gameScale,
            'RELOADING',
            {
                font: `${Math.round(18 * window.gameScale)}px Arial`,
                fill: '#ffffff',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5, 1).setDepth(HUD_DEPTH + 2);
    }

    updateReloadBar(progress) {
        if (!this.reloadBarFill || !this.reloadBarBg) return;
        
        const barWidth = 80 * window.gameScale;
        const fillWidth = Math.min(barWidth * progress, barWidth);
        
        // Update bar position to follow player
        this.reloadBarBg.x = this.player.sprite.x;
        this.reloadBarBg.y = this.player.sprite.y - 60 * window.gameScale;
        
        this.reloadBarFill.x = this.player.sprite.x - barWidth/2;
        this.reloadBarFill.y = this.player.sprite.y - 60 * window.gameScale;
        this.reloadBarFill.width = fillWidth;
        
        // Update text position
        if (this.reloadBarText) {
            this.reloadBarText.x = this.player.sprite.x;
            this.reloadBarText.y = this.player.sprite.y - 60 * window.gameScale - 5 * window.gameScale;
        }
        
        // Change color based on progress
        if (progress < 0.3) {
            this.reloadBarFill.fillColor = 0xff0000; // Red
        } else if (progress < 0.7) {
            this.reloadBarFill.fillColor = 0xffff00; // Yellow
        } else {
            this.reloadBarFill.fillColor = 0x00ff00; // Green
        }
    }

    destroyReloadBar() {
        if (this.reloadBarBg) {
            this.reloadBarBg.destroy();
            this.reloadBarBg = null;
        }
        
        if (this.reloadBarFill) {
            this.reloadBarFill.destroy();
            this.reloadBarFill = null;
        }
        
        if (this.reloadBarText) {
            this.reloadBarText.destroy();
            this.reloadBarText = null;
        }
        
        if (this.reloadTween) {
            this.reloadTween.stop();
            this.reloadTween = null;
        }
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
                    // Scale the coin size according to gameScale
                    const coinSize = 64 * window.gameScale;
                    const coin = this.createFloatingItem(enemySprite.x, enemySprite.y, 'item_coin', 'coin', coinSize);
                }
            }

            this.showDamageNumber(enemySprite.x, enemySprite.y, dmg);
            enemyObj.takeDamage(dmg, { x: impactVec.x, y: impactVec.y, duration: 100 });
            
            bullet.setActive(false);
            bullet.setVisible(false);
            bullet.body.enable = false;
        }
    }    handlePlayerEnemyCollision(playerSprite, enemySprite) {
        let enemyObj = enemySprite.enemyRef;
        if (enemyObj && enemyObj.alive) {
            // Scale knockback distance according to gameScale
            const knockbackDistance = 60 * window.gameScale;
            const knockbackVec = new Phaser.Math.Vector2(
                enemySprite.x - playerSprite.x,
                enemySprite.y - playerSprite.y
            ).normalize().scale(knockbackDistance);            
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
        enemy.sprite.setAlpha(1);
        
        // Set player reference after a frame
        this.time.delayedCall(0, () => {
            enemy.playerRef = this.player.sprite;
            this.player.sprite.playerRef = this.player;
        });
    }    showDamageNumber(x, y, amount) {
        // Scale text size and positioning based on game scale
        const fontSize = Math.round(20 * window.gameScale);
        const floatDistance = 40 * window.gameScale;
        const floatAnimation = 32 * window.gameScale;
        const strokeThickness = Math.max(1, Math.round(3 * window.gameScale));
        
        const text = this.add.text(x, y - floatDistance, `-${amount}`, {
            font: `${fontSize}px Arial`,
            fill: '#ffffff',
            stroke: '#000',
            strokeThickness: strokeThickness,
            fontStyle: 'bold'
        }).setOrigin(0.5, 1).setDepth(1500);

        this.tweens.add({
            targets: text,
            y: text.y - floatAnimation,
            alpha: 0,
            duration: 600,
            ease: 'Cubic.Out',
            onComplete: () => text.destroy()
        });
    }    showPickupText(x, y, message, color) {
        // Scale text size and positioning based on game scale
        const fontSize = Math.round(32 * window.gameScale);
        const floatDistance = 60 * window.gameScale;
        const floatAnimation = 40 * window.gameScale;
        const strokeThickness = Math.max(1, Math.round(3 * window.gameScale));
        
        const text = this.add.text(x, y - floatDistance, message, {
            font: `${fontSize}px Arial`,
            fill: color,
            stroke: '#000',
            strokeThickness: strokeThickness,
            fontStyle: 'bold'
        }).setOrigin(0.5, 1).setDepth(2000);

        this.tweens.add({
            targets: text,
            y: text.y - floatAnimation,
            alpha: 0,
            duration: 2500,
            ease: 'Cubic.Out',
            onComplete: () => text.destroy()
        });
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
        // Apply gameScale to item size
        const scaledSize = size * window.gameScale;
        item.setDisplaySize(scaledSize, scaledSize);
        this.itemGroup.add(item);
        this.children.bringToTop(item);
        
        // Set depth to be in the game objects/items range (100-499)
        item.setDepth(200);
        
        this.tweens.add({
            targets: item,
            y: item.y - (10 * window.gameScale), // Scale bob height by gameScale
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
