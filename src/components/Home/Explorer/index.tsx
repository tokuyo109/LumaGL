import { useState, useRef, useEffect, ButtonHTMLAttributes } from 'react';
import RootDirectoryItem from './RootDirectoryItem';
import DirectoryItem from './DirectoryItem';
import FileItem from './FileItem';
import { useExplorerContext } from './context';
import { TreeNode } from './types';
import {
  DndContext,
  useSensor,
  useSensors,
  MouseSensor,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  selectDirectory,
  moveEntry,
  registerRootDirectory,
  getAllFromIndexedDB,
} from './utils';
import styles from './index.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

const DirectoryPicker: React.FC<ButtonProps> = ({ ...props }) => {
  return (
    <button className={styles.directoryPicker} {...props}>
      ディレクトリを選択
    </button>
  );
};

const ExplorerItem = ({ node, depth }: { node: TreeNode; depth: number }) => {
  if (node.type === 'directory') {
    const DirectoryComponent =
      node.path === '/' ? RootDirectoryItem : DirectoryItem;

    return (
      <DirectoryComponent node={node} depth={depth}>
        {node.children.map((child) => (
          <ExplorerItem key={child.path} node={child} depth={depth + 1} />
        ))}
      </DirectoryComponent>
    );
  } else if (node.type === 'file') {
    return <FileItem node={node} depth={depth} />;
  }
};

const Explorer = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const {
    root,
    isFocused,
    setIsFocused,
    entries,
    setEntries,
    selectedPaths,
    refreshExplorer,
  } = useExplorerContext();

  const sensors = useSensors(
    // 5px以上でドラッグ判定
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
  );

  const handlePickDirectory = async () => {
    const dirHandle = await selectDirectory();
    if (!dirHandle) return;
    await registerRootDirectory(dirHandle);
    const updateEntreis = await getAllFromIndexedDB();
    updateEntreis && setEntries(updateEntreis);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { over } = event;
    if (!over) return;
    // ドロップ要素のノードを取得
    const overNode = entries.get(`${over.id}`);
    if (!overNode) return;
    // 移動エントリーがドロップ先ディレクトリと一致する場合エラー
    for (const selectedPath of selectedPaths) {
      if (overNode.path === selectedPath) {
        throw new Error(
          '移動先ディレクトリと一致する場合アイテムはコピーできません',
        );
      }
    }
    // エントリーを移動させる
    for (const selectedPath of selectedPaths) {
      const selectedNode = entries.get(selectedPath);
      if (!selectedNode) return;
      await moveEntry(entries, selectedNode, overNode);
    }
    await refreshExplorer();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Shift + E
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === 'e'
      ) {
        e.preventDefault();
        if (isFocused) {
          ref.current?.blur();
        } else {
          ref.current?.focus();
        }
      }
      // Esc
      else if (e.key === 'Escape') {
        ref.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const OverLay = () => {
    if (selectedPaths.length === 0) return null;
    return (
      <div className={styles.overlay}>
        {selectedPaths.length === 1 ? (
          <p>{selectedPaths[0]}</p>
        ) : (
          <p>{selectedPaths.length} items</p>
        )}
      </div>
    );
  };

  return (
    <div
      className={styles.explorer}
      tabIndex={0}
      onFocus={() => {
        setIsFocused(true);
      }}
      onBlur={() => {
        setIsFocused(false);
      }}
      ref={ref}
    >
      {root ? (
        <DndContext
          sensors={sensors}
          onDragEnd={handleDragEnd}
          onDragStart={() => setIsDragging(true)}
          onDragCancel={() => setIsDragging(false)}
        >
          <ExplorerItem key={root.path} node={root} depth={0} />
          <DragOverlay>{isDragging ? <OverLay /> : null}</DragOverlay>
        </DndContext>
      ) : (
        <DirectoryPicker onClick={handlePickDirectory} />
      )}
    </div>
  );
};

export default Explorer;
