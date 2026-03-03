"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Gamepad2, Zap, ChevronRight, Wallet, RefreshCw, Plus } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatRupiah } from "@/lib/utils";

const GAMES = [
  { id: "ml",      name: "Mobile Legends",    icon: "\u2694\uFE0F", color: "from-blue-500 to-blue-700" },
  { id: "ff",      name: "Free Fire",          icon: "\uD83D\uDD25", color: "from-orange-400 to-red-600" },
  { id: "pubg",    name: "PUBG Mobile",        icon: "\uD83E\uDD96", color: "from-yellow-500 to-yellow-700" },
  { id: "genshin", name: "Genshin Impact",     icon: "\uD83D\uDCAB", color: "from-teal-400 to-blue-600" },
  { id: "hsr",     name: "Honkai: Star Rail",  icon: "\uD83C\uDF0C", color: "from-purple-500 to-indigo-700" },
  { id: "clash",   name: "Clash of Clans",     icon: "\uD83C\uDFF0", color: "from-green-500 to-green-700" },
  { id: "roblox",  name: "Roblox",             icon: "\uD83D\uDFE5", color: "from-red-500 to-red-700" },
  { id: "valorant",name: "Valorant",           icon: "\uD83C\uDFAF", color: "from-rose-500 to-red-800" },
];

/** Harga jual = harga modal + margin 5%, dibulatkan ke atas ke kelipatan 500 */
const MARGIN = 0.05;
function sellPrice(base: number): number {
  return Math.ceil((base * (1 + MARGIN)) / 500) * 500;
}

const NOMINAL_BY_GAME: Record<string, { label: string; basePrice: number; value: string }[]> = {
  ml: [
    { label: "86 Diamonds", basePrice: 19000, value: "86" },
    { label: "172 Diamonds", basePrice: 38000, value: "172" },
    { label: "257 Diamonds", basePrice: 57000, value: "257" },
    { label: "344 Diamonds", basePrice: 75000, value: "344" },
    { label: "514 Diamonds", basePrice: 109000, value: "514" },
    { label: "706 Diamonds", basePrice: 149000, value: "706" },
  ],
  ff: [
    { label: "70 Diamonds", basePrice: 16000, value: "70" },
    { label: "140 Diamonds", basePrice: 32000, value: "140" },
    { label: "355 Diamonds", basePrice: 80000, value: "355" },
    { label: "720 Diamonds", basePrice: 160000, value: "720" },
    { label: "1450 Diamonds", basePrice: 319000, value: "1450" },
    { label: "2180 Diamonds", basePrice: 479000, value: "2180" },
  ],
  pubg: [
    { label: "60 UC", basePrice: 15000, value: "60" },
    { label: "180 UC", basePrice: 45000, value: "180" },
    { label: "325 UC", basePrice: 79000, value: "325" },
    { label: "660 UC", basePrice: 159000, value: "660" },
    { label: "1800 UC", basePrice: 429000, value: "1800" },
  ],
  genshin: [
    { label: "60 Primogems", basePrice: 15000, value: "60" },
    { label: "300 Primogems", basePrice: 75000, value: "300" },
    { label: "980 Primogems", basePrice: 239000, value: "980" },
    { label: "1980 Primogems", basePrice: 479000, value: "1980" },
  ],
  hsr: [
    { label: "60 Oneiric Shards", basePrice: 15000, value: "60" },
    { label: "300 Oneiric Shards", basePrice: 75000, value: "300" },
    { label: "980 Oneiric Shards", basePrice: 239000, value: "980" },
  ],
  clash: [
    { label: "80 Gems", basePrice: 14000, value: "80" },
    { label: "500 Gems", basePrice: 79000, value: "500" },
    { label: "1200 Gems", basePrice: 159000, value: "1200" },
    { label: "2500 Gems", basePrice: 319000, value: "2500" },
  ],
  roblox: [
    { label: "400 Robux", basePrice: 59000, value: "400" },
    { label: "800 Robux", basePrice: 109000, value: "800" },
    { label: "1700 Robux", basePrice: 219000, value: "1700" },
    { label: "4500 Robux", basePrice: 559000, value: "4500" },
  ],
  valorant: [
    { label: "420 VP", basePrice: 55000, value: "420" },
    { label: "1000 VP", basePrice: 129000, value: "1000" },
    { label: "2050 VP", basePrice: 259000, value: "2050" },
    { label: "3650 VP", basePrice: 459000, value: "3650" },
  ],
};

