const INDEXED_DB_NAME = 'entries';
const INDEXED_DB_STORE_NAME = 'store';

const DB_NAME = 'lumagl-db';
const STORE_NAME = 'lumagl-entries-store';

/**
 * パスとパスを/で繋げ、正規化する関数
 * 
 * @param { string } parentPath
 * @param { string } childPath
 * @returns { string }
 */
const makePath = (parentPath, childPath) => {
  return `${parentPath}/${childPath}`.replace(/\/+/g, '/');
};

/**
 * indexedDBを開く関数
 * 
 * @returns { Promise<IDBDatabase> }
 */
const openIndexedDB = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const idb = event.target.result;
      if (!idb.objectStoreNames.contains(STORE_NAME)) {
        idb.createObjectStore(STORE_NAME, { keyPath: 'path' });
      }
    };

    request.onsuccess = (event) => {
      console.log('データベースに接続しました');
      resolve(event.target.result);
    };

    request.onerror = error => {
      console.error('データベースに接続できませんでした', error);
      reject(error);
    };
  });
};

/**
 * IndexedDBのトランサクションを作成する関数
 * 
 * @param { IDBDatabase } idb
 * @param { string } storeName
 * @param { 'readonly' | 'readwrite' } mode
 */
const createTransaction = (idb, storeName, mode = 'readonly') => {
  return idb.transaction(storeName, mode).objectStore(storeName);
};

/**
 * ルートディレクトリのFileSystemDirectoryHandleを取得する関数
 * 
 * @returns { Promise<FileSystemDirectoryHandle> }
 */
const getRootHandle = async () => {
  let root = undefined;
  const idb = await openIndexedDB();
  const store = createTransaction(idb, STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.openCursor();
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        root = cursor.value;
        cursor.continue();
      } else {
        console.log('ルートディレクトリの取得に成功しました');
        resolve(root.handle);
      }
    };

    request.onerror = (event) => {
      const error = event.target.error;
      console.log('ルートディレクトリの取得に失敗しました', error?.message || '不明なエラーです');
      reject(error || new Error('ルートディレクトリの取得中に不明なエラーが発生しました'));
    };
  });
};

/**
 * ディレクトリを再帰的に展開して全てのエントリを取得する関数
 * 
 * @param { FileSystemDirectoryHandle } dirHandle
 * @returns { Promise<Map<string, TreeNode>> }
 */
const expandRootHandle = async (dirHandle) => {
  const entries = new Map();

  // 深さ優先探索
  const dfs = async (dirHandle, parentPath = '') => {
    try {
      const tasks = [];
      for await (const [name, handle] of dirHandle) {
        const path = makePath(parentPath, name);

        const entry = { path, handle };
        entries.set(entry.path, entry);

        if (handle.kind === 'directory') {
          tasks.push(dfs(handle, path));
        }
      }
      await Promise.all(tasks);
    } catch (error) {
      console.error(`${dirHandle.name}ディレクトリの探索中にエラーが発生しました:`, error);
    }
  };

  entries.set('/', { path: '/', handle: dirHandle });
  await dfs(dirHandle, '/');

  return entries;
};

self.addEventListener('install', (event) => {
  console.log(event);
});

self.addEventListener('activate', (event) => {
  console.log(event);
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/entries/')) {
    const relativePath = `/${url.pathname.replace('/entries/', '')}`;

    event.respondWith((async () => {
      try {
        const rootHandle = await getRootHandle();
        const entries = await expandRootHandle(rootHandle);
        const handle = entries.get(relativePath)?.handle;
        if (!handle) return fetch(event.request);

        const file = await handle.getFile();
        const fileType = file.type || 'application/octet-stream';
        const fileContent = await file.text();

        // index.htmlの場合console.logをオーバーライド
        if (relativePath.endsWith('index.html')) {
          const overrideScript = `
            <script>
              (function() {
                const methods = ['log', 'warn', 'error'];
                methods.forEach(method => {
                  const original = console[method];
                  console[method] = function(...args) {
                    if (window.parent && window.parent.console && window.parent.console[method]) {
                      window.parent.console[method](...args);
                    }
                    if (window.parent && window.parent.displayLog) {
                      window.parent.displayLog(method, ...args);
                    }
                    original.apply(console, args);
                  };
                });
                window.addEventListener('error', (e) => {
                  console.error('Global error:', e.message, e.error);
                });
                window.addEventListener('unhandledrejection', (e) => {
                  console.error('Unhandled rejection:', e.reason);
                });
                console.log('index.htmlが読み込まれました');
              })();
            </script>
          `;
          const modifiedHtml = fileContent.replace('<head>', `<head>${overrideScript}`);

          return new Response(modifiedHtml, {
            headers: { 'Content-Type': fileType },
          });
        }

        return new Response(file, {
          headers: { 'Content-Type': fileType },
        });
      } catch (error) {
        console.error('ファイル取得エラー:', error);
        return fetch(event.request);
      }
    })());
  }
});
