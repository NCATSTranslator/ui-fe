const isRomanNumeral = (word: string): boolean => {
  const upper = word.toUpperCase();
  if (!/^[MDCLXVI]+$/.test(upper)) return false;
  return /^M*(C[MD]|D?C{0,3})(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})$/.test(upper);
};

export const formatBiolinkEntity = (string: string): string => {
  if(!string)
    return "";
  return(string.replace('biolink:', '')
    .replace(/([A-Z])/g, ' $1')
    .replaceAll('_', ' ')
    .replaceAll('entity', '')
    .replaceAll('condition', '')
    .replaceAll('gene ', '').trim());
};

export const capitalizeFirstLetter = (string: string): string => {
  if(!string)
    return '';

  let newString = string.toLowerCase();
  return newString.charAt(0).toUpperCase() + newString.slice(1);
};

export const formatBiolinkTypeString = (text: string): string => {
  const withoutPrefix = text.replace(/[Bb]iolink:/g, '');

  return withoutPrefix
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const capitalizeWord = (word: string): string => {
  return word.charAt(0).toUpperCase() + word.slice(1);
};

export const capitalizeAllWords = (str: string, splitBy: string = ' '): string => {
  return str.split(splitBy).map(word => {
    if (isRomanNumeral(word)) {
      return word.toUpperCase();
    } else {
      return capitalizeWord(word);
    }
  }).join(splitBy);
};

export const formatBiolinkNode = (string: string, type: string | null = null, species: string | null): string => {
  let newString = string;
  if(type !== null) {
    const formattedType = type.replaceAll("biolink:", "").toLowerCase();
    switch (formattedType) {
      case "gene":
      case "protein":
        newString = newString.toUpperCase();
        if (species !== null) {
          newString += ` (${species})`;
        }
        break;
      default:
        newString = capitalizeAllWords(newString);
        break;
    }
  }

  return newString;
};

export const truncateStringIfTooLong = (string: string, maxLength: number = 20): string => {
  if(string.length > maxLength)
    return string.substring(0, maxLength) + '...';
  return string;
};

export const numberToWords = (num: number): string => {
  const words = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"
  ];

  return num >= 0 && num < 20 ? words[num] : (() => { throw new Error("Number out of supported range"); })();
};

export const intToChar = (num: number): string => {
  if (num < 1 || num > 1000) {
    console.warn("Number supplied to intToChar function out of range, must be between 1 & 1000. Number provided:", num);
    return "--";
  }

  let result = '';
  let remaining = num;
  while (remaining > 0) {
    remaining--;
    result = String.fromCharCode(97 + (remaining % 26)) + result;
    remaining = Math.floor(remaining / 26);
  }
  return result;
};

export const intToNumeral = (num: number): string => {
  if (num < 1 || num > 1000) {
    console.warn("Number supplied to intToNumeral function out of range, must be between 1 & 1000. Number provided:", num);
    return "--";
  }

  const romanMap: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
  ];

  let result = "";
  let remaining = num;
  for (const [value, numeral] of romanMap) {
    while (remaining >= value) {
      result += numeral;
      remaining -= value;
    }
  }

  return result.toLowerCase();
};

export const getFormattedPathfinderName = (name: string) => {
  const formattedName = name.replace(/([A-Z])/g, '$1').trim();
  return formattedName;
};

export const replaceTreatWithImpact = (predicate: string): string => {
  return predicate.replace(/treats/gi, "impacts").replace(/treat/gi, "impact");
};

export const getFormattedNodeName = (nodeName: string | undefined, nodeType: string | null): string => {
  if(!nodeName || !nodeType)
    return capitalizeAllWords(nodeName ?? '');

  if(nodeType === 'biolink:Gene' || nodeType === 'biolink:Protein')
    return nodeName.toUpperCase() ?? '';
  return capitalizeAllWords(nodeName ?? '');
};
