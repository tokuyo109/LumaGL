import styles from './index.module.css';
import {
  FaFile,
  FaCss3Alt,
  FaJs,
  FaHtml5,
  FaPython,
  FaJava,
  FaPhp,
} from 'react-icons/fa';

const extensions = new Map<string, JSX.Element>([
  ['css', <FaCss3Alt style={{ color: '#264de4' }} />],
  ['js', <FaJs style={{ color: '#f7df1e' }} />],
  ['html', <FaHtml5 style={{ color: '#e34f26' }} />],
  ['py', <FaPython style={{ color: '#3776ab' }} />],
  ['java', <FaJava style={{ color: '#007396' }} />],
  ['php', <FaPhp style={{ color: '#777bb4' }} />],
]);

const FileIcon = ({ extension }: { extension: string }) => {
  return (
    <div className={styles.icon}>
      {extensions.get(extension) || <FaFile style={{ color: '#a8a8a8' }} />}
    </div>
  );
};

export default FileIcon;
