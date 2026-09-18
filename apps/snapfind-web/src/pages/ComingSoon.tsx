import DashboardLayout from "../layouts/DashboardLayout";

export default function ComingSoon({ title }: { title: string }) {
  return (
    <DashboardLayout title={title}>
      <div className="card flex flex-col items-center justify-center px-6 py-24 text-center">
        <span className="rounded bg-violet/15 px-2 py-1 text-[10px] font-medium text-violet-light">
          PLANNED
        </span>
        <p className="mt-4 max-w-sm text-sm text-dim">
          {title} isn't built yet — it's part of a later development
          phase. This page is a placeholder so the sidebar navigation is
          complete.
        </p>
      </div>
    </DashboardLayout>
  );
}
