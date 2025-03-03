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
      return data;
    } catch (error) {
      console.error(`Failed to load enemy ${enemyId}:`, error);
      return null;
    }
  }

  getEnemy(enemyId) {
    console.log(`Getting enemy with ID: ${enemyId}`);
    console.log(`Available enemies: ${Object.keys(this.enemies).join(', ')}`);
    
    if (this.enemies[enemyId]) {
      return { ...this.enemies[enemyId], id: enemyId };
    }
    
    console.warn(`Enemy ${enemyId} not found in loaded enemies`);
    return null;
  }

  generateLootFromEnemy(enemyId) {
    const enemy = this.getEnemy(enemyId);
    if (!enemy || !enemy.lootTables || enemy.lootTables.length === 0) {
      return [];
    }

    const loot = [];
    const playerLuck = this.game.playerStats.luck || 5;
    
    // Calculate luck bonus for rarer loot (1% per 5 points)
    const rarityBonus = Math.floor(playerLuck / 5) / 100;
    
    // Number of items to generate (1-3)
    const itemCount = Math.floor(Math.random() * 3) + 1;
    
    // Try to generate items from each loot table the enemy has access to
    for (let i = 0; i < itemCount; i++) {
      // Select a loot table based on rarity chances
      const table = this.selectLootTable(enemy.lootTables, rarityBonus);
      if (!table) continue;
      
      // Select an item from the table
      const item = this.selectItemFromTable(table);
      if (item) {
        // Check if we already have this item in the loot
        const existingItem = loot.find(i => i.id === item.id);
        if (existingItem && item.stackable) {
          // If stackable, increase quantity
          existingItem.quantity++;
        } else {
          // Add as a new item
          loot.push({ ...item });
        }
      }
    }
    
    return loot;
  }

  selectLootTable(availableTables, rarityBonus) {
    if (!availableTables || availableTables.length === 0) return null;
    
    // Default probabilities for each tier
    const baseChances = {
      'basic_loot': 0.7,
      'mid_tier_loot': 0.2,
      'advanced_loot': 0.07,
      'epic_loot': 0.02,
      'legendary_loot': 0.01
    };
    
    // Adjust probabilities based on luck bonus
    let tableChances = [];
    
    // Only consider tables that the enemy has access to
    for (const tableId of availableTables) {
      if (baseChances[tableId]) {
        let chance = baseChances[tableId];
        
        // Higher tier tables get more bonus from luck
        if (tableId === 'legendary_loot') {
          chance += rarityBonus * 3;
        } else if (tableId === 'epic_loot') {
          chance += rarityBonus * 2;
        } else if (tableId === 'advanced_loot') {
          chance += rarityBonus;
        }
        
        tableChances.push({ tableId, chance });
      }
    }
    
    // Sort by chance (lowest to highest)
    tableChances.sort((a, b) => a.chance - b.chance);
    
    // Roll for table
    const roll = Math.random();
    let accumulatedChance = 0;
    
    for (const entry of tableChances) {
      accumulatedChance += entry.chance;
      if (roll < accumulatedChance) {
        return entry.tableId;
      }
    }
    
    // Fallback to first table in the list
    return availableTables[0];
  }

  selectItemFromTable(tableId) {
    const table = this.lootTables[tableId];
    if (!table || !table.items || table.items.length === 0) {
      return null;
    }
    
    // Select a random item from the table
    const index = Math.floor(Math.random() * table.items.length);
    const item = table.items[index];
    
    // Set quantity if not specified
    if (!item.quantity) {
      item.quantity = 1;
    }
    
    return { ...item };
  }
}