// Mobile Controls class for handling virtual joysticks and mobile controls
class MobileControls {
    constructor(scene) {
        this.scene = scene;
        this.movementJoystick = null;
        this.shootingJoystick = null;
        this.dodgeButton = null;
        this.joystickSize = 150;
        this.moveThumbSize = 75;
        this.baseAlpha = 0.5;
        this.activeAlpha = 0.8;
        
        // Movement values
        this.moveJoyX = 0;
        this.moveJoyY = 0;
        
        // Shooting values
        this.shootJoyX = 0;
        this.shootJoyY = 0;
        this.isShooting = false;
        this.justStartedShooting = false;
        this.wasShootingLastFrame = false;
        
        // Create HUD container
        const HUD_DEPTH = 4000; // Above other UI elements
        this.container = scene.add.container(0, 0).setDepth(HUD_DEPTH).setScrollFactor(0);
    }
    
    create() {
        const gameWidth = this.scene.cameras.main.width;
        const gameHeight = this.scene.cameras.main.height;
        
        // Create movement joystick (bottom left)
        this.createMovementJoystick(20 + this.joystickSize/2, gameHeight - 20 - this.joystickSize/2);
        
        // Create shooting joystick (bottom right)
        this.createShootingJoystick(gameWidth - 20 - this.joystickSize/2, gameHeight - 20 - this.joystickSize/2);
        
        // Create buttons (dodge and reload)
        this.createButtons();
        
        // Global pointermove handler
        this.scene.input.on('pointermove', (pointer) => {
            // Update movement joystick if this is the pointer controlling it
            if (this.movePointerId === pointer.id) {
                this.updateMovementJoystick(pointer);
            }
            
            // Update shooting joystick if this is the pointer controlling it
            if (this.shootPointerId === pointer.id) {
                this.updateShootingJoystick(pointer);
            }
        });
    }
    
    createMovementJoystick(x, y) {
        // Create movement base
        this.movementBase = this.scene.add.circle(x, y, this.joystickSize/2, 0x888888, this.baseAlpha);
        this.movementBase.setScrollFactor(0);
        this.movementBase.setInteractive();
        
        // Create movement thumb
        this.movementThumb = this.scene.add.circle(x, y, this.moveThumbSize/2, 0x0088ff, this.baseAlpha);
        this.movementThumb.setScrollFactor(0);
        
        // Add to container
        this.container.add(this.movementBase);
        this.container.add(this.movementThumb);
        
        // Track the pointer ID for this joystick
        this.movePointerId = null;
        
        // Setup pointer down interaction
        this.movementBase.on('pointerdown', (pointer) => {
            this.movePointerId = pointer.id;
            this.movementBase.setAlpha(this.activeAlpha);
            this.movementThumb.setAlpha(this.activeAlpha);
            this.updateMovementJoystick(pointer);
        });
        
        // Setup pointer up interaction
        this.scene.input.on('pointerup', (pointer) => {
            if (pointer.id === this.movePointerId) {
                this.movementThumb.x = this.movementBase.x;
                this.movementThumb.y = this.movementBase.y;
                this.movementBase.setAlpha(this.baseAlpha);
                this.movementThumb.setAlpha(this.baseAlpha);
                this.moveJoyX = 0;
                this.moveJoyY = 0;
                this.movePointerId = null;
            }
        });
    }
    
    updateMovementJoystick(pointer) {
        const distance = Phaser.Math.Distance.Between(
            this.movementBase.x, this.movementBase.y,
            pointer.x, pointer.y
        );
        
        const maxDistance = this.joystickSize / 2;
        
        if (distance <= maxDistance) {
            this.movementThumb.x = pointer.x;
            this.movementThumb.y = pointer.y;
        } else {
            const angle = Phaser.Math.Angle.Between(
                this.movementBase.x, this.movementBase.y, 
                pointer.x, pointer.y
            );
            
            // Calculate thumb position at edge of joystick
            this.movementThumb.x = this.movementBase.x + maxDistance * Math.cos(angle);
            this.movementThumb.y = this.movementBase.y + maxDistance * Math.sin(angle);
        }
        
        // Normalize joystick values to -1 to 1
        this.moveJoyX = (this.movementThumb.x - this.movementBase.x) / maxDistance;
        this.moveJoyY = (this.movementThumb.y - this.movementBase.y) / maxDistance;
    }
    
