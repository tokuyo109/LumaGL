/**
 * Reactに依存しない純粋関数を記述する
 */
import { EntryNode } from './types';

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
