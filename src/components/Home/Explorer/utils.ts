/**
 * 再利用可能な汎用ロジック
 * コンポーネントに依存しない汎用コード
 */
import { Handle, Entry, TreeNode } from './types';
export const INDEXED_DB_NAME = 'entries';
export const INDEXED_DB_STORE_NAME = 'store';


// 便利系
/**
 * FileSystem APIが対応しているか確認する関数
 */
// const isFileSystemSupported = (): boolean => {
//   return 'showDirectoryPicker' in window;
// };

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
 * https://developer.mozilla.org/ja/docs/Web/API/Window/showDirectoryPicker
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
 * IndexedDB操作エラーをハンドリングする関数
 */
const handleIDBError = (operation: string, error: unknown): void => {
  console.error(`${operation} 中にエラーが発生しました:`, error instanceof Error ? error.message : error);
};

/**
 * indexedDBを開く関数
 * @returns {Promise<IDBDatabase>} - 接続されたIDBDatabaseのインスタンス
 */
export const openIndexedDB = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request: IDBOpenDBRequest = indexedDB.open(INDEXED_DB_NAME, 1);

    // データベースのバージョン更新時に実行
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const idb: IDBDatabase = (event.target as IDBOpenDBRequest).result;
      // オブジェクトストアが存在しない場合は作成する
      if (!idb.objectStoreNames.contains(INDEXED_DB_STORE_NAME)) {
        idb.createObjectStore(INDEXED_DB_STORE_NAME, { keyPath: 'path' });
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
 * IndexedDBからすべてのレコードを取得する関数
 * @returns {Promise<Map<string, TreeNode> | void>} - すべてのレコード
 */
export const getAllFromIndexedDB = async (): Promise<Map<
  string,
  TreeNode
>> => {
  const entries: Map<string, TreeNode> = new Map();
  const idb: IDBDatabase = await openIndexedDB();
  const store: IDBObjectStore = createTransaction(idb, INDEXED_DB_STORE_NAME);

  return new Promise((resolve, reject) => {
    const request: IDBRequest = store.openCursor();

    // リクエスト成功時の処理
    request.onsuccess = (event: Event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const value: Entry = cursor.value;
        entries.set(value.path, { ...value, children: [] });
        cursor.continue();
      } else {
        console.log('データの全件取得に成功しました');
        resolve(entries);
      }
    };

    // リクエスト失敗時の処理
    request.onerror = (event: Event) => {
      const error = (event.target as IDBOpenDBRequest).error;
      console.log('データの全件取得に失敗しました', error?.message || '不明なエラーです');
      reject(error || new Error('データの取得中に不明なエラーが発生しました'));
    };
  });
};

/**
 * ディレクトリを再帰的に展開して全てのエントリを取得する関数
 */
export const expandDirectory = async (
  dirHandle: FileSystemDirectoryHandle
) => {
  const entries: Entry[] = [];

  // 深さ優先探索
  const dfs = async (
    dirHandle: FileSystemDirectoryHandle,
    parentPath = ''
  ): Promise<void> => {
    try {
      for await (const [name, handle] of (dirHandle as unknown) as AsyncIterable<[string, Handle]>) {
        const path = makePath(parentPath, name);
        if (handle.kind === 'directory') {
          await dfs(handle, path);
        }
        const entry: Entry = {
          name,
          path,
          parentPath,
          type: handle.kind,
          handle: handle
        };
        entries.push(entry);
      }
    } catch (error) {
      console.error(`${dirHandle.name}ディレクトリの探索中にエラーが発生しました:`, error);
    }
  }

  // ルートディレクトリの登録
  const entry: Entry = {
    name: dirHandle.name,
    path: '/',
    parentPath: '',
    type: 'directory',
    handle: dirHandle
  };
  entries.push(entry);

  // サブディレクトリの登録
  await dfs(dirHandle, entry.path);

  return entries;
};

/**
 * indexedDBにルートディレクトリを登録する
 */
