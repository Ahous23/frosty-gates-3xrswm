export class EquipmentManager {
  constructor(game) {
    this.game = game;
    this.equipment = {
      weapon: null,
      shield: null,
      helm: null,
      chest: null,
      legs: null,
      gloves: null
    };
  }

  // Get all equipped items
  getAllEquipment() {
    return this.equipment;
  }

  // Equip an item
  equipItem(item, fromInventory = true, inventoryIndex = null) {
    if (!item) return { success: false, message: "No item to equip." };
    
    let slot = item.slot || null;

    // Determine equipment slot based on item type/category if slot not provided
    if (!slot) {
      if (item.type === "weapon" || item.category === "weapon") {
        slot = "weapon";
      } else if (item.type === "shield" || item.category === "shield") {
        slot = "shield";
      } else if (item.type === "helm" || item.category === "helm") {
        slot = "helm";
      } else if (item.type === "chest" || item.category === "chest" || item.type === "armor" || item.category === "armor") {
        slot = "chest";
      } else if (item.type === "legs" || item.category === "legs") {
        slot = "legs";
      } else if (item.type === "gloves" || item.category === "gloves") {
        slot = "gloves";
      }
    }

    if (!slot || !(slot in this.equipment)) {
      return { success: false, message: `Cannot equip ${item.name}.` };
    }
    
    // Store the current equipped item to return to inventory
    const currentEquipped = this.equipment[slot];
    
    // Equip the new item
    this.equipment[slot] = { ...item, equipped: true, quantity: 1 };
    
    // Handle inventory if this is coming from there
    if (fromInventory && this.game.inventoryManager) {
      if (inventoryIndex !== null && this.game.inventoryManager.items[inventoryIndex]) {
        const invItem = this.game.inventoryManager.items[inventoryIndex];
        invItem.quantity--;
        if (invItem.quantity <= 0) {
          this.game.inventoryManager.items.splice(inventoryIndex, 1);
        }
      } else {
        const itemCopy = { ...item };
        this.game.inventoryManager.removeItem(itemCopy.id, 1);
      }

      if (currentEquipped) {
        const returnItem = { ...currentEquipped, equipped: false, quantity: 1 };
        const targetIndex = inventoryIndex !== null ? inventoryIndex : this.game.inventoryManager.items.length;
        this.game.inventoryManager.items.splice(targetIndex, 0, returnItem);
      }
    } else if (fromInventory) {
      const idx = inventoryIndex !== null ? inventoryIndex : this.game.inventory.findIndex(i => i.id === item.id);
      if (idx !== -1 && this.game.inventory[idx]) {
        if (this.game.inventory[idx].quantity > 1) {
          this.game.inventory[idx].quantity--;
        } else {
          this.game.inventory.splice(idx, 1);
        }
      }

      if (currentEquipped) {
        const returnItem = { ...currentEquipped, equipped: false, quantity: 1 };
        const targetIndex = idx !== -1 ? idx : this.game.inventory.length;
        this.game.inventory.splice(targetIndex, 0, returnItem);
      }
    }
    
    return { 
      success: true, 
      message: `Equipped ${item.name}.`,
      previousItem: currentEquipped
    };
  }

  // Unequip an item
  unequipItem(slot) {
    if (!this.equipment[slot]) {
      return { success: false, message: `Nothing equipped in ${slot} slot.` };
    }
    
    const item = this.equipment[slot];
    this.equipment[slot] = null;
    
    // Add the item back to inventory
    if (this.game.inventoryManager) {
      const returnItem = { ...item, equipped: false };
      this.game.inventoryManager.addItem(returnItem);
    }
    
    return { success: true, message: `Unequipped ${item.name}.` };
  }

  // Get weapon damage value (with stat bonuses)
  getWeaponDamage(includeVariance = true) {
    const attackStat = this.game.playerStats.attack || 0;
    const attackBonus = Math.floor(attackStat / 2);

    const variance = includeVariance
      ? Math.floor((Math.random() - 0.5) * attackBonus)
      : 0;

    if (!this.equipment.weapon) {
      const defaultWeapon = this.game.weaponManager
        ? this.game.weaponManager.getWeapon('fists')
        : { damage: 1 };
      const baseDamage = defaultWeapon.damage;
      return baseDamage + attackBonus + variance;
    }

    const baseDamage = this.equipment.weapon.damage || 0;
    return baseDamage + attackBonus + variance;
  }

  // Get total defense value (with stat bonuses)
  getTotalDefense() {
    let defense = 0;
    
    // Base defense from player stats
    defense += Math.floor((this.game.playerStats.defense || 0) / 2);
    
    const slots = ['shield','helm','chest','legs','gloves'];
    slots.forEach(s => {
      if (this.equipment[s] && this.equipment[s].defense) {
        defense += this.equipment[s].defense;
      }
    });
    
    return defense;
  }

  // Save equipment data
  save() {
    return this.equipment;
  }

  // Load equipment data
  load(equipment) {
    this.equipment = equipment || {
      weapon: null,
      shield: null,
      helm: null,
      chest: null,
      legs: null,
      gloves: null
    };
  }

  getWeapon(id) {
    const weapon = this.weapons.find(w => w.id === id);
    console.log(`Fetching weapon with id: ${id}`);
    if (!weapon && id === 'fists') {
      console.log("Returning default fists weapon.");
      return { id: 'fists', name: 'Fists', damage: 1 }; // Match fists.json
    }
    return weapon;
  }
}