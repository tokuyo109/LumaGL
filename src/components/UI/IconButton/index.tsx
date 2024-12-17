import styles from './index.module.css';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: React.ReactNode;
};

const IconButton = ({ label, children, ...props }: Props) => {
  return (
    <div className={styles.iconButton}>
      <button className={styles.button} {...props}>
        {children}
      </button>
      <span className={styles.label}>{label}</span>
    </div>
  );
};

export default IconButton;
