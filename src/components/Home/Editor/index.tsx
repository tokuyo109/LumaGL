import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { emmetHTML } from 'emmet-monaco-es';
import './monacoWorker';
import Preview from '../Preview';
import { useWindowContext } from '../Window/context';
import { takeExtension } from '../Explorer/utils';
import styles from './index.module.css';
import { Entry } from '../Explorer/types';

/** 拡張子に対応した言語を返す関数 */
const getLanguage = (extension: string): string => {
  const languageMap: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    jsx: 'javascript',
    tsx: 'typescript',
    html: 'html',
    css: 'css',
    frag: 'glsl',
    glsl: 'glsl',
  };

  return languageMap[extension.toLowerCase()] || 'plaintext';
};

/** GLSL言語のシンタックスハイライトを登録する関数 */
const registerGLSL = () => {
  monaco.languages.register({
    id: 'glsl',
  });

  monaco.languages.setMonarchTokensProvider('glsl', {
    tokenizer: {
      root: [
        [
          /\b(attribute|const|uniform|varying|break|continue|if|else|in|out|inout|void|bool|int|float|true|false|vec2|vec3|vec4)\b/,
          'keyword',
        ],
        [/\d/, 'number'],
        [/[a-zA-Z_]\w*/, 'identifier'],
        [/\/\/.*/, 'comment'],
      ],
    },
  });
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

      // 言語の登録
      const language = getLanguage(extension);
      if (language === 'glsl') {
        registerGLSL();
      }

      // エディタの作成
      const editor = monaco.editor.create(ref.current, {
        value: content,
        language,
        theme: 'vs-dark',
        automaticLayout: true,
      });

      // キーバインディング
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

      // emmetの有効化
      emmetHTML(monaco, [extension]);

      // コード編集時のイベント
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
