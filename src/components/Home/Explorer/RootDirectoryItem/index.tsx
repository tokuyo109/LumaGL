import { useState, ButtonHTMLAttributes } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useExplorerContext } from '../context';
import { useDirectoryState } from '../hook';
import { TreeNode } from '../types';
import styles from './index.module.css';
import { VscNewFile, VscNewFolder } from 'react-icons/vsc';
import TextInput from '../TextInput';
import { createEntry, addEntryToIndexedDB } from '../utils';

type Props = {
  node: TreeNode;
  children?: React.ReactNode;
};

const RootDirectoryItem = ({ node, children }: Props) => {
  const { refreshExplorer } = useExplorerContext();

  const [creatingType, setCreatingType] = useState<'directory' | 'file' | null>(
    null,
  );

  const { openDirectory } = useDirectoryState();

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: node.path,
  });

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
      <ul>
        {creatingType && (
          <TextInput
            autoFocus
            onBlur={async (event: React.FocusEvent<HTMLInputElement>) => {
              // 空チェックと重複チェックが必要
              const name = event.target.value;
              const handle = await createEntry(
                node.handle as FileSystemDirectoryHandle,
                name,
                creatingType,
              );
              if (handle) {
                await addEntryToIndexedDB(node, handle);
                setCreatingType(null);
                refreshExplorer();
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
