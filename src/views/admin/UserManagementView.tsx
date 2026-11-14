"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { usersApi, type PendingUser, type DirectoryAdminUser, type PreRegisterUserPayload } from "@/lib/api/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { toTitleCase } from "@/lib/format-name";

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
          if (!next[u.id]) {
            next[u.id] = (u.requestedRole as OperationalRole) || "KAM";
          }
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
        description: `${user.email} fue configurado como ${
          roleCode === "KAM" ? "Key Account Manager" : "Líder de Producto"
        }.`,
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
      void loadData(true);
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
    const email = preRegisterForm.email.trim().toLowerCase();

    if (!email.endsWith("@icesi.edu.co") && !email.endsWith("@u.icesi.edu.co")) {
      toast.error("Dominio de correo inválido", {
        description: "El correo debe pertenecer a @icesi.edu.co o @u.icesi.edu.co.",
      });
      return;
    }

    setPreRegisterSubmitting(true);

    try {
      const result = await usersApi.preRegisterUser({
        email,
        roleCode: preRegisterForm.roleCode,
        firstName: preRegisterForm.firstName ? toTitleCase(preRegisterForm.firstName) : undefined,
        lastName: preRegisterForm.lastName ? toTitleCase(preRegisterForm.lastName) : undefined,
      });

      const roleLabel = preRegisterForm.roleCode === "KAM" ? "KAM" : "Líder de Producto";

      if (result.status === "REACTIVATED") {
        toast.success("Colaborador reactivado y autorizado exitosamente", {
          description: `${email} fue reactivado con el rol ${roleLabel}. Ya puede ingresar directamente con su cuenta institucional.`,
        });
      } else {
        toast.success("Colaborador pre-registrado exitosamente", {
          description: `${email} tiene asignado el rol ${roleLabel}. Entrará directo con su cuenta institucional.`,
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
        description: error instanceof Error ? error.message : "Ocurrió un error inesperado.",
      });
    } finally {
      setPreRegisterSubmitting(false);
    }
  };

  return (
    <AppShell>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-medium">Solicitudes Pendientes</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">{stats.pendingCount}</span>
              {stats.pendingCount > 0 && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                  Requiere atención
                </Badge>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-medium">Colaboradores Activos</span>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">{stats.totalActive}</span>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-medium">Key Account Managers (KAM)</span>
              <Briefcase className="h-4 w-4 text-blue-500" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">{stats.kamCount}</span>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1.5">
              <span className="text-xs font-medium">Líderes de Producto</span>
              <Award className="h-4 w-4 text-purple-500" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">{stats.lpCount}</span>
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

        {/* Tab 1: Solicitudes Pendientes (Card-based Queue, 0 horizontal scroll) */}
        {activeTab === "pending" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">COLA DE APROBACIÓN ({pendingUsers.length})</h2>
                <p className="text-xs text-muted-foreground">
                  Asigna el rol correspondiente y aprueba o rechaza el acceso de cada colaborador.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground bg-card border border-border rounded-xl">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                <span>Cargando solicitudes pendientes…</span>
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="p-12 text-center bg-card border border-border rounded-xl">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-foreground">No hay solicitudes pendientes</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                  Todas las solicitudes de acceso institucional han sido procesadas. Los nuevos colaboradores que
                  ingresen con su cuenta de Icesi aparecerán aquí.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {pendingUsers.map((u) => {
                  const fullName =
                    toTitleCase([u.firstName, u.lastName].filter(Boolean).join(" ")) || "Sin nombre registrado";
                  const userInitial = (u.firstName || u.email).charAt(0).toUpperCase();
                  const formattedDate = new Date(u.createdAt).toLocaleDateString("es-CO", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={u.id}
                      className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-xs transition-all hover:border-border/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Left: Collaborator identity & date */}
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 text-primary dark:text-icesi-purple flex items-center justify-center font-bold text-sm">
                          {userInitial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-foreground truncate">{fullName}</span>
                            {u.requestedRole ? (
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary dark:text-icesi-purple border border-primary/20">
                                Solicitó: {u.requestedRole === "KAM" ? "KAM" : "Líder de Producto"}
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                Sin solicitud de rol
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 sm:gap-4 mt-0.5 text-xs text-muted-foreground flex-wrap">
                            <span className="truncate">{u.email}</span>
                            <span className="hidden sm:inline opacity-40">•</span>
                            <span className="inline-flex items-center gap-1 text-[11px] whitespace-nowrap">
                              <Clock className="h-3 w-3" />
                              {formattedDate}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Role selection & action buttons */}
                      <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/50">
                        <div className="w-44 sm:w-52">
                          <Select
                            value={roleSelections[u.id] || "KAM"}
                            onValueChange={(val: OperationalRole) =>
                              setRoleSelections((prev) => ({ ...prev, [u.id]: val }))
                            }
                          >
                            <SelectTrigger className="h-9 text-xs bg-background">
                              <SelectValue placeholder="Seleccionar rol" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="KAM">KAM</SelectItem>
                              <SelectItem value="PRODUCT_LEADER">Líder de Producto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          size="sm"
                          disabled={actionLoadingId === u.id}
                          onClick={() => void handleApprove(u)}
                          className="h-9 bg-[#5454e9] hover:bg-[#4343d0] text-white text-xs font-medium px-3.5 rounded-lg gap-1.5"
                        >
                          {actionLoadingId === u.id ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          <span>Aprobar</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoadingId === u.id}
                          onClick={() => setRejectModalUser(u)}
                          className="h-9 text-xs text-muted-foreground hover:text-red-600 hover:border-red-200 dark:hover:border-red-900 rounded-lg px-2.5"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span className="sr-only sm:not-sr-only">Rechazar</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Directorio de Colaboradores (Clean table with whitespace-nowrap) */}
        {activeTab === "directory" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, correo o rol…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs rounded-lg"
                />
              </div>

              <div className="text-xs text-muted-foreground">
                Mostrando {filteredDirectory.length} colaboradores activos
              </div>
            </div>

            <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 dark:bg-muted/20 border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th className="py-3 px-5 whitespace-nowrap">Colaborador</th>
                      <th className="py-3 px-5 whitespace-nowrap">Correo Institucional</th>
                      <th className="py-3 px-5 whitespace-nowrap">Rol en el Sistema</th>
                      <th className="py-3 px-5 whitespace-nowrap">Estado</th>
                      <th className="py-3 px-5 whitespace-nowrap">Fecha de Alta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-1.5 text-primary" />
                          Cargando directorio…
                        </td>
                      </tr>
                    ) : filteredDirectory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          No se encontraron colaboradores que coincidan con la búsqueda.
                        </td>
                      </tr>
                    ) : (
                      filteredDirectory.map((u) => {
                        const fullName =
                          toTitleCase([u.firstName, u.lastName].filter(Boolean).join(" ")) || "Sin nombre registrado";
                        const userInitial = (u.firstName || u.email).charAt(0).toUpperCase();

                        return (
                          <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                            <td className="py-3.5 px-5 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                                  {userInitial}
                                </div>
                                <span className="font-medium text-xs text-foreground">{fullName}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-5 text-muted-foreground whitespace-nowrap">{u.email}</td>
                            <td className="py-3.5 px-5 whitespace-nowrap">
                              <div className="flex gap-1.5 flex-wrap">
                                {u.roles.map((r) => {
                                  if (r === "ADMIN") {
                                    return (
                                      <Badge
                                        key={r}
                                        className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]"
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
                            <td className="py-3.5 px-5 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Activo
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-muted-foreground whitespace-nowrap">
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

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setPreRegisterOpen(false)} className="text-xs">
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={preRegisterSubmitting}
                  className="bg-[#5454e9] hover:bg-[#4343d0] text-white text-xs"
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
              <DialogTitle className="flex items-center gap-2 text-destructive text-base">
                <AlertCircle className="h-5 w-5" />
                Rechazar Solicitud de Acceso
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs leading-relaxed pt-1">
                ¿Estás seguro de que deseas rechazar la solicitud de acceso institucional de{" "}
                <span className="font-semibold text-foreground">{rejectModalUser?.email}</span>?
              </DialogDescription>
            </DialogHeader>

            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-xs text-destructive my-2">
              Esta acción desactivará la cuenta y no permitirá que el usuario ingrese al sistema comercial hasta que sea
              pre-registrado o aprobado nuevamente.
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button type="button" variant="outline" onClick={() => setRejectModalUser(null)} className="text-xs">
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={rejectSubmitting}
                onClick={handleConfirmReject}
                className="text-xs"
              >
                {rejectSubmitting ? "Rechazando…" : "Sí, rechazar acceso"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
