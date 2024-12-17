import * as monaco from 'monaco-editor';
import './monacoWorker';
import { useEffect, useRef } from 'react';
import styles from './index.module.css';

// Editorが２回呼び出されることがあるが、main.tsxのstrictModeの処理が原因なことが多い
// 正しくクリーンアップすれば問題ない

type Props = {
  handle: FileSystemFileHandle;
};

const getLanguage = (extension: string): string => {
  const languageMap: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    jsx: 'javascript',
    tsx: 'typescript',
    html: 'html',
    css: 'css',
  };

  return languageMap[extension.toLowerCase()] || 'plaintext';
};

const Editor = ({ handle }: Props) => {
  const ref = useRef(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const extension = handle.name.split('.').slice(-1)[0];

  const readFile = async () => {
    const file = await handle.getFile();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  const writeFile = async (
    handle: FileSystemFileHandle,
    editor: monaco.editor.IStandaloneCodeEditor,
  ) => {
    const writable = await handle.createWritable();
    const content = editor.getValue();
    writable.write(content);
    await writable.close();
  };

  useEffect(() => {
    let disposed = false;

    (async () => {
      // エディタが存在する場合は何もしない
      if (!ref.current || editorRef.current) return;
      const content = await readFile();

      // 読み込み中にアンマウントされた場合は中断する
      if (disposed) return;

      const language = getLanguage(extension);

      const editor = monaco.editor.create(ref.current, {
        value: content,
        language,
        theme: 'vs-dark',
      });
      editor.onDidChangeModelContent(() => {
        writeFile(handle, editor);
      });
      editorRef.current = editor;
    })();

    return () => {
      disposed = true;
      editorRef.current?.dispose();
      editorRef.current = null;
    };
  }, []);

  return <div ref={ref} className={styles.editor}></div>;
};

export default Editor;
