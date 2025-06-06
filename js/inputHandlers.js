import { fadeTransition } from './ui.js';

export class InputHandlers {
  constructor(game) {
    this.game = game;
    this.isInitialAllocation = false; // Flag to track if we're in initial character creation
    this.awaitingUnspentPointsConfirmation = false; // New flag to track if we're waiting for confirmation
  }

  // Add a new method to handle combat input
  handleCombatInput(input) {
    // Add notes command check at the beginning
    if (input === "notes" || input === "note") {
      this.game.toggleNotes();
      return;
    }

    // Add map command check
    if (input === "map" || input === "m") {
      this.game.toggleMap();
      return;
    }

    if (input === "talents" || input === "talent" || input === "t") {
      this.game.toggleTalentTree();
      return;
    }
    
    // Then continue with existing combat input handling
    this.game.combatSystem.processPlayerAction(input);
  }
  
  // Add method to handle combat item selection
  handleCombatItemInput(input) {
    // Add notes command check at the beginning
    if (input === "notes" || input === "note") {
      this.game.toggleNotes();
      return;
    }
    
    // Add map command check
    if (input === "map" || input === "m") {
      this.game.toggleMap();
      return;
    }

    // Then continue with existing combat item input handling
    this.game.combatSystem.useItem(input);
  }

  handleCombatSpellInput(input) {
    if (input === "notes" || input === "note") {
      this.game.toggleNotes();
      return;
    }

    if (input === "map" || input === "m") {
      this.game.toggleMap();
      return;
    }

    this.game.combatSystem.castSpell(input);
  }
  
  // New method for initial stat allocation at game start
  showInitialStatAllocation() {
    this.isInitialAllocation = true;
    this.game.uiManager.clearOutput();
    this.game.uiManager.print("Welcome, brave adventurer!", "system-message");
    this.game.uiManager.print(
      "Before your journey begins, allocate your character stats using the panel.",
      "system-message"
    );
    this.game.toggleStats(true);
    this.game.uiManager.print("Use the + and - buttons to adjust your stats.", "help-text");
    this.game.uiManager.print("When finished, click 'Confirm Stats' to begin.", "help-text");
  }
  
  handleInput() {
    if (this.game.isTyping) return; // Don't process input while text is typing

    const rawInput = this.game.gameInput.value.trim();
    this.game.uiManager.clearInput();
    this.game.uiManager.print(`> ${rawInput}`, "player-input");

    const input = this.game.inputMode === "loadGame" ? rawInput : rawInput.toLowerCase();

    // Handle global commands that should work in ANY mode
    if (input === "notes" || input === "note") {
      this.game.toggleNotes();
      return;
    }
    
    // Add global map command check
    if (input === "map" || input === "m") {
      this.game.toggleMap();
      return;
    }

    if (input === "talents" || input === "skills" || input === "talent") {
      this.game.toggleTalents();
      return;
    }

    // Continue with mode-specific handling
    switch (this.game.inputMode) {
      case "title":
        this.handleTitleInput(input);
        break;
      case "normal":
        this.handleNormalInput(input);
        break;
      case "choices":
        this.handleChoiceInput(input);
        break;
      case "stats":
        this.handleStatInput(input);
        break;
      case "inventory":
        this.handleInventoryInput(input);
        break;
      case "loadGame":
        this.handleLoadGameInput(rawInput);
        break;
      case "errorRecovery":
        this.handleErrorRecoveryInput(input);
        break;
      case "combat":
        this.handleCombatInput(input);
        break;
      case "combat-item":
        this.handleCombatItemInput(input);
        break;
      case "combat-spell":
        this.handleCombatSpellInput(input);
        break;
      case "await-continue":
        this.handleAwaitContinueInput(input);
        break;
      case "await-combat":
        this.handleAwaitCombatInput(input);
        break;
      case "equipment":
        this.handleEquipmentInput(input);
        break;
      case "equip-confirm":
        // This is a special mode that just waits for any input to continue
        // The equipment method has already overridden the handleInput function
        // so we don't need to do anything special here
        break;
    }
  }

  handleTitleInput(input) {
    if (input === "1" || input.toLowerCase() === "new game") {
      this.startNewGame();
    } else if (input === "2" || input.toLowerCase() === "load game") {
      this.showLoadGamePrompt();
    } else {
      this.game.uiManager.print("Invalid option. Please type 1 for New Game or 2 for Load Game.", "error-message");
    }
  }

  // Update the handleNormalInput method to include notes and map
  handleNormalInput(input) {
    // Check for special commands first
    if (input === "save") {
      this.saveGame();
      return;
    }
    
    // Check for notes command
    if (input === "notes" || input === "note") {
      this.game.toggleNotes();
      return;
    }
    
    // Check for map command
    if (input === "map" || input === "m") {
      this.game.toggleMap();
      return;
    }

    // Check for talent command
    if (input === "talents" || input === "talent" || input === "t") {
      this.game.toggleTalentTree();
      return;
    }

    // Check for equipment command
    if (input === "equipment" || input === "equip" || input === "e") {
      this.game.toggleEquipment();
      return;
    }
    
    if (input === "help") {
      this.showHelp();
    } else if (input === "inventory" || input === "i") {
      this.showInventory();
      return;
    } else if (input === "equipment" || input === "equip") {
      this.game.toggleEquipment();
      return;
    } else if (input === "stats" || input === "s") {
      this.showStats();
    } else if (input === "save") {
      this.saveGame();
    } else if (input === "load") {
      this.showLoadGamePrompt();
    } else if (input === "quit" || input === "exit" || input === "title") {
      this.game.uiManager.print("Returning to title screen...", "system-message");
      setTimeout(() => this.game.showTitleScreen(), 1000);
    } else {
      this.game.uiManager.print("I don't understand that command. Type 'help' for a list of commands.", "error-message");
    }
  }

