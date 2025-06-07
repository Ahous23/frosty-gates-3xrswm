import { maxPlayerHealth, xpPerLevel } from './constants.js';
import { WeaponManager } from './weaponManager.js';

const weaponManager = new WeaponManager();

export class CombatSystem {
  constructor(game) {
    this.game = game;
    this.inCombat = false;
    this.currentEnemy = null;
    this.playerTurn = false;
    this.combatLog = [];
    this.maxPlayerHealth = maxPlayerHealth;
    this.spellCharges = {};
  }

  async initiateCombat(enemy) {
    this.inCombat = true;
    // Reset spell charges for this combat
    this.spellCharges = {};
    (this.game.playerSpells || []).forEach(id => {
      const s = this.game.spellManager.getSpell(id);
      if (s) this.spellCharges[id] = s.charges || 1;
    });
    
    
    // If enemy is a string ID, fetch it from the loot system
    if (typeof enemy === 'string') {
      const enemyData = this.game.lootSystem
        ? this.game.lootSystem.getEnemy(enemy)
        : null;

      if (enemyData) {
        enemy = enemyData;
      }
    }
    
    // Ensure enemy has all required properties
    if (!enemy || !enemy.name) {
      console.error("Invalid enemy data:", enemy);
      // Create a basic fallback enemy to prevent crashes
      enemy = {
        name: "Bear Warrior",
        description: "A ferocious bear warrior appears!",
        health: 30,
        attack: 8,
        defense: 3,
        speed: 4
      };
    }
    
    // Select a random weapon for the enemy if available
    if (enemy.weapons && enemy.weapons.length > 0) {
      const randomIndex = Math.floor(Math.random() * enemy.weapons.length);
      enemy.currentWeapon = enemy.weapons[randomIndex];
    } else {
      // Default weapon if none specified
      enemy.currentWeapon = {
        name: "fists",
        damage: enemy.attack || 1
      };
    }
    
    this.currentEnemy = {
      ...enemy,
      currentHealth: enemy.health
    };
    
    // Ensure player health exists in gameState
    if (this.game.gameState.playerHealth === undefined) {
      this.game.gameState.playerHealth = this.maxPlayerHealth;
    }
    
    // Determine who goes first based on speed
    this.playerTurn = this.game.playerStats.speed >= this.currentEnemy.speed;
    
    // Display combat start message
    this.game.uiManager.clearOutput();
    this.game.uiManager.print(`Combat begins with ${this.currentEnemy.name}!`, "system-message");
    this.game.uiManager.print(`${this.currentEnemy.description}`, "enemy-description");
    
    // Show enemy and player stats
    this.displayCombatStatus();
    
    // Prompt to begin the first turn
    this.game.uiManager.print("\nType 'continue' to begin combat...", "system-message");
    this.game.inputMode = "await-continue";
    this.game.continueCallback = () => {
      this.game.inputMode = "combat";
      if (!this.playerTurn) {
        this.processEnemyTurn();
      } else {
        this.showCombatOptions();
      }
    };
  }

  displayCombatStatus() {
    this.game.uiManager.print(`\n${this.currentEnemy.name}: ${this.currentEnemy.currentHealth}/${this.currentEnemy.health} HP`, "enemy-health");
    this.game.uiManager.print(`Olaf: ${this.game.gameState.playerHealth}/${this.maxPlayerHealth} HP\n`, "player-health");
  }

  showCombatOptions() {
    this.game.uiManager.clearOutput();
    this.game.uiManager.print("What will you do?", "system-message");
    const weapon = this.getEquippedWeapon();
    const [minW, maxW] = this.calculateWeaponDamageRange(weapon);
    this.game.uiManager.print(`1. Attack with ${weapon.name} (${minW}-${maxW} damage)`, "combat-option");
    this.game.uiManager.print("2. Cast Spell", "combat-option");
    this.game.uiManager.print("3. Use Item", "combat-option");
    this.game.uiManager.print("4. Check Enemy", "combat-option");
    this.game.uiManager.print("5. Inventory / Equip", "combat-option");
  }

  processPlayerAction(action) {
    if (!this.inCombat || !this.playerTurn) return;
    
    const actionLower = action.toLowerCase();
    
    if (actionLower === "1" || actionLower === "attack") {
      this.playerAttack();
    } else if (actionLower === "2" || actionLower === "cast spell" || actionLower === "spell") {
      this.showSpellList();
    } else if (actionLower === "3" || actionLower === "use item") {
      this.showInventory();
    } else if (actionLower === "4" || actionLower === "check enemy") {
      this.checkEnemy();
    } else if (actionLower === "5" || actionLower === "inventory" || actionLower === "equip" || actionLower === "equipment") {
      if (this.game.inputHandlers && typeof this.game.inputHandlers.showInventory === 'function') {
        this.game.inputHandlers.showInventory();
      }
    } else {
      this.game.uiManager.print("Invalid combat action. Try again.", "error-message");
      this.showCombatOptions();
    }
  }

