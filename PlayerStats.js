class PlayerStats {
    constructor() {
        this.reset();
    }    reset() {
        this.kills = 0;
        this.timeElapsed = 0;
        this.lastWave = 0;
    }

    getExperienceToNextLevel(level) {
        if(level <= 1) {
            return 100; // Minimum XP for level 1
        }
        return Math.floor((level-1) * 100 * 1.25); // Example formula: 125% of previous level's XP
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
