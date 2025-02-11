import {
  useState,
  createContext,
  useContext,
  RefObject,
  ReactNode,
} from 'react';

type AmbientProps = {
  children?: ReactNode;
};

type AmbientContextType = {
  iframeRef: RefObject<HTMLIFrameElement> | null;
  setIframeRef: (ref: RefObject<HTMLIFrameElement>) => void;
};

const AmbientContext = createContext<AmbientContextType | undefined>(undefined);

export const useAmbientContext = () => {
  const context = useContext(AmbientContext);
  if (!context) {
    throw new Error('コンテキストが存在しません');
  }
  return context;
};

export const AmbientProvider = ({ children }: AmbientProps) => {
  const [iframeRef, setIframeRefState] =
    useState<RefObject<HTMLIFrameElement> | null>(null);

  const setIframeRef = (ref: RefObject<HTMLIFrameElement>) => {
    setIframeRefState(ref);
  };

  return (
    <AmbientContext.Provider value={{ iframeRef, setIframeRef }}>
      {children}
    </AmbientContext.Provider>
  );
};
