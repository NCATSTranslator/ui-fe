import { FC, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LastViewedPathIDContext } from '@/features/ResultItem/hooks/resultHooks';

const ResultDetailLayout: FC = () => {
  const [lastViewedPathID, setLastViewedPathID] = useState<string | null>(null);
  console.log(lastViewedPathID);

  return (
    <LastViewedPathIDContext.Provider value={{ lastViewedPathID, setLastViewedPathID }}>
      <Outlet />
    </LastViewedPathIDContext.Provider>
  );
};

export default ResultDetailLayout;
