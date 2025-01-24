import { Helmet } from 'react-helmet-async';
import Menu from '../../components/Home/Menu';
import Sidebar from '../../components/Home/Sidebar';
import Window from '../../components/Home/Window';
import styles from './index.module.css';
import { useState, useEffect } from 'react';
import { ExplorerProvider } from '../../components/Home/Explorer/context';
import { WindowProvider } from '../../components/Home/Window/context';

const Home = () => {
  const [isOpenExplorer, setIsOpenExplorer] = useState(true);

  const getSystemTheme = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  };

  // const applyTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   if (event.target.value === 'os') {
  //     const theme = getSystemTheme();
  //     document.body.setAttribute('data-theme', theme);
  //     return;
  //   }
  //   document.body.setAttribute('data-theme', event.target.value);
  // };

  useEffect(() => {
    const theme = getSystemTheme();
    document.body.setAttribute('data-theme', theme);
  }, []);

  const homeStyle = isOpenExplorer ? '240px 1fr' : '40px 1fr';
  return (
    <>
      <Helmet>
        <title>LumaGL - WebGL Editor</title>
      </Helmet>
      <WindowProvider>
        <ExplorerProvider>
          <main
            className={styles.home}
            style={{ gridTemplateColumns: homeStyle }}
          >
            <header className={styles.header}>
              <strong className={styles.logo}>
                <img src="/img/logo2.svg" alt="サービスロゴ" />
              </strong>
              <Menu />
            </header>
            <Sidebar />
            <section className={styles.window}>
              <Window />
            </section>
          </main>
        </ExplorerProvider>
      </WindowProvider>
    </>
  );
};

export default Home;
