import { useState } from 'react';
import Explorer from '../Explorer';
import { VscFolder } from 'react-icons/vsc';
import styles from './index.module.css';

const Sidebar = () => {
  const [isOpenExplorer, setIsOpenExplorer] = useState(true);

  return (
    <aside
      style={{
        gridTemplateColumns: isOpenExplorer ? '40px 1fr' : '40px 0px',
      }}
      className={styles.sidebar}
    >
      <div className={styles.toolbar}>
        <button
          style={{
            backgroundColor: isOpenExplorer ? '#DBDDE6' : 'transparent',
          }}
          className={styles.testButton}
          onClick={() => {
            setIsOpenExplorer((prev) => !prev);
          }}
        >
          <VscFolder />
        </button>
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
