import styles from './index.module.css';

type Props = {
  children: React.ReactNode;
};

const ContextMenuGroup = ({ children }: Props) => {
  return <ul className={styles.contextMenuGroup}>{children}</ul>;
};

export default ContextMenuGroup;
