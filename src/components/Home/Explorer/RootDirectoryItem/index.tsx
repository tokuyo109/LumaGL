import { useDroppable } from '@dnd-kit/core';
import { TreeNode } from '../types';
import styles from './index.module.css';

type Props = {
  node: TreeNode;
  children?: React.ReactNode;
};

const RootDirectoryItem = ({ node, children }: Props) => {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: node.path,
  });

  return (
    <li
      className={styles.rootDirectoryItem}
      ref={setDroppableRef}
      style={{
        backgroundColor: isOver ? 'lightblue' : undefined,
      }}
    >
      <div>
        <p className={styles.label}>{node.name}</p>
      </div>
      <ul>{children}</ul>
    </li>
  );
};

export default RootDirectoryItem;
