import { useState, useEffect } from 'react';
import { useExplorerContext } from './context';
import {
  selectDirectory,
  buildTree,
  moveEntry,
  registerRootDirectory,
  getAllFromIndexedDB,
} from './utils';
import RootDirectoryItem from './RootDirectoryItem';
import DirectoryItem from './DirectoryItem';
import FileItem from './FileItem';
import {
  DragEndEvent,
  DndContext,
  useSensor,
  useSensors,
  MouseSensor,
  // DragOverlay,
} from '@dnd-kit/core';
import { TreeNode } from './types';
import styles from './index.module.css';

/**
 * entriesをアルファベットの昇順に並び替える関数
 */
const sortEntries = (entries: Map<string, TreeNode>): Map<string, TreeNode> => {
  const sortedArray = Array.from(entries.entries()).sort(
    ([_keyA, a], [_keyB, b]) => {
      if (a.type === 'directory' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'directory') return 1;

      return a.name.localeCompare(b.name);
    },
  );

  return new Map(sortedArray);
};

const Explorer = () => {
  const { entries, setEntries, selectEntries, refreshExplorer } =
    useExplorerContext();
  const [root, setRoot] = useState<TreeNode | undefined>(undefined);

  // 5px以上でドラッグ判定
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
  );

  // IndexedDBからルートディレクトリを取得して展開する
  useEffect(() => {
    (async () => {
      const entries = await getAllFromIndexedDB();
      setEntries(entries);
    })();
  }, []);

  // entriesの更新に伴ってUI生成用のツリー構造を作成する
  useEffect(() => {
    const sortedEntries = sortEntries(entries);
    setRoot(buildTree(sortedEntries));
  }, [entries]);

  useEffect(() => {
    console.log(selectEntries);
  }, [selectEntries]);

  // ドラッグ終了時の処理
  const handleDragEnd = async (event: DragEndEvent) => {
    try {
      const { active, over } = event;
      if (!over) return;
      const activeNode = entries.get(`${active.id}`);
      const overNode = entries.get(`${over.id}`);
      if (!(activeNode && overNode)) return;
      switch (activeNode.type) {
        case 'file':
          if (activeNode.parentPath === overNode.path) {
            throw new Error(
              `既にディレクトリ"${overNode.path}"に存在するため、ファイル"${activeNode.path}"の移動に失敗しました`,
            );
          }
          break;
        case 'directory':
          if (activeNode.path === overNode.path) {
            throw new Error(
              `対象ディレクトリが移動先と同じため、ディレクトリ"${activeNode.path}"の移動に失敗しました`,
            );
          }
          break;
      }
      const parentNode = entries.get(activeNode.parentPath);
      if (!parentNode) return;
      await moveEntry(entries, activeNode, overNode);
      refreshExplorer();
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
    }
  };

  const SelectDirectoryButton = () => {
    const handleClick = async () => {
      const dirHandle = await selectDirectory();
      if (!dirHandle) return;

      await registerRootDirectory(dirHandle);

      const updateEntreis = await getAllFromIndexedDB();
      updateEntreis && setEntries(updateEntreis);
    };

    return (
      <button className={styles.selectDirectory} onClick={() => handleClick()}>
        ディレクトリを選択
      </button>
    );
  };

  const ExplorerItem = (node: TreeNode) => {
    if (node.type === 'directory') {
      const DirectoryComponent =
        node.path === '/' ? RootDirectoryItem : DirectoryItem;

      return (
        <DirectoryComponent key={node.path} node={node}>
          {node.children.map(ExplorerItem)}
        </DirectoryComponent>
      );
    } else {
      return <FileItem key={node.path} node={node} />;
    }
  };

  return (
    <div className={styles.explorer}>
      {root ? (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <ul>{ExplorerItem(root)}</ul>
          {/* <DragOverlay>
            {Object.values(selectEntries).map((entry) => {
              return <li>{entry.name}</li>;
            })}
          </DragOverlay> */}
        </DndContext>
      ) : (
        <SelectDirectoryButton />
      )}
    </div>
  );
};

export default Explorer;
