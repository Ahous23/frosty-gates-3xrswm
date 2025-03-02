export class GameLogic {
  constructor(game) {
    this.game = game;
  }

  async playScene() {
    const sceneLoaded = await this.ensureSceneLoaded(this.game.currentScene);
    if (!sceneLoaded) {
      this.handleSceneLoadError();
      return;
    }

    const scene = this.game.storyContent[this.game.currentScene];
    this.game.uiManager.clearOutput();
    await this.typeText(scene.text);

    if (scene.items) {
      this.addItemsToInventory(scene.items);
      this.game.uiManager.print("\nAcquired items:", "system-message");
      scene.items.forEach((item) => {
        this.game.uiManager.print(`- ${item.name} ${item.quantity > 1 ? `(x${item.quantity})` : ""}`, "item-name");
      });
      this.game.uiManager.print("", ""); // Add a blank line
    }

    if (scene.type === "stats") {
      this.showStatAllocation(scene.nextScene);
    } else if (scene.choices) {
      this.showChoices(scene.choices);
    } else if (scene.nextScene) {
      setTimeout(() => {
        this.game.uiManager.clearOutput();
        this.game.currentScene = scene.nextScene;
        this.playScene();
      }, 2000);
    }
  }

  addItemsToInventory(items) {
    items.forEach((item) => {
      const existingItem = this.game.inventory.find((invItem) => invItem.id === item.id);
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        this.game.inventory.push(item);
      }
      
      if (item.effect) {
        this.handleCustomItemEffect(item);
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
    const chapterId = this.getChapterForScene(sceneId);
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
    this.game.uiManager.print("Error: Scene could not be loaded.", "error-message");
    this.game.uiManager.print("Please type 'restart' to go back to the title screen or 'continue' to try again.", "error-message");
    this.game.inputMode = "errorRecovery";
    this.game.awaitingInput = true;
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
    this.game.awaitingInput = true;
    this.game.inputMode = "choices";
    choices.forEach((choice, index) => {
      this.game.uiManager.print(`${index + 1}. ${choice.text}`, "choice");
    });
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