import { FC } from 'react';
import styles from './Breadcrumbs.module.scss';
import { useMatches, useSearchParams } from 'react-router-dom';
import { BreadcrumbHandle } from '@/features/Navigation/types/navigation.d';
import BreadcrumbLink from '@/features/Navigation/components/BreadcrumbLink/BreadcrumbLink';

const Breadcrumbs: FC = () => {
  const matches = useMatches();
  const [searchParams] = useSearchParams();

  const crumbs = matches
    .filter((match) => (match.handle as BreadcrumbHandle)?.breadcrumb)
    .map((match) => ({
      label: (match.handle as BreadcrumbHandle).breadcrumb,
      path: match.pathname,
    }));

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
      <ol className={styles.list}>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.path} className={styles.item}>
              <BreadcrumbLink isLast={isLast} crumb={crumb} searchParams={searchParams} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
