import { useState } from "react";
import { Range, getTrackBackground } from 'react-range';
import styles from './Range.module.scss';

const TwoThumbRange = ({min, max, step, initialValues, label, hideLabel, onChange, style, children}) => {

  const [values, setValues] = useState(initialValues);
  let rtl = false;

  onChange = (onChange) ? onChange : ()=>{};

  let labelClass = (hideLabel) ? styles.noLabel : styles.label;

  const handleChange = (values) => {
    setValues(values)
    onChange(values);
  }

  return (
    <div className={`${styles.rangeContainer} ${labelClass} ${styles.twoThumb}`}>
      <span className={styles.min}>{min}</span>

      <Range
        step={step}
        min={min}
        max={max}
        values={values}
        onChange={(values) => handleChange(values)}
        renderTrack={({ props, children }) => (
          <div
          onMouseDown={props.onMouseDown}
          onTouchStart={props.onTouchStart}
            ref={props.ref}
            style={{
              cursor: 'pointer',
              background: getTrackBackground({
                values,
                colors: ['#606368', '#662E6B', '#606368'],
                min: min,
                max: max,
                rtl
              }),
              alignSelf: 'center'
            }}
            className={styles.rangeTrack}
          >
            {children}
          </div>
        )}
        renderThumb={({ index, props, isDragged }) => (
          <div {...props} className={styles.thumbContainer} >
            <div className={styles.value}>
              {values[index]}
            </div>
            <div className={styles.thumb}/>
          </div>
        )}
      />
      <span className={styles.max}>{max}</span>
    </div>
  );
}


export default TwoThumbRange;