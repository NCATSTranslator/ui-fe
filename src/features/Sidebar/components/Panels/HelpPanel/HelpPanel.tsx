import { useState, useMemo, ReactNode, isValidElement } from 'react';
import Highlighter from 'react-highlight-words';
import styles from './HelpPanel.module.scss';
import TextInput from '@/features/Core/components/TextInput/TextInput';
import SearchIcon from '@/assets/icons/buttons/Search.svg?react';
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import { useSimpleSearch } from '@/features/Common/hooks/simpleSearchHook';
import SidebarTransitionButton from '@/features/Sidebar/components/SidebarTransitionButton/SidebarTransitionButton';
import InteriorPanelContainer from '@/features/Sidebar/components/InteriorPanelContainer/InteriorPanelContainer';
import { helpPanelItems } from '@/features/Sidebar/utils/helpPanelItems';
import { HelpPanelItem } from '@/features/Sidebar/types/sidebar';

const extractTextFromReactNode = (node: ReactNode): string => {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(extractTextFromReactNode).join(' ');
  if (isValidElement(node)) {
    if (typeof node.type === 'function') {
      try {
        const result = (node.type as (props: Record<string, unknown>) => ReactNode)(node.props as Record<string, unknown>);
        return extractTextFromReactNode(result);
      } catch {
        return extractTextFromReactNode((node.props as { children?: ReactNode }).children);
      }
    }
    return extractTextFromReactNode((node.props as { children?: ReactNode }).children);
  }
  return '';
};

const helpPanelContentText = new Map(
  helpPanelItems.map(item => [item.id, extractTextFromReactNode(item.component).toLowerCase()])
);

const HelpPanel = () => {
  const { searchTerm, handleSearch } = useSimpleSearch();
  const [activePanel, setActivePanel] = useState<HelpPanelItem | null>(null);

  const filteredItems = useMemo(() => {
    if (!searchTerm) {
      return helpPanelItems.map(item => ({
        ...item,
        titleMatches: false,
        contentMatches: false
      }));
    }

    const lowerSearch = searchTerm.toLowerCase();

    return helpPanelItems
      .map(item => {
        const titleMatches = item.title.toLowerCase().includes(lowerSearch);
        const contentMatches = helpPanelContentText.get(item.id)?.includes(lowerSearch) ?? false;

        if (!titleMatches && !contentMatches) return null;

        return {
          ...item,
          titleMatches,
          contentMatches
        };
      })
      .filter(Boolean) as Array<HelpPanelItem & {
        titleMatches: boolean;
        contentMatches: boolean;
      }>;
  }, [searchTerm]);

  return (
    <div className={styles.helpPanel}>
      <div className={styles.top}>
        <TextInput
          iconLeft={<SearchIcon />}
          handleChange={handleSearch}
          placeholder="Search Help"
          iconRight={searchTerm.length > 0 ? <CloseIcon /> : null}
          iconRightClickToReset
          className={styles.searchInput}
        />
      </div>

      <div className={styles.panelList}>
        {filteredItems.map((item) => (
          <SidebarTransitionButton
            key={item.id}
            className={styles.panelItem}
            handleClick={() => setActivePanel(item)}
            label={item.title}
          >
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
          </SidebarTransitionButton>
        ))}
      </div>

      {activePanel && (
        <InteriorPanelContainer 
          className={styles.activePanel}
          handleBack={() => setActivePanel(null)}
          backButtonLabel={activePanel.title}
        >
          <div className={styles.activePanelContent}>
            {activePanel.component}
          </div>
        </InteriorPanelContainer>
      )}
    </div>
  );
};

export default HelpPanel;