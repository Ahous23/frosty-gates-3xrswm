// ...existing code...

playScene() {
  // Get the current scene data
  const scene = this.getCurrentScene();
  if (!scene) {
    console.error("Scene not found:", this.currentScene);
    return;
  }
  
  // Reset input mode to normal for new scene
  this.inputMode = "normal";
  
  // If scene has text, print it with typing effect
  if (scene.text) {
    this.uiManager.clearOutput();
    this.uiManager.printWithTyping(scene.text, () => {
      // After text finishes typing, don't automatically progress
      // Instead, prompt for continuation
      this.uiManager.print("\n<Type 'continue', 'next', or 'done' to proceed>", "hint-text");
      this.inputMode = "awaiting-continuation";
    });
    return;
  }
  
  // Handle other scene types (combat, etc.)
  this.processSceneActions(scene);
}

handleInput(input) {
  const trimmedInput = input.trim().toLowerCase();
  
  // Handle special input modes
  if (this.inputMode === "awaiting-continuation") {
    const continueCommands = ["continue", "next", "done", "complete"];
    if (continueCommands.includes(trimmedInput)) {
      this.inputMode = "normal";
      const scene = this.getCurrentScene();
      this.processSceneActions(scene);
    } else {
      this.uiManager.print("Type 'continue', 'next', or 'done' when you're ready to proceed.", "hint-text");
    }
    return;
  }
  
  // ...existing code for handling other input modes...
}

processSceneActions(scene) {
  // Process scene actions like combat, choices, etc.
  if (scene.combat) {
    this.initiateCombat(scene.combat);
  } else if (scene.choices) {
    this.showChoices(scene.choices);
  } else if (scene.nextScene) {
    this.currentScene = scene.nextScene;
    this.playScene();
  } else {
    // End of chapter/story
    this.uiManager.print("The end... for now.", "system-message");
  }
}

// ...existing code...
