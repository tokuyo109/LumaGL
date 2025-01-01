import styles from './index.module.css';

type Props = React.ComponentPropsWithoutRef<'input'>;

const TextInput = ({ ...props }: Props) => {
  return <input className={styles.textInput} type="text" {...props} />;
};

export default TextInput;
