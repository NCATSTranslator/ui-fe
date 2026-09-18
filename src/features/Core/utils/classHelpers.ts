export const joinClasses = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');

export const getPathnameClasses = (pathname: string): { pathnameClass: string; additionalClasses: string } => {
  let pathnameClass = pathname.replace('/', '');
  pathnameClass = pathnameClass.includes('/') ? pathnameClass.replace(/\//g, '-') : pathnameClass;
  pathnameClass = pathnameClass === "" ? "home" : pathnameClass;

  const additionalClasses = pathname.includes('/projects/') ? 'project-detail' : '';
  return { pathnameClass, additionalClasses };
};