import { FC, ReactNode } from "react";
import styles from "./CardList.module.scss";
import { joinClasses } from "@/features/Common/utils/utilities";

interface CardListProps {
  children: ReactNode;
  className?: string;
}
const CardList: FC<CardListProps> = ({ children, className }) => {
  return (
    <div className={joinClasses(styles.cardList, className)}>
      {children}
    </div>
  )
}

export default CardList;