export const registerEntry = async (
  dirHandle: FileSystemDirectoryHandle,
) => {
  const entries: Entry[] = await expandDirectory(dirHandle); // エントリを収集
  const idb: IDBDatabase = await openIndexedDB();
  const store: IDBObjectStore = createTransaction(idb, INDEXED_DB_STORE_NAME, 'readwrite');

  try {
    await handleIDBRequest(store.clear());
    console.log('エントリーのクリアに成功しました');

    for (const entry of entries) {
      await handleIDBRequest(store.add(entry));
      console.log(`エントリー${entry.name}の登録に成功しました`);
    }
  } catch (error) {
    console.error('エントリーの登録中にエラーが発生しました:', error);
  }
};

/**
 * IndexedDBにエントリーを追加する関数
 */
export const addEntryToIndexedDB = async (
  parentNode: Pick<Entry, 'path'>,
  handle: Handle,
): Promise<void> => {
  const entry: Entry = {
    path: makePath(parentNode.path, handle.name),
    parentPath: parentNode.path,
    name: handle.name,
    type: handle.kind,
    handle: handle
  };
  
  const idb: IDBDatabase = await openIndexedDB();
  const store: IDBObjectStore = createTransaction(idb, INDEXED_DB_STORE_NAME, 'readwrite');

  try {
    await handleIDBRequest(store.add(entry));
    console.log(`エントリー"${entry.name}"の作成に成功しました`);
  } catch (error) {
    console.error(
      `エントリー"${entry.name}"の追加に失敗しました:`,
      error instanceof Error ? error.message : error
    );
  } 
};

/**
 * IndexedDBからエントリーを削除する
 */
export const removeEntryFromIndexedDB = async (path: string) => {
  const idb: IDBDatabase = await openIndexedDB();
  const store: IDBObjectStore = createTransaction(idb, INDEXED_DB_STORE_NAME, 'readwrite');
  try {
    await handleIDBRequest(store.delete(path));
    console.log(`エントリー"${path}"の削除に成功しました`);
  } catch (error) {
    console.error(
      `エントリー"${path}"の削除に失敗しました:`,
      error instanceof Error ? error.message : error
    );
  }
};

/**
 * IndexedDBのエントリー名を更新する
 */
export const renameEntryOfIndexedDB = async (
  node: Entry | TreeNode,
  parentNode: Entry | TreeNode,
  newHandle: Handle
) => {
  const idb: IDBDatabase = await openIndexedDB();
  const store: IDBObjectStore = createTransaction(idb, INDEXED_DB_STORE_NAME, 'readwrite');

  const newEntry: Entry = {
    path: makePath(parentNode.path, newHandle.name),
    parentPath: parentNode.path,
    name: newHandle.name,
    type: newHandle.kind,
    handle: newHandle
  };

  try {
    await handleIDBRequest(store.add(newEntry));
    await handleIDBRequest(store.delete(node.path));
    console.log(`エントリー"${node.path}"の名前を"${newEntry.path}"に変更しました`);
  } catch (error) {
    handleIDBError(`エントリー"${node.path}"の名前を変更`, error);
  }
};

/**
 * 指定ノードまでの道筋を返す関数
 *
 * @param tree ツリー
 * @param id ノードのID
 * @returns EntryNode[] | null 指定ノードまでのノードの配列
 */
// export const findNodeById = (tree: EntryNode | null, id: string): EntryNode[] | null => {
//   if (!tree) return null;

//   const dfs = (node: EntryNode, path: EntryNode[]): EntryNode[] | null => {
//     // 現在のノードをパスに追加
//     const currentPath = [...path, node];

//     // idが一致したら現在のパスを返す
//     if (node.id === id) {
//       return currentPath;
//     }
//     // 子ノードが存在する場合探索する
//     if (node.childNodes) {
//       for (const child of node.childNodes) {
//         const result = dfs(child, currentPath);
//         if (result) return result;
//       }
//     }

//     // 見つからなかったらnullを返す
//     return null;
//   };

//   // 探索開始
//   return tree ? dfs(tree, []) : null;
// };

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

      // IndexedDBに差分を反映する
      await addEntryToIndexedDB(overNode, newHandle);
      await removeEntryFromIndexedDB(activeNode.path);

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

      // IndexedDBに差分を反映する
      await addEntryToIndexedDB(parentNode, newDirHandle);
      await removeEntryFromIndexedDB(activeNode.path);
    }
  }

  await copyEntry(activeNode, overNode);
};
