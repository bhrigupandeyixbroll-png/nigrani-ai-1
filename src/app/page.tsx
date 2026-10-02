import NigraniPlatform from "@/components/nigrani-platform";
import { ensureDemoData, getDashboardData, listProjects } from "@/lib/nigrani";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureDemoData();
  const [dashboard, projects] = await Promise.all([getDashboardData(), listProjects()]);
  return <NigraniPlatform initialDashboard={dashboard} initialProjects={projects} />;
}
