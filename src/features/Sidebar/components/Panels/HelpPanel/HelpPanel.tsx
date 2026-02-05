import { useState } from 'react';
import styles from './HelpPanel.module.scss';
import TextInput from '@/features/Core/components/TextInput/TextInput';
import SearchIcon from '@/assets/icons/buttons/Search.svg?react';
import CloseIcon from '@/assets/icons/buttons/Close/Close.svg?react';
import { useSimpleSearch } from '@/features/Common/hooks/simpleSearchHook';
import SidebarTransitionButton from '@/features/Sidebar/components/SidebarTransitionButton/SidebarTransitionButton';
import InteriorPanelContainer from '@/features/Sidebar/components/InteriorPanelContainer/InteriorPanelContainer';
import { helpPanelItems } from '@/features/Sidebar/utils/helpPanelItems';
import { HelpPanelItem } from '@/features/Sidebar/types/sidebar';

const HelpPanel = () => {
  // TODO: Add search functionality to HelpPanel
  const { searchTerm, handleSearch } = useSimpleSearch();
  const [activePanel, setActivePanel] = useState<HelpPanelItem | null>(null);

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
        {helpPanelItems.map((item) => (
          <SidebarTransitionButton
            key={item.id}
            className={styles.panelItem}
            handleClick={() => setActivePanel(item)}
            label={item.title}
          />
        ))}
      </div>

      {activePanel && (
        <InteriorPanelContainer 
          className={styles.activePanel}
          handleBack={() => setActivePanel(null)}
          backButtonLabel={activePanel.title}
        >
          {activePanel.component}
        </InteriorPanelContainer>
      )}
    </div>
  );
};

export default HelpPanel;