  handleChoiceInput(input) {
    // Handle global commands that should work in choices mode too
    if (input === "notes" || input === "note") {
      this.game.toggleNotes();
      return;
    }
    
    // Add map command handling for choices mode
    if (input === "map" || input === "m") {
      this.game.toggleMap();
      return;
    }

    if (input === "talents" || input === "talent" || input === "t") {
      this.game.toggleTalentTree();
      return;
    }

    if (input === "save") {
      this.saveGame();
      return;
    }

    if (input === "load") {
      this.showLoadGamePrompt();
      return;
    }

    if (input === "help") {
      this.showHelp();
      return;
    }

    // Handle choice selection (existing code)
    const scene = this.game.storyContent[this.game.currentScene];
    const choiceIndex = parseInt(input) - 1;

    if (isNaN(choiceIndex) || choiceIndex < 0 || choiceIndex >= scene.choices.length) {
      this.game.uiManager.print(`Please enter a number between 1 and ${scene.choices.length}.`, "error-message");
      return;
    }

    const choice = scene.choices[choiceIndex];
    this.game.uiManager.print(`You chose: ${choice.text}`, "system-message");
    this.makeChoice(choice.nextScene);
  }

  // Update handleStatInput to work with the new stat points from leveling
  handleStatInput(input) {
    // Add notes command check at the beginning
    if (input === "notes" || input === "note") {
      this.game.toggleNotes();
      return;
    }
    
    // Add map command check
    if (input === "map" || input === "m") {
      this.game.toggleMap();
      return;
    }

    if (input === "talents" || input === "talent" || input === "t") {
      this.game.toggleTalentTree();
      return;
    }

    const inputLower = input.toLowerCase();
    
    // Special handling for "back" during initial allocation
    if (inputLower === "back" && this.isInitialAllocation) {
      this.isInitialAllocation = false;
      this.game.showTitleScreen(); // Go back to title screen
      return;
    }
    
    // Check if we're waiting for confirmation about unspent points
    if (this.awaitingUnspentPointsConfirmation) {
      if (inputLower === "confirm" || inputLower === "yes" || inputLower === "continue") {
        // User confirmed they want to proceed with unspent points
        this.awaitingUnspentPointsConfirmation = false;
        this.proceedAfterStatAllocation();
      } else if (inputLower === "no" || inputLower === "cancel") {
        // User wants to go back to stat allocation
        this.awaitingUnspentPointsConfirmation = false;
        this.game.uiManager.clearOutput(); // Clear the output first
        if (this.isInitialAllocation) {
          this.showInitialStatAllocation(); // Show complete initial allocation screen
        } else {
          this.game.uiManager.print("Returning to stat allocation.", "system-message");
          this.showStats(); // Show regular stats screen
        }
      } else {
        this.game.uiManager.print("Please type 'confirm' to continue with unspent points or 'cancel' to go back.", "system-message");
      }
      return;
    }
    
    // Handle finalizing stats
    if (inputLower === "start" || inputLower === "done") {
      // Check if player has unspent points
      const availablePoints = this.isInitialAllocation 
        ? this.game.availableStatPoints 
        : (this.game.gameState.availableStatPoints || 0);
      
      if (availablePoints > 0) {
        this.awaitingUnspentPointsConfirmation = true;
        this.game.uiManager.print(`\nYou have ${availablePoints} unspent stat points!`, "warning-message");
        this.game.uiManager.print("You can access your stats at any time by typing 'stats' during gameplay.", "system-message");
        this.game.uiManager.print("Type 'confirm' to continue anyway or 'cancel' to go back and spend your points.", "system-message");
        return;
      }
      
      // No unspent points, proceed normally
      this.proceedAfterStatAllocation();
      return;
    }
    
    if (inputLower === "help") {
      this.showStatHelp();
      return;
    }
    
    // Check for stat reduction command (format: "-stat")
    if (this.isInitialAllocation && inputLower.startsWith("-")) {
      const statToReduce = inputLower.substring(1); // Remove the "-" prefix
      this.reduceStatPoint(statToReduce);
      return;
    }
    
    const validStats = ["attack", "defense", "charisma", "intelligence", "speed", "luck"];
    
    if (validStats.includes(inputLower)) {
      // During initial allocation, use game.availableStatPoints, not gameState
      const availablePoints = this.isInitialAllocation 
        ? this.game.availableStatPoints 
        : (this.game.gameState.availableStatPoints || 0);
      
      if (availablePoints > 0) {
        this.game.playerStats[inputLower]++;
        
        // Update the correct stat points counter
        if (this.isInitialAllocation) {
          this.game.availableStatPoints--;
        } else {
          this.game.gameState.availableStatPoints = (this.game.gameState.availableStatPoints || 0) - 1;
        }
        
        // Clear output and refresh stats display to show real-time changes
        this.game.uiManager.clearOutput();
        if (this.isInitialAllocation) {
          this.showInitialStatAllocation();
        } else {
          this.game.uiManager.print(`Increased ${inputLower} to ${this.game.playerStats[inputLower]}.`, "system-message");
          this.showStats();
        }
      } else {
        this.game.uiManager.print("You don't have any stat points available.", "error-message");
      }
    } else {
      this.game.uiManager.print("Invalid stat. Try 'attack', 'defense', 'charisma', 'intelligence', 'speed', or 'luck'.", "error-message");
    }
  }

