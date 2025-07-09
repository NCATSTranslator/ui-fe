import { useState, useEffect, useCallback, useMemo, ReactNode, FC, KeyboardEvent } from "react";
import Button from "@/features/Common/components/Button/Button";
import Warning from '@/assets/icons/status/Alerts/Warning.svg?react';
import Info from '@/assets/icons/status/Alerts/Info.svg?react';
import Checkmark from '@/assets/icons/status/Alerts/Checkmark.svg?react';
import Cross from '@/assets/icons/status/Alerts/Cancelled.svg?react';
import Close from '@/assets/icons/buttons/Close/Close.svg?react';
import { Fade } from "react-awesome-reveal";
import styles from './Alert.module.scss';

export type AlertType = 'success' | 'warning' | 'error' | 'info';
export type VerticalPosition = 'top' | 'middle' | 'bottom';
export type HorizontalPosition = 'left' | 'middle' | 'right';

export interface AlertProps {
  active?: boolean;
  type?: AlertType;
  toggle?: boolean;
  verticalPosition?: VerticalPosition;
  horizontalPosition?: HorizontalPosition;
  timeout?: number;
  fade?: number;
  buttonText?: string;
  onClose?: () => void;
  onOpen?: () => void;
  className?: string;
  disabled?: boolean;
  children: ReactNode;
}

const Alert: FC<AlertProps> = ({
  active = false,
  type = 'info',
  toggle = false,
  verticalPosition = 'middle',
  horizontalPosition = 'middle',
  timeout = 3000,
  fade = 1500,
  buttonText,
  onClose,
  onOpen,
  className,
  disabled = false,
  children
}) => {
  const [isActive, setIsActive] = useState(active);
  const [isFading, setIsFading] = useState(false);

  const totalTimeout = useMemo(() => timeout + fade, [timeout, fade]);

  const fadeClass = useMemo(() => 
    isFading ? styles.fadeOut : styles.fadeIn, 
    [isFading]
  );

  const containerClass = useMemo(() => 
    `${type} ${verticalPosition} ${horizontalPosition}`, 
    [type, verticalPosition, horizontalPosition]
  );

  const icon = useMemo(() => {
    switch(type) {
      case 'success': 
        return <Checkmark />;
      case 'warning': 
        return <Warning />;
      case 'error': 
        return <Cross />;
      default:
        return <Info />;
    }
  }, [type]);

  const fadeOut = useCallback(() => {
    if (disabled) return;
    
    setIsFading(true);
    const timer = setTimeout(() => {
      setIsFading(false);
      setIsActive(false);
      onClose?.();
    }, fade);
    
    return () => clearTimeout(timer);
  }, [disabled, fade, onClose]);

  const handleActivate = useCallback(() => {
    if (disabled) return;
    
    setIsActive(true);
    setIsFading(false);
    onOpen?.();
  }, [disabled, onOpen]);

  useEffect(() => {
    setIsActive(active);
    if (!active) {
      setIsFading(false);
    }
  }, [active]);

  useEffect(() => {
    if (isActive && !toggle && !disabled) {
      const timer = setTimeout(() => {
        fadeOut();
      }, totalTimeout);
      
      return () => clearTimeout(timer);
    }
  }, [isActive, toggle, disabled, totalTimeout, fadeOut]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && toggle) {
      fadeOut();
    }
  }, [toggle, fadeOut]);

  if (disabled)
    return null;

  return (
    <div className={`${styles.alert} ${className || ''}`}>
      {buttonText && (
        <Button 
          handleClick={handleActivate}
          disabled={disabled}
          testId="alert-trigger-button"
        >
          {buttonText}
        </Button>
      )}
      
      {isActive && (
        <div
          onKeyDown={handleKeyDown}
          tabIndex={toggle ? 0 : -1}
          role="alert"
          aria-live={toggle ? "polite" : "assertive"}
        >
          <Fade 
            className={`${styles.alertContainer} ${containerClass} ${fadeClass}`} 
            duration={fade}
          > 
            <div className={styles.container}>
              {toggle && (
                <button 
                  className={styles.close} 
                  onClick={fadeOut}
                  aria-label="Close alert"
                  data-testid="alert-close-button"
                >
                  <Close />
                </button>
              )}
              <span className={styles.icon} aria-hidden="true">
                {icon}
              </span>
              <div className={styles.content}>
                {children}
              </div>
            </div>
          </Fade>
        </div>
      )}
    </div>
  );
};

export default Alert; 