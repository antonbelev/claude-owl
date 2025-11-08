import { useEffect, useState } from 'react';

export const useAppVersion = () => {
  const [version, setVersion] = useState<string>('0.1.0');

  useEffect(() => {
    // Get version from IPC
    if (window.electronAPI?.getAppVersion) {
      window.electronAPI
        .getAppVersion()
        .then(setVersion)
        .catch(() => {
          // Fallback to default version
          setVersion('0.1.0');
        });
    }
  }, []);

  return version;
};
