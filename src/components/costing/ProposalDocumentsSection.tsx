import { useState, useRef } from "react";
import {
  FileText,
  FileType,
  FileSpreadsheet,
  UploadCloud,
  Download,
  Trash2,
  Lock,
  Eye,
  Plus,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProposalDocument } from "@/lib/mock-data";
import { toast } from "sonner";

interface ProposalDocumentsSectionProps {
  clientKamDocuments: ProposalDocument[];
  internalCostingDocuments: ProposalDocument[];
  onAddDocument: (doc: ProposalDocument) => void;
  onRemoveDocument: (docId: string, category: "client_kam" | "internal_costing") => void;
  userRole: string;
  userName: string;
}

export function ProposalDocumentsSection({
  clientKamDocuments,
  internalCostingDocuments,
  onAddDocument,
  onRemoveDocument,
  userRole,
  userName,
}: ProposalDocumentsSectionProps) {
  const isLeader = userRole === "lider-producto" || userRole === "lider-nodo";

  const clientFileInputRef = useRef<HTMLInputElement>(null);
  const internalFileInputRef = useRef<HTMLInputElement>(null);

  const [isDraggingClient, setIsDraggingClient] = useState(false);
  const [isDraggingInternal, setIsDraggingInternal] = useState(false);
  const [internalDocTag, setInternalDocTag] = useState<string>("Matriz de Costeo");

  const handleFileUpload = (
    file: File,
    category: "client_kam" | "internal_costing",
    tag?: string
  ) => {
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (category === "client_kam") {
      if (ext !== "pdf" && ext !== "doc" && ext !== "docx") {
        toast.error("La Propuesta Comercial requiere formato Word (.docx) o PDF (.pdf)");
        return;
      }
    }

    const docType: ProposalDocument["type"] =
      ext === "pdf"
        ? "pdf"
        : ext === "xlsx" || ext === "xls" || ext === "csv"
        ? "excel"
        : "doc";

    const formattedSize =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    const newDoc: ProposalDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: file.name,
      size: formattedSize,
      date: new Date().toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      type: docType,
      category,
      uploadedBy: userName,
      tag: category === "internal_costing" ? tag || internalDocTag : undefined,
    };

    onAddDocument(newDoc);
    toast.success(`Archivo "${file.name}" cargado`);
  };

  const getFileIcon = (type: ProposalDocument["type"]) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-4 w-4 text-rose-500 shrink-0" />;
      case "excel":
        return <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case "doc":
      default:
        return <FileType className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />;
    }
  };

  // =========================================================================
  // VISTA KAM: SIN SELECTOR DE PESTAÑAS, SOLO PROPUESTA COMERCIAL
  // =========================================================================
  if (!isLeader) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-border dark:bg-card">
        {/* HEADER COMERCIAL DIRECTO */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4 dark:border-border">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Propuesta Comercial para Cliente
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Eye className="h-2.5 w-2.5" /> Oficial para Cliente
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
              Documento formal aprobado por el Líder de Producto listo para entrega al cliente
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {clientKamDocuments.length} {clientKamDocuments.length === 1 ? "archivo disponible" : "archivos disponibles"}
          </span>
        </div>

        {/* LISTA DE ARCHIVOS DE LA PROPUESTA (SIN SELECTOR DE PESTAÑAS) */}
        <div className="mt-4">
          {clientKamDocuments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400 dark:border-border">
              No hay propuesta comercial oficial adjunta por el Líder aún.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200/80 bg-white overflow-hidden dark:divide-border dark:border-border dark:bg-card">
              {clientKamDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50/60 dark:hover:bg-secondary/30 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-secondary">
                      {getFileIcon(doc.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {doc.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {doc.size} · Subido el {doc.date} {doc.uploadedBy ? `por ${doc.uploadedBy}` : ""}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="h-8 px-3 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs shrink-0 inline-flex items-center gap-1.5"
                    onClick={() => toast.success(`Descargando propuesta: ${doc.name}`)}
                    title={`Descargar propuesta oficial (${doc.type.toUpperCase()})`}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Descargar Propuesta ({doc.type === "pdf" ? ".pdf" : ".docx"})</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VISTA LÍDER DE PRODUCTO: GESTIÓN COMPLETA CON TABS
  // =========================================================================
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-border dark:bg-card">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4 dark:border-border">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Gestión de Documentos
          </h2>
          <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
            Archivos adjuntos para presentación comercial y respaldo interno
          </p>
        </div>
      </div>

      {/* UNIFIED TABS */}
      <div className="mt-5">
        <Tabs defaultValue="client_kam" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100/80 p-1 rounded-lg dark:bg-secondary/40 h-auto">
            {/* TAB A: PROPUESTA COMERCIAL */}
            <TabsTrigger
              value="client_kam"
              className="flex items-center justify-center gap-2 py-2 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs dark:data-[state=active]:bg-background dark:data-[state=active]:text-foreground"
            >
              <span>Propuesta Comercial</span>
              <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.2 text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Eye className="h-2.5 w-2.5" /> KAM y Cliente
              </span>
              <span className="text-[11px] text-slate-400">
                ({clientKamDocuments.length})
              </span>
            </TabsTrigger>

            {/* TAB B: REPOSITORIO INTERNO */}
            <TabsTrigger
              value="internal_costing"
              className="flex items-center justify-center gap-2 py-2 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs dark:data-[state=active]:bg-background dark:data-[state=active]:text-foreground"
            >
              <span>Repositorio Interno</span>
              <span className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.2 text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300">
                <Lock className="h-2.5 w-2.5" /> Privado
              </span>
              <span className="text-[11px] text-slate-400">
                ({internalCostingDocuments.length})
              </span>
            </TabsTrigger>
          </TabsList>

          {/* ======================================================== */}
          {/* TAB A CONTENT: PROPUESTA COMERCIAL */}
          {/* ======================================================== */}
          <TabsContent value="client_kam" className="mt-4 space-y-3">
            {/* DROPZONE COMPACTO */}
            {isLeader && (
              <div
                className={`rounded-lg border border-dashed p-3 text-center transition-colors cursor-pointer ${
                  isDraggingClient
                    ? "border-primary bg-primary/5"
                    : "border-slate-200 hover:border-primary/60 bg-slate-50/50 hover:bg-slate-50 dark:border-border dark:bg-secondary/20 dark:hover:bg-secondary/30"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingClient(true);
                }}
                onDragLeave={() => setIsDraggingClient(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingClient(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleFileUpload(e.dataTransfer.files[0], "client_kam");
                  }
                }}
                onClick={() => clientFileInputRef.current?.click()}
              >
                <input
                  ref={clientFileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0], "client_kam");
                    }
                  }}
                />
                <div className="flex items-center justify-center gap-2 text-xs">
                  <UploadCloud className="h-4 w-4 text-slate-500" />
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    Subir propuesta comercial (.pdf, .docx)
                  </span>
                  <span className="text-slate-400 text-[11px] hidden sm:inline">
                    · Arrastra o haz clic
                  </span>
                </div>
              </div>
            )}

            {/* LISTA COMPACTA DE ARCHIVOS */}
            {clientKamDocuments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400 dark:border-border">
                No hay propuesta comercial oficial adjunta aún.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200/80 bg-white overflow-hidden dark:divide-border dark:border-border dark:bg-card">
                {clientKamDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-slate-50/60 dark:hover:bg-secondary/30 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-100 dark:bg-secondary">
                        {getFileIcon(doc.type)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {doc.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {doc.size} · Subido el {doc.date} {doc.uploadedBy ? `por ${doc.uploadedBy}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                        onClick={() => toast.success(`Descargando propuesta: ${doc.name}`)}
                        title="Descargar archivo"
                      >
                        <Download className="h-3.5 w-3.5 sm:mr-1" />
                        <span className="hidden sm:inline">Descargar</span>
                      </Button>

                      {isLeader && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          onClick={() => {
                            onRemoveDocument(doc.id, "client_kam");
                            toast.info(`Documento eliminado`);
                          }}
                          title="Eliminar archivo"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ======================================================== */}
          {/* TAB B CONTENT: REPOSITORIO INTERNO DE COSTEO */}
          {/* ======================================================== */}
          <TabsContent value="internal_costing" className="mt-4 space-y-3">
            {/* DROPZONE COMPACTO CON SELECTOR DE ETIQUETA */}
            {isLeader && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div
                  className={`flex-1 rounded-lg border border-dashed p-3 text-center transition-colors cursor-pointer ${
                    isDraggingInternal
                      ? "border-amber-500 bg-amber-500/5"
                      : "border-slate-200 hover:border-amber-500/60 bg-slate-50/50 hover:bg-slate-50 dark:border-border dark:bg-secondary/20 dark:hover:bg-secondary/30"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingInternal(true);
                  }}
                  onDragLeave={() => setIsDraggingInternal(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingInternal(false);
                    if (e.dataTransfer.files?.[0]) {
                      handleFileUpload(e.dataTransfer.files[0], "internal_costing", internalDocTag);
                    }
                  }}
                  onClick={() => internalFileInputRef.current?.click()}
                >
                  <input
                    ref={internalFileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.pdf,.docx,.doc"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0], "internal_costing", internalDocTag);
                      }
                    }}
                  />
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <UploadCloud className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      Subir archivo interno (.xlsx, .pdf, .docx)
                    </span>
                    <span className="text-slate-400 text-[11px] hidden sm:inline">
                      · Arrastra o selecciona
                    </span>
                  </div>
                </div>

                {/* Sutil selector de categoría de documento interno */}
                <div className="flex items-center gap-1 shrink-0">
                  <select
                    value={internalDocTag}
                    onChange={(e) => setInternalDocTag(e.target.value)}
                    className="h-9 rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-700 dark:border-border dark:bg-secondary dark:text-slate-200"
                    title="Tipo de documento interno"
                  >
                    <option value="Matriz de Costeo">Matriz de Costeo</option>
                    <option value="Cronograma Detallado">Cronograma</option>
                    <option value="Contrato / Minuta">Contrato / Minuta</option>
                    <option value="Cotización Externa">Cotización Externa</option>
                  </select>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-2.5 text-xs border-slate-200 dark:border-border"
                    onClick={() => internalFileInputRef.current?.click()}
                    title="Subir con esta categoría"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* LISTA COMPACTA DE ARCHIVOS INTERNOS */}
            {internalCostingDocuments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400 dark:border-border">
                No hay archivos de costeo interno adjuntos.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200/80 bg-white overflow-hidden dark:divide-border dark:border-border dark:bg-card">
                {internalCostingDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-slate-50/60 dark:hover:bg-secondary/30 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-100 dark:bg-secondary">
                        {getFileIcon(doc.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                            {doc.name}
                          </p>
                          {doc.tag && (
                            <span className="hidden sm:inline-block rounded px-1.5 py-0.2 text-[10px] font-normal bg-slate-100 text-slate-600 border border-slate-200 dark:bg-secondary dark:text-slate-300 dark:border-border">
                              {doc.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {doc.size} · Subido el {doc.date} {doc.uploadedBy ? `por ${doc.uploadedBy}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                        onClick={() => toast.success(`Descargando: ${doc.name}`)}
                        title="Descargar archivo"
                      >
                        <Download className="h-3.5 w-3.5 sm:mr-1" />
                        <span className="hidden sm:inline">Descargar</span>
                      </Button>

                      {isLeader && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          onClick={() => {
                            onRemoveDocument(doc.id, "internal_costing");
                            toast.info(`Archivo interno eliminado`);
                          }}
                          title="Eliminar archivo"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
