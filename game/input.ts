import type { Action } from './core.ts';
/** One move per physical press, with independent ownership for simultaneous fingers. */
export class TouchInput {
  private pointers = new Map<number, Action>();
  get size() {
    return this.pointers.size;
  }
  get held(): Action[] {
    return [...new Set(this.pointers.values())];
  }
  press(pointerId: number, action: Action): boolean {
    if (this.pointers.has(pointerId)) return false;
    const alreadyHeld = this.held.includes(action);
    this.pointers.set(pointerId, action);
    return !alreadyHeld;
  }
  release(pointerId: number) {
    this.pointers.delete(pointerId);
  }
  clear() {
    this.pointers.clear();
  }
}
