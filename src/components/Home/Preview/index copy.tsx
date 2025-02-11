import { useRef, useEffect } from 'react';
// import { useAmbientContext } from '../Ambient/context';
import styles from './index.module.css';

type Props = {
  path: string;
  update_at: number;
};

const Preview = ({ path, update_at }: Props) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const { setIframeRef } = useAmbientContext();

  useEffect(() => {
    // このタイミングで Context に iframeRef を登録
    setIframeRef(iframeRef);
  }, [iframeRef, setIframeRef]);

  // ブラウザエディタ編集時にupdate_atが変更される
  // iframe.srcにプロパティを再設定することでプレビューを更新する
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.src = 'entries' + path;
  }, [update_at]);

  return (
    <div className={styles.preview}>
      <iframe
        ref={iframeRef}
        // entriesを付けることでServiceWorkerでハンドリングできるようになる
        // indexedDBから返されるレスポンスを表示する
        src={'entries' + path}
        style={{ width: '100%', height: '100%', border: 'none' }}
      ></iframe>
    </div>
  );
};

export default Preview;
