export class WeaponManager {
  constructor(game) {
    this.game = game;
    this.weapons = [];
    this.initialized = false;
  }

  async initialize() {
    try {
      await this.loadWeapons();
      this.initialized = true;
      return true;
    } catch (error) {
      console.error("Error initializing weapon manager:", error);
      return false;
    }
  }

  async loadWeapons() {
    try {
      const response = await fetch('/weapons/weapons.json');
      if (!response.ok) throw new Error(`Failed to fetch weapon list: ${response.status}`);
      const data = await response.json();

      if (Array.isArray(data.weapons)) {
        this.weapons = data.weapons;
      }
    } catch (error) {
      console.error('Failed to load weapons:', error);
    }
  }

  getWeapon(id) {
    const weapon = this.weapons.find(w => w.id === id);
    if (!weapon && id === 'fists') {
      return { id: 'fists', name: 'Fists', damage: 1 };
    }
    return weapon;
  }

  // Get available weapons that meet strength requirements
  getAvailableWeapons(playerStats) {
    const strength = playerStats.attack || 0;
    return this.weapons.filter(weapon => 
      !weapon.strengthRequirement || strength >= weapon.strengthRequirement
    );
  }
}