/**
 * エクスプローラーのフォルダを表現するコンポーネント
 */

import { useState } from 'react';
import IconButton from '../../../UI/IconButton';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useDirectoryState } from '../hook';
import { createEntry, removeEntry, renameEntry, findNodeById } from '../utils';
import { useExplorerContext } from '../context';
import { EntryNode } from '../types';
import ContextMenu from '../ContextMenu';
import {
  DocumentPlusIcon,
  FolderPlusIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import styles from './index.module.css';

type Props = {
  node: EntryNode;
  children?: React.ReactNode;
};

const DirectoryItem = ({ node, children }: Props) => {
  const { tree, refreshExplorer } = useExplorerContext();

  const [isRenaming, setIsRenaming] = useState<boolean>(false);

  const [creatingType, setCreatingType] = useState<'directory' | 'file' | null>(
    null,
  );

  const [contextMenuState, setContextMenuState] = useState<{
    x: number;
    y: number;
    isVisible: boolean;
  }>({ x: 0, y: 0, isVisible: false });

  const { openDirectories, onToggleDirectory } = useDirectoryState();

  const { attributes, listeners, setNodeRef } = useDraggable({
    id: node.id,
  });
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: node.id,
  });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuState({
      x: e.pageX,
      y: e.pageY,
      isVisible: true,
    });
  };

  const handleRenaming = async (event: React.FocusEvent<HTMLInputElement>) => {
    const entryName = event.target.value;
    if (!entryName.trim()) {
      setIsRenaming(false);
      return;
    }

    const path = findNodeById(tree, node.id);
    if (!path) return;

    const source = path.slice(-1)[0];
    const sourceParent = path.length > 1 ? path[path.length - 2] : null;
    if (!sourceParent) return;

    await renameEntry(
      source.handle as FileSystemDirectoryHandle,
      sourceParent.handle as FileSystemDirectoryHandle,
      entryName,
    );
    setIsRenaming(false);
    refreshExplorer();
  };

  const handleRemoveEntry = async () => {
    const path = findNodeById(tree, node.id);
    if (!path) return;

    const sourceParent = path.length > 1 ? path[path.length - 2] : null;
    if (!sourceParent) return;

    await removeEntry(
      sourceParent.handle as FileSystemDirectoryHandle,
      node.name,
    );
    refreshExplorer();
  };

  const onCreateEntry = (event: React.FocusEvent<HTMLInputElement>) => {
    const entryName = event.target.value;
    if (!entryName.trim()) {
      setCreatingType(null);
      return;
    }
    createEntry(node.handle, entryName, creatingType || 'file');
    setCreatingType(null);
    refreshExplorer();
  };

  return (
    <li
      className={styles.directoryItem}
      key={node.id}
      ref={setDroppableRef}
      style={{
        backgroundColor: isOver ? 'lightblue' : undefined,
      }}
    >
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        onContextMenu={handleContextMenu}
        onClick={() => {
          onToggleDirectory(node.id);
        }}
      >
        <button className={styles.iconButton}>
          {openDirectories[node.id] ? (
            <ChevronDownIcon />
          ) : (
            <ChevronRightIcon />
          )}
        </button>
        {isRenaming ? (
          <input type="text" autoFocus onBlur={handleRenaming} />
        ) : (
          <button className={styles.labelButton}>{node.name}</button>
        )}

        <IconButton
          label="新しいファイル"
          onClick={() => {
            setCreatingType('file');
          }}
        >
          <DocumentPlusIcon />
        </IconButton>

        <IconButton
          label="新しいフォルダ"
          onClick={() => {
            setCreatingType('directory');
          }}
        >
          <FolderPlusIcon />
        </IconButton>
      </div>
      <ul>
        {creatingType && (
          <input
            type="text"
            autoFocus
            onBlur={(event) => onCreateEntry(event)}
            placeholder={
              creatingType === 'file' ? 'ファイル名を入力' : 'フォルダ名を入力'
            }
          />
        )}
        {children && openDirectories[node.id] && children}
      </ul>

      <ContextMenu
        x={contextMenuState.x}
        y={contextMenuState.y}
        isVisible={contextMenuState.isVisible}
        onClose={() => setContextMenuState({ x: 0, y: 0, isVisible: false })}
      >
        <button onClick={() => console.log(node.handle)}>ハンドル</button>
        <button onClick={() => setIsRenaming(true)}>名前を変更</button>
        <button onClick={() => handleRemoveEntry()}>削除</button>
      </ContextMenu>
    </li>
  );
};

export default DirectoryItem;
