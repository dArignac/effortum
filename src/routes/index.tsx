// src/routes/index.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  //   const router = useRouter();
  //   const state = Route.useLoaderData();

  return <div>Hello</div>;
}
