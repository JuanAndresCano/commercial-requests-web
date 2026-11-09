import { useState, useMemo } from "react";
import { Link } from "@/lib/app-router";
import {
  Search,
  Filter,
  Download,
  RotateCcw,
  Eye,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  User,
  Layers,
} from "@/components/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OfficialNumberBadge } from "@/components/OfficialNumberBadge";
import { CommercialStatusChip } from "@/components/CommercialStatusChip";
import { formatCop, formatCompactCop } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { ProposalListItem } from "@/lib/api/requests";

interface AdminAuditTableProps {
  proposals: ProposalListItem[];
  isLoading?: boolean;
}

const STAGE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
  NEW: {
    label: "Nueva solicitud",
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-500/30",
    dot: "bg-amber-500",
  },
  IN_PROGRESS: {
    label: "En experto",
    bg: "bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-400",
    border: "border-sky-500/30",
    dot: "bg-sky-500",
  },
  IN_COSTING: {
    label: "En costeo",
    bg: "bg-purple-500/10",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-500/30",
    dot: "bg-purple-500",
  },
  READY_FOR_DELIVERY: {
    label: "Lista para entrega",
    bg: "bg-indigo-500/10",
    text: "text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-500/30",
    dot: "bg-indigo-500",
  },
  DELIVERED: {
    label: "Entregada",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    label: "Rechazada",
    bg: "bg-red-500/10",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-500/30",
    dot: "bg-red-500",
  },
  CANCELLED: {
    label: "Cancelada",
    bg: "bg-slate-500/10",
    text: "text-slate-700 dark:text-slate-400",
    border: "border-slate-500/30",
    dot: "bg-slate-500",
  },
};

type SortField = "createdAt" | "amount" | "company" | "days" | "code";
type SortDirection = "asc" | "desc";