  // Update the playerAttack method to use equipment manager
  playerAttack() {
    const weapon = this.getEquippedWeapon();
    const weaponDamage = this.game.equipmentManager ?
      this.game.equipmentManager.getWeaponDamage() :
      (() => {
        const attackBonus = Math.floor(this.game.playerStats.attack / 2);
        const variance = Math.floor((Math.random() - 0.5) * attackBonus);
        return weapon.damage + attackBonus + variance;
      })();
    
    // Critical hit chance based on luck (5% base + 1% per 5 points of luck)
    const critChance = 0.05 + (Math.floor((this.game.playerStats.luck || 0) / 5) * 0.01);
    const isCritical = Math.random() < critChance;
    
    // Calculate damage
    let damage = weaponDamage;
    if (isCritical) {
      damage = Math.floor(damage * 1.5);
    }
    
    // Apply enemy defense reduction if it exists
    if (this.currentEnemy.defense) {
      damage = Math.max(1, damage - Math.floor(this.currentEnemy.defense / 2));
    }
    
    // Update enemy health
    this.currentEnemy.currentHealth = Math.max(0, this.currentEnemy.currentHealth - damage);
    
    // Display attack message
    this.game.uiManager.print(
      `You attack with your ${weapon.name} and deal ${isCritical ? 'a critical hit for ' : ''}${damage} damage!`,
      isCritical ? "critical-hit" : "player-attack"
    );
    
    // Update combat status
    this.displayCombatStatus();
    
    // Check if enemy is defeated
    if (this.currentEnemy.currentHealth <= 0) {
      this.endCombat(true);
      return;
    }
    
    // Wait for player to continue before enemy turn
    this.playerTurn = false;
    this.game.uiManager.print("\nType 'continue' for the enemy's turn.", "system-message");
    this.game.inputMode = "await-continue";
    this.game.continueCallback = () => {
      this.game.inputMode = "combat";
      this.processEnemyTurn();
    };
  }

  processEnemyTurn() {
    this.game.uiManager.clearOutput();
    if (!this.inCombat) return;
    
    // Tutorial enemy should be easy to defeat
    if (this.currentEnemy.isTutorial) {
      // Make sure the player wins by dealing less damage
      let damage = Math.max(1, Math.floor(this.game.gameState.playerHealth / 10));
      
      // Display results
      this.game.uiManager.print(`${this.currentEnemy.name} attacks you for ${damage} damage!`, "enemy-attack");
      
      // Apply damage to player
      this.game.gameState.playerHealth -= damage;
    } else {
      // Get enemy weapon damage (fallback to attack stat if needed)
      let baseDamage = this.currentEnemy.currentWeapon ? 
            this.currentEnemy.currentWeapon.damage : this.currentEnemy.attack;
      
      // Add variation based on enemy's attack stat (±15% by default)
      const variationRange = baseDamage * 0.15;
      const variation = (Math.random() * 2 - 1) * variationRange;
      let damage = baseDamage + variation;
      
      // Apply player defense reduction
      const defenseReduction = damage * (this.game.playerStats.defense * 0.01);
      damage = Math.max(1, damage - defenseReduction); // At least 1 damage
      damage = Math.floor(damage); // Round down to integer
      
      // Apply damage to player
      this.game.gameState.playerHealth -= damage;
      
      // Display results with weapon name if available
      const weaponName = this.currentEnemy.currentWeapon ? 
            `with their ${this.currentEnemy.currentWeapon.name}` : "";
      this.game.uiManager.print(`${this.currentEnemy.name} attacks you ${weaponName} for ${damage} damage!`, "enemy-attack");
    }
    
    // Check if player defeated
    if (this.game.gameState.playerHealth <= 0) {
      this.endCombat(false);
      return;
    }
    
    // Wait for player to continue back to their turn
    this.playerTurn = true;
    this.game.uiManager.print("\nType 'continue' for your turn.", "system-message");
    this.game.inputMode = "await-continue";
    this.game.continueCallback = () => {
      this.game.inputMode = "combat";
      this.displayCombatStatus();
      this.showCombatOptions();
    };
  }

