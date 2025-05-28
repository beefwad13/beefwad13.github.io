// Weapon system for Vampire Survivors clone
window.WEAPONS = [
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
        reloadSound: 'generic_reload',
        damage: 1
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
        reloadSound: 'shotgun_reload',
        damage: 1
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
        reloadSound: 'generic_reload',
        damage: 2
    }
];
