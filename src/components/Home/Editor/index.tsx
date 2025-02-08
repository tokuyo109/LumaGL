import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { emmetHTML } from 'emmet-monaco-es';
import './monacoWorker';
import Preview from '../Preview';
import { useExplorerContext } from '../Explorer/context';
import { useWindowContext } from '../Window/context';
import { useSettingContext } from '../Setting/context';
import { takeExtension, makePath } from '../Explorer/utils';
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
  const { entries } = useExplorerContext();
  const { windows, setWindows } = useWindowContext();
  const { theme } = useSettingContext();
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

      // テーマの登録
      monaco.editor.defineTheme('customTheme', {
        base: theme === 'light' ? 'vs' : 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          // 'editor.background': '#00000000',
          'editor.focusBorder': '#00000000',
        },
      });

      // エディタの作成
      const editor = monaco.editor.create(ref.current, {
        // theme: 'vs-dark',
        theme: 'customTheme',
        value: content,
        language,
        automaticLayout: true,
        detectIndentation: false,
        tabSize: 2,
        insertSpaces: true,
      });

      // キーバインディング
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        const indexPath = makePath(node.parentPath, 'index.html');
        if (entries.has(indexPath)) {
          setWindows((prev) => {
            return new Map(prev).set(
              // node.path + ':preview',
              'プレビュー',
              <Preview path={indexPath} update_at={Date.now()} />,
            );
          });
        }
      });

      // emmetの有効化
      emmetHTML(monaco, [extension]);

      // コード編集時のイベント
      let debounce: number;
      editor.onDidChangeModelContent(async () => {
        clearTimeout(debounce);
        debounce = setTimeout(async () => {
          const writable = await handle.createWritable();
          const content = editor.getValue();
          writable.write(content);
          await writable.close();
        }, 300);
      });

      editorRef.current = editor;
    })();

    return () => {
      editorRef.current?.dispose();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      monaco.editor.defineTheme('customTheme', {
        base: theme === 'light' ? 'vs' : 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.focusBorder': '#00000000',
        },
      });
      monaco.editor.setTheme('customTheme');
    }
  }, [theme]);

  return <div className={styles.editor} ref={ref}></div>;
};

export default Editor;
