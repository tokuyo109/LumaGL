import styles from './index.module.css';

type Props = {
  children?: React.ReactNode;
};

const ContextMenuItem = ({ children }: Props) => {
  return <li className={styles.contextMenuItem}>{children}</li>;
};

export default ContextMenuItem;