  // New helper method to handle proceeding after stat allocation
  proceedAfterStatAllocation() {
    if (this.isInitialAllocation) {
      // If this is the initial stat allocation, start the game
      // Move any unspent points into the persistent game state so they
      // can be used later with the "stats" command
      this.game.gameState.availableStatPoints =
        (this.game.gameState.availableStatPoints || 0) +
        (this.game.availableStatPoints || 0);
      this.game.availableStatPoints = 0;

      this.isInitialAllocation = false; // Turn off initial allocation mode
      this.game.currentScene = "intro";
      this.game.inputMode = "normal"; // Important: change mode to normal
      this.game.uiManager.print("\nYour adventure begins...\n", "system-message");
      setTimeout(() => this.game.playScene(), 1500);
    } else {
      this.game.inputMode = this.game.previousMode || "normal";
      this.game.uiManager.print("Returning to game.", "system-message");
    }
  }

  // New method to reduce a stat point during initial allocation
  reduceStatPoint(stat) {
    const validStats = ["attack", "defense", "charisma", "intelligence", "speed", "luck"];
    
    if (!this.isInitialAllocation) {
      this.game.uiManager.print("You can only reallocate points during character creation.", "error-message");
      return;
    }
    
    if (!validStats.includes(stat)) {
      this.game.uiManager.print("Invalid stat. Try '-attack', '-defense', '-charisma', '-intelligence', '-speed', or '-luck'.", "error-message");
      return;
    }
    
    // Check if stat is above the initial value
    if (this.game.playerStats[stat] > this.game.initialPlayerStats[stat]) {
      this.game.playerStats[stat]--;

      // Return the point to the correct pool
      if (this.isInitialAllocation) {
        this.game.availableStatPoints++;
      } else {
        this.game.gameState.availableStatPoints =
          (this.game.gameState.availableStatPoints || 0) + 1;
      }
      
      // Update the display
      this.game.uiManager.clearOutput();
      this.showInitialStatAllocation();
    } else {
      this.game.uiManager.print(`Cannot reduce ${stat} below its initial value (${this.game.initialPlayerStats[stat]}).`, "error-message");
    }
  }

  // Update the handleInventoryInput method to use the new managers
  handleInventoryInput(input) {
    // Add notes command check at the beginning
    if (input === "notes" || input === "note") {
      this.game.toggleNotes();
      return;
    }
    
    // Add map command check
    if (input === "map" || input === "m") {
      this.game.toggleMap();
      return;
    }
    
    if (input === "back" || input === "exit") {
      this.resumeAfterInventory();
      return;
    }

    if (input === "help") {
      this.showInventoryHelp();
      return;
    }

    // Check if trying to examine an item
    const examineMatch = input.match(/^examine\s+(.+)$|^look\s+(.+)$|^inspect\s+(.+)$/);
    if (examineMatch) {
      const itemName = (examineMatch[1] || examineMatch[2] || examineMatch[3]).toLowerCase();
      // Find the item by name using the existing inventory array
      const item = this.game.inventory.find(
        (i) => i.name.toLowerCase() === itemName || i.id.toLowerCase() === itemName
      );

      if (!item) {
        this.game.uiManager.print(`You don't have an item called "${itemName}"`, "error-message");
        return;
      }

      this.examineItem(item);
      return;
    }

    // Check if trying to equip an item
    const equipMatch = input.match(/^equip\s+(.+)$/);
    if (equipMatch) {
      const itemName = equipMatch[1].toLowerCase();
      // Find the item by name using the existing inventory array
      const item = this.game.inventory.find(
        (i) => i.name.toLowerCase() === itemName || i.id.toLowerCase() === itemName
      );

      if (!item) {
        this.game.uiManager.print(`You don't have an item called "${itemName}"`, "error-message");
        return;
      }

      this.equipItem(item);
      return;
    }

    // Check if trying to use an item
    const useMatch = input.match(/^use\s+(.+)$/);
    if (useMatch) {
      const itemName = useMatch[1].toLowerCase();
      // Find the item by name using the existing inventory array
      const item = this.game.inventory.find(
        (i) => i.name.toLowerCase() === itemName || i.id.toLowerCase() === itemName
      );

      if (!item) {
        this.game.uiManager.print(`You don't have an item called "${itemName}"`, "error-message");
        return;
      }

      // Call the useConsumable method directly
      const result = this.game.useConsumable(item);
      
      // Display the message to the player (not just console)
      this.game.uiManager.print(result.message, result.success ? "system-message" : "error-message");
      
      // If the use was successful, remove the item from inventory
      if (result.success) {
        this.removeItemFromInventory(item.id, 1);
      }
      
      return;
    }

    this.game.uiManager.print("Unknown inventory command. Type 'help' for inventory commands.", "error-message");
  }

