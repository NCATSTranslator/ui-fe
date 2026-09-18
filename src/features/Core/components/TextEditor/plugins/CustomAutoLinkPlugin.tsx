import { AutoLinkPlugin } from "@lexical/react/LexicalAutoLinkPlugin";
import type { LinkMatcher } from "@lexical/react/LexicalAutoLinkPlugin";
import { ReactNode } from "react";

const URL_MATCHER = /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/;

const EMAIL_MATCHER = /[\w.+-]{1,64}@[\w.-]{1,253}\.[a-zA-Z]{2,63}/;

const MATCHERS: LinkMatcher[] = [
  (text: string) => {
    const match = URL_MATCHER.exec(text);
    return (
      match && {
        index: match.index,
        length: match[0].length,
        text: match[0],
        url: match[0]
      }
    );
  },
  (text: string) => {
    const match = EMAIL_MATCHER.exec(text);
    return (
      match && {
        index: match.index,
        length: match[0].length,
        text: match[0],
        url: `mailto:${match[0]}`
      }
    );
  }
];

export default function CustomAutoLinkPlugin(): ReactNode {
  return <AutoLinkPlugin matchers={MATCHERS} />;
}
