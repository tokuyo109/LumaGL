import {
  useState,
  useEffect,
  createContext,
  useContext,
  Dispatch,
  SetStateAction,
} from 'react';
import { useDirectoryState } from './hook';
import { useWindowContext } from '../Window/context';
import Editor from '../Editor';
import {
  getAllFromIndexedDB,
  buildTree,
  takeExtension,
  removeEntry,
} from './utils';
import { TreeNode } from './types';

type ExplorerProps = {
  children?: React.ReactNode;
};

type ExplorerContextType = {
  entries: Map<string, TreeNode>;
  setEntries: (value: Map<string, TreeNode>) => void;
  root: TreeNode | undefined;
  setRoot: Dispatch<SetStateAction<TreeNode | undefined>>;
  selectedPaths: string[];
  setSelectedPaths: Dispatch<SetStateAction<string[]>>;
  onSelect: (
    node: TreeNode,
    e?:
      | KeyboardEvent
      | React.MouseEvent<HTMLLIElement | HTMLDivElement, MouseEvent>,
  ) => void;
  isFocused: boolean;
  setIsFocused: Dispatch<SetStateAction<boolean>>;
  openDirectories: Record<string, boolean>;
  toggleDirectory: (path: string) => void;
  openDirectory: (path: string) => void;
  closeDirectory: (path: string) => void;
  refreshExplorer: () => void;
};

const ExplorerContext = createContext<ExplorerContextType | undefined>(
  undefined,
);

/**
 * Providerに渡されたvalueの値を返す
 */
export const useExplorerContext = (): ExplorerContextType => {
  const context = useContext(ExplorerContext);
  if (!context) throw new Error('コンテキストが存在しません');
  return context;
};

export const ExplorerProvider = ({ children }: ExplorerProps) => {
  const [root, setRoot] = useState<TreeNode | undefined>(undefined);
  const [entries, setEntries] = useState<Map<string, TreeNode>>(new Map());
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [flatList, setFlatList] = useState<TreeNode[]>([]);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const { openDirectories, toggleDirectory, openDirectory, closeDirectory } =
    useDirectoryState();
  const { setWindows } = useWindowContext();

  const onSelect = (
    node: TreeNode,
    e?:
      | KeyboardEvent
      | React.MouseEvent<HTMLLIElement | HTMLDivElement, MouseEvent>,
  ) => {
    setSelectedPaths((prev) => {
      // Ctrl + 左クリック
      if (e?.type === 'click' && e.ctrlKey) {
        return [...prev, node.path];
        // Shift + 左クリック
      } else if (e?.type === 'click' && e.shiftKey) {
        const last = prev[prev.length - 1];
        const startIndex = flatList.findIndex((n) => n.path === last);
        const lastIndex = flatList.findIndex((n) => n.path === node.path);
        const [from, to] =
          startIndex < lastIndex
            ? [startIndex, lastIndex]
            : [lastIndex, startIndex];
        const newSelection = flatList.slice(from, to + 1).map((n) => n.path);
        return newSelection;
        // Shift + 十字キー
      } else if (e instanceof KeyboardEvent && e.shiftKey) {
        return [...prev, node.path];
        // その他
      } else {
        return [node.path];
      }
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (!isFocused) return;
      if (!flatList.length || !selectedPaths.length) return;

      // 現在選択中のノードのインデックスを取得
      const index = flatList.findIndex(
        (node) => node.path === selectedPaths[selectedPaths.length - 1],
      );
      let nextIndex = index;

      const keyMap = {
        ArrowDown: () => {
          if (index < flatList.length - 1) nextIndex = index + 1;
          const currentNode = flatList[index];

          if (currentNode.path === '/' && !openDirectories['/']) {
            onSelect(currentNode, e);
            return;
          }

          /**
           * 現在のディレクトリが閉じている場合、子以外のノードを選択する
           */
          if (
            currentNode.type === 'directory' &&
            !openDirectories[currentNode.path]
          ) {
            while (nextIndex < flatList.length) {
              const nextNode = flatList[nextIndex];
              // 子以外のノードが見つかった場合
              if (nextNode.parentPath !== currentNode.path) {
                onSelect(nextNode, e);
                break;
              }
              nextIndex += 1;
            }
          } else {
            const node = flatList[nextIndex];
            onSelect(node, e);
          }
        },
        ArrowUp: () => {
          if (index > 0) nextIndex = index - 1;
          const currentNode = flatList[index];
          const nextNode = flatList[nextIndex];

          if (nextNode.path === '/') {
            onSelect(currentNode, e);
            return;
          }

          /**
           * 移動先のノードの親ディレクトリが閉じている場合、
           * その親ディレクトリを選択する
           */
          if (
            nextNode.parentPath in openDirectories &&
            !openDirectories[nextNode.parentPath]
          ) {
            const parentNode = entries.get(nextNode.parentPath);
            if (parentNode) {
              onSelect(parentNode, e);
            }
          } else {
            onSelect(nextNode, e);
          }
        },
        Enter: () => {
          const node = flatList[nextIndex];
          onSelect(node, e);
          if (node.type === 'file') {
            const url = `/entries${node.path}`;
            const extension = takeExtension(node.name);
            if (extension === 'png') {
              setWindows((prev) => {
                return new Map(prev).set(
                  node.path,
                  <img src={url} alt={node.name} />,
                );
              });
            } else {
              setWindows((prev) => {
                return new Map(prev).set(node.path, <Editor node={node} />);
              });
            }
          } else if (node.type === 'directory') {
            toggleDirectory(node.path);
          }
        },
        Delete: async () => {
          const selectedNodes = selectedPaths
            .map((path) => entries.get(path))
            .filter((node): node is TreeNode => !!node);
          const finalNodes = selectedNodes.filter(
            (node) => !selectedPaths.includes(node.parentPath),
          );
          for (const node of finalNodes) {
            const parentNode = entries.get(node.parentPath);
            if (!parentNode) continue;
            await removeEntry(
              parentNode.handle as FileSystemDirectoryHandle,
              node.name,
            );
          }
          refreshExplorer();
        },
      } as const;

      type KeyMapKeys = keyof typeof keyMap;
      if (e.key in keyMap) {
        keyMap[e.key as KeyMapKeys]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flatList, selectedPaths, isFocused]);

  useEffect(() => {
    (async () => {
      const entries = await getAllFromIndexedDB();
      setEntries(entries);
      setRoot(buildTree(entries));
    })();
  }, []);

  useEffect(() => {
    setFlatList([...entries.values()]);
  }, [entries]);

  const refreshExplorer = async () => {
    const result = await getAllFromIndexedDB();
    setEntries(result);
    setRoot(buildTree(result));
  };

  return (
    <ExplorerContext.Provider
      value={{
        entries,
        setEntries,
        root,
        setRoot,
        refreshExplorer,
        selectedPaths,
        setSelectedPaths,
        onSelect,
        isFocused,
        setIsFocused,
        openDirectories,
        toggleDirectory,
        openDirectory,
        closeDirectory,
      }}
    >
      {children}
    </ExplorerContext.Provider>
  );
};
