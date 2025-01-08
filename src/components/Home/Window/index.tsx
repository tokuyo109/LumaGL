import { useState, useEffect } from 'react';

import { Mosaic, MosaicWindow, type MosaicNode } from 'react-mosaic-component';
import 'react-mosaic-component/react-mosaic-component.css';

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

  const renderZeroState = () => <p>何も選択されていません</p>;

  return (
    <div className={styles.window}>
      <Mosaic<string>
        renderTile={(id, path) => {
          return <MosaicWindow<string> title={id} path={path} key={id} />;
        }}
        initialValue={layout}
        onRelease={handleRelease}
        zeroStateView={renderZeroState()}
      />
    </div>
  );
};

export default Window;
