import FileDescription from './FileDescription';

type FolderDescription = {
  '.': FileDescription;
  [name: string]: FileDescription | FolderDescription;
};
export default FolderDescription;
