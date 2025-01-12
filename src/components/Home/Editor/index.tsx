import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import './monacoWorker';
import { takeExtension } from '../Explorer/utils';
import styles from './index.module.css';

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
  const ref = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const extension = takeExtension(handle.name);

  useEffect(() => {
    (async () => {
      if (!ref.current || editorRef.current) return;

      // テキストの取得
      const file = await handle.getFile();
      const content = await file.text();

      // エディタの作成
      const language = getLanguage(extension);
      const editor = monaco.editor.create(ref.current, {
        value: content,
        language,
        automaticLayout: true,
      });

      editor.onDidChangeModelContent(async () => {
        const writable = await handle.createWritable();
        const content = editor.getValue();
        writable.write(content);
        await writable.close();
      });

      editorRef.current = editor;
    })();

    return () => {
      editorRef.current?.dispose();
      editorRef.current = null;
    };
  }, [handle]);

  return <div className={styles.editor} ref={ref}></div>;
};

export default Editor;
