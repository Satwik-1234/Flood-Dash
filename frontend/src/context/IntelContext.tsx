import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CWCStationData, IMDDistrictWarning } from '../api/schemas';

interface IntelContextType {
  selectedStation: CWCStationData | null;
  setSelectedStation: (station: CWCStationData | null) => void;
  selectedDistrict: string | null;
  setSelectedDistrict: (district: string | null) => void;
  activeWarnings: IMDDistrictWarning[];
  setActiveWarnings: (warnings: IMDDistrictWarning[]) => void;
  isIntelSidebarOpen: boolean;
  setIntelSidebarOpen: (open: boolean) => void;
}

const IntelContext = createContext<IntelContextType | undefined>(undefined);

export const IntelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedStation, setSelectedStation] = useState<CWCStationData | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [activeWarnings, setActiveWarnings] = useState<IMDDistrictWarning[]>([]);
  const [isIntelSidebarOpen, setIntelSidebarOpen] = useState(false);

  return (
    <IntelContext.Provider value={{
      selectedStation, setSelectedStation,
      selectedDistrict, setSelectedDistrict,
      activeWarnings, setActiveWarnings,
      isIntelSidebarOpen, setIntelSidebarOpen
    }}>
      {children}
    </IntelContext.Provider>
  );
};

export const useIntel = () => {
  const context = useContext(IntelContext);
  if (!context) throw new Error('useIntel must be used within an IntelProvider');
  return context;
};
