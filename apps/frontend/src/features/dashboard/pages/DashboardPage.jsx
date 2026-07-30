import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Folder,
  MessageCircle,
  MessagesSquare,
  UsersRound,
} from "lucide-react";

import {
  DashboardDocumentRegisterTable,
  useDocumentRegisterTable,
} from "@/features/document-register";
import {
  DOCUMENT_STATUS,
  SLA_STATUS,
} from "@/features/document-register/constants/document.constants";
import { useProjectContextStore } from "@/shared/stores/project-context.store";
import { DashboardApiService } from "../services/dashboard-api.service";

const dashboardRefreshIntervalMs = 60 * 1000;
const DASHBOARD_RIGHT_PANEL_COLLAPSED_STORAGE_KEY = "edms.dashboard.rightPanel.collapsed";

const getInitialDashboardRightPanelCollapsed = () => {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(DASHBOARD_RIGHT_PANEL_COLLAPSED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

const kpiCards = [
  {
    cardTone: "border-[#1D4ED8]/70 from-[#0F1E46] via-[#07162E] to-[#061B2F]",
    description: "All engineering documents",
    icon: FileText,
    iconTone: "bg-gradient-to-br from-[#6D28D9] to-[#0F7BFF] text-white",
    key: "totalDocuments",
    label: "Total Documents",
    statusFilter: "",
  },
  {
    cardTone: "border-[#A16207]/80 from-[#29230B] via-[#101C1A] to-[#061B2F]",
    description: "Dokumen dalam review",
    icon: UsersRound,
    iconTone: "bg-gradient-to-br from-[#FACC15] to-[#F59E0B] text-white",
    key: "processReview",
    label: "Process Review",
    statusFilter: DOCUMENT_STATUS.PROCESS_REVIEW,
  },
  {
    cardTone: "border-[#C2410C]/80 from-[#331A10] via-[#161518] to-[#061B2F]",
    description: "Menunggu komentar proses",
    icon: MessageCircle,
    iconTone: "bg-gradient-to-br from-[#F97316] to-[#C2410C] text-white",
    key: "processCommentReject",
    label: "Process Comment / Reject",
    statusFilter: [
      DOCUMENT_STATUS.PROCESS_COMMENT,
      DOCUMENT_STATUS.PROCESS_REJECT,
    ],
    summaryRows: [
      { key: "processComment", label: "Comment" },
      { key: "processReject", label: "Reject" },
    ],
  },
  {
    cardTone: "border-[#854D0E]/80 from-[#24240D] via-[#101C1A] to-[#061B2F]",
    description: "Dokumen dalam review",
    icon: Folder,
    iconTone: "bg-gradient-to-br from-[#B39208] to-[#854D0E] text-white",
    key: "projectReview",
    label: "Project Review",
    statusFilter: DOCUMENT_STATUS.PROJECT_REVIEW,
  },
  {
    cardTone: "border-[#BE3455]/70 from-[#281526] via-[#151628] to-[#061B2F]",
    description: "Menunggu komentar proyek",
    icon: MessagesSquare,
    iconTone: "bg-gradient-to-br from-[#E0526B] to-[#BE3455] text-white",
    key: "projectCommentReject",
    label: "Project Comment / Reject",
    statusFilter: [
      DOCUMENT_STATUS.PROJECT_COMMENT,
      DOCUMENT_STATUS.PROJECT_REJECT,
    ],
    summaryRows: [
      { key: "projectComment", label: "Comment" },
      { key: "projectReject", label: "Reject" },
    ],
  },
  {
    cardTone: "border-[#047857]/80 from-[#053D33] via-[#062D2C] to-[#061B2F]",
    description: "Dokumen disetujui",
    icon: CheckCircle2,
    iconTone: "bg-gradient-to-br from-[#86EFAC] to-[#16A34A] text-white",
    key: "approved",
    label: "Approved / Final As-Built",
    statusFilter: DOCUMENT_STATUS.APPROVED,
    summaryRows: [
      { key: "finalAsBuilt", label: "Final As-Built" },
    ],
  },
];

const slaRows = [
  {
    key: SLA_STATUS.ON_TRACK,
    label: "On Track",
    tone: "bg-[#22C55E]/15 text-[#86EFAC]",
  },
  {
    key: SLA_STATUS.AT_RISK,
    label: "At Risk",
    tone: "bg-[#FACC15]/15 text-[#FDE68A]",
  },
  {
    key: SLA_STATUS.OVERDUE,
    label: "Overdue",
    tone: "bg-[#EF4444]/15 text-[#FCA5A5]",
  },
  {
    key: SLA_STATUS.FINAL_AS_BUILT,
    label: "Final As-Built",
    tone: "bg-[#00C8FF]/15 text-[#7DD3FC]",
  },
];

const escalationRows = [
  {
    key: "total",
    label: "Total Escalation",
    tone: "text-[#FCA5A5]",
  },
  {
    key: "Level 1",
    label: "Level 1",
    tone: "text-[#FDE68A]",
  },
  {
    key: "Level 2",
    label: "Level 2",
    tone: "text-[#FDBA74]",
  },
  {
    key: "Level 3",
    label: "Level 3",
    tone: "text-[#FCA5A5]",
  },
  {
    key: "Level 4",
    label: "Level 4",
    tone: "text-[#F87171]",
  },
];

const getSummaryValue = (summary, key) => Number(summary?.[key] ?? 0);

const DashboardKpiCard = ({ card, isActive, isError, isLoading, onSelect, summary, value }) => {
  const Icon = card.icon;
  const activeDescription = isActive ? "Active status filter" : "Apply status filter";

  return (
    <button
      aria-label={`${card.label}. ${activeDescription}. ${value} documents.`}
      aria-pressed={isActive}
      className={[
        "min-h-36 rounded-lg border bg-gradient-to-br p-4 text-left transition-all",
        "cursor-pointer hover:-translate-y-0.5 hover:border-[#0F7BFF] hover:shadow-lg hover:shadow-[#0F7BFF]/10",
        "focus:outline-none focus:ring-2 focus:ring-[#0F7BFF] focus:ring-offset-2 focus:ring-offset-[#020617]",
        isActive
          ? "ring-2 ring-[#00C8FF] ring-offset-2 ring-offset-[#020617] shadow-lg shadow-[#00C8FF]/10"
          : "",
        card.cardTone,
      ].join(" ")}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start gap-3">
        <span
          className={[
            "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-lg",
            card.iconTone,
          ].join(" ")}
        >
          <Icon className="h-6 w-6" />
        </span>
        <h2 className="min-w-0 text-sm font-semibold text-[#F8FAFC]">
          {card.label}
        </h2>
      </div>
      <p className="mt-4 text-center text-4xl font-extrabold text-[#F8FAFC]">
        {isLoading ? "-" : value}
      </p>
      <p className="mt-2 text-center text-sm text-[#CBD5E1]">
        {isError ? "Data gagal dimuat" : card.description}
      </p>
      {card.summaryRows ? (
        <div className="mt-3 flex items-center justify-center gap-6 text-center text-sm font-semibold text-[#CBD5E1]">
          {card.summaryRows.map((summaryRow) => (
            <p key={summaryRow.key} className="whitespace-nowrap">
              <span>{summaryRow.label} : </span>
              <span
                className={
                  summaryRow.label === "Reject" ? "text-[#EF4444]" : ""
                }
              >
                {isLoading ? "-" : getSummaryValue(summary, summaryRow.key)}
              </span>
            </p>
          ))}
        </div>
      ) : null}
    </button>
  );
};

const DashboardInfoWidget = ({ children, icon: Icon, title, to }) => {
  const Component = to ? Link : "section";

  return (
    <Component
      className={[
        "block overflow-hidden rounded-lg border border-[#123A5A] bg-[#061B2F]",
        to ? "transition-colors hover:border-[#0F7BFF] hover:bg-[#08233B]" : "",
      ].join(" ")}
      to={to}
    >
      <header className="flex items-center gap-3 px-4 py-4">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#123A5A] bg-[#08233B] text-[#CBD5E1]">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="text-xl font-bold">{title}</h2>
      </header>
      {children}
    </Component>
  );
};

const DashboardRightInformationPanel = ({
  children,
  isCollapsed,
  onCollapse,
}) => {
  return (
    <aside
      aria-hidden={isCollapsed}
      className={[
        "grid min-w-0 gap-4 overflow-hidden transition-[width,opacity,transform] duration-300 ease-in-out",
        isCollapsed
          ? "h-0 w-0 translate-x-4 opacity-0"
          : "h-auto w-full translate-x-0 opacity-100 xl:w-[clamp(280px,22vw,340px)]",
      ].join(" ")}
      inert={isCollapsed ? true : undefined}
    >
      <div className="flex justify-end">
        <button
          aria-label="Collapse right information panel"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#123A5A] bg-[#08233B] text-[#CBD5E1] transition-colors hover:border-[#0F7BFF] hover:bg-[#0B2B47] hover:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0F7BFF]"
          onClick={onCollapse}
          title="Collapse right information panel"
          type="button"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      {children}
    </aside>
  );
};

const DashboardPage = () => {
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(
    getInitialDashboardRightPanelCollapsed,
  );
  const queryClient = useQueryClient();
  const tableState = useDocumentRegisterTable({
    defaultPageSize: 10,
    preserveStatusFilterOnProjectChange: true,
  });
  const activeProjectId = useProjectContextStore((state) => state.activeProject?.id);
  const summaryQuery = useQuery({
    enabled: Boolean(activeProjectId),
    queryFn: DashboardApiService.getSummary,
    queryKey: ["dashboard", "summary", activeProjectId ?? null],
    refetchInterval: dashboardRefreshIntervalMs,
    refetchOnMount: "always",
    staleTime: 0,
  });
  const dashboardSummary = summaryQuery.data ?? {};
  const kpiSummary = dashboardSummary.kpiSummary ?? {};
  const slaSummary = dashboardSummary.slaSummary ?? {};
  const escalationSummary = dashboardSummary.escalationSummary ?? {};
  const isDashboardLoading = summaryQuery.isLoading;
  const isDashboardError = summaryQuery.isError;

  const setRightPanelCollapsed = (isCollapsed) => {
    try {
      window.localStorage.setItem(
        DASHBOARD_RIGHT_PANEL_COLLAPSED_STORAGE_KEY,
        String(isCollapsed),
      );
    } catch {
      // UI preference persistence is non-critical; keep the interaction working.
    }
    setIsRightPanelCollapsed(isCollapsed);
  };

  const isKpiCardActive = (statusFilter) => {
    const currentFilter = tableState.statusFilter;
    if (Array.isArray(statusFilter) || Array.isArray(currentFilter)) {
      return JSON.stringify(currentFilter) === JSON.stringify(statusFilter);
    }

    return currentFilter === statusFilter;
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        {/* <p className="text-sm font-semibold uppercase tracking-wide text-[#0F7BFF]">
          APP Engineering
        </p> */}
        <h1 className="mt-1 text-3xl font-bold">Dashboard</h1>
        <p className="mt-3 text-sm text-[#CBD5E1]">
          Monitoring utama seluruh dokumen engineering berdasarkan alur review Code A/B/C.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {kpiCards.map((card) => (
          <DashboardKpiCard
            card={card}
            isError={isDashboardError}
            isActive={isKpiCardActive(card.statusFilter)}
            isLoading={isDashboardLoading}
            key={card.key}
            onSelect={() => tableState.setStatusFilter(card.statusFilter)}
            summary={kpiSummary}
            value={isDashboardError ? "-" : getSummaryValue(kpiSummary, card.key)}
          />
        ))}
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <DashboardDocumentRegisterTable
            onDataChanged={() => {
              queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            }}
            tableState={tableState}
          />
        </div>

        <div className="relative min-w-0 xl:ml-4">
          <DashboardRightInformationPanel
            isCollapsed={isRightPanelCollapsed}
            onCollapse={() => setRightPanelCollapsed(true)}
          >
            <DashboardInfoWidget icon={Clock3} title="SLA Overview" to="/sla-monitoring">
              <div className="px-4 pb-4">
                <div className="overflow-hidden rounded-lg border border-[#123A5A] bg-[#08233B]/70">
                  {slaRows.map((item) => (
                    <div
                      className="flex items-center justify-between border-b border-[#123A5A] px-4 py-3 last:border-b-0"
                      key={item.key}
                    >
                      <span
                        className={[
                          "rounded-full px-3 py-1 text-sm font-semibold",
                          item.tone,
                        ].join(" ")}
                      >
                        {item.label}
                      </span>
                      <span className="text-2xl font-extrabold">
                        {isDashboardLoading || isDashboardError ? "-" : getSummaryValue(slaSummary, item.key)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </DashboardInfoWidget>

            <DashboardInfoWidget icon={AlertTriangle} title="Escalation Alert">
              <div className="px-4 pb-4">
                <div className="overflow-hidden rounded-lg border border-[#123A5A] bg-[#08233B]/70">
                  {escalationRows.map((item) => (
                    <div
                      className="flex items-center justify-between border-b border-[#123A5A] px-4 py-3 last:border-b-0"
                      key={item.key}
                    >
                      <span
                        className={[
                          "text-sm font-semibold",
                          item.key === "total" ? item.tone : "text-[#F8FAFC]",
                        ].join(" ")}
                      >
                        {item.label}
                      </span>
                      <span className={["text-lg font-extrabold", item.tone].join(" ")}>
                        {isDashboardLoading || isDashboardError ? "-" : getSummaryValue(escalationSummary, item.key)}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  className="mt-3 flex h-10 items-center justify-between rounded-md border border-[#123A5A] bg-[#08233B] px-4 text-sm font-semibold transition-colors hover:border-[#0F7BFF] hover:bg-[#0B2B47]"
                  to="/escalation-alert"
                >
                  <span>View All Escalation</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </DashboardInfoWidget>
          </DashboardRightInformationPanel>

          {isRightPanelCollapsed ? (
            <button
              aria-label="Expand right information panel"
              className="absolute right-0 top-0 inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#123A5A] bg-[#08233B] text-[#CBD5E1] shadow-lg transition-colors hover:border-[#0F7BFF] hover:bg-[#0B2B47] hover:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0F7BFF]"
              onClick={() => setRightPanelCollapsed(false)}
              title="Expand right information panel"
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
