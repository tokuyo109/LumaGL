/**
 * エクスプローラーのフォルダを表現するコンポーネント
 */
import { useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useExplorerContext } from '../context';
import { useDirectoryState } from '../hook';
import { TreeNode } from '../types';
import styles from './index.module.css';
import {
  VscChevronDown,
  VscChevronRight,
  VscNewFile,
  VscNewFolder,
} from 'react-icons/vsc';
import { ButtonHTMLAttributes } from 'react';
import TextInput from '../TextInput';
import ContextMenu from '../ContextMenu';
import ContextMenuItem from '../ContextMenu/ContextMenuItem';
import ContextMenuDivider from '../ContextMenu/ContextMenuDivider';
import ContextMenuGroup from '../ContextMenu/ContextMenuGroup';
import { useContextMenu } from '../ContextMenu/hook';

import { createEntry, removeEntry, renameEntry } from '../utils';

type Props = {
  node: TreeNode;
  children?: React.ReactNode;
};

const DirectoryItem = ({ node, children }: Props) => {
  const { entries, refreshExplorer } = useExplorerContext();
  const { position, contextMenuRef, showContextMenu, hideContextMenu } =
    useContextMenu();

  // エントリーを作成中かどうか・エントリーのタイプ
  const [creatingType, setCreatingType] = useState<'directory' | 'file' | null>(
    null,
  );

  const [isRenaming, setIsRenaming] = useState(false);

  // ディレクトリの開閉を管理するState
  const { openDirectories, toggleDirectory, openDirectory } =
    useDirectoryState();

  // ドラッグ用プロパティ
  const { setNodeRef, attributes, listeners, transform } = useDraggable({
    id: node.path,
  });

  const style = transform
    ? `translate(${transform.x}px, ${transform.y}px)`
    : undefined;

  // ドロップ用プロパティ
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: node.path,
  });

  const ToggleButton = () => {
    return (
      <button className={styles.toggleButton}>
        {openDirectories[node.path] ? <VscChevronDown /> : <VscChevronRight />}
      </button>
    );
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

  return (
    <>
      <li
        ref={setDroppableRef}
        style={{
          backgroundColor: isOver ? 'lightblue' : undefined,
        }}
        className={styles.directoryItem}
      >
        <div
          // DnD関連
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          style={{
            transform: style,
            height: 'fit-content',
          }}
          onClick={(_event: React.MouseEvent) => {
            toggleDirectory(node.path);
          }}
          onContextMenu={showContextMenu}
        >
          {isRenaming && (
            <input
              type="text"
              autoFocus
              onBlur={async (event: React.FocusEvent<HTMLInputElement>) => {
                const parent = entries.get(node.parentPath);
                if (parent) {
                  await renameEntry(
                    node.handle,
                    parent.handle as FileSystemDirectoryHandle,
                    event.target.value,
                  );
                  refreshExplorer();
                }
                setIsRenaming(false);
              }}
            />
          )}
          <ToggleButton />
          <button className={styles.label}>{node.name}</button>
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
                  setCreatingType(null);
                  refreshExplorer();
                }
              }}
              placeholder={
                creatingType === 'file'
                  ? 'ファイル名を入力'
                  : 'フォルダ名を入力'
              }
            />
          )}
          {openDirectories[node.path] && children}
        </ul>
      </li>
      {position.visible && (
        <ContextMenu x={position.x} y={position.y} ref={contextMenuRef}>
          <ContextMenuGroup>
            <ContextMenuItem>
              <button
                onClick={() => {
                  setIsRenaming(true);
                }}
              >
                名前の変更
              </button>
            </ContextMenuItem>
            <ContextMenuDivider />
            <ContextMenuItem>
              <button
                onClick={async () => {
                  const parent = entries.get(node.parentPath);
                  if (parent) {
                    await removeEntry(
                      parent.handle as FileSystemDirectoryHandle,
                      node.name,
                    );
                    refreshExplorer();
                  }
                  hideContextMenu();
                }}
              >
                削除
              </button>
            </ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenu>
      )}
    </>
  );
};

export default DirectoryItem;
