// Keyboard + mouse input, edge-triggered: the game asks "was this pressed since the
// last frame?" so a jump never fires twice from one keypress.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set(); // keys pressed since last consume
    this.clicked = false;
    this.onKey = (e) => {
      const k = e.code;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyP', 'KeyM', 'KeyR', 'Enter'].includes(k)) e.preventDefault();
      if (!e.repeat) this.pressed.add(k);
      this.keys.add(k);
    };
    this.onKeyUp = (e) => this.keys.delete(e.code);
    this.onDown = () => { this.clicked = true; };
    this.onBlur = () => { this.keys.clear(); this.pressed.clear(); };
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    canvas.addEventListener('pointerdown', this.onDown);
  }

  down(...codes) { return codes.some((c) => this.keys.has(c)); }
  hit(...codes) { return codes.some((c) => this.pressed.has(c)); }
  click() { return this.clicked; }

  // Call once per frame after the game has read the inputs.
  endFrame() {
    this.pressed.clear();
    this.clicked = false;
  }
}
