export type EntryNode = {
  id: string;
  name: string;
  kind: 'directory' | 'file';
  handle: FileSystemHandle;
  // children?: Node[]; // React childrenと被るため変更
  childNodes?: EntryNode[];
};