  checkEnemy() {
    this.game.uiManager.clearOutput();
    this.game.uiManager.print(`\n${this.currentEnemy.name}`, "enemy-name");
    this.game.uiManager.print(`Health: ${this.currentEnemy.currentHealth}/${this.currentEnemy.health}`, "enemy-stat");
    this.game.uiManager.print(`Attack: ${this.currentEnemy.attack}`, "enemy-stat");
    this.game.uiManager.print(`Defense: ${this.currentEnemy.defense}`, "enemy-stat");
    this.game.uiManager.print(`Speed: ${this.currentEnemy.speed}`, "enemy-stat");
    
    // Show enemy weapon if available
    if (this.currentEnemy.currentWeapon) {
      const base = this.currentEnemy.currentWeapon.damage;
      const vrange = Math.floor(base * 0.15);
      const minE = base - vrange;
      const maxE = base + vrange;
      this.game.uiManager.print(`Weapon: ${this.currentEnemy.currentWeapon.name} (${minE}-${maxE} damage)`, "enemy-stat");
    }
    
    this.game.uiManager.print(`${this.currentEnemy.description}\n`, "enemy-description");
    
    // Wait for player to continue back to combat options
    this.game.uiManager.print("Type 'continue' to resume combat.", "system-message");
    this.game.inputMode = "await-continue";
    this.game.continueCallback = () => {
      this.game.inputMode = "combat";
      this.showCombatOptions();
    };
  }

  showInventory() {
    this.game.uiManager.clearOutput();
    const usableItems = this.game.inventory.filter(item =>
      item.category === "consumable" && item.quantity > 0
    );
    
    if (usableItems.length === 0) {
      this.game.uiManager.print("You don't have any usable items!", "system-message");
      this.showCombatOptions();
      return;
    }
    
    this.game.uiManager.print("\nSelect an item to use:", "system-message");
    usableItems.forEach((item, index) => {
      this.game.uiManager.print(`${index + 1}. ${item.name} (${item.quantity})`, "inventory-item");
    });
    this.game.uiManager.print("0. Back to combat options", "inventory-item");
    
    this.game.inputMode = "combat-item";
  }

  showSpellList(skipClear = false) {
    if (!skipClear) {
      this.game.uiManager.clearOutput();
    }
    const knownSpells = (this.game.playerSpells || []).map(id => this.game.spellManager.getSpell(id)).filter(Boolean);

    if (knownSpells.length === 0) {
      this.game.uiManager.print("You don't know any spells!", "system-message");
      this.showCombatOptions();
      return;
    }

    this.currentSpellList = knownSpells;
    this.game.uiManager.print("\nSelect a spell to cast:", "system-message");
    knownSpells.forEach((spell, index) => {
      const [minS, maxS] = this.calculateSpellDamageRange(spell);
      const charges = this.spellCharges[spell.id] ?? spell.charges ?? 1;
      this.game.uiManager.print(`${index + 1}. ${spell.name} (${minS}-${maxS} damage, ${charges} charges)`, "combat-option");
    });
    this.game.uiManager.print("0. Back to combat options", "combat-option");
    this.game.inputMode = "combat-spell";
  }

  castSpell(selection) {
    this.game.uiManager.clearOutput();
    if (selection === "0" || selection === "back") {
      this.game.inputMode = "combat";
      this.showCombatOptions();
      return;
    }

    const index = parseInt(selection) - 1;
    if (isNaN(index) || !this.currentSpellList || index < 0 || index >= this.currentSpellList.length) {
      this.game.uiManager.print("Invalid spell selection.", "error-message");
      this.showSpellList(true);
      return;
    }

    const spell = this.currentSpellList[index];
    if (this.spellCharges[spell.id] !== undefined && this.spellCharges[spell.id] <= 0) {
      this.game.uiManager.print(`${spell.name} has no charges left!`, "system-message");

      this.showSpellList(true);

      return;
    }
    if (this.spellCharges[spell.id] !== undefined) {
      this.spellCharges[spell.id]--;
    }
    const intelligence = this.game.playerStats.intelligence || 0;
    const intBonus = Math.floor(intelligence / 2);
    const variance = Math.floor((Math.random() - 0.5) * intBonus);
    const baseDamage = spell.damage + intBonus + variance;
    const critChance = 0.05 + (Math.floor((this.game.playerStats.luck || 0) / 5) * 0.01);
    const isCritical = Math.random() < critChance;
    let damage = baseDamage;
    if (isCritical) damage = Math.floor(damage * 1.5);

    if (this.currentEnemy.defense) {
      damage = Math.max(1, damage - Math.floor(this.currentEnemy.defense / 2));
    }

    this.currentEnemy.currentHealth = Math.max(0, this.currentEnemy.currentHealth - damage);
    this.game.uiManager.print(
      `You cast ${spell.name} and deal ${isCritical ? 'a critical hit for ' : ''}${damage} damage!`,
      isCritical ? "critical-hit" : "player-attack"
    );

    this.displayCombatStatus();

    if (this.currentEnemy.currentHealth <= 0) {
      this.endCombat(true);
      return;
    }

    this.playerTurn = false;
    this.game.uiManager.print("\nType 'continue' for the enemy's turn.", "system-message");
    this.game.inputMode = "await-continue";
    this.game.continueCallback = () => {
      this.game.inputMode = "combat";
      this.processEnemyTurn();
    };
  }

