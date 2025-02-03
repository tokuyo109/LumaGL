import { useState, useEffect, useRef } from 'react';
import { useExplorerContext } from '../Explorer/context';
import {
  selectDirectory,
  createEntriesHash,
  registerRootDirectory,
} from '../Explorer/utils';
import JSZip from 'jszip';
import styles from './index.module.css';

type Node = {
  label: string;
  onClick?: () => void;
  children?: Node[];
};

const Menu = () => {
  const ref = useRef<HTMLUListElement>(null);
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const { setEntries, refreshExplorer } = useExplorerContext();

  const menus: Node[] = [
    {
      label: 'ファイル',
      children: [
        {
          label: 'フォルダーを開く',
          onClick: async () => {
            const dirHandle = await selectDirectory();
            if (!dirHandle) return;
            await registerRootDirectory(dirHandle);
            const entries = await createEntriesHash(dirHandle);
            setEntries(entries);
          },
        },
      ],
    },
    {
      label: '編集',
      children: [
        {
          label: '元に戻す',
        },
      ],
    },
    {
      label: 'テンプレート',
      children: [
        {
          label: 'glsl',
          onClick: () => {
            (async () => {
              const blob: Blob = await (
                await fetch('/templates/glsl.zip')
              ).blob();
              // jszipを使用して解凍
              const zip: JSZip = await JSZip.loadAsync(blob);

              // ユーザーディレクトリを要求する
              const dirHandle = await (
                window as unknown as {
                  showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>;
                }
              ).showDirectoryPicker();

              for (const [entryPath, entry] of Object.entries(zip.files)) {
                if (entry.dir) continue;

                const pathParts = entryPath.split('/');
                const fileName = pathParts.pop();
                if (!fileName) continue;

                let currentDirHandle = dirHandle;

                // サブディレクトリを作成する
                for (const part of pathParts) {
                  currentDirHandle = await currentDirHandle.getDirectoryHandle(
                    part,
                    { create: true },
                  );
                }

                // 書き込み用のハンドルを作成する
                const handle = await currentDirHandle.getFileHandle(fileName, {
                  create: true,
                });
                const fileData = await entry.async('uint8array');
                const writable = await handle.createWritable();
                writable.write(fileData);
                writable.close();

                console.log('zipファイルのコピーが完了しました');
              }

              refreshExplorer();
            })();
          },
        },
      ],
    },
  ];

  const toggleMenu = (key: string) => {
    const isOpen = openMenus[key];
    if (isOpen) {
      setOpenMenus({});
    } else {
      setOpenMenus({ [key]: true });
    }
  };

  const renderMenu = (menus: Node[], parentKey = '', depth = 0) => {
    return menus.map((menu, index) => {
      const key = parentKey ? `${parentKey}-${index}` : `${index}`;

      return (
        <li key={key}>
          <div>
            <button
              onClick={() => {
                if (menu.onClick) {
                  menu.onClick();
                }

                if (parentKey) {
                  setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
                } else {
                  toggleMenu(key);
                }
              }}
              onMouseEnter={() => {
                if (parentKey) {
                  setOpenMenus((prev) => ({ ...prev, [key]: true }));
                }
              }}
            >
              {menu.label}
            </button>
          </div>
          {menu.children && openMenus[key] && (
            <ul
              className={`
            `}
            >
              {renderMenu(menu.children, key, depth + 1)}
            </ul>
          )}
        </li>
      );
    });
  };

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as HTMLElement)) {
        setOpenMenus({});
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  });

  return (
    <ul
      ref={ref}
      className={`
      ${styles.menu}
    `}
    >
      {renderMenu(menus)}
    </ul>
  );
};

export default Menu;
