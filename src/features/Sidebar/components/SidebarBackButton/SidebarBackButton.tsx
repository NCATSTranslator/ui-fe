import { FC } from "react";
import styles from "./SidebarBackButton.module.scss";
import Button from "@/features/Core/components/Button/Button";
import ChevLeftIcon from '@/assets/icons/directional/Chevron/Chevron Left.svg?react';
import { joinClasses } from "@/features/Common/utils/utilities";

interface SidebarBackButtonProps {
  className?: string;
  label: string;
  handleClick: () => void;
}

const SidebarBackButton: FC<SidebarBackButtonProps> = ({
  className,
  label,
  handleClick
}) => {
  return (
    <Button
      iconLeft={<ChevLeftIcon />}
      variant="textOnly"
      handleClick={handleClick}
      className={joinClasses(styles.button, styles.sidebarBackButton, className)}
    >
      {label}
    </Button>
  );
};

export default SidebarBackButton;