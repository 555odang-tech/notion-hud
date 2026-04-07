"use client";
import { useEffect, useState } from "react";

interface TodayData {
  date: string;
  xp: number;
  tokens: number;
  total: number;
  done: number;
  dailyTotal: number;
  dailyDone: number;
  dailyXp: number;
  dailyCoins: number;
  overdueTotal: number;
  overdueDone: number;
  todayPageMissing: boolean;
  dailyItems: { name: string; done: boolean }[];
  overdueItems: { name: string; done: boolean }[];
}

interface Stats {
  totalXP: number;
  totalTokens: number;
  level: number;
  xpInLevel: number;
  xpToNext: number;
  today: TodayData;
  updatedAt: string;
}

export default function GameHUD() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showOverdue, setShowOverdue] = useState(false);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => { if (d.error) setError(d.error); else setStats(d); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={s.root}>
      <div style={s.loadWrap}><div style={s.loadDot} className="pulse" /><span style={s.loadText}>LOADING...</span></div>
      <style>{css}</style>
    </div>
  );

  if (error) return (
    <div style={s.root}>
      <div style={{ color: "#ff4d6d", textAlign: "center", padding: 40 }}>⚠ {error}</div>
      <style>{css}</style>
    </div>
  );

  if (!stats) return null;

  const { totalXP, totalTokens, level, xpInLevel, xpToNext, today } = stats;
  const todoPct = today.total > 0 ? Math.round((today.done / today.total) * 100) : 0;
  const dailyPct = today.dailyTotal > 0 ? Math.round((today.dailyDone / today.dailyTotal) * 100) : 0;
  const allClear = today.total > 0 && today.done === today.total;
  const todayDate = new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", weekday: "long" });

  return (
    <div style={s.root}>
      <style>{css}</style>
      <div style={s.gridBg} />

      {/* 헤더 */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.logo}>⚔</span>
          <div>
            <div style={s.logoTitle}>QUEST HUD</div>
            <div style={s.logoSub}>DAILY TRACKER</div>
          </div>
        </div>
        <div style={s.headerDate}>{todayDate}</div>
      </div>

      {/* 계정 패널 */}
      <div style={s.accountPanel}>
        <div style={s.levelWrap}>
          <div style={s.levelHex}><div style={s.levelNum}>{level}</div></div>
          <div style={s.levelLabel}>LEVEL</div>
        </div>
        <div style={s.xpWrap}>
          <div style={s.xpTopRow}>
            <span style={s.xpLabel}>✦ 총 XP</span>
            <span style={s.xpBigNum}>{totalXP.toLocaleString()}</span>
          </div>
          <div style={s.barBg}>
            <div style={{ ...s.xpBarFill, width: `${xpInLevel}%` }} className="xpbar" />
          </div>
          <div style={s.xpBottomRow}>
            <span style={s.xpSub}>Lv.{level} → Lv.{level + 1}</span>
            <span style={s.xpRemain}>잔여 <b style={{ color: "#c084fc" }}>{xpToNext} XP</b></span>
          </div>
        </div>
        <div style={s.tokenWrap}>
          <div style={s.tokenCoin}>🪙</div>
          <div>
            <div style={s.tokenNum}>{totalTokens.toLocaleString()}</div>
            <div style={s.tokenLabel}>TOTAL TOKENS</div>
          </div>
        </div>
      </div>

      {/* TODAY 카드 */}
      <div style={s.todayCard}>
        <div style={s.sectionHeader}>
          <span style={s.todayBadge}>⚡ TODAY</span>
          {allClear && <span style={s.allClearBadge} className="pulse">✦ ALL CLEAR</span>}
        </div>
        <div style={s.statsRow}>
          <div style={s.statBox}>
            <div style={s.statLabel}>퀘스트</div>
            <div style={s.statVal}>
              <span style={{ color: "#22d3ee", fontSize: 32, fontFamily: "Rajdhani,sans-serif", fontWeight: 700 }}>{today.done}</span>
              <span style={{ color: "#334155", margin: "0 4px" }}>/</span>
              <span style={{ color: "#64748b", fontSize: 22, fontFamily: "Rajdhani,sans-serif" }}>{today.total}</span>
            </div>
            <div style={s.barBg}>
              <div style={{ ...s.todoBarFill, width: `${todoPct}%` }} className="todobar" />
            </div>
            <div style={s.pctLabel}>{todoPct}%</div>
          </div>
          <div style={s.statBox}>
            <div style={s.statLabel}>오늘 XP</div>
            <div style={{ ...s.statBig, color: "#a855f7" }}>+{today.xp}</div>
            <div style={s.statIcon}>✨</div>
          </div>
          <div style={s.statBox}>
            <div style={s.statLabel}>오늘 토큰</div>
            <div style={{ ...s.statBig, color: "#f59e0b" }}>+{today.tokens}</div>
            <div style={s.statIcon}>🪙</div>
          </div>
        </div>
        {allClear && (
          <div style={s.allClearMsg} className="pulse">🎉 오늘 퀘스트 ALL CLEAR! +5 보너스 토큰 획득</div>
        )}
      </div>

      {/* DAILY 루틴 카드 */}
      {today.dailyTotal > 0 && (
        <div style={s.dailyCard}>
          <div style={s.sectionHeader}>
            <span style={s.dailyBadge}>🔁 DAILY</span>
            <span style={s.dailyProgress}>{today.dailyDone}/{today.dailyTotal}</span>
            <div style={{ ...s.barBgSmall, flex: 1, margin: "0 10px" }}>
              <div style={{ ...s.dailyBarFill, width: `${dailyPct}%` }} />
            </div>
            <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "Rajdhani,sans-serif" }}>+{today.dailyXp}XP +{today.dailyCoins}🪙</span>
          </div>
          <div style={s.dailyList}>
            {today.dailyItems.map((item, i) => (
              <div key={i} style={{ ...s.dailyItem, opacity: item.done ? 0.5 : 1 }}>
                <span style={{ color: item.done ? "#10b981" : "#475569", marginRight: 8 }}>
                  {item.done ? "✓" : "○"}
                </span>
                <span style={{ textDecoration: item.done ? "line-through" : "none", color: item.done ? "#64748b" : "#cbd5e1", fontSize: 13 }}>
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OVERDUE 밀린 카드 */}
      {today.overdueTotal > 0 && (
        <div style={s.overdueCard}>
          <div style={{ ...s.sectionHeader, cursor: "pointer" }} onClick={() => setShowOverdue(!showOverdue)}>
            <span style={s.overdueBadge}>⏰ 밀린 {today.overdueTotal}개</span>
            <span style={{ color: "#64748b", fontSize: 12 }}>{showOverdue ? "▲" : "▼"}</span>
          </div>
          {showOverdue && (
            <div style={s.dailyList}>
              {today.overdueItems.map((item, i) => (
                <div key={i} style={{ ...s.dailyItem, opacity: item.done ? 0.5 : 1 }}>
                  <span style={{ color: item.done ? "#10b981" : "#f59e0b", marginRight: 8 }}>
                    {item.done ? "✓" : "!"}
                  </span>
                  <span style={{ color: item.done ? "#64748b" : "#fbbf24", fontSize: 13 }}>
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={s.footer}>
        업데이트: {new Date(stats.updatedAt).toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul" })}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: { fontFamily: "'Noto Sans KR',sans-serif", background: "#080812", minHeight: "100vh", color: "#e2e8f0", padding: 16, boxSizing: "border-box", position: "relative", overflow: "hidden" },
  gridBg: { position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 },
  loadWrap: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 16 },
  loadDot: { width: 12, height: 12, borderRadius: "50%", background: "#7c3aed" },
  loadText: { fontFamily: "Rajdhani,sans-serif", letterSpacing: 4, color: "#4a3f7a", fontSize: 14 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid rgba(99,102,241,0.2)", position: "relative", zIndex: 1 },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  logo: { fontSize: 28, filter: "drop-shadow(0 0 8px #7c3aed)" },
  logoTitle: { fontFamily: "Rajdhani,sans-serif", fontSize: 20, fontWeight: 700, color: "#c084fc", letterSpacing: 3 },
  logoSub: { fontFamily: "Rajdhani,sans-serif", fontSize: 10, color: "#4338ca", letterSpacing: 4 },
  headerDate: { fontSize: 12, color: "#475569" },
  accountPanel: { display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", background: "linear-gradient(135deg,rgba(30,27,75,0.8),rgba(15,10,30,0.9))", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 16, padding: "16px 20px", marginBottom: 12, position: "relative", zIndex: 1 },
  levelWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
  levelHex: { width: 70, height: 70, borderRadius: 14, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 24px rgba(124,58,237,0.5)" },
  levelNum: { fontFamily: "Rajdhani,sans-serif", fontSize: 32, fontWeight: 700, color: "#fff" },
  levelLabel: { fontFamily: "Rajdhani,sans-serif", fontSize: 10, color: "#6d28d9", letterSpacing: 3 },
  xpWrap: { flex: 1, minWidth: 160 },
  xpTopRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 },
  xpLabel: { fontFamily: "Rajdhani,sans-serif", fontSize: 11, color: "#6d28d9", letterSpacing: 2 },
  xpBigNum: { fontFamily: "Rajdhani,sans-serif", fontSize: 22, fontWeight: 700, color: "#e2e8f0" },
  barBg: { background: "#0f0a1e", borderRadius: 99, height: 8, overflow: "hidden", marginBottom: 6 },
  xpBarFill: { height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#4f46e5,#7c3aed,#a855f7)", transition: "width 1s ease" },
  xpBottomRow: { display: "flex", justifyContent: "space-between" },
  xpSub: { fontSize: 11, color: "#334155", fontFamily: "Rajdhani,sans-serif" },
  xpRemain: { fontSize: 11, color: "#475569" },
  tokenWrap: { display: "flex", alignItems: "center", gap: 10, background: "rgba(120,53,15,0.2)", border: "1px solid rgba(120,53,15,0.4)", borderRadius: 12, padding: "10px 16px" },
  tokenCoin: { fontSize: 30, filter: "drop-shadow(0 0 6px #f59e0b)" },
  tokenNum: { fontFamily: "Rajdhani,sans-serif", fontSize: 26, fontWeight: 700, color: "#fbbf24" },
  tokenLabel: { fontFamily: "Rajdhani,sans-serif", fontSize: 10, color: "#78350f", letterSpacing: 2 },
  todayCard: { background: "linear-gradient(135deg,rgba(15,23,42,0.9),rgba(8,10,20,0.95))", border: "1px solid rgba(30,64,175,0.4)", borderRadius: 16, padding: "16px 20px", marginBottom: 10, position: "relative", zIndex: 1 },
  dailyCard: { background: "linear-gradient(135deg,rgba(6,30,20,0.9),rgba(4,20,14,0.95))", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 16, padding: "14px 18px", marginBottom: 10, position: "relative", zIndex: 1 },
  overdueCard: { background: "rgba(30,15,0,0.7)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 16, padding: "14px 18px", marginBottom: 10, position: "relative", zIndex: 1 },
  sectionHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" },
  todayBadge: { fontFamily: "Rajdhani,sans-serif", fontSize: 13, fontWeight: 700, color: "#38bdf8", letterSpacing: 3, borderBottom: "2px solid #0ea5e9", paddingBottom: 2 },
  dailyBadge: { fontFamily: "Rajdhani,sans-serif", fontSize: 13, fontWeight: 700, color: "#10b981", letterSpacing: 3 },
  overdueBadge: { fontFamily: "Rajdhani,sans-serif", fontSize: 13, fontWeight: 700, color: "#f59e0b", letterSpacing: 2 },
  allClearBadge: { fontFamily: "Rajdhani,sans-serif", fontSize: 11, letterSpacing: 2, color: "#10b981", background: "rgba(6,78,59,0.3)", border: "1px solid #065f46", borderRadius: 6, padding: "2px 10px" },
  dailyProgress: { fontFamily: "Rajdhani,sans-serif", fontSize: 13, color: "#6ee7b7" },
  barBgSmall: { background: "#0f1a14", borderRadius: 99, height: 6, overflow: "hidden" },
  dailyBarFill: { height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#059669,#10b981)", transition: "width 1s ease" },
  dailyList: { display: "flex", flexDirection: "column", gap: 6 },
  dailyItem: { display: "flex", alignItems: "center", padding: "4px 0" },
  statsRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  statBox: { flex: 1, minWidth: 100, background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: 12, padding: "12px 14px" },
  statLabel: { fontSize: 11, color: "#475569", marginBottom: 6, fontFamily: "Rajdhani,sans-serif", letterSpacing: 1 },
  statVal: { display: "flex", alignItems: "baseline", marginBottom: 8 },
  statBig: { fontFamily: "Rajdhani,sans-serif", fontSize: 32, fontWeight: 700, lineHeight: 1 },
  statIcon: { fontSize: 20, marginTop: 4 },
  todoBarFill: { height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#0ea5e9,#22d3ee)", transition: "width 1s ease" },
  pctLabel: { fontSize: 11, color: "#334155", textAlign: "right", fontFamily: "Rajdhani,sans-serif" },
  allClearMsg: { marginTop: 12, padding: "10px 16px", background: "linear-gradient(90deg,rgba(6,78,59,0.4),rgba(6,95,70,0.4))", border: "1px solid #10b981", borderRadius: 10, textAlign: "center", fontSize: 13, color: "#6ee7b7", fontWeight: 700 },
  footer: { fontSize: 11, color: "#1e293b", textAlign: "center", fontFamily: "Rajdhani,sans-serif", letterSpacing: 1, position: "relative", zIndex: 1 },
};

const css = `
  * { box-sizing: border-box; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
  @keyframes shimmer { 0%{opacity:1} 50%{opacity:0.7} 100%{opacity:1} }
  .pulse { animation: pulse 2s ease-in-out infinite; }
  .xpbar,.todobar { animation: shimmer 3s ease-in-out infinite; }
`;
