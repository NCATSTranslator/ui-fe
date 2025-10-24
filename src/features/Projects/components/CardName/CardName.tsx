import { FC, FormEvent, ReactNode, RefObject } from "react";
import styles from "@/features/Projects/components/DataCard/DataCard.module.scss";
import { Link } from "react-router-dom";
import Highlighter from "react-highlight-words";
import TextInput from "@/features/Core/components/TextInput/TextInput";

interface CardNameProps {
  icon?: ReactNode;
  isRenaming?: boolean;
  onTitleChange?: (value: string) => void;
  onFormSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  textInputRef?: RefObject<HTMLInputElement | null>;
  linkTarget?: string;
  linkTo?: string;
  searchTerm?: string;
  title: string;
}

const CardName: FC<CardNameProps> = ({
  icon,
  isRenaming,
  onTitleChange,
  onFormSubmit,
  textInputRef,
  title,
  searchTerm,
  linkTo,
  linkTarget,
}) => {
  const titleContent = (
    isRenaming && onTitleChange && onFormSubmit ? (
      <form onSubmit={onFormSubmit}>
        <TextInput value={title} handleChange={onTitleChange} iconRightClickToReset ref={textInputRef} className={styles.titleInput}/>
      </form>
    ) : (
      <Highlighter
        highlightClassName="highlight"
        searchWords={searchTerm ? [searchTerm] : []}
        autoEscape={true}
        textToHighlight={title}
      />
    )
  );

  if (linkTo && !isRenaming) {
    return (
      <Link 
        className={styles.title} 
        to={linkTo}
        target={linkTarget}
      >
        {icon && <div className={styles.icon}>{icon}</div>}
        {titleContent}
      </Link>
    );
  }

  return (
    <div className={styles.title}>
      {icon && <div className={styles.icon}>{icon}</div>}
      {titleContent}
    </div>
  );
};

export default CardName;
