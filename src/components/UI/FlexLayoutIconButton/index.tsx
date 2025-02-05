import styles from './index.module.css';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

const FlexLayoutIconButton = ({ children, ...props }: Props) => {
  return (
    <button {...props} className={styles.flexLayoutIconButton}>
      {children}
    </button>
  );
};

export default FlexLayoutIconButton;
