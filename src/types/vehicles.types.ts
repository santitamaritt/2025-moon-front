export interface UpdateVehicle {
  licensePlate: string;
  model: string;
  year: number;
  km: number;
}

export interface CreateVehicle {
  licensePlate: string;
  model: string;
  year: number;
  km: number;
}

export type VehicleOverallStatus = "GOOD" | "MEDIUM" | "CRITICAL";

export type UpdateVehicleStatusDto = {
  status: VehicleOverallStatus;
};

export interface Vehicle {
  id: number;
  licensePlate: string;
  model: string;
  year: number;
  km: number;
  status?: VehicleOverallStatus | null;
}
