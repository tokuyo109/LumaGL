import { forwardRef } from 'react';
import styles from './index.module.css';

type Props = {
  x: number;
  y: number;
  children: React.ReactNode;
};

const ContextMenu = forwardRef<HTMLDivElement, Props>(
  ({ x, y, children }, ref) => {
    return (
      <div className={styles.contextMenu} ref={ref} style={{ top: y, left: x }}>
        {children}
      </div>
    );
  },
);

export default ContextMenu;
