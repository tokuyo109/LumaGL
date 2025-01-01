/**
 * 再利用可能なロジックを切り出したファイル
 * コンポーネント間で状態を共有するために用い、Reactの機能に依存する
 */
import {  useReducer } from 'react';

/**
 * ディレクトリアクションの種類
 */
type DirectoryAction = 
| { type: 'TOGGLE'; path: string }
| { type: 'OPEN'; path: string }
| { type: 'CLOSE'; path: string };

/**
 * ディレクトリの開閉状態を管理するReducer
 */
const directoryReducer = (state: Record<string, boolean>, action: DirectoryAction): Record<string, boolean> => {
  switch (action.type) {
    case 'TOGGLE':
      return {
        ...state,
        [action.path]: !state[action.path],
      };
    case 'OPEN':
      return {
        ...state,
        [action.path]: true,
      };
    case 'CLOSE':
      return {
        ...state,
        [action.path]: false,
      };
  }
};

/**
 * ディレクトリの開閉を管理するState
 */
export const useDirectoryState = () => {
  const [openDirectories, dispatch] = useReducer(directoryReducer, {});

  const toggleDirectory = (path: string) => {
    dispatch({ type: 'TOGGLE', path});
  };

  const openDirectory = (path: string) => {
    dispatch({ type: 'OPEN', path});
  };

  const closeDirectory = (path: string) => {
    dispatch({ type: 'CLOSE', path});
  };

  return { openDirectories, toggleDirectory, openDirectory, closeDirectory };
};