    createShootingJoystick(x, y) {
        // Create shooting base
        this.shootingBase = this.scene.add.circle(x, y, this.joystickSize/2, 0x888888, this.baseAlpha);
        this.shootingBase.setScrollFactor(0);
        this.shootingBase.setInteractive();
        
        // Create shooting thumb
        this.shootingThumb = this.scene.add.circle(x, y, this.moveThumbSize/2, 0xff3333, this.baseAlpha);
        this.shootingThumb.setScrollFactor(0);
        
        // Add to container
        this.container.add(this.shootingBase);
        this.container.add(this.shootingThumb);
        
        // Track the pointer ID for this joystick
        this.shootPointerId = null;
        
        // Setup pointer down interaction
        this.shootingBase.on('pointerdown', (pointer) => {
            this.shootPointerId = pointer.id;
            this.isShooting = true;
            this.shootingBase.setAlpha(this.activeAlpha);
            this.shootingThumb.setAlpha(this.activeAlpha);
            this.updateShootingJoystick(pointer);
        });
        
        // Setup pointer up interaction
        this.scene.input.on('pointerup', (pointer) => {
            if (pointer.id === this.shootPointerId) {
                this.shootingThumb.x = this.shootingBase.x;
                this.shootingThumb.y = this.shootingBase.y;
                this.shootingBase.setAlpha(this.baseAlpha);
                this.shootingThumb.setAlpha(this.baseAlpha);
                this.shootJoyX = 0;
                this.shootJoyY = 0;
                this.isShooting = false;
                this.shootPointerId = null;
            }
        });
    }
    
    updateShootingJoystick(pointer) {
        const distance = Phaser.Math.Distance.Between(
            this.shootingBase.x, this.shootingBase.y,
            pointer.x, pointer.y
        );
        
        const maxDistance = this.joystickSize / 2;
        
        if (distance <= maxDistance) {
            this.shootingThumb.x = pointer.x;
            this.shootingThumb.y = pointer.y;
        } else {
            const angle = Phaser.Math.Angle.Between(
                this.shootingBase.x, this.shootingBase.y, 
                pointer.x, pointer.y
            );
            
            // Calculate thumb position at edge of joystick
            this.shootingThumb.x = this.shootingBase.x + maxDistance * Math.cos(angle);
            this.shootingThumb.y = this.shootingBase.y + maxDistance * Math.sin(angle);
        }
        
        // Normalize joystick values to -1 to 1
        this.shootJoyX = (this.shootingThumb.x - this.shootingBase.x) / maxDistance;
        this.shootJoyY = (this.shootingThumb.y - this.shootingBase.y) / maxDistance;
    }
    
