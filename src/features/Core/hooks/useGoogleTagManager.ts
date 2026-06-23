import { useEffect } from 'react';

const GTM_ID_REGEX = /^GTM-\w+$/;
const isValidGTMID = (gtmID: string): boolean => {
  return GTM_ID_REGEX.test(gtmID);
};

export const useGoogleTagManager = (gtmID: string | undefined): void => {
  useEffect(() => {
    if (!gtmID || !isValidGTMID(gtmID)) return;

    const headScript = document.createElement('script');
    headScript.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmID}');
    `;

    const noscript = document.createElement('noscript');
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmID}`;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';
    noscript.appendChild(iframe);

    document.head.appendChild(headScript);

    document.body.insertAdjacentElement('afterbegin', noscript);

    return () => {
      document.head.removeChild(headScript);
      document.body.removeChild(noscript);
    };
  }, [gtmID]);
};
