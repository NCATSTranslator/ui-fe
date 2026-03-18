import { FC, useMemo } from "react";
import styles from './BreadcrumbLink.module.scss';
import { Link } from "react-router-dom";
import ChevRight from '@/assets/icons/directional/Chevron/Chevron Right.svg?react';
import { TRANSIENT_PARAMS } from '@/features/Navigation/hooks/useResultsNavigate';

interface BreadcrumbLinkProps {
  isLast: boolean;
  crumb: {
    path: string;
    label: string | FC;
  };
  searchParams: URLSearchParams;
}

const BreadcrumbLink: FC<BreadcrumbLinkProps> = ({ isLast, crumb, searchParams }) => {
  const searchString = searchParams.toString();
  const cleanedSearch = useMemo(() => {
    const cleaned = new URLSearchParams(searchString);
    TRANSIENT_PARAMS.forEach(p => cleaned.delete(p));
    return cleaned.toString();
  }, [searchString]);

  const label = typeof crumb.label === 'string' ? crumb.label : <crumb.label />;
  return isLast ? (
    <span aria-current="page" className={styles.current}>{label}</span>
  ) : (
    <>
      <Link to={{ pathname: crumb.path, search: cleanedSearch }} className={styles.breadcrumbLink}>{label}</Link>
      <ChevRight className={styles.separator} aria-hidden />
    </>
  );
};

export default BreadcrumbLink;