  useItem(itemIndex) {

    this.game.uiManager.clearOutput();

    const usableItems = this.game.inventory.filter(item =>
      item.category === "consumable" && item.quantity > 0
    );
    
    if (itemIndex === "0" || itemIndex === "back") {
      this.game.inputMode = "combat";
      this.showCombatOptions();
      return;
    }

    const index = parseInt(itemIndex) - 1;
    if (isNaN(index) || index < 0 || index >= usableItems.length) {
      this.game.uiManager.print("Invalid item selection.", "error-message");
      this.showInventory();
      return;
    }
    
    const selectedItem = usableItems[index];
    this.applyItemEffect(selectedItem);
    
    // End player turn after using an item
    this.playerTurn = false;
    this.game.uiManager.print("\nType 'continue' for the enemy's turn.", "system-message");
    this.game.inputMode = "await-continue";
    this.game.continueCallback = () => {
      this.game.inputMode = "combat";
      this.processEnemyTurn();
    };
  }

  applyItemEffect(item) {
    // Reduce item quantity
    const inventoryItem = this.game.inventory.find(i => i.id === item.id);
    inventoryItem.quantity--;
    
    // Apply item effects
    if (item.effects) {
      // Healing effect
      if (item.effects.heal) {
        const healAmount = item.effects.heal;
        this.game.gameState.playerHealth = Math.min(
          this.maxPlayerHealth,
          this.game.gameState.playerHealth + healAmount
        );
        this.game.uiManager.print(`You use ${item.name} and restore ${healAmount} health!`, "healing");
      }
      
      // Other effects can be added here
      if (item.effects.custom) {
        this.game.handleCustomItemEffect(item);
      }
    }
    
    this.displayCombatStatus();
  }

  endCombat(victory) {
    this.inCombat = false;
    this.spellCharges = {};
    
    if (victory) {
      // Calculate XP reward
      const xpReward = this.calculateXpReward();
      
      // Add XP to player and check for level up
      if (!this.game.gameState.playerXp) this.game.gameState.playerXp = 0;
      const previousXp = this.game.gameState.playerXp;
      this.game.gameState.playerXp += xpReward;

      // Check for level up using XP before this battle
      this.checkLevelUp(previousXp);
      
      // Display victory message
      this.game.uiManager.print(`\nYou defeated ${this.currentEnemy.name}!`, "victory-message");
      this.game.uiManager.print(`Gained ${xpReward} XP!`, "xp-gain");
      
      // Generate loot using the LootSystem if available
      let loot = [];
      if (this.game.lootSystem && this.currentEnemy.id) {
        loot = this.game.lootSystem.generateLootFromEnemy(this.currentEnemy.id);
      } else if (this.currentEnemy.guaranteedLoot) {
        // Use guaranteed loot from enemy definition
        loot = this.currentEnemy.guaranteedLoot;
      } else if (this.currentEnemy.loot) {
        // Fallback to the old loot system
        loot = this.currentEnemy.loot;
      }
      
      // Add the loot to inventory
      if (loot && loot.length > 0) {
        this.addItemsToInventory(loot);
        this.game.uiManager.print("\nYou found:", "system-message");
        loot.forEach(item => {
          this.game.uiManager.print(`- ${item.name} ${item.quantity > 1 ? `(x${item.quantity})` : ""}`, "item-name");
        });
      }
      
      // Prompt player to continue to the next scene
      this.game.uiManager.print("\nType 'continue' to proceed.", "system-message");
      this.game.inputMode = "await-continue";
      this.game.continueCallback = () => {
        this.game.currentScene = this.game.nextSceneAfterCombat;
        this.game.inputMode = "normal";
        this.game.playScene();
      };
    } else {
      // Player defeated
      this.game.uiManager.print("\nYou have been defeated!", "defeat-message");

      // Prompt player to continue to defeat scene if specified
      this.game.uiManager.print("Type 'continue' to proceed.", "system-message");
      this.game.inputMode = "await-continue";
      this.game.continueCallback = () => {
        this.game.currentScene = this.game.defeatSceneAfterCombat;
        this.game.inputMode = "normal";
        this.game.gameState.playerHealth = this.maxPlayerHealth; // Reset health on defeat
        this.game.playScene();
      };
    }
  }

