/**
 * 汎用コードを記述する
 */
import { EntryNode, Entry } from './types';
export const INDEXED_DB_NAME = 'entries';
export const INDEXED_DB_STORE_NAME = 'store';

let idb: IDBDatabase;

/**
 * indexedDBを開く関数
 */
export const openIndexedDB = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(INDEXED_DB_NAME, 1);
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      idb = (event.target as IDBOpenDBRequest).result;
      if (!idb.objectStoreNames.contains(INDEXED_DB_STORE_NAME)) {
        // オブジェクトストアの作成
        idb.createObjectStore(INDEXED_DB_STORE_NAME, { keyPath: 'path' });
      }
    }

    request.onsuccess = (event: Event) => {
      console.log('データベースに接続しました');
      idb = (event.target as IDBOpenDBRequest).result;
      resolve(idb);
    }

    request.onerror = error => {
      console.error('データベースに接続できませんでした', error);
      reject(error);
    }
  })
}

/**
 * ディレクトリからエントリを収集する関数
 * 
 * @param dirHandle FileSystemDirectoryHandle
 * @param parentPath string
 * @returns Promise<Entry[]> 収集したエントリの配列
 */
export const collectEntries = async (
  dirHandle: FileSystemDirectoryHandle,
  parentPath = '/',
): Promise<Entry[]> => {
  const entries: Entry[] = [];

  const dfs = async (dirHandle: FileSystemDirectoryHandle, parentPath: string) => {
    let lastModifiedByDir: number | null = null;

    for await (const [name, handle] of (dirHandle as unknown) as AsyncIterable<[string, FileSystemHandle]>) {
      const path = `${parentPath}${name}`;

      if (handle.kind === 'directory') {
        await dfs(handle as FileSystemDirectoryHandle, `${path}/`);

        const entry: Entry = {
          path,
          type: handle.kind,
          parentPath,
          handle,
          lastModified: lastModifiedByDir,
        };

        entries.push(entry);
      } else if (handle.kind === 'file') {
        const file = await (handle as FileSystemFileHandle).getFile();
        const lastModified = file.lastModified;

        const entry: Entry = {
          path,
          type: handle.kind,
          parentPath,
          handle,
          lastModified,
        };

        entries.push(entry);

        lastModifiedByDir = lastModifiedByDir === null
          ? lastModified
          : Math.max(lastModifiedByDir, lastModified);
      }
    }
  };

  await dfs(dirHandle, parentPath);
  return entries;
};

/**
 * indexedDBにエントリーを登録する
 * 
 * @param dirHandle FileSystemDirectoryHandle
 */
export const registerEntry = async (
  dirHandle: FileSystemDirectoryHandle,
) => {
  const idb = await openIndexedDB();
  const entries = await collectEntries(dirHandle); // エントリを収集

  const transaction = idb.transaction(INDEXED_DB_STORE_NAME, 'readwrite');
  const store = transaction.objectStore(INDEXED_DB_STORE_NAME);

  // 既存データをクリア
  await new Promise<void>((resolve, reject) => {
    const clearRequest = store.clear();
    clearRequest.onsuccess = () => {
      console.log('エントリーのクリアに成功しました');
      resolve();
    };
    clearRequest.onerror = () => {
      console.log('エントリーのクリアに失敗しました');
      reject();
    };
  });

  for (const entry of entries) {
    await new Promise<void>((resolve, reject) => {
      const request = store.add(entry);
      request.onsuccess = () => {
        console.log('エントリーの登録に成功しました');
        resolve();
      };
      request.onerror = () => {
        console.log('エントリーの登録に失敗しました');
        reject();
      };
    });
  }
};

// /**
//  * indexedDBを開く関数
//  */
// export const openIndexedDB = () => {
//   // データベースを起動
//   const request: IDBOpenDBRequest = indexedDB.open('entries', 1);
//   request.onsuccess = (event: Event) => {
//     const storeName = 'store';
//     const db: IDBDatabase = (event.target as IDBOpenDBRequest).result;
//     const transaction:IDBTransaction = db.transaction(storeName, 'readonly');
//     const store:IDBObjectStore = transaction.objectStore(storeName);
//   };

