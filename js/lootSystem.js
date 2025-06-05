export class LootSystem {
  constructor(game) {
    this.game = game;
    this.lootTables = {};
    this.enemies = {};
  }

  async initialize() {
    try {
      await this.loadEnemies();
      await this.loadLootTables();
      return true;
    } catch (error) {
      console.error("Error initializing loot system:", error);
    }
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
      const response = await fetch('/enemies/enemies.json');
      if (!response.ok) throw new Error(`Failed to fetch enemies: ${response.status}`);
      const data = await response.json();

      if (data.enemies && typeof data.enemies === 'object') {
        this.enemies = data.enemies;
      } else {
        console.error('Invalid enemies.json structure');
      }
    } catch (error) {
      console.error('Failed to load enemies:', error);
    }
  }

  async loadEnemy(enemyId) {
    if (this.enemies[enemyId]) {
      return this.enemies[enemyId];
    }

    if (Object.keys(this.enemies).length === 0) {
      await this.loadEnemies();
    }

    return this.enemies[enemyId] || null;
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
    const tableItemCounts = {};
    const playerLuck = this.game.playerStats.luck || 5;

    // Calculate luck bonus for rarer loot (1% per 5 points)
    const rarityBonus = Math.floor(playerLuck / 5) / 100;

    // Number of attempts to generate (1-3). Drops are capped at 3 items total.
    const itemCount = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < itemCount; i++) {
      // Filter out high-tier tables that have already produced an item
      const availableTables = enemy.lootTables.filter(t => {
        const count = tableItemCounts[t] || 0;
        if (count > 0 && ['advanced_loot', 'epic_loot', 'legendary_loot'].includes(t)) {
          return false;
        }
        return true;
      });

      const table = this.selectLootTable(availableTables, rarityBonus);
      if (!table) continue;

      const item = this.selectItemFromTable(table);
      if (item) {
        const existingItem = loot.find(i => i.id === item.id);
        if (existingItem && item.stackable) {
          existingItem.quantity++;
        } else {
          loot.push({ ...item });
        }

        tableItemCounts[table] = (tableItemCounts[table] || 0) + 1;

        if (loot.length >= 3) break;
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

    // Calculate weighted chances for each item
    let totalWeight = 0;
    const weights = table.items.map(item => {
      let weight = item.chance !== undefined ? item.chance : 1;
      // Accept fractional probabilities and percentages
      if (weight <= 1) {
        weight *= 100;
      }
      totalWeight += weight;
      return weight;
    });

    // Roll against the cumulative weights
    let roll = Math.random() * totalWeight;
    let item = table.items[0];
    for (let i = 0; i < table.items.length; i++) {
      roll -= weights[i];
      if (roll <= 0) {
        item = table.items[i];
        break;
      }
    }

    // Set quantity if not specified
    if (!item.quantity) {
      item.quantity = 1;
    }
    
    return { ...item };
  }
}