export class EquipmentManager {
  constructor(game) {
    this.game = game;
    this.equipment = {
      weapon: null,
      armor: null,
      accessory: null
    };
  }

  // Get all equipped items
  getAllEquipment() {
    return this.equipment;
  }

  // Equip an item
  equipItem(item, fromInventory = true) {
    if (!item) return { success: false, message: "No item to equip." };
    
    let slot = null;
    
    // Determine equipment slot based on item type
    if (item.type === "weapon" || item.category === "weapon") {
      slot = "weapon";
    } else if (item.type === "armor" || item.category === "armor") {
      slot = "armor";
    } else if (item.type === "accessory" || item.category === "accessory") {
      slot = "accessory";
    } else {
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
  getWeaponDamage() {
    if (!this.equipment.weapon) {
      // Use default fists weapon from weapons/fists.json
      const defaultWeapon = this.game.weaponManager ? 
        this.game.weaponManager.getWeapon('fists') : 
        { damage: 1 }; // Fallback if weaponManager not available
      
      return defaultWeapon.damage + Math.floor((this.game.playerStats.attack || 0) / 2);
    }
    
    const baseDamage = this.equipment.weapon.damage || 0;
    const attackBonus = Math.floor((this.game.playerStats.attack || 0) / 2);
    
    return baseDamage + attackBonus;
  }

  // Get total defense value (with stat bonuses)
  getTotalDefense() {
    let defense = 0;
    
    // Base defense from player stats
    defense += Math.floor((this.game.playerStats.defense || 0) / 2);
    
    // Add armor defense if equipped
    if (this.equipment.armor) {
      defense += this.equipment.armor.defense || 0;
    }
    
    // Add accessory defense if equipped and it has a defense value
    if (this.equipment.accessory && this.equipment.accessory.defense) {
      defense += this.equipment.accessory.defense;
    }
    
    return defense;
  }

  // Save equipment data
  save() {
    return this.equipment;
  }

  // Load equipment data
  load(equipment) {
    this.equipment = equipment || { weapon: null, armor: null, accessory: null };
  }
}