  handleLoadGameInput(input) {
    // Add global command checks
    if (input.toLowerCase() === "notes" || input.toLowerCase() === "note") {
      this.game.toggleNotes();
      return;
    }
    
    // Add map command check
    if (input.toLowerCase() === "map" || input.toLowerCase() === "m") {
      this.game.toggleMap();
      return;
    }
    
    if (input.toLowerCase() === "back") {
      this.game.showTitleScreen();
      return;
    }

    try {
      const saveData = JSON.parse(atob(input));
      this.loadSaveData(saveData);
    } catch (error) {
      this.game.uiManager.print("Invalid save code. Please try again or type 'back' to return.", "error-message");
    }
  }

  handleErrorRecoveryInput(input) {
    // Add global command checks
    if (input === "notes" || input === "note") {
      this.game.toggleNotes();
      return;
    }
    
    // Add map command check
    if (input === "map" || input === "m") {
      this.game.toggleMap();
      return;
    }
    
    if (input === "restart") {
      this.game.showTitleScreen();
    } else if (input === "continue") {
      this.game.uiManager.print("Attempting to continue...", "system-message");
      this.game.playScene();
    } else {
      this.game.uiManager.print("Invalid input. Type 'restart' or 'continue'.", "error-message");
    }
  }

  async startNewGame() {
    await fadeTransition(async () => {
      this.game.uiManager.print("\nStarting new game...\n", "system-message");

      document.body.classList.remove("title-screen");
      this.game.audioManager.stopTitleMusic();
      this.game.uiManager.clearOutput();

      this.game.inventory = [];
      this.game.playerStats = { ...this.game.initialPlayerStats };
      this.game.playerSpells = ['fireball'];
      this.game.availableStatPoints = 5;
      this.game.gameState.playerHealth = this.game.initialPlayerHealth;
      this.game.gameState.playerXp = this.game.initialPlayerXp;
      this.game.gameState.availableStatPoints = 0;
      this.game.gameState.talentPoints = 0;
      if (this.game.talentManager) {
        this.game.talentManager.acquired = [];
      }
    });

    this.game.inputMode = "stats";
    this.game.previousMode = "title";
    this.showInitialStatAllocation();
  }

  async showLoadGamePrompt() {
    // Remove title screen background when entering load prompt
    document.body.classList.remove("title-screen");
    // Create elements for the typing effect
    const titleElement = document.createElement("div");
    titleElement.className = "load-title";
    this.game.gameOutput.appendChild(titleElement);
    
    // Apply typing effect to the title
    await this.game.uiManager.typeIntoElement(titleElement, "===== LOAD GAME =====", this.game.typingSpeed, this.game.audioManager);
    
    // Create subtitle with typing effect
    const subtitleElement = document.createElement("div");
    subtitleElement.className = "load-subtitle";
    this.game.gameOutput.appendChild(subtitleElement);
    
    await this.game.uiManager.typeIntoElement(subtitleElement, "Paste your save code below or type 'back' to return:", this.game.typingSpeed, this.game.audioManager);
    
    this.game.inputMode = "loadGame";
  }

  async makeChoice(nextScene) {
    await fadeTransition(async () => {
      this.game.uiManager.clearOutput();
      this.game.currentScene = nextScene;
    });
    this.game.awaitingInput = false;
    this.game.inputMode = "normal";
    this.game.gameLogic.playScene();
  }

  showStats() {
    this.game.toggleStats(true);
  }

  showHelp() {
    this.game.uiManager.print("\n===== COMMANDS =====", "system-message");
    this.game.uiManager.print("help - Show this help message", "help-text");
    this.game.uiManager.print("inventory, i - Show your inventory", "help-text");
    this.game.uiManager.print("equipment, equip - Show your equipped items", "help-text");
    this.game.uiManager.print("notes, note - Open/close the notes panel", "help-text");
    this.game.uiManager.print("map, m - Open/close the map", "help-text");
    this.game.uiManager.print("talents, talent, t - Open/close the talent tree", "help-text");
    this.game.uiManager.print("save - Save your game", "help-text");
    this.game.uiManager.print("load - Load a saved game", "help-text");
    this.game.uiManager.print("quit, exit, title - Return to title screen", "help-text");
  }

  showStatHelp() {
    this.game.uiManager.print("\nStat Help:", "system-message");
    this.game.uiManager.print("- attack: Increases damage dealt with weapons", "help-text");
    this.game.uiManager.print("- defense: Reduces damage taken from enemies", "help-text");
    this.game.uiManager.print("- charisma: Improves dialogue options and trading", "help-text");
    this.game.uiManager.print("- intelligence: Increases spell damage", "help-text");
    this.game.uiManager.print("- speed: Determines who attacks first in combat", "help-text");
    this.game.uiManager.print("- luck: Increases critical hit chance and finding items", "help-text");
    
    // Keep the help context-sensitive
    if (this.isInitialAllocation) {
      this.game.uiManager.print("\nType a stat name to increase it, '-stat' to decrease, or 'start' when ready.", "system-message");
    } else {
      this.game.uiManager.print("\nType a stat name to increase it, or 'back' to return.", "system-message");
    }
  }

  showInventoryHelp() {
    this.game.uiManager.print("\n===== INVENTORY COMMANDS =====", "system-message");
    this.game.uiManager.print("examine [item] - Examine an item in detail", "help-text");
    this.game.uiManager.print("use [item] - Use a consumable item", "help-text");
    this.game.uiManager.print("equip [item] - Equip a weapon or armor", "help-text");
    this.game.uiManager.print("back, exit - Exit inventory view", "help-text");
  }

