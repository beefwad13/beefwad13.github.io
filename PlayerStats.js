class PlayerStats {
    constructor() {
        this.reset();
    }    reset() {
        this.kills = 0;
        this.timeElapsed = 0;
        this.lastWave = 0;
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
    }    getExperienceToNextLevel(level) {
        if (level === 1) return 100;
        return Math.floor((level - 1) * 100 * 1.25);
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
