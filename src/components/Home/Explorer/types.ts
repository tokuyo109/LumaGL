export type Handle = FileSystemFileHandle | FileSystemDirectoryHandle;

export type Entry = {
  path: string;
  parentPath: string;
  name: string;
  type: 'directory' | 'file';
  handle: Handle;
};

export type TreeNode = Entry & { children: TreeNode[] };

export type Root = {
  path: string;
  handle: FileSystemDirectoryHandle
} | undefined;
