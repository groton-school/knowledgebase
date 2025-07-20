export class Stack<T> extends Array<T> {
  public top(): T {
    return this[this.length - 1];
  }

  public clear() {
    while (this.length) {
      this.pop();
    }
  }
}
