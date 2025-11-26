import { useState } from "react";
import { useQuery } from "react-query";
import { Calendar, Car, Wrench, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { sortAppointments } from "@/helpers/sort-appointments";
import {
  AppointmentStatus,
  type Appointment,
} from "@/types/appointments.types";
import {
  changeAppointmentStatus,
  getNextAppointmentsOfUser,
} from "@/services/appointments";
import { AppointmentStatusBadge } from "@/components/AppointmentStatusBadge";
import { isCancelable } from "@/helpers/appointment-status";
import { Container } from "@/components/Container";

export function AppointmentsReserved() {
  const { data: appointments, refetch } = useQuery(
    "appointments",
    () => getNextAppointmentsOfUser(),
    {
      initialData: [],
    }
  );

  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Container>
      <div className="max-w-4xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Mis Turnos
          </h1>
          <p className="text-muted-foreground">
            Gestiona tus turnos reservados
          </p>
        </div>

        <div className="space-y-3">
          {appointments.length > 0 ? (
            sortAppointments(appointments).map((app) => {
              const isExpanded = expandedId === app.id;
              return (
                <div
                  key={app.id}
                  className="bg-card rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                >
                  <button
                    onClick={() => toggleExpand(app.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-foreground">
                            {app.date}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {app.time}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {(app as Appointment).vehicle?.licensePlate} •{" "}
                          {(app as Appointment).workshop.workshopName}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <AppointmentStatusBadge
                        value={(app as Appointment).status}
                      />
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="h-px bg-border" />

                      {(() => {
                        const a = app as Appointment;
                        return (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center flex-shrink-0">
                                  <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Vehículo
                                  </p>
                                  <p className="font-medium text-foreground">
                                    {a.vehicle?.licensePlate}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center flex-shrink-0">
                                  <Wrench className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Taller
                                  </p>
                                  <p className="font-medium text-foreground">
                                    {a.workshop.workshopName}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground mb-2">
                                Servicios
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {a.services?.length > 0 ? (
                                  a.services.map((service, index) => (
                                    <Badge
                                      key={index}
                                      variant="warning"
                                      className="rounded-full px-3 py-1"
                                    >
                                      {service.name}
                                    </Badge>
                                  ))
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="rounded-full"
                                  >
                                    Sin servicios
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center flex-shrink-0">
                                  <span className="text-green-600 dark:text-green-400 font-bold text-sm">
                                    $
                                  </span>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Precio original
                                  </p>
                                  <p className="font-medium text-foreground">
                                    ${a.originalPrice}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center flex-shrink-0">
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                                    $
                                  </span>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Precio final
                                  </p>

                                  {a.finalPrice !== null &&
                                  a.finalPrice !== a.originalPrice ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm line-through text-muted-foreground">
                                        ${a.originalPrice}
                                      </span>
                                      <span className="font-semibold text-foreground">
                                        ${a.finalPrice}
                                      </span>
                                    </div>
                                  ) : (
                                    <p className="font-medium text-foreground">
                                      ${a.originalPrice}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {isCancelable(a.status) && (
                              <Button
                                variant="destructive"
                                className="w-full rounded-2xl"
                                onClick={async () => {
                                  await changeAppointmentStatus(
                                    a.id,
                                    AppointmentStatus.CANCELLED
                                  );
                                  await refetch();
                                }}
                              >
                                Cancelar turno
                              </Button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
                <Calendar className="h-10 w-10 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">
                No hay turnos agendados
              </p>
              <p className="text-sm text-muted-foreground">
                Tus próximos turnos aparecerán aquí
              </p>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
