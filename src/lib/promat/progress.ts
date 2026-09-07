import type { TenderState } from "./store";

export type StepKey =
  | "analyse"
  | "articles"
  | "consultation"
  | "comparatif"
  | "chiffrage"
  | "offre";

export type WorkflowStepKey = "recherche" | StepKey;

export const workflowSteps: {
  key: WorkflowStepKey;
  number: number;
  label: string;
  to: string;
  root: string;
}[] = [
  { key: "recherche", number: 1, label: "Recherches AO", to: "/", root: "/" },
  { key: "analyse", number: 2, label: "Analyses", to: "/analyses/$id", root: "/analyses" },
  { key: "articles", number: 3, label: "Articles & besoins", to: "/articles/$id", root: "/articles" },
  { key: "consultation", number: 4, label: "Consultations fournisseurs", to: "/consultations/$id", root: "/consultations" },
  { key: "comparatif", number: 5, label: "Comparatifs fournisseurs", to: "/comparatifs/$id", root: "/comparatifs" },
  { key: "chiffrage", number: 6, label: "Chiffrages", to: "/chiffrages/$id", root: "/chiffrages" },
  { key: "offre", number: 7, label: "Offres finales", to: "/offres/$id", root: "/offres" },
];

export function workflowDone(state: TenderState, key: WorkflowStepKey) {
  switch (key) {
    case "recherche":
      return true;
    case "analyse":
      return state.analysisValidated && state.decision === "go";
    case "articles":
      return state.articlesValidated;
    case "consultation":
      return state.consultationCreated && state.offersReceived;
    case "comparatif":
      return Boolean(state.retainedSupplier);
    case "chiffrage":
      return state.costValidated && state.marginValidated;
    case "offre":
      return state.offerValidated;
  }
}