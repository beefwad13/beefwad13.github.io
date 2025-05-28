// Dodge settings
let isDodging = false;
let dodgeCooldown = 800; // ms
let dodgeDistance = 180; // pixels
let dodgeDuration = 120; // ms
let lastDodgeTime = -Infinity;
// Global audio volume (0.0 = mute, 1.0 = full volume)
let audioVolume = 0.5;
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

// Player stats
let playerStats = {
    health: 100,
    maxHealth: 100,
    armor: 25,
    stamina: 100,
    maxStamina: 100
};

// HUD elements
let healthBarBg, healthBar, armorBarBg, armorBar, armorText, staminaBarBg, staminaBar, weaponText, ammoText;
let updateHUD; // Function to update all HUD elements

// Weapon system
const WEAPONS = [
    {
        name: 'Pistol',
        cooldown: 300,
        bulletsPerShot: 1,
        spread: 0,
        color: 0x00ff00,
        rateOfFire: 'semiauto',
        magazineSize: 10,
        ammo: 10,
        reloading: false,
        shootSound: 'pistol_shoot',
        reloadSound: 'generic_reload'
    },
    {
        name: 'Shotgun',
        cooldown: 700,
        bulletsPerShot: 5,
        spread: 20, // degrees
        color: 0xffcc00,
        rateOfFire: 'semiauto',
        magazineSize: 5,
        ammo: 5,
        reloading: false,
        shootSound: 'shotgun_shoot',
        reloadSound: 'shotgun_reload'
    },
    {
        name: 'Assault Rifle',
        cooldown: 100,
        bulletsPerShot: 1,
        spread: 0,
        color: 0x3399ff,
        rateOfFire: 'fullauto',
        magazineSize: 20,
        ammo: 20,
        reloading: false,
        shootSound: 'assault_rifle_shoot',
        reloadSound: 'generic_reload'
    }
];
let currentWeaponIndex = 0;
let currentWeapon = WEAPONS[currentWeaponIndex];

function preload() {
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
}

function create() {

    // Dodge on Space Bar
    this.input.keyboard.on('keydown-SPACE', () => {
        if (isDodging) return;
        const now = this.time.now;
        if (now - lastDodgeTime < dodgeCooldown) return;

        // Require at least 40 stamina to dodge
        if (playerStats.stamina < 40) return;

        // Determine movement direction
        let vx = 0, vy = 0;
        if (cursors.left.isDown) vx = -1;
        else if (cursors.right.isDown) vx = 1;
        if (cursors.up.isDown) vy = -1;
        else if (cursors.down.isDown) vy = 1;

        // If not moving, dodge in last direction or do nothing
        if (vx === 0 && vy === 0) return;

        // Normalize direction
        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        isDodging = true;
        lastDodgeTime = now;

        // Decrease stamina by 40
        setStamina(playerStats.stamina - 40);

        // Calculate dodge target
        const startX = player.x;
        const startY = player.y;
        const targetX = Phaser.Math.Clamp(startX + vx * dodgeDistance, 0 + 20, mapWidth - 20);
        const targetY = Phaser.Math.Clamp(startY + vy * dodgeDistance, 0 + 20, mapHeight - 20);

        // Tween player to target position
        this.tweens.add({
            targets: player,
            x: targetX,
            y: targetY,
            duration: dodgeDuration,
            ease: 'Cubic.Out',
            onComplete: () => {
                isDodging = false;
            }
        });
    });
    
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

    
    // Unified HUD update function
    updateHUD = function() {
        // Health bar
        if (healthBar && healthBarBg) {
            healthBar.width = 200 * (playerStats.health / playerStats.maxHealth);
            healthBar.fillColor = 0xff0000;
        }
        // Armor bar and text
        if (armorBar && armorBarBg) {
            armorBar.width = 200 * (playerStats.armor / 100); // Assuming max armor is 100 for bar
            armorBar.fillColor = 0x3399ff;
        }
        if (armorText) {
            armorText.setText(`Armor: ${playerStats.armor}`);
        }
        // Stamina bar
        if (staminaBar && staminaBarBg) {
            staminaBar.width = 200 * (playerStats.stamina / playerStats.maxStamina);
        }
        // Weapon and ammo
        if (weaponText) {
            let w = WEAPONS[currentWeaponIndex];
            weaponText.setText(`Weapon: ${w.name}`);
            if (typeof ammoText !== 'undefined') {
                if (w.magazineSize === -1) {
                    ammoText.setText('Ammo: ∞');
                } else if (w.reloading) {
                    ammoText.setText('Reloading...');
                } else {
                    // Visual magazine bar (e.g. [|||||     ])
                    let magBar = '[';
                    for (let i = 0; i < w.magazineSize; i++) {
                        magBar += i < w.ammo ? '|' : ' ';
                    }
                    magBar += ']';
                    ammoText.setText(`Ammo: ${w.ammo} / ${w.magazineSize}  ${magBar}`);
                }
            }
        }
    }

    // Weapon selection and HUD update (define globally, not inside create)
    function selectWeapon(index) {
        currentWeaponIndex = index;
        currentWeapon = WEAPONS[currentWeaponIndex];
        updateHUD();
    }

    // Call global updateWeaponHUD after weaponText is created
    if (typeof updateHUD === 'function') {
        updateHUD();
    }

    // Create tiled background using graphics
    const tileSize = 64;
    for (let x = 0; x < mapWidth; x += tileSize) {
        for (let y = 0; y < mapHeight; y += tileSize) {
            this.add.rectangle(x + tileSize/2, y + tileSize/2, tileSize, tileSize, (x+y)%128 === 0 ? 0x333333 : 0x444444);
        }
    }


    // Create player sprite
    // Place player in the center of the world
    player = this.add.sprite(mapWidth / 2, mapHeight / 2, 'player', 0);
    player.setDisplaySize(104, 128); // match frame size
    this.physics.add.existing(player);
    player.body.setCollideWorldBounds(true);

    // Set world bounds
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    // Camera setup
    // Camera: fixed on player, always centered
    this.cameras.main.startFollow(player, false, 1, 1);
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);

    // WASD controls
    cursors = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // Bullet group (pooling)
    bullets = this.physics.add.group({
        classType: Phaser.GameObjects.Rectangle,
        maxSize: 50,
        runChildUpdate: true
    });



    // --- HUD CREATION BLOCK (MOVED TO END) ---
    // Place all HUD elements after player, camera, and world setup
    var barLeft = 20;
    healthBarBg = this.add.rectangle(barLeft, 30, 204, 24, 0x222222).setScrollFactor(0).setOrigin(0,0.5);
    healthBar = this.add.rectangle(barLeft + 2, 30, 200, 20, 0xff0000).setScrollFactor(0).setOrigin(0,0.5);
    armorBarBg = this.add.rectangle(barLeft, 54, 204, 16, 0x222222).setScrollFactor(0).setOrigin(0,0.5);
    armorBar = this.add.rectangle(barLeft + 2, 54, 200, 12, 0x3399ff).setScrollFactor(0).setOrigin(0,0.5);
    armorText = this.add.text(barLeft + 210, 46, `Armor: ${playerStats.armor}`, { font: '16px Arial', fill: '#66ccff', fontStyle: 'bold' }).setScrollFactor(0);
    staminaBarBg = this.add.rectangle(barLeft, 74, 204, 16, 0x222222).setScrollFactor(0).setOrigin(0,0.5);
    staminaBar = this.add.rectangle(barLeft + 2, 74, 200, 12, 0x33ff66).setScrollFactor(0).setOrigin(0,0.5);
    // Weapon HUD
    var weaponTextY = 100;
    weaponText = this.add.text(barLeft, weaponTextY, `Weapon: ${WEAPONS[currentWeaponIndex].name}`,
        { font: '20px Arial', fill: '#66ccff', fontStyle: 'bold' }).setScrollFactor(0).setOrigin(0, 0);
    ammoText = this.add.text(barLeft, weaponTextY + 28, '', { font: '18px Arial', fill: '#fff', fontFamily: 'monospace' }).setScrollFactor(0).setOrigin(0, 0);
    // --- END HUD CREATION BLOCK ---

}

// Stat update functions
function setHealth(newHealth) {
    playerStats.health = Phaser.Math.Clamp(newHealth, 0, playerStats.maxHealth);
    if (typeof updateHUD === 'function') updateHUD();
}
function setArmor(newArmor) {
    playerStats.armor = Math.max(0, newArmor);
    if (typeof updateHUD === 'function') updateHUD();
}
function setStamina(newStamina) {
    playerStats.stamina = Phaser.Math.Clamp(newStamina, 0, playerStats.maxStamina);
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
    const dx = worldPoint.x - player.x;
    const dy = worldPoint.y - player.y;
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
        bullet.x = player.x;
        bullet.y = player.y;
        bullet.body.enable = true;
        bullet.body.setAllowGravity(false);
        bullet.body.setVelocity(Math.cos(angle) * bulletSpeed, Math.sin(angle) * bulletSpeed);
        bullet.spawnTime = this.time.now;
    }
}

function update(time, delta) {
    // WASD movement (disable normal movement during dodge)
    let vx = 0, vy = 0;
    if (!isDodging) {
        if (cursors.left.isDown) vx = -speed;
        else if (cursors.right.isDown) vx = speed;
        if (cursors.up.isDown) vy = -speed;
        else if (cursors.down.isDown) vy = speed;
        player.body.setVelocity(vx, vy);
        if (vx !== 0 && vy !== 0) {
            player.body.setVelocity(vx * 0.707, vy * 0.707); // Normalize diagonal
        }
    } else {
        player.body.setVelocity(0, 0);
    }

    // Set player sprite frame based on movement direction
    if (vx === 0 && vy === 0) {
        // Idle, default frame (down)
        player.setFrame(0);
    } else if (vy > 0 && Math.abs(vy) >= Math.abs(vx)) {
        // Moving down
        player.setFrame(0);
    } else if (vy < 0 && Math.abs(vy) >= Math.abs(vx)) {
        // Moving up
        player.setFrame(1);
    } else if (vx < 0 && Math.abs(vx) > Math.abs(vy)) {
        // Moving left
        player.setFrame(2);
    } else if (vx > 0 && Math.abs(vx) > Math.abs(vy)) {
        // Moving right
        player.setFrame(3);
    }

    // Example: Regenerate stamina slowly
    if (playerStats.stamina < playerStats.maxStamina) {
        setStamina(playerStats.stamina + 10 * (delta/1000));
    }

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
