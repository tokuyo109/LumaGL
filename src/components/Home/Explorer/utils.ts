import { Handle, TreeNode, Root } from './types';

export const DB_NAME = 'lumagl-db';
export const STORE_NAME = 'lumagl-entries-store';

// 便利系
/**
 * パスからパス名を取り出す
 * 例: /directory/test.txt → test.txt
 * 
 * @param path
 * @returns string
 */
export const takePathname = (path: string): string => {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || '';
};

/**
 * パスから拡張子を取り出す
 * 
 * @param path ファイルパス
 * @returns string 拡張子
 */
export const takeExtension = (path: string): string => {
  const parts = path.split('.');
  return parts.length > 1 ? parts.pop() || '' : '';
};

/**
 * パスとパスを/で繋げ、正規化する関数
 */
const makePath = (parentPath: string, childPath: string): string => {
  return `${parentPath}/${childPath}`.replace(/\/+/g, '/');
};

// エクスプローラー系
/**
 * ユーザーが選択したディレクトリのアクセサーを返す関数
 */
export const selectDirectory = async () => {
  if (!('showDirectoryPicker' in window)) {
    console.error('あなたのブラウザーはshowDirectoryPickerをサポートしていません');
    return null;
  }

  try {
    const dirHandle = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker();
    return dirHandle;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log('ディレクトリの選択がキャンセルされました');
    } else {
      console.log('予期せぬエラーが発生しました');
    }
    return null;
  }
};

/**
 * エントリーのハッシュを作成する関数
 */
export const createEntriesHash = async (dirHandle: FileSystemDirectoryHandle): Promise<Map<string, TreeNode>> => {
  // エントリーのハッシュ
  const hashMap: Map<string, TreeNode> = new Map();
  /**
   * エントリーを探索しハッシュにセットする関数
   */
  const dfs = async (
    dirHandle: FileSystemDirectoryHandle,
    parentPath = '/'
  ) => {
    try {
      // ルートディレクトリの登録
      if (parentPath === '/') {
        const root: TreeNode = {
          path: parentPath,
          parentPath: '',
          name: dirHandle.name,
          type: dirHandle.kind,
          handle: dirHandle,
          children: [],
        }
        hashMap.set(root.path, root);
      }

      // サブディレクトリの登録
      for await (const [name, handle] of (dirHandle as unknown) as AsyncIterable<[string, Handle]>) {
        const path = makePath(parentPath, name);

        hashMap.set(path, { 
          path,
          parentPath,
          name,
          type: handle.kind,
          handle,
          children: [],
        });

        if (handle.kind === 'directory') {
          await dfs(handle, path);
        }
      }
    } catch (error) {
      console.error(`${dirHandle.name}ディレクトリの探索中にエラーが発生しました:`, error);
    }
  };
  await dfs(dirHandle);
  return hashMap;
};

/**
 * UI表示用のツリー構造を作成する関数
 */
export const buildTree = (entries: Map<string, TreeNode>): TreeNode | undefined => {
  // ルートノードを取得
  const root = entries.get('/');
  if (!root) return;

  // ツリー構造を作成
  entries.forEach((entry) => {
    const parent = entries.get(entry.parentPath);
    if (parent) {
      parent.children.push(entry);
    }
  });

  return root;
};

/** ツリーハッシュを作成する関数 */
export const buildTreeHash = async (dirHandle: FileSystemDirectoryHandle): Promise<TreeNode | undefined> => {
  const entries = await createEntriesHash(dirHandle);
  return buildTree(entries);
};

/**
 * ツリー構造を作成する関数
 */
export const bt = async (dirHandle: FileSystemDirectoryHandle): Promise<TreeNode | undefined> => {
  const hashMap: Map<string, TreeNode> = new Map();

  const dfs = async (
    dirHandle: FileSystemDirectoryHandle,
    parentPath = ''
  ) => {
    try {
      for await (const [name, handle] of (dirHandle as unknown) as AsyncIterable<[string, Handle]>) {
        const path = makePath(parentPath, name);
        if (handle.kind === 'directory') {
          await dfs(handle, path);
        }
        hashMap.set(path, { 
          path,
          parentPath,
          name,
          type: handle.kind,
          handle,
          children: [],
        });
      }
    } catch (error) {
      console.error(`${dirHandle.name}ディレクトリの探索中にエラーが発生しました:`, error);
    }
  };

  const buildTree = (hashMap: Map<string, TreeNode>): TreeNode | undefined => {
    const root = hashMap.get('/');
    if (!root) return;
    hashMap.forEach((entry) => {
      const parent = hashMap.get(entry.parentPath);
      if (parent) {
        parent.children.push(entry);
      }
    });
    return root;
  };

  const root: TreeNode = { 
    path: '/',
    parentPath: '/',
    name: dirHandle.name,
    type: dirHandle.kind,
    handle: dirHandle,
    children: [],
  };
  hashMap.set(root.path, root);
  await dfs(dirHandle, root.path);

  return buildTree(hashMap);
};

