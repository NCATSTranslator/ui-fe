import { FC, ReactNode, MouseEvent } from "react";
import styles from "./OptionsPane.module.scss";
import { joinClasses } from "@/features/Common/utils/utilities";

interface OptionsPaneProps {
  children: ReactNode;
  className?: string;
  onOptionItemClick?: (e: MouseEvent<HTMLDivElement>) => void;
  open?: boolean;
}

const OptionsPane: FC<OptionsPaneProps> = ({ children, className, open, onOptionItemClick }) => {
  const optionsPaneClass = joinClasses(styles.optionsPane, className, open && styles.open);
  return (
    <div className={optionsPaneClass} onClick={onOptionItemClick}>
      {children && children}
    </div>
  );
};

export default OptionsPane;