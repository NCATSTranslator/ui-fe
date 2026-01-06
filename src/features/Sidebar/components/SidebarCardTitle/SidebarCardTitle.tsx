import { FC, FormEvent, ReactNode, RefObject } from "react";
import styles from "@/features/Sidebar/components/SidebarCard/SidebarCard.module.scss";
import { Link } from "react-router-dom";
import Highlighter from "react-highlight-words";
import TextInput from "@/features/Core/components/TextInput/TextInput";
import { useSidebar } from "@/features/Sidebar/hooks/sidebarHooks";

interface SidebarCardTitleProps {
  ignoreTitleMatch?: boolean;
  isRenaming?: boolean;
  linkTarget?: string;
  linkTo?: string;
  onTitleChange?: (value: string) => void;
  onFormSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  rightIcon?: ReactNode;
  searchTerm?: string;
  textInputRef?: RefObject<HTMLInputElement | null>;
  title: string;
}

const SidebarCardTitle: FC<SidebarCardTitleProps> = ({
  ignoreTitleMatch = false,
  isRenaming,
  rightIcon,
  linkTo,
  linkTarget,
  onTitleChange,
  onFormSubmit,
  searchTerm,
  textInputRef,
  title,
}) => {
  const { addToProjectQuery } = useSidebar();
  const isAddToProjectMode = !!addToProjectQuery;
  const titleMatches = title.toLowerCase().includes(searchTerm?.toLowerCase() || '');
  const titleContent = (
    isRenaming && onTitleChange && onFormSubmit ? (
      <form onSubmit={onFormSubmit}>
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

  if (linkTo && !isRenaming && !isAddToProjectMode) {
    return (
      <Link 
        className={styles.title} 
        to={linkTo}
        target={linkTarget}
      >
        {titleContent}
        {rightIcon && <div className={styles.rightIcon}>{rightIcon}</div>}
      </Link>
    );
  }

  return (
    <div className={styles.title}>
      {titleContent}
      {rightIcon && <div className={styles.rightIcon}>{rightIcon}</div>}
    </div>
  );
};

export default SidebarCardTitle;
