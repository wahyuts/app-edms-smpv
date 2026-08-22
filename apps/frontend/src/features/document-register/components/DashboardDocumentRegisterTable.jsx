import { useCallback } from "react";

import DocumentRegisterTable from "./DocumentRegisterTable";

const DashboardDocumentRegisterTable = ({ onDataChanged, tableState }) => {
  const refreshDocuments = useCallback((options) => {
    return Promise.all([
      tableState.refreshDocuments(options),
      Promise.resolve(onDataChanged?.()),
    ]);
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
