// Dodge settings
let isDodging = false;
let dodgeCooldown = 800; // ms
let dodgeDistance = 180; // pixels
let dodgeDuration = 120; // ms
let lastDodgeTime = -Infinity;
// Global audio volume (0.0 = mute, 1.0 = full volume)
let audioVolume = 0.2;
// Helper function to detect mobile devices
function isMobileDevice() {
    return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
}

// Virtual joystick variables
let leftJoystick = null;
let rightJoystick = null;
let isUsingVirtualControls = false;

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth < 800 ? 800 : (window.innerWidth > 1920 ? 1920 : window.innerWidth),
    height: window.innerHeight < 600 ? 600 : (window.innerHeight > 1080 ? 1080 : window.innerHeight),
    backgroundColor: '#222',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 800,
            height: 600
        },
        max: {
            width: 1920,
            height: 1080
        }
    },    plugins: {
        scene: [
            {
                key: 'rexVirtualJoystick',
                plugin: rexvirtualjoystickplugin,
                mapping: 'vjoy'
            }
        ]
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
        }
    },
    scene: {
        preload,
        create,
        update
    }
};


// Player will be created from Player.js
let player;
let cursors;
let speed = 400;
let mapWidth = 2560;
let mapHeight = 2560;
let bullets;
let bulletSpeed = 600;
let bulletLifetime = 1200; // ms
let lastShotTime = 0;
// shootCooldown removed, now per-weapon

// Import Player class (Player.js must be loaded before main.js in index.html)
// Remove duplicate declaration
let playerStats; // Will point to player.stats

// HUD system
let playerHUD;

// Weapon system is now in Weapons.js
let currentWeaponIndex = 0;
let currentWeapon;

function preload() {
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

    // Item sprites
    this.load.image('item_armor', 'assets/sprites/item_armor.png');
    this.load.image('item_armor_shard', 'assets/sprites/item_armor_shard.png');
    this.load.image('item_medkit', 'assets/sprites/item_medkit.png');

    // Preload player sprite sheet
    this.load.spritesheet('player', 'assets/sprites/player_sprite.png', {
        frameWidth: 104, // 416 / 4 frames = 104px per frame
        frameHeight: 128
    });

    // Preload enemy demon sprite sheet
    this.load.spritesheet('enemy_demon', 'assets/sprites/enemy_demon1.png', {
        frameWidth: 70, // 256/2 frames = 128 per frame
        frameHeight: 128
    });

    // Preload crosshair sprite
    this.load.image('crosshair', 'assets/sprites/player_xhair_cross.png');
}


