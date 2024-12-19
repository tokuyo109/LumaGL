const INDEXED_DB_NAME = 'entries';
const INDEXED_DB_STORE_NAME = 'store';

/**
 * indexedDBを開く関数
 */
const openIndexedDB = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(INDEXED_DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const idb = event.target.result;
      if (!idb.objectStoreNames.contains(INDEXED_DB_STORE_NAME)) {
        // オブジェクトストアの作成
        idb.createObjectStore(INDEXED_DB_STORE_NAME, { keyPath: 'path' });
      }
    }

    request.onsuccess = (event) => {
      console.log('データベースに接続しました');
      const idb = event.target.result;
      resolve(idb);
    }

    request.onerror = error => {
      console.error('データベースに接続できませんでした', error);
      reject(error);
    }
  })
}

/**
 * パスをもとにハンドルを取得する関数
 */
const getHandleByPath = async (path) => {
  const idb = await openIndexedDB();
  const transaction = idb.transaction('store', 'readonly');
  const store = transaction.objectStore('store');
  
  return new Promise((resolve, reject) => {
    const request = store.get(path);
    request.onsuccess = () => {
      const entry = request.result;
      resolve(entry ? entry.handle : null);
    };
    request.onerror = (event) => {
      reject(event.target.error);
    }
  })
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
        const handle = await getHandleByPath(relativePath);
        if (!handle) {
          // ファイルが存在しない場合は通常のリクエストを実行
          return fetch(event.request);
        }

        const file = await handle.getFile();
        return new Response(file, {
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
        });
      } catch (error) {
        console.error('ファイル取得エラー:', error);
        // エラーが発生した場合は通常のリクエストを実行
        return fetch(event.request);
      }
    })());
  }
});

