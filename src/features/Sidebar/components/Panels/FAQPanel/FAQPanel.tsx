import { useMemo, FC } from 'react';
import Highlighter from 'react-highlight-words';
import styles from './FAQPanel.module.scss';
import Accordion from '@/features/Common/components/Accordion/Accordion';
import TextInput from '@/features/Core/components/TextInput/TextInput';
import SearchIcon from '@/assets/icons/buttons/Search.svg?react';
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import { useSimpleSearch } from '@/features/Common/hooks/simpleSearchHook';
import { FAQItemParagraph, FAQItem } from '@/features/Sidebar/types/sidebar';
import { faqItems } from '@/features/Sidebar/utils/faqItems';

// Helper to extract all text for searching
const getParagraphText = (p: string | FAQItemParagraph): string => 
  typeof p === 'string' ? p : p.text;

// Helper component for rendering a paragraph with highlighting
const HighlightedParagraph: FC<{ 
  paragraph: string | FAQItemParagraph; 
  searchTerm: string;
}> = ({ paragraph, searchTerm }) => {
  if (typeof paragraph === 'string') {
    return (
      <p>
        <Highlighter
          highlightClassName="highlight"
          searchWords={searchTerm ? [searchTerm] : []}
          autoEscape={true}
          textToHighlight={paragraph}
        />
      </p>
    );
  }

  const { text, anchor } = paragraph;
  
  return (
    <p>
      {anchor && <span className="hash-anchor" id={anchor}></span>}
      <Highlighter
        highlightClassName="highlight"
        searchWords={searchTerm ? [searchTerm] : []}
        autoEscape={true}
        textToHighlight={text}
      />
    </p>
  );
};

const FAQPanel = () => {
  const { searchTerm, handleSearch } = useSimpleSearch();
  
  const classes = {
    accordionClass: styles.accordion,
    panelClass: styles.accordionPanel,
    buttonClass: styles.accordionButton,
  };

  // Filter help items based on search
  const filteredFAQItems = useMemo(() => {
    if (!searchTerm) {
      return faqItems.map(item => ({
        ...item,
        titleMatches: false,
        contentMatches: false
      }));
    }

    const lowerSearch = searchTerm.toLowerCase();
    
    return faqItems
      .map(item => {
        const titleMatches = item.title.toLowerCase().includes(lowerSearch);
        const contentText = item.paragraphs.map(getParagraphText).join(' ');
        const contentMatches = contentText.toLowerCase().includes(lowerSearch);
        
        if (!titleMatches && !contentMatches) {
          return null;
        }

        return {
          ...item,
          titleMatches,
          contentMatches
        };
      })
      .filter(Boolean) as Array<FAQItem & { 
        titleMatches: boolean; 
        contentMatches: boolean;
      }>;
  }, [searchTerm]);

  return (
    <div className={styles.faqPanel}>
      <div className={styles.top}>
        <TextInput
          iconLeft={<SearchIcon />}
          handleChange={handleSearch}
          placeholder="Search FAQs"
          iconRight={searchTerm.length > 0 ? <CloseIcon /> : null}
          iconRightClickToReset
          className={styles.searchInput}
        />
      </div>

      <div className={styles.content}>
        <p className={`caption ${styles.caption}`}>Last updated on October 16th, 2025</p>
        {filteredFAQItems.length === 0 && searchTerm && (
          <p className={styles.noResults}>No help topics match your search.</p>
        )}
        {filteredFAQItems.map((item) => (
          <Accordion
            key={item.id}
            title={
              <span>
                <Highlighter
                  highlightClassName="highlight"
                  searchWords={searchTerm ? [searchTerm] : []}
                  autoEscape={true}
                  textToHighlight={item.title}
                />
                {searchTerm && !item.titleMatches && item.contentMatches && (
                  <Highlighter
                    highlightClassName="highlight"
                    searchWords={['*']}
                    autoEscape={true}
                    textToHighlight=" *"
                  />
                )}
              </span>
            }
            // uncomment to expand all accordions when search term is used
            // expanded={searchTerm ? true : false}
            accordionClass={classes.accordionClass}
            panelClass={classes.panelClass}
            buttonClass={classes.buttonClass}
          >
            {item.paragraphs.map((paragraph, pIdx) => (
              <HighlightedParagraph
                key={pIdx}
                paragraph={paragraph}
                searchTerm={searchTerm}
              />
            ))}
          </Accordion>
        ))}
      </div>
    </div>
  );
};

export default FAQPanel;