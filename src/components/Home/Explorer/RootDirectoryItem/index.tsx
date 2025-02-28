import { useState, ButtonHTMLAttributes } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useExplorerContext } from '../context';
import { TreeNode } from '../types';
import styles from './index.module.css';
import { VscNewFile, VscNewFolder } from 'react-icons/vsc';
import TextInput from '../TextInput';
import { createEntry } from '../utils';

type Props = {
  node: TreeNode;
  depth: number;
  children?: React.ReactNode;
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}
const EntryButton: React.FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <button className={styles.entryButton} {...props}>
      {children}
    </button>
  );
};

const RootDirectoryItem = ({ node, children }: Props) => {
  const { openDirectory, refreshExplorer } = useExplorerContext();

  const [creatingType, setCreatingType] = useState<'directory' | 'file' | null>(
    null,
  );

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: node.path,
  });

  let containerStyle: any = {
    backgroundColor: isOver ? 'lightblue' : undefined,
  };

  return (
    <li
      ref={setDroppableRef}
      className={styles.rootDirectoryItem}
      style={containerStyle}
    >
      <div className={styles.labelContainer}>
        <div className={styles.label}>{node.name}</div>
        <div className={styles.entryButtons}>
          <EntryButton
            onClick={(event) => {
              event.stopPropagation();
              setCreatingType('file');
              openDirectory(node.path);
            }}
          >
            <VscNewFile />
          </EntryButton>
          <EntryButton
            onClick={(event) => {
              event.stopPropagation();
              setCreatingType('directory');
              openDirectory(node.path);
            }}
          >
            <VscNewFolder />
          </EntryButton>
        </div>
      </div>
      <ul>
        {creatingType && (
          <TextInput
            autoFocus
            onBlur={async (event: React.FocusEvent<HTMLInputElement>) => {
              const name = event.target.value;
              const handle = await createEntry(
                node.handle as FileSystemDirectoryHandle,
                name,
                creatingType,
              );
              if (handle) {
                setCreatingType(null);
                await refreshExplorer();
              }
            }}
            placeholder={
              creatingType === 'file' ? 'ファイル名を入力' : 'フォルダ名を入力'
            }
          />
        )}
        {children}
      </ul>
    </li>
  );
};

export default RootDirectoryItem;
