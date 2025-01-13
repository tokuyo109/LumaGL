import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { emmetHTML } from 'emmet-monaco-es';
import './monacoWorker';
// import { useExplorerContext } from '../Explorer/context';
import Preview from '../Preview';
import { useWindowContext } from '../Window/context';
import { takeExtension } from '../Explorer/utils';
import styles from './index.module.css';
import { Entry } from '../Explorer/types';

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

type Props = {
  node: Entry;
};

const Editor = ({ node }: Props) => {
  const { setWindows } = useWindowContext();
  const ref = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const extension = takeExtension(node.name);

  useEffect(() => {
    (async () => {
      if (!ref.current || editorRef.current) return;

      const handle = node.handle as FileSystemFileHandle;

      // テキストの取得
      const file = await handle.getFile();
      const content = await file.text();

      // エディタの作成
      const language = getLanguage(extension);
      const editor = monaco.editor.create(ref.current, {
        value: content,
        language,
        theme: 'vs-dark',
        automaticLayout: true,
      });
      // Ctrl + S
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        if (extension === 'html') {
          setWindows((prev) => {
            return new Map(prev).set(
              node.path + ':preview',
              <Preview path={node.path} update_at={Date.now()} />,
            );
          });
        }
      });
      emmetHTML(monaco, [extension]);

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
  }, []);

  return <div className={styles.editor} ref={ref}></div>;
};

export default Editor;
