import { get } from "@/utils/rest-api";

export const getMyRanking = () => {
  return get("/users/ranking/me");
};

export const getRankingGoals = () => {
  return get("/users/ranking/goals");
};

export const getMechanicRankingPublic = (mechanicId: number) => {
  return get(`/users/ranking/mechanic/${mechanicId}`);
};

export const getTopWorkshopsRanking = () => {
  return get("/users/ranking");
};
