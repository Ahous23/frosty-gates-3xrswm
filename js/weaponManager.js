export class WeaponManager {
  constructor(game) {
    this.game = game;
    this.weapons = {};
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
      
      this.weapons[weaponId] = data;
      return data;
    } catch (error) {
      console.error(`Failed to load weapon ${weaponId}:`, error);
      return null;
    }
  }

  getWeapon(weaponId) {
    if (this.weapons[weaponId]) {
      return { ...this.weapons[weaponId] };
    }
    
    console.warn(`Weapon ${weaponId} not found in loaded weapons`);
    return null;
  }

  // Get available weapons that meet strength requirements
  getAvailableWeapons(playerStats) {
    const strength = playerStats.attack || 0;
    return Object.values(this.weapons).filter(weapon => 
      !weapon.strengthRequirement || strength >= weapon.strengthRequirement
    );
  }
}