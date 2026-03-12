import { FC } from "react";
import styles from './BreadcrumbLink.module.scss';
import { Link } from "react-router-dom";
import ChevRight from '@/assets/icons/directional/Chevron/Chevron Right.svg?react';

interface BreadcrumbLinkProps {
  isLast: boolean;
  crumb: {
    path: string;
    label: string | FC;
  };
  searchParams: URLSearchParams;
}

const BreadcrumbLink: FC<BreadcrumbLinkProps> = ({ isLast, crumb, searchParams }) => {

  const label = typeof crumb.label === 'string' ? crumb.label : <crumb.label />;
  return isLast ? (
    <span aria-current="page" className={styles.current}>{label}</span>
  ) : (
    <>
      <Link to={{ pathname: crumb.path, search: searchParams.toString() }} className={styles.breadcrumbLink}>{label}</Link>
      <ChevRight className={styles.separator} aria-hidden />
    </>
  );
};

export default BreadcrumbLink;