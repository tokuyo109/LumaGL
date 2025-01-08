import { useState, useEffect } from 'react';

import { Mosaic, MosaicWindow, type MosaicNode } from 'react-mosaic-component';
import 'react-mosaic-component/react-mosaic-component.css';

import { useWindowContext } from './context';
import styles from './index.module.css';

/** タイルを展開する関数 */
const expandTiles = (layout: MosaicNode<string> | null): string[] => {
  if (!layout) return [];
  if (typeof layout === 'string') return [layout];
  return [...expandTiles(layout.first), ...expandTiles(layout.second)];
};

/** 削除されたタイルを検出する関数 */
const detectRemovedTiles = (
  oldLayout: MosaicNode<string> | null,
  newLayout: MosaicNode<string> | null,
): string[] => {
  const oldTiles = expandTiles(oldLayout);
  const newTiles = expandTiles(newLayout);
  return oldTiles.filter((tile) => !newTiles.includes(tile));
};

/** 指定したPathのタイルが既に存在するかを返す関数 */
const containsPath = (
  node: MosaicNode<string> | null,
  path: string,
): boolean => {
  if (!node) return false;
  if (typeof node === 'string') return node === path;
  return containsPath(node.first, path) || containsPath(node.second, path);
};

const Window = () => {
  const { windows, setWindows } = useWindowContext();
  const [layout, setLayout] = useState<MosaicNode<string> | null>(null);

  const handleRelease = (newLayout: MosaicNode<string> | null) => {
    const removedTiles = detectRemovedTiles(layout, newLayout);
    const newWindows = new Map(windows);
    removedTiles.forEach((tile) => {
      if (newWindows.has(tile)) {
        newWindows.delete(tile);
      }
    });

    setWindows(newWindows);
    setLayout(newLayout);
  };

  useEffect(() => {
    const keys = Array.from(windows.keys());
    if (!keys.length) return;

    const lastKey = keys[keys.length - 1];

    if (containsPath(layout, lastKey)) return;

    const newLayout: MosaicNode<string> = layout
      ? { direction: 'row', first: layout, second: lastKey }
      : lastKey;

    setLayout(newLayout);
  }, [windows]);

  return (
    <div className={styles.window}>
      <Mosaic<string>
        renderTile={(id, path) => {
          return <MosaicWindow<string> title={id} path={path} key={id} />;
        }}
        initialValue={layout}
        onRelease={handleRelease}
      />
    </div>
  );
};

export default Window;
