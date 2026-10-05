import { TodayWorkspace } from "@/components/today/TodayWorkspace";

// Today route (`/today`). Interactive plan + calendar live in TodayWorkspace.
export default function TodayPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <TodayWorkspace />
    </div>
  );
}
