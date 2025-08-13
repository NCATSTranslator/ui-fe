import { FC } from 'react';
import styles from './InputLabel.module.scss';

type InputLabelProps = {
  error?: boolean;
  label?: string;
  subtitle?: string;
};

const InputLabel: FC<InputLabelProps> = ({ label, subtitle, error }) => {
  return (
    <span className={`${styles.inputLabel} ${error && styles.error}`}>
      {label && <span className={styles.label}>{label}</span>}
      {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
    </span>
  );
};

export default InputLabel;