// LootSystem.js - Handles enemy loot drops
class LootSystem {
    constructor() {
        // Loot tables for different enemy types
        this.lootTables = {
            demon: [
                { item: 'medkit', chance: 0.04 },
                { item: 'armor_shard', chance: 0.40 },
                { item: 'armor', chance: 0.01 },
                { item: null, chance: 0.55 } // Nothing drops
            ]
        };
    }

    // Roll for loot based on enemy type
    rollForLoot(enemyType) {
        const table = this.lootTables[enemyType];
        if (!table) return null;

        const roll = Math.random();
        let cumulativeChance = 0;

        for (const entry of table) {
            cumulativeChance += entry.chance;
            if (roll <= cumulativeChance) {
                return entry.item;
            }
        }

        return null; // Fallback in case probabilities don't add up to 1
    }
}

// Create a global instance
if (typeof window !== 'undefined') {
    window.lootSystem = new LootSystem();
}
