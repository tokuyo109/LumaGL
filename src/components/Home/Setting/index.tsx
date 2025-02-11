import { useEffect } from 'react';
import { useSettingContext } from './context';
import styles from './index.module.css';

/** システムに設定されているテーマを取得する */
const getSystemTheme = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const Setting = () => {
  const { theme, setTheme, isAmbient, setIsAmbient } = useSettingContext();

  useEffect(() => {
    const appliedTheme = theme === 'os' ? getSystemTheme() : theme;
    document.body.setAttribute('data-theme', appliedTheme);
    localStorage.setItem('lumagl-theme', appliedTheme);
  }, [theme]);

  return (
    <div className={styles.setting}>
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

      <h2>アンビエントモード</h2>
      <button
        onClick={() => {
          setIsAmbient((prev) => !prev);
        }}
      >
        {isAmbient ? '無効' : '有効'}
      </button>
    </div>
  );
};

export default Setting;