function create() {
    // --- ITEM SYSTEM ---
    this.itemGroup = this.physics.add.group();    // Helper function to create floating items
    function createFloatingItem(x, y, spriteKey, itemType, size = 64) {
        const item = this.add.sprite(x, y, spriteKey);
        item.setDisplaySize(size, size);
        this.itemGroup.add(item);
        this.children.bringToTop(item);
        
        // Add gentle floating animation
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

    function spawnArmorPickup(x, y) {
        return createFloatingItem.call(this, x, y, 'item_armor', 'armor');
    }

    function spawnArmorShardPickup(x, y) {
        return createFloatingItem.call(this, x, y, 'item_armor_shard', 'armor_shard', 48);
    }

    function spawnMedkitPickup(x, y) {
        return createFloatingItem.call(this, x, y, 'item_medkit', 'medkit');
    }

    // Add to scene for use in other functions
    this.spawnArmorPickup = spawnArmorPickup;
    this.spawnArmorShardPickup = spawnArmorShardPickup;
    this.spawnMedkitPickup = spawnMedkitPickup;

    // --- ENEMY SPAWNER TOGGLE (K key) ---
    let enemySpawningEnabled = false;
    let enemySpawnerEvent = null;
    const SPAWN_RADIUS = 400;
    const SPAWN_MARGIN = 60;

    function spawnEnemiesAroundPlayer(num) {
        if (!window._enemies) return;
        for (let i = 0; i < num; i++) {
            // Spawn at a random angle and distance from player
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const dist = Phaser.Math.Between(SPAWN_RADIUS, SPAWN_RADIUS + SPAWN_MARGIN);
            let ex = player.sprite.x + Math.cos(angle) * dist;
            let ey = player.sprite.y + Math.sin(angle) * dist;
            // Clamp to world bounds
            ex = Phaser.Math.Clamp(ex, 0, mapWidth);
            ey = Phaser.Math.Clamp(ey, 0, mapHeight);
            let enemy = new window.Enemy(player.scene, ex, ey, player.sprite);
            window._enemies.push(enemy);
            player.scene.enemyGroup.add(enemy.sprite);
            player.scene.children.bringToTop(enemy.sprite);
            enemy.sprite.setAlpha(1);
        }
    }

    this.input.keyboard.on('keydown-K', () => {
        enemySpawningEnabled = !enemySpawningEnabled;
        if (enemySpawningEnabled) {
            // Start interval event
            enemySpawnerEvent = this.time.addEvent({
                delay: 1000,
                loop: true,
                callback: () => {
                    const n = Phaser.Math.Between(1, 3);
                    spawnEnemiesAroundPlayer(n);
                }
            });
            // Optional: show a message
            const msg = this.add.text(player.sprite.x, player.sprite.y - 80, 'Enemy Spawning: ON', {
                font: '18px Arial', fill: '#ff6666', fontStyle: 'bold', backgroundColor: '#222', padding: { left: 8, right: 8, top: 4, bottom: 4 }
            }).setOrigin(0.5, 1).setDepth(2000);
            this.tweens.add({ targets: msg, alpha: 0, duration: 1200, onComplete: () => msg.destroy() });
        } else {
            if (enemySpawnerEvent) enemySpawnerEvent.remove(false);
            enemySpawnerEvent = null;
            // Optional: show a message
            const msg = this.add.text(player.sprite.x, player.sprite.y - 80, 'Enemy Spawning: OFF', {
                font: '18px Arial', fill: '#cccccc', fontStyle: 'bold', backgroundColor: '#222', padding: { left: 8, right: 8, top: 4, bottom: 4 }
            }).setOrigin(0.5, 1).setDepth(2000);
            this.tweens.add({ targets: msg, alpha: 0, duration: 1200, onComplete: () => msg.destroy() });
        }
    });
    // Add tooltip text in the top right corner
    const tooltipText = this.add.text(
        this.cameras.main.width - 24, // 24px from right edge
        18, // 18px from top edge
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
    // Keep tooltip in top right on resize
    this.scale.on('resize', (gameSize) => {
        tooltipText.x = gameSize.width - 24;
    });
    // Hide the default mouse cursor and use the crosshair sprite as a custom cursor
    this.input.setDefaultCursor('none');
    // Add crosshair sprite and make it follow the mouse pointer
    const crosshair = this.add.image(0, 0, 'crosshair').setDepth(1000);
    crosshair.setOrigin(0.5, 0.5);
    crosshair.setScale(1);
    crosshair.setScrollFactor(0);
    // Update crosshair position every frame
    this.input.on('pointermove', pointer => {
        crosshair.x = pointer.x;
        crosshair.y = pointer.y;
    });
    // Ensure crosshair is always on top
    this.events.on('postupdate', () => {
        crosshair.depth = 1000;
    });
    // --- BACKGROUND: Draw tiled background FIRST so it is always at the bottom ---
    var tileSize = 64;
    for (let x = 0; x < mapWidth; x += tileSize) {
        for (let y = 0; y < mapHeight; y += tileSize) {
            this.add.rectangle(x + tileSize/2, y + tileSize/2, tileSize, tileSize, (x+y)%128 === 0 ? 0x333333 : 0x444444);
        }
    }

    // --- ENEMY ENGINE: Spawn enemies at the edge of the screen and make them move toward the player ---
    let enemies = [];
    const numEnemies = 10;
    const margin = 40;
    // We'll spawn enemies just outside the camera view, at a random edge
    const cam = this.cameras.main;
    for (let i = 0; i < numEnemies; i++) {
        let edge = Phaser.Math.Between(0, 3); // 0=top, 1=right, 2=bottom, 3=left
        let ex, ey;
        if (edge === 0) { // top (above view)
            ex = Phaser.Math.Between(cam.worldView.left + margin, cam.worldView.right - margin);
            ey = cam.worldView.top - margin;
        } else if (edge === 1) { // right (right of view)
            ex = cam.worldView.right + margin;
            ey = Phaser.Math.Between(cam.worldView.top + margin, cam.worldView.bottom - margin);
        } else if (edge === 2) { // bottom (below view)
            ex = Phaser.Math.Between(cam.worldView.left + margin, cam.worldView.right - margin);
            ey = cam.worldView.bottom + margin;
        } else { // left (left of view)
            ex = cam.worldView.left - margin;
            ey = Phaser.Math.Between(cam.worldView.top + margin, cam.worldView.bottom - margin);
        }
        // Clamp to world bounds just in case
        ex = Phaser.Math.Clamp(ex, 0, mapWidth);
        ey = Phaser.Math.Clamp(ey, 0, mapHeight);
        let enemy = new window.Enemy(this, ex, ey, null); // playerRef set after player is created
        enemies.push(enemy);
        this.children.bringToTop(enemy.sprite);
        enemy.sprite.setAlpha(1);
    }
    // Enable bullet-enemy collision (use a group for enemies for Phaser overlap)
    this.enemyGroup = this.physics.add.group();
    for (let enemy of enemies) {
        this.enemyGroup.add(enemy.sprite);
    }
    // After player is created, set playerRef for all enemies
    // Also, make enemies accessible in update()    
    this.time.delayedCall(0, () => {
        for (let enemy of enemies) {
            enemy.playerRef = player.sprite;
            // Set player instance reference for experience gain
            player.sprite.playerRef = player;
        }
        // Expose enemies globally for update()
        window._enemies = enemies;
    });

    // Wait until bullets group is created before setting up overlap
    this.time.delayedCall(0, () => {
        this.physics.add.overlap(
            bullets,
            this.enemyGroup,
            (bullet, enemySprite) => {
                if (!bullet.active || !enemySprite.visible) return;
                // Damage enemy and deactivate bullet
                let enemyObj = enemySprite.enemyRef;
                if (enemyObj && enemyObj.alive) {
                    // Calculate knockback vector
                    const impactVec = new Phaser.Math.Vector2(enemySprite.x - bullet.x, enemySprite.y - bullet.y).normalize().scale(40);
                    // Determine weapon damage
                    let dmg = 1;
                    if (bullet && bullet.fillColor !== undefined) {
                        // Match bullet color to weapon for damage
                        for (let w of window.WEAPONS) {
                            if (w.color === bullet.fillColor) {
                                dmg = w.damage || 1;
                                break;
                            }
                        }
                    }
                    
                    // Play bullet hit sound - use kill sound if damage will kill enemy
                    const isKillingBlow = enemyObj.health <= dmg;
                    this.sound.play(isKillingBlow ? 'bullet_hit_kill' : 'bullet_hit', { volume: audioVolume });

                    // Show floating damage number
                    const dmgText = this.add.text(enemySprite.x, enemySprite.y - 40, `-${dmg}`,
                        {
                            font: '20px Arial',
                            fill: '#ffffff',
                            stroke: '#000',
                            strokeThickness: 3,
                            fontStyle: 'bold'
                        }
                    ).setOrigin(0.5, 1).setDepth(1500);
                    this.tweens.add({
                        targets: dmgText,
                        y: dmgText.y - 32,
                        alpha: 0,
                        duration: 600,
                        ease: 'Cubic.Out',
                        onComplete: () => dmgText.destroy()
                    });
                    // Pass knockback vector and duration to takeDamage
                    enemyObj.takeDamage(dmg, { x: impactVec.x, y: impactVec.y, duration: 100 });
                    bullet.setActive(false);
                    bullet.setVisible(false);
                    bullet.body.enable = false;
                }
            },
            null,
            this
        );
    });

    // Dodge on Space Bar
    // (Space bar dodge handler removed: handled in Player class)
    
    // Weapon switching
    this.input.keyboard.on('keydown-ONE', () => { selectWeapon(0); });
    this.input.keyboard.on('keydown-TWO', () => { selectWeapon(1); });
    this.input.keyboard.on('keydown-THREE', () => { selectWeapon(2); });

    // Weapon firing logic based on rateOfFire property
    this.input.on('pointerdown', (pointer) => {
        if (pointer.leftButtonDown() && currentWeapon.rateOfFire === 'fullauto') {
            this.autoFire = this.time.addEvent({
                delay: currentWeapon.cooldown,
                callback: () => shootBullet.call(this, pointer),
                callbackScope: this,
                loop: true
            });
        } else if (pointer.leftButtonDown()) {
            shootBullet.call(this, pointer);
        }
    });
    this.input.on('pointerup', (pointer) => {
        if (this.autoFire) {
            this.autoFire.remove(false);
            this.autoFire = null;
        }
    });

    // Create Player instance
    player = new Player(this, mapWidth / 2, mapHeight / 2);
    playerStats = player.stats;

    // Setup virtual joysticks for mobile
    if (isMobileDevice()) {
        isUsingVirtualControls = true;

        // Create left joystick for movement
        leftJoystick = this.vjoy.add({
            x: 150,
            y: this.cameras.main.height - 150,
            radius: 100,
            base: this.add.circle(0, 0, 100, 0x000000, 0.5),
            thumb: this.add.circle(0, 0, 50, 0xcccccc, 0.7),
            dir: '8dir',
            forceMin: 16,
        }).setScrollFactor(0).setDepth(2000);

        // Create right joystick for shooting
        rightJoystick = this.vjoy.add({
            x: this.cameras.main.width - 150,
            y: this.cameras.main.height - 150,
            radius: 100,
            base: this.add.circle(0, 0, 100, 0x000000, 0.5),
            thumb: this.add.circle(0, 0, 50, 0xcccccc, 0.7),
            dir: '8dir',
            forceMin: 16,
        }).setScrollFactor(0).setDepth(2000);

        // Update joystick positions on resize
        this.scale.on('resize', (gameSize) => {
            leftJoystick.setPosition(150, gameSize.height - 150);
            rightJoystick.setPosition(gameSize.width - 150, gameSize.height - 150);
        });

        // Hide mouse cursor on mobile since we're using virtual controls
        this.input.setDefaultCursor('none');
    }
    
    // Spawn test items for pickups testing
    this.spawnArmorPickup(mapWidth / 2 + 250, mapHeight / 2);      // Armor vest
    this.spawnMedkitPickup(mapWidth / 2 + 250, mapHeight / 2 - 100); // Medkit above armor vest
    // Spawn armor shards below armor vest
    for (let i = 0; i < 20; i++) {
        this.spawnArmorShardPickup(
            mapWidth / 2 + 250 + (i % 5) * 30 - 60, // 5 columns
            mapHeight / 2 + 100 + Math.floor(i / 5) * 30 // 4 rows
        );
    }

    // PlayerHUD expects a reference to currentWeaponIndex (object with .value)
    // HUD must be created AFTER camera is set up, or .setScrollFactor(0) won't work
    let currentWeaponIndexRef = { value: currentWeaponIndex };
    // Set currentWeapon from global WEAPONS
    currentWeapon = window.WEAPONS[currentWeaponIndex];
    // Set world bounds
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
    // Camera setup
    this.cameras.main.startFollow(player.sprite, false, 1, 1);
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);

    // Weapon selection and HUD update (define globally, not inside create)
    function selectWeapon(index) {
        currentWeaponIndexRef.value = index;
        currentWeaponIndex = index;
        currentWeapon = window.WEAPONS[currentWeaponIndex];
        updateHUD();
    }

    // WASD controls are now handled in Player class

    // Bullet group (pooling)
    bullets = this.physics.add.group({
        classType: Phaser.GameObjects.Rectangle,
        maxSize: 50,
        runChildUpdate: true
    });    // Setup item pickup collision
    this.physics.add.overlap(
        player.sprite,
        this.itemGroup,
        (playerSprite, item) => {
            if (!item.active) return;
            
            let canPickup = false;
            let handled = true;
            let pickupText = '';
            let textColor = '#ffffff';

            // Check if player can pick up the item based on current stats
            switch (item.itemType) {
                case 'armor':
                    canPickup = player.stats.armor < 100;
                    break;
                case 'armor_shard':
                    canPickup = player.stats.armor < 100;
                    break;
                case 'medkit':
                    canPickup = player.stats.health < player.stats.maxHealth;
                    break;
                default:
                    canPickup = true;
                    break;
            }

            // Only process pickup if the player can use it
            if (canPickup) {
                // Immediately disable collision by marking inactive
                item.active = false;

                // Handle different item types
                switch (item.itemType) {
                    case 'armor':
                        player.setArmor(100);
                        this.sound.play('pickup_sound', { volume: audioVolume });
                        pickupText = 'Full Armor';
                        textColor = '#3399ff'; // Blue for armor
                        break;
                    case 'armor_shard':
                        player.setArmor(Math.min(100, player.stats.armor + 5));
                        this.sound.play('pickup_sound_small', { volume: audioVolume });
                        pickupText = '+5 Armor';
                        textColor = '#3399ff'; // Blue for armor
                        break;
                    case 'medkit':
                        player.setHealth(Math.min(player.stats.maxHealth, player.stats.health + 25));
                        this.sound.play('pickup_sound_small', { volume: audioVolume });
                        pickupText = '+25 Health';
                        textColor = '#ff3333'; // Red for health
                        break;
                    default:
                        handled = false;
                        break;
                }

                // Show floating pickup text
                if (pickupText) {
                    const text = this.add.text(player.sprite.x, player.sprite.y - 60, pickupText, {
                        font: '32px Arial',
                        fill: textColor,
                        stroke: '#000',
                        strokeThickness: 3,
                        fontStyle: 'bold'
                    }).setOrigin(0.5, 1).setDepth(2000);

                    this.tweens.add({
                        targets: text,
                        y: text.y - 40,
                        alpha: 0,
                        duration: 1000,
                        ease: 'Cubic.Out',
                        onComplete: () => text.destroy()
                    });
                }
                
                if (handled) {
                    // Add pickup effect and destroy item
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
        },
        null,
        this
    );

    // HUD creation is now handled by PlayerHUD
    // Now create HUD (after camera)
    // Make sure PlayerHUD is available and updateHUD is always defined
    playerHUD = new PlayerHUD(this, playerStats, WEAPONS, currentWeaponIndexRef);
    updateHUD = function() { playerHUD.updateHUD(); };
    
    // Call global updateWeaponHUD after weaponText is created
    updateHUD();

    // Setup enemy-player collision
    this.time.delayedCall(0, () => {
        this.physics.add.overlap(
            player.sprite,
            this.enemyGroup,
            (playerSprite, enemySprite) => {
                // Only damage the player if the enemy is alive
                let enemyObj = enemySprite.enemyRef;
                if (enemyObj && enemyObj.alive) {                    // Calculate knockback vector away from player
                    const knockbackVec = new Phaser.Math.Vector2(enemySprite.x - playerSprite.x, enemySprite.y - playerSprite.y).normalize().scale(60);                    // Apply knockback to enemy with longer stun duration
                    enemyObj.takeDamage(0, { x: knockbackVec.x, y: knockbackVec.y, duration: 400 });
                      // Deal damage to player (enemies deal 10 damage)
                    // Only play hit sound if damage was actually dealt (not invulnerable)
                    if (!player.isInvulnerable) {
                        this.sound.play('bullet_hit', { volume: audioVolume });
                    }
                    player.takeDamage(10);
                }
            },
            null,
            this
        );
    });
}

// Stat update functions
function setHealth(newHealth) {
    player.setHealth(newHealth);
    if (typeof updateHUD === 'function') updateHUD();
}
function setArmor(newArmor) {
    player.setArmor(newArmor);
    if (typeof updateHUD === 'function') updateHUD();
}
function setStamina(newStamina) {
    player.setStamina(newStamina);
    if (typeof updateHUD === 'function') updateHUD();
}

// (Optional) For testing: decrease health, armor, stamina with keys
// Uncomment to test stat changes
// this.input.keyboard.on('keydown-H', () => setHealth(playerStats.health - 10));
// this.input.keyboard.on('keydown-J', () => setArmor(playerStats.armor - 5));
// this.input.keyboard.on('keydown-K', () => setStamina(playerStats.stamina - 20));

function shootBullet(pointer) {
    const now = this.time.now;

    if (!currentWeapon.lastShotTime) currentWeapon.lastShotTime = 0;
    if (now - currentWeapon.lastShotTime < currentWeapon.cooldown) return;
    if (currentWeapon.magazineSize !== -1) {
        if (currentWeapon.reloading) return;
        // Only require 1 ammo per shot, not per pellet
        if (currentWeapon.ammo < 1) {
            reloadWeapon.call(this, currentWeaponIndex);
            if (typeof updateHUD === 'function') updateHUD();
            return;
        }
        currentWeapon.ammo -= 1;
        if (typeof updateHUD === 'function') updateHUD();
    }
    currentWeapon.lastShotTime = now;
    // Play shoot sound
    if (currentWeapon.shootSound && this.sound) {
        this.sound.play(currentWeapon.shootSound, { volume: audioVolume });
    }
// Reload logic
function reloadWeapon(index) {
    let w = WEAPONS[index];
    if (w.reloading || w.magazineSize === -1) return;
    w.reloading = true;
    if (typeof updateHUD === 'function') updateHUD();
      // Create reload progress bar
    const barWidth = 80;
    const barHeight = 12;
    const barY = 80; // Distance below player sprite (adjusted for 128px tall sprite)
    
    // Background of progress bar
    const reloadBarBg = this.add.rectangle(
        player.sprite.x,
        player.sprite.y + barY,
        barWidth,
        barHeight,
        0x000000,
        0.8
    ).setDepth(999);
    
    // The progress bar itself
    const reloadBar = this.add.rectangle(
        player.sprite.x - barWidth/2,
        player.sprite.y + barY,
        0, // Start at width 0
        barHeight - 2,
        0x00ff00,
        1
    ).setDepth(999);
    reloadBar.setOrigin(0, 0.5); // Set origin to left center for easier width animation

    // Animate the progress bar
    this.tweens.add({
        targets: reloadBar,
        width: barWidth,
        duration: w.reloadTime,
        ease: 'Linear',
        onComplete: () => {
            reloadBarBg.destroy();
            reloadBar.destroy();
        }
    });

    // Update bar position when player moves
    const updateBarPosition = () => {
        if (reloadBarBg && reloadBarBg.active) {
            reloadBarBg.x = player.sprite.x;
            reloadBarBg.y = player.sprite.y + barY;
            reloadBar.x = player.sprite.x - barWidth/2;
            reloadBar.y = player.sprite.y + barY;
        }
    };

    // Add update callback
    const updateEvent = this.events.addListener('postupdate', updateBarPosition);    // Play reload sound(s) and calculate total reload time
    let totalReloadTime = w.reloadTime;
    if (w.name === 'Shotgun') {
        // For shotgun, reload time scales with number of shells needed
        const shellsToReload = w.magazineSize - w.ammo;
        totalReloadTime = w.reloadTime * shellsToReload;
        
        // Play reload sound for each shell
        for (let i = 0; i < shellsToReload; i++) {
            this.time.delayedCall(i * w.reloadTime, () => {
                if (w.reloadSound && this && this.sound) {
                    this.sound.play(w.reloadSound, { volume: audioVolume });
                }
            });
        }
    } else {
        // Other weapons play reload sound once
        if (w.reloadSound && this && this.sound) {
            this.sound.play(w.reloadSound, { volume: audioVolume });
        }
    }

    // Adjust progress bar duration to match total reload time
    this.tweens.killTweensOf(reloadBar);
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

    setTimeout(() => {
        w.ammo = w.magazineSize;
        w.reloading = false;
        this.events.removeListener('postupdate', updateBarPosition);
        if (typeof updateHUD === 'function') updateHUD();
    }, totalReloadTime);
}
    // Manual reload (R key)
    this.input.keyboard.on('keydown-R', () => {
        reloadWeapon.call(this, currentWeaponIndex);
    });

    // Calculate angle from player to mouse (world coordinates)
    const worldPoint = pointer.positionToCamera(this.cameras.main);
    const dx = worldPoint.x - player.sprite.x;
    const dy = worldPoint.y - player.sprite.y;
    const baseAngle = Math.atan2(dy, dx);

    for (let i = 0; i < currentWeapon.bulletsPerShot; i++) {
        let angle = baseAngle;
        if (currentWeapon.spread && currentWeapon.bulletsPerShot > 1) {
            // Spread evenly
            const spreadRad = Phaser.Math.DegToRad(currentWeapon.spread);
            angle = baseAngle - spreadRad/2 + (spreadRad/(currentWeapon.bulletsPerShot-1))*i;
        }
        let bullet = bullets.get();
        if (!bullet) continue; // Pool exhausted
        if (!bullet.body) {
            this.physics.add.existing(bullet);
        }
        bullet.setFillStyle(currentWeapon.color);
        bullet.setSize(12, 12);
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.x = player.sprite.x;
        bullet.y = player.sprite.y;
        bullet.body.enable = true;
        bullet.body.setAllowGravity(false);
        bullet.body.setVelocity(Math.cos(angle) * bulletSpeed, Math.sin(angle) * bulletSpeed);
        bullet.spawnTime = this.time.now;
    }
}

function update(time, delta) {
    // Handle virtual joystick input on mobile
    if (isUsingVirtualControls) {
        // Movement joystick
        if (leftJoystick && leftJoystick.force > 16) {
            // Convert joystick angle to velocity
            const leftVelocity = new Phaser.Math.Vector2();
            leftVelocity.setToPolar(leftJoystick.rotation, speed);
            player.sprite.body.setVelocity(leftVelocity.x, leftVelocity.y);
        } else if (leftJoystick) {
            player.sprite.body.setVelocity(0, 0);
        }

        // Shooting joystick
        if (rightJoystick && rightJoystick.force > 16) {
            // Create a mock pointer position for the shooting direction
            const mockPointer = {
                x: player.sprite.x + Math.cos(rightJoystick.rotation) * 100,
                y: player.sprite.y + Math.sin(rightJoystick.rotation) * 100,
                positionToCamera: function(camera) {
                    return { x: this.x, y: this.y };
                }
            };
            shootBullet.call(this, mockPointer);
        }
    }

    // Update all enemies to move toward the player
    if (window._enemies) {
        for (let enemy of window._enemies) {
            if (enemy && typeof enemy.update === 'function') {
                enemy.update();
            }
        }
    }

    // Player movement and stamina regen handled in Player class
    player.update(delta);

    // Always update HUD every frame
    if (typeof updateHUD === 'function') updateHUD();

    // Bullet lifetime and off-screen removal
    bullets.children.iterate((bullet) => {
        if (!bullet.active) return;
        // Remove if off screen or expired
        if (
            bullet.x < 0 || bullet.x > mapWidth ||
            bullet.y < 0 || bullet.y > mapHeight ||
            (this.time.now - bullet.spawnTime > bulletLifetime)
        ) {
            bullet.setActive(false);
            bullet.setVisible(false);
            bullet.body.setVelocity(0, 0);
            bullet.body.enable = false;
        }
    });
}

const game = new Phaser.Game(config);
