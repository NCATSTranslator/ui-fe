import { FC } from 'react';
import styles from './Breadcrumbs.module.scss';
import { useMatches, useNavigate, useSearchParams } from 'react-router-dom';
import { BreadcrumbHandle } from '@/features/Navigation/types/navigation.d';
import BreadcrumbLink from '@/features/Navigation/components/BreadcrumbLink/BreadcrumbLink';
import ArrowLeftIcon from '@/assets/icons/directional/Arrows/Arrow Left.svg?react';
import Button from '@/features/Core/components/Button/Button';

const Breadcrumbs: FC = () => {
  const matches = useMatches();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const crumbs = matches
    .filter((match) => (match.handle as BreadcrumbHandle)?.breadcrumb)
    .map((match) => ({
      label: (match.handle as BreadcrumbHandle).breadcrumb,
      path: match.pathname,
    }));

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
      <Button
        variant="secondary"
        iconOnly
        iconLeft={<ArrowLeftIcon className={styles.arrowLeftIcon} />}
        handleClick={() => navigate(-1)}
        className={styles.arrowLeftButton}
      />
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
