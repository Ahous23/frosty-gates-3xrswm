export class UIManager {
  constructor(gameOutput, gameInput) {
    this.gameOutput = gameOutput;
    this.gameInput = gameInput;
    this.inputContainer = gameInput.parentElement;
    
    // Make sure the prompt exists
    if (!this.inputContainer.querySelector('.prompt')) {
      const prompt = document.createElement('div');
      prompt.className = 'prompt';
      prompt.textContent = '>';
      this.inputContainer.insertBefore(prompt, this.gameInput);
    }
    
    // Focus the input field on click anywhere in the input container
    this.inputContainer.addEventListener('click', () => {
      this.gameInput.focus();
    });
  }

  clearOutput() {
    this.gameOutput.innerHTML = "";
  }

  clearInput() {
    this.gameInput.value = "";
  }

  print(text, className = "") {
    const element = document.createElement("div");
    if (className) element.className = className;
    element.textContent = text;
    this.gameOutput.appendChild(element);
    this.gameOutput.scrollTop = this.gameOutput.scrollHeight;
  }

  async typeIntoElement(element, text, typingSpeed, audioManager) {
    let currentText = element.innerHTML;
    audioManager.playTypingSound();
    
    for (let i = 0; i < text.length; i++) {
      currentText += text.charAt(i);
      element.innerHTML = currentText;
      await new Promise((resolve) => setTimeout(resolve, typingSpeed));
    }
    
    audioManager.stopTypingSound();
  }
  
  focusInput() {
    this.gameInput.focus();
  }
  
  showInputContainer() {
    this.inputContainer.style.display = 'flex';
  }
  
  hideInputContainer() {
    this.inputContainer.style.display = 'none';
  }
}