export const joinClasses = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');
