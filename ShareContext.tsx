import React, { createContext, useContext, useState, ReactNode } from 'react';
import ShareSheet from '../components/ShareSheet'; // React Native version of ShareSheet

interface ShareData {
  title?: string;
  text?: string;
  url: string;
}

interface ShareContextType {
  openShare: (data: ShareData) => void;
}

const ShareContext = createContext<ShareContextType | undefined>(undefined);

export const ShareProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [shareData, setShareData] = useState<ShareData | null>(null);

  const openShare = (data: ShareData) => {
    setShareData(data);
  };

  const closeShare = () => {
    setShareData(null);
  };

  return (
    <ShareContext.Provider value={{ openShare }}>
      {children}
      {shareData && (
        <ShareSheet 
          data={shareData} 
          onClose={closeShare} 
        />
      )}
    </ShareContext.Provider>
  );
};

export const useShare = () => {
  const context = useContext(ShareContext);
  if (!context) throw new Error('useShare must be used within ShareProvider');
  return context;
};