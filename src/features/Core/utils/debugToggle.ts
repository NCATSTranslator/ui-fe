/**
 * A runtime on/off switch for console debug logging.
 */
export type DebugToggle = {
  isEnabled: () => boolean;
  set: (enabled: boolean) => void;
};

/**
 * Creates a debug-logging switch and exposes its setter as `window[globalName]`,
 * so QA can turn logging on in a deployed build without a rebuild.
 *
 * The flag lives outside React state: flipping it does not re-render anything,
 * it only affects logging from the next call that checks it.
 *
 * @param globalName - Window property the setter is published under, e.g. `__analyticsDebug`
 * @param enabledByDefault - Initial state of the switch
 */
export const createDebugToggle = (globalName: string, enabledByDefault = false): DebugToggle => {
  let enabled = enabledByDefault;
  const set = (value: boolean): void => {
    enabled = value;
  };

  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>)[globalName] = set;
  }

  return { isEnabled: () => enabled, set };
};
