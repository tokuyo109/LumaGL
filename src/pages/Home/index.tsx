import { Helmet } from 'react-helmet-async';
// import Background from '../../components/Home/Background';
import Menu from '../../components/Home/Menu';
import Sidebar from '../../components/Home/Sidebar';
import Window from '../../components/Home/Window';
import styles from './index.module.css';
import { useEffect } from 'react';
import { ExplorerProvider } from '../../components/Home/Explorer/context';
import { WindowProvider } from '../../components/Home/Window/context';

const Home = () => {
  const getSystemTheme = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  };

  useEffect(() => {
    const theme = getSystemTheme();
    document.body.setAttribute('data-theme', theme);
  }, []);

  return (
    <>
      <Helmet>
        <title>LumaGL - WebGL Editor</title>
      </Helmet>
      {/* <Background /> */}
      <WindowProvider>
        <ExplorerProvider>
          <div className={styles.home}>
            <header className={styles.header}>
              <strong className={styles.logo}>
                <img src="/img/logo2.svg" alt="サービスロゴ" />
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
      </WindowProvider>
    </>
  );
};

export default Home;
