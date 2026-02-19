import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getVehiclesOfUser, updateVehicle } from "@/services/vehicles";
import type { Vehicle } from "@/types/vehicles.types";
import { ArrowLeft, Car, Gauge } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UpdateVehicleKmsModal({ open, onOpenChange }: Props) {
  const [step, setStep] = useState<"select" | "edit">("select");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [kmInput, setKmInput] = useState<number>(0);

  const selectedVehicleLabel = useMemo(() => {
    if (!selectedVehicle) return "";
    return `${selectedVehicle.model} • ${selectedVehicle.licensePlate}`;
  }, [selectedVehicle]);

  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      const data = await getVehiclesOfUser();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar tus vehículos");
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setStep("select");
      setSelectedVehicle(null);
      setKmInput(0);
      return;
    }
    fetchVehicles();
  }, [open]);

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setKmInput(vehicle.km);
    setStep("edit");
  };

  const handleSave = async () => {
    if (!selectedVehicle) return;
    if (!Number.isFinite(kmInput) || kmInput < 0) {
      toast.error("Ingresá un kilometraje válido");
      return;
    }

    setIsSaving(true);
    try {
      await updateVehicle(selectedVehicle.id, {
        licensePlate: selectedVehicle.licensePlate,
        model: selectedVehicle.model,
        year: selectedVehicle.year,
        km: kmInput,
      });
      toast.success("Kilometraje actualizado correctamente");
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Error al actualizar el kilometraje");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] text-foreground">
        <DialogHeader>
          <DialogTitle>Actualiza tus kms</DialogTitle>
          <DialogDescription>
            {step === "select"
              ? "Seleccioná el vehículo al que querés actualizarle el kilometraje."
              : `Actualizando: ${selectedVehicleLabel}`}
          </DialogDescription>
        </DialogHeader>

        {step === "select" ? (
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
              </div>
            ) : vehicles.length === 0 ? (
              <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                No tenés vehículos registrados.
              </div>
            ) : (
              <div className="flex flex-row flex-wrap justify-start items-center gap-3">
                {vehicles.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelectVehicle(v)}
                    className="text-left rounded-2xl border bg-card p-4 hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                        <Car className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground truncate">
                          {v.model}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {v.licensePlate} • {v.year}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <Gauge className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">
                            {v.km.toLocaleString()} km
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : selectedVehicle ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="ghost"
                className="px-2"
                onClick={() => {
                  setStep("select");
                  setSelectedVehicle(null);
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Elegir otro vehículo
              </Button>
            </div>

            <div className="rounded-2xl border bg-card p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Modelo</div>
                  <div className="font-medium text-foreground">
                    {selectedVehicle.model}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Patente</div>
                  <div className="font-medium text-foreground">
                    {selectedVehicle.licensePlate}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Año</div>
                  <div className="font-medium text-foreground">
                    {selectedVehicle.year}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle-km">Kilometraje</Label>
                <Input
                  id="vehicle-km"
                  type="number"
                  min={0}
                  value={kmInput}
                  onChange={(e) => setKmInput(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Actual: {selectedVehicle.km.toLocaleString()} km
                </p>
              </div>
              <div className="flex items-end justify-end">
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  {isSaving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

