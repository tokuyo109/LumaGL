import { useEffect, useRef } from 'react';
import { useAmbientContext } from './context';
import styles from './index.module.css';

const Ambient = () => {
  const { iframeRef } = useAmbientContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const iframe = iframeRef?.current;
    if (!iframe) return;

    const handleLoad = () => {
      const contentDocument = iframe.contentDocument;
      const canvas = contentDocument?.querySelector('canvas');
      if (!canvas) return;

      const canvasTo = canvasRef.current;
      const ctx = canvasTo?.getContext('2d');

      const animate = () => {
        requestAnimationFrame(animate);
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        ctx?.drawImage(canvas, 0, 0);
      };
      animate();
    };
    iframe.addEventListener('load', handleLoad);
  }, [iframeRef]);

  return <canvas ref={canvasRef} className={styles.ambient}></canvas>;
};

export default Ambient;
