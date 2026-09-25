import { useEffect, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { adminApi, ApiError } from "../../services/api";
import type { AdminSummary, User } from "@snapfind/types";

export default function AdminApprovals() {
  const { user: currentUser, isAdmin, isSuperAdmin } = useAuth();
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reject modal state
  const [rejectingUser, setRejectingUser] = useState<User | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sum, userList] = await Promise.all([
        adminApi.getSummary(),
        adminApi.listUsers({
          status: statusFilter,
          search: search.trim() || undefined,
        }),
      ]);
      setSummary(sum);
      setUsers(userList.items || []);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail || err.message);
      } else {
        setError("Failed to load user access requests.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleApprove = async (u: User) => {
    setActionLoadingId(u.id);
    setError(null);
    try {
      await adminApi.approveUser(u.id);
      setSuccessMessage(`Approved ${u.studio_name || u.email} successfully.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve user.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingUser) return;
    setActionLoadingId(rejectingUser.id);
    setError(null);
    try {
      await adminApi.rejectUser(rejectingUser.id, rejectionReason.trim() || undefined);
      setSuccessMessage(`Rejected ${rejectingUser.studio_name || rejectingUser.email}.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setRejectingUser(null);
      setRejectionReason("");
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject user.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSuspend = async (u: User) => {
    if (!confirm(`Are you sure you want to suspend access for ${u.studio_name || u.email}?`)) {
      return;
    }
    setActionLoadingId(u.id);
    setError(null);
    try {
      await adminApi.suspendUser(u.id);
      setSuccessMessage(`Suspended ${u.studio_name || u.email}.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to suspend user.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRoleChange = async (u: User, newRole: string) => {
    if (!confirm(`Change role of ${u.studio_name || u.email} to ${newRole}?`)) {
      return;
    }
    setActionLoadingId(u.id);
    try {
      await adminApi.updateUserRole(u.id, newRole);
      setSuccessMessage(`Updated role to ${newRole}.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change role.");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <DashboardLayout title="Access Denied">
        <div className="mx-auto max-w-lg rounded-2xl border border-hairline bg-panel p-8 text-center mt-12">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl text-red-400">
            🛡️
          </div>
          <h2 className="text-lg font-bold text-cloud">Administrator Privileges Required</h2>
          <p className="mt-2 text-xs text-dim">
            You need Super Admin or Admin access rights to review and approve registrations.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const pendingCount = summary?.pending_approvals ?? 0;

  return (
    <DashboardLayout title="User Approvals & Access Control">
      <div className="space-y-6">
        {/* Header Description */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold tracking-tight text-charcoal flex items-center gap-3">
              <span>Admin Approvals & Access</span>
              {pendingCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-500/30">
                  {pendingCount} Pending Review
                </span>
              )}
            </h1>
            <p className="text-xs text-warm-gray mt-1">
              Review new photographer sign-ups, grant access, and manage user roles across SnapFind Studio.
            </p>
          </div>

          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="self-start inline-flex items-center gap-1.5 rounded-xl border border-warm-beige bg-white px-3.5 py-2 text-xs font-semibold text-charcoal hover:border-forest/40 transition-colors disabled:opacity-50 shadow-sm"
          >
            <svg className={`h-3.5 w-3.5 text-forest ${loading ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 2v6h-6" />
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>

        {/* Feedback banners */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-600 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-xs underline hover:text-red-800">
              Dismiss
            </button>
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-forest/30 bg-forest/10 px-4 py-3 text-xs text-forest font-semibold">
            {successMessage}
          </div>
        )}

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-warm-beige bg-white p-4 shadow-sm">
            <div className="text-[11px] font-semibold text-warm-gray uppercase tracking-wider">Total Users</div>
            <div className="mt-1.5 text-2xl font-serif font-bold text-charcoal">
              {summary?.total_users ?? 0}
            </div>
            <div className="text-[10px] text-warm-gray mt-0.5">Across all roles</div>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-50/50 p-4 shadow-sm">
            <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Pending Review</div>
            <div className="mt-1.5 text-2xl font-serif font-bold text-amber-700">
              {summary?.pending_approvals ?? 0}
            </div>
            <div className="text-[10px] text-amber-600/80 mt-0.5">Awaiting decision</div>
          </div>

          <div className="rounded-xl border border-forest/20 bg-forest/5 p-4 shadow-sm">
            <div className="text-[11px] font-semibold text-forest uppercase tracking-wider">Active Approved</div>
            <div className="mt-1.5 text-2xl font-serif font-bold text-forest">
              {summary?.approved_users ?? 0}
            </div>
            <div className="text-[10px] text-warm-gray mt-0.5">Can login & use studio</div>
          </div>

          <div className="rounded-xl border border-warm-beige bg-white p-4 shadow-sm">
            <div className="text-[11px] font-semibold text-warm-gray uppercase tracking-wider">Rejected / Suspended</div>
            <div className="mt-1.5 text-2xl font-serif font-bold text-charcoal">
              {(summary?.rejected_users ?? 0) + (summary?.suspended_users ?? 0)}
            </div>
            <div className="text-[10px] text-warm-gray mt-0.5">Access blocked</div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-warm-beige bg-white p-1 shadow-sm">
            {[
              { id: "all", label: "All Users" },
              { id: "pending", label: `Pending (${summary?.pending_approvals ?? 0})` },
              { id: "approved", label: "Approved" },
              { id: "rejected", label: "Rejected" },
              { id: "suspended", label: "Suspended" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === tab.id
                    ? "bg-forest text-cream shadow-sm"
                    : "text-warm-gray hover:text-charcoal hover:bg-sand-light"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search email or studio..."
                className="w-56 rounded-xl border border-warm-beige bg-white px-3.5 py-1.5 text-xs text-charcoal placeholder-warm-gray outline-none focus:border-forest shadow-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    fetchData();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-warm-gray hover:text-charcoal"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              className="rounded-xl border border-warm-beige bg-white px-3 py-1.5 text-xs font-semibold text-charcoal hover:border-forest shadow-sm"
            >
              Search
            </button>
          </form>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden rounded-2xl border border-warm-beige bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-warm-beige bg-sand-light/60 text-[11px] font-semibold text-warm-gray uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">User / Studio</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-beige">
                {loading && users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-warm-gray">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-warm-gray">
                      No users match the selected filter.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isActing = actionLoadingId === u.id;
                    const isSelf = currentUser?.id === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-sand-light/30 transition-colors">
                        {/* User Details */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {u.avatar_url ? (
                              <img
                                src={u.avatar_url}
                                alt={u.studio_name || u.email}
                                className="h-8 w-8 rounded-full object-cover ring-1 ring-warm-beige"
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest/10 font-bold text-forest ring-1 ring-forest/20">
                                {(u.studio_name || u.email).charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-semibold text-charcoal truncate">
                                {u.studio_name || "Unnamed Studio"}
                              </div>
                              <div className="text-[11px] text-warm-gray truncate font-mono">
                                {u.email}
                              </div>
                              {u.rejection_reason && (
                                <div className="mt-0.5 text-[10px] text-red-600 italic truncate max-w-xs">
                                  Reason: {u.rejection_reason}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Provider */}
                        <td className="py-3.5 px-4">
                          {u.auth_provider === "google" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-500/20">
                              <svg className="h-3 w-3" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z" />
                                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.41 7.34 24 12 24z" />
                                <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.13z" />
                                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.59 1.24 6.58l4.04 3.13c.95-2.83 3.6-4.96 6.72-4.96z" />
                              </svg>
                              Google
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-sand-light px-2 py-0.5 text-[10px] font-medium text-warm-gray border border-warm-beige">
                              <span>✉</span>
                              Email
                            </span>
                          )}
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4">
                          {isSuperAdmin && !isSelf ? (
                            <select
                              value={u.role || "photographer"}
                              onChange={(e) => handleRoleChange(u, e.target.value)}
                              disabled={isActing}
                              className="rounded-lg border border-warm-beige bg-white px-2 py-1 text-[11px] text-charcoal outline-none focus:border-forest"
                            >
                              <option value="photographer">Photographer</option>
                              <option value="admin">Admin</option>
                              <option value="super_admin">Super Admin</option>
                            </select>
                          ) : (
                            <span
                              className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                u.role === "super_admin"
                                  ? "bg-forest/15 text-forest border border-forest/30"
                                  : u.role === "admin"
                                  ? "bg-sage/20 text-forest border border-sage/40"
                                  : "bg-sand-light text-warm-gray border border-warm-beige"
                              }`}
                            >
                              {u.role || "photographer"}
                            </span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                              u.approval_status === "approved"
                                ? "bg-forest/10 text-forest border border-forest/30"
                                : u.approval_status === "pending"
                                ? "bg-amber-500/15 text-amber-700 border border-amber-500/40"
                                : u.approval_status === "rejected"
                                ? "bg-red-500/15 text-red-600 border border-red-500/30"
                                : "bg-orange-500/15 text-orange-600 border border-orange-500/30"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                u.approval_status === "approved"
                                  ? "bg-forest"
                                  : u.approval_status === "pending"
                                  ? "bg-amber-500 animate-pulse"
                                  : "bg-red-500"
                              }`}
                            />
                            {u.approval_status || "approved"}
                          </span>
                        </td>

                        {/* Registered Date */}
                        <td className="py-3.5 px-4 text-warm-gray font-mono text-[11px]">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {u.approval_status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleApprove(u)}
                                  disabled={isActing}
                                  className="rounded-lg bg-forest hover:bg-forest-light px-2.5 py-1 text-[11px] font-semibold text-cream transition-colors disabled:opacity-50 shadow-sm"
                                >
                                  {isActing ? "..." : "Approve"}
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectingUser(u);
                                    setRejectionReason("");
                                  }}
                                  disabled={isActing}
                                  className="rounded-lg bg-red-600 hover:bg-red-500 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {u.approval_status === "approved" && !isSelf && (
                              <button
                                onClick={() => handleSuspend(u)}
                                disabled={isActing}
                                className="rounded-lg border border-warm-beige bg-white hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 px-2.5 py-1 text-[11px] font-semibold text-warm-gray transition-colors disabled:opacity-50 shadow-sm"
                              >
                                {isActing ? "..." : "Suspend"}
                              </button>
                            )}

                            {(u.approval_status === "rejected" || u.approval_status === "suspended") && (
                              <button
                                onClick={() => handleApprove(u)}
                                disabled={isActing}
                                className="rounded-lg border border-forest/30 bg-forest/10 hover:bg-forest/20 px-2.5 py-1 text-[11px] font-semibold text-forest transition-colors disabled:opacity-50"
                              >
                                {isActing ? "..." : "Re-activate"}
                              </button>
                            )}

                            {isSelf && (
                              <span className="text-[10px] text-warm-gray italic">Current user</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-warm-beige bg-white p-6 shadow-2xl">
            <h3 className="text-base font-serif font-bold text-charcoal">
              Reject Registration Request
            </h3>
            <p className="mt-1 text-xs text-warm-gray">
              Provide an optional reason for denying access to{" "}
              <strong className="text-charcoal">
                {rejectingUser.studio_name || rejectingUser.email}
              </strong>
              . This will be shown to them when they attempt to sign in.
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Incomplete business verification, outside service territory..."
              rows={3}
              className="mt-3.5 w-full rounded-xl border border-warm-beige bg-sand-light/50 p-3 text-xs text-charcoal placeholder-warm-gray outline-none focus:border-red-500"
            />

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setRejectingUser(null);
                  setRejectionReason("");
                }}
                disabled={Boolean(actionLoadingId)}
                className="rounded-xl border border-warm-beige bg-white px-3.5 py-2 text-xs font-semibold text-warm-gray hover:text-charcoal"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                disabled={Boolean(actionLoadingId)}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50 shadow-sm"
              >
                {actionLoadingId ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
