class Game {
  constructor() {
    this.currentScene = null;
    this.playerStats = {
      attack: 5,
      defense: 5,
      charisma: 5,
      speed: 5,
      luck: 5,
    };
    this.typingSpeed = 30; // milliseconds per character
    this.gameState = {};
    this.availableStatPoints = 10;

    // Story content
    this.storyContent = {};
    this.storyIndex = null;

    // Typing variables
    this.isTyping = false;
    this.fullText = "";

    // DOM elements
    this.titleScreen = document.getElementById("titleScreen");
    this.gameScreen = document.getElementById("gameScreen");
    this.storyText = document.getElementById("storyText");
    this.choicesContainer = document.getElementById("choicesContainer");
    this.statAllocation = document.getElementById("statAllocation");
    this.saveCodeOutput = document.getElementById("saveCodeOutput");
    this.saveCodeDisplay = document.getElementById("saveCodeDisplay");
    this.skipTypingBtn = document.getElementById("skipTypingBtn");
    this.newGameBtn = document.getElementById("newGameBtn");
    this.loadingIndicator = document.getElementById("loadingIndicator");

    // Load story content
    this.loadStoryIndex();

    // Bind event listeners
    this.newGameBtn.addEventListener("click", () => this.startNewGame());
    document
      .getElementById("loadGameBtn")
      .addEventListener("click", () => this.showLoadGameArea());
    document
      .getElementById("submitLoadBtn")
      .addEventListener("click", () => this.loadGame());
    document
      .getElementById("saveGameBtn")
      .addEventListener("click", () => this.saveGame());
    document
      .getElementById("copySaveBtn")
      .addEventListener("click", () => this.copyToClipboard());
    this.skipTypingBtn.addEventListener("click", () => this.completeTyping());
  }

  async loadStoryIndex() {
    try {
      const response = await fetch("story/index.json");
      if (!response.ok)
        throw new Error(`Failed to fetch story index: ${response.status}`);

      this.storyIndex = await response.json();

      // Load initial chapter
      await this.loadChapter("chapter1");

      // Enable start button and hide loading indicator
      this.newGameBtn.disabled = false;
      this.loadingIndicator.classList.add("hidden");
    } catch (error) {
      console.error("Failed to load story index:", error);
      this.loadingIndicator.textContent =
        "Error loading story content. Please refresh the page.";
    }
  }

  async loadChapter(chapterId) {
    if (!this.storyIndex.chapters[chapterId]) {
      console.error(`Chapter ${chapterId} not found in index`);
      return false;
    }

    try {
      const path = this.storyIndex.chapters[chapterId];
      const response = await fetch(path);
      if (!response.ok)
        throw new Error(`Failed to fetch chapter: ${response.status}`);

      const chapterContent = await response.json();

      // Merge new content with existing content
      this.storyContent = { ...this.storyContent, ...chapterContent.scenes };
      return true;
    } catch (error) {
      console.error(`Failed to load chapter ${chapterId}:`, error);
      return false;
    }
  }

  async ensureSceneLoaded(sceneId) {
    // If scene is already loaded, we're good
    if (this.storyContent[sceneId]) return true;

    // Otherwise, determine which chapter to load
    const chapterId = this.getChapterForScene(sceneId);
    if (!chapterId) {
      console.error(`Cannot determine chapter for scene: ${sceneId}`);
      return false;
    }

    return await this.loadChapter(chapterId);
  }

  getChapterForScene(sceneId) {
    // Check mapping in storyIndex
    for (const [chapterId, info] of Object.entries(
      this.storyIndex.sceneMapping
    )) {
      if (info.scenes.includes(sceneId)) {
        return chapterId;
      }
    }
    return null;
  }

  startNewGame() {
    this.titleScreen.classList.add("hidden");
    this.gameScreen.classList.remove("hidden");
    this.currentScene = "intro";
    this.playScene();
  }

  showLoadGameArea() {
    const loadGameArea = document.getElementById("loadGameArea");
    loadGameArea.classList.remove("hidden");
  }

  async typeText(text) {
    this.storyText.innerHTML = "";
    this.fullText = text; // Store the full text
    this.isTyping = true;

    // Show skip button during typing
    this.skipTypingBtn.classList.remove("hidden");

    for (let i = 0; i < text.length; i++) {
      // Check if typing was interrupted by skip button
      if (!this.isTyping) break;

      this.storyText.innerHTML += text.charAt(i);
      await new Promise((resolve) => setTimeout(resolve, this.typingSpeed));
    }

    // Ensure full text is displayed and hide skip button
    this.storyText.innerHTML = this.fullText;
    this.skipTypingBtn.classList.add("hidden");
    this.isTyping = false;
  }

  completeTyping() {
    // Stop the typing animation and show full text immediately
    this.isTyping = false;
    this.storyText.innerHTML = this.fullText;
    this.skipTypingBtn.classList.add("hidden");
  }

  async playScene() {
    // Ensure the scene is loaded
    const sceneLoaded = await this.ensureSceneLoaded(this.currentScene);
    if (!sceneLoaded) {
      this.storyText.innerHTML =
        "Error loading scene content. Please try again.";
      return;
    }

    const scene = this.storyContent[this.currentScene];

    // Clear previous content
    this.choicesContainer.classList.add("hidden");
    this.choicesContainer.innerHTML = "";
    this.statAllocation.classList.add("hidden");
    this.skipTypingBtn.classList.add("hidden"); // Ensure skip button is hidden initially

    // Type out the scene text
    await this.typeText(scene.text);

    // Handle the next step based on scene type
    if (scene.type === "stats") {
      this.showStatAllocation(scene.nextScene);
    } else if (scene.choices) {
      this.showChoices(scene.choices);
    }
  }

  showChoices(choices) {
    this.choicesContainer.innerHTML = "";

    choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.className = "choice-btn";
      button.textContent = choice.text;
      button.addEventListener("click", () => {
        this.makeChoice(choice.nextScene);
      });
      this.choicesContainer.appendChild(button);
    });

    this.choicesContainer.classList.remove("hidden");
  }

  makeChoice(nextScene) {
    this.currentScene = nextScene;
    this.playScene();
  }

  showStatAllocation(nextScene) {
    this.statAllocation.innerHTML = "";

    // Display remaining points
    const pointsDiv = document.createElement("div");
    pointsDiv.className = "points-remaining";
    pointsDiv.textContent = `Remaining points: ${this.availableStatPoints}`;
    this.statAllocation.appendChild(pointsDiv);

    // Create UI for each stat
    for (const stat in this.playerStats) {
      const statItem = document.createElement("div");
      statItem.className = "stat-item";

      const statLabel = document.createElement("div");
      statLabel.className = "stat-label";
      statLabel.textContent = stat.charAt(0).toUpperCase() + stat.slice(1);

      const statControls = document.createElement("div");
      statControls.className = "stat-controls";

      const decreaseBtn = document.createElement("button");
      decreaseBtn.className = "stat-btn";
      decreaseBtn.textContent = "-";
      decreaseBtn.addEventListener("click", () => this.adjustStat(stat, -1));

      const statValue = document.createElement("div");
      statValue.className = "stat-value";
      statValue.textContent = this.playerStats[stat];
      statValue.id = `${stat}-value`;

      const increaseBtn = document.createElement("button");
      increaseBtn.className = "stat-btn";
      increaseBtn.textContent = "+";
      increaseBtn.addEventListener("click", () => this.adjustStat(stat, 1));

      statControls.appendChild(decreaseBtn);
      statControls.appendChild(statValue);
      statControls.appendChild(increaseBtn);

      statItem.appendChild(statLabel);
      statItem.appendChild(statControls);

      this.statAllocation.appendChild(statItem);
    }

    // Add confirm button
    const confirmBtn = document.createElement("button");
    confirmBtn.className = "confirm-stats-btn";
    confirmBtn.textContent = "Confirm Stats";
    confirmBtn.addEventListener("click", () => {
      this.currentScene = nextScene;
      this.playScene();
    });

    this.statAllocation.appendChild(confirmBtn);
    this.statAllocation.classList.remove("hidden");
  }

  adjustStat(stat, change) {
    // Prevent stats from going below 1 or using more points than available
    if (change < 0 && this.playerStats[stat] <= 1) return;
    if (change > 0 && this.availableStatPoints <= 0) return;

    this.playerStats[stat] += change;
    this.availableStatPoints -= change;

    // Update UI
    document.getElementById(`${stat}-value`).textContent =
      this.playerStats[stat];
    document.querySelector(
      ".points-remaining"
    ).textContent = `Remaining points: ${this.availableStatPoints}`;
  }

  saveGame() {
    const saveData = {
      currentScene: this.currentScene,
      playerStats: this.playerStats,
      gameState: this.gameState,
    };

    // Convert to base64 for a more compact representation
    const saveString = btoa(JSON.stringify(saveData));
    this.saveCodeOutput.value = saveString;
    this.saveCodeDisplay.classList.remove("hidden");
  }

  loadGame() {
    try {
      const saveCode = document.getElementById("saveCodeInput").value;
      const saveData = JSON.parse(atob(saveCode));

      // Restore game state
      this.currentScene = saveData.currentScene;
      this.playerStats = saveData.playerStats;
      this.gameState = saveData.gameState;

      // Ensure the scene content is loaded before proceeding
      this.ensureSceneLoaded(this.currentScene).then((loaded) => {
        if (loaded) {
          // Switch to game screen
          this.titleScreen.classList.add("hidden");
          this.gameScreen.classList.remove("hidden");

          // Play current scene
          this.playScene();
        } else {
          alert("Error loading game content. Please try again.");
        }
      });
    } catch (error) {
      alert("Invalid save code. Please try again.");
      console.error(error);
    }
  }

  copyToClipboard() {
    this.saveCodeOutput.select();
    document.execCommand("copy");
    alert("Save code copied to clipboard!");
  }
}

// Initialize the game when the page loads
window.onload = () => {
  const game = new Game();
};
