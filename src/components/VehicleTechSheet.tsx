import { useState } from "react"
import {
  Car,
  Calendar,
  Gauge,
  FileText,
  Wrench,
  DollarSign,
  ChevronDown,
  CheckCircle2,
  Loader2,
  Building2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react"

export type VehicleStatus = "GOOD" | "MEDIUM" | "CRITICAL" | "NO_STATUS"

export type ReminderSummary = {
  expired: string[]
  expiring: string[]
}

export interface ServiceBreakdown {
  name: string
  count: number
}

export interface ServiceHistoryEntry {
  id: number
  serviceName: string
  date: string
  amountPaid: number
  workshopName: string
  vehicleStatusAtTime: VehicleStatus
}

export interface TechSheetVehicle {
  id: number
  licensePlate: string
  model: string
  year: number
  km: number
  currentStatus: VehicleStatus
  completedServicesTotal: number
  completedServicesBreakdown: ServiceBreakdown[]
  pendingServices: string[]
  serviceHistory: ServiceHistoryEntry[]
  reminderSummary?: ReminderSummary
}

const STATUS_CONFIG: Record<
  VehicleStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  GOOD: {
    label: "Bueno",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  MEDIUM: {
    label: "Regular",
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  CRITICAL: {
    label: "Critico",
    bg: "bg-red-500/10",
    text: "text-red-700 dark:text-red-300",
    dot: "bg-red-500",
  },
  NO_STATUS: {
    label: "Sin estado",
    bg: "bg-slate-500/10",
    text: "text-slate-700 dark:text-slate-300",
    dot: "bg-slate-500",
  },
}

function StatusBadge({ status }: { status: VehicleStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

const GRADIENT_COLORS = [
  "from-blue-500/10 to-blue-600/5",
  "from-emerald-500/10 to-emerald-600/5",
  "from-violet-500/10 to-violet-600/5",
  "from-amber-500/10 to-amber-600/5",
  "from-rose-500/10 to-rose-600/5",
  "from-cyan-500/10 to-cyan-600/5",
]

export const VehicleTechSheet = ({
  vehicle,
  colorIndex = 0,
  showCompletedServices = true,
  hasReminder = false,
}: {
  vehicle: TechSheetVehicle
  colorIndex?: number
  showCompletedServices?: boolean
  hasReminder?: boolean
}) => {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyPage, setHistoryPage] = useState(0)
  const gradient = GRADIENT_COLORS[colorIndex % GRADIENT_COLORS.length]
  const pageSize = 5
  const totalPages = Math.max(1, Math.ceil(vehicle.serviceHistory.length / pageSize))
  const clampedPage = Math.min(Math.max(0, historyPage), totalPages - 1)
  const pageItems = vehicle.serviceHistory.slice(
    clampedPage * pageSize,
    clampedPage * pageSize + pageSize
  )

  const reminder = vehicle.reminderSummary ?? { expired: [], expiring: [] }
  const hasReminderAlert = reminder.expired.length > 0 || reminder.expiring.length > 0

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      <div className={`bg-gradient-to-br ${gradient} px-6 pt-6 pb-5`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-background/60 backdrop-blur-sm">
              <Car className="h-6 w-6 text-foreground/70" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">{vehicle.model}</h3>
              <p className="text-sm text-muted-foreground font-medium mt-0.5">
                {vehicle.licensePlate}
              </p>
            </div>
          </div>
          <StatusBadge status={vehicle.currentStatus} />
        </div>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-accent/30 rounded-2xl p-4 text-center">
            <Calendar className="h-4 w-4 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-0.5">Año</p>
            <p className="text-lg font-bold text-foreground">{vehicle.year}</p>
          </div>
          <div className="bg-accent/30 rounded-2xl p-4 text-center">
            <Gauge className="h-4 w-4 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-0.5">Kilometraje</p>
            <p className="text-lg font-bold text-foreground">
              {vehicle.km.toLocaleString()}
            </p>
          </div>
          <div className="bg-accent/30 rounded-2xl p-4 text-center">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-0.5">Completados</p>
            <p className="text-lg font-bold text-foreground">
              {vehicle.completedServicesTotal}
            </p>
          </div>
        </div>

        {
          hasReminder && (
            <div
              className={[
                "rounded-2xl border shadow-sm p-4",
                hasReminderAlert
                  ? reminder.expired.length > 0
                    ? "border-destructive/30 bg-destructive/10"
                    : "border-amber-500/30 bg-amber-500/10"
                  : "border-border/40 bg-card/40",
              ].join(" ")}
            >
              {hasReminderAlert ? (
                <div className="flex items-start gap-3">
                  <div
                    className={[
                      "w-10 h-10 rounded-2xl flex items-center justify-center",
                      reminder.expired.length > 0 ? "bg-destructive/15" : "bg-amber-500/15",
                    ].join(" ")}
                  >
                    <AlertTriangle
                      className={[
                        "h-5 w-5",
                        reminder.expired.length > 0
                          ? "text-destructive"
                          : "text-amber-700 dark:text-amber-300",
                      ].join(" ")}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {reminder.expired.length > 0
                        ? "Tenés mantenimientos vencidos"
                        : "Tenés mantenimientos por vencer"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Te recomendamos reservar un turno para estos servicios.
                    </p>
                    <div className="mt-2 space-y-1 text-sm text-foreground/90">
                      {reminder.expired.length > 0 ? (
                        <div>
                          <span className="font-medium">Vencidos:</span>{" "}
                          {reminder.expired.join(", ")}
                        </div>
                      ) : null}
                      {reminder.expiring.length > 0 ? (
                        <div>
                          <span className="font-medium">Por vencer:</span>{" "}
                          {reminder.expiring.join(", ")}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Todo en orden</p>
                    <p className="text-sm text-muted-foreground">
                      No hay mantenimientos por vencer para este vehículo.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        }

        {vehicle.pendingServices.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-amber-500" />
              <h4 className="text-sm font-semibold text-foreground">
                Servicios pendientes
              </h4>
              <span className="ml-auto text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full">
                {vehicle.pendingServices.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {vehicle.pendingServices.map((service, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-500/8 text-amber-700 dark:text-amber-300"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {service}
                </span>
              ))}
            </div>
          </div>
        )}
        {showCompletedServices && vehicle.completedServicesBreakdown.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-emerald-500" />
              <h4 className="text-sm font-semibold text-foreground">
                Servicios completados
              </h4>
            </div>
            <div className="space-y-2">
              {vehicle.completedServicesBreakdown.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-accent/20 hover:bg-accent/30 transition-colors"
                >
                  <span className="text-sm text-foreground">{item.name}</span>
                  <span className="text-sm font-semibold text-foreground bg-emerald-500/10 dark:text-emerald-300 px-2.5 py-0.5 rounded-lg">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {vehicle.serviceHistory.length > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => {
                const nextOpen = !historyOpen
                setHistoryOpen(nextOpen)
                if (nextOpen) setHistoryPage(0)
              }}
              className="flex items-center gap-2 w-full group cursor-pointer"
            >
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold text-foreground">
                Historial de servicios
              </h4>
              <span className="ml-1 text-xs font-medium text-muted-foreground">
                ({vehicle.serviceHistory.length})
              </span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground ml-auto transition-transform duration-300 ${
                  historyOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`space-y-3 overflow-hidden transition-all duration-400 ease-in-out ${
                historyOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              {pageItems.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-accent/20 rounded-2xl p-4 space-y-3 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {entry.serviceName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(entry.date).toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <StatusBadge status={entry.vehicleStatusAtTime} />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <DollarSign className="h-3.5 w-3.5" />
                      <span className="font-medium text-foreground">
                        ${entry.amountPaid.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                      <span className="font-medium text-foreground">
                        {entry.workshopName}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {vehicle.serviceHistory.length > pageSize && (
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
                    disabled={clampedPage === 0}
                    className="text-xs font-medium px-3 py-1.5 rounded-xl bg-accent/30 hover:bg-accent/40 disabled:opacity-50 disabled:hover:bg-accent/30 transition-colors cursor-pointer"
                  >
                    Anterior
                  </button>
                  <span className="text-xs text-muted-foreground">
                    Página {clampedPage + 1} de {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHistoryPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={clampedPage >= totalPages - 1}
                    className="text-xs font-medium px-3 py-1.5 rounded-xl bg-accent/30 hover:bg-accent/40 disabled:opacity-50 disabled:hover:bg-accent/30 transition-colors cursor-pointer"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
