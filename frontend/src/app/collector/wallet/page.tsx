"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, IndianRupee, Package, Scale, Wallet, RefreshCw, X, AlertCircle } from "lucide-react";
import axios from "axios";

interface WalletTx {
  id: string;
  type: string;
  amountRupees: number;
  description: string;
  referenceId: string | null;
  createdAt: string;
}

interface WalletData {
  walletId: string;
  balanceRupees: number;
  totalEarnedRupees: number;
  totalWithdrawnRupees: number;
  transactions: WalletTx[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

const DEFAULT_WALLET: WalletData = {
  walletId: "wal-demo",
  balanceRupees: 12480.0,
  totalEarnedRupees: 184250.0,
  totalWithdrawnRupees: 171770.0,
  transactions: [
    { id: "1", type: "CREDIT_COLLECTION_COMMISSION", amountRupees: 180, description: "Pickup #4029 Commission", referenceId: "ref-4029", createdAt: new Date().toISOString() },
    { id: "2", type: "CREDIT_COLLECTION_COMMISSION", amountRupees: 250, description: "Hub Drop-off Bonus", referenceId: "hub-bonus", createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: "3", type: "DEBIT_WITHDRAWAL", amountRupees: 5000, description: "UPI Withdrawal to collector@okaxis", referenceId: "collector@okaxis", createdAt: new Date(Date.now() - 86400000).toISOString() },
  ],
};

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData>(DEFAULT_WALLET);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await axios.get(`${API_BASE_URL}/wallets/me`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      if (res.data?.success && res.data?.data) {
        setWallet(res.data.data);
      }
    } catch {
      // Fallback gracefully to default data when offline or unauthenticated
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchWallet();
  }, [fetchWallet]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setFeedback({ type: "error", text: "Please enter a valid withdrawal amount." });
      return;
    }
    if (amount > wallet.balanceRupees) {
      setFeedback({ type: "error", text: "Withdrawal amount exceeds your available balance." });
      return;
    }
    if (!/^[\w.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)) {
      setFeedback({ type: "error", text: "Enter a valid UPI ID (e.g. name@okhdfcbank)." });
      return;
    }

    setWithdrawLoading(true);
    setFeedback(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const idempotencyKey = `WTH-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const res = await axios.post(
        `${API_BASE_URL}/wallets/withdraw`,
        { amountRupees: amount, upiId },
        {
          headers: {
            "Idempotency-Key": idempotencyKey,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          timeout: 8000,
        }
      );

      if (res.data?.success) {
        setFeedback({ type: "success", text: `₹${amount.toLocaleString("en-IN")} credited to ${upiId} successfully!` });
        setWithdrawAmount("");
        setUpiId("");
        setIsModalOpen(false);
        await fetchWallet();
      }
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) && err.response?.data?.error?.message
        ? err.response.data.error.message
        : "Failed to process withdrawal. Please try again.";
      setFeedback({ type: "error", text: msg });
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-canvas)" }}>
      <div className="nav-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>My Earnings & Wallet</h1>
        <button onClick={fetchWallet} disabled={loading} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary)" }}>
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div style={{ maxWidth: 500, margin: "0 auto", padding: "16px 16px 100px" }}>
        {feedback && (
          <div style={{
            padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, display: "flex", alignItems: "center", gap: 8,
            background: feedback.type === "success" ? "#ecfdf5" : "#fef2f2",
            color: feedback.type === "success" ? "#065f46" : "#991b1b",
          }}>
            <AlertCircle size={16} />
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Balance Card */}
        <div style={{ background: "linear-gradient(135deg, #059669, #10B981)", borderRadius: "var(--radius-lg)", padding: 28, color: "white", marginBottom: 20 }}>
          <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
            <Wallet size={16} /> Available Balance
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 4 }}>
            ₹{wallet.balanceRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            Lifetime Earnings: ₹{wallet.totalEarnedRupees.toLocaleString("en-IN")}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button
              onClick={() => { setFeedback(null); setIsModalOpen(true); }}
              style={{ flex: 1, height: 40, borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.2)", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Withdraw to UPI
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}>
          <div className="card card-compact" style={{ textAlign: "center" }}>
            <Package size={16} color="var(--color-success)" style={{ margin: "0 auto 4px" }} />
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Withdrawn</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>₹{wallet.totalWithdrawnRupees.toLocaleString("en-IN")}</div>
          </div>
          <div className="card card-compact" style={{ textAlign: "center" }}>
            <Scale size={16} color="var(--color-secondary)" style={{ margin: "0 auto 4px" }} />
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Audit Entries</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{wallet.transactions.length}</div>
          </div>
          <div className="card card-compact" style={{ textAlign: "center" }}>
            <IndianRupee size={16} color="var(--color-primary)" style={{ margin: "0 auto 4px" }} />
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Status</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)" }}>Active</div>
          </div>
        </div>

        {/* Transactions */}
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Immutable Ledger History</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {wallet.transactions.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--color-text-muted)", padding: 20 }}>No transactions yet</div>
          ) : (
            wallet.transactions.map((tx) => {
              const isCredit = tx.type === "CREDIT_COLLECTION_COMMISSION" || tx.type === "credit";
              return (
                <div key={tx.id} className="card card-compact" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: isCredit ? "var(--color-success-tint)" : "var(--color-error-tint)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isCredit ? <ArrowDown size={16} color="var(--color-success)" /> : <ArrowUp size={16} color="var(--color-error)" />}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{tx.description}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{new Date(tx.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: isCredit ? "var(--color-success)" : "var(--color-error)" }}>
                    {isCredit ? "+" : "-"}₹{tx.amountRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div style={{ background: "white", borderRadius: 12, padding: 24, width: "100%", maxWidth: 400 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Instant UPI Payout</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={handleWithdraw}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 500, display: "block", marginBottom: 4 }}>UPI VPA ID</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  style={{ width: "100%", height: 38, padding: "0 10px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13 }}
                  required
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 500, display: "block", marginBottom: 4 }}>Amount (₹)</label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  style={{ width: "100%", height: 38, padding: "0 10px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13 }}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={withdrawLoading}
                style={{ width: "100%", height: 42, background: "var(--color-primary)", color: "white", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
              >
                {withdrawLoading ? "Processing Payout..." : "Confirm & Transfer"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div className="nav-bottom">
        <Link href="/collector/dashboard" className="nav-bottom-item">🏠 Home</Link>
        <Link href="/collector/dashboard" className="nav-bottom-item">📍 Jobs</Link>
        <Link href="/collector/wallet" className="nav-bottom-item active">💰 Wallet</Link>
      </div>
    </div>
  );
}
