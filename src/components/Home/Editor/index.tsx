import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';

import styles from './index.module.css';

type Props = {
  handle: FileSystemFileHandle;
};

const Editor = ({ handle }: Props) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    (async () => {
      if (!ref.current || editorRef.current) return;

      const file = await handle.getFile();
      const content = await file.text();

      const editor = monaco.editor.create(ref.current, {
        value: content,
        language: 'html',
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
