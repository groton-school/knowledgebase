type FileDescription = {
  id: string;
  name: string;
  access: string[];
};
export default FileDescription;

function arrEqual(lhs: string[], rhs: string[]): boolean {
  if (lhs.length == rhs.length) {
    lhs.sort();
    rhs.sort();
    for (const i in lhs) {
      if (lhs[i] != rhs[i]) {
        return false;
      }
    }
    return true;
  }
  return false;
}

export function isFileDescription(obj: object): obj is FileDescription {
  return arrEqual(Object.keys(obj), ['id', 'name', 'access']);
}
