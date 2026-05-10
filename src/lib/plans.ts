export const PLANS = {
  free: {
    id: "free",
    name: "Gratuit",
    description: "Parfait pour débuter et découvrir Postly sans engagement.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    color: "#5C5A75",
    features: [
      "3 comptes sociaux",
      "10 posts planifiés/mois",
      "Analytics de base",
      "Éditeur de contenu",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Pour les créateurs et professionnels qui veulent passer au niveau supérieur.",
    monthlyPrice: 29,
    yearlyPrice: 17,
    color: "#7C5CFC",
    popular: true,
    features: [
      "15 comptes sociaux",
      "Posts illimités",
      "Analytics avancés",
      "Assistant IA complet",
      "Bibliothèque de médias 50 Go",
      "Support prioritaire",
    ],
  },
  agency: {
    id: "agency",
    name: "Agence",
    description: "Pour les agences et équipes gérant plusieurs marques et clients.",
    monthlyPrice: 79,
    yearlyPrice: 47,
    color: "#22D3A0",
    features: [
      "Comptes sociaux illimités",
      "Gestion multi-clients",
      "5 membres d'équipe",
      "Rapports en marque blanche",
      "API complète",
      "Account manager dédié",
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;
export type Plan = (typeof PLANS)[PlanId];
