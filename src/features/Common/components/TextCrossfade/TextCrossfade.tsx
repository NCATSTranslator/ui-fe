import { FC, useEffect, useRef, useState } from "react";
import styles from './TextCrossfade.module.scss';
import { PhraseItem } from "@/features/Common/types/global";

interface TextCrossfadeProps {
  phrases?: PhraseItem[];
  small?: boolean;
  interval?: number;
  centerText?: boolean;
}

const defaultPhrases: PhraseItem[] = [
  {phrase: "Processing Query", verb:"Processing"},
  {phrase: "Calculating Results", verb:"Calculating"},
  {phrase: "Reasoning", verb:"Reasoning"},
  {phrase: "Processing Results", verb:"Processing"},
  {phrase: "Combining Results", verb:"Combining"},
  {phrase: "More Reasoning", verb:"Reasoning"},
  {phrase: "Formatting Results", verb:"Formatting"},
];

const TextCrossfade: FC<TextCrossfadeProps> = ({ 
  phrases = defaultPhrases, 
  small = false, 
  interval = 5000, 
  centerText = false 
}) => {
  const [index, setIndex] = useState<number>(0);
  const hasStarted = useRef<boolean>(false);

  useEffect(() => {
    if(hasStarted.current)
      return;
      
    const phraseChangeInterval = setInterval(() => {
      setIndex(prevIndex => (prevIndex + 1) % phrases.length);
    }, interval);

    hasStarted.current = true;

    return () => {
      clearInterval(phraseChangeInterval);
    };
  }, [interval, phrases.length]);

  return(
    <div className={`${styles.fadeText} ${(small) ? styles.small : ''} ${(centerText) ? styles.centerText : ''}`}>
      {
        phrases.map((item, i) => {
          let phrase = item.phrase;
          let key = phrase.replaceAll(" ", "_");
          return(
            <span
              key={key}
              className={`${styles.heading} ${(i===index) ? styles.visible : styles.hidden}`}
              >
              {phrase}
            </span>
          )}
        )
      }
    </div>
  )
}

export default TextCrossfade;