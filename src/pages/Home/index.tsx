import { Helmet } from 'react-helmet-async';
import Menu from '../../components/Home/Menu';
import Explorer from '../../components/Home/Explorer';
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

  return (
    <>
      <Helmet>
        <title>LumaGL - WebGL Editor</title>
      </Helmet>
      <WindowProvider>
        <ExplorerProvider>
          <main className={styles.home}>
            <header className={styles.header}>
              <strong className={styles.logo}>
                <img src="/img/logo2.svg" alt="サービスロゴ" />
              </strong>
              <Menu />
            </header>
            <aside className={styles.sidebar}>
              <div className={styles.toolbar}></div>
              <div className={styles.tool}>
                <Explorer />
              </div>
            </aside>
            <section className={styles.window}></section>
          </main>
        </ExplorerProvider>
      </WindowProvider>
    </>
  );
};

export default Home;
