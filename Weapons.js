// Weapon system for Vampire Survivors clone
window.WEAPONS = [
    {
        name: 'Pistol',
        cooldown: 600,
        bulletsPerShot: 1,
        spread: 0,
        color: 0x00ff00,
        rateOfFire: 'semiauto',
        magazineSize: 10,
        ammo: 10,
        reloading: false,
        shootSound: 'pistol_shoot',
        reloadSound: 'generic_reload',
        reloadTime: 1000, // 1 second in milliseconds
        damage: 1,
        sprite: 'item_pistol',
        unlocked: true // Player starts with pistol
    },
    {
        name: 'Shotgun',
        cooldown: 800,
        bulletsPerShot: 3,
        spread: 20, // degrees
        color: 0xffcc00,
        rateOfFire: 'semiauto',
        magazineSize: 5,
        ammo: 5,
        reloading: false,
        shootSound: 'shotgun_shoot',
        reloadSound: 'shotgun_reload',        
        reloadTime: 600, // 600ms per shell reload
        damage: 1,
        sprite: 'item_shotgun',
        unlocked: false
    },
    {
        name: 'Assault Rifle',
        cooldown: 250,
        bulletsPerShot: 1,
        spread: 0,
        color: 0x3399ff,
        rateOfFire: 'fullauto',
        magazineSize: 20,
        ammo: 20,
        reloading: false,
        shootSound: 'assault_rifle_shoot',
        reloadSound: 'generic_reload',        
        reloadTime: 1500, // 1.5 seconds in milliseconds
        damage: 1,
        sprite: 'item_assaultrifle',
        unlocked: false
    }
];
