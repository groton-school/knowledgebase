class Stack extends Array {
  public top = () => this[this.length - 1];
  public isEmpty = () => !this.length;
}

export class Builder {
  private stack: Stack;
  private wrapper: HTMLDivElement;
  private toc: HTMLUListElement;
  public constructor(id?: string) {
    this.stack = new Stack();
    this.wrapper = document.createElement('div');
    if (id) {
      this.wrapper.id = id;
    }
    this.wrapper.className = 'subnav panel-body od-simpletree';
    this.toc = document.createElement('ul');
    if (id) {
      this.toc.id = `${id}-menu`;
    }
    this.toc.setAttribute('has-icons', '0');
    this.wrapper.append(this.toc);
    this.stack.push(this.wrapper);
  }

  private node(innerText: string, href: string, level: number): HTMLLIElement {
    const node = document.createElement('li');
    const a = document.createElement('a');
    a.href = href;
    a.innerText = innerText;
    node.append(a);
    node.dataset.level = level.toString();
    node.addEventListener('click', (e) => {
      if (e.x < node.getBoundingClientRect().left) {
        if (node.className == 'active') {
          node.className = '';
        } else {
          node.className = 'active';
        }
      }
    });
    return node;
  }

  private nodeLevel = (node: HTMLLIElement) =>
    parseInt(node.dataset.level || '-1');

  private calcChildCount(elt: HTMLElement) {
    if (elt.lastChild instanceof HTMLUListElement) {
      elt.dataset.childCount = elt.lastChild.childElementCount.toString();
    } else {
      elt.dataset.childCount = '0';
    }
  }

  public add(innerText: string, href: string, level: number) {
    const elt = this.node(innerText, href, level);
    while (
      this.stack.top() != this.wrapper &&
      this.nodeLevel(this.stack.top()) >= this.nodeLevel(elt)
    ) {
      this.calcChildCount(this.stack.pop());
    }
    let list = this.stack.top().querySelector('ul');
    if (!list) {
      list = document.createElement('ul');
      this.stack.top().append(list);
    }
    list.append(elt);
    this.stack.push(elt);
  }

  public finalize(): HTMLDivElement {
    while (this.stack.top() != this.wrapper) {
      this.calcChildCount(this.stack.pop());
    }
    return this.wrapper;
  }
}
