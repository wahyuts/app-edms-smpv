import { useCallback } from "react";

import DocumentRegisterTable from "./DocumentRegisterTable";

const DashboardDocumentRegisterTable = ({ onDataChanged, tableState }) => {
  const refreshDocuments = useCallback(() => {
    tableState.refreshDocuments();
    onDataChanged?.();
  }, [onDataChanged, tableState]);

  return (
    <DocumentRegisterTable
      {...tableState}
      isDashboard
      refreshDocuments={refreshDocuments}
    />
  );
};

export default DashboardDocumentRegisterTable;
