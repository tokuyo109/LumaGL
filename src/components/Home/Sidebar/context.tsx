import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  Dispatch,
  SetStateAction,
} from 'react';

type SidebarProps = {
  children?: ReactNode;
};

type SidebarContextType = {
  isOpenExplorer: boolean;
  setIsOpenExplorer: Dispatch<SetStateAction<boolean>>;
  isOpenConsole: boolean;
  setIsOpenConsole: Dispatch<SetStateAction<boolean>>;
  isOpenSetting: boolean;
  setIsOpenSetting: Dispatch<SetStateAction<boolean>>;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('コンテキストが存在しません');
  return context;
};

export const SidebarProvider = ({ children }: SidebarProps) => {
  const [isOpenExplorer, setIsOpenExplorer] = useState(true);
  const [isOpenConsole, setIsOpenConsole] = useState(false);
  const [isOpenSetting, setIsOpenSetting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + b
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsOpenExplorer((prev) => !prev);
      }

      // Ctrl + @
      if ((e.ctrlKey || e.metaKey) && e.code === 'BracketLeft') {
        console.log('Ctrl + @');
        e.preventDefault();
        setIsOpenConsole((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isOpenExplorer,
        setIsOpenExplorer,
        isOpenConsole,
        setIsOpenConsole,
        isOpenSetting,
        setIsOpenSetting,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
