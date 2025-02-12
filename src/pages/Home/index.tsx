import { Helmet } from 'react-helmet-async';
import Menu from '../../components/Home/Menu';
import Sidebar from '../../components/Home/Sidebar';
import Window from '../../components/Home/Window';
import styles from './index.module.css';
import { useEffect } from 'react';
import { SettingProvider } from '../../components/Home/Setting/context';
import { ExplorerProvider } from '../../components/Home/Explorer/context';
import { WindowProvider } from '../../components/Home/Window/context';
import { LogProvider } from '../../components/Home/Log/context';

/**
 * ブラウザのデフォルトテーマを取得する
 */
const getSystemTheme = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const Home = () => {
  useEffect(() => {
    const localTheme = localStorage.getItem('lumagl-theme');
    const theme = localTheme ? localTheme : getSystemTheme();
    document.body.setAttribute('data-theme', theme);
  }, []);

  return (
    <>
      <Helmet>
        <title>LumaGL - WebGL Editor</title>
      </Helmet>
      <SettingProvider>
        <WindowProvider>
          <LogProvider>
            <ExplorerProvider>
              <div className={styles.home}>
                <header className={styles.header}>
                  <strong className={styles.logo}>
                    <img src="/img/logo.svg" alt="サービスロゴ" />
                  </strong>
                  <Menu />
                </header>
                <main className={styles.main}>
                  <Sidebar />
                  <section className={styles.window}>
                    <Window />
                  </section>
                </main>
              </div>
            </ExplorerProvider>
          </LogProvider>
        </WindowProvider>
      </SettingProvider>
    </>
  );
};

export default Home;
