import { Console } from 'console-feed';
import { useLogContext } from './context';
import { useSettingContext } from '../Setting/context';

const Log = () => {
  const { logs } = useLogContext();
  const { theme } = useSettingContext();

  return <Console logs={logs} variant={theme === 'dark' ? 'dark' : 'light'} />;
};

export default Log;
