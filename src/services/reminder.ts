import { del, get, post, put } from "@/utils/rest-api";

const BASE_PATH = "/reminders";

export type ReminderServiceRef = {
  id: number;
  name: string;
  price?: number;
  status?: string;
};

export type ReminderDto = {
  serviceId: number;
  months?: number | null;
  mileage?: number | null; // km
};

export type ReminderApi = {
  id: number;
  serviceId?: number;
  months?: number | null;
  mileage?: number | null;
  lastMonths?: number | null;
  lastMileage?: number | null;
  service?: ReminderServiceRef;
};

export const getUserReminders = (userId: number) => {
  return get<ReminderApi[]>(`${BASE_PATH}/user/${userId}`);
};

export const createReminder = (dto: ReminderDto) => {
  return post<ReminderApi>(`${BASE_PATH}`, dto);
};

export const updateReminder = (id: number, dto: Partial<ReminderDto>) => {
  return put<ReminderApi>(`${BASE_PATH}/${id}`, dto);
};

export const deleteReminder = (id: number) => {
  return del<void>(`${BASE_PATH}/${id}`);
};

