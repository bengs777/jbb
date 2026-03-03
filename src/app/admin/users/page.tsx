"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { PageLoader, EmptyState } from "@/components/ui/spinner";
import { RoleBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { UserCheck, UserX } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = () => {
    fetch("/api/admin/users")
      .then(r => r.json())
      .then(d => setUsers(d.data ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleActive = async (id: string, isActive: boolean) => {
    setUpdating(id);
    const r = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: id, is_active: !isActive }),
    });
    if (r.ok) { toast.success("Status berhasil diubah"); fetchUsers(); }
    else toast.error("Gagal mengubah status");
    setUpdating(null);
  };

  const changeRole = async (id: string, role: string) => {
    setUpdating(id);
    const r = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: id, role }),
    });
    if (r.ok) { toast.success("Role berhasil diubah"); fetchUsers(); }
    else toast.error("Gagal mengubah role");
    setUpdating(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-800 mb-6">Kelola Pengguna</h1>

        {loading ? <PageLoader /> : users.length === 0 ? (
          <EmptyState title="Belum ada pengguna" description="" />
        ) : (
          <div className="flex flex-col gap-3">
            {users.map((u) => (
              <div key={u.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800">{u.name}</p>
                      <RoleBadge role={u.role} />
                    </div>
                    <p className="text-sm text-gray-500">{u.email}</p>
                    {u.no_hp && <p className="text-xs text-gray-400">{u.no_hp}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">Bergabung: {formatDate(u.created_at)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {u.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <button
                    onClick={() => toggleActive(u.id, u.is_active)}
                    disabled={updating === u.id || u.role === "ADMIN"}
                    className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-50 ${u.is_active ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-700 hover:bg-green-50"}`}
                  >
                    {u.is_active ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                    {u.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </button>

                  {u.role !== "ADMIN" && (
                    <select
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600"
                      value={u.role}
                      onChange={e => changeRole(u.id, e.target.value)}
                      disabled={updating === u.id}
                    >
                      <option value="BUYER">BUYER</option>
                      <option value="SELLER">SELLER</option>
                      <option value="KURIR">KURIR</option>
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
