import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Container } from "@/components/Container";
import { getServicesByMechanicId } from "@/services/services";
import type { Service } from "@/types/services.types";
import { createAppointment } from "@/services/appointments";
import { formatDateToYMD } from "@/helpers/parse-date";
import type { CreateAppointment } from "@/types/appointments.types";
import type { SubCategroriesEnum, User } from "@/types/users.types";
import { toStars, getSubcategoryCounts, subLabel } from "@/helpers/reviews";
import { getAllWorkshops } from "@/services/users";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/MultiSelect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { WorkshopsMap } from "@/components/WorkshopsMap";
import { toast } from "sonner";
import {
  Calendar,
  MapPin,
  Wrench,
  Clock,
  CheckCircle,
  Car,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import { getVehiclesOfUser } from "@/services/vehicles";
import type { Vehicle } from "@/types/vehicles.types";
import { useNavigate } from "react-router-dom";
import type { MechanicRanking } from "@/types/ranking.types";
import {
  getMechanicRankingPublic,
  getTopWorkshopsRanking,
} from "@/services/ranking";
import { getAvailableCoupons } from "@/services/coupons";

export function Reserve() {
  const [workshop, setWorkshop] = useState<string>("");
  const [workshops, setWorkshops] = useState<User[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [services, setServices] = useState<Service[]>([]);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>("");
  const [showMap, setShowMap] = useState<boolean>(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [mechanicRanking, setMechanicRanking] =
    useState<MechanicRanking | null>(null);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [topRanking, setTopRanking] = useState<MechanicRanking[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [selectedCouponOption, setSelectedCouponOption] = useState<
    "none" | string
  >("none");

  const navigate = useNavigate();

  const availableHours = [
    {
      workshop: "example",
      hours: [
        "08:00",
        "08:30",
        "09:00",
        "09:30",
        "10:00",
        "10:30",
        "11:00",
        "11:30",
        "12:00",
        "12:30",
        "13:00",
        "13:30",
        "14:00",
        "14:30",
        "15:00",
        "15:30",
        "16:00",
        "16:30",
        "17:00",
      ],
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workshopsData, vehiclesData, topRankingData] = await Promise.all(
          [getAllWorkshops(), getVehiclesOfUser(), getTopWorkshopsRanking()]
        );
        setWorkshops(workshopsData);
        setVehicles(vehiclesData);
        setTopRanking(topRankingData);
      } catch {
        toast.error("Error al cargar los talleres, vehículos o ranking");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setSelectedServices([]);
    setAvailableCoupons([]);
    setSelectedCouponOption("none");

    if (!workshop) {
      setServices([]);
      setMechanicRanking(null);
      return;
    }

    getServicesByMechanicId(Number(workshop))
      .then(setServices)
      .catch(() => {
        setServices([]);
        toast.error("Error al cargar los servicios");
      });

    getMechanicRankingPublic(Number(workshop))
      .then(setMechanicRanking)
      .catch(() => {
        setMechanicRanking(null);
      });

    getAvailableCoupons(Number(workshop))
      .then((res) => {
        if (res.hasCoupons && Array.isArray(res.coupons)) {
          setAvailableCoupons(res.coupons);
          setSelectedCouponOption("none");
        } else {
          setAvailableCoupons([]);
          setSelectedCouponOption("none");
        }
      })
      .catch(() => {
        setAvailableCoupons([]);
        setSelectedCouponOption("none");
      });
  }, [workshop]);

  const appliedCoupon =
    selectedCouponOption !== "none"
      ? availableCoupons.find(
          (c) => c.id?.toString() === selectedCouponOption
        ) ?? null
      : null;

  const baseTotal = selectedServices
    .map((id) => services.find((s) => s.id.toString() === id)?.price ?? 0)
    .reduce((a, b) => a + b, 0);

  const finalTotal = appliedCoupon
    ? Math.round(
        baseTotal - (baseTotal * (appliedCoupon.discountPercentage ?? 0)) / 100
      )
    : baseTotal;

  const handleCreateAppointment = async () => {
    const appointment: CreateAppointment = {
      date: date ? formatDateToYMD(date) : "",
      time: time,
      serviceIds: selectedServices.map((s) => Number(s)),
      workshopId: Number(workshop),
      vehicleId: Number(selectedVehicle),
      couponCode:
        appliedCoupon && selectedCouponOption !== "none"
          ? String(appliedCoupon.id)
          : null,
    };
    try {
      await createAppointment(appointment);
      toast.success("Turno reservado correctamente");
      setWorkshop("");
      setSelectedServices([]);
      setDate(undefined);
      setTime("");
      setSelectedVehicle("");
      setAvailableCoupons([]);
      setSelectedCouponOption("none");
      navigate("/appointments");
    } catch {
      toast.error("No se pudo reservar el turno");
    }
  };

  const handleDisabled = () => {
    return !selectedServices.length || !date || !time || !selectedVehicle;
  };

  const handleSelectWorkshop = (id: number) => {
    setWorkshop(id.toString());
    setShowMap(false);
  };

  const getRankingForWorkshopFromTop = (mechanicId: number) => {
    const index = topRanking.findIndex((r) => r.mechanicId === mechanicId);
    if (index === -1) return null;

    const r = topRanking[index];
    const position = r.position ?? index + 1;

    return { ...r, position };
  };

  return (
    <Container>
      <div className="min-h-screen">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10">
              <Sparkles className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              Reservá tu turno
            </h1>
          </div>
          <p className="text-lg text-foreground/60 ml-14">
            Seleccioná la fecha, horario, taller y servicios para tu próximo
            turno
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="group bg-card rounded-3xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <Label className="text-lg font-semibold text-foreground">
                  Fecha y Horario
                </Label>
              </div>
              <DatePicker
                hasTimePicker={true}
                date={date}
                setDate={setDate}
                setTime={setTime}
                time={time}
                availableHours={availableHours}
              />
            </div>
            <div className="group bg-card rounded-3xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/10">
                  <Car className="h-5 w-5 text-green-600" />
                </div>
                <Label className="text-lg font-semibold text-foreground">
                  Vehículo
                </Label>
              </div>

              {vehicles.length > 0 ? (
                <Select
                  value={selectedVehicle}
                  onValueChange={setSelectedVehicle}
                >
                  <SelectTrigger
                    className="w-full rounded-xl border-gray-200 hover:border-gray-300"
                    style={{ padding: "25px" }}
                  >
                    <SelectValue placeholder="Selecciona un vehículo" />
                  </SelectTrigger>

                  <SelectContent className="rounded-xl">
                    {vehicles.map((vehicle) => (
                      <SelectItem
                        key={vehicle.id}
                        value={vehicle.id.toString()}
                        className="rounded-lg"
                      >
                        <span className="font-medium">
                          {vehicle.licensePlate}
                        </span>
                        <span className="text-gray-500">
                          {" "}
                          - {vehicle.model}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-sm text-gray-500">
                    No tienes ningún vehículo registrado.
                  </p>
                </div>
              )}
            </div>
            <div className="group bg-card rounded-3xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/10">
                  <MapPin className="h-5 w-5 text-purple-600" />
                </div>
                <Label className="text-lg font-semibold text-foreground">
                  Taller
                </Label>
              </div>

              <div className="flex gap-3 items-center">
                <Select
                  value={workshop}
                  onValueChange={(value) => setWorkshop(value)}
                >
                  <SelectTrigger
                    className="w-full rounded-xl border-gray-200 hover:border-gray-300"
                    style={{ padding: "25px" }}
                  >
                    <SelectValue placeholder="Selecciona un taller">
                      {workshop &&
                        workshops.find((w) => w.id.toString() === workshop)
                          ?.workshopName}
                    </SelectValue>
                  </SelectTrigger>

                  <SelectContent className="rounded-xl">
                    {workshops.map((workshop) => {
                      const topInfo = getRankingForWorkshopFromTop(workshop.id);

                      return (
                        <SelectItem
                          key={workshop.id}
                          value={workshop.id.toString()}
                          className="rounded-lg p-3"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">
                              {workshop.workshopName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {workshop.address}
                            </span>

                            <div className="flex items-center gap-1 text-foreground/80">
                              {(() => {
                                const { avg, filled } = toStars(
                                  workshop.reviews ?? []
                                );
                                return (
                                  <>
                                    {[0, 1, 2, 3, 4].map((i) => (
                                      <Star
                                        key={i}
                                        className={`h-3.5 w-3.5 ${
                                          i < filled
                                            ? "text-yellow-500"
                                            : "text-muted-foreground/30"
                                        }`}
                                        fill={
                                          i < filled ? "currentColor" : "none"
                                        }
                                      />
                                    ))}

                                    <span className="text-[10px] ml-1">
                                      {avg.toFixed(1)}/5
                                    </span>

                                    <span className="text-[10px] ml-1">
                                      ({workshop.reviews?.length ?? 0}{" "}
                                      opiniones)
                                    </span>
                                  </>
                                );
                              })()}
                            </div>
                            {(() => {
                              const counts = getSubcategoryCounts(
                                workshop.subCategories ?? []
                              );
                              const entries = Object.entries(counts) as [
                                SubCategroriesEnum,
                                number
                              ][];

                              if (entries.length === 0) return null;

                              return (
                                <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-2 gap-y-0.5">
                                  {entries.map(([k, v]) => (
                                    <span key={k}>
                                      {subLabel(k)}: {v}
                                    </span>
                                  ))}
                                </div>
                              );
                            })()}
                            {topInfo && topInfo.position !== null && (
                              <div className="flex items-center gap-2 mt-1 text-[10px]">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">
                                  <Trophy className="h-3 w-3" />
                                  Top #{topInfo.position}
                                </span>

                                <span className="text-muted-foreground">
                                  {topInfo.totalReviews} reseñas
                                </span>
                              </div>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Dialog open={showMap} onOpenChange={setShowMap}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-xl border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors bg-transparent"
                      onClick={() => setShowMap(true)}
                    >
                      <MapPin className="h-5 w-5 text-purple-600" />
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-4xl h-[60vh] flex flex-col rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold">
                        Ubicaciones de talleres
                      </DialogTitle>
                    </DialogHeader>

                    <div className="w-full flex-1 min-h-0 rounded-2xl overflow-hidden">
                      <WorkshopsMap
                        workshops={workshops}
                        handleSelectWorkshop={handleSelectWorkshop}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog
                  open={showRankingModal}
                  onOpenChange={setShowRankingModal}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-12 rounded-xl border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-colors flex items-center gap-2"
                      onClick={() => setShowRankingModal(true)}
                    >
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span className="text-xs font-medium">Ver ranking</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Top 10 talleres
                      </DialogTitle>
                    </DialogHeader>

                    <div className="mt-4 space-y-3">
                      {topRanking.map((r, index) => {
                        const w = workshops.find(
                          (wk) => wk.id === r.mechanicId
                        );
                        const position = r.position ?? index + 1;

                        return (
                          <div
                            key={r.mechanicId}
                            className="flex items-center justify-between p-3 rounded-2xl bg-card shadow-sm"
                          >
                            <div>
                              <p className="font-semibold flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
                                  #{position}
                                </span>
                                {w?.workshopName ?? "Taller"}
                              </p>

                              {w?.address && (
                                <p className="text-[11px] text-gray-500 mt-1">
                                  📍 {w.address}
                                </p>
                              )}

                              <p className="text-[11px] text-muted-foreground mt-1">
                                ⭐ {r.averageScore?.toFixed(1) ?? "Sin puntaje"}{" "}
                                · {r.totalReviews} reseñas
                              </p>
                            </div>

                            <Button
                              size="sm"
                              className="rounded-xl text-xs"
                              onClick={() => {
                                setWorkshop(r.mechanicId.toString());
                                setShowRankingModal(false);
                              }}
                            >
                              Elegir
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="group bg-card rounded-3xl p-8 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/10">
                  <Wrench className="h-5 w-5 text-orange-600" />
                </div>
                <Label className="text-lg font-semibold text-foreground">
                  Servicios
                </Label>
              </div>

              {!workshop ? (
                <div className="p-4 rounded-xl bg-card border border-gray-100">
                  <p className="text-sm text-gray-500">
                    Seleccione un taller primero.
                  </p>
                </div>
              ) : services.length > 0 ? (
                <MultiSelect
                  options={services.map((service) => ({
                    value: service.id.toString(),
                    label: `${service.name} - $${service.price ?? "Consultar"}`,
                  }))}
                  selected={selectedServices}
                  setSelected={setSelectedServices}
                  placeholder="Selecciona servicios"
                />
              ) : (
                <div className="p-4 rounded-xl bg-card border border-gray-100">
                  <p className="text-sm text-gray-500">
                    Este taller no tiene servicios disponibles por el momento.
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="bg-card rounded-3xl p-8 shadow-sm text-foreground">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-card shadow-sm">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Resumen del turno
                </h3>
              </div>
              {!workshop && !selectedServices.length && !date && !time ? (
                <div className="text-center py-12 text-foreground">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-card shadow-sm flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-foreground/40" />
                  </div>
                  <p className="text-sm text-foreground">
                    Selecciona una fecha, horario, taller y servicios para ver
                    el resumen.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 text-foreground">
                  {date && (
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-card shadow-sm">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>

                      <div className="flex-1">
                        <p className="text-xs font-medium mb-1">Fecha</p>
                        <p className="text-sm font-semibold">
                          {date.toLocaleDateString("es-AR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  {time && (
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-card shadow-sm">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/10">
                        <Clock className="h-4 w-4 text-green-600" />
                      </div>

                      <div className="flex-1">
                        <p className="text-xs font-medium mb-1">Horario</p>
                        <p className="text-sm font-semibold">{time}</p>
                      </div>
                    </div>
                  )}
                  {selectedVehicle && (
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-card shadow-sm">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/10">
                        <Car className="h-4 w-4 text-purple-600" />
                      </div>

                      <div className="flex-1">
                        <p className="text-xs font-medium mb-1">Vehículo</p>

                        <p className="text-sm font-semibold">
                          {
                            vehicles.find(
                              (v) => v.id.toString() === selectedVehicle
                            )?.licensePlate
                          }
                        </p>
                        <p className="text-xs">
                          {
                            vehicles.find(
                              (v) => v.id.toString() === selectedVehicle
                            )?.model
                          }
                        </p>
                      </div>
                    </div>
                  )}
                  {workshop && (
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-card shadow-sm">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/10">
                        <MapPin className="h-4 w-4 text-orange-600" />
                      </div>

                      <div className="flex-1">
                        <p className="text-xs font-medium mb-1">Taller</p>

                        <p className="text-sm font-semibold">
                          {
                            workshops.find((w) => w.id.toString() === workshop)
                              ?.workshopName
                          }
                        </p>

                        <p className="text-xs">
                          {
                            workshops.find((w) => w.id.toString() === workshop)
                              ?.address
                          }
                        </p>
                        {mechanicRanking && (
                          <div className="mt-3 text-xs text-foreground/80">
                            <p>
                              ⭐{" "}
                              {mechanicRanking.averageScore !== null
                                ? `${mechanicRanking.averageScore.toFixed(1)}/5`
                                : "Sin puntaje"}{" "}
                              · {mechanicRanking.totalReviews} reseñas
                            </p>

                            {mechanicRanking.position !== null && (
                              <p className="mt-1">
                                🏆 Puesto {mechanicRanking.position} de{" "}
                                {mechanicRanking.totalMechanics} talleres
                              </p>
                            )}

                            {mechanicRanking.advice && (
                              <p className="mt-1 text-[10px] text-foreground/60">
                                {mechanicRanking.advice}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedServices.length > 0 && (
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-card shadow-sm">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500/10 to-pink-600/10">
                        <Wrench className="h-4 w-4 text-pink-600" />
                      </div>

                      <div className="flex-1">
                        <p className="text-xs font-medium mb-1">Servicios</p>

                        <div className="space-y-1">
                          {selectedServices.map((id) => {
                            const service = services.find(
                              (s) => s.id.toString() === id
                            );

                            return (
                              <p key={id} className="text-sm font-semibold">
                                {service?.name}
                                {service?.price && (
                                  <span className="font-normal">
                                    {" "}
                                    - ${service.price}
                                  </span>
                                )}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                  {workshop && (
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-card shadow-sm">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-600/10">
                        <Sparkles className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium mb-1">
                          Cupón de descuento
                        </p>
                        {availableCoupons.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No hay cupones disponibles para este taller.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            <Select
                              value={selectedCouponOption}
                              onValueChange={setSelectedCouponOption}
                            >
                              <SelectTrigger className="w-full rounded-xl border-gray-200 hover:border-gray-300">
                                <SelectValue placeholder="Seleccioná una opción" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="none" className="rounded-lg">
                                  No usar cupón
                                </SelectItem>
                                {availableCoupons.map((coupon) => (
                                  <SelectItem
                                    key={coupon.id}
                                    value={coupon.id.toString()}
                                    className="rounded-lg"
                                  >
                                    Cupón {coupon.discountPercentage}% OFF ·
                                    vence{" "}
                                    {new Date(
                                      coupon.expiresAt
                                    ).toLocaleDateString("es-AR")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {baseTotal > 0 && (
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-card shadow-sm">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-600/10">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium mb-1">Precio total</p>
                        {appliedCoupon ? (
                          <>
                            <p className="text-xs text-muted-foreground line-through">
                              ${baseTotal}
                            </p>
                            <p className="text-lg font-semibold text-green-600">
                              ${finalTotal}
                            </p>
                          </>
                        ) : (
                          <p className="text-lg font-semibold">${baseTotal}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <Button
                className="w-full mt-8 h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                disabled={handleDisabled()}
                onClick={handleCreateAppointment}
              >
                Confirmar reserva
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
