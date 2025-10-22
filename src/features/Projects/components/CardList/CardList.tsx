import { FC, ReactNode } from "react";
import styles from "./CardList.module.scss";

interface CardListProps {
  children: ReactNode;
}
const CardList: FC<CardListProps> = ({ children }) => {
  return (
    <div className={styles.cardList}>
      {children}
    </div>
  )
}

export default CardList;