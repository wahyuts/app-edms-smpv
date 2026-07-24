import { useSearchParams } from "react-router-dom";

import EscalationAlertTable from "../components/EscalationAlertTable";
import EscalationSummary from "../components/EscalationSummary";
import useEscalationAlertTable from "../hooks/useEscalationAlertTable";

const EscalationAlertPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const directDocumentNumber = searchParams.get("documentNumber")?.trim() ?? "";
  const tableState = useEscalationAlertTable({
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
        <h1 className="mt-2 text-3xl font-bold">Escalation Alert</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#CBD5E1]">
          Monitor dokumen yang melewati SLA dan membutuhkan perhatian
          berdasarkan level eskalasi terkini.
        </p>
      </header>

      <EscalationSummary summary={tableState.summary} />
      <EscalationAlertTable {...tableStateWithUrlSearchSync} />
    </>
  );
};

export default EscalationAlertPage;
