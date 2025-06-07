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
  equipItem(item, fromInventory = true) {
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
      // Remove only 1 from inventory
      // Make a copy before removal to avoid modifying the original item
      const itemCopy = { ...item };
      this.game.inventoryManager.removeItem(itemCopy.id, 1);
      
      // Add the previously equipped item back to inventory if it exists
      if (currentEquipped) {
        // Reset equipped state
        const returnItem = { ...currentEquipped, equipped: false };
        this.game.inventoryManager.addItem(returnItem);
      }
    } else if (fromInventory) {
      // Fallback for direct inventory manipulation
      const itemIndex = this.game.inventory.findIndex(i => i.id === item.id);
      if (itemIndex !== -1) {
        // Just reduce quantity by 1 if more than one
        if (this.game.inventory[itemIndex].quantity > 1) {
          this.game.inventory[itemIndex].quantity--;
        } else {
          // Remove the item if it's the last one
          this.game.inventory.splice(itemIndex, 1);
        }
      }
      
      // Add previously equipped item back to inventory
      if (currentEquipped) {
        const returnItem = { ...currentEquipped, equipped: false };
        const existingIndex = this.game.inventory.findIndex(i => i.id === returnItem.id);
        
        if (existingIndex !== -1 && returnItem.stackable !== false) {
          this.game.inventory[existingIndex].quantity++;
        } else {
          this.game.inventory.push({...returnItem, quantity: 1});
        }
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