// IndexedDB系
/**
 * IndexedDBリクエストをPromiseでラップするヘルパー関数
 */
const handleIDBRequest = <T>(request: IDBRequest<T>): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * indexedDBを開く関数
 */
export const oidb = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request: IDBOpenDBRequest = indexedDB.open(DB_NAME, 1);

    // データベースのバージョン更新時に実行
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const idb: IDBDatabase = (event.target as IDBOpenDBRequest).result;
      // オブジェクトストアが存在しない場合は作成する
      if (!idb.objectStoreNames.contains(STORE_NAME)) {
        idb.createObjectStore(STORE_NAME, { keyPath: 'path' });
      }
    };

    // データベース接続成功時の処理
    request.onsuccess = (event: Event) => {
      console.log('データベースに接続しました');
      const idb:IDBDatabase = (event.target as IDBOpenDBRequest).result;
      resolve(idb);
    };

    // データベース接続失敗時の処理
    request.onerror = (event: Event) => {
      const error = (event.target as IDBOpenDBRequest).error;
      console.error('データベースに接続できませんでした', error?.message || '不明なエラーです');
      reject(error || new Error('データベース接続中に不明なエラーが発生しました'));
    };
  });
};

/**
 * IndexedDBのトランサクションを作成する関数
 */
const createTransaction = (
  idb: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode = 'readonly'
): IDBObjectStore => {
  const transaction: IDBTransaction = idb.transaction(storeName, mode);
  return transaction.objectStore(storeName);
};
/**
 * IndexedDBからルートディレクトリを取得する
 */
export const getRootFromIndexedDB = async (): Promise<Root> => {
  let root: Root = undefined;
  const idb: IDBDatabase = await oidb();
  const store: IDBObjectStore = await createTransaction(idb, STORE_NAME);

  return new Promise((resolve, reject) => {
    const request: IDBRequest = store.openCursor();
    request.onsuccess = (event: Event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        root = cursor.value;
        cursor.continue();
      } else {
        console.log('ルートディレクトリの取得に成功しました');
        resolve(root);
      }
    };

    request.onerror = (event: Event) => {
      const error = (event.target as IDBOpenDBRequest).error;
      console.log('データの全件取得に失敗しました', error?.message || '不明なエラーです');
      reject(error || new Error('データの取得中に不明なエラーが発生しました'));
    };
  })
};

/**
 * IndexedDBにルートディレクトリを登録する
 */
export const registerRootDirectory = async (
  dirHandle: FileSystemDirectoryHandle
) => {
  const idb: IDBDatabase = await oidb();
  const store: IDBObjectStore = createTransaction(idb, STORE_NAME, 'readwrite');
  try {
    await handleIDBRequest(store.clear());
    console.log('エントリーのクリアに成功しました');

    await handleIDBRequest(store.add({ path: `/${dirHandle.name}`, handle: dirHandle}));
    console.log(`エントリー${dirHandle.name}の登録に成功しました`);
  } catch (error) {
    console.error('エントリーの登録中にエラーが発生しました', error);
  }
}

/**
 * IndexedDBから全てのエントリーを取り出す関数
 */
export const getAllFromIndexedDB = async () => {
  const root = await getRootFromIndexedDB();
  const entries: Map<string, TreeNode> = root ? await createEntriesHash(root.handle) : new Map();
  return entries;
}

/**
 * ファイル・ディレクトリを作成する関数
 * 名前が重複していれば作成し、重複していればそのエントリーを返す。
 */
export const createEntry = async (
  dirHandle: FileSystemDirectoryHandle,
  name: string,
  kind: 'directory' | 'file'
): Promise<Handle> => {
  try {
    switch (kind) {
      case 'directory':
        return await dirHandle.getDirectoryHandle(name, { create: true });
      case 'file':
        return await dirHandle.getFileHandle(name, { create: true });
      default:
        throw new Error(`${kind}は正しい型ではありません`);
    }
  } catch (error) {
    console.error(
      `エントリー"${name}"の作成に失敗しました:`,
      error instanceof Error ? error.message : error
    );
    throw error;
  }
};

