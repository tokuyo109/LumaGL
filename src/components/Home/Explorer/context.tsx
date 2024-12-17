import { createContext, useContext, useState } from 'react';
import { EntryNode } from './types';
import { buildTree } from './utils';

type ExplorerProps = {
  children?: React.ReactNode;
};

type ExplorerContextType = {
  tree: EntryNode | null;
  setTree: (tree: EntryNode | null) => void;
  rootHandle: FileSystemDirectoryHandle | null;
  setRootHandle: (handle: FileSystemDirectoryHandle | null) => void;
  refreshExplorer: () => void;
};

const ExplorerContext = createContext<ExplorerContextType | undefined>(
  undefined,
);

export const ExplorerProvider = ({ children }: ExplorerProps) => {
  const [tree, setTree] = useState<EntryNode | null>(null);
  const [rootHandle, setRootHandle] =
    useState<FileSystemDirectoryHandle | null>(null);

  const refreshExplorer = async () => {
    if (!rootHandle) return;
    const newTree = await buildTree(rootHandle);
    setTree(newTree);
  };

  return (
    <ExplorerContext.Provider
      value={{ tree, setTree, rootHandle, setRootHandle, refreshExplorer }}
    >
      {children}
    </ExplorerContext.Provider>
  );
};

export const useExplorerContext = (): ExplorerContextType => {
  const context = useContext(ExplorerContext);
  if (!context) {
    throw new Error('コンテキストが存在しません');
  }
  return context;
};
