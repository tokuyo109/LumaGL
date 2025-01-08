import { useState, createContext, useContext } from 'react';

type WindowProps = {
  children?: React.ReactNode;
};

export type WindowState = Map<string, JSX.Element>;

// プロバイダーが提供するロジック・状態
type WindowContextType = {
  windows: WindowState;
  setWindows: React.Dispatch<React.SetStateAction<WindowState>>;
};

const WindowContext = createContext<WindowContextType | undefined>(undefined);

/**
 * プロバイダーに渡されたvalueの値を返す
 */
export const useWindowContext = () => {
  const context = useContext(WindowContext);
  if (!context) {
    throw new Error('コンテキストが存在しません');
  }
  return context;
};

/**
 * プロバイダーコンポーネント
 * これより下に存在するコンポーネントはこのコンテキストの値を利用することができる
 */
export const WindowProvider = ({ children }: WindowProps) => {
  // ウィンドウの一覧
  const [windows, setWindows] = useState<WindowState>(new Map());

  return (
    <WindowContext.Provider value={{ windows, setWindows }}>
      {children}
    </WindowContext.Provider>
  );
};
