import { Children, FC, Fragment, ReactNode } from 'react';
import cardStyles from '@/features/Evidence/components/EvidenceSection/evidenceCards.module.scss';

interface CardMetaProps {
  /** The line's items. Pass a falsy value for an item that has nothing to show. */
  children: ReactNode;
}

/**
 * The line of secondary details at the foot of an evidence card, its items separated by dots.
 * Items that are empty are left out, and so is the whole line when nothing is left.
 */
const CardMeta: FC<CardMetaProps> = ({ children }) => {
  const items = Children.toArray(children).filter(item => item !== '');
  if (items.length === 0) return null;

  return (
    <p className={cardStyles.meta}>
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <span aria-hidden="true">·</span>}
          {item}
        </Fragment>
      ))}
    </p>
  );
};

export default CardMeta;
