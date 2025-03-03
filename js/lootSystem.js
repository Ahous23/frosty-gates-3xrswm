export class LootSystem {
  constructor(game) {
    this.game = game;
    this.lootTables = {};
    this.enemies = {};
  }

  async initialize() {
    await this.loadLootTables();
    await this.loadEnemies();
    return true;
  }

  async loadLootTables() {
    const tableNames = ['basic_loot', 'mid_tier_loot', 'advanced_loot', 'epic_loot', 'legendary_loot'];
    for (const tableName of tableNames) {
      try {
        const response = await fetch(`loot/${tableName}.json`);
        if (!response.ok) throw new Error(`Failed to fetch loot table: ${response.status}`);
        const data = await response.json();
        this.lootTables[tableName] = data;
      } catch (error) {
        console.error(`Failed to load loot table ${tableName}:`, error);
      }
    }
  }

  async loadEnemies() {
    try {
      const response = await fetch('enemies/index.json');
      if (!response.ok) throw new Error(`Failed to fetch enemy index: ${response.status}`);
      const enemyList = await response.json();
      
      for (const enemyId of enemyList.enemies) {
        await this.loadEnemy(enemyId);
      }
    } catch (error) {
      console.error('Failed to load enemy index:', error);
      // Fallback: Try to load some basic enemy types directly
      await this.loadEnemy('bear_warrior_weak');
      await this.loadEnemy('bear_warrior');
      await this.loadEnemy('bear_berserker');
      await this.loadEnemy('bear_shaman');
      await this.loadEnemy('bear_chieftain');
    }
  }

  async loadEnemy(enemyId) {
    try {
      const response = await fetch(`enemies/${enemyId}.json`);
      if (!response.ok) throw new Error(`Failed to fetch enemy data: ${response.status}`);
      const data = await response.json();
      this.enemies[enemyId] = data;
    } catch (error) {
      console.error(`Failed to load enemy ${enemyId}:`, error);
    }
  }

  getEnemy(enemyId) {
    if (!this.enemies[enemyId]) {
      console.error(`Enemy ${enemyId} not found in the loaded enemies.`);
      return null;
    }
    return {...this.enemies[enemyId]};
  }

  generateLootFromEnemy(enemyId) {
    const enemy = this.getEnemy(enemyId);
    if (!enemy) return [];
    
    const loot = [];
    
    // Add guaranteed loot
    if (enemy.guaranteedLoot) {
      for (const item of enemy.guaranteedLoot) {
        loot.push(this.getItemById(item.id, item.quantity));
      }
    }
    
    // Generate random loot from loot tables
    if (enemy.lootTables) {
      for (const lootTableInfo of enemy.lootTables) {
        // Apply luck bonus to the roll chance
        // Each 5 points of luck adds 1% to the chance
        const luckBonus = Math.floor(this.game.playerStats.luck / 5);
        const adjustedChance = lootTableInfo.chance + luckBonus;
        
        // Roll for the loot table
        if (Math.random() * 100 <= adjustedChance) {
          const items = this.rollLootTable(lootTableInfo.table);
          loot.push(...items);
        }
      }
    }
    
    return loot;
  }

  rollLootTable(tableName) {
    const table = this.lootTables[tableName];
    if (!table) {
      console.error(`Loot table ${tableName} not found.`);
      return [];
    }
    
    const loot = [];
    const itemsToGenerate = Math.floor(Math.random() * 3) + 1; // 1-3 items
    
    // Create a weighted pool of items based on their chances
    const itemPool = [];
    for (const item of table.items) {
      for (let i = 0; i < item.chance; i++) {
        itemPool.push(item);
      }
    }
    
    // Pick random items from the pool (without duplicates)
    const selectedItems = new Set();
    for (let i = 0; i < itemsToGenerate; i++) {
      if (itemPool.length === 0) break;
      
      const randomIndex = Math.floor(Math.random() * itemPool.length);
      const selectedItem = itemPool[randomIndex];
      
      if (!selectedItems.has(selectedItem.id)) {
        selectedItems.add(selectedItem.id);
        loot.push({...selectedItem});
      }
    }
    
    return loot;
  }
  
  getItemById(itemId, quantity = 1) {
    // Search through all loot tables for the item
    for (const tableName in this.lootTables) {
      const table = this.lootTables[tableName];
      for (const item of table.items) {
        if (item.id === itemId) {
          const itemCopy = {...item};
          itemCopy.quantity = quantity;
          return itemCopy;
        }
      }
    }
    
    console.error(`Item ${itemId} not found in any loot table.`);
    return null;
  }
}