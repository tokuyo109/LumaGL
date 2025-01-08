import { useState, createContext, useContext } from 'react';

type WindowProps = {
  children?: React.ReactNode;
};

type MosaicState = {
  [key: string]: JSX.Element;
};

type WindowContextType = {
  mosaicState: MosaicState;
  setMosaicState: React.Dispatch<React.SetStateAction<MosaicState>>;
};

const WindowContext = createContext<WindowContextType | undefined>(undefined);

export const WindowProvider = ({ children }: WindowProps) => {
  const [mosaicState, setMosaicState] = useState<MosaicState>({});

  return (
    <WindowContext.Provider value={{ mosaicState, setMosaicState }}>
      {children}
    </WindowContext.Provider>
  );
};

export const useWindowContext = () => {
  const context = useContext(WindowContext);
  if (!context) {
    throw new Error('コンテキストが存在しません');
  }
  return context;
};
