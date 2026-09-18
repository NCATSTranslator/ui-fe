export const getDifferenceInDays = (date2: Date, date1: Date) => {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;

  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

  return Math.round(Math.abs((utc2 - utc1) / _MS_PER_DAY));
};

export const isValidDate = (date: string | number | Date): boolean => {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

export const getFormattedDate = (date: Date, includeTime: boolean = true): string | false => {
  if (!isValidDate(date))
    return false;

  const dateFormatOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  const timeFormatOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true, timeZoneName: 'short' };
  const formattedDate = new Intl.DateTimeFormat('en-US', dateFormatOptions).format(date);
  const formattedTime = new Intl.DateTimeFormat('en-US', timeFormatOptions).format(date);

  if (includeTime) {
    return `${formattedDate} (${formattedTime})`;
  }
  return formattedDate;
};

export const getTimeRelativeDate = (date: Date): string => {
  if (!isValidDate(date)) {
    return '';
  }

  const now = new Date();
  const inputDate = new Date(date);

  const isToday = now.getFullYear() === inputDate.getFullYear() &&
                  now.getMonth() === inputDate.getMonth() &&
                  now.getDate() === inputDate.getDate();

  if (isToday) {
    const timeFormatOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    return new Intl.DateTimeFormat('en-US', timeFormatOptions).format(inputDate).toLowerCase();
  }

  const isCurrentYear = now.getFullYear() === inputDate.getFullYear();

  if (isCurrentYear) {
    const briefDateOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric'
    };
    return new Intl.DateTimeFormat('en-US', briefDateOptions).format(inputDate);
  }

  const numericalDateOptions: Intl.DateTimeFormatOptions = {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit'
  };
  return new Intl.DateTimeFormat('en-US', numericalDateOptions).format(inputDate);
};