export function AdminAuditTable({ proposals, isLoading = false }: AdminAuditTableProps) {
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKam, setSelectedKam] = useState("ALL");
  const [selectedNode, setSelectedNode] = useState("ALL");
  const [selectedStage, setSelectedStage] = useState("ALL");
  const [selectedCommercialStatus, setSelectedCommercialStatus] = useState("ALL");
  const [selectedSlaAlert, setSelectedSlaAlert] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState("ALL");

  // Sorting
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Extract distinct filter options
  const filterOptions = useMemo(() => {
    const kamsMap = new Map<string, string>();
    const nodesMap = new Map<string, string>();
    const yearsSet = new Set<number>();

    for (const p of proposals) {
      if (p.creator) {
        kamsMap.set(p.creator.id, `${p.creator.firstName} ${p.creator.lastName}`.trim());
      }
      if (p.node) {
        nodesMap.set(p.node.id, p.node.name);
      }
      if (p.createdAt) {
        try {
          const yr = new Date(p.createdAt).getFullYear();
          if (!Number.isNaN(yr)) yearsSet.add(yr);
        } catch {
          // ignore invalid date
        }
      }
    }

    return {
      kams: Array.from(kamsMap.entries()).map(([id, name]) => ({ id, name })),
      nodes: Array.from(nodesMap.entries()).map(([id, name]) => ({ id, name })),
      years: Array.from(yearsSet).sort((a, b) => b - a),
    };
  }, [proposals]);

  // Derived days & SLA calculation helper
  const getProposalMetrics = (p: ProposalListItem) => {
    const daysElapsed = Math.max(0, Math.floor((Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
    const hasProfessor = Boolean(
      p.assignments && p.assignments.some((a) => a.role === "PROFESSOR" || Boolean(a.professor)),
    );
    const statusCode = p.workflow?.statusCode ?? "NEW";
    const isPendingProfessorAlert =
      (statusCode === "NEW" || statusCode === "IN_PROGRESS") && !hasProfessor && daysElapsed >= 5;
    const isBottleneckAlert =
      statusCode !== "DELIVERED" && statusCode !== "REJECTED" && statusCode !== "CANCELLED" && daysElapsed >= 20;

    const amount = p.deliveredValueCop
      ? Number(p.deliveredValueCop)
      : p.economics && p.economics[0]?.grossValue
        ? Number(p.economics[0].grossValue)
        : 0;

    return {
      daysElapsed,
      hasProfessor,
      isPendingProfessorAlert,
      isBottleneckAlert,
      hasAnyAlert: isPendingProfessorAlert || isBottleneckAlert,
      amount,
    };
  };

  // Filtered and sorted proposals
  const filteredProposals = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return proposals.filter((p) => {
      // 1. Search text filter
      if (term) {
        const code = (p.code ?? "").toLowerCase();
        const official = (p.officialNumber ?? "").toLowerCase();
        const title = (p.title ?? "").toLowerCase();
        const companyName = (p.company?.name ?? "").toLowerCase();
        const nit = (p.company?.nit ?? "").toLowerCase();
        const kamName = p.creator ? `${p.creator.firstName} ${p.creator.lastName}`.toLowerCase() : "";
        const leaderName = p.productLeader
          ? `${p.productLeader.firstName} ${p.productLeader.lastName}`.toLowerCase()
          : "";

        const matchesSearch =
          code.includes(term) ||
          official.includes(term) ||
          title.includes(term) ||
          companyName.includes(term) ||
          nit.includes(term) ||
          kamName.includes(term) ||
          leaderName.includes(term);

        if (!matchesSearch) return false;
      }

      // 2. KAM filter
      if (selectedKam !== "ALL" && p.creator?.id !== selectedKam) {
        return false;
      }

      // 3. Node filter
      if (selectedNode !== "ALL" && p.node?.id !== selectedNode && p.nodeId !== selectedNode) {
        return false;
      }

      // 4. Operational Stage filter
      if (selectedStage !== "ALL" && p.workflow?.statusCode !== selectedStage) {
        return false;
      }

      // 5. Commercial Status filter
      if (selectedCommercialStatus !== "ALL") {
        if (selectedCommercialStatus === "none") {
          if (p.commercialStatus) return false;
        } else if (p.commercialStatus !== selectedCommercialStatus) {
          return false;
        }
      }

      // 6. SLA Alert filter
      if (selectedSlaAlert !== "ALL") {
        const { hasAnyAlert } = getProposalMetrics(p);
        if (selectedSlaAlert === "WITH_ALERT" && !hasAnyAlert) return false;
        if (selectedSlaAlert === "NO_ALERT" && hasAnyAlert) return false;
      }

      // 7. Year filter
      if (selectedYear !== "ALL") {
        try {
          const yr = new Date(p.createdAt).getFullYear();
          if (yr !== Number(selectedYear)) return false;
        } catch {
          return false;
        }
      }

      return true;
    });
  }, [
    proposals,
    searchTerm,
    selectedKam,
    selectedNode,
    selectedStage,
    selectedCommercialStatus,
    selectedSlaAlert,
    selectedYear,
  ]);

  // Sort proposals
  const sortedProposals = useMemo(() => {
    return [...filteredProposals].sort((a, b) => {
      let comparison = 0;
      if (sortField === "createdAt") {
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        comparison = timeA - timeB;
      } else if (sortField === "amount") {
        const amtA = a.deliveredValueCop
          ? Number(a.deliveredValueCop)
          : a.economics?.[0]?.grossValue
            ? Number(a.economics[0].grossValue)
            : 0;
        const amtB = b.deliveredValueCop
          ? Number(b.deliveredValueCop)
          : b.economics?.[0]?.grossValue
            ? Number(b.economics[0].grossValue)
            : 0;
        comparison = amtA - amtB;
      } else if (sortField === "company") {
        const compA = a.company?.name || "";
        const compB = b.company?.name || "";
        comparison = compA.localeCompare(compB);
      } else if (sortField === "code") {
        const codeA = a.officialNumber || a.code || a.id;
        const codeB = b.officialNumber || b.code || b.id;
        comparison = codeA.localeCompare(codeB);
      } else if (sortField === "days") {
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        // More days means older time, so invert comparison
        comparison = timeB - timeA;
      }

      return sortDir === "asc" ? comparison : -comparison;
    });
  }, [filteredProposals, sortField, sortDir]);

  // Pagination slicing
  const totalItems = sortedProposals.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const paginatedProposals = sortedProposals.slice(startIndex, startIndex + pageSize);

  // Aggregated totals of filtered set
  const filteredMetrics = useMemo(() => {
    let totalCop = 0;
    let alertsCount = 0;
    for (const p of filteredProposals) {
      const { amount, hasAnyAlert } = getProposalMetrics(p);
      totalCop += amount;
      if (hasAnyAlert) alertsCount++;
    }
    return {
      count: filteredProposals.length,
      totalCop,
      alertsCount,
    };
  }, [filteredProposals]);

  const hasActiveFilters =
    searchTerm !== "" ||
    selectedKam !== "ALL" ||
    selectedNode !== "ALL" ||
    selectedStage !== "ALL" ||
    selectedCommercialStatus !== "ALL" ||
    selectedSlaAlert !== "ALL" ||
    selectedYear !== "ALL";

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedKam("ALL");
    setSelectedNode("ALL");
    setSelectedStage("ALL");
    setSelectedCommercialStatus("ALL");
    setSelectedSlaAlert("ALL");
    setSelectedYear("ALL");
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setCurrentPage(1);
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = [
      "Código de Radicación",
      "Número Oficial",
      "Empresa",
      "NIT",
      "Título de la Iniciativa",
      "KAM Responsable",
      "Líder de Producto",
      "Nodo Académico",
      "Monto Propuesta (COP)",
      "Estado Operativo",
      "Etiqueta Comercial",
      "Días Transcurridos",
      "Alerta de SLA",
      "Fecha de Radicación",
    ];

    const escapeCsv = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      const s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = filteredProposals.map((p) => {
      const { daysElapsed, isPendingProfessorAlert, isBottleneckAlert, amount } = getProposalMetrics(p);
      let slaAlert = "Normal";
      if (isPendingProfessorAlert && isBottleneckAlert) {
        slaAlert = "Sin docente (>5d) y cuello de botella (>20d)";
      } else if (isPendingProfessorAlert) {
        slaAlert = "Sin docente asignado (>5d)";
      } else if (isBottleneckAlert) {
        slaAlert = "Cuello de botella (>20d)";
      }

      const kamName = p.creator ? `${p.creator.firstName} ${p.creator.lastName}`.trim() : "Sin asignar";
      const leaderName = p.productLeader
        ? `${p.productLeader.firstName} ${p.productLeader.lastName}`.trim()
        : "Sin asignar";
      const nodeName = p.node?.name ?? "Sin nodo";

      return [
        escapeCsv(p.code ?? p.id),
        escapeCsv(p.officialNumber ?? ""),
        escapeCsv(p.company?.name ?? ""),
        escapeCsv(p.company?.nit ?? ""),
        escapeCsv(p.title ?? ""),
        escapeCsv(kamName),
        escapeCsv(leaderName),
        escapeCsv(nodeName),
        escapeCsv(amount),
        escapeCsv(p.workflow?.statusCode ?? ""),
        escapeCsv(p.commercialStatus ?? "Sin etiqueta"),
        escapeCsv(daysElapsed),
        escapeCsv(slaAlert),
        escapeCsv(new Date(p.createdAt).toISOString().split("T")[0]),
      ].join(";");
    });

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `auditoria-solicitudes-icesi-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4" data-testid="admin-audit-table-component">
      {/* 1. BARRA SUPERIOR DE BÚSQUEDA Y EXPORTACIÓN */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        {/* Input de Búsqueda rápida */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            data-testid="audit-search-input"
            placeholder="Buscar por código (REQ/CP), empresa, NIT, título o asesor..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-icesi-blue"
          />
        </div>

        {/* Acciones de Exportación y Limpieza */}
        <div className="flex items-center gap-2 self-start lg:self-auto flex-wrap">
          {hasActiveFilters && (
            <button
              type="button"
              data-testid="audit-reset-filters-btn"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Limpiar filtros</span>
            </button>
          )}

          <button
            type="button"
            data-testid="audit-export-csv-btn"
            onClick={handleExportCsv}
            disabled={filteredProposals.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-icesi-blue px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-icesi-blue/90 disabled:opacity-50 transition-colors cursor-pointer"
            title="Exportar registros filtrados a formato Excel / CSV"
          >
            <Download className="h-4 w-4" />
            <span>Exportar CSV ({filteredProposals.length})</span>
          </button>
        </div>
      </div>

      {/* 2. BARRA DE FILTROS AVANZADOS MULTI-DIMENSIONALES */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-6 rounded-xl border border-border bg-muted/20 p-3 shadow-2xs">
        {/* Filtro KAM */}
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
            Asesor KAM
          </label>
          <Select
            value={selectedKam}
            onValueChange={(val) => {
              setSelectedKam(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-background border-border w-full" data-testid="audit-kam-filter">
              <SelectValue placeholder="Todos los KAMs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los KAMs ({filterOptions.kams.length})</SelectItem>
              {filterOptions.kams.map((kam) => (
                <SelectItem key={kam.id} value={kam.id}>
                  {kam.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro Nodo */}
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
            Nodo Académico
          </label>
          <Select
            value={selectedNode}
            onValueChange={(val) => {
              setSelectedNode(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-background border-border w-full" data-testid="audit-node-filter">
              <SelectValue placeholder="Todos los nodos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los nodos</SelectItem>
              {filterOptions.nodes.map((node) => (
                <SelectItem key={node.id} value={node.id}>
                  {node.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro Fase Operativa */}
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
            Fase Operativa
          </label>
          <Select
            value={selectedStage}
            onValueChange={(val) => {
              setSelectedStage(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-background border-border w-full" data-testid="audit-stage-filter">
              <SelectValue placeholder="Todas las fases" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas las fases</SelectItem>
              <SelectItem value="NEW">Nueva solicitud</SelectItem>
              <SelectItem value="IN_PROGRESS">En experto</SelectItem>
              <SelectItem value="IN_COSTING">En costeo</SelectItem>
              <SelectItem value="READY_FOR_DELIVERY">Lista para entrega</SelectItem>
              <SelectItem value="DELIVERED">Entregada / Cerrada</SelectItem>
              <SelectItem value="REJECTED">Rechazada</SelectItem>
              <SelectItem value="CANCELLED">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtro Etiqueta Comercial */}
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
            Etiqueta Comercial
          </label>
          <Select
            value={selectedCommercialStatus}
            onValueChange={(val) => {
              setSelectedCommercialStatus(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger
              className="h-8 text-xs bg-background border-border w-full"
              data-testid="audit-commercial-filter"
            >
              <SelectValue placeholder="Cualquier estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Cualquier estado</SelectItem>
              <SelectItem value="APPROVED_WITHOUT_CONTRACT">Aprobada sin contrato</SelectItem>
              <SelectItem value="APPROVED_WITH_CONTRACT">Aprobada con contrato</SelectItem>
              <SelectItem value="INVOICED">Facturada</SelectItem>
              <SelectItem value="REJECTED">Rechazada comercial</SelectItem>
              <SelectItem value="none">Sin etiqueta comercial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtro Alertas SLA */}
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
            Alertas SLA / Cuello
          </label>
          <Select
            value={selectedSlaAlert}
            onValueChange={(val) => {
              setSelectedSlaAlert(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-background border-border w-full" data-testid="audit-sla-filter">
              <SelectValue placeholder="Todas las solicitudes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas las solicitudes</SelectItem>
              <SelectItem value="WITH_ALERT">Solo con Alerta SLA</SelectItem>
              <SelectItem value="NO_ALERT">Sin alertas (En tiempo)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filtro Año */}
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
            Año de Radicación
          </label>
          <Select
            value={selectedYear}
            onValueChange={(val) => {
              setSelectedYear(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-background border-border w-full" data-testid="audit-year-filter">
              <SelectValue placeholder="Histórico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Histórico completo</SelectItem>
              {filterOptions.years.map((yr) => (
                <SelectItem key={yr} value={String(yr)}>
                  Año {yr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 3. RESUMEN DINÁMICO DE RESULTADOS FILTRADOS */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-4 flex-wrap">
          <span>
            Mostrando <strong className="text-foreground">{filteredMetrics.count}</strong> solicitudes de un total de{" "}
            <strong>{proposals.length}</strong>
          </span>
          <span className="h-3 w-px bg-border hidden sm:inline-block" />
          <span>
            Volumen económico filtrado:{" "}
            <strong className="text-foreground">{formatCop(filteredMetrics.totalCop)}</strong>
          </span>
          {filteredMetrics.alertsCount > 0 && (
            <>
              <span className="h-3 w-px bg-border hidden sm:inline-block" />
              <span className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                {filteredMetrics.alertsCount} en riesgo SLA
              </span>
            </>
          )}
        </div>

        {/* Selector de tamaño de página */}
        <div className="flex items-center gap-2">
          <span>Filas por página:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded border border-border bg-card px-2 py-0.5 text-xs text-foreground focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* 4. TABLA MAESTRA DE AUDITORÍA */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" data-testid="audit-table">
            <thead className="border-b border-border bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider select-none">
              <tr>
                <th
                  scope="col"
                  className="py-3 px-3 cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("code")}
                >
                  <div className="flex items-center gap-1">
                    <span>Radicado / Código</span>
                    {sortField === "code" && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
                  </div>
                </th>
                <th
                  scope="col"
                  className="py-3 px-3 cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("company")}
                >
                  <div className="flex items-center gap-1">
                    <span>Empresa Aliada</span>
                    {sortField === "company" && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
                  </div>
                </th>
                <th scope="col" className="py-3 px-3">
                  Iniciativa / Título
                </th>
                <th scope="col" className="py-3 px-3">
                  KAM / Líder
                </th>
                <th scope="col" className="py-3 px-3">
                  Nodo Académico
                </th>
                <th
                  scope="col"
                  className="py-3 px-3 cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("amount")}
                >
                  <div className="flex items-center gap-1">
                    <span>Monto COP</span>
                    {sortField === "amount" && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
                  </div>
                </th>
                <th scope="col" className="py-3 px-3">
                  Fase Operativa
                </th>
                <th scope="col" className="py-3 px-3">
                  Etiqueta Comercial
                </th>
                <th
                  scope="col"
                  className="py-3 px-3 cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("days")}
                >
                  <div className="flex items-center gap-1">
                    <span>SLA / Días</span>
                    {sortField === "days" && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
                  </div>
                </th>
                <th scope="col" className="py-3 px-3 text-right">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skel-${i}`} className="animate-pulse">
                    <td colSpan={10} className="py-4 px-3 text-center text-muted-foreground">
                      Cargando registros de auditoría...
                    </td>
                  </tr>
                ))
              ) : paginatedProposals.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 px-3 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
                      <Filter className="h-5 w-5" />
                    </div>
                    <p className="font-semibold text-foreground text-sm">No se encontraron solicitudes</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Ninguna propuesta coincide con los criterios de búsqueda o filtros seleccionados.
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-icesi-blue hover:bg-muted/50 cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Restablecer filtros</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedProposals.map((p) => {
                  const { daysElapsed, isPendingProfessorAlert, isBottleneckAlert, hasAnyAlert, amount } =
                    getProposalMetrics(p);
                  const stage = STAGE_CONFIG[p.workflow?.statusCode ?? "NEW"] ?? STAGE_CONFIG.NEW;
                  const kamName = p.creator ? `${p.creator.firstName} ${p.creator.lastName}`.trim() : "Sin asignar";
                  const leaderName = p.productLeader
                    ? `${p.productLeader.firstName} ${p.productLeader.lastName}`.trim()
                    : "Sin asignar";
                  const nodeName = p.node?.name ?? "Sin nodo";

                  return (
                    <tr
                      key={p.id}
                      data-testid={`audit-row-${p.id}`}
                      className={cn("hover:bg-muted/30 transition-colors", hasAnyAlert && "bg-amber-500/[0.02]")}
                    >
                      {/* 1. Radicado / Código */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          {p.officialNumber ? (
                            <OfficialNumberBadge officialNumber={p.officialNumber} />
                          ) : (
                            <span className="font-mono text-xs font-bold text-foreground">
                              {p.code ?? p.id.slice(0, 8)}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(p.createdAt).toLocaleDateString("es-CO", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* 2. Empresa */}
                      <td className="py-3 px-3 max-w-[180px]">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground truncate" title={p.company?.name}>
                            {p.company?.name || "Sin empresa"}
                          </span>
                          {p.company?.nit && (
                            <span className="text-[10px] text-muted-foreground font-mono">NIT {p.company.nit}</span>
                          )}
                        </div>
                      </td>

                      {/* 3. Título / Iniciativa */}
                      <td className="py-3 px-3 max-w-[220px]">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground line-clamp-2" title={p.title ?? ""}>
                            {p.title || "Iniciativa comercial"}
                          </span>
                          {p.program?.requestType && (
                            <span className="text-[10px] text-muted-foreground capitalize">
                              {p.program.requestType.toLowerCase()}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Asesor KAM y Líder */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5 text-[11px]">
                          <span
                            className="inline-flex items-center gap-1 font-medium text-foreground"
                            title="KAM Comercial"
                          >
                            <User className="h-3 w-3 text-muted-foreground shrink-0" />
                            {kamName}
                          </span>
                          <span className="text-[10px] text-muted-foreground" title="Líder de Producto Asignado">
                            Líder: {leaderName}
                          </span>
                        </div>
                      </td>

                      {/* 5. Nodo Académico */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold",
                            p.node
                              ? "bg-muted text-foreground border border-border"
                              : "bg-muted/40 text-muted-foreground",
                          )}
                        >
                          <Layers className="h-3 w-3 shrink-0 text-muted-foreground" />
                          <span className="truncate max-w-[120px]">{nodeName}</span>
                        </span>
                      </td>

                      {/* 6. Monto COP */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold font-mono text-foreground">{formatCompactCop(amount)}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {p.deliveredValueCop ? "Vendido" : "Cotizado"}
                          </span>
                        </div>
                      </td>

                      {/* 7. Fase Operativa */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                            stage.bg,
                            stage.text,
                            stage.border,
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", stage.dot)} />
                          {stage.label}
                        </span>
                      </td>

                      {/* 8. Etiqueta Comercial */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <CommercialStatusChip proposalId={p.id} status={p.commercialStatus} canEdit={false} />
                      </td>

                      {/* 9. Envejecimiento y SLA */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground">
                            <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                            {daysElapsed} {daysElapsed === 1 ? "día" : "días"}
                          </span>
                          {isPendingProfessorAlert && (
                            <span
                              className="inline-flex items-center gap-1 rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-400 border border-red-500/20"
                              title="Solicitud en etapa de diseño técnico sin profesor asignado por más de 5 días"
                            >
                              <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                              Sin docente &gt;5d
                            </span>
                          )}
                          {isBottleneckAlert && !isPendingProfessorAlert && (
                            <span
                              className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 border border-amber-500/20"
                              title="Solicitud activa con más de 20 días en proceso operativo"
                            >
                              <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                              Cuello &gt;20d
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 10. Acción: Auditar Expediente */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <Link
                          href={`/solicitudes/${p.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground shadow-2xs hover:border-icesi-blue hover:text-icesi-blue transition-colors cursor-pointer"
                          title="Inspeccionar costeo, alcance técnico y trazabilidad en modo directivo"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Auditar</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. CONTROLES DE PAGINACIÓN */}
        {totalPages > 1 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border bg-muted/20 px-4 py-3">
            <span className="text-xs text-muted-foreground">
              Página <strong className="text-foreground">{validPage}</strong> de{" "}
              <strong className="text-foreground">{totalPages}</strong> ({totalItems} registros)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                data-testid="audit-prev-page"
                disabled={validPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Anterior</span>
              </button>

              <span className="px-2 text-xs font-semibold text-muted-foreground">
                {validPage} / {totalPages}
              </span>

              <button
                type="button"
                data-testid="audit-next-page"
                disabled={validPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground shadow-2xs hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
              >
                <span>Siguiente</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
