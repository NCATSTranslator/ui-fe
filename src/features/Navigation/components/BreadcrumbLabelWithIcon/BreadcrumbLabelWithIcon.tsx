import { FC, ReactNode } from 'react';
import styles from './BreadcrumbLabelWithIcon.module.scss';

interface BreadcrumbLabelWithIconProps {
  icon: ReactNode;
  children: ReactNode;
}

const BreadcrumbLabelWithIcon: FC<BreadcrumbLabelWithIconProps> = ({ icon, children }) => (
  <span className={styles.labelWithIcon}>
    <span className={styles.icon} aria-hidden>{icon}</span>
    {children}
  </span>
);

export default BreadcrumbLabelWithIcon;