/**
 * ファイル・ディレクトリを削除する関数
 */
export const removeEntry = async (
  dirHandle: FileSystemDirectoryHandle,
  name: string
) => {
  try {
    await dirHandle.removeEntry(name, { recursive: true });
  } catch (error) {
    console.error(
      `エントリー"${name}"の作成に失敗しました:`,
      error instanceof Error ? error.message : error
    );
  }
};

/**
 * ファイル・ディレクトリの名前を変更する関数
 */
export const renameEntry = async (
  source: FileSystemHandle,
  sourceParent: FileSystemDirectoryHandle,
  newName: string,
) => {
  if (source.name === newName) return; // 名前が同じであればそのまま返す

  const copyEntry = async (
    handle: FileSystemHandle,
    targetParent: FileSystemDirectoryHandle,
    newName: string
  ): Promise<FileSystemHandle> => {
    if (handle.kind === 'file') {
      // ファイルをコピー
      const file = await (handle as FileSystemFileHandle).getFile();
      const newHandle = await targetParent.getFileHandle(newName, { create: true });
      const writable = await newHandle.createWritable();
      await writable.write(file);
      await writable.close();
      return newHandle;
    } else if (handle.kind === 'directory') {
      // ディレクトリをコピー
      const newDirHandle = await targetParent.getDirectoryHandle(newName, { create: true });
      for await (const [name, childHandle] of (handle as unknown) as AsyncIterable<[string, FileSystemHandle]>) {
        await copyEntry(childHandle, newDirHandle, name);
      }
      return newDirHandle;
    }
    throw new Error(`${handle.kind}は正しい型ではありません`);
  };

  try {
    // 新しいエントリを作成
    const newHandle = await copyEntry(source, sourceParent, newName);
    
    // 元のエントリを削除
    await sourceParent.removeEntry(source.name, { recursive: true });

    console.log(`エントリー"${source.name}"の名前を"${newName}"に変更しました`);
    return newHandle;
  } catch (error) {
    console.error(
      `エントリー"${source.name}"の名前変更に失敗しました`,
      error instanceof Error ? error.message : error
    );
  }
};

/**
 * ファイル・ディレクトリを移動する関数
 */
export const moveEntry = async (
  entries: Map<string, TreeNode>,
  activeNode: TreeNode,
  overNode: TreeNode
) => {
  const copyEntry = async (
    activeNode: TreeNode,
    overNode: TreeNode
  ) => {
    if (activeNode.type === 'file') {

      // ファイルをコピー
      const handle = activeNode.handle as FileSystemFileHandle;
      const file = await handle.getFile();
      
      // 新しいファイルを作成
      const targetDirHandle = overNode.handle as FileSystemDirectoryHandle;
      const newHandle = await targetDirHandle.getFileHandle(handle.name, { create: true });

      // ファイルを新しいファイルにペースト
      const writable = await newHandle.createWritable();
      await writable.write(await file.arrayBuffer());
      await writable.close();

      // 元のファイルを削除
      const parentNode = entries.get(activeNode.parentPath);
      if (!parentNode) return;
      const parentDirHandle = parentNode.handle as FileSystemDirectoryHandle;
      await parentDirHandle.removeEntry(activeNode.name, { recursive: true });
    } else if (activeNode.type === 'directory') {

      // 新しいディレクトリを作成
      const targetDirHandle = overNode.handle as FileSystemDirectoryHandle;
      const newDirHandle = await targetDirHandle.getDirectoryHandle(activeNode.name, { create: true });

      // サブディレクトリのコピー
      activeNode.children.forEach(async (child) => {
        const targetNode: TreeNode = {
          path: makePath(activeNode.parentPath, activeNode.path),
          parentPath: activeNode.parentPath,
          name: newDirHandle.name,
          type: 'directory',
          handle: newDirHandle,
          children: []
        };
        await copyEntry(child, targetNode);
      });

      // 元ディレクトリの削除
      const parentNode = entries.get(activeNode.parentPath);
      if (!parentNode) return;
      const parentDirHandle = parentNode.handle as FileSystemDirectoryHandle;
      await parentDirHandle.removeEntry(activeNode.name, { recursive: true });
    }
  }

  await copyEntry(activeNode, overNode);
};
