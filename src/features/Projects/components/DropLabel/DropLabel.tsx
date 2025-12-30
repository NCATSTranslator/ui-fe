import { FC } from "react";
import styles from './DropLabel.module.scss';
import { joinClasses } from "@/features/Common/utils/utilities";


interface DropLabelProps {
  show: boolean;
  label: string;
  className?: string;
}
const DropLabel: FC<DropLabelProps> = ({
  show,
  label,
  className,
}) => {
  return (
    <span
      className={joinClasses(styles.dropLabel, show && styles.visible, className)}
    >
      {label}
    </span>
  )
}

export default DropLabel;