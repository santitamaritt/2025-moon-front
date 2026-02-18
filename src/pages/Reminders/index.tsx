import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Bell, RotateCcw, Save, Clock, Gauge, Wrench, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { Service } from "@/types/services.types"
import type { Appointment } from "@/types/appointments.types"
import { getAppointmentsHistory } from "@/services/appointments"
import {
  createReminder,
  deleteReminder,
  getUserReminders,
  updateReminder as updateReminderApi,
  type ReminderApi,
} from "@/services/reminder"
import { Container } from "@/components/Container"
import { useStore } from "@/zustand/store"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ReminderConfig {
  reminderId?: number
  serviceId: number
  serviceName: string
  timeValue: string
  timeCustom: string
  kmValue: string
  kmCustom: string
  lastMonths?: number | null
  lastMileage?: number | null
  hadHistory: boolean
}

const TIME_OPTIONS = [
  { value: "3", label: "3 meses" },
  { value: "6", label: "6 meses" },
  { value: "12", label: "12 meses" },
  { value: "18", label: "18 meses" },
  { value: "24", label: "24 meses" },
  { value: "custom", label: "Personalizado" },
]

const KM_OPTIONS = [
  { value: "5000", label: "5.000 km" },
  { value: "7500", label: "7.500 km" },
  { value: "10000", label: "10.000 km" },
  { value: "15000", label: "15.000 km" },
  { value: "20000", label: "20.000 km" },
  { value: "custom", label: "Personalizado" },
]

const GRADIENT_COLORS = [
  { bg: "from-blue-500/10 to-blue-600/5", icon: "text-blue-600 dark:text-blue-400", pill: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
  { bg: "from-emerald-500/10 to-emerald-600/5", icon: "text-emerald-600 dark:text-emerald-400", pill: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  { bg: "from-violet-500/10 to-violet-600/5", icon: "text-violet-600 dark:text-violet-400", pill: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
  { bg: "from-amber-500/10 to-amber-600/5", icon: "text-amber-600 dark:text-amber-400", pill: "bg-amber-500/10 text-amber-700 dark:text-amber-300" },
  { bg: "from-rose-500/10 to-rose-600/5", icon: "text-rose-600 dark:text-rose-400", pill: "bg-rose-500/10 text-rose-700 dark:text-rose-300" },
  { bg: "from-cyan-500/10 to-cyan-600/5", icon: "text-cyan-600 dark:text-cyan-400", pill: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300" },
]

export const Reminders = () => {
  const [reminders, setReminders] = useState<ReminderConfig[]>([])
  const [savedState, setSavedState] = useState<ReminderConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [savingServiceId, setSavingServiceId] = useState<number | null>(null)
  const [deletingServiceId, setDeletingServiceId] = useState<number | null>(null)
  const [deleteConfirmForServiceId, setDeleteConfirmForServiceId] = useState<number | null>(null)

  const user = useStore((s) => s.user)

  const toIntOrNull = (raw: string): number | null => {
    const n = Number(raw)
    if (!Number.isFinite(n) || n <= 0) return null
    return Math.trunc(n)
  }

  const toNumberId = (v: unknown): number | null => {
    const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN
    if (!Number.isFinite(n) || n <= 0) return null
    return Math.trunc(n)
  }

  const buildConfigFromApi = (args: {
    reminder?: ReminderApi
    serviceId: number
    serviceName: string
    hadHistory: boolean
  }): ReminderConfig => {
    const currentMonthsRaw = typeof args.reminder?.months === "number" ? args.reminder.months : null
    const currentMileageRaw = typeof args.reminder?.mileage === "number" ? args.reminder.mileage : null
    const lastMonthsRaw = typeof args.reminder?.lastMonths === "number" ? args.reminder.lastMonths : null
    const lastMileageRaw = typeof args.reminder?.lastMileage === "number" ? args.reminder.lastMileage : null

    const currentMonths = typeof currentMonthsRaw === "number" && currentMonthsRaw > 0 ? currentMonthsRaw : null
    const currentMileage = typeof currentMileageRaw === "number" && currentMileageRaw > 0 ? currentMileageRaw : null
    const lastMonths = typeof lastMonthsRaw === "number" && lastMonthsRaw > 0 ? lastMonthsRaw : null
    const lastMileage = typeof lastMileageRaw === "number" && lastMileageRaw > 0 ? lastMileageRaw : null

    const months = currentMonths ?? lastMonths
    const mileage = currentMileage ?? lastMileage

    const timePreset = months ? TIME_OPTIONS.find((o) => o.value === String(months)) : undefined
    const mileagePreset = mileage ? KM_OPTIONS.find((o) => o.value === String(mileage)) : undefined

    return {
      reminderId: typeof args.reminder?.id === "number" ? args.reminder.id : undefined,
      serviceId: args.serviceId,
      serviceName: args.serviceName,
      timeValue: months ? (timePreset ? String(months) : "custom") : "",
      timeCustom: months && !timePreset ? String(months) : "",
      kmValue: mileage ? (mileagePreset ? String(mileage) : "custom") : "",
      kmCustom: mileage && !mileagePreset ? String(mileage) : "",
      lastMonths,
      lastMileage,
      hadHistory: args.hadHistory,
    }
  }

  const applyMonthsMileageToConfig = (
    r: ReminderConfig,
    args: { months?: number | null; mileage?: number | null }
  ): ReminderConfig => {
    const months = typeof args.months === "number" && args.months > 0 ? args.months : null
    const mileage = typeof args.mileage === "number" && args.mileage > 0 ? args.mileage : null

    const timePreset = months ? TIME_OPTIONS.find((o) => o.value === String(months)) : undefined
    const mileagePreset = mileage ? KM_OPTIONS.find((o) => o.value === String(mileage)) : undefined

    return {
      ...r,
      timeValue: months ? (timePreset ? String(months) : "custom") : "",
      timeCustom: months && !timePreset ? String(months) : "",
      kmValue: mileage ? (mileagePreset ? String(mileage) : "custom") : "",
      kmCustom: mileage && !mileagePreset ? String(mileage) : "",
    }
  }

  const loadData = async () => {
    if (!user.id) {
      setLoading(false)
      setReminders([])
      setSavedState([])
      return
    }
    setLoading(true)
    try {
      const [apiReminders, history] = await Promise.all([
        getUserReminders(user.id),
        getAppointmentsHistory() as Promise<Appointment[]>,
      ])

      const serviceById = new Map<number, Service>()
      for (const appt of history || []) {
        for (const s of appt?.services || []) {
          const sid = toNumberId(s?.id)
          if (sid) serviceById.set(sid, s)
        }
      }

      const reminderByServiceId = new Map<number, ReminderApi>()
      for (const r of apiReminders || []) {
        const sid = toNumberId(r?.serviceId) ?? toNumberId(r?.service?.id)
        if (sid) reminderByServiceId.set(sid, r)
      }

      const allServiceIds = new Set<number>([...serviceById.keys(), ...reminderByServiceId.keys()])

      const next: ReminderConfig[] = Array.from(allServiceIds)
        .map((serviceId) => {
          const reminder = reminderByServiceId.get(serviceId)
          const historyService = serviceById.get(serviceId)
          const serviceName =
            (typeof reminder?.service?.name === "string" && reminder.service.name) ||
            historyService?.name ||
            `Servicio #${serviceId}`

          return buildConfigFromApi({
            reminder,
            serviceId,
            serviceName,
            hadHistory: serviceById.has(serviceId),
          })
        })
        .sort((a, b) => a.serviceName.localeCompare(b.serviceName))

      setReminders(next)
      setSavedState(next.map((r) => ({ ...r })))
    } catch (e) {
      console.error(e)
      toast.error("No se pudo cargar recordatorios")
      setReminders([])
      setSavedState([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  const updateReminder = (serviceId: number, field: keyof ReminderConfig, value: string) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.serviceId !== serviceId) return r
        const updated = { ...r, [field]: value }
        if (field === "timeValue" && value !== "custom") updated.timeCustom = ""
        if (field === "kmValue" && value !== "custom") updated.kmCustom = ""
        return updated
      })
    )
  }

  const isDirty = useMemo(() => {
    const saved = new Map(savedState.map((s) => [s.serviceId, s]))
    return (serviceId: number) => {
      const cur = reminders.find((r) => r.serviceId === serviceId)
      const orig = saved.get(serviceId)
      if (!cur || !orig) return false
      return (
        cur.timeValue !== orig.timeValue ||
        cur.timeCustom !== orig.timeCustom ||
        cur.kmValue !== orig.kmValue ||
        cur.kmCustom !== orig.kmCustom
      )
    }
  }, [reminders, savedState])

  const handleRestore = (serviceId: number) => {
    const current = reminders.find((r) => r.serviceId === serviceId)
    if (!current) return

    setReminders((prev) =>
      prev.map((r) => {
        if (r.serviceId !== serviceId) return r
        return applyMonthsMileageToConfig(r, { months: r.lastMonths, mileage: r.lastMileage })
      })
    )
    toast.info("Configuración restaurada (pendiente de guardar)")
  }

  const handleSave = async (serviceId: number) => {
    const reminder = reminders.find((r) => r.serviceId === serviceId)
    if (!reminder) return

    if (reminder.timeValue === "custom" && !reminder.timeCustom) {
      toast.error("Ingresa la cantidad de meses personalizada")
      return
    }
    if (reminder.kmValue === "custom" && !reminder.kmCustom) {
      toast.error("Ingresa la cantidad de kilometros personalizada")
      return
    }

    const months =
      reminder.timeValue === "custom" ? toIntOrNull(reminder.timeCustom) : toIntOrNull(reminder.timeValue)
    const kilometers =
      reminder.kmValue === "custom" ? toIntOrNull(reminder.kmCustom) : toIntOrNull(reminder.kmValue)

    setSavingServiceId(serviceId)
    try {
      if (typeof reminder.reminderId === "number") {
        await updateReminderApi(reminder.reminderId, {
          serviceId: reminder.serviceId,
          months,
          mileage: kilometers,
        })
      } else {
        const created = await createReminder({
          serviceId: reminder.serviceId,
          months,
          mileage: kilometers,
        })
        if (created && typeof created.id === "number") {
          setReminders((prev) =>
            prev.map((r) => (r.serviceId === serviceId ? { ...r, reminderId: created.id } : r))
          )
        }
      }

      setSavedState((prev) => prev.map((r) => (r.serviceId === serviceId ? { ...reminder } : r)))
      toast.success(`Recordatorio de "${reminder.serviceName}" guardado`)

      // In case backend enriches data / IDs, keep it consistent.
      await loadData()
    } catch (e) {
      console.error(e)
      toast.error("No se pudo guardar el recordatorio")
    } finally {
      setSavingServiceId(null)
    }
  }

  const handleDelete = async (serviceId: number) => {
    const reminder = reminders.find((r) => r.serviceId === serviceId)
    if (!reminder?.reminderId) return

    setDeletingServiceId(serviceId)
    try {
      await deleteReminder(reminder.reminderId)
      toast.success(`Recordatorio de "${reminder.serviceName}" eliminado`)
      setDeleteConfirmForServiceId(null)
      await loadData()
    } catch (e) {
      console.error(e)
      toast.error("No se pudo eliminar el recordatorio")
    } finally {
      setDeletingServiceId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="space-y-6">
            <div className="h-10 w-64 bg-muted/50 rounded-2xl animate-pulse" />
            <div className="h-5 w-96 bg-muted/30 rounded-xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 bg-card/50 rounded-3xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Container>
      <div className="p-2">
        <div className="flex flex-col gap-8">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
              <Bell className="h-6 w-6 text-foreground/70" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">Recordatorios</h1>
              <p className="text-muted-foreground">
                Configura recordatorios por servicio para que no te olvides del mantenimiento
              </p>
            </div>
          </div>

          {reminders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reminders.map((reminder, index) => {
                const color = GRADIENT_COLORS[index % GRADIENT_COLORS.length]
                const dirty = isDirty(reminder.serviceId)
                const hasReminder = typeof reminder.reminderId === "number"

                return (
                  <div
                    key={reminder.serviceId}
                    className={[
                      "group bg-card/50 backdrop-blur-sm rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden",
                      dirty ? "ring-2 ring-amber-500/40" : "",
                    ].join(" ")}
                  >
                    <div className={`px-6 pt-6 pb-4 bg-gradient-to-br ${color.bg}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="p-2.5 rounded-xl bg-background/60 backdrop-blur-sm">
                          <Wrench className={`h-4 w-4 ${color.icon}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-foreground text-pretty truncate">
                            {reminder.serviceName}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {!hasReminder && reminder.hadHistory ? (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${color.pill}`}>
                                Servicio del historial • sin recordatorio
                              </span>
                            ) : null}
                            {!hasReminder && !reminder.hadHistory ? (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${color.pill}`}>
                                Sin recordatorio
                              </span>
                            ) : null}
                            {dirty ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300">
                                Cambios sin guardar
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {hasReminder ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl hover:bg-background/60"
                            onClick={() => setDeleteConfirmForServiceId(reminder.serviceId)}
                            disabled={deletingServiceId === reminder.serviceId || savingServiceId === reminder.serviceId}
                            aria-label="Eliminar recordatorio"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <div className="px-6 py-5 space-y-5">
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">Por tiempo, cada:</span>
                        </div>
                        <div className="flex gap-2">
                          <Select
                            value={reminder.timeValue}
                            onValueChange={(v) => updateReminder(reminder.serviceId, "timeValue", v)}
                          >
                            <SelectTrigger className="rounded-xl border-0 bg-accent/50 shadow-sm h-10 flex-1">
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-0 shadow-lg">
                              {TIME_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {reminder.timeValue === "custom" && (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                placeholder="Meses"
                                value={reminder.timeCustom}
                                onChange={(e) =>
                                  updateReminder(reminder.serviceId, "timeCustom", e.target.value)
                                }
                                className="w-24 h-10 px-3 rounded-xl border-0 bg-accent/50 shadow-sm text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                              />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">meses</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">Por kilometraje, cada:</span>
                        </div>
                        <div className="flex gap-2">
                          <Select
                            value={reminder.kmValue}
                            onValueChange={(v) => updateReminder(reminder.serviceId, "kmValue", v)}
                          >
                            <SelectTrigger className="rounded-xl border-0 bg-accent/50 shadow-sm h-10 flex-1">
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-0 shadow-lg">
                              {KM_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {reminder.kmValue === "custom" && (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                step="500"
                                placeholder="Km"
                                value={reminder.kmCustom}
                                onChange={(e) =>
                                  updateReminder(reminder.serviceId, "kmCustom", e.target.value)
                                }
                                className="w-24 h-10 px-3 rounded-xl border-0 bg-accent/50 shadow-sm text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                              />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">km</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button
                          variant="ghost"
                          onClick={() => handleRestore(reminder.serviceId)}
                          className="flex-1 rounded-xl h-10 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 gap-2"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restaurar
                        </Button>
                        <Button
                          onClick={() => handleSave(reminder.serviceId)}
                          className="flex-1 rounded-xl h-10 shadow-sm hover:shadow-md transition-all duration-200 gap-2"
                          disabled={savingServiceId === reminder.serviceId || deletingServiceId === reminder.serviceId}
                        >
                          <Save className="h-3.5 w-3.5" />
                          Guardar
                        </Button>
                      </div>
                    </div>

                    <AlertDialog
                      open={deleteConfirmForServiceId === reminder.serviceId}
                      onOpenChange={(open) =>
                        setDeleteConfirmForServiceId(open ? reminder.serviceId : null)
                      }
                    >
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminar recordatorio</AlertDialogTitle>
                          <AlertDialogDescription>
                            Vas a eliminar el recordatorio de "{reminder.serviceName}". Esta accion no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={deletingServiceId === reminder.serviceId}>
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={(e) => {
                              e.preventDefault()
                              handleDelete(reminder.serviceId)
                            }}
                            disabled={deletingServiceId === reminder.serviceId}
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 mb-6">
                <Bell className="h-16 w-16 text-primary/60" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No hay recordatorios para mostrar</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Cuando tengas turnos en tu historial o crees un recordatorio, van a aparecer aca.
              </p>
            </div>
          )}
        </div>
      </div>
    </Container>
  )
}
