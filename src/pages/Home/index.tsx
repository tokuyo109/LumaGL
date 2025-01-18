import { Helmet } from 'react-helmet-async';
import Menu from '../../components/Home/Menu';
import Explorer from '../../components/Home/Explorer';
import Window from '../../components/Home/Window';
import styles from './index.module.css';
import { useState, useEffect } from 'react';
import { ExplorerProvider } from '../../components/Home/Explorer/context';
import { WindowProvider } from '../../components/Home/Window/context';
// import IconButton from '../../components/UI/IconButton';
// import { VscFolder } from 'react-icons/vsc';

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
  const sidebarStyle = isOpenExplorer ? '40px 1fr' : '40px 0px';
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
            <aside
              className={styles.sidebar}
              style={{ gridTemplateColumns: sidebarStyle }}
            >
              <div className={styles.toolbar}>
                {/* <IconButton
                  label="explorerToggleButton"
                  onClick={() =>
                    setIsOpenExplorer((prev) => {
                      return !prev;
                    })
                  }
                >
                  <VscFolder />
                </IconButton> */}
                <button
                  onClick={() =>
                    setIsOpenExplorer((prev) => {
                      return !prev;
                    })
                  }
                >
                  {isOpenExplorer ? '閉じる' : '開く'}
                </button>
              </div>
              <div
                className={styles.tool}
                style={{ display: isOpenExplorer ? 'block' : 'none' }}
              >
                <Explorer />
              </div>
            </aside>
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
