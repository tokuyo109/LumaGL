import { Console } from 'console-feed';
import { useLogContext } from './context';

const Log = () => {
  const { logs } = useLogContext();

  return <Console logs={logs} variant="light" />;
};

export default Log;
