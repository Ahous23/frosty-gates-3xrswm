// ...existing code...

constructor() 
{
  // ... your existing initialization code ...
  
  // Initialize notes system
  this.initNotes();
}

playScene() 
{
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

handleInput(input) 
{
  const trimmedInput = input.trim().toLowerCase();
  
  // Global commands that should work in ANY mode
  if (trimmedInput === "notes" || trimmedInput === "note") {
    this.toggleNotes();
    return;
  }
  
  // Save and load commands should also work in any mode
  if (trimmedInput === "save") {
    this.saveGame();
    return;
  }
  
  if (trimmedInput === "load") {
    this.loadGame();
    return;
  }
  
  if (trimmedInput === "help") {
    this.showHelp();
    return;
  }
  
  // Then check for mode-specific inputs
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
  
  // ...other input mode handlers...
}

processSceneActions(scene) 
{
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

// Add these methods to your Game class

initNotes() 
{
  // Set up notes panel
  this.notesVisible = false;
  this.notesContent = "";
  
  // Get DOM elements
  this.notesPanel = document.getElementById('notes-panel');
  this.notesEditor = document.getElementById('notes-editor');
  const closeNotesBtn = document.getElementById('close-notes');
  
  // Setup event listeners
  closeNotesBtn.addEventListener('click', () => this.toggleNotes());
  
  // Auto-save notes when content changes (with debounce)
  let timeout = null;
  this.notesEditor.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      this.notesContent = this.notesEditor.innerHTML;
    }, 500);
  });
}

toggleNotes() 
{
  this.notesVisible = !this.notesVisible;
  if (this.notesVisible) {
    this.notesPanel.classList.remove('hidden');
  } else {
    this.notesPanel.classList.add('hidden');
  }
}

saveNotes() 
{
  // Capture current notes content
  this.notesContent = this.notesEditor.innerHTML;
  return this.notesContent;
}

loadNotes(notesContent) 
{
  if (notesContent) {
    this.notesContent = notesContent;
    this.notesEditor.innerHTML = this.notesContent;
  }
}

// Update your existing save/load methods

saveGame() 
{
  // Get existing save data
  const saveData = {
    // ... your existing save data
    currentScene: this.currentScene,
    playerStats: this.player.getStats(),
    inventory: this.player.getInventory(),
    // Add notes to save data
    notes: this.saveNotes()
  };
  
  localStorage.setItem('gameState', JSON.stringify(saveData));
  this.uiManager.print("Game saved successfully!", "system-message");
}

loadGame() 
{
  const savedState = localStorage.getItem('gameState');
  if (!savedState) {
    this.uiManager.print("No saved game found.", "system-message");
    return false;
  }
  
  try {
    const saveData = JSON.parse(savedState);
    
    // Load all your existing game data
    this.currentScene = saveData.currentScene;
    this.player.loadStats(saveData.playerStats);
    this.player.loadInventory(saveData.inventory);
    
    // Load notes
    if (saveData.notes) {
      this.loadNotes(saveData.notes);
    }
    
    this.uiManager.print("Game loaded successfully!", "system-message");
    this.playScene();
    return true;
  } catch (error) {
    console.error("Error loading save:", error);
    this.uiManager.print("Error loading save game.", "system-message");
    return false;
  }
}

// Update your help text or command list

showHelp() 
{
  this.uiManager.print("Available commands:", "system-message");
  // ... your existing commands ...
  this.uiManager.print("- notes: Open or close the notes panel", "command-help");
  // ... other commands ...
}

// ...existing code...