    createButtons() {
        const HUD_DEPTH = 4000; // Higher depth to ensure buttons appear above game elements
        const gameWidth = this.scene.cameras.main.width;
        const gameHeight = this.scene.cameras.main.height;
        
        // Create dodge button
        this.dodgeButton = this.scene.add.circle(
            gameWidth - 60,
            gameHeight - 250, 
            30,
            0x3366ff, 0.6
        )
        .setScrollFactor(0)
        .setDepth(HUD_DEPTH)
        .setInteractive();
        
        // Add dodge text/icon
        this.dodgeText = this.scene.add.text(
            this.dodgeButton.x, 
            this.dodgeButton.y, 
            'DODGE', 
            { 
                font: '14px Arial',
                fill: '#ffffff' 
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(HUD_DEPTH + 1);
        
        // Create reload button
        this.reloadButton = this.scene.add.circle(
            gameWidth - 250, // Position to the left of dodge button
            gameHeight - 50,
            30,
            0x33cc33, 0.6
        )
        .setScrollFactor(0)
        .setDepth(HUD_DEPTH)
        .setInteractive();
        
        // Add reload text/icon
        this.reloadText = this.scene.add.text(
            this.reloadButton.x,
            this.reloadButton.y,
            'RELOAD',
            {
                font: '14px Arial',
                fill: '#ffffff'
            }
        )
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(HUD_DEPTH + 1);
        
        // Add the buttons to the container for visibility management
        this.container.add(this.dodgeButton);
        this.container.add(this.dodgeText);
        this.container.add(this.reloadButton);
        this.container.add(this.reloadText);
        
        // Add dodge button event handler
        this.dodgeButton.on('pointerdown', () => {
            this.dodgeButton.setAlpha(this.activeAlpha);
            this.dodgeText.setAlpha(this.activeAlpha);
            
            if (this.scene.player && !this.scene.player.isDodging) {
                this.dodgeButtonPressed();
            }
        });
        
        this.dodgeButton.on('pointerup', () => {
            this.dodgeButton.setAlpha(this.baseAlpha);
            this.dodgeText.setAlpha(this.baseAlpha);
        });
        
        this.dodgeButton.on('pointerout', () => {
            this.dodgeButton.setAlpha(this.baseAlpha);
            this.dodgeText.setAlpha(this.baseAlpha);
        });
        
        // Add reload button event handlers
        this.reloadButton.on('pointerdown', () => {
            this.reloadButton.setAlpha(this.activeAlpha);
            this.reloadText.setAlpha(this.activeAlpha);
            
            // Trigger weapon reload in the main scene
            if (this.scene.currentWeapon && !this.scene.currentWeapon.reloading) {
                this.scene.reloadWeapon();
            }
        });
        
        this.reloadButton.on('pointerup', () => {
            this.reloadButton.setAlpha(this.baseAlpha);
            this.reloadText.setAlpha(this.baseAlpha);
        });
        
        this.reloadButton.on('pointerout', () => {
            this.reloadButton.setAlpha(this.baseAlpha);
            this.reloadText.setAlpha(this.baseAlpha);
        });
        
        // Make buttons responsive to window resize
        this.scene.scale.on('resize', (gameSize) => {
            const newWidth = gameSize.width;
            const newHeight = gameSize.height;
            
            // Update dodge button position
            this.dodgeButton.x = newWidth - 60;
            this.dodgeButton.y = newHeight - 150;
            this.dodgeText.x = this.dodgeButton.x;
            this.dodgeText.y = this.dodgeButton.y;
            
            // Update reload button position
            this.reloadButton.x = newWidth - 140;
            this.reloadButton.y = newHeight - 150;
            this.reloadText.x = this.reloadButton.x;
            this.reloadText.y = this.reloadButton.y;
        });
    }
    
    dodgeButtonPressed() {
        const player = this.scene.player;
        
        if (player.isDodging) return;
        
        const now = this.scene.time.now;
        if (now - player.lastDodgeTime < player.dodgeCooldown) return;
        if (player.stats.stamina < 40) return;
        
        // Use move joystick direction for dodge direction if available,
        // otherwise use the shooting joystick direction
        let vx = this.moveJoyX !== 0 ? this.moveJoyX : this.shootJoyX;
        let vy = this.moveJoyY !== 0 ? this.moveJoyY : this.shootJoyY;
        
        if (vx === 0 && vy === 0) return;
        
        player.isDodging = true;
        player.lastDodgeTime = now;
        player.setStamina(player.stats.stamina - 40);
        
        const startX = player.sprite.x;
        const startY = player.sprite.y;
        const targetX = Phaser.Math.Clamp(startX + vx * player.dodgeDistance, 20, this.scene.physics.world.bounds.width - 20);
        const targetY = Phaser.Math.Clamp(startY + vy * player.dodgeDistance, 20, this.scene.physics.world.bounds.height - 20);
        
        this.scene.tweens.add({
            targets: player.sprite,
            x: targetX,
            y: targetY,
            duration: player.dodgeDuration,
            ease: 'Cubic.Out',
            onComplete: () => {
                player.isDodging = false;
            }
        });
    }
    
    update() {
        // Any per-frame updates can go here

        // Track when shooting has just started
        this.justStartedShooting = this.isShooting && !this.wasShootingLastFrame;
        this.wasShootingLastFrame = this.isShooting;
    }
    
    hide() {
        this.container.setVisible(false);
    }
    
    show() {
        this.container.setVisible(true);
    }
}

if (typeof module !== 'undefined') {
    module.exports = MobileControls;
}