  resumeAfterInventory() {
    this.game.inputMode = this.game.previousMode || "normal";
    this.game.previousMode = null;
    this.game.uiManager.clearOutput();
    if (this.game.inputMode === "normal" || this.game.inputMode === "choices") {
      this.game.gameLogic.playScene();
    } else if (this.game.inputMode === "combat") {
      this.game.combatSystem.showCombatOptions();
    }
  }

  showInventory() {
    // Preserve the original mode when opening inventory the first time
    if (this.game.inputMode !== "inventory") {
      this.game.previousMode = this.game.inputMode;
    }
    this.game.inputMode = "inventory";
    this.game.uiManager.clearOutput();
    this.game.uiManager.print("===== INVENTORY =====", "system-message");
    
    if (this.game.inventory.length === 0) {
      this.game.uiManager.print("Your inventory is empty.", "system-message");
    } else {
      this.game.inventory.forEach((item) => {
        let label = `- ${item.name}`;
        if (item.type === "weapon" || item.category === "weapon") {
          const [minW, maxW] = this.game.combatSystem.calculateWeaponDamageRange(item);
          label = `- ${item.name} (${minW}-${maxW} damage)`;
        }
        this.game.uiManager.print(`${label} ${item.quantity > 1 ? `(x${item.quantity})` : ""}`, "item-name");
        // Show a shorter description in the main inventory view
        if (item.description) {
          const shortDesc = item.description.length > 60 ? 
            item.description.substring(0, 57) + "..." : 
            item.description;
          this.game.uiManager.print(`  ${shortDesc}`, "item-description");
        }
      });
    }
    
    this.game.uiManager.print("\nType 'examine [item]' to inspect details, 'use [item]' to use an item, 'equip [item]' to equip an item, or 'back' to return", "system-message");
  }

  useItem(item) {
    // Handle different item types
    if (item.type === "weapon" || item.category === "weapon" || 
        item.type === "armor" || item.category === "armor") {
      // Redirect to equip method
      this.equipItem(item);
      return;
    }
    
    if (item.type === "consumable" || item.category === "consumable") {
      this.game.uiManager.print(`Using ${item.name}...`, "system-message");
      
      // Handle healing items
      if ((item.effects && item.effects.heal) || item.effect === "heal") {
        const healAmount = item.effects?.heal || item.value;
        this.game.gameState.playerHealth = Math.min(
          this.game.gameState.playerMaxHealth || 100,
          this.game.gameState.playerHealth + healAmount
        );
        this.game.uiManager.print(`You restored ${healAmount} health!`, "healing");
      }
      // Handle status effect items
      else if (item.effect === "resist_frost" || (item.effects && item.effects.resistFrost)) {
        this.game.uiManager.print(`You gain frost resistance for ${item.duration || 300} seconds.`, "system-message");
        // Add status effect tracking
        if (!this.game.gameState.statusEffects) {
          this.game.gameState.statusEffects = {};
        }
        this.game.gameState.statusEffects.frostResistance = {
          duration: item.duration || 300,
          startTime: Date.now()
        };
      }
      // Custom effects
      else if (item.effect === "custom" || item.id === "healingSalve") {
        this.handleCustomItemEffect(item);
      }
      // Generic message for other consumables
      else {
        this.game.uiManager.print(item.effectDescription || "Item used.", "system-message");
      }
      
      // Remove the consumable from inventory
      this.removeItemFromInventory(item.id);
      
      // Refresh inventory view
      this.showInventory();
      return;
    }
    
    if (item.type === "material" || item.category === "material") {
      this.game.uiManager.print(`${item.name} is a crafting material. It can't be used directly.`, "system-message");
      return;
    }
    
    // Default message for other item types
    this.game.uiManager.print(`You can't use ${item.name} right now.`, "error-message");
  }

  useItemById(itemId) {
    const item = this.game.inventory.find((i) => i.id === itemId);
    if (item) {
      this.useItem(item);
      return true;
    }
    return false;
  }

  removeItemFromInventory(itemId, quantity = 1) {
    const itemIndex = this.game.inventory.findIndex((i) => i.id === itemId);
    if (itemIndex === -1) return false;
    
    const item = this.game.inventory[itemIndex];
    item.quantity -= quantity;
    
    if (item.quantity <= 0) {
      this.game.inventory.splice(itemIndex, 1);
    }
    
    return true;
  }

  handleCustomItemEffect(item) {
    switch (item.id) {
      case "healingSalve":
        this.game.gameState.isInjured = false;
        break;
      // Add more custom effects as needed
    }
  }

  adjustStat(stat, change) {
    // Calculate total available points
    const totalAvailablePoints = (this.isInitialAllocation ? this.game.availableStatPoints : 0) + 
                                (this.game.gameState.availableStatPoints || 0);
                                
    if (change > 0 && totalAvailablePoints < change) {
      this.game.uiManager.print(`You only have ${totalAvailablePoints} points available.`, 'error-message');
      return false;
    }

    // Prevent reducing below initial values
    if (
      change < 0 &&
      this.game.playerStats[stat] <= (this.game.initialPlayerStats[stat] || 0)
    ) {
      this.game.uiManager.print(`Cannot reduce ${stat} further.`, 'error-message');
      return false;
    }

    this.game.playerStats[stat] += change;

    // Update the correct stat points counter
    if (this.isInitialAllocation) {
      this.game.availableStatPoints -= change;
    } else {
      this.game.gameState.availableStatPoints =
        (this.game.gameState.availableStatPoints || 0) - change;
    }

    return true;
  }

