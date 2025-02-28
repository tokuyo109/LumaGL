import { useState, ReactNode, ButtonHTMLAttributes } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useExplorerContext } from '../context';
import { useContextMenu } from '../ContextMenu/hook';
import ContextMenu from '../ContextMenu';
import ContextMenuItem from '../ContextMenu/ContextMenuItem';
import ContextMenuDivider from '../ContextMenu/ContextMenuDivider';
import ContextMenuGroup from '../ContextMenu/ContextMenuGroup';
import TextInput from '../TextInput';
import { createEntry, removeEntry, renameEntry } from '../utils';
import {
  VscChevronDown,
  VscChevronRight,
  VscNewFile,
  VscNewFolder,
} from 'react-icons/vsc';
import { TreeNode } from '../types';
import styles from './index.module.css';

type Props = {
  node: TreeNode;
  depth: number;
  children: ReactNode;
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

const DirectoryItem = ({ node, children }: Props) => {
  const {
    entries,
    selectedPaths,
    onSelect,
    isFocused,
    openDirectories,
    openDirectory,
    toggleDirectory,
    refreshExplorer,
  } = useExplorerContext();

  const { position, contextMenuRef, showContextMenu, hideContextMenu } =
    useContextMenu();

  const isSelected = selectedPaths.find((path) => node.path === path);
  const isLast = selectedPaths[selectedPaths.length - 1] === node.path;

  const [creatingType, setCreatingType] = useState<'directory' | 'file' | null>(
    null,
  );

  const [isRenaming, setIsRenaming] = useState(false);

  const { setNodeRef, attributes, listeners } = useDraggable({
    id: node.path,
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: node.path,
  });

  let containerStyle: any = {
    backgroundColor: isOver ? 'lightblue' : undefined,
  };

  let labelStyle: any = {};
  labelStyle = isFocused
    ? {
        ...labelStyle,
        backgroundColor: isSelected ? 'var(--hoverd-color)' : 'transparent',
        outline: isLast ? '1px solid var(--primary)' : 'none',
      }
    : {
        ...labelStyle,
        backgroundColor: isLast ? 'var(--hoverd-color)' : 'transparent',
      };

  return (
    <>
      <li
        ref={setDroppableRef}
        className={styles.directoryItem}
        style={containerStyle}
      >
        <div
          className={styles.labelContainer}
          style={labelStyle}
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          onClick={(e) => {
            onSelect(node, e);
            toggleDirectory(node.path);
          }}
          onContextMenu={showContextMenu}
        >
          <div className={styles.label}>
            {openDirectories[node.path] ? (
              <VscChevronDown />
            ) : (
              <VscChevronRight />
            )}
            {isRenaming ? (
              <input
                type="text"
                autoFocus
                defaultValue={node.name}
                onBlur={async (event: React.FocusEvent<HTMLInputElement>) => {
                  await renameEntry(entries, node, event.target.value);
                  setIsRenaming(false);
                }}
              ></input>
            ) : (
              node.name
            )}
          </div>
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
                  hideContextMenu();
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
                    await refreshExplorer();
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
