import { createFileRoute } from "@tanstack/react-router";
import SoilGame from "@/game/SoilGame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Princesa Rai — Guardiã dos Solos" },
      {
        name: "description",
        content:
          "Plataforma educativa estilo Mario: ajude a Princesa Rai a salvar o planeta Terra respondendo perguntas sobre solos.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <SoilGame />;
}
