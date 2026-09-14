import { FC, useState } from 'react';
import styles from './SettingsPanel.module.scss';
import SidebarTransitionButton from '@/features/Sidebar/components/SidebarTransitionButton/SidebarTransitionButton';
import InteriorPanelContainer from '@/features/Sidebar/components/InteriorPanelContainer/InteriorPanelContainer';
import ApiKeysPanel from './ApiKeysPanel';

const ApiKeysSection: FC = () => {
  const [showApiKeys, setShowApiKeys] = useState<boolean>(false);

  return (
    <>
      <div className={styles.apiSection}>
        <h6 className={styles.title}>API Access</h6>
        <p className={styles.helpText}>Create keys to use the API from your own scripts and tools.</p>
      </div>
      <div className={styles.prefs}>
        <SidebarTransitionButton
          handleClick={() => setShowApiKeys(true)}
          label="API Keys"
        />
      </div>
      {
        showApiKeys &&
        <InteriorPanelContainer
          handleBack={() => setShowApiKeys(false)}
          backButtonLabel="API Keys"
        >
          <ApiKeysPanel />
        </InteriorPanelContainer>
      }
    </>
  );
};

export default ApiKeysSection;
