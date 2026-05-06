import type { Metadata } from "next";
import { TutorialsPage } from "@/components/onboarding/tutorials-page";

export const metadata: Metadata = {
  title: "Tutoriais | Sistema SOS",
  description: "Onboarding publico para administradores, tecnicos e colaboradores.",
};

export default function TutoriaisPage() {
  return <TutorialsPage />;
}
