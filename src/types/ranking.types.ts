export interface MechanicRanking {
  mechanicId: number;
  position: number | null;
  totalMechanics: number;
  averageScore: number | null;
  totalReviews: number;
  advice: string;
}

export interface MechanicRankingGoals {
  mechanicId: number;
  ranking: {
    position: number;
    totalMechanics: number;
    averageScore: number;
    totalReviews: number;
  } | null;
  nextGoals: {
    climb: {
      targetMechanicId: number;
      extraPositiveReviewsNeeded: number | null;
      description: string;
    } | null;
  } | null;
}
