class CoinStore extends Phaser.Scene {
    constructor() {
        super({ key: 'CoinStore' });
        
        // Define upgrades
        this.upgrades = {
            health: {
                name: 'Max Health',
                icon: 'item_medkit',
                basePrice: 10,
                priceIncrease: 10,
                maxLevel: 10,
                bonus: 5,
                description: '+5 Max Health'
            },
            armor: {
                name: 'Max Armor',
                icon: 'item_armor',
                basePrice: 10,
                priceIncrease: 10,
                maxLevel: 5,
                bonus: 5,
                description: '+5 Max Armor'
            },
            stamina: {
                name: 'Max Stamina',
                icon: 'icon_stamina',
                basePrice: 10,
                priceIncrease: 10,
                maxLevel: 5,
                bonus: 5,
                description: '+5 Max Stamina'
            },
            speed: {
                name: 'Move Speed',
                icon: 'icon_speed',
                basePrice: 10,
                priceIncrease: 10,
                maxLevel: 5,
                bonus: 5,
                description: '+5% Move Speed'
            },
            criticalHit: {
                name: 'Critical Hit',
                icon: 'icon_criticalhit',
                basePrice: 25,
                priceIncrease: 25,
                maxLevel: 5,
                bonus: 1,
                description: '+1% Critical Hit Chance'
            }
        };
    }

    preload() {
        // Load upgrade icons
        this.load.image('item_medkit', 'assets/sprites/item_medkit.png');
        this.load.image('item_armor', 'assets/sprites/item_armor.png');
        this.load.image('icon_stamina', 'assets/sprites/icon_stamina.png');
        this.load.image('icon_speed', 'assets/sprites/icon_speed.png');
        this.load.image('icon_criticalhit', 'assets/sprites/icon_criticalhit.png');
    }

    create() {
        // Reset cursor to default
        this.input.setDefaultCursor('default');
        
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        // Create the Store title
        this.add.text(centerX, 80, 'Store', {
            font: '48px Arial',
            fill: '#ffffff',
            backgroundColor: '#222222',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        // Get total coins
        this.totalCoins = parseInt(localStorage.getItem('totalCoins')) || 0;
        
        // Display total coins
        this.coinsText = this.add.text(centerX, 160, `Your Coins: ${this.totalCoins}`, {
            font: '32px Arial',
            fill: '#ffdd00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Create upgrade display
        this.createUpgradeDisplay();        // Create Back to Main Menu button in top left
        const mainMenuButton = this.add.text(20, 20, '← Back', {
            font: '24px Arial',
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 15, y: 8 }
        })
        .setOrigin(0, 0)
        .setInteractive({ useHandCursor: true });

        // Add hover effects
        mainMenuButton.on('pointerover', () => {
            mainMenuButton.setStyle({ fill: '#ffff00' });
        });

        mainMenuButton.on('pointerout', () => {
            mainMenuButton.setStyle({ fill: '#ffffff' });
        });

        // Add click handler
        mainMenuButton.on('pointerdown', () => {
            this.scene.start('MainMenu');
        });
    }

    createUpgradeDisplay() {
        const startY = 220;
        const spacing = 140;
        let index = 0;

        for (const [key, upgrade] of Object.entries(this.upgrades)) {
            const y = startY + (index * spacing);
            
            // Get current level of upgrade
            const currentLevel = parseInt(localStorage.getItem(`upgrade_${key}`)) || 0;
            
            // Create upgrade container
            const container = this.add.container(400, y);

            // Add icon
            const icon = this.add.image(0, 0, upgrade.icon).setScale(0.5);
            container.add(icon);

            // Add title and description
            const title = this.add.text(70, -25, upgrade.name, {
                font: '24px Arial',
                fill: '#ffffff'
            });
            container.add(title);

            const description = this.add.text(70, 0, `${upgrade.description} (Level ${currentLevel}/${upgrade.maxLevel})`, {
                font: '18px Arial',
                fill: '#aaaaaa'
            });
            container.add(description);

            // Calculate price for next level
            const price = upgrade.basePrice + (currentLevel * upgrade.priceIncrease);
            
            // Create purchase button
            const buttonColor = currentLevel >= upgrade.maxLevel ? '#666666' : 
                              this.totalCoins >= price ? '#4CAF50' : '#ff0000';
            
            const buttonText = currentLevel >= upgrade.maxLevel ? 'MAXED' :
                             `Purchase (${price} coins)`;

            const purchaseButton = this.add.text(70, 25, buttonText, {
                font: '20px Arial',
                fill: '#ffffff',
                backgroundColor: buttonColor,
                padding: { x: 15, y: 8 }
            });

            // Only make button interactive if not maxed and can afford
            if (currentLevel < upgrade.maxLevel) {
                purchaseButton.setInteractive({ useHandCursor: true });
                
                purchaseButton.on('pointerdown', () => {
                    this.purchaseUpgrade(key, price, currentLevel, description, purchaseButton);
                });
            }

            container.add(purchaseButton);
            index++;
        }
    }

    purchaseUpgrade(upgradeKey, price, currentLevel, descriptionText, button) {
        if (this.totalCoins >= price && currentLevel < this.upgrades[upgradeKey].maxLevel) {
            // Deduct coins
            this.totalCoins -= price;
            localStorage.setItem('totalCoins', this.totalCoins);
            
            // Increment upgrade level
            const newLevel = currentLevel + 1;
            localStorage.setItem(`upgrade_${upgradeKey}`, newLevel);
            
            // Update coins display
            this.coinsText.setText(`Your Coins: ${this.totalCoins}`);
            
            // Update description with new level
            descriptionText.setText(`${this.upgrades[upgradeKey].description} (Level ${newLevel}/${this.upgrades[upgradeKey].maxLevel})`);
            
            // Update button
            const nextPrice = this.upgrades[upgradeKey].basePrice + (newLevel * this.upgrades[upgradeKey].priceIncrease);
            
            if (newLevel >= this.upgrades[upgradeKey].maxLevel) {
                button.setText('MAXED');
                button.setBackgroundColor('#666666');
                button.removeInteractive();
            } else {
                button.setText(`Purchase (${nextPrice} coins)`);
                button.setBackgroundColor(this.totalCoins >= nextPrice ? '#4CAF50' : '#ff0000');
            }
        }
    }
}
