export class UIPanel {
  constructor(panel) {
    this.panel = panel;
    this.visible = false;
  }

  show() {
    if (!this.panel) return;
    this.panel.style.display = 'flex';
    this.panel.classList.add('visible');
    requestAnimationFrame(() => this.panel.classList.remove('hidden'));
    this.visible = true;
  }

  hide() {
    if (!this.panel) return;
    this.panel.classList.add('hidden');
    this.panel.classList.remove('visible');
    const onEnd = () => {
      if (!this.visible) {
        this.panel.style.display = 'none';
      }
      this.panel.removeEventListener('transitionend', onEnd);
    };
    this.panel.addEventListener('transitionend', onEnd);
    this.visible = false;
  }

  toggle(show = !this.visible) {
    show ? this.show() : this.hide();
  }
}
