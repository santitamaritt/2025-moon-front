import { get } from "@/utils/rest-api";

export const getAvailableCoupons = (workshopId: number) => {
  return get(`/users/coupons/available/${workshopId}`);
};
