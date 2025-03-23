export class GameLogic {
  constructor(game) {
    this.game = game;
  }

  async playScene() {
    try {
      const sceneLoaded = await this.ensureSceneLoaded(this.game.currentScene);
      if (!sceneLoaded) {
        this.handleSceneLoadError();
        return;
      }

      const scene = this.game.storyContent[this.game.currentScene];
      this.game.uiManager.clearOutput();
      
      if (scene.text) {
        await this.game.typeText(scene.text);
      }

      if (scene.items) {
        this.addItemsToInventory(scene.items);
        this.game.uiManager.print("\nAcquired items:", "system-message");
        scene.items.forEach((item) => {
          this.game.uiManager.print(`- ${item.name} ${item.quantity > 1 ? `(x${item.quantity})` : ""}`, "item-name");
        });
        this.game.uiManager.print("", ""); // Add a blank line
      }

      // Check if this scene has combat
      if (scene.combat) {
        // Instead of immediately initiating combat, wait for player to continue
        this.game.uiManager.print("\nType 'continue' to proceed to combat...", "system-message");
        this.game.inputMode = "await-combat";
        this.game.combatToInitiate = scene.combat; // Store the combat info directly
        return;
      }

      if (scene.type === "stats") {
        this.showStatAllocation(scene.nextScene);
      } else if (scene.choices) {
        this.showChoices(scene.choices);
      } else if (scene.nextScene) {
        // Instead of automatically going to the next scene, wait for player to continue
        this.game.uiManager.print("\nType 'continue' to proceed...", "system-message");
        this.game.inputMode = "await-continue";
        this.game.nextSceneToLoad = scene.nextScene; // Store the next scene
      }
    } catch (error) {
      console.error("Error playing scene:", error);
      this.handleSceneLoadError();
    }
  }

  initiateCombat(scene) {
    // Store the scenes to navigate to after combat
    this.game.nextSceneAfterCombat = scene.combat.nextScene;
    this.game.defeatSceneAfterCombat = scene.combat.defeatScene;
    
    // If enemy is a string ID, get it from lootSystem
    if (typeof scene.combat.enemy === 'string' && this.game.lootSystem) {
      const enemy = this.game.lootSystem.getEnemy(scene.combat.enemy);
      if (enemy) {
        // Start combat with the specified enemy
        this.game.combatSystem.initiateCombat(enemy);
        return;
      }
    }
    
    // Fallback to direct enemy object if provided or if lootSystem failed
    this.game.combatSystem.initiateCombat(scene.combat.enemy);
  }

  addItemsToInventory(items) {
    if (!items || !items.length) return;

    items.forEach((newItem) => {
      // Check if the item already exists in inventory
      const existingItem = this.game.inventory.find((item) => item.id === newItem.id);
      
      if (existingItem && newItem.stackable !== false) {
        // Increase quantity for stackable items
        existingItem.quantity = (existingItem.quantity || 1) + (newItem.quantity || 1);
      } else {
        // Add new item to inventory
        this.game.inventory.push({
          ...newItem,
          quantity: newItem.quantity || 1
        });
      }
    });
  }

  async typeText(text) {
    this.game.isTyping = true;
    this.game.gameInput.disabled = true;

    const element = document.createElement("div");
    element.className = "typed-text";
    this.game.gameOutput.appendChild(element);

    for (let i = 0; i < text.length; i++) {
      if (!this.game.isTyping) {
        element.textContent = text;
        this.game.gameOutput.scrollTop = this.game.gameOutput.scrollHeight;
        break;
      }
      element.textContent += text.charAt(i);
      this.game.gameOutput.scrollTop = this.game.gameOutput.scrollHeight;
      await new Promise((resolve) => setTimeout(resolve, this.game.typingSpeed));
    }

    this.game.isTyping = false;
    this.game.gameInput.disabled = false;
    this.game.gameInput.focus();
  }

  async ensureSceneLoaded(sceneId) {
    if (this.game.storyContent[sceneId]) return true;
    const chapterId = this.game.getChapterForScene(sceneId);
    if (!chapterId) {
      console.error(`Cannot determine chapter for scene: ${sceneId}`);
      return false;
    }
    return await this.game.loadChapter(chapterId);
  }

  getChapterForScene(sceneId) {
    for (const [chapterId, info] of Object.entries(this.game.storyIndex.sceneMapping)) {
      if (info.scenes.includes(sceneId)) {
        return chapterId;
      }
    }
    return null;
  }

  handleSceneLoadError() {
    this.game.uiManager.print("Error loading the next part of the story. Please try again.", "error-message");
    this.game.inputMode = "errorRecovery";
  }

  showStatAllocation(nextScene) {
    this.game.awaitingInput = true;
    this.game.inputMode = "stats";
    this.game.uiManager.print("Allocate your stat points:", "system-message");
    this.game.uiManager.print(`Available points: ${this.game.availableStatPoints}`, "system-message");
    Object.keys(this.game.playerStats).forEach((stat) => {
      this.game.uiManager.print(`${stat}: ${this.game.playerStats[stat]}`, "player-stat");
    });
    this.game.uiManager.print("Enter the stat you want to increase (e.g., 'attack'):", "system-message");
    this.game.nextScene = nextScene;
  }

  showChoices(choices) {
    this.game.uiManager.print("\nWhat will you do?", "system-message");
    choices.forEach((choice, index) => {
      // Check if this choice has a requirement
      let canChoose = true;
      let reqText = "";
      
      if (choice.requires) {
        if (choice.requires.stat) {
          for (const [stat, value] of Object.entries(choice.requires.stat)) {
            if ((this.game.playerStats[stat] || 0) < value) {
              canChoose = false;
              reqText = ` (Requires ${stat}: ${value})`;
            }
          }
        }
        
        if (choice.requires.item) {
          const requiredItem = choice.requires.item;
          const hasItem = this.game.inventory.some(
            (item) => item.id === requiredItem.id && (item.quantity || 0) >= (requiredItem.quantity || 1)
          );
          if (!hasItem) {
            canChoose = false;
            reqText = ` (Requires ${requiredItem.name})`;
          }
        }
      }
      
      // Display the choice
      const choiceClass = canChoose ? "choice" : "choice disabled";
      this.game.uiManager.print(`${index + 1}. ${choice.text}${reqText}`, choiceClass);
      
      // Store the choice data on the element
      const elements = this.game.gameOutput.querySelectorAll(`.${choiceClass}`);
      const element = elements[elements.length - 1];
      if (element) {
        element.dataset.index = index;
        element.dataset.canChoose = canChoose;
      }
    });
    
    this.game.inputMode = "choices";
    this.game.choicesData = choices;
  }

  handleChoiceInput(input) {
    if (!this.game.choicesData) return;
    
    // Check if input is a valid choice number
    const choiceIndex = parseInt(input) - 1;
    if (isNaN(choiceIndex) || choiceIndex < 0 || choiceIndex >= this.game.choicesData.length) {
      this.game.uiManager.print("Invalid choice. Please enter a valid option number.", "error-message");
      return;
    }
    
    const choice = this.game.choicesData[choiceIndex];
    
    // Check requirements again
    let canChoose = true;
    
    if (choice.requires) {
      if (choice.requires.stat) {
        for (const [stat, value] of Object.entries(choice.requires.stat)) {
          if ((this.game.playerStats[stat] || 0) < value) {
            canChoose = false;
          }
        }
      }
      
      if (choice.requires.item) {
        const requiredItem = choice.requires.item;
        const hasItem = this.game.inventory.some(
          (item) => item.id === requiredItem.id && (item.quantity || 0) >= (requiredItem.quantity || 1)
        );
        if (!hasItem) {
          canChoose = false;
        }
      }
    }
    
    if (!canChoose) {
      this.game.uiManager.print("You don't meet the requirements for that choice.", "error-message");
      return;
    }
    
    // Handle item consumption if required
    if (choice.requires && choice.requires.item) {
      const requiredItem = choice.requires.item;
      const inventoryItem = this.game.inventory.find(item => item.id === requiredItem.id);
      if (inventoryItem) {
        inventoryItem.quantity -= requiredItem.quantity || 1;
        if (inventoryItem.quantity <= 0) {
          // Remove item from inventory if quantity is zero
          this.game.inventory = this.game.inventory.filter(item => item.id !== requiredItem.id);
        }
      }
    }
    
    // Process choice
    this.game.uiManager.print(`\nYou chose: ${choice.text}`, "system-message");
    this.game.inputMode = "normal";
    
    setTimeout(() => {
      this.game.uiManager.clearOutput();
      this.game.currentScene = choice.nextScene;
      this.playScene();
    }, 1500);
  }

  handleCustomItemEffect(item) {
    switch (item.id) {
      case "healingSalve":
        this.game.gameState.isInjured = false;
        break;
      // Add more custom effects as needed
    }
  }
}