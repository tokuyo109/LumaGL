import { useState } from 'react';
import Setting from '../Setting';
import Explorer from '../Explorer';
import Log from '../Log';
import IconButton from '../../UI/IconButton';
import { useWindowContext } from '../Window/context';

import { VscFolder, VscInfo } from 'react-icons/vsc';
import { HiOutlineCommandLine } from 'react-icons/hi2';
import styles from './index.module.css';

const Sidebar = () => {
  const [isOpenExplorer, setIsOpenExplorer] = useState(true);
  const { setWindows } = useWindowContext();

  return (
    <aside
      style={{
        gridTemplateColumns: isOpenExplorer ? '40px 1fr' : '40px 0px',
      }}
      className={styles.sidebar}
    >
      <div className={styles.toolbar}>
        <div>
          <button
            style={{
              backgroundColor: isOpenExplorer
                ? 'var(--hoverd-color)'
                : 'transparent',
              // border: isOpenExplorer ? '1px solid #C8CBD9' : 'transparent',
            }}
            className={styles.explorerToggleButton}
            onClick={() => {
              setIsOpenExplorer((prev) => !prev);
            }}
          >
            <VscFolder />
          </button>
        </div>
        <div>
          <IconButton
            label="コンソール"
            onClick={() => {
              setWindows((prev) =>
                new Map(prev).set('コンソール', <Log></Log>),
              );
            }}
          >
            <HiOutlineCommandLine />
          </IconButton>
          <IconButton
            label="設定"
            onClick={() =>
              setWindows((prev) =>
                new Map(prev).set('設定画面', <Setting></Setting>),
              )
            }
          >
            <VscInfo />
          </IconButton>
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
