/**
 * 再利用なロジックを抽出したファイル
 * 複数のコンポーネントで同じロジックを共有する場合に使用する
 */
import { useState } from 'react';

/**
 * ディレクトリの開閉を管理するState
 */
export const useDirectoryState = () => {
  const [openDirectories, setOpenDirectories] = useState<Record<string, boolean>>({});

  const onToggleDirectory = (id: string) => {
    setOpenDirectories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return { openDirectories, onToggleDirectory };
};