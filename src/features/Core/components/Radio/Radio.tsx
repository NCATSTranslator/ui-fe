import { ReactNode, FC } from "react";
import styles from './Radio.module.scss';
import { joinClasses } from "@/features/Core/utils/classHelpers";

type RadioProps = {
  className?: string;
  labelClassName?: string;
  name?: string;
  value?: string | number | undefined;
  checked?: boolean;
  children?: ReactNode;
  handleClick?: () => void;
}

const Radio: FC<RadioProps> = ({
  className = "",
  labelClassName = "",
  name = "",
  value = undefined,
  checked = false,
  children,
  handleClick,
}) => {

  const radioClass = joinClasses(styles.radio, checked ? styles.checked : '', className);
  const labelClass = joinClasses(styles.label, labelClassName);

  return (
    <label className={radioClass}>
      <span className={styles.box}></span>
      <input
        type="radio"
        checked={checked}
        name={name}
        value={value}
        onChange={() => handleClick?.()}
        readOnly={!handleClick}
      />
      <span className={labelClass}>{children}</span>
    </label>
  );
}


export default Radio;
