import {
  useState,
  createContext,
  useContext,
  Dispatch,
  SetStateAction,
} from 'react';

type SettingProps = {
  children?: React.ReactNode;
};

type Theme = string;
type Ambient = boolean;

type SettingContextType = {
  theme: Theme;
  setTheme: Dispatch<SetStateAction<Theme>>;
  isAmbient: Ambient;
  setIsAmbient: Dispatch<SetStateAction<Ambient>>;
};

const SettingContext = createContext<SettingContextType | undefined>(undefined);

/** システムに設定されているテーマを取得する */
const getSystemTheme = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

export const useSettingContext = () => {
  const context = useContext(SettingContext);
  if (!context) throw new Error('コンテキストが存在しません');
  return context;
};

export const SettingProvider = ({ children }: SettingProps) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const localTheme = localStorage.getItem('lumagl-theme');
    const theme = localTheme ? localTheme : getSystemTheme();
    return theme;
  });
  const [isAmbient, setIsAmbient] = useState(false);

  return (
    <SettingContext.Provider
      value={{ theme, setTheme, isAmbient, setIsAmbient }}
    >
      {children}
    </SettingContext.Provider>
  );
};
