import { Button } from '@/components/ui/button'
import {
  Calendar,
  Car,
  Package,
  Settings,
  UserIcon,
  Clock,
  ArrowUpFromLine as ChartNoAxesCombined,
  Star,
  Goal,
  Blocks,
  Bell,
  FileText,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { getNextAppointmentsOfUser } from '@/services/appointments'
import { getVehiclesOfUser } from '@/services/vehicles'
import type { Appointment } from '@/types/appointments.types'
import { useStore } from '@/zustand/store'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export function Home() {
  const user = useStore((state) => state.user)
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    vehicles: 0,
  })

  useEffect(() => {
    if (user.userRole !== 'USER') return

    const fetchStats = async () => {
      try {
        const [appointmentsRaw, vehiclesRaw] = await Promise.all([
          getNextAppointmentsOfUser(),
          getVehiclesOfUser(),
        ])

        const appointments = (appointmentsRaw ?? []) as Appointment[]
        const vehicles = (vehiclesRaw ?? []) as unknown[]

        setStats({
          upcomingAppointments: Array.isArray(appointments)
            ? appointments.length
            : 0,
          vehicles: Array.isArray(vehicles) ? vehicles.length : 0,
        })
      } catch {
        toast.error('Error al obtener las estadísticas')
      }
    }

    fetchStats()
  }, [user.userRole])

  const userQuickActions = [
    {
      title: 'Reservar Turno',
      description: 'Agenda un nuevo turno para tu vehículo',
      icon: Calendar,
      href: '/reserve',
      gradient: 'from-blue-50 to-blue-100/50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Mis Vehículos',
      description: 'Gestiona tus vehículos registrados',
      icon: Car,
      href: '/vehicles',
      gradient: 'from-emerald-50 to-emerald-100/50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Mis Turnos',
      description: 'Revisa tus turnos reservados',
      icon: Clock,
      href: '/appointments',
      gradient: 'from-violet-50 to-violet-100/50',
      iconColor: 'text-violet-600',
    },
    {
      title: 'Dashboards',
      description: 'Revisa estadísticas de tus vehículos y turnos',
      icon: ChartNoAxesCombined,
      href: '/user-dashboard',
      gradient: 'from-amber-50 to-amber-100/50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Evaluar mecánico',
      description: 'Evalúa a los mecánicos que has utilizado',
      icon: Star,
      href: '/review-mechanic',
      gradient: 'from-pink-50 to-pink-100/50',
      iconColor: 'text-pink-600',
    },
    {
      title: 'Recordatorios',
      description: 'Gestiona tus recordatorios',
      icon: Bell,
      href: '/reminders',
      gradient: 'from-purple-50 to-purple-100/50',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Ficha técnica',
      description: 'Revisa la ficha técnica de tus vehículos',
      icon: FileText,
      href: '/technical-sheet',
      gradient: 'from-green-50 to-green-100/50',
      iconColor: 'text-green-600',
    },
  ]

  const mechanicQuickActions = [
    {
      title: 'Mis Turnos',
      description: 'Gestiona tus turnos asignados',
      icon: Calendar,
      href: '/shifts',
      gradient: 'from-blue-50 to-blue-100/50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Repuestos',
      description: 'Administra el inventario de repuestos',
      icon: Package,
      href: '/spare-parts',
      gradient: 'from-orange-50 to-orange-100/50',
      iconColor: 'text-orange-600',
    },
    {
      title: 'Servicios',
      description: 'Gestiona los servicios disponibles',
      icon: Settings,
      href: '/services',
      gradient: 'from-emerald-50 to-emerald-100/50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Dashboard',
      description: 'Revisa estadísticas de tus vehículos y turnos',
      icon: ChartNoAxesCombined,
      href: '/mechanic-dashboard',
      gradient: 'from-amber-50 to-amber-100/50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Mis Metas',
      description: 'Revisa tus metas o agrega nuevas',
      icon: Goal,
      href: '/goals',
      gradient: 'from-violet-50 to-purple-100/50',
      iconColor: 'text-violet-600',
    },
  ]

  const quickActions =
    user.userRole === 'MECHANIC' ? mechanicQuickActions : userQuickActions

  return (
    <div className='min-h-screen bg-background p-6 md:p-12'>
      <div className='max-w-7xl mx-auto space-y-12'>
        <div className='space-y-3'>
          <h1 className='text-5xl md:text-6xl font-bold tracking-tight text-foreground'>
            Hola, <span className='text-foreground/90'>{user.fullName}</span>
          </h1>
          <p className='text-muted-foreground text-xl font-light'>
            {user.userRole === 'MECHANIC'
              ? 'Bienvenido a tu panel de mecánico'
              : 'Bienvenido a tu panel de gestión de vehículos'}
          </p>
        </div>

        {user.userRole === 'USER' && (
          <div className='grid gap-6 md:grid-cols-2'>
            <div className='bg-card rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300'>
              <div className='flex items-start justify-between'>
                <div className='space-y-3'>
                  <p className='text-sm font-medium text-muted-foreground uppercase tracking-wider'>
                    Turnos Próximos
                  </p>
                  <p className='text-5xl font-bold text-foreground'>
                    {stats.upcomingAppointments}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Turnos agendados
                  </p>
                </div>
                <div className='bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-2xl'>
                  <Calendar className='h-7 w-7 text-blue-600' />
                </div>
              </div>
            </div>

            <div className='bg-card rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300'>
              <div className='flex items-start justify-between'>
                <div className='space-y-3'>
                  <p className='text-sm font-medium text-muted-foreground uppercase tracking-wider'>
                    Mis Vehículos
                  </p>
                  <p className='text-5xl font-bold text-foreground'>
                    {stats.vehicles}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Vehículos registrados
                  </p>
                </div>
                <div className='bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 rounded-2xl'>
                  <Car className='h-7 w-7 text-emerald-600' />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className='space-y-6'>
          <h2 className='text-3xl font-semibold text-foreground'>
            Accesos Rápidos
          </h2>
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.href}
                  onClick={() => navigate(action.href)}
                  className='group bg-card rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 text-left hover:-translate-y-1 cursor-pointer'
                >
                  <div className='space-y-4'>
                    <div
                      className={`bg-gradient-to-br ${action.gradient} p-4 rounded-2xl w-fit`}
                    >
                      <Icon className={`h-6 w-6 ${action.iconColor}`} />
                    </div>
                    <div className='space-y-2'>
                      <h3 className='text-lg font-semibold text-foreground group-hover:text-foreground/90 transition-colors'>
                        {action.title}
                      </h3>
                      <p className='text-sm text-muted-foreground leading-relaxed'>
                        {action.description}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
            <a
              href={'spendee://sign-in?isOAuthFlow=true'}
              className='group bg-card rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 text-left hover:-translate-y-1 cursor-pointer'
            >
              <div className='space-y-4'>
                <div
                  className={`bg-gradient-to-br from-orange-50 to-orange-100/50 p-4 rounded-2xl w-fit`}
                >
                  <Blocks className={`h-6 w-6 text-orange-600`} />
                </div>
                <div className='space-y-2'>
                  <h3 className='text-lg font-semibold text-foreground group-hover:text-foreground/90 transition-colors'>
                    Iniciar sesión con spendee
                  </h3>
                  <p className='text-sm text-muted-foreground leading-relaxed'>
                    Llevá un registro de tus ingresos y egresos
                  </p>
                </div>
              </div>
            </a>
          </div>
        </div>

        <div className='bg-card rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6'>
            <div className='flex items-center gap-5'>
              <div className='bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-2xl'>
                <UserIcon className='h-7 w-7 text-slate-600' />
              </div>
              <div className='space-y-1'>
                <h3 className='text-xl font-semibold text-foreground'>
                  Mi Perfil
                </h3>
                <p className='text-sm text-muted-foreground'>
                  Gestiona tu información personal y configuración
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/profile')}
              className='rounded-full px-6 py-5 bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-sm'
            >
              Ver Perfil
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
