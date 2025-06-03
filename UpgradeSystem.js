// UpgradeSystem.js - Handles player upgrade options and chances
class UpgradeSystem {
    constructor() {
        // Define upgrade categories with their chances
        this.categories = {
            stats: { weight: 50 },
            weapons: { weight: 50 }
        };

        // Define available upgrades within each category
        this.upgrades = {
            stats: [
                {
                    id: 'health',
                    name: 'Increase Max Health',
                    description: 'Gain +5 max health and heal for 5 points',
                    type: 'stats'
                },
                {
                    id: 'armor',
                    name: 'Increase Armor',
                    description: 'Gain +5 armor protection against enemy attacks',
                    type: 'stats'
                },
                {
                    id: 'stamina',
                    name: 'Increase Max Stamina',
                    description: 'Gain +5 max stamina for more frequent dodge rolls',
                    type: 'stats'
                }
            ],            weapons: [
                // Pistol upgrades
                {
                    id: 'pistol_damage',
                    name: 'Pistol Damage Up',
                    description: 'Increase pistol damage by 1',
                    type: 'weapons',
                    weaponIndex: 0,
                    upgradeType: 'damage',
                    maxValue: 4
                },
                {
                    id: 'pistol_mag_size',
                    name: 'Pistol Extended Mag',
                    description: 'Increase pistol magazine size by 2',
                    type: 'weapons',
                    weaponIndex: 0,
                    upgradeType: 'magazineSize',
                    increment: 2,
                    maxValue: 16
                },
                {
                    id: 'pistol_reload',
                    name: 'Pistol Quick Reload',
                    description: 'Decrease pistol reload time by 100ms',
                    type: 'weapons',
                    weaponIndex: 0,
                    upgradeType: 'reloadTime',
                    increment: -100,
                    maxValue: 700,
                    isReverse: true
                },
                // Shotgun upgrades
                {
                    id: 'shotgun_damage',
                    name: 'Shotgun Damage Up',
                    description: 'Increase shotgun damage by 1',
                    type: 'weapons',
                    weaponIndex: 1,
                    upgradeType: 'damage',
                    maxValue: 3
                },
                {
                    id: 'shotgun_spread',
                    name: 'Shotgun Spread Up',
                    description: 'Increase shotgun pellets by 1',
                    type: 'weapons',
                    weaponIndex: 1,
                    upgradeType: 'bulletsPerShot',
                    increment: 1,
                    maxValue: 6
                },
                {
                    id: 'shotgun_reload',
                    name: 'Shotgun Quick Reload',
                    description: 'Decrease shotgun reload time by 100ms',
                    type: 'weapons',
                    weaponIndex: 1,
                    upgradeType: 'reloadTime',
                    increment: -100,
                    maxValue: 500,
                    isReverse: true
                },
                {
                    id: 'shotgun_mag_size',
                    name: 'Shotgun Extended Mag',
                    description: 'Increase shotgun magazine size by 1',
                    type: 'weapons',
                    weaponIndex: 1,
                    upgradeType: 'magazineSize',
                    increment: 1,
                    maxValue: 8
                },
                // Assault Rifle upgrades
                {
                    id: 'assault_rifle_damage',
                    name: 'Assault Rifle Damage Up',
                    description: 'Increase assault rifle damage by 1',
                    type: 'weapons',
                    weaponIndex: 2,
                    upgradeType: 'damage',
                    maxValue: 3
                },
                {
                    id: 'assault_rifle_reload',
                    name: 'Assault Rifle Quick Reload',
                    description: 'Decrease assault rifle reload time by 100ms',
                    type: 'weapons',
                    weaponIndex: 2,
                    upgradeType: 'reloadTime',
                    increment: -100,
                    maxValue: 1200,
                    isReverse: true
                },
                {
                    id: 'assault_rifle_mag_size',
                    name: 'Assault Rifle Extended Mag',
                    description: 'Increase assault rifle magazine size by 10',
                    type: 'weapons',
                    weaponIndex: 2,
                    upgradeType: 'magazineSize',
                    increment: 10,
                    maxValue: 50
                },
                {
                    id: 'assault_rifle_rate',
                    name: 'Assault Rifle Rate Up',
                    description: 'Decrease firing cooldown by 25ms',
                    type: 'weapons',
                    weaponIndex: 2,
                    upgradeType: 'cooldown',
                    increment: -25,
                    maxValue: 150,
                    isReverse: true
                }
            ]
        };

        // Calculate total weight for category selection
        this.totalWeight = Object.values(this.categories).reduce((sum, cat) => sum + cat.weight, 0);
    }

    // Roll for upgrade category (stats or weapons)
    rollCategory() {
        const roll = Math.random() * this.totalWeight;
        let cumulativeWeight = 0;

        for (const [category, data] of Object.entries(this.categories)) {
            cumulativeWeight += data.weight;
            if (roll <= cumulativeWeight) {
                return category;
            }
        }
        return 'stats'; // Fallback to stats if something goes wrong
    }

    // Get a random upgrade from a specific category
    getRandomUpgrade(category, excludeIds = []) {
        const availableUpgrades = this.upgrades[category].filter(
            upgrade => !excludeIds.includes(upgrade.id)
        );

        if (availableUpgrades.length === 0) {
            // If no upgrades available in this category, try the other category
            const otherCategory = category === 'stats' ? 'weapons' : 'stats';
            return this.getRandomUpgrade(otherCategory, excludeIds);
        }        // For weapon upgrades, only show if weapon is unlocked and not at max value
        if (category === 'weapons') {
            const availableWeaponUpgrades = availableUpgrades.filter(upgrade => {
                const weapon = window.WEAPONS[upgrade.weaponIndex];
                if (!weapon.unlocked) return false;

                // Check if the weapon attribute can still be upgraded
                const currentValue = weapon[upgrade.upgradeType];
                if (upgrade.isReverse) {
                    // For attributes where lower is better (like reload time, cooldown)
                    return currentValue > upgrade.maxValue;
                } else {
                    // For attributes where higher is better (like damage, magazine size)
                    return currentValue < upgrade.maxValue;
                }
            });
            if (availableWeaponUpgrades.length > 0) {
                return availableWeaponUpgrades[Math.floor(Math.random() * availableWeaponUpgrades.length)];
            }
            // If no upgradeable weapons, fall back to stats
            return this.getRandomUpgrade('stats', excludeIds);
        }

        return availableUpgrades[Math.floor(Math.random() * availableUpgrades.length)];
    }

    // Get three random upgrades for the level up screen
    getUpgradeChoices() {
        const choices = [];
        const usedIds = [];

        for (let i = 0; i < 3; i++) {
            const category = this.rollCategory();
            const upgrade = this.getRandomUpgrade(category, usedIds);
            choices.push(upgrade);
            usedIds.push(upgrade.id);
        }

        return choices;
    }
}

// Create a global instance that can be accessed across scenes
if (typeof window !== 'undefined') {
    window.upgradeSystem = new UpgradeSystem();
}
