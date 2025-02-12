import { useRef, useEffect } from 'react';
import { useSettingContext } from '../Setting/context';
import styles from './index.module.css';

type Props = {
  path: string;
  update_at: number;
};

const Preview = ({ path, update_at }: Props) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme, isAmbient } = useSettingContext();

  // ブラウザエディタ編集時にupdate_atが変更される
  // iframe.srcにプロパティを再設定することでプレビューを更新する
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    if (theme === 'ambient') {
      console.log(isAmbient);
      const handleLoad = () => {
        const contentDocument = iframe.contentDocument;
        const canvas = contentDocument?.querySelector('canvas');
        if (!canvas) return;

        const canvasTo = canvasRef.current;
        const ctx = canvasTo?.getContext('2d');

        const animate = () => {
          requestAnimationFrame(animate);
          if (canvas.width === 0 || canvas.height === 0) return;
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
          ctx?.drawImage(canvas, 0, 0);
        };
        animate();
      };
      iframe.addEventListener('load', handleLoad);
    }
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
      <canvas ref={canvasRef} className={styles.ambient}></canvas>
    </div>
  );
};

export default Preview;
