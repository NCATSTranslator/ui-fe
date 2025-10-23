import { FC, useCallback, useRef, useEffect, useState, FormEvent, ReactNode } from "react";
import styles from "@/features/Projects/components/DataCard/DataCard.module.scss";
import { Link } from "react-router-dom";
import Highlighter from "react-highlight-words";
import TextInput from "@/features/Core/components/TextInput/TextInput";
import { debounce } from "lodash";

interface CardNameProps {
  icon?: ReactNode;
  isRenaming?: boolean;
  setIsRenaming?: (isRenaming: boolean) => void;
  onRename?: (value: string) => void;
  linkTarget?: string;
  linkTo?: string;
  searchTerm?: string;
  title: string;
}

const CardName: FC<CardNameProps> = ({
  icon,
  isRenaming,
  setIsRenaming,
  onRename,
  title,
  searchTerm,
  linkTo,
  linkTarget,
}) => {
  const textInputRef = useRef<HTMLInputElement>(null);
  const [localTitle, setLocalTitle] = useState(title);

  const debouncedOnRename = useCallback(debounce((value: string) => {
    onRename?.(value);
  }, 1000), [onRename]);

  useEffect(() => {
    if (isRenaming && textInputRef.current) {
      textInputRef.current.focus();
      textInputRef.current.select();
    }
  }, [isRenaming]);

  const handleChange = (value: string) => {
    setLocalTitle(value);
    debouncedOnRename(value);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onRename?.(localTitle);
    setIsRenaming?.(false);
  };

  const titleContent = (
    isRenaming ? (
      <form onSubmit={handleSubmit}>
        <TextInput value={localTitle} handleChange={handleChange} iconRightClickToReset ref={textInputRef} className={styles.titleInput}/>
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
