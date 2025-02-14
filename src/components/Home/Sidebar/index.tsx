import { useEffect } from 'react';

import Setting from '../Setting';
import Explorer from '../Explorer';
import Log from '../Log';
import SidebarToggleButton from './SidebarToggleButton';

import { useWindowContext } from '../Window/context';
import { useSidebarContext } from './context';

import { VscFolder, VscInfo } from 'react-icons/vsc';
import { HiOutlineCommandLine } from 'react-icons/hi2';

import styles from './index.module.css';

const Sidebar = () => {
  const {
    isOpenExplorer,
    setIsOpenExplorer,
    isOpenConsole,
    setIsOpenConsole,
    isOpenSetting,
    setIsOpenSetting,
  } = useSidebarContext();
  const { setWindows } = useWindowContext();

  useEffect(() => {
    if (isOpenConsole) {
      setWindows((prev) => {
        const newMap = new Map(prev);
        newMap.delete('コンソール');
        return newMap;
      });
      // 閉じているとき開く
    } else {
      setWindows((prev) => new Map(prev).set('コンソール', <Log></Log>));
    }
  }, [isOpenConsole]);

  return (
    <aside
      style={{
        gridTemplateColumns: isOpenExplorer ? '40px 1fr' : '40px 0px',
      }}
      className={styles.sidebar}
    >
      <div className={styles.toolbar}>
        <div>
          <SidebarToggleButton
            isOpen={isOpenExplorer}
            onClick={() => {
              setIsOpenExplorer((prev) => !prev);
            }}
          >
            <VscFolder />
          </SidebarToggleButton>
        </div>
        <div>
          <SidebarToggleButton
            isOpen={isOpenConsole}
            onClick={() => {
              // 開いているとき閉じる
              if (isOpenConsole) {
                setIsOpenConsole(false);
                // 閉じているとき開く
              } else {
                setIsOpenConsole(true);
              }
            }}
          >
            <HiOutlineCommandLine />
          </SidebarToggleButton>
          <SidebarToggleButton
            isOpen={isOpenSetting}
            onClick={() => {
              // 開いているとき閉じる
              if (isOpenSetting) {
                setWindows((prev) => {
                  const newMap = new Map(prev);
                  newMap.delete('設定画面');
                  return newMap;
                });
                setIsOpenSetting(false);

                // 閉じているとき開く
              } else {
                setWindows((prev) =>
                  new Map(prev).set('設定画面', <Setting></Setting>),
                );
                setIsOpenSetting(true);
              }
            }}
          >
            <VscInfo />
          </SidebarToggleButton>
        </div>
      </div>
      <div
        style={{
          display: isOpenExplorer ? 'block' : 'none',
        }}
        className={styles.tool}
      >
        <Explorer></Explorer>
      </div>
    </aside>
  );
};

export default Sidebar;
