import { FC, FormEvent, ReactNode, RefObject } from "react";
import styles from "@/features/Projects/components/DataCard/DataCard.module.scss";
import { Link } from "react-router-dom";
import Highlighter from "react-highlight-words";
import TextInput from "@/features/Core/components/TextInput/TextInput";

interface CardNameProps {
  icon?: ReactNode;
  ignoreTitleMatch?: boolean;
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
  ignoreTitleMatch = false,
  isRenaming,
  onTitleChange,
  onFormSubmit,
  textInputRef,
  title,
  searchTerm,
  linkTo,
  linkTarget,
}) => {
  const titleMatches = title.toLowerCase().includes(searchTerm?.toLowerCase() || '');
  const titleContent = (
    isRenaming && onTitleChange && onFormSubmit ? (
      <form onSubmit={onFormSubmit} className={styles.titleForm}>
        <TextInput value={title} handleChange={onTitleChange} iconRightClickToReset ref={textInputRef} className={styles.titleInput}/>
      </form>
    ) : (
      <>
        <Highlighter
          highlightClassName="highlight"
          searchWords={searchTerm ? [searchTerm] : []}
          autoEscape={true}
          textToHighlight={title}
        />
        {
          searchTerm && !titleMatches && !ignoreTitleMatch && (
            <Highlighter
              highlightClassName="highlight"
              searchWords={['*']}
              autoEscape={true}
              textToHighlight=" *"
              className={styles.titleMatch}
            />
          )
        }
      </>
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
