import { useState, useEffect } from 'react';
import { useExplorerContext } from '../Explorer/context';
import styles from './index.module.css';

type Props = {
  path: string;
};

const Preview = ({ path }: Props) => {
  const [content, setContent] = useState<JSX.Element | null>(null);
  const { entries } = useExplorerContext();

  useEffect(() => {
    const entry = entries.get(path);

    if (!entry) {
      setContent(<p>previewに失敗しました</p>);
      return;
    }

    (async () => {
      setContent(
        <iframe
          style={{ width: '100%', height: '100%', border: 'none' }}
          src={'entries' + path}
        ></iframe>,
      );
    })();
  }, []);

  return <div className={styles.preview}>{content}</div>;
};

export default Preview;
