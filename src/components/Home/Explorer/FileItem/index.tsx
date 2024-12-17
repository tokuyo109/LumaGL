import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useExplorerContext } from '../context';
import { removeEntry, renameEntry, findNodeById } from '../utils';
import ContextMenu from '../ContextMenu';
import { useWindowContext } from '../../Window/context';
import styles from './index.module.css';
import Editor from '../../Editor';

const FileItem = ({ ...node }) => {
  const { tree, refreshExplorer } = useExplorerContext();
  const { setMosaicState } = useWindowContext();
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [contextMenuState, setContextMenuState] = useState<{
    x: number;
    y: number;
    isVisible: boolean;
  }>({ x: 0, y: 0, isVisible: false });
  const { setNodeRef, attributes, listeners, transform, isDragging } =
    useDraggable({
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

  const style = transform
    ? `translate(${transform.x}px, ${transform.y}px)`
    : undefined;

  return (
    <li
      key={node.id}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: style,
        height: 'fit-content',
      }}
      className={styles.fileItem}
      onContextMenu={handleContextMenu}
    >
      {isRenaming ? (
        <input type="text" autoFocus onBlur={handleRenaming} />
      ) : (
        <button
          onClick={() => {
            // console.log(node.handle);
            // setOpenHandles((prev) => {
            //   return [...prev, node.handle as FileSystemFileHandle];
            // });
            setMosaicState((prev) => ({
              ...prev,
              [`${node.id}`]: (
                <Editor handle={node.handle as FileSystemFileHandle} />
              ),
            }));
          }}
          style={{
            backgroundColor: isDragging ? 'lightgreen' : undefined,
          }}
          className={styles.label}
        >
          {node.name}
        </button>
      )}

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

export default FileItem;