  // Add helper method to safely add items to inventory
  addItemsToInventory(items) {
    // Make sure inventory exists
    if (!this.game.inventory) {
      this.game.inventory = [];
    }
    
    // Add each item to inventory
    items.forEach(newItem => {
      // Make sure quantity is defined
      if (!newItem.quantity) {
        newItem.quantity = 1;
      }
      
      // Check if item already exists in inventory
      const existingItem = this.game.inventory.find(item => item.id === newItem.id);
      
      if (existingItem) {
        // If item exists, increment quantity
        existingItem.quantity += newItem.quantity;
      } else {
        // Otherwise add new item
        this.game.inventory.push({...newItem});
      }
    });
  }
  
  calculateXpReward() {
    // Base XP based on enemy health and attack
    return Math.floor(
      (this.currentEnemy.health * 0.5) + 
      (this.currentEnemy.attack * 2) +
      Math.random() * 10 // Small random bonus
    );
  }

  checkLevelUp(previousXp = 0) {
    // Determine levels before and after gaining XP
    const oldLevel = Math.floor(previousXp / xpPerLevel);
    const newLevel = Math.floor(this.game.gameState.playerXp / xpPerLevel);
    
    // If gained at least one level
    if (newLevel > oldLevel) {
      const levelsGained = newLevel - oldLevel;
      
      // Add stat points
      if (!this.game.gameState.availableStatPoints) {
        this.game.gameState.availableStatPoints = 0;
      }
      this.game.gameState.availableStatPoints += levelsGained;

      if (!this.game.gameState.talentPoints) {
        this.game.gameState.talentPoints = 0;
      }
      this.game.gameState.talentPoints += levelsGained;

      // Display level up message
      this.game.uiManager.print(`\nLevel up! You are now level ${newLevel}!`, "level-up");
      this.game.uiManager.print(`You gained ${levelsGained} stat point(s)!`, "stat-points");
      this.game.uiManager.print(`Type 'stats' anytime to allocate your points.`, "system-message");
      this.game.uiManager.print(`You gained ${levelsGained} talent point(s)!`, "stat-points");
      this.game.uiManager.print(`Type 'talents' to view the talent tree.`, "system-message");

      if (oldLevel < 1 && newLevel >= 1) {
        this.game.uiManager.print('You have unlocked the talents panel!', 'system-message');
        this.game.uiManager.print("Type 'talents' to open it and spend your points.", 'system-message');
      }
    }
  }

  // Retrieve the player's currently equipped weapon or fall back to fists
  getEquippedWeapon() {
    // Prefer the equipment manager if available
    if (this.game.equipmentManager && this.game.equipmentManager.equipment.weapon) {
      return this.game.equipmentManager.equipment.weapon;
    }

    // Legacy fallback: search the inventory for an equipped weapon
    if (Array.isArray(this.game.inventory)) {
      const invWeapon = this.game.inventory.find(
        item => item.equipped && (item.type === 'weapon' || item.category === 'weapon')
      );
      if (invWeapon) {
        return invWeapon;
      }
    }

    // Default to bare hands
    if (this.game.weaponManager && typeof this.game.weaponManager.getWeapon === 'function') {
      return this.game.weaponManager.getWeapon('fists');
    }

    return { id: 'fists', name: 'Fists', damage: 1 };
  }

  getVarianceRange(statBonus) {
    if (statBonus <= 0) return [0, 0];
    const half = Math.floor(statBonus / 2);
    if (statBonus % 2 === 0) {
      return [-half, half - 1];
    }
    return [-(half + 1), half];
  }

  calculateWeaponDamageRange(weapon) {
    const attackStat = this.game.playerStats.attack || 0;
    const bonus = Math.floor(attackStat / 2);
    const [minVar, maxVar] = this.getVarianceRange(bonus);
    const base = weapon.damage + bonus;
    return [base + minVar, base + maxVar];
  }

  calculateSpellDamageRange(spell) {
    const intStat = this.game.playerStats.intelligence || 0;
    const bonus = Math.floor(intStat / 2);
    const [minVar, maxVar] = this.getVarianceRange(bonus);
    const base = spell.damage + bonus;
    return [base + minVar, base + maxVar];
  }

  getWeapon(id) {
    const weapon = this.weapons.find(w => w.id === id);
    if (!weapon && id === 'fists') {
      return { id: 'fists', name: 'Fists', damage: 1 }; // Match fists.json
    }
    return weapon;
  }
}
