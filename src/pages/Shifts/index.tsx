import { Container } from "@/components/Container"
import { useState } from "react"
import type { Shift, DateFilter, Appointment, AppointmentStatus } from "@/types/appointments.types"
import type { Service } from "@/types/services.types"
import { changeAppointmentStatus, getAppointmentsBySearch } from "@/services/appointments"
import { sortAppointments } from "@/helpers/sort-appointments"
import { Calendar, Clock, User, Car, Wrench, Search, CircleDot, BanIcon, CircleArrowRight } from "lucide-react"
import { AppointmentStatusBadge } from "@/components/AppointmentStatusBadge"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { appointmentStatusToLabel, isCancelable, isInFinalState, nextStateOf } from "@/helpers/appointment-status"
import { useQuery } from "react-query"
import { CustomTable } from "@/components/CustomTable"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { updateVehicleStatus } from "@/services/vehicles"
import type { VehicleOverallStatus } from "@/types/vehicles.types"

export function Shifts() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [dateFilter, setDateFilter] = useState<DateFilter | "all">("today")
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("PENDING" as AppointmentStatus)
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const [completeTarget, setCompleteTarget] = useState<Appointment | null>(null)
  const [selectedVehicleStatus, setSelectedVehicleStatus] = useState<VehicleOverallStatus | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)
  const itemsPerPage = 10

  const fetchShifts = async () => {
    try {
      const params: { status?: AppointmentStatus; dateFilter?: DateFilter } = {}
      if (statusFilter !== "all") params.status = statusFilter
      if (dateFilter !== "all") params.dateFilter = dateFilter
      const shifts = await getAppointmentsBySearch(params)
      return shifts.map((shift: Shift) => ({
        ...shift,
        type: "shift",
      }))
    } catch (error) {
      console.error("Error fetching shifts:", error)
      return []
    }
  }

  const {
    isLoading: loading,
    data: shifts,
    refetch,
  } = useQuery<Shift[]>(["shifts", dateFilter, statusFilter], async () => fetchShifts(), {
    initialData: [],
  })

  const filteredShifts = (shifts as Shift[]).filter((shift: Shift) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      shift.date.toLowerCase().includes(searchLower) ||
      shift.time.toLowerCase().includes(searchLower) ||
      (shift.type === "shift" && shift.user.fullName.toLowerCase().includes(searchLower)) ||
      shift.services.some((s: Service) => s.name.toLowerCase().includes(searchLower))
    )
  })

  const totalPages = Math.ceil(filteredShifts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentShifts = sortAppointments(filteredShifts).slice(startIndex, endIndex)

  const openCompleteModal = (appt: Appointment) => {
    setCompleteTarget(appt)
    setSelectedVehicleStatus(null)
    setCompleteModalOpen(true)
  }

  const closeCompleteModal = () => {
    if (isCompleting) return
    setCompleteModalOpen(false)
    setCompleteTarget(null)
    setSelectedVehicleStatus(null)
  }

  const confirmComplete = async () => {
    if (isCompleting) return
    if (!completeTarget) return
    if (!selectedVehicleStatus) return

    setIsCompleting(true)
    try {
      await updateVehicleStatus(completeTarget.vehicle.id, { status: selectedVehicleStatus })
      await changeAppointmentStatus(completeTarget.id, "COMPLETED" as AppointmentStatus)
      toast.success("Turno completado")
      closeCompleteModal()
      refetch()
    } catch (e) {
      console.error(e)
      toast.error("No se pudo completar el turno")
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <Container>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-foreground">Gestión de Turnos</h1>
          <p className="text-muted-foreground">Administra y visualiza todos los turnos programados</p>
        </div>

        <div className="bg-card rounded-3xl shadow-sm border border-border/50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-3">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Próximos Turnos</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredShifts.length} {filteredShifts.length === 1 ? "turno programado" : "turnos programados"}
              </p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, fecha o servicio..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 p-3">
            <span className="text-xs text-muted-foreground">Filtros:</span>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Fecha</Label>
              <Select
                value={dateFilter}
                onValueChange={(value) => {
                  setDateFilter(value as DateFilter | "all")
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-9 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">TODAS</SelectItem>
                  <SelectItem value="past">PASADOS</SelectItem>
                  <SelectItem value="today">HOY</SelectItem>
                  <SelectItem value="future">FUTUROS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Estado</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as AppointmentStatus | "all")
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-9 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">TODAS</SelectItem>
                  {Object.values(["PENDING", "IN_SERVICE", "SERVICE_COMPLETED", "COMPLETED", "CANCELLED"]).map((status) => (
                    <SelectItem key={status} value={status}>
                      {appointmentStatusToLabel[status as AppointmentStatus]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TooltipProvider>
            <CustomTable
              data={currentShifts}
              columns={[
                {
                  key: "date",
                  label: "Fecha",
                  icon: <Calendar className="h-4 w-4" />,
                  render: (item) => <span className="font-medium">{item.date}</span>,
                },
                {
                  key: "time",
                  label: "Hora",
                  icon: <Clock className="h-4 w-4" />,
                  render: (item) => item.time,
                },
                {
                  key: "user",
                  label: "Cliente",
                  icon: <User className="h-4 w-4" />,
                  render: (item) => (item.type === "shift" ? item.user.fullName : ""),
                },
                {
                  key: "vehicle",
                  label: "Vehículo",
                  icon: <Car className="h-4 w-4" />,
                  render: (item) => item.vehicle.licensePlate,
                },
                {
                  key: "services",
                  label: "Servicios",
                  icon: <Wrench className="h-4 w-4" />,
                  render: (item) => (
                    <div className="flex flex-wrap gap-1">
                      {item.services.map((service: Service) => (
                        <Badge key={service.id} variant="secondary" className="text-xs rounded-full">
                          {service.name}
                        </Badge>
                      ))}
                    </div>
                  ),
                },
                {
                  key: "status",
                  label: "Estado",
                  icon: <CircleDot className="h-4 w-4" />,
                  render: (item) => <AppointmentStatusBadge value={(item as Appointment).status} />,
                },
                {
                  key: "actions",
                  label: "Acciones",
                  render: (item) => (
                    <div className="flex flex-wrap gap-1">
                      {isCancelable((item as Appointment).status) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async (e) => {
                                e.stopPropagation()
                                await changeAppointmentStatus(item.id, "CANCELLED" as AppointmentStatus)
                                refetch()
                              }}
                              className="rounded-xl hover:bg-destructive/10 text-destructive hover:text-destructive"
                            >
                              <BanIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p>Cancelar turno</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {!isInFinalState((item as Appointment).status) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async (e) => {
                                e.stopPropagation()
                                const appt = item as Appointment
                                const next = nextStateOf(appt.status)
                                if (appt.status === "SERVICE_COMPLETED" && next === "COMPLETED") {
                                  openCompleteModal(appt)
                                  return
                                }
                                await changeAppointmentStatus(appt.id, next)
                                refetch()
                              }}
                              className="rounded-xl text-primary hover:text-green-500 hover:bg-green-500/10"
                            >
                              <CircleArrowRight className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p>
                              Pasar turno al estado{" "}
                              {appointmentStatusToLabel[nextStateOf((item as Appointment).status)]}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  ),
                },
              ]}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredShifts.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              loading={loading}
              emptyState={{
                icon: <Calendar className="h-8 w-8 text-muted-foreground" />,
                title: "No hay turnos programados",
                description: searchTerm
                  ? "No se encontraron turnos con ese criterio de búsqueda"
                  : "Aún no tienes turnos agendados",
              }}
            />
          </TooltipProvider>
        </div>
      </div>

      <Dialog
        open={completeModalOpen}
        onOpenChange={(open) => {
          if (!open) closeCompleteModal()
        }}
      >
        <DialogContent className="text-foreground rounded-3xl border-border/50 max-w-xl" showCloseButton={!isCompleting}>
          <DialogHeader>
            <DialogTitle className="text-2xl">Turno terminado!</DialogTitle>
            <DialogDescription>
              Dale una etiqueta de estado general a este vehiculo:{" "}
              <span className="font-medium text-foreground">
                {completeTarget?.vehicle?.licensePlate} {completeTarget?.vehicle?.model}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {[
              { label: "BUENO", value: "GOOD" as const, active: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300" },
              { label: "REGULAR", value: "MEDIUM" as const, active: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300" },
              { label: "CRITICO", value: "CRITICAL" as const, active: "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300" },
            ].map((opt) => {
              const isActive = selectedVehicleStatus === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isCompleting}
                  onClick={() => setSelectedVehicleStatus(opt.value)}
                  className={[
                    "rounded-2xl border px-4 py-4 text-sm font-semibold transition-colors cursor-pointer",
                    "bg-card hover:bg-accent/30 border-border/50",
                    isActive ? opt.active : "text-foreground",
                    isCompleting ? "opacity-70 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={closeCompleteModal} disabled={isCompleting} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={confirmComplete}
              disabled={isCompleting || !selectedVehicleStatus}
              className="rounded-xl"
            >
              {isCompleting ? "Confirmando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  )
}
