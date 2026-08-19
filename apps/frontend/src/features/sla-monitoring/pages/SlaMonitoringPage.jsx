import { useSearchParams } from "react-router-dom";

import SlaMonitoringTable from "../components/SlaMonitoringTable";
import SlaSummary from "../components/SlaSummary";
import useSlaMonitoringTable from "../hooks/useSlaMonitoringTable";

const SlaMonitoringPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const directDocumentNumber = searchParams.get("documentNumber")?.trim() ?? "";
  const tableState = useSlaMonitoringTable({
    directSearchValue: directDocumentNumber,
  });
  const tableStateWithUrlSearchSync = {
    ...tableState,
    setSearchValue: (nextSearchValue) => {
      tableState.setSearchValue(nextSearchValue);

      setSearchParams((currentSearchParams) => {
        const nextSearchParams = new URLSearchParams(currentSearchParams);
        const normalizedSearchValue = String(nextSearchValue ?? "").trim();

        if (normalizedSearchValue) {
          nextSearchParams.set("documentNumber", normalizedSearchValue);
        } else {
          nextSearchParams.delete("documentNumber");
        }

        return nextSearchParams;
      }, { replace: true });
    },
  };

  return (
    <>
      <header>
        {/* <p className="text-sm font-semibold uppercase tracking-wide text-[#0F7BFF]">
          APP Engineering
        </p> */}
        <h1 className="mt-2 text-3xl font-bold">Review Time Monitoring</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#CBD5E1]">
          Monitor the status of all engineering documents based on the latest review time calculations.
        </p>
      </header>

      <SlaSummary
        isLoading={tableState.isLoading}
        onSelectSlaStatus={tableState.setSlaStatusFilter}
        selectedSlaStatus={tableState.slaStatusFilter}
        summary={tableState.summary}
      />
      <SlaMonitoringTable {...tableStateWithUrlSearchSync} />
    </>
  );
};

export default SlaMonitoringPage;
