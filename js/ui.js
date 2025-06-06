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
    if (className === "system-message" || className === "error-message") {
      this.gameOutput
        .querySelectorAll(`.${className}`)
        .forEach((el) => el.remove());
    }
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

  getOutputHTML() {
    return this.gameOutput.innerHTML;
  }

  setOutputHTML(html) {
    this.gameOutput.innerHTML = html;
  }
}

export async function fadeTransition(callback) {
  const container = document.querySelector('.game-container');
  if (!container) {
    await callback();
    return;
  }

  container.classList.add('fade-out');
  await new Promise((r) => setTimeout(r, 500));
  await callback();
  container.classList.remove('fade-out');
  container.classList.add('fade-in');
  setTimeout(() => container.classList.remove('fade-in'), 500);
}
