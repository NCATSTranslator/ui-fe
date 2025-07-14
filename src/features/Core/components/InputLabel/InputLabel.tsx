import { FC } from 'react';
import styles from './InputLabel.module.scss';

type InputLabelProps = {
  label?: string;
  subtitle?: string;
};

const InputLabel: FC<InputLabelProps> = ({ label, subtitle }) => {
  return (
    <span className={styles.inputLabel}>
      {label && <span className={styles.label}>{label}</span>}
      {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
    </span>
  );
};

export default InputLabel;