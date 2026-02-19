import type { CreateVehicle, UpdateVehicle, UpdateVehicleStatusDto } from "@/types/vehicles.types";
import { get, post, put, del } from "@/utils/rest-api";

export const createVehicle = (vehicle: CreateVehicle) => {
  return post(`/vehicle`, vehicle);
};

export const updateVehicle = (id: number, vehicle: UpdateVehicle) => {
  return put(`/vehicle/${id}`, vehicle);
};

export const updateVehicleStatus = (id: number, dto: UpdateVehicleStatusDto) => {
  return put(`/vehicle/${id}/status`, dto);
};

export const getVehiclesOfUser = () => {
  return get(`/vehicle/user`);
};

export const deleteVehicle = (id: number) => {
  return del(`/vehicle/${id}`);
};
