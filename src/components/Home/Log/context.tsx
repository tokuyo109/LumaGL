import { useState, useEffect, createContext, useContext } from 'react';
import { Hook, Unhook } from 'console-feed';

type LogProps = {
  children?: React.ReactNode;
};

type Log = any[]; // Messageの型がエクスポートできないため

type LogContextType = {
  logs: Log;
  setLogs: React.Dispatch<React.SetStateAction<Log>>;
};

const LogContext = createContext<LogContextType | undefined>(undefined);

export const useLogContext = () => {
  const context = useContext(LogContext);
  if (!context) throw new Error('コンテキストが存在しません');
  return context;
};

export const LogProvider = ({ children }: LogProps) => {
  const [logs, setLogs] = useState<Log>([]);

  useEffect(() => {
    const hookedConsole = Hook(
      window.console,
      (log) => setLogs((currLogs) => [...currLogs, log]),
      false,
    );

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'console-log') {
        setLogs((prevLogs) => [
          ...prevLogs,
          { method: 'log', data: event.data.data },
        ]);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      Unhook(hookedConsole);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <LogContext.Provider value={{ logs, setLogs }}>
      {children}
    </LogContext.Provider>
  );
};
