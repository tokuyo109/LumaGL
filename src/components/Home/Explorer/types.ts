export type EntryNode = {
  id: string;
  name: string;
  kind: 'directory' | 'file';
  handle: FileSystemHandle;
  // children?: Node[]; // React childrenと被るため変更
  childNodes?: EntryNode[];
};

export type Handle = FileSystemFileHandle | FileSystemDirectoryHandle;

export type Entry = {
  path: string; // エントリーパス
  parentPath: string; // 親エントリーパス
  name: string; // エントリー名
  type: 'directory' | 'file'; // エントリータイプ
  handle: Handle;
};

export type TreeNode = Entry & { children: TreeNode[] };
