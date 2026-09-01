import { FC, useCallback, useEffect, useState } from 'react';
import styles from './ApiKeysPanel.module.scss';
import Button from '@/features/Core/components/Button/Button';
import TextInput from '@/features/Core/components/TextInput/TextInput';
import LoadingWrapper from '@/features/Core/components/LoadingWrapper/LoadingWrapper';
import TrashIcon from '@/assets/icons/buttons/Trash.svg?react';
import { ApiKey } from '@/features/UserAuth/types/user';
import { createUserApiKey, getUserApiKeys, revokeUserApiKey } from '@/features/UserAuth/utils/userApi';
import { getFormattedDate } from '@/features/Core/utils/dateHelpers';
import { apiKeyCreatedToast, apiKeyCopiedToast, apiKeyRevokedToast, errorToast } from '@/features/Core/utils/toastMessages';

const MAX_KEY_NAME_LENGTH = 128;

const formatKeyDate = (date: string | null): string => {
  if (!date) return 'Never';
  return getFormattedDate(new Date(date), false) || 'Unknown';
};

const ApiKeysPanel: FC = () => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newKeyName, setNewKeyName] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);
  // The one and only time we ever hold a raw key: shown until dismissed, never refetchable.
  const [newKey, setNewKey] = useState<string | null>(null);
  const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    try {
      const userKeys = await getUserApiKeys();
      setKeys(Array.isArray(userKeys) ? userKeys : []);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      errorToast('Failed to load API keys. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleCreate = async () => {
    const name = newKeyName.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      const created = await createUserApiKey(name);
      setNewKey(created.key);
      setNewKeyName('');
      apiKeyCreatedToast();
      await loadKeys();
    } catch (error) {
      console.error('Failed to create API key:', error);
      errorToast('Failed to create API key. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey);
      apiKeyCopiedToast();
    } catch (error) {
      console.error('Failed to copy API key:', error);
      errorToast('Failed to copy the key. Select it and copy manually.');
    }
  };

  const handleRevoke = async (keyId: string) => {
    try {
      await revokeUserApiKey(keyId);
      setPendingRevokeId(null);
      apiKeyRevokedToast();
      await loadKeys();
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      errorToast('Failed to revoke API key. Please try again.');
    }
  };

  return (
    <div className={styles.apiKeysPanel}>
      <p className={styles.helpText}>
        API keys let scripts and tools use the API as you. Send one as an <code>Authorization: Bearer</code> header
        or in an <code>X-API-Key</code> header. Keys cannot be used to manage other keys.
      </p>
      <div className={styles.createKey}>
        <TextInput
          label="Create a new key"
          placeholder="What is this key for?"
          value={newKeyName}
          maxLength={MAX_KEY_NAME_LENGTH}
          handleChange={(value: string) => setNewKeyName(value)}
          handleKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
          disabled={creating}
        />
        <Button
          className={styles.createButton}
          handleClick={handleCreate}
          disabled={creating || newKeyName.trim().length === 0}
        >
          {creating ? 'Creating...' : 'Create Key'}
        </Button>
      </div>
      {
        newKey &&
        <div className={styles.newKey}>
          <h6 className={styles.newKeyTitle}>Copy your new key now</h6>
          <p className={styles.newKeyWarning}>This is the only time it can be shown. Once you dismiss this, it cannot be recovered.</p>
          <code className={styles.newKeyValue}>{newKey}</code>
          <div className={styles.newKeyActions}>
            <Button handleClick={handleCopy} small>Copy</Button>
            <Button handleClick={() => setNewKey(null)} variant="secondary" small>Done</Button>
          </div>
        </div>
      }
      <LoadingWrapper loading={loading}>
        <div className={styles.keyList}>
          <h6 className={styles.listTitle}>Your Keys</h6>
          {
            keys.length === 0
              ? <p className={styles.emptyText}>You do not have any API keys yet.</p>
              : keys.map((key) => (
                <div className={styles.key} key={key.id}>
                  <div className={styles.keyInfo}>
                    <span className={styles.keyName}>{key.name}</span>
                    <code className={styles.keyDisplay}>{key.key_display}</code>
                    <span className={styles.keyMeta}>Created {formatKeyDate(key.time_created)}</span>
                    <span className={styles.keyMeta}>Last used {formatKeyDate(key.time_last_used)}</span>
                  </div>
                  {
                    pendingRevokeId === key.id
                      ? (
                        <div className={styles.confirmRevoke}>
                          <span className={styles.confirmText}>Revoke?</span>
                          <Button handleClick={() => handleRevoke(key.id)} small>Yes</Button>
                          <Button handleClick={() => setPendingRevokeId(null)} variant="secondary" small>No</Button>
                        </div>
                      )
                      : (
                        <Button
                          className={styles.revokeButton}
                          handleClick={() => setPendingRevokeId(key.id)}
                          ariaLabel={`Revoke ${key.name}`}
                          title="Revoke this key"
                          iconOnly
                          small
                        >
                          <TrashIcon />
                        </Button>
                      )
                  }
                </div>
              ))
          }
        </div>
      </LoadingWrapper>
    </div>
  );
};

export default ApiKeysPanel;
