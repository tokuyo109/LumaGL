import DirectoryItem from './DirectoryItem';
import FileItem from './FileItem';
import {
  DragEndEvent,
  DndContext,
  useSensor,
  useSensors,
  MouseSensor,
} from '@dnd-kit/core';
import styles from './index.module.css';
import { EntryNode } from './types';
import { selectDirectory, buildTree, findNodeById, moveEntry } from './utils';
import { FolderOpenIcon } from '@heroicons/react/24/outline';
import { useExplorerContext } from './context';

const Explorer = () => {
  const { tree, setTree, setRootHandle, refreshExplorer } =
    useExplorerContext();
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
  );

  const loadDirectory = async () => {
    const dirHandle = await selectDirectory();
    if (dirHandle) {
      const newTree = await buildTree(dirHandle);
      setTree(newTree);
      setRootHandle(dirHandle);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (
      event.over &&
      typeof event.active.id === 'string' &&
      typeof event.over.id === 'string'
    ) {
      // ファイル・ディレクトリまでの経路情報を取得
      const activePath = findNodeById(tree, event.active.id);
      const overPath = findNodeById(tree, event.over.id);

      // 経路情報が存在しない場合早期リターン
      if (!(activePath && overPath)) return;

      const active = activePath.slice(-1)[0];
      const over = overPath.slice(-1)[0];
      const parent =
        activePath.length > 1 ? activePath[activePath.length - 2] : null;

      if (!(active && over && parent)) return;

      await moveEntry(
        active.kind === 'directory'
          ? (active.handle as FileSystemFileHandle)
          : (active.handle as FileSystemDirectoryHandle),
        parent.handle as FileSystemDirectoryHandle,
        over.handle as FileSystemDirectoryHandle,
      );
      refreshExplorer();
    }
  };

  const renderTree = (node: EntryNode) => {
    if (node.kind === 'directory') {
      return (
        <DirectoryItem key={node.id} node={node}>
          {node.childNodes?.map(renderTree)}
        </DirectoryItem>
      );
    } else {
      return <FileItem key={node.id} {...node} />;
    }
  };

  return (
    <div className={styles.explorer}>
      <button
        className={styles.selectDirectory}
        onClick={loadDirectory}
        area-label="Select Directory"
      >
        <FolderOpenIcon />
        フォルダを選択する
      </button>
      {tree && (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <ul>{renderTree(tree)}</ul>
        </DndContext>
      )}
    </div>
  );
};

export default Explorer;
