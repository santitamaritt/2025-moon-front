import { useEffect, useState } from "react";
import { Container } from "@/components/Container";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, Target, Wrench, Clock, Star, Trophy } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import type { Service } from "@/types/services.types";
import { getServices } from "@/services/services";
import { createGoal, getGoals } from "@/services/goal";
import { type GoalDto, GoalType } from "@/types/goal.types";

import { getMyRanking, getRankingGoals } from "@/services/ranking";
import type {
  MechanicRanking,
  MechanicRankingGoals,
} from "@/types/ranking.types";

export function MechanicGoals() {
  const [goals, setGoals] = useState<GoalDto[]>([]);
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);

  const [ranking, setRanking] = useState<MechanicRanking | null>(null);
  const [rankingGoals, setRankingGoals] = useState<MechanicRankingGoals | null>(
    null
  );

  const today = new Date();
  const oneWeekLater = new Date();
  oneWeekLater.setDate(today.getDate() + 7);

  const [newGoal, setNewGoal] = useState({
    type: "",
    service: "",
    name: "",
    target: 0,
    startDate: format(today, "yyyy-MM-dd"),
    endDate: format(oneWeekLater, "yyyy-MM-dd"),
  });

  const fetchGoals = async () => {
    const result = await getGoals();
    setGoals(result);
  };

  const fetchRanking = async () => {
    try {
      const myRank = await getMyRanking();
      const rankGoals = await getRankingGoals();
      setRanking(myRank);
      setRankingGoals(rankGoals);
    } catch (error) {
      console.error("Error fetching ranking data:", error);
    }
  };

  useEffect(() => {
    fetchGoals();
    fetchRanking();
  }, []);

  useEffect(() => {
    const fetchServicesList = async () => {
      try {
        const data = await getServices({
          orderBy: "name",
          orderDir: "asc",
          page: 1,
          pageSize: 999,
          search: "",
        });
        setServices(data.data);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };
    fetchServicesList();
  }, []);

  const handleAddGoal = async () => {
    if (!newGoal.type || !newGoal.name || newGoal.target <= 0) {
      toast.error("Completá todos los campos antes de guardar la meta.");
      return;
    }

    await createGoal({
      label: newGoal.name,
      quantity: newGoal.target,
      serviceId: Number(newGoal.service),
      type:
        newGoal.type === "service" ? GoalType.SERVICE : GoalType.APPOINTMENTS,
      startDate: newGoal.startDate,
      endDate: newGoal.endDate,
    });

    await fetchGoals();
    toast.success("Meta agregada correctamente");
    setOpen(false);
  };

  return (
    <Container>
      <div className="flex flex-col gap-10">
        {ranking && (
          <div className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-yellow-500/10 rounded-2xl">
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold">Tu Ranking en Estaller</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4">
              <div className="p-4 rounded-2xl bg-accent/10 text-center border border-border/40">
                <p className="text-sm text-muted-foreground">Posición</p>
                <p className="text-3xl font-bold">
                  {ranking.position ?? "—"}
                  <span className="text-base text-muted-foreground">
                    /{ranking.totalMechanics}
                  </span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-accent/10 text-center border border-border/40">
                <p className="text-sm text-muted-foreground">
                  Puntaje Promedio
                </p>
                <p className="text-3xl font-bold">
                  {ranking.averageScore ? ranking.averageScore.toFixed(1) : "—"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-accent/10 text-center border border-border/40">
                <p className="text-sm text-muted-foreground">
                  Total de Reseñas
                </p>
                <p className="text-3xl font-bold">{ranking.totalReviews}</p>
              </div>
            </div>

            {ranking.advice && (
              <p className="mt-4 text-muted-foreground text-sm">
                {ranking.advice}
              </p>
            )}

            {rankingGoals?.nextGoals?.climb?.description && (
              <div className="mt-5 p-4 rounded-2xl bg-muted/30 border border-border/40">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <strong>Cómo subir de posición</strong>
                </div>
                <p className="text-sm text-muted-foreground">
                  {rankingGoals.nextGoals.climb.description}
                </p>
              </div>
            )}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Metas</h1>
            <p className="text-muted-foreground">
              Establecé y seguí el progreso de tus objetivos de servicios y
              turnos
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Agregar meta
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px] rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">
                  Nueva meta
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-6 mt-4">
                <div>
                  <Label className="mb-2 block">Nombre de la meta</Label>
                  <input
                    type="text"
                    className="w-full p-2 rounded-xl border border-border bg-background"
                    value={newGoal.name}
                    onChange={(e) =>
                      setNewGoal((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Ej. Turnos del mes"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Tipo de meta</Label>
                  <Select
                    value={newGoal.type}
                    onValueChange={(value) =>
                      setNewGoal((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Seleccioná el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">Servicio</SelectItem>
                      <SelectItem value="appointment">Turnos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newGoal.type === "service" && (
                  <div>
                    <Label className="mb-2 block">Servicio</Label>
                    <Select
                      value={newGoal.service}
                      onValueChange={(value) =>
                        setNewGoal((prev) => ({
                          ...prev,
                          service: value,
                        }))
                      }
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Seleccioná un servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {services?.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label className="mb-2 block">Cantidad objetivo</Label>
                  <input
                    type="number"
                    className="w-full p-2 rounded-xl border border-border bg-background"
                    value={newGoal.target}
                    onChange={(e) =>
                      setNewGoal((prev) => ({
                        ...prev,
                        target: parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="Ej. 10"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block">Fecha inicio</Label>
                    <DatePicker
                      date={new Date(newGoal.startDate)}
                      setDate={(d) =>
                        setNewGoal((prev) => ({
                          ...prev,
                          startDate: d
                            ? format(d, "yyyy-MM-dd")
                            : prev.startDate,
                        }))
                      }
                      hasTimePicker={false}
                      availableHours={[]}
                      setTime={() => {}}
                      time=""
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">Fecha fin</Label>
                    <DatePicker
                      date={new Date(newGoal.endDate)}
                      setDate={(d) =>
                        setNewGoal((prev) => ({
                          ...prev,
                          endDate: d ? format(d, "yyyy-MM-dd") : prev.endDate,
                        }))
                      }
                      hasTimePicker={false}
                      availableHours={[]}
                      setTime={() => {}}
                      time=""
                    />
                  </div>
                </div>

                <Button onClick={handleAddGoal} className="rounded-2xl mt-2">
                  Guardar meta
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const progress = Math.min((goal.actual / goal.quantity) * 100, 100);
            const icon =
              goal.type === GoalType.SERVICE ? (
                <Wrench className="h-5 w-5 text-blue-500" />
              ) : (
                <Clock className="h-5 w-5 text-purple-500" />
              );

            return (
              <div
                key={goal.id}
                className="bg-card rounded-3xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-accent/10">{icon}</div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {goal.label}
                    </h3>
                    <p className="text-xs text-muted-foreground capitalize">
                      {goal.type === GoalType.SERVICE ? "Servicio" : "Turnos"} —{" "}
                      {goal.startDate} a {goal.endDate}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Progreso: {goal.actual}/{goal.quantity}
                    </span>
                    <span className="font-medium text-foreground">
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-3 rounded-full" />
                </div>
              </div>
            );
          })}
        </div>
        {goals.length === 0 && (
          <div className="text-center text-muted-foreground mt-20">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-60" />
            <p>No hay metas creadas todavía.</p>
            <p className="text-sm">
              Agregá una meta para comenzar a trackear tu progreso.
            </p>
          </div>
        )}
      </div>
    </Container>
  );
}
