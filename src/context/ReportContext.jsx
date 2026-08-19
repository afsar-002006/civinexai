import React, { createContext, useContext, useState, useCallback } from 'react';

const ReportContext = createContext();

export function useReport() {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
}

export function ReportProvider({ children }) {
  const [activeReport, setActiveReportState] = useState(null);

  const updateActiveReport = useCallback((data) => {
    setActiveReportState((prev) => {
      if (!data) return null;
      return {
        ...prev,
        ...data,
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  const clearActiveReport = useCallback(() => {
    setActiveReportState(null);
  }, []);

  return (
    <ReportContext.Provider value={{ activeReport, updateActiveReport, clearActiveReport }}>
      {children}
    </ReportContext.Provider>
  );
}
