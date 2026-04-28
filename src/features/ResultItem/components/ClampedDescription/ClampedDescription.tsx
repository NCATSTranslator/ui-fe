import { FC, useRef, useState, useLayoutEffect, useEffect, useCallback, MouseEvent, CSSProperties } from 'react';
import AnimateHeight from 'react-animate-height';
import SafeHtmlHighlighter from '@/features/Core/components/SafeHtmlHighlighter/SafeHtmlHighlighter';
import Button from '@/features/Core/components/Button/Button';
import ChevDown from '@/assets/icons/directional/Chevron/Chevron Down.svg?react';
import styles from './ClampedDescription.module.scss';

const DEFAULT_CLAMP_LINES = 4;

type ClampedDescriptionProps = {
  description: string;
  searchWords: string[];
  className?: string;
  lines?: number;
};

const ClampedDescription: FC<ClampedDescriptionProps> = ({
  description,
  searchWords,
  className = '',
  lines = DEFAULT_CLAMP_LINES
}) => {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isClamped, setIsClamped] = useState(false);
  const [clampedHeight, setClampedHeight] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [cssClampActive, setCssClampActive] = useState(true);

  const measure = useCallback(() => {
    const el = textRef.current;
    if (!el) return;

    const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
    const maxHeight = lineHeight * lines;
    const overflows = el.scrollHeight > Math.ceil(maxHeight);

    setIsClamped(overflows);
    if (overflows) setClampedHeight(Math.ceil(maxHeight));
  }, [lines]);

  useLayoutEffect(() => {
    measure();
  }, [description, measure]);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  const handleToggle = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) setCssClampActive(false);
    setIsOpen(prev => !prev);
  }, [isOpen]);

  const handleAnimationEnd = useCallback(() => {
    if (!isOpen)
      setCssClampActive(true);
  }, [isOpen]);

  const animateHeight: number | 'auto' = !isClamped
    ? 'auto'
    : isOpen ? 'auto' : clampedHeight;

  return (
    <div className={`${styles.clampedDescription} ${className}`}>
      <AnimateHeight
        height={animateHeight}
        duration={cssClampActive ? 0 : 250}
        onHeightAnimationEnd={handleAnimationEnd}
      >
        <p
          ref={textRef}
          className={`${styles.text} ${cssClampActive && isClamped ? styles.clamped : ''}`}
          style={{ '--clamp-lines': lines } as CSSProperties}
        >
          <SafeHtmlHighlighter
            stripHtml
            htmlString={description}
            searchWords={searchWords}
            highlightClassName="highlight"
          />
        </p>
      </AnimateHeight>
      {isClamped && (
        <Button
          variant="textOnly"
          smallFont
          handleClick={handleToggle}
          className={`${styles.showMoreButton} ${isOpen ? styles.open : ''}`}
          iconRight={<ChevDown />}
        >
          {isOpen ? 'Show Less' : 'Show More'}
        </Button>
      )}
    </div>
  );
};

export default ClampedDescription;
