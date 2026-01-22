import { FC, useState, useMemo, useCallback } from "react";
import styles from "./ResultDownloadPanelInner.module.scss";
import { ResultSet, Result } from "@/features/ResultList/types/results.d";
import { SaveGroup } from "@/features/UserAuth/utils/userApi";
import { DownloadScope, ExportFormat, DownloadOptions } from "@/features/ResultDownload/types/download.d";
import { downloadResults, getScopeCounts } from "@/features/ResultDownload/utils/downloadUtils";
import Radio from "@/features/Common/components/Radio/Radio";
import Button from "@/features/Core/components/Button/Button";
import ExportIcon from '@/assets/icons/buttons/Export.svg?react';

interface ResultDownloadPanelInnerProps {
  resultSet: ResultSet;
  filteredResults: Result[];
  allResults: Result[];
  userSaves: SaveGroup | null;
  isPathfinder?: boolean;
  queryTitle?: string;
}

const ResultDownloadPanelInner: FC<ResultDownloadPanelInnerProps> = ({
  resultSet,
  filteredResults,
  allResults,
  userSaves,
  isPathfinder = false,
  queryTitle,
}) => {
  const [scope, setScope] = useState<DownloadScope>('full');
  const [format, setFormat] = useState<ExportFormat>('json');
  const [isDownloading, setIsDownloading] = useState(false);

  const scopeCounts = useMemo(
    () => getScopeCounts(allResults, filteredResults, userSaves),
    [allResults, filteredResults, userSaves]
  );

  const hasBookmarks = scopeCounts.bookmarked > 0;
  const hasResults = scopeCounts.full > 0;

  const handleDownload = useCallback(() => {
    if (!hasResults) return;

    setIsDownloading(true);

    const options: DownloadOptions = {
      scope,
      format,
    };

    try {
      downloadResults(resultSet, allResults, filteredResults, userSaves, options, queryTitle);
    } catch (error) {
      console.error('Error downloading results:', error);
    } finally {
      // Small delay to show downloading state
      setTimeout(() => setIsDownloading(false), 500);
    }
  }, [scope, format, resultSet, allResults, filteredResults, userSaves, hasResults, queryTitle]);

  const currentCount = useMemo(() => {
    switch (scope) {
      case 'full':
        return scopeCounts.full;
      case 'filtered':
        return scopeCounts.filtered;
      case 'bookmarked':
        return scopeCounts.bookmarked;
      default:
        return 0;
    }
  }, [scope, scopeCounts]);

  return (
    <div className={styles.resultDownloadPanelInner}>
      <div className={styles.top}>
        <p className={styles.description}>
          Data and relationships included in this result set can be downloaded for further analysis.
        </p>
        <div className={styles.section}>
          <h4 className={styles.sectionSubtitle}>Export</h4>
          <div className={styles.radioGroup}>
            <Radio
              name="downloadScope"
              value="full"
              checked={scope === 'full'}
              handleClick={() => setScope('full')}
              labelClassName={styles.radioLabel}
              className={styles.radioComponent}
            >
              All Results
              <span className={styles.count}>{scopeCounts.full}</span>
            </Radio>
            <Radio
              name="downloadScope"
              value="filtered"
              checked={scope === 'filtered'}
              handleClick={() => setScope('filtered')}
              labelClassName={styles.radioLabel}
              className={styles.radioComponent}
            >
              Filtered Results
              <span className={styles.count}>{scopeCounts.filtered}</span>
            </Radio>
            {!isPathfinder && (
              <div className={!hasBookmarks ? styles.disabled : ''}>
                <Radio
                  name="downloadScope"
                  value="bookmarked"
                  checked={scope === 'bookmarked'}
                  handleClick={() => hasBookmarks && setScope('bookmarked')}
                  labelClassName={styles.radioLabel}
                  className={styles.radioComponent}
                >
                  Bookmarks Only
                  <span className={styles.count}>{scopeCounts.bookmarked}</span>
                </Radio>
              </div>
            )}
          </div>
        </div>
        <div className={styles.section}>
          <h4 className={styles.sectionSubtitle}>Format</h4>
          <div className={styles.radioGroup}>
            <Radio
              name="downloadFormat"
              value="json"
              checked={format === 'json'}
              handleClick={() => setFormat('json')}
              labelClassName={styles.radioLabel}
              className={styles.radioComponent}
            >
              JSON
            </Radio>
            <Radio
              name="downloadFormat"
              value="csv"
              checked={format === 'csv'}
              handleClick={() => setFormat('csv')}
              labelClassName={styles.radioLabel}
              className={styles.radioComponent}
            >
              CSV
            </Radio>
          </div>
        </div>
      </div>
        <Button
          handleClick={handleDownload}
          disabled={!hasResults || currentCount === 0 || isDownloading}
          iconLeft={<ExportIcon />}
          className={styles.downloadButton}
        >
          {isDownloading ? 'Downloading...' : `Download ${currentCount} Results`}
        </Button>
    </div>
  );
};

export default ResultDownloadPanelInner;
