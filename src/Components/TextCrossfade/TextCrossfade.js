import {useEffect, useState} from "react";
import styles from './TextCrossfade.module.scss';

const defaultPhrases = [
  {phrase: "Processing Query", verb:"Processing"},
  {phrase: "Calculating Results", verb:"Calculating"},
  {phrase: "Reasoning", verb:"Reasoning"},
  {phrase: "Processing Results", verb:"Processing"},
  {phrase: "Combining Results", verb:"Combining"},
  {phrase: "More Reasoning", verb:"Reasoning"},
  {phrase: "Formatting Results", verb:"Formatting"},
];

const TextCrossfade = ({ phrases = defaultPhrases, small, interval = 5000 }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const phraseChangeInterval = setInterval(() => {
      setIndex(prevIndex => (prevIndex + 1) % phrases.length);
    }, interval);

    return () => {
      clearInterval(phraseChangeInterval);
    };
  }, []);

  return(
    <div className={`${styles.fadeText} ${(small) ? styles.small : ''}`}>
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