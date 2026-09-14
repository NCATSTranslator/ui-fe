import { useId } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Toggle from '@/features/Core/components/Toggle/Toggle';
import { currentColorModeEnabled, setColorModeEnabled } from '@/features/Core/slices/colorModeSlice';
import styles from './SettingsPanel.module.scss';

/**
 * Display settings. Unlike the preference sections these are stored locally,
 * so they stay available when nobody is logged in.
 */
const DisplaySection = () => {
  const dispatch = useDispatch();
  const colorModeEnabled = useSelector(currentColorModeEnabled);
  const labelId = useId();
  const descriptionId = useId();

  return (
    <div className={styles.displaySection}>
      <h6 className={styles.title}>Display</h6>
      <div className={styles.displayPref}>
        <div className={styles.displayPrefLabel}>
          <h6 id={labelId} className={styles.prefLabel}>Color Nodes by Type</h6>
          <p id={descriptionId} className={styles.helpText}>Give canvas and graph nodes a background color based on their type.</p>
        </div>
        <Toggle
          active={colorModeEnabled}
          setActive={(newActive) => dispatch(setColorModeEnabled(newActive))}
          ariaLabelledBy={labelId}
          ariaDescribedBy={descriptionId}
        />
      </div>
    </div>
  );
};

export default DisplaySection;
