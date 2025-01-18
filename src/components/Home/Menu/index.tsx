import { useState, useEffect, useRef } from 'react';
import styles from './index.module.css';

type Node = {
  label: string;
  onClick?: () => void;
  children?: Node[];
};

const Menu = () => {
  const ref = useRef<HTMLUListElement>(null);
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});

  const menus: Node[] = [
    {
      label: 'ファイル',
      children: [
        {
          label: '新しいテキストファイル',
          onClick: () => {
            console.log('新しいテキストファイル');
          },
        },
        {
          label: '新しいファイル',
        },
        {
          label: '新しいウィンドウ',
        },
        {
          label: '最新使用した項目を開く',
          children: [
            {
              label: 'ファイル',
            },
            {
              label: 'フォルダ',
            },
          ],
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
      label: '表示',
    },
    {
      label: 'サンプル',
    },
    {
      label: 'テンプレート',
      children: [
        {
          label: 'glsl',
          onClick: () => {
            (async () => {
              const blob = await (await fetch('/templates/glsl.zip')).blob();
              const url = URL.createObjectURL(blob);
              const aElement = document.createElement('a');
              aElement.href = url;
              aElement.download = 'GLSLテンプレート.zip';
              aElement.click();
            })();
          },
        },
      ],
    },
    {
      label: 'スニペット',
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
