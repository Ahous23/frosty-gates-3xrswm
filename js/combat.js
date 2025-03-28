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
  }

  async initiateCombat(enemy) {
    this.inCombat = true;
    
    // Debug log to see what's being passed
    console.log("Initiating combat with:", enemy);
    
    // If enemy is a string ID, try to fetch from loot system first
    if (typeof enemy === 'string') {
      let enemyData = null;
      
      // Try loot system first
      if (this.game.lootSystem) {
        enemyData = this.game.lootSystem.getEnemy(enemy);
      }
      
      // If not found in loot system, try loading directly from file
      if (!enemyData) {
        try {
          const response = await fetch(`/enemies/${enemy}.json`);
          if (response.ok) {
            enemyData = await response.json();
            // Make sure it has an ID
            if (!enemyData.id) {
              enemyData.id = enemy;
            }
          } else {
            console.error(`Failed to fetch enemy ${enemy}: ${response.status}`);
          }
        } catch (fetchError) {
          console.error(`Error loading enemy ${enemy}:`, fetchError);
        }
      }
      
      console.log("Fetched enemy data:", enemyData);
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
    
    // If enemy goes first, process their turn
    if (!this.playerTurn) {
      setTimeout(() => this.processEnemyTurn(), 1500);
    } else {
      this.showCombatOptions();
    }
    
    this.game.inputMode = "combat";
  }

  displayCombatStatus() {
    this.game.uiManager.print(`\n${this.currentEnemy.name}: ${this.currentEnemy.currentHealth}/${this.currentEnemy.health} HP`, "enemy-health");
    this.game.uiManager.print(`Olaf: ${this.game.gameState.playerHealth}/${this.maxPlayerHealth} HP\n`, "player-health");
  }

  showCombatOptions() {
    this.game.uiManager.print("What will you do?", "system-message");
    this.game.uiManager.print("1. Attack", "combat-option");
    this.game.uiManager.print("2. Use Item", "combat-option");
    this.game.uiManager.print("3. Check Enemy", "combat-option");
  }

  processPlayerAction(action) {
    if (!this.inCombat || !this.playerTurn) return;
    
    const actionLower = action.toLowerCase();
    
    if (actionLower === "1" || actionLower === "attack") {
      this.playerAttack();
    } else if (actionLower === "2" || actionLower === "use item") {
      this.showInventory();
    } else if (actionLower === "3" || actionLower === "check enemy") {
      this.checkEnemy();
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
      (weapon.damage + Math.floor(this.game.playerStats.attack / 2));
    
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
    
    // Set up enemy turn after a delay
    this.playerTurn = false;
    setTimeout(() => this.processEnemyTurn(), 1500);
  }

  processEnemyTurn() {
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
    
    // End enemy turn
    this.playerTurn = true;
    this.displayCombatStatus();
    this.showCombatOptions();
  }

  checkEnemy() {
    this.game.uiManager.print(`\n${this.currentEnemy.name}`, "enemy-name");
    this.game.uiManager.print(`Health: ${this.currentEnemy.currentHealth}/${this.currentEnemy.health}`, "enemy-stat");
    this.game.uiManager.print(`Attack: ${this.currentEnemy.attack}`, "enemy-stat");
    this.game.uiManager.print(`Defense: ${this.currentEnemy.defense}`, "enemy-stat");
    this.game.uiManager.print(`Speed: ${this.currentEnemy.speed}`, "enemy-stat");
    
    // Show enemy weapon if available
    if (this.currentEnemy.currentWeapon) {
      this.game.uiManager.print(`Weapon: ${this.currentEnemy.currentWeapon.name} (${this.currentEnemy.currentWeapon.damage} damage)`, "enemy-stat");
    }
    
    this.game.uiManager.print(`${this.currentEnemy.description}\n`, "enemy-description");
    
    // Return to combat options
    this.showCombatOptions();
  }

  showInventory() {
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

  useItem(itemIndex) {
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
    this.game.inputMode = "combat";
    
    // Enemy turn after delay
    setTimeout(() => this.processEnemyTurn(), 1500);
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
    
    if (victory) {
      // Calculate XP reward
      const xpReward = this.calculateXpReward();
      
      // Add XP to player
      if (!this.game.gameState.playerXp) this.game.gameState.playerXp = 0;
      this.game.gameState.playerXp += xpReward;
      
      // Check for level up
      this.checkLevelUp();
      
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
      
      // Continue to next scene
      setTimeout(() => {
        this.game.currentScene = this.game.nextSceneAfterCombat;
        this.game.inputMode = "normal";
        this.game.playScene();
      }, 3000);
    } else {
      // Player defeated
      this.game.uiManager.print("\nYou have been defeated!", "defeat-message");
      
      // Continue to defeat scene if specified
      setTimeout(() => {
        this.game.currentScene = this.game.defeatSceneAfterCombat;
        this.game.inputMode = "normal";
        this.game.gameState.playerHealth = this.maxPlayerHealth; // Reset health on defeat
        this.game.playScene();
      }, 3000);
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

  checkLevelUp() {
    // Calculate current level based on XP
    const oldLevel = Math.floor(this.game.gameState.playerXp / xpPerLevel);
    const newLevel = Math.floor((this.game.gameState.playerXp) / xpPerLevel);
    
    // If gained at least one level
    if (newLevel > oldLevel) {
      const levelsGained = newLevel - oldLevel;
      
      // Add stat points
      if (!this.game.gameState.availableStatPoints) {
        this.game.gameState.availableStatPoints = 0;
      }
      this.game.gameState.availableStatPoints += levelsGained;
      
      // Display level up message
      this.game.uiManager.print(`\nLevel up! You are now level ${newLevel}!`, "level-up");
      this.game.uiManager.print(`You gained ${levelsGained} stat point(s)!`, "stat-points");
      this.game.uiManager.print(`Type 'stats' anytime to allocate your points.`, "system-message");
    }
  }

  getWeapon(id) {
    const weapon = this.weapons.find(w => w.id === id);
    if (!weapon && id === 'fists') {
      return { id: 'fists', name: 'Fists', damage: 1 }; // Match fists.json
    }
    return weapon;
  }
}