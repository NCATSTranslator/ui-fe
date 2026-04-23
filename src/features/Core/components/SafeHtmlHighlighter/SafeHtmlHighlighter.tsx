import { FC, ReactElement, useMemo } from 'react';
import DOMPurify from 'dompurify';
import parse, { DOMNode, Element, Text, domToReact, HTMLReactParserOptions } from 'html-react-parser';

interface SafeHtmlHighlighterProps {
  htmlString: string;
  searchWords: string[];
  highlightClassName?: string;
  stripHtml?: boolean;
}

const ALLOWED_TAGS = ['a', 'b', 'i', 'em', 'strong', 'br', 'p', 'span', 'ul', 'ol', 'li', 'sub', 'sup'];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'class'];

const SafeHtmlHighlighter: FC<SafeHtmlHighlighterProps> = ({
  htmlString,
  searchWords,
  highlightClassName = 'highlight',
  stripHtml = false,
}) => {
  const sanitized = useMemo(
    () =>
      stripHtml
        ? DOMPurify.sanitize(htmlString, { ALLOWED_TAGS: [], ALLOWED_ATTR: [], KEEP_CONTENT: true })
        : DOMPurify.sanitize(htmlString, { ALLOWED_TAGS, ALLOWED_ATTR }),
    [htmlString, stripHtml]
  );

  const escapedWords = useMemo(
    () => searchWords.filter(Boolean).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    [searchWords]
  );

  const pattern = useMemo(
    () => (escapedWords.length > 0 ? new RegExp(`(${escapedWords.join('|')})`, 'gi') : null),
    [escapedWords]
  );

  const options: HTMLReactParserOptions = useMemo(() => ({
    replace(domNode: DOMNode) {
      if (domNode instanceof Text && pattern) {
        const text = domNode.data;
        if (!pattern.test(text)) return;

        pattern.lastIndex = 0;
        const parts: (string | ReactElement)[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = pattern.exec(text)) !== null) {
          if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
          }
          parts.push(
            <span key={match.index} className={highlightClassName}>
              {match[0]}
            </span>
          );
          lastIndex = pattern.lastIndex;
        }

        if (lastIndex < text.length) {
          parts.push(text.slice(lastIndex));
        }

        return <>{parts}</>;
      }

      if (domNode instanceof Element && domNode.name === 'a') {
        const { attribs, children } = domNode;
        return (
          <a
            href={attribs.href}
            target="_blank"
            rel="noopener noreferrer"
            className={attribs.class}
          >
            {domToReact(children as DOMNode[], options)}
          </a>
        );
      }
    },
  }), [pattern, highlightClassName]);

  return <>{parse(sanitized, options)}</>;
};

export default SafeHtmlHighlighter;
