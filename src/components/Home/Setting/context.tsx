import { useState, createContext, useContext } from 'react';

type SettingProps = {
  children?: React.ReactNode;
};

type Theme = 'light' | 'dark' | 'os';

type SettingContextType = {
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
};

const SettingContext = createContext<SettingContextType | undefined>(undefined);

export const useSettingContext = () => {
  const context = useContext(SettingContext);
  if (!context) throw new Error('コンテキストが存在しません');
  return context;
};

export const SettingProvider = ({ children }: SettingProps) => {
  const [theme, setTheme] = useState<Theme>('light');

  return (
    <SettingContext.Provider value={{ theme, setTheme }}>
      {children}
    </SettingContext.Provider>
  );
};
