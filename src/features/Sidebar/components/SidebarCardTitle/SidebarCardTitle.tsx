import { FC, useCallback, useRef, useEffect, useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import Highlighter from "react-highlight-words";
import styles from "@/features/Sidebar/components/SidebarCard/SidebarCard.module.scss";
import TextInput from "@/features/Core/components/TextInput/TextInput";
import { debounce } from "lodash";

interface SidebarCardTitleProps {
  isRenaming?: boolean;
  setIsRenaming?: (isRenaming: boolean) => void;
  onRename?: (value: string) => void;
  linkTarget?: string;
  linkTo?: string;
  searchTerm?: string;
  title: string;
  setTitle?: (title: string) => void;
}

const SidebarCardTitle: FC<SidebarCardTitleProps> = ({
  isRenaming,
  setIsRenaming,
  onRename,
  title,
  searchTerm,
  linkTo,
  linkTarget,
  setTitle,
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
        {titleContent}
      </Link>
    );
  }

  return (
    <div className={styles.title}>
      {titleContent}
    </div>
  );
};

export default SidebarCardTitle;
