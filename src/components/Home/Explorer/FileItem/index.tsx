import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useWindowContext } from '../../Window/context';
import { useExplorerContext } from '../context';
import Editor from '../../Editor';
import FileIcon from '../FileIcon';
import { takeExtension, removeEntry, renameEntry } from '../utils';
import { useContextMenu } from '../ContextMenu/hook';
import ContextMenu from '../ContextMenu';
import ContextMenuItem from '../ContextMenu/ContextMenuItem';
import ContextMenuDivider from '../ContextMenu/ContextMenuDivider';
import ContextMenuGroup from '../ContextMenu/ContextMenuGroup';
import { TreeNode } from '../types';
import styles from './index.module.css';

type Props = {
  node: TreeNode;
  depth: number;
};

const FileItem = ({ node, depth }: Props) => {
  const { setWindows } = useWindowContext();
  const { entries, selectedPaths, onSelect, isFocused, refreshExplorer } =
    useExplorerContext();
  const { position, contextMenuRef, showContextMenu, hideContextMenu } =
    useContextMenu();
  const [isRenaming, setIsRenaming] = useState(false);
  const extension = takeExtension(node.path); // ファイルの拡張子
  const isSelected = selectedPaths.find((path) => node.path === path); // 選択されているか
  const isLast = selectedPaths[selectedPaths.length - 1] === node.path; // 末尾要素か

  const { setNodeRef, attributes, listeners } = useDraggable({
    id: node.path,
  });

  let style: any = {
    paddingLeft: `${depth * 8}px`,
  };
  style = isFocused
    ? {
        ...style,
        backgroundColor: isSelected ? 'var(--hoverd-color)' : 'transparent',
        outline: isLast ? '1px solid var(--primary)' : 'none',
      }
    : {
        ...style,
        backgroundColor: isLast ? 'var(--hoverd-color)' : 'transparent',
      };

  const handleClick = () => {
    const url = `/entries${node.path}`;
    if (extension === 'png') {
      setWindows((prev) => {
        return new Map(prev).set(node.path, <img src={url} alt={node.name} />);
      });
    } else {
      setWindows((prev) => {
        return new Map(prev).set(node.path, <Editor node={node} />);
      });
    }
  };

  return (
    <>
      <li
        className={styles.fileItem}
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        onClick={(e) => {
          onSelect(node, e);
        }}
        style={style}
      >
        <div
          className={styles.labelButton}
          onClick={handleClick}
          onContextMenu={showContextMenu}
        >
          <FileIcon extension={extension} />
          {isRenaming ? (
            <input
              type="text"
              autoFocus
              defaultValue={node.name}
              onBlur={async (event: React.FocusEvent<HTMLInputElement>) => {
                await renameEntry(entries, node, event.target.value);
                refreshExplorer();
                setIsRenaming(false);
              }}
            ></input>
          ) : (
            node.name
          )}
        </div>
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
