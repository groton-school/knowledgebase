const disclosureTriangleOffset = 10;

/**
 * Add a couple standard stack operations to the almost-stack Array
 */
class Stack extends Array {
  public top = () => this[this.length - 1];
  public isEmpty = () => !this.length;
}

/**
 * Subnav factory
 */
export class Builder {
  private stack: Stack;
  private wrapper: HTMLDivElement;
  private toc: HTMLUListElement;

  /**
   * Start building a subnav
   *
   * Use `add()` method to add elements
   *
   * @param {string} id (Optional) DOM ID
   */
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

  /**
   * Create a new node of the subnav
   * @param {string} innerText Text to display
   * @param {string} href Hyperlink target
   * @param {number} level Depth (like H1, H2, H3)
   * @returns {HTMLLIElement}  - description
   */
  private node(innerText: string, href: string, level: number): HTMLLIElement {
    const node = document.createElement('li');
    const a = document.createElement('a');
    a.href = href;
    a.innerText = innerText;
    node.append(a);
    node.dataset.level = level.toString();
    node.addEventListener('click', (e) => {
      if (e.x - disclosureTriangleOffset < node.getBoundingClientRect().left) {
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

  /**
   * Calculate `data-child-count` for subnav folding
   * @param {HTMLElement} elt Parent? element
   */
  private calcChildCount(elt: HTMLElement) {
    const childCount = 'data-child-count';
    if (elt.lastChild instanceof HTMLUListElement) {
      elt.setAttribute(childCount, elt.lastChild.childElementCount.toString());
    } else {
      elt.setAttribute(childCount, '0');
    }
  }

  /**
   * Add another subnav entry
   * @param {string} innerText Text to display
   * @param {string} href Hyperlink target
   * @param {number} level Depth (like H1, H2, H3)
   */
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

  /**
   * Render the subnav as a DOM element
   */
  public finalize(): HTMLDivElement {
    while (this.stack.top() != this.wrapper) {
      this.calcChildCount(this.stack.pop());
    }
    return this.wrapper;
  }
}
