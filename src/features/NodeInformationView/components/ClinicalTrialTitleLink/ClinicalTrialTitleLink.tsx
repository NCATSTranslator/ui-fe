import { FC } from 'react';
import ExternalLink from '@/assets/icons/buttons/External Link.svg?react';
import SkeletonBar from '@/features/Core/components/SkeletonBar/SkeletonBar';

interface ClinicalTrialTitleLinkProps {
  url: string;
  title: string | null | undefined;
  fallbackId?: string;
  isLoading?: boolean;
  showExternalIcon?: boolean;
  skeletonWidth?: string;
  className?: string;
  year?: string | null;
  yearClassName?: string;
}

const ClinicalTrialTitleLink: FC<ClinicalTrialTitleLinkProps> = ({
  url,
  title,
  fallbackId,
  isLoading = false,
  showExternalIcon = false,
  skeletonWidth = '70%',
  className,
  year,
  yearClassName,
}) => {
  if (isLoading && !title) {
    return (
      <>
        <SkeletonBar width={skeletonWidth} height="1em" />
        {yearClassName && <SkeletonBar width="3em" height="0.85em" />}
      </>
    );
  }

  const displayTitle = title ?? fallbackId ?? url;
  if (!url) return null;

  const link = (
    <a href={url} target="_blank" rel="noreferrer" className={className}>
      {displayTitle}
      {showExternalIcon && <> <ExternalLink /></>}
    </a>
  );

  if (year && yearClassName) {
    return (
      <>
        {link}
        <span className={yearClassName}>{year}</span>
      </>
    );
  }

  return link;
};

export default ClinicalTrialTitleLink;