  // Update the confirmStats method

confirmStats() {
  // During the initial allocation phase we may not have a nextScene value
  // because the stats screen was opened directly when starting a new game.
  // In that case, simply proceed using the normal allocation completion logic.
  if (this.isInitialAllocation) {
    this.proceedAfterStatAllocation();
    return;
  }

  // Otherwise continue to whatever scene the game logic queued up
  this.game.uiManager.print("Stats confirmed!", "system-message");
  this.game.inputMode = "normal";
  this.game.uiManager.clearOutput();
  this.game.currentScene = this.game.nextScene;
  this.game.gameLogic.playScene();
}

// Update the saveGame method to use the game's method
saveGame() {
  if (typeof this.game.saveGame === 'function') {
    this.game.saveGame();
  } else {
    console.error("Game.saveGame method not found");
    this.game.uiManager.print("Error: Game save functionality is not available.", "error-message");
  }
}

  loadSaveData(saveData) {
    try {
      this.game.currentScene = saveData.currentScene;
      this.game.playerStats = saveData.playerStats;
      this.game.inventory = saveData.inventory;
      this.game.gameState = saveData.gameState;
      this.game.playerSpells = saveData.playerSpells || [];
      
      // Add notes handling
      if (saveData.notes && this.game.loadNotes) {
        this.game.loadNotes(saveData.notes);
      }
      
      this.game.uiManager.print("Game loaded successfully!", "system-message");
      setTimeout(() => {
        this.game.uiManager.clearOutput();
        this.game.inputMode = "normal";
        this.game.gameLogic.playScene();
      }, 1500);
    } catch (error) {
      this.game.uiManager.print("Error loading save data: " + error.message, "error-message");
      this.game.showTitleScreen();
    }
  }

  async handleAwaitContinueInput(input) {
    // Process special commands first
    if (input === "save") {
      this.saveGame();
      return;
    }
    
    if (input === "inventory" || input === "i") {
      this.showInventory();
      return;
    }
    
    if (input === "equipment" || input === "equip" || input === "e") {
      this.game.toggleEquipment();
      return;
    }
    
    if (input === "notes" || input === "note") {
      this.game.toggleNotes();
      return;
    }
    
    if (input === "map" || input === "m") {
      this.game.toggleMap();
      return;
    }
    
    // For the continue command, either trigger a callback or load the next scene
    if (input === "continue" || input === "c") {
      if (this.game.continueCallback) {
        const cb = this.game.continueCallback;
        this.game.continueCallback = null;
        cb();
      } else {
        await fadeTransition(async () => {
          this.game.uiManager.clearOutput();
          this.game.currentScene = this.game.nextSceneToLoad;
          this.game.nextSceneToLoad = null;
        });
        this.game.inputMode = "normal";
        this.game.gameLogic.playScene();
      }
    }
  }

  handleAwaitCombatInput(input) {
    // Handle global commands first
    if (input === "notes" || input === "note") {
      this.game.toggleNotes();
      return;
    }
    
    if (input === "map" || input === "m") {
      this.game.toggleMap();
      return;
    }
    
    if (input === "help") {
      this.showHelp();
      return;
    }
    
    if (input === "save") {
      this.saveGame();
      return;
    }
    
    if (input === "inventory" || input === "i") {
      this.showInventory();
      return;
    }
    
    if (input === "stats" || input === "s") {
      this.showStats();
      return;
    }
    
    // Check for continue commands
    const continueCommands = ["continue", "next", "proceed", "c", "go", "done"];
    if (continueCommands.includes(input)) {
      // Proceed to combat
      this.game.inputMode = "normal";
      // Get the combat info and initiate combat
      const combatInfo = this.game.combatToInitiate;
      if (combatInfo) {
        this.game.gameLogic.initiateCombat({ combat: combatInfo });
        this.game.combatToInitiate = null;
      } else {
        this.game.uiManager.print("Error: Combat information not found", "error-message");
      }
    } else {
      this.game.uiManager.print("Type 'continue' to proceed to combat.", "system-message");
    }
  }

  examineItem(item) {
    let header = item.name;
    if (item.type === "weapon" || item.category === "weapon") {
      const [minW, maxW] = this.game.combatSystem.calculateWeaponDamageRange(item);
      header = `${item.name} (${minW}-${maxW} damage)`;
    }
    this.game.uiManager.print(`\n${header}`, "item-name");
    
    // Display description if it exists
    if (item.description) {
      this.game.uiManager.print(item.description, "item-description");
    } else {
      this.game.uiManager.print("There's nothing special about this item.", "item-description");
    }
    
    // Show item stats based on type
    if (item.type === "weapon" || item.category === "weapon") {
      this.game.uiManager.print(`Damage: ${item.damage || 0}`, "item-stat");
    } else if (item.type === "armor" || item.category === "armor") {
      this.game.uiManager.print(`Defense: ${item.defense || 0}`, "item-stat");
    } else if (item.type === "consumable" || item.category === "consumable") {
      if (item.effect === "heal") {
        this.game.uiManager.print(`Healing: ${item.value || 0}`, "item-stat");
      }
    }
    
    // Show if equipable
    if (item.type === "weapon" || item.category === "weapon" || 
        item.type === "armor" || item.category === "armor") {
      this.game.uiManager.print(`Type 'equip ${item.name}' to equip this item.`, "hint-text");
    }
    
    // Show if usable
    if (item.type === "consumable" || item.category === "consumable") {
      this.game.uiManager.print(`Type 'use ${item.name}' to use this item.`, "hint-text");
    }
  }

  // Add these helper methods to calculate attack and defense properly
  getCalculatedAttack() {
    let attack = this.game.playerStats.attack || 0;

    if (this.game.equipmentManager) {
      const weaponDamage = this.game.equipmentManager.getWeaponDamage(false);
      attack = attack + weaponDamage - Math.floor(attack / 2);
    } else {
      const fists = this.game.weaponManager ? this.game.weaponManager.getWeapon('fists') : { damage: 1 };
      attack += fists.damage + Math.floor(attack / 2);
    }

    return attack;
  }

  getCalculatedDefense() {
    // Get base defense from player stats
    let defense = this.game.playerStats.defense || 0;
    
    // Add armor defense if equipped
    if (this.game.equipmentManager) {
      // Use the equipment manager's method to get defense
      const totalDefense = this.game.equipmentManager.getTotalDefense();
      // Remove the player's stat contribution to avoid double counting
      defense = defense + totalDefense - Math.floor(defense / 2);
    } else {
      // Legacy fallback
      const armor = this.game.inventory.find(i => i.equipped && (i.type === "armor" || i.category === "armor"));
      if (armor) {
        defense += armor.defense || 0;
      }
    }
    
    return defense;
  }

  // Update the equipItem method to use the equipment manager
  equipItem(item) {
    // Check if the item is a weapon or armor
    if (item.type !== "weapon" && item.category !== "weapon" && 
        item.type !== "armor" && item.category !== "armor" &&
        item.type !== "accessory" && item.category !== "accessory") {
      this.game.uiManager.print(`You can't equip ${item.name}.`, "error-message");
      return;
    }
    
    // Calculate current stats before equipping
    const oldAttack = this.getCalculatedAttack();
    const oldDefense = this.getCalculatedDefense();
    
    const equipmentType = (item.type === "weapon" || item.category === "weapon") ? "weapon" : 
                         (item.type === "armor" || item.category === "armor") ? "armor" : "accessory";
    
    // Use the equipment manager to equip the item
    const result = this.game.equipmentManager.equipItem(item);
    
    if (!result.success) {
      this.game.uiManager.print(result.message, "error-message");
      return;
    }
    
    // Create a message container that won't get erased by inventory refresh
    this.game.uiManager.clearOutput();
    
    // First print the basic equip message
    this.game.uiManager.print(`You equip ${item.name}.`, "system-message");
    
    // Calculate new stats after equipping
    const newAttack = this.getCalculatedAttack();
    const newDefense = this.getCalculatedDefense();
    
    // Show attack change for weapons
    if (equipmentType === "weapon" && newAttack !== oldAttack) {
      const difference = newAttack - oldAttack;
      const changeText = difference > 0 ? `increased by ${difference}` : `decreased by ${Math.abs(difference)}`;
      this.game.uiManager.print(`Your attack rating has ${changeText}!`, "stat-change");
    }
    
    // Show defense change for armor
    if (equipmentType === "armor" && newDefense !== oldDefense) {
      const difference = newDefense - oldDefense;
      const changeText = difference > 0 ? `increased by ${difference}` : `decreased by ${Math.abs(difference)}`;
      this.game.uiManager.print(`Your defense rating has ${changeText}!`, "stat-change");
    }
    
    // Add a "press any key to continue" instruction
    this.game.uiManager.print("\nPress Enter to continue...", "hint-text");
    
    // Store the original input mode to restore it later
    const originalInputMode = this.game.inputMode;
    
    // Change to a special mode to wait for continuation
    this.game.inputMode = "equip-confirm";
    
    // Override the input handler temporarily to show inventory after any key press
    const originalHandleInput = this.game.handleInput;
    this.game.handleInput = () => {
      // Restore original input handler
      this.game.handleInput = originalHandleInput;
      
      // Restore original input mode
      this.game.inputMode = originalInputMode;
      
      // Now show the inventory
      this.showInventory();
    };
  }

  // Update the showEquipment method to use equipment manager
  showEquipment() {
    // Toggle the equipment panel instead of changing the input mode
    this.game.toggleEquipment();
  }

  // Add a new method to handle equipment commands
  handleEquipmentInput(input) {
    // Add notes command check at the beginning
    if (input === "notes" || input === "note") {
      this.game.toggleNotes();
      return;
    }
    
    // Add map command check
    if (input === "map" || input === "m") {
      this.game.toggleMap();
      return;
    }
    
    if (input === "back" || input === "exit") {
      this.resumeAfterEquipment();
      return;
    }
    
    if (input === "inventory" || input === "i") {
      this.showInventory();
      return;
    }
    
    if (input === "help") {
      this.showEquipmentHelp();
      return;
    }
    
    // Check for examine commands
    const examineMatch = input.match(/^examine\s+(.+)$|^look\s+(.+)$|^inspect\s+(.+)$/);
    if (examineMatch) {
      const slotName = (examineMatch[1] || examineMatch[2] || examineMatch[3]).toLowerCase();
      this.examineEquippedItem(slotName);
      return;
    }
    
    // Check for unequip commands
    const unequipMatch = input.match(/^unequip\s+(.+)$/);
    if (unequipMatch) {
      const slotName = unequipMatch[1].toLowerCase();
      this.unequipItem(slotName);
      return;
    }
    
    this.game.uiManager.print("Unknown equipment command. Type 'help' for available commands.", "error-message");
  }

  // Method to examine an equipped item in detail
  examineEquippedItem(slotName) {
    // Normalize slot name to match equipment manager slots
    let slot = slotName;
    if (["weapon", "sword", "axe", "dagger", "staff", "wand"].includes(slotName)) {
      slot = "weapon";
    } else if (["armor", "armour", "chest", "body"].includes(slotName)) {
      slot = "armor";
    } else if (["accessory", "trinket", "amulet", "ring", "necklace"].includes(slotName)) {
      slot = "accessory";
    }
    
    const equipment = this.game.equipmentManager.getAllEquipment();
    const item = equipment[slot];
    
    if (!item) {
      this.game.uiManager.print(`You don't have anything equipped in the ${slot} slot.`, "error-message");
      return;
    }
    
    // Use the existing examineItem method with added stat context
    this.examineItem(item);
    
    // Add equipment-specific context
    if (slot === "weapon") {
      const baseAttack = Math.floor(this.game.playerStats.attack / 2);
      this.game.uiManager.print(`\nStat Impact:`, "system-message");
      this.game.uiManager.print(`Base attack bonus: +${baseAttack} (from attack stat)`, "item-stat-detail");
      this.game.uiManager.print(`Weapon damage: +${item.damage}`, "item-stat-detail");
      this.game.uiManager.print(`Total attack: ${baseAttack + item.damage}`, "item-stat-detail");
    } else if (slot === "armor") {
      const baseDefense = Math.floor(this.game.playerStats.defense / 2);
      this.game.uiManager.print(`\nStat Impact:`, "system-message");
      this.game.uiManager.print(`Base defense bonus: +${baseDefense} (from defense stat)`, "item-stat-detail");
      this.game.uiManager.print(`Armor defense: +${item.defense}`, "item-stat-detail");
      this.game.uiManager.print(`Total defense: ${baseDefense + item.defense}`, "item-stat-detail");
    } else if (slot === "accessory" && item.effects) {
      this.game.uiManager.print(`\nStat Impact:`, "system-message");
      Object.entries(item.effects).forEach(([effect, value]) => {
        this.game.uiManager.print(`${this.formatEffectName(effect)}: ${value > 0 ? '+' : ''}${value}`, "item-stat-detail");
      });
    }
  }

  // Method to unequip an item by slot
  unequipItem(slotName) {
    // Normalize slot name to match equipment manager slots
    let slot = slotName;
    if (["weapon", "sword", "axe", "dagger", "staff", "wand"].includes(slotName)) {
      slot = "weapon";
    } else if (["armor", "armour", "chest", "body"].includes(slotName)) {
      slot = "armor";
    } else if (["accessory", "trinket", "amulet", "ring", "necklace"].includes(slotName)) {
      slot = "accessory";
    }
    
    const result = this.game.equipmentManager.unequipItem(slot);
    
    if (result.success) {
      this.game.uiManager.print(result.message, "system-message");
      // Refresh the equipment display
      this.showEquipment();
    } else {
      this.game.uiManager.print(result.message, "error-message");
    }
  }

  // Method to show equipment help
  showEquipmentHelp() {
    this.game.uiManager.print("\n===== EQUIPMENT COMMANDS =====", "system-message");
    this.game.uiManager.print("examine [slot] - Examine weapon, armor, or accessory", "help-text");
    this.game.uiManager.print("unequip [slot] - Remove equipped item", "help-text");
    this.game.uiManager.print("inventory - Go to inventory to equip items", "help-text");
    this.game.uiManager.print("back - Return to game", "help-text");
  }

  // Method to return from equipment screen
  resumeAfterEquipment() {
    console.log("Resuming after equipment. Previous mode:", this.game.previousMode);
    
    // Close the equipment panel first
    if (this.game.equipmentManagerUI) {
      this.game.equipmentManagerUI.toggle(false);
    }
    
    // Restore previous input mode
    this.game.inputMode = this.game.previousMode || "normal";
    this.game.previousMode = null;
    
    console.log("Restored input mode to:", this.game.inputMode);
    
    // Clear output and return to game if needed
    this.game.uiManager.clearOutput();
    if (this.game.inputMode === "normal" || this.game.inputMode === "choices") {
      this.game.gameLogic.playScene();
    } else if (this.game.inputMode === "combat") {
      this.game.combatSystem.showCombatOptions();
    }
  }

  resumeAfterTalent() {
    if (this.game.talentTreeUI) {
      this.game.talentTreeUI.toggle(false);
    }

    this.game.inputMode = this.game.previousMode || "normal";
    this.game.previousMode = null;

    this.game.uiManager.clearOutput();
    if (this.game.inputMode === "normal" || this.game.inputMode === "choices") {
      this.game.gameLogic.playScene();
    } else if (this.game.inputMode === "combat") {
      this.game.combatSystem.showCombatOptions();
    }
  }
}
