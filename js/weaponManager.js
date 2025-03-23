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
      const response = await fetch('/weapons/index.json');
      if (!response.ok) throw new Error(`Failed to fetch weapon index: ${response.status}`);
      const weaponList = await response.json();
      
      if (Array.isArray(weaponList.weapons)) {
        await Promise.all(weaponList.weapons.map(weaponId => this.loadWeapon(weaponId)));
      }
    } catch (error) {
      console.error('Failed to load weapon index:', error);
    }
  }

  async loadWeapon(weaponId) {
    try {
      const response = await fetch(`/weapons/${weaponId}.json`);
      if (!response.ok) throw new Error(`Failed to fetch weapon data: ${response.status}`);
      const data = await response.json();
      
      if (!data.id) {
        data.id = weaponId;
      }
      
      this.weapons.push(data);
      return data;
    } catch (error) {
      console.error(`Failed to load weapon ${weaponId}:`, error);
      return null;
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