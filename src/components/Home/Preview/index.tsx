import { useRef, useEffect } from 'react';
import styles from './index.module.css';

type Props = {
  path: string;
  update_at: number;
};

const Preview = ({ path, update_at }: Props) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.src = 'entries' + path;
    }
  }, [update_at]);

  return (
    <div className={styles.preview}>
      <iframe
        ref={iframeRef}
        src={'entries' + path}
        style={{ width: '100%', height: '100%', border: 'none' }}
      ></iframe>
    </div>
  );
};

export default Preview;
