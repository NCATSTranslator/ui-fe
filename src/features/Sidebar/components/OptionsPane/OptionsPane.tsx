import { FC, ReactNode } from "react";
import styles from "./OptionsPane.module.scss";
import { joinClasses } from "@/features/Common/utils/utilities";

interface OptionsPaneProps {
  children: ReactNode;
  className?: string;
  open?: boolean;
}

const OptionsPane: FC<OptionsPaneProps> = ({ children, className, open }) => {
  const optionsPaneClass = joinClasses(styles.optionsPane, className, open && styles.open);
  return (
    <div className={optionsPaneClass}>
      {children && children}
    </div>
  );
};

export default OptionsPane;