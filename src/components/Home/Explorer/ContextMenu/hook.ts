import { useState, useCallback, useEffect, useRef } from 'react';

type ContextMenuPosition = {
  x: number;
  y: number;
  visible: boolean;
};

type useContextMenuResult = {
  position: ContextMenuPosition;
  contextMenuRef: React.RefObject<HTMLDivElement>;
  showContextMenu: (event: React.MouseEvent) => void;
  hideContextMenu: () => void;
};

export const useContextMenu = (): useContextMenuResult => {
  const [position, setPosition] = useState<ContextMenuPosition>({
    x: 0, // Xの絶対位置
    y: 0, // Yの絶対位置
    visible: false, // 可視フラグ
  });

  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  /**
   * コンテキストメニューを開く
   */
  const showContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault(); // デフォルトの右クリック無効化
    setPosition({
      x: event.clientX,
      y: event.clientY,
      visible: true,
    });
  }, []);

  /**
   * コンテキストメニューを閉じる
   */
  const hideContextMenu = useCallback(() => {
    setPosition((prev) => ({...prev, visible: false}));
  }, []);

  /**
   * コンテキストメニュー外をクリックした際に閉じる
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target as Node)
      ) {
        hideContextMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [hideContextMenu]);

  return { position, contextMenuRef, showContextMenu, hideContextMenu };
};
