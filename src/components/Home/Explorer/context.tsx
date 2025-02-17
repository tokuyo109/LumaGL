// アプリケーション全体で共有する必要があるロジックや状態を実装する
import {
  useState,
  createContext,
  useContext,
  Dispatch,
  SetStateAction,
} from 'react';
import { getAllFromIndexedDB } from './utils';
import { TreeNode } from './types';

type ExplorerProps = {
  children?: React.ReactNode;
};

// プロバイダーが提供するロジック・状態
type ExplorerContextType = {
  entries: Map<string, TreeNode>;
  setEntries: (value: Map<string, TreeNode>) => void;
  selectEntries: Map<string, TreeNode>;
  setSelectEntries: Dispatch<SetStateAction<Map<string, TreeNode>>>;
  isSelectEntry: (path: string) => boolean;
  toggleSelectEntry: (node: TreeNode) => void;
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

/**
 * プロバイダーコンポーネント
 * これより下に存在するコンポーネントはこのコンテキストの値を利用することができる
 */
export const ExplorerProvider = ({ children }: ExplorerProps) => {
  const [selectEntries, setSelectEntries] = useState<Map<string, TreeNode>>(
    new Map(),
  );
  const [entries, setEntries] = useState<Map<string, TreeNode>>(new Map());

  const refreshExplorer = async () => {
    const result = await getAllFromIndexedDB();
    setEntries(result);
  };

  /**
   * 要素が選択されているかを真偽値で返す関数
   */
  const isSelectEntry = (path: string) => {
    return selectEntries.has(path);
  };

  /**
   * 要素の選択状態を切り替える
   */
  const toggleSelectEntry = (node: TreeNode) => {
    setSelectEntries((prev) => {
      const newMap = new Map(prev);
      if (isSelectEntry(node.path)) {
        newMap.delete(node.path);
      } else {
        newMap.set(node.path, node);
      }
      return newMap;
    });
  };

  return (
    <ExplorerContext.Provider
      value={{
        entries,
        setEntries,
        selectEntries,
        setSelectEntries,
        refreshExplorer,
        isSelectEntry,
        toggleSelectEntry,
      }}
    >
      {children}
    </ExplorerContext.Provider>
  );
};
