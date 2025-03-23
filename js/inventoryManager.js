export class InventoryManager {
  constructor(game) {
    this.game = game;
    this.items = [];
  }

  // Get all inventory items
  getAllItems() {
    return this.items;
  }

  // Add an item to inventory
  addItem(item, quantity = 1) {
    if (!item) return false;
    
    // Ensure item has necessary properties
    const newItem = {
      ...item,
      quantity: quantity
    };
    
    // Check if item already exists and is stackable
    const existingItem = this.items.find(i => i.id === item.id);
    if (existingItem && (item.stackable !== false)) {
      existingItem.quantity += quantity;
      return true;
    } else {
      this.items.push(newItem);
      return true;
    }
  }

  // Add multiple items at once
  addItems(items) {
    if (!items || !items.length) return false;
    
    items.forEach(item => {
      this.addItem(item, item.quantity || 1);
    });
    
    return true;
  }

  // Remove an item from inventory
  removeItem(itemId, quantity = 1) {
    const index = this.items.findIndex(item => item.id === itemId);
    if (index === -1) return false;
    
    const item = this.items[index];
    item.quantity -= quantity;
    
    if (item.quantity <= 0) {
      this.items.splice(index, 1);
    }
    
    return true;
  }

  // Get an item by ID
  getItem(itemId) {
    return this.items.find(item => item.id === itemId);
  }

  // Find an item by name (case insensitive)
  findItemByName(itemName) {
    return this.items.find(item => 
      item.name.toLowerCase() === itemName.toLowerCase() || 
      item.id.toLowerCase() === itemName.toLowerCase()
    );
  }

  // Check if inventory has a specific item
  hasItem(itemId, quantity = 1) {
    const item = this.getItem(itemId);
    return item && item.quantity >= quantity;
  }

  // Get all items of a specific type
  getItemsByType(type) {
    return this.items.filter(item => 
      item.type === type || item.category === type
    );
  }

  // Use an item
  useItem(itemId) {
    const item = this.getItem(itemId);
    if (!item) return { success: false, message: "Item not found in inventory." };
    
    // Different behavior based on item type
    if (item.type === "consumable" || item.category === "consumable") {
      // Handle consumable logic (will be implemented by game.useConsumable)
      const result = this.game.useConsumable(item);
      
      // If successfully used, reduce quantity
      if (result.success) {
        this.removeItem(itemId, 1);
      }
      
      return result;
    } else if (item.type === "material" || item.category === "material") {
      return { success: false, message: `${item.name} is a crafting material. It can't be used directly.` };
    } else {
      return { success: false, message: `Cannot use ${item.name} directly.` };
    }
  }

  // Save inventory data
  save() {
    return this.items;
  }

  // Load inventory data
  load(items) {
    this.items = items || [];
  }
}