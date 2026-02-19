import { useEffect, useState } from "react"
import { Car, Shield } from "lucide-react"
import { toast } from "sonner"
import { VehicleTechSheet } from "@/components/VehicleTechSheet"
import type { TechSheetVehicle, VehicleStatus } from "@/components/VehicleTechSheet"
import { Container } from "@/components/Container"
import { getAppointmentsHistory } from "@/services/appointments"
import { getUserExpiringReminders, type ExpiringReminderApi } from "@/services/reminder"
import { getVehiclesOfUser } from "@/services/vehicles"
import type { Appointment } from "@/types/appointments.types"
import type { Vehicle } from "@/types/vehicles.types"

type ApiVehicleStatus = "GOOD" | "MEDIUM" | "CRITICAL" | null | undefined

type AppointmentHistory = Appointment & {
  kmAtService?: number | null
  vehicleStatusAtService?: ApiVehicleStatus
  vehicle: Vehicle & { status?: ApiVehicleStatus }
  originalPrice?: number | null
  finalPrice?: number | null
}

const normalizeStatus = (status: ApiVehicleStatus): VehicleStatus => {
  if (status === "GOOD" || status === "MEDIUM" || status === "CRITICAL") return status
  return "NO_STATUS"
}

const toNumber = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

const toIsoDateTime = (a: { date?: string; time?: string }): string => {
  const d = typeof a.date === "string" ? a.date : ""
  const t = typeof a.time === "string" ? a.time : ""
  const tt = t ? (t.length === 5 ? `${t}:00` : t) : "00:00:00"
  return d ? `${d}T${tt}` : new Date(0).toISOString()
}

