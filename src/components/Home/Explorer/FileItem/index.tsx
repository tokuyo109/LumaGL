import { useState } from 'react';
import { useExplorerContext } from '../context';
import { useWindowContext } from '../../Window/context';
import { useDraggable } from '@dnd-kit/core';
import {
  takeExtension,
  removeEntryFromIndexedDB,
  removeEntry,
  renameEntry,
  renameEntryOfIndexedDB,
} from '../utils';
import { TreeNode } from '../types';
import styles from './index.module.css';
import FileIcon from '../FileIcon';
import ContextMenu from '../ContextMenu';
import ContextMenuItem from '../ContextMenu/ContextMenuItem';
import ContextMenuDivider from '../ContextMenu/ContextMenuDivider';
import ContextMenuGroup from '../ContextMenu/ContextMenuGroup';
import { useContextMenu } from '../ContextMenu/hook';

type Props = {
  node: TreeNode;
};

const FileItem = ({ node }: Props) => {
  const { setWindows } = useWindowContext();
  const { entries, refreshExplorer } = useExplorerContext();
  const { position, contextMenuRef, showContextMenu, hideContextMenu } =
    useContextMenu();

  // 名前変更中かどうか
  const [isRenaming, setIsRenaming] = useState(false);

  const { setNodeRef, attributes, listeners, transform } = useDraggable({
    id: node.path,
  });

  const style = transform
    ? `translate(${transform.x}px, ${transform.y}px)`
    : undefined;

  const LabelButton = () => {
    return (
      <button
        className={styles.label}
        onClick={() => {
          setWindows((prev) => {
            return new Map(prev).set(node.path, <div>{node.path}</div>);
          });
          // 後にファイルを開く処理を実装する
        }}
      >
        {node.name}
      </button>
    );
  };

  return (
    <>
      <li
        className={styles.fileItem}
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        style={{
          transform: style,
          height: 'fit-content',
        }}
      >
        <div
          className={styles.container}
          onContextMenu={showContextMenu}
          onClick={hideContextMenu}
        >
          {isRenaming && (
            <input
              type="text"
              autoFocus
              onBlur={async (event: React.FocusEvent<HTMLInputElement>) => {
                const parent = entries.get(node.parentPath);
                if (parent) {
                  const newHandle = await renameEntry(
                    node.handle,
                    parent.handle as FileSystemDirectoryHandle,
                    event.target.value,
                  );
                  await renameEntryOfIndexedDB(
                    node,
                    parent,
                    newHandle as FileSystemFileHandle,
                  );
                  refreshExplorer();
                }
                setIsRenaming(false);
              }}
            />
          )}
          <FileIcon extension={takeExtension(node.path)} />
          <LabelButton />
        </div>
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
                    await removeEntryFromIndexedDB(node.path);
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

export default FileItem;
