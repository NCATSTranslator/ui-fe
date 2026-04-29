/**
 * Custom DOM events for cross-boundary communication between
 * non-React utilities and React context providers.
 *
 * Dispatch: window.dispatchEvent(new CustomEvent(EVENT_NAME))
 * Listen:   window.addEventListener(EVENT_NAME, handler)
 */
export const CUSTOM_EVENTS = {
  /** Opens the feedback sidebar panel. Dispatched from internalServerErrorToast (toastMessages.tsx). Handled in SidebarProvider. */
  OPEN_FEEDBACK_PANEL: 'open-feedback-panel',
} as const;