export const TechnicalSheet = () => {
  const [vehicles, setVehicles] = useState<TechSheetVehicle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesData, history, expiringReminders] = await Promise.all([
          getVehiclesOfUser() as Promise<Vehicle[]>,
          getAppointmentsHistory() as Promise<AppointmentHistory[]>,
          getUserExpiringReminders() as Promise<ExpiringReminderApi[]>,
        ])

        const expiringByVehicleId = new Map<number, ExpiringReminderApi[]>()
        for (const r of expiringReminders || []) {
          const vid = toNumber(r?.vehicle?.id)
          if (!vid) continue
          const arr = expiringByVehicleId.get(vid) || []
          arr.push(r)
          expiringByVehicleId.set(vid, arr)
        }

        const apptsByVehicleId = new Map<number, AppointmentHistory[]>()
        for (const appt of history || []) {
          const vid = toNumber(appt?.vehicle?.id)
          if (!vid) continue
          const arr = apptsByVehicleId.get(vid) || []
          arr.push(appt)
          apptsByVehicleId.set(vid, arr)
        }

        const vehicleById = new Map<number, Vehicle>()
        for (const v of vehiclesData || []) {
          const id = toNumber(v?.id)
          if (id) vehicleById.set(id, v)
        }

        // si en history aparece un vehículo que no vino en /vehicle/user, igual lo mostramos
        for (const [vid, appts] of apptsByVehicleId.entries()) {
          if (vehicleById.has(vid)) continue
          const fromHistory = appts.find((a) => toNumber(a?.vehicle?.id) === vid)?.vehicle
          if (fromHistory) vehicleById.set(vid, fromHistory)
        }

        const buildReminderSummary = (items: ExpiringReminderApi[] | undefined) => {
          const expired: string[] = []
          const expiring: string[] = []

          const detailOf = (r: ExpiringReminderApi): string | null => {
            const status = r?.mileage?.status ?? r?.months?.status
            if (status === "OVERDUE") {
              if (typeof r?.mileage?.kmOverdue === "number" && r.mileage.kmOverdue > 0) {
                return `${r.mileage.kmOverdue.toLocaleString()} km vencidos`
              }
              if (typeof r?.months?.daysOverdue === "number" && r.months.daysOverdue > 0) {
                return `${r.months.daysOverdue} días vencidos`
              }
            }
            if (status === "DUE_SOON") {
              if (typeof r?.mileage?.kmRemaining === "number") {
                return `faltan ${Math.max(0, r.mileage.kmRemaining).toLocaleString()} km`
              }
              if (typeof r?.months?.daysRemaining === "number") {
                return `faltan ${Math.max(0, r.months.daysRemaining)} días`
              }
            }
            return null
          }

          for (const r of items || []) {
            const status = r?.mileage?.status ?? r?.months?.status
            const serviceName =
              typeof r?.service?.name === "string" && r.service.name.trim()
                ? r.service.name.trim()
                : "Servicio"
            const detail = detailOf(r)
            const label = detail ? `${serviceName} • ${detail}` : serviceName
            if (status === "OVERDUE") expired.push(label)
            else if (status === "DUE_SOON") expiring.push(label)
          }

          const uniq = (arr: string[]) => Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b))
          return { expired: uniq(expired), expiring: uniq(expiring) }
        }

        const sheets: TechSheetVehicle[] = Array.from(vehicleById.values())
          .map((v) => {
            const vid = v.id
            const appts = (apptsByVehicleId.get(vid) || []).slice()
            appts.sort((a, b) => toIsoDateTime(b).localeCompare(toIsoDateTime(a)))

            const latestAppt = appts[0]
            const currentStatus = normalizeStatus(latestAppt?.vehicle?.status)

            const km =
              toNumber(v?.km) ??
              toNumber(latestAppt?.vehicle?.km) ??
              Math.max(
                0,
                ...appts
                  .map((a) => toNumber(a?.kmAtService))
                  .filter((n): n is number => typeof n === "number")
              )

            const breakdown = new Map<string, number>()
            let completedServicesTotal = 0
            const pending = new Set<string>()

            for (const appt of appts) {
              const isCompleted = ["COMPLETED", "SERVICE_COMPLETED"].includes(String(appt?.status))
              const isPending = ["PENDING", "CONFIRMED", "IN_SERVICE"].includes(String(appt?.status))

              for (const s of appt?.services || []) {
                const name =
                  typeof s?.name === "string" && s.name.trim() ? s.name.trim() : "Servicio"

                if (isCompleted) {
                  breakdown.set(name, (breakdown.get(name) || 0) + 1)
                  completedServicesTotal += 1
                } else if (isPending) {
                  pending.add(name)
                }
              }
            }

            const serviceHistory = appts
              .filter((appt) => ["COMPLETED", "SERVICE_COMPLETED"].includes(String(appt?.status)))
              .map((appt) => {
                const names = (appt?.services || [])
                  .map((s) => (typeof s?.name === "string" ? s.name : ""))
                  .filter(Boolean)
                const serviceName = names.length ? names.join(", ") : `Servicio #${appt.id}`
                const amountPaid = toNumber(appt?.finalPrice) ?? toNumber(appt?.originalPrice) ?? 0

                return {
                  id: appt.id,
                  serviceName,
                  date: appt.date,
                  amountPaid,
                  workshopName: appt?.workshop?.workshopName || "N/A",
                  vehicleStatusAtTime: normalizeStatus(appt?.vehicleStatusAtService),
                }
              })

            return {
              id: vid,
              licensePlate: v.licensePlate || "N/A",
              model: v.model || "Sin modelo",
              year: toNumber(v.year) ?? 0,
              km: typeof km === "number" ? km : 0,
              currentStatus,
              completedServicesTotal,
              completedServicesBreakdown: Array.from(breakdown.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count),
              pendingServices: Array.from(pending.values()).sort((a, b) => a.localeCompare(b)),
              serviceHistory,
              reminderSummary: buildReminderSummary(expiringByVehicleId.get(vid)),
            }
          })
          .sort((a, b) => a.model.localeCompare(b.model))

        setVehicles(sheets)
      } catch {
        toast.error("Error al cargar las fichas tecnicas")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-10 w-64 bg-muted/50 rounded-2xl animate-pulse" />
          <div className="h-5 w-96 bg-muted/30 rounded-xl animate-pulse" />
          <div className="h-12 bg-muted/30 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-96 bg-card/50 rounded-3xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Container className="p-6">
      <div className="flex flex-col gap-8">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
            <Shield className="h-6 w-6 text-foreground/70" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              Ficha Tecnica
            </h1>
            <p className="text-muted-foreground">
              Consulta el estado, historial y detalle de cada uno de tus vehiculos
            </p>
          </div>
        </div>
        {vehicles.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {vehicles.map((vehicle, index) => (
              <VehicleTechSheet
                key={vehicle.id}
                vehicle={vehicle}
                colorIndex={index}
                showCompletedServices={true}
                hasReminder={true}
                lastServiceDate={vehicle.serviceHistory[0]?.date}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 mb-6">
              <Car className="h-16 w-16 text-primary/60" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No tenes vehiculos registrados
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Agrega vehiculos desde la seccion &quot;Mis Vehiculos&quot; para poder ver sus
              fichas tecnicas
            </p>
          </div>
        )}
      </div>
    </Container>
  )
}
