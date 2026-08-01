import { useCallback } from "react";

import DocumentRegisterTable from "./DocumentRegisterTable";

const DashboardDocumentRegisterTable = ({ onDataChanged, tableState }) => {
  const refreshDocuments = useCallback(() => {
    return Promise.all([
      tableState.refreshDocuments(),
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
