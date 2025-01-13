import { useState, useEffect } from 'react';

import { Mosaic, MosaicWindow, type MosaicNode } from 'react-mosaic-component';
import 'react-mosaic-component/react-mosaic-component.css';

import { VscChromeClose, VscPlay } from 'react-icons/vsc';

import { takeExtension, takePathname } from '../Explorer/utils';
import FileIcon from '../Explorer/FileIcon';
import IconButton from '../../UI/IconButton';
import Preview from '../Preview';
import { useWindowContext } from './context';
import styles from './index.module.css';

/** 全てのタイルIDを取り出す関数 */
const getTileIds = (layout: MosaicNode<string> | null): string[] => {
  if (!layout) return [];
  return typeof layout === 'string'
    ? [layout]
    : [...getTileIds(layout.first), ...getTileIds(layout.second)];
};

/** 削除されたタイルのIDを取得する関数 */
const findRemovedTileIds = (
  previousLayout: MosaicNode<string> | null,
  currentLayout: MosaicNode<string> | null,
): string[] =>
  getTileIds(previousLayout).filter(
    (tileId) => !getTileIds(currentLayout).includes(tileId),
  );

/** タイルが既に作成されているかを返す関数 */
const isTilePresent = (
  layout: MosaicNode<string> | null,
  tileId: string,
): boolean => {
  if (!layout) return false;
  return typeof layout === 'string'
    ? layout === tileId
    : isTilePresent(layout.first, tileId) ||
        isTilePresent(layout.second, tileId);
};

const Window = () => {
  const { windows, setWindows } = useWindowContext();
  const [layout, setLayout] = useState<MosaicNode<string> | null>(null);

  const handleRelease = (newLayout: MosaicNode<string> | null) => {
    const removedTileIds = findRemovedTileIds(layout, newLayout);
    if (removedTileIds.length > 0) {
      const updateWindows = new Map(windows);
      removedTileIds.forEach((tileId) => updateWindows.delete(tileId));
      setWindows(updateWindows);
    }
    setLayout(newLayout);
  };

  const handleRemoveTile = (id: string) => {
    const updateWindows = new Map(windows);
    updateWindows.delete(id);
    setWindows(updateWindows);

    setLayout((prevLayout) => {
      // 削除対象のIDを除外した新しいレイアウトを返す
      const removeTileFromLayout = (
        node: MosaicNode<string> | null,
      ): MosaicNode<string> | null => {
        if (!node) return null;
        if (typeof node === 'string') return node === id ? null : node;
        const first = removeTileFromLayout(node.first);
        const second = removeTileFromLayout(node.second);
        if (!first && !second) return null;
        return first && second ? { ...node, first, second } : first || second;
      };

      return removeTileFromLayout(prevLayout);
    });
  };

  useEffect(() => {
    if (windows.size === 0) return;
    const windowKeys = Array.from(windows.keys());
    const lastWindowKey = windowKeys[windowKeys.length - 1];

    if (!isTilePresent(layout, lastWindowKey)) {
      setLayout((previousLayout) =>
        previousLayout
          ? { direction: 'row', first: previousLayout, second: lastWindowKey }
          : lastWindowKey,
      );
    }
  }, [windows, layout]);

  const renderZeroState = () => (
    <div className={styles.zeroState}>何も選択されていません</div>
  );

  return (
    <div className={styles.window}>
      <Mosaic<string>
        className={styles.mosaicContainer}
        renderTile={(id, path) => {
          return (
            <MosaicWindow<string>
              className={styles.mosaicWindow}
              title={takePathname(id)}
              path={path}
              key={id}
              renderToolbar={(props) => {
                const extension = takeExtension(id);
                return (
                  <div className={styles.toolbar}>
                    <div className={styles.toolbarTitle}>
                      <FileIcon extension={extension} />
                      {props.title}
                    </div>
                    <div className={styles.toolbarButton}>
                      {extension === 'html' && (
                        <IconButton
                          key="preview"
                          label="パネルのプレビュー"
                          onClick={() => {
                            setWindows((prev) => {
                              return new Map(prev).set(
                                id + ':preview',
                                <Preview path={id} update_at={Date.now()} />,
                              );
                            });
                          }}
                        >
                          <VscPlay />
                        </IconButton>
                      )}
                      <IconButton
                        key="delete"
                        label="パネルの削除"
                        onClick={() => handleRemoveTile(id)}
                      >
                        <VscChromeClose />
                      </IconButton>
                    </div>
                  </div>
                );
              }}
            >
              {windows.get(id)}
            </MosaicWindow>
          );
        }}
        initialValue={layout}
        onRelease={handleRelease}
        zeroStateView={renderZeroState()}
      />
    </div>
  );
};

export default Window;
