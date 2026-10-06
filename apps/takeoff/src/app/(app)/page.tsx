import { GoalsWorkspace } from "@/components/goals/GoalsWorkspace";

// Goals route (`/`). Server Component shell; interactive tree/tasks live in
// GoalsWorkspace (Client Component) which talks to Pluto via src/lib/api.ts.
export default function GoalsPage() {
  return <GoalsWorkspace />;
}