export default function GamesPage() {
  type GameNominal = { label: string; basePrice: number; value: string; code: string; sellPrice?: number };
  type SyncedProduct = {
    code: string;
    name: string;
    game_id: string | null;
    nominal_value: string | null;
    buy_price: number;
    sell_price: number;
  };

  const { data: session } = useSession();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [serverId, setServerId] = useState("");
  const [selectedNominal, setSelectedNominal] = useState<GameNominal | null>(null);
  const [syncedProducts, setSyncedProducts] = useState<Record<string, GameNominal[]>>({});
  const [loading, setLoading] = useState(false);
  const [payMethod, setPayMethod] = useState<"saldo" | "mayar">("mayar");
  const [balance, setBalance] = useState<{ balance: number; hold: number } | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const idempotencyKeyRef = useRef<string>("");

  const fetchBalance = useCallback(async () => {
    if (!session?.user) return;
    setBalanceLoading(true);
    try {
      const res = await fetch("/api/topup/balance");
      const json = await res.json();
      if (json.success) setBalance(json.data);
    } finally {
      setBalanceLoading(false);
    }
  }, [session]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  useEffect(() => {
    let active = true;

    const fetchCatalog = async () => {
      try {
        const res = await fetch("/api/games/products");
        const json = await res.json();
        if (!res.ok || !json.success) return;

        const grouped: Record<string, GameNominal[]> = {};
        for (const item of (json.data ?? []) as SyncedProduct[]) {
          if (!item.game_id) continue;
          const gameId = item.game_id.toLowerCase();
          if (!grouped[gameId]) grouped[gameId] = [];
          grouped[gameId].push({
            code: item.code,
            label: item.name,
            value: item.nominal_value ?? item.code,
            basePrice: item.buy_price,
            sellPrice: item.sell_price,
          });
        }

        if (!active) return;
        setSyncedProducts(grouped);
      } catch {
        // silent fallback to static products
      }
    };

    fetchCatalog();
    return () => {
      active = false;
    };
  }, []);

  const game = GAMES.find((g) => g.id === selectedGame);
  const nominals: GameNominal[] = selectedGame
    ? syncedProducts[selectedGame]?.length
      ? syncedProducts[selectedGame]
      : (NOMINAL_BY_GAME[selectedGame] ?? []).map((n) => ({ ...n, code: `${selectedGame}:${n.value}` }))
    : [];

  const handleBuy = async () => {
    if (!userId.trim()) { toast.error("Masukkan User ID terlebih dahulu"); return; }
    if (!selectedNominal) { toast.error("Pilih nominal top-up"); return; }
    if (selectedNominal.code.includes(":")) {
      toast.error("Produk belum sinkron dari provider. Minta admin jalankan sync.");
      return;
    }
    if (!game) return;
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }
    setLoading(true);
    try {
      const res = await fetch("/api/games/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": idempotencyKeyRef.current,
        },
        body: JSON.stringify({
          gameId: game.id,
          gameName: game.name,
          nominalLabel: selectedNominal.label,
          nominalValue: selectedNominal.value,
          productCode: selectedNominal.code,
          price: selectedNominal.sellPrice ?? sellPrice(selectedNominal.basePrice),
          targetUserId: userId.trim(),
          targetServerId: serverId.trim() || undefined,
          payWithBalance: payMethod === "saldo",
          idempotencyKey: idempotencyKeyRef.current,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Gagal membuat order");
        return;
      }
      if (json.data.paid) {
        toast.success("Pembayaran berhasil! Pesanan sedang diproses.");
        idempotencyKeyRef.current = "";
        setStep(1);
        setSelectedGame(null);
        setSelectedNominal(null);
        setUserId("");
        setServerId("");
        fetchBalance();
      } else {
        window.location.href = json.data.paymentUrl;
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white py-10">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4">{"\uD83C\uDFAE"}</div>
          <h1 className="text-3xl font-black mb-2">Game Voucher</h1>
          <p className="text-purple-200">Top-up game favoritmu dengan harga terbaik.</p>
        </div>
      </div>

      {/* Saldo widget */}
      {session?.user && (
        <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 text-white px-4 py-5">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-wide mb-1">Saldo JBB</p>
              {balanceLoading ? (
                <div className="h-7 w-32 bg-white/20 animate-pulse rounded-xl" />
              ) : (
                <p className="text-2xl font-black">{balance ? formatRupiah(balance.balance) : "Rp 0"}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/topup/deposit"
                className="flex items-center gap-1.5 bg-white text-indigo-700 font-bold text-sm px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                <Plus size={13} /> Isi Saldo
              </Link>
              <button
                onClick={fetchBalance}
                className="p-2 bg-white/15 rounded-xl hover:bg-white/25 transition-colors"
              >
                <RefreshCw size={13} className={balanceLoading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8">
          {[
            { n: 1, label: "Pilih Game" },
            { n: 2, label: "Data Akun" },
            { n: 3, label: "Pilih Nominal" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                step >= s.n ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {s.n}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${step >= s.n ? "text-purple-700" : "text-gray-400"}`}>{s.label}</span>
              {i < 2 && <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0 ml-auto" />}
            </div>
          ))}
        </div>

        {/* Step 1 â€” Pilih Game */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-purple-600" /> Pilih Game
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {GAMES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => { setSelectedGame(g.id); setStep(2); }}
                  className={`bg-gradient-to-br ${g.color} rounded-2xl p-4 flex flex-col items-center gap-2 text-white shadow-sm hover:scale-105 transition-transform`}
                >
                  <span className="text-3xl">{g.icon}</span>
                  <span className="text-xs font-bold text-center leading-tight">{g.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 â€” Masukkan User ID */}
        {step === 2 && game && (
          <div>
            <button onClick={() => setStep(1)} className="text-sm text-purple-600 hover:underline mb-4 flex items-center gap-1">
              â† Ganti game
            </button>
            <div className={`bg-gradient-to-r ${game.color} rounded-2xl p-4 flex items-center gap-3 text-white mb-6`}>
              <span className="text-3xl">{game.icon}</span>
              <span className="font-bold text-lg">{game.name}</span>
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Masukkan Data Akun</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">User ID</label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Masukkan User ID kamu"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              {(selectedGame === "ml" || selectedGame === "pubg") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Server ID {selectedGame === "ml" ? "(Zone)" : ""}</label>
                  <input
                    type="text"
                    value={serverId}
                    onChange={(e) => setServerId(e.target.value)}
                    placeholder="Masukkan Server ID"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}
              <Button
                onClick={() => { if (!userId.trim()) { toast.error("Masukkan User ID"); return; } setStep(3); }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                size="lg"
              >
                Lanjutkan â†’
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 â€” Pilih Nominal */}
        {step === 3 && game && (
          <div>
            <button onClick={() => setStep(2)} className="text-sm text-purple-600 hover:underline mb-4 flex items-center gap-1">
              â† Ubah data akun
            </button>
            <div className={`bg-gradient-to-r ${game.color} rounded-2xl p-4 flex items-center gap-3 text-white mb-2`}>
              <span className="text-3xl">{game.icon}</span>
              <div>
                <span className="font-bold text-lg">{game.name}</span>
                <p className="text-white/80 text-sm">ID: {userId}{serverId ? ` Â· Server: ${serverId}` : ""}</p>
              </div>
            </div>

            <h2 className="text-lg font-bold text-gray-800 mb-4 mt-6 flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" /> Pilih Nominal Top-up
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {nominals.map((n) => (
                <button
                  key={n.code}
                  onClick={() => setSelectedNominal(n)}
                  className={`border-2 rounded-xl p-4 text-left transition-all ${
                    selectedNominal?.value === n.value
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 bg-white hover:border-purple-300"
                  }`}
                >
                  <p className="font-bold text-gray-800 text-sm">{n.label}</p>
                  <p className="text-purple-600 font-black mt-1">
                    Rp {(n.sellPrice ?? sellPrice(n.basePrice)).toLocaleString("id-ID")}
                  </p>
                </button>
              ))}
            </div>

            {nominals.length === 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-700 p-3 text-sm mb-4">
                Produk untuk game ini belum tersedia. Minta admin jalankan sinkronisasi produk.
              </div>
            )}

            {/* Summary */}
            {selectedNominal && (
              <div className="bg-gray-100 rounded-xl p-4 mb-4 text-sm text-gray-700">
                <div className="flex justify-between mb-1">
                  <span>Produk</span>
                  <span className="font-medium">{game.name} {selectedNominal.label}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>User ID</span>
                  <span className="font-medium">{userId}{serverId ? ` / ${serverId}` : ""}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2 mt-2">
                  <span>Total Pembayaran</span>
                  <span className="text-purple-700">
                    Rp {(selectedNominal.sellPrice ?? sellPrice(selectedNominal.basePrice)).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            )}

            {/* Payment method toggle */}
            {session?.user && (
              <div className="flex gap-2 mb-4">
                {[
                  { id: "saldo", label: `Saldo (${balance ? formatRupiah(balance.balance) : "Rp 0"})`, icon: <Wallet size={14} /> },
                  { id: "mayar", label: "Transfer/QRIS", icon: <Zap size={14} /> },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPayMethod(m.id as "saldo" | "mayar")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      payMethod === m.id
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-200 bg-white text-gray-500 hover:border-purple-300"
                    }`}
                  >
                    {m.icon}{m.label}
                  </button>
                ))}
              </div>
            )}

            {payMethod === "saldo" && selectedNominal && balance !== null && balance.balance < (selectedNominal.sellPrice ?? sellPrice(selectedNominal.basePrice)) && (
              <p className="text-xs text-red-500 mb-3">
                Saldo tidak cukup.{" "}
                <Link href="/topup/deposit" className="underline font-semibold">Isi saldo</Link>
              </p>
            )}

            <Button
              onClick={handleBuy}
              loading={loading}
              disabled={
                !selectedNominal ||
                (payMethod === "saldo" && (!balance || balance.balance < sellPrice(selectedNominal?.basePrice ?? 0)))
              }
              className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
              size="lg"
            >
              {payMethod === "saldo" ? <><Wallet size={16} className="mr-1.5" />Bayar dengan Saldo</> : <>Bayar dengan Transfer/QRIS</>}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
