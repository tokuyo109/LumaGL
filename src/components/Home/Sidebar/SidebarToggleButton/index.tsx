import { ReactNode } from 'react';
import styles from './index.module.css';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isOpen: boolean;
  children?: ReactNode;
};

/**
 * サイドバーのトグルボタンの見た目を定義したコンポーネント
 */
const SidebarToggleButton = ({ isOpen, children, ...props }: Props) => {
  return (
    <button
      style={{
        backgroundColor: isOpen ? 'var(--hoverd-color)' : 'transparent',
      }}
      className={styles.sidebarToggleButton}
      {...props}
    >
      {children}
    </button>
  );
};

export default SidebarToggleButton;
