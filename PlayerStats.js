class PlayerStats {
    constructor() {
        this.reset();
        // Load total coins from localStorage
        this.totalCoins = parseInt(localStorage.getItem('totalCoins')) || 0;
    }    reset() {
        this.kills = 0;
        this.timeElapsed = 0;
        this.lastWave = 0;
        this.sessionCoins = 0; // Coins earned in current session
    }    getTotalXPForLevel(level) {
        if (level <= 1) return 0;
        let total = 0;
        for (let i = 1; i < level; i++) {
            if (i === 1) {
                total += 100; // Level 1 needs exactly 100 XP
            } else {
                total += Math.floor((i - 1) * 100 * 1.25); // Higher levels scale with previous level
            }
        }
        return total;
    }    
    
    getExperienceToNextLevel(level) {
        if (level === 1) return 100;
        return Math.floor((level - 1) * 25 + 100);
    }

    getTotalXPNeeded(level) {
        return this.getTotalXPForLevel(level) + this.getExperienceToNextLevel(level);
    }

    incrementKills() {
        this.kills++;
    }

    updateTime(time) {
        this.timeElapsed = time;
    }

    updateWave(wave) {
        this.lastWave = wave;
    }

    addCoins(amount) {
        this.sessionCoins += amount;
        this.totalCoins += amount;
        // Save to localStorage
        localStorage.setItem('totalCoins', this.totalCoins.toString());
    }

    // Format time from milliseconds to mm:ss
    getFormattedTime() {
        const minutes = Math.floor(this.timeElapsed / 60000);
        const seconds = Math.floor((this.timeElapsed % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Create a global instance that can be accessed across scenes
if (typeof window !== 'undefined') {
    window.playerStats = new PlayerStats();
}