//   request.onerror = (): void => {
//     console.error('データベースの接続に失敗しました');
//   };
// };

/**
 * ディレクトリを選択する
 * 
 * @returns Promise<FileSystemDirectoryHandle | undefined>
 */
export const selectDirectory = async () => {
  try {
    const dirHandle = (await (
      window as any
    ).showDirectoryPicker()) as FileSystemDirectoryHandle;
    return dirHandle;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('ディレクトリ選択がキャンセルされました');
    } else {
      console.error(error);
    }
  }
};

/**
 * 現在のディレクトリとエクスプローラーを同期させる関数
 *
 * @params dirHandle FileSystemDirectoryHandle
 * @returns EntryNode
 */
export const buildTree = async (dirHandle: any) => {
  const createSubTree = async (
    dirHandle: any,
    parentPath = '',
  ): Promise<any> => {
      const nodes: EntryNode[] = [];
      for await (const [name, handle] of dirHandle) {
        const id = `${parentPath}/${name}`;
        const kind = handle.kind;
        if (kind === 'directory') {
          const childNodes = await createSubTree(handle, id);
          nodes.push({
            id,
            name,
            kind,
            handle,
            childNodes,
          });
        } else {
          nodes.push({ id, name, kind, handle });
        }
      }

      return nodes;
  };

  const rootNode: EntryNode = {
    id: dirHandle.name,
    name: dirHandle.name,
    kind: 'directory',
    handle: dirHandle,
    childNodes: await createSubTree(dirHandle),
  };

  return rootNode;
};

/**
 * 指定ノードまでの道筋を返す関数
 *
 * @param tree ツリー
 * @param id ノードのID
 * @returns EntryNode[] | null 指定ノードまでのノードの配列
 */
export const findNodeById = (tree: EntryNode | null, id: string): EntryNode[] | null => {
  if (!tree) return null;

  const dfs = (node: EntryNode, path: EntryNode[]): EntryNode[] | null => {
    // 現在のノードをパスに追加
    const currentPath = [...path, node];

    // idが一致したら現在のパスを返す
    if (node.id === id) {
      return currentPath;
    }
    // 子ノードが存在する場合探索する
    if (node.childNodes) {
      for (const child of node.childNodes) {
        const result = dfs(child, currentPath);
        if (result) return result;
      }
    }

    // 見つからなかったらnullを返す
    return null;
  };

  // 探索開始
  return tree ? dfs(tree, []) : null;
};

/**
 * ファイル・ディレクトリを作成する。
 * 名前が重複していれば作成し、重複していればそのエントリーを返す。
 * 
 * @param dirHandle FileDirectoryHandle ディレクトリハンドル
 * @param name string ファイル・ディレクトリ名
 * @param kind 'directory' | 'file' エントリータイプ
 * @returns Promise<FileSystemDirectoryHandle | FileSystemFileHandle>
 */
export const createEntry = async (
  dirHandle: any,
  name: string,
  kind: 'directory' | 'file'
) => {
  if (kind === 'directory') {
    return await dirHandle.getDirectoryHandle(name, { create: true });
  } else if (kind === 'file') {
    return await dirHandle.getFileHandle(name, { create: true });
  }
};

/**
 * ファイル・ディレクトリを削除する
 * 
 * @params dirHandle FileSystemDirectoryHandle
 * @params name string
 */
export const removeEntry = async (dirHandle: FileSystemDirectoryHandle, name: string) => {
  await dirHandle.removeEntry(name, { recursive: true });
};

/**
 * ファイル・ディレクトリの名前を変更する
 *
 * @param source FileSystemHandle 対象のハンドル
 * @param sourceParent FileSystemDirectoryHandle 親ディレクトリハンドル
 * @param newName string 新しい名前
 */
