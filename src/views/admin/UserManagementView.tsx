import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { usersApi, type PendingUser, type DirectoryAdminUser, type PreRegisterUserPayload } from "@/lib/api/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  UserCheck,
  UserPlus,
  Users,
  Search,
  Check,
  X,
  Clock,
  Briefcase,
  Award,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "@/components/icons";

type OperationalRole = "KAM" | "PRODUCT_LEADER";

export default function UserManagementView() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [directoryUsers, setDirectoryUsers] = useState<DirectoryAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active tab: 'pending' | 'directory'
  const [activeTab, setActiveTab] = useState<"pending" | "directory">("pending");

  // Search filter for directory
  const [searchQuery, setSearchQuery] = useState("");

  // Role selections in the pending queue: map of userId -> OperationalRole
  const [roleSelections, setRoleSelections] = useState<Record<string, OperationalRole>>({});

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Pre-register modal state
  const [preRegisterOpen, setPreRegisterOpen] = useState(false);
  const [preRegisterForm, setPreRegisterForm] = useState<PreRegisterUserPayload>({
    email: "",
    roleCode: "KAM",
    firstName: "",
    lastName: "",
  });
  const [preRegisterSubmitting, setPreRegisterSubmitting] = useState(false);

  // Reject confirmation modal state
  const [rejectModalUser, setRejectModalUser] = useState<PendingUser | null>(null);
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [pending, directory] = await Promise.all([usersApi.getPendingUsers(), usersApi.getUserDirectory()]);

      setPendingUsers(pending);
      setDirectoryUsers(directory);

      setRoleSelections((prev) => {
        const next: Record<string, OperationalRole> = { ...prev };
        pending.forEach((u) => {
          if (!next[u.id]) next[u.id] = "KAM";
        });
        return next;
      });
    } catch (error) {
      toast.error("Error al cargar datos de usuarios", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Filtered directory users
  const filteredDirectory = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return directoryUsers;
    return directoryUsers.filter((u) => {
      const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ").toLowerCase();
      const email = u.email.toLowerCase();
      const roles = u.roles.join(" ").toLowerCase();
      return fullName.includes(q) || email.includes(q) || roles.includes(q);
    });
  }, [directoryUsers, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const pendingCount = pendingUsers.length;
    const totalActive = directoryUsers.length;
    const kamCount = directoryUsers.filter((u) => u.roles.includes("KAM")).length;
    const lpCount = directoryUsers.filter((u) => u.roles.includes("PRODUCT_LEADER")).length;
    return { pendingCount, totalActive, kamCount, lpCount };
  }, [pendingUsers, directoryUsers]);

  const handleApprove = async (user: PendingUser) => {
    const roleCode = roleSelections[user.id] || "KAM";
    setActionLoadingId(user.id);

    try {
      await usersApi.approveUser(user.id, roleCode);
      toast.success("Usuario aprobado exitosamente", {
        description: `${user.email} fue configurado como ${roleCode === "KAM" ? "Key Account Manager" : "Líder de Producto"}.`,
      });

      // Update state locally
      setPendingUsers((prev) => prev.filter((p) => p.id !== user.id));
      void loadData(true);
    } catch (error) {
      toast.error("Error al aprobar usuario", {
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalUser) return;
    setRejectSubmitting(true);

    try {
      await usersApi.rejectUser(rejectModalUser.id);
      toast.success("Solicitud rechazada", {
        description: `La solicitud de ${rejectModalUser.email} ha sido descartada.`,
      });

      setPendingUsers((prev) => prev.filter((p) => p.id !== rejectModalUser.id));
      setRejectModalUser(null);
    } catch (error) {
      toast.error("Error al rechazar solicitud", {
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado.",
      });
    } finally {
      setRejectSubmitting(false);
    }
  };

  const handlePreRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = preRegisterForm.email.trim().toLowerCase();

    if (!cleanEmail.endsWith("@icesi.edu.co") && !cleanEmail.endsWith("@u.icesi.edu.co")) {
      toast.error("Correo no institucional", {
        description: "El correo debe pertenecer al dominio @icesi.edu.co o @u.icesi.edu.co",
      });
      return;
    }

    setPreRegisterSubmitting(true);
    try {
      const result = await usersApi.preRegisterUser({
        ...preRegisterForm,
        email: cleanEmail,
      });

      if (result.status === "APPROVED") {
        toast.success("Usuario en espera aprobado directamente", {
          description: `${cleanEmail} ha sido activado con rol ${preRegisterForm.roleCode}.`,
        });
      } else {
        toast.success("Colaborador pre-registrado exitosamente", {
          description: `Al iniciar sesión con Microsoft, ${cleanEmail} entrará directo a su espacio de trabajo.`,
        });
      }

      setPreRegisterOpen(false);
      setPreRegisterForm({
        email: "",
        roleCode: "KAM",
        firstName: "",
        lastName: "",
      });
      void loadData(true);
    } catch (error) {
      toast.error("Error al pre-registrar colaborador", {
        description: error instanceof Error ? error.message : "Verifica los datos e intenta de nuevo.",
      });
    } finally {
      setPreRegisterSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="h-6 w-6 text-[#5454e9]" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Gestión de Accesos y Usuarios
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Autorización de solicitudes espontáneas, pre-registro de colaboradores y directorio de roles
            institucionales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={refreshing || loading}
            onClick={() => void loadData(true)}
            className="gap-1.5 rounded-lg"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setPreRegisterOpen(true)}
            className="bg-[#5454e9] hover:bg-[#4343d0] text-white gap-1.5 rounded-lg font-medium"
          >
            <UserPlus className="h-4 w-4" />
            <span>Pre-registrar Colaborador</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#151722] border border-border rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Solicitudes Pendientes</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{stats.pendingCount}</span>
            {stats.pendingCount > 0 && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                Requiere atención
              </Badge>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#151722] border border-border rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Colaboradores Activos</span>
            <Users className="h-4 w-4 text-[#5454e9]" />
          </div>
          <span className="text-2xl font-bold text-foreground">{stats.totalActive}</span>
        </div>

        <div className="bg-white dark:bg-[#151722] border border-border rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Key Account Managers (KAM)</span>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </div>
          <span className="text-2xl font-bold text-foreground">{stats.kamCount}</span>
        </div>

        <div className="bg-white dark:bg-[#151722] border border-border rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Líderes de Producto</span>
            <Award className="h-4 w-4 text-purple-500" />
          </div>
          <span className="text-2xl font-bold text-foreground">{stats.lpCount}</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center border-b border-border gap-2 pt-2">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "pending"}
          onClick={() => setActiveTab("pending")}
          className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "pending"
              ? "border-[#5454e9] text-[#5454e9] font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Solicitudes Pendientes</span>
          {stats.pendingCount > 0 && (
            <span className="bg-amber-500 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full">
              {stats.pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "directory"}
          onClick={() => setActiveTab("directory")}
          className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "directory"
              ? "border-[#5454e9] text-[#5454e9] font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Directorio de Colaboradores</span>
          <span className="text-muted-foreground text-xs">({stats.totalActive})</span>
        </button>
      </div>

      {/* Tab 1: Pending Queue */}
      {activeTab === "pending" && (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white dark:bg-[#151722] border border-border rounded-2xl p-12 text-center text-sm text-muted-foreground">
              Cargando solicitudes pendientes…
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="bg-white dark:bg-[#151722] border border-border rounded-2xl p-12 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                No hay solicitudes pendientes en este momento
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4">
                Todos los ingresos institucionales cuentan con su rol asignado. Puedes pre-registrar a futuros
                colaboradores usando el botón superior.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#151722] border border-border rounded-2xl overflow-hidden shadow-2xs">
              <div className="px-5 py-3.5 border-b border-border/80 bg-muted/20 flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Cola de Aprobación ({pendingUsers.length})
                </span>
                <span className="text-xs text-muted-foreground">
                  Asigna el rol correspondiente y aprueba o rechaza el acceso
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground bg-muted/10">
                      <th className="py-3 px-5 font-medium">Colaborador / Usuario</th>
                      <th className="py-3 px-5 font-medium">Correo Institucional</th>
                      <th className="py-3 px-5 font-medium">Fecha de Solicitud</th>
                      <th className="py-3 px-5 font-medium min-w-[200px]">Rol a Asignar</th>
                      <th className="py-3 px-5 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {pendingUsers.map((p) => {
                      const name = [p.firstName, p.lastName].filter(Boolean).join(" ") || "Sin nombre detectado";
                      const initial = (p.firstName || p.email).charAt(0).toUpperCase();
                      const isOperating = actionLoadingId === p.id;
                      const selectedRole = roleSelections[p.id] || "KAM";

                      return (
                        <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-[#5454e9]/10 text-[#5454e9] font-bold flex items-center justify-center shrink-0">
                                {initial}
                              </div>
                              <span className="font-semibold text-foreground">{name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 font-medium text-foreground/90">{p.email}</td>
                          <td className="py-3.5 px-5 text-muted-foreground">
                            {new Date(p.createdAt).toLocaleDateString("es-CO", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-3.5 px-5">
                            <select
                              value={selectedRole}
                              disabled={isOperating}
                              onChange={(e) =>
                                setRoleSelections((prev) => ({
                                  ...prev,
                                  [p.id]: e.target.value as OperationalRole,
                                }))
                              }
                              className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-[#5454e9]"
                            >
                              <option value="KAM">Key Account Manager (KAM)</option>
                              <option value="PRODUCT_LEADER">Líder de Producto</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                disabled={isOperating}
                                onClick={() => void handleApprove(p)}
                                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1 text-xs px-3 rounded-lg"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>{isOperating ? "Aprobando…" : "Aprobar"}</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isOperating}
                                onClick={() => setRejectModalUser(p)}
                                className="h-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 gap-1 text-xs px-2.5 rounded-lg"
                              >
                                <X className="h-3.5 w-3.5" />
                                <span>Rechazar</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Active Directory */}
      {activeTab === "directory" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, correo o rol…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs rounded-xl"
              />
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              Mostrando {filteredDirectory.length} colaboradores
            </span>
          </div>

          <div className="bg-white dark:bg-[#151722] border border-border rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground bg-muted/10">
                    <th className="py-3 px-5 font-medium">Colaborador</th>
                    <th className="py-3 px-5 font-medium">Correo Institucional</th>
                    <th className="py-3 px-5 font-medium">Rol en el Sistema</th>
                    <th className="py-3 px-5 font-medium">Estado</th>
                    <th className="py-3 px-5 font-medium">Fecha de Alta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredDirectory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No se encontraron colaboradores que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredDirectory.map((u) => {
                      const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || "Sin nombre registrado";
                      const initial = (u.firstName || u.email).charAt(0).toUpperCase();

                      return (
                        <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-800 text-foreground font-bold flex items-center justify-center shrink-0">
                                {initial}
                              </div>
                              <span className="font-semibold text-foreground">{name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-foreground/90 font-medium">{u.email}</td>
                          <td className="py-3.5 px-5">
                            <div className="flex flex-wrap gap-1">
                              {u.roles.map((r) => {
                                if (r === "ADMIN") {
                                  return (
                                    <Badge
                                      key={r}
                                      className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[10px]"
                                    >
                                      Administrador
                                    </Badge>
                                  );
                                }
                                if (r === "KAM") {
                                  return (
                                    <Badge
                                      key={r}
                                      className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]"
                                    >
                                      KAM
                                    </Badge>
                                  );
                                }
                                return (
                                  <Badge
                                    key={r}
                                    className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px]"
                                  >
                                    Líder de Producto
                                  </Badge>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Activo
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString("es-CO", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Register Modal */}
      <Dialog open={preRegisterOpen} onOpenChange={setPreRegisterOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handlePreRegisterSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground text-base">
                <UserPlus className="h-5 w-5 text-[#5454e9]" />
                Pre-registrar Colaborador
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs leading-relaxed pt-1">
                Al pre-registrar un colaborador con su correo institucional, entrará directamente a su espacio de
                trabajo con Microsoft SSO sin tener que esperar aprobación.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 my-4">
              <div>
                <Label htmlFor="email" className="text-xs font-medium">
                  Correo Institucional (@icesi.edu.co o @u.icesi.edu.co) *
                </Label>
                <Input
                  id="email"
                  required
                  type="email"
                  placeholder="ejemplo@icesi.edu.co"
                  value={preRegisterForm.email}
                  onChange={(e) => setPreRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="text-xs mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="firstName" className="text-xs font-medium">
                    Nombre (Opcional)
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="Carlos"
                    value={preRegisterForm.firstName}
                    onChange={(e) => setPreRegisterForm((prev) => ({ ...prev, firstName: e.target.value }))}
                    className="text-xs mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-xs font-medium">
                    Apellido (Opcional)
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Mora"
                    value={preRegisterForm.lastName}
                    onChange={(e) => setPreRegisterForm((prev) => ({ ...prev, lastName: e.target.value }))}
                    className="text-xs mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium block mb-1.5">Rol Operacional Asignado *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    role="button"
                    data-testid="role-option-kam"
                    tabIndex={0}
                    onClick={() => setPreRegisterForm((prev) => ({ ...prev, roleCode: "KAM" }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setPreRegisterForm((prev) => ({ ...prev, roleCode: "KAM" }));
                      }
                    }}
                    className={`cursor-pointer border rounded-xl p-3 text-left transition-all ${
                      preRegisterForm.roleCode === "KAM"
                        ? "border-[#5454e9] bg-[#5454e9]/5 ring-1 ring-[#5454e9]"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className="h-4 w-4 text-[#5454e9]" />
                      <span className="font-semibold text-xs text-foreground">KAM</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Gestión de clientes y solicitudes comerciales.
                    </p>
                  </div>

                  <div
                    role="button"
                    data-testid="role-option-ldp"
                    tabIndex={0}
                    onClick={() => setPreRegisterForm((prev) => ({ ...prev, roleCode: "PRODUCT_LEADER" }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setPreRegisterForm((prev) => ({ ...prev, roleCode: "PRODUCT_LEADER" }));
                      }
                    }}
                    className={`cursor-pointer border rounded-xl p-3 text-left transition-all ${
                      preRegisterForm.roleCode === "PRODUCT_LEADER"
                        ? "border-purple-600 bg-purple-600/5 ring-1 ring-purple-600"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="h-4 w-4 text-purple-600" />
                      <span className="font-semibold text-xs text-foreground">Líder de Producto</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      Estructuración técnica, profesores y costeo.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-4">
              <Button
                type="button"
                variant="outline"
                disabled={preRegisterSubmitting}
                onClick={() => setPreRegisterOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={preRegisterSubmitting}
                className="bg-[#5454e9] hover:bg-[#4343d0] text-white"
              >
                {preRegisterSubmitting ? "Guardando…" : "Pre-registrar y Autorizar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Modal */}
      <Dialog open={!!rejectModalUser} onOpenChange={(open) => !open && setRejectModalUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 text-base">
              <AlertCircle className="h-5 w-5" />
              Rechazar Solicitud de Acceso
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs leading-relaxed pt-1">
              ¿Estás seguro de que deseas rechazar la solicitud de acceso para{" "}
              <strong className="text-foreground">{rejectModalUser?.email}</strong>? La cuenta será desactivada y el
              usuario no podrá acceder al sistema.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              disabled={rejectSubmitting}
              onClick={() => setRejectModalUser(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={rejectSubmitting}
              onClick={handleConfirmReject}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {rejectSubmitting ? "Rechazando…" : "Sí, rechazar acceso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
