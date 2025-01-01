// アプリケーション全体で共有する必要があるロジックや状態を実装する
import { useState, createContext, useContext } from 'react';
import { getAllFromIndexedDB } from './utils';
import { TreeNode } from './types';

type ExplorerProps = {
  children?: React.ReactNode;
};

// プロバイダーが提供するロジック・状態
type ExplorerContextType = {
  entries: Map<string, TreeNode>;
  setEntries: (value: Map<string, TreeNode>) => void;
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
  // ファイル・ディレクトリの一覧
  const [entries, setEntries] = useState<Map<string, TreeNode>>(new Map());

  const refreshExplorer = async () => {
    const result = await getAllFromIndexedDB();
    setEntries(result);
  };

  return (
    <ExplorerContext.Provider value={{ entries, setEntries, refreshExplorer }}>
      {children}
    </ExplorerContext.Provider>
  );
};