export const renameEntry = async (
  source: FileSystemHandle,
  sourceParent: FileSystemDirectoryHandle,
  newName: string,
) => {
  // 名前が同じであればなにもしない
  if (source.name === newName) return;

  const copyFile = async (
    source: FileSystemFileHandle,
    sourceParent: FileSystemDirectoryHandle,
    newName: string,
  ) => {
    // ファイルを読み込む
    const file = await (source as FileSystemFileHandle).getFile();

    // 新しいファイルを作成
    const writable = await (await sourceParent.getFileHandle(newName, { create: true })).createWritable();
    await writable.write(file);
    await writable.close();
  };

  const copyDirectory = async (
    source: FileSystemHandle,
    sourceParent: FileSystemDirectoryHandle,
    newName: string,
  ) => {
    // 新しいディレクトリを作成
    const targetDir = await sourceParent.getDirectoryHandle(newName, { create: true });

    for await (const [name, handle] of (source as any)) {
      if ((handle as FileSystemHandle).kind === 'directory') {
        copyDirectory(handle, targetDir, name);
      } else {
        copyFile(handle, targetDir, name);
      }
    }
  };

  if (source.kind === 'directory') {
    await copyDirectory(source, sourceParent, newName);
  } else if (source.kind == 'file') {
    await copyFile(source as FileSystemFileHandle, sourceParent, newName);
  }
  await sourceParent.removeEntry(source.name, { recursive: true });
};

/**
 * ファイル・ディレクトリを移動する
 * 
 * @params sourceEntry FileSystemHandle 移動元のファイル・ディレクトリ
 * @params sourceParentDir FileSystemDirectoryHandle 移動元の親ディレクトリ
 * @params targetDir FileSystemDirectoryHandle 移動先のディレクトリ
 */
export const moveEntry = async (
  sourceEntry: FileSystemDirectoryHandle | FileSystemFileHandle,
  sourceParentDir: FileSystemDirectoryHandle,
  targetDir: FileSystemDirectoryHandle
) => {
  if (sourceParentDir.name === targetDir.name) {
    console.log('移動するファイルが移動先フォルダと同じのため、処理をスキップします。');
    return;
  }

  const copyFile = async (sourceEntry: FileSystemFileHandle, targetDir: FileSystemDirectoryHandle) => {
    const file = await sourceEntry.getFile();
    const newFileHandle = await targetDir.getFileHandle(file.name, {
      create: true,
    });
    const writable = await newFileHandle.createWritable();
    await writable.write(await file.arrayBuffer());
    await writable.close();
  };
  
  const moveDirectory = async (sourceEntry: any, sourceParentDir: FileSystemDirectoryHandle, targetDir: FileSystemDirectoryHandle) => {
    try {
      const newDirHandle = await targetDir.getDirectoryHandle(sourceEntry.name, {
        create: true,
      });
  
      for await (const [_name, handle] of sourceEntry) {
        if (handle.kind === 'directory') {
          await moveDirectory(handle, sourceEntry, newDirHandle);
        } else if (handle.kind === 'file') {
          await copyFile(handle, newDirHandle);
        }
      }
  
      await sourceParentDir.removeEntry(sourceEntry.name, { recursive: true });
    } catch (error) {
      console.error(`ディレクトリ${sourceEntry.name}の移動に失敗しました:`, error);
      throw error;
    }
  };

  const moveFile = async (sourceEntry: FileSystemFileHandle, sourceParentDir: FileSystemDirectoryHandle, targetDir: FileSystemDirectoryHandle) => {
    try {
      await copyFile(sourceEntry, targetDir);
      await sourceParentDir.removeEntry(sourceEntry.name);
    } catch (error) {
      console.error(`ファイル${sourceEntry.name}の移動に失敗しました:`, error);
      throw error;
    }
  }

  if (sourceEntry.kind === 'directory') {
    await moveDirectory(sourceEntry, sourceParentDir, targetDir);
  } else if (sourceEntry.kind === 'file') {
    await moveFile(sourceEntry, sourceParentDir, targetDir);
  }
}
