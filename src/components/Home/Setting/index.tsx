import { useEffect } from 'react';
import { useSettingContext } from './context';

/** システムに設定されているテーマを取得する */
const getSystemTheme = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const Setting = () => {
  const { theme, setTheme } = useSettingContext();

  useEffect(() => {
    const appliedTheme = theme === 'os' ? getSystemTheme() : theme;
    document.body.setAttribute('data-theme', appliedTheme);
  }, [theme]);

  return (
    <div>
      <h2>テーマ設定</h2>
      <label>
        <input
          type="radio"
          value="light"
          checked={theme === 'light'}
          onChange={() => setTheme('light')}
        />
        ライト
      </label>
      <label>
        <input
          type="radio"
          value="dark"
          checked={theme === 'dark'}
          onChange={() => setTheme('dark')}
        />
        ダーク
      </label>
      <label>
        <input
          type="radio"
          value="os"
          checked={theme === 'os'}
          onChange={() => setTheme('os')}
        />
        システム設定
      </label>
    </div>
  );
};

export default Setting;
