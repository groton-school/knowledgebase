import Helper from '../Helper';

type Sublist = { id: string; depth: number; list: Element };

export default function RenestLists() {
  Helper.onGoogleDocEmbed('ul,ol', (lists) => {
    const stack = new Helper.Stack<Sublist>();
    lists.forEach((list) => {
      const match = list.className.match(/lst-([a-z0-9_]+)-(\d+)/);
      if (match?.length) {
        const id = match[1];
        const depth = parseInt(match[2]);
        const start = list.classList.contains('start');
        if (stack.length && id === stack.top().id) {
          if (depth > stack.top().depth) {
            while (depth > stack.top().depth + 1) {
              const wrapper = document.createElement(list.tagName);
              stack.top().list.appendChild(wrapper);
              stack.push({ id, depth: stack.top().depth + 1, list: wrapper });
            }
            stack.top().list.appendChild(list);
            Helper.log(
              `renested lst-${id}-${depth} within lst-${id}-${depth - 1}`
            );
          } else {
            while (depth < stack.top().depth) {
              stack.pop();
            }
            for (const child of list.children) {
              stack.top().list.appendChild(child);
            }
            Helper.log(`reconnected lst-${id}-${depth}'s elements`);
          }
        } else {
          stack.clear();
        }
        stack.push({ id, depth, list });
      }
    });
  });
}
