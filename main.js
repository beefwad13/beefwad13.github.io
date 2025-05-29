// Dodge settings
let isDodging = false;
let dodgeCooldown = 800; // ms
let dodgeDistance = 180; // pixels
let dodgeDuration = 120; // ms
let lastDodgeTime = -Infinity;
// Global audio volume (0.0 = mute, 1.0 = full volume)
let audioVolume = 0.2;
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
let bulletLifetime = 1000; // ms
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
    const numEnemies = 3;
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
    });

    // HUD creation is now handled by PlayerHUD
    // Now create HUD (after camera)
    // Make sure PlayerHUD is available and updateHUD is always defined
    playerHUD = new PlayerHUD(this, playerStats, WEAPONS, currentWeaponIndexRef);
    updateHUD = function() { playerHUD.updateHUD(); };
    
    // Call global updateWeaponHUD after weaponText is created
    updateHUD();
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
    // Play reload sound
    if (w.reloadSound && this && this.sound) {
        this.sound.play(w.reloadSound, { volume: audioVolume });
    }
    setTimeout(() => {
        w.ammo = w.magazineSize;
        w.reloading = false;
        if (typeof updateHUD === 'function') updateHUD();
    }, 1200); // 1.2s reload time
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
