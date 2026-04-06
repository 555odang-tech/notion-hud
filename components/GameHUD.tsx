"use client";
import { useEffect, useState } from "react";

interface TodayData {
  date: string;
  xp: number;
  tokens: number;
  progress: string;
  gauge: string;
  todoTotal: number;
  todoDone: number;
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => { if (d.error) setError(d.error); else setStats(d); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (!mounted || loading) return (
    <div style={s.root}>
      <div style={s.loadWrap}>
        <div style={s.loadDot} className="pulse" />
        <span style={s.loadText}>LOADING QUEST DATA...</span>
      </div>
      <style>{globalCss}</style>
    </div>
  );

  if (error) return (
    <div style={s.root}>
      <div style={{ color: "#ff4d6d", textAlign: "center", padding: 40, fontFamily: "Rajdhani" }}>
        ⚠ CONNECTION FAILED<br /><small style={{ color: "#555", fontFamily: "Noto Sans KR" }}>{error}</small>
      </div>
      <style>{globalCss}</style>
    </div>
  );

  if (!stats) return null;

  const { totalXP, totalTokens, level, xpInLevel, xpToNext, today } = stats;
  const todoPct = today.todoTotal > 0 ? Math.round((today.todoDone / today.todoTotal) * 100) : 0;
  const allClear = today.todoTotal > 0 && today.todoDone === today.todoTotal;
  const todayDate = new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", weekday: "long" });

  return (
    <div style={s.root}>
      <style>{globalCss}</style>

      {/* 배경 그리드 */}
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
        {/* 레벨 */}
        <div style={s.levelWrap}>
          <div style={s.levelHex}>
            <div style={s.levelNum}>{level}</div>
          </div>
          <div style={s.levelLabel}>LEVEL</div>
        </div>

        {/* XP 섹션 */}
        <div style={s.xpWrap}>
          <div style={s.xpTopRow}>
            <span style={s.xpLabel}>✦ TOTAL XP</span>
            <span style={s.xpBigNum}>{totalXP.toLocaleString()}</span>
          </div>
          <div style={s.xpBarBg}>
            <div style={{ ...s.xpBarFill, width: `${xpInLevel}%` }} className="xpbar" />
            <div style={{ ...s.xpBarGlow, width: `${xpInLevel}%` }} />
          </div>
          <div style={s.xpBottomRow}>
            <span style={s.xpSub}>LV.{level} → LV.{level + 1}</span>
            <span style={s.xpRemain}>잔여 <b style={{ color: "#c084fc" }}>{xpToNext} XP</b></span>
          </div>
        </div>

        {/* 토큰 */}
        <div style={s.tokenWrap}>
          <div style={s.tokenCoin}>🪙</div>
          <div>
            <div style={s.tokenNum}>{totalTokens.toLocaleString()}</div>
            <div style={s.tokenLabel}>TOTAL TOKENS</div>
          </div>
        </div>
      </div>

      {/* 오늘 카드 */}
      <div style={s.todayCard}>
        <div style={s.todayHeader}>
          <span style={s.todayBadge}>TODAY</span>
          <span style={s.todayDateSmall}>{today.date}</span>
          {allClear && <span style={s.allClearBadge} className="pulse">✦ ALL CLEAR</span>}
        </div>

        <div style={s.statsRow}>
          {/* 퀘스트 진행 */}
          <div style={s.statCard}>
            <div style={s.statCardLabel}>퀘스트</div>
            <div style={s.statCardVal}>
              <span style={{ color: "#22d3ee", fontSize: 36, fontFamily: "Rajdhani", fontWeight: 700 }}>{today.todoDone}</span>
              <span style={{ color: "#334155", fontSize: 20, margin: "0 6px", fontFamily: "Rajdhani" }}>/</span>
              <span style={{ color: "#64748b", fontSize: 24, fontFamily: "Rajdhani" }}>{today.todoTotal}</span>
            </div>
            <div style={s.todoBarBg}>
              <div style={{ ...s.todoBarFill, width: `${todoPct}%` }} className="todobar" />
            </div>
            <div style={s.todoPct}>{todoPct}%</div>
          </div>

          {/* 오늘 XP */}
          <div style={s.statCard}>
            <div style={s.statCardLabel}>오늘 XP</div>
            <div style={{ ...s.statCardBig, color: "#a855f7" }}>+{today.xp}</div>
            <div style={s.statCardIcon}>✨</div>
          </div>

          {/* 오늘 토큰 */}
          <div style={s.statCard}>
            <div style={s.statCardLabel}>오늘 토큰</div>
            <div style={{ ...s.statCardBig, color: "#f59e0b" }}>+{today.tokens}</div>
            <div style={s.statCardIcon}>🪙</div>
          </div>
        </div>

        {/* 게이지 텍스트 */}
        {today.gauge && (
          <div style={s.gaugeText}>{today.gauge}</div>
        )}

        {/* ALL CLEAR 메시지 */}
        {allClear && (
          <div style={s.allClearMsg} className="pulse">
            🎉 모든 퀘스트 완료! 보너스 +5 토큰 획득
          </div>
        )}
      </div>

      {/* 풋터 */}
      <div style={s.footer}>
        업데이트: {new Date(stats.updatedAt).toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul" })}
      </div>
    </div>
  );
}

/* ─── 스타일 ─── */
const s: Record<string, React.CSSProperties> = {
  root: {
    fontFamily: "'Noto Sans KR', sans-serif",
    background: "#080812",
    minHeight: "100vh",
    color: "#e2e8f0",
    padding: 16,
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
  },
  gridBg: {
    position: "fixed",
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)
    `,
    backgroundSize: "40px 40px",
    pointerEvents: "none",
    zIndex: 0,
  },
  loadWrap: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 16 },
  loadDot: { width: 12, height: 12, borderRadius: "50%", background: "#7c3aed" },
  loadText: { fontFamily: "Rajdhani, sans-serif", letterSpacing: 4, color: "#4a3f7a", fontSize: 14 },

  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 14, paddingBottom: 12,
    borderBottom: "1px solid rgba(99,102,241,0.2)",
    position: "relative", zIndex: 1,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  logo: { fontSize: 28, filter: "drop-shadow(0 0 8px #7c3aed)" },
  logoTitle: { fontFamily: "Rajdhani, sans-serif", fontSize: 20, fontWeight: 700, color: "#c084fc", letterSpacing: 3 },
  logoSub: { fontFamily: "Rajdhani, sans-serif", fontSize: 10, color: "#4338ca", letterSpacing: 4 },
  headerDate: { fontSize: 12, color: "#475569" },

  accountPanel: {
    display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
    background: "linear-gradient(135deg, rgba(30,27,75,0.8) 0%, rgba(15,10,30,0.9) 100%)",
    border: "1px solid rgba(99,102,241,0.3)",
    borderRadius: 16, padding: "16px 20px", marginBottom: 12,
    backdropFilter: "blur(10px)",
    boxShadow: "0 0 40px rgba(124,58,237,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
    position: "relative", zIndex: 1,
  },
  levelWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
  levelHex: {
    width: 70, height: 70, borderRadius: 14,
    background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 0 24px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
  },
  levelNum: { fontFamily: "Rajdhani, sans-serif", fontSize: 32, fontWeight: 700, color: "#fff" },
  levelLabel: { fontFamily: "Rajdhani, sans-serif", fontSize: 10, color: "#6d28d9", letterSpacing: 3 },

  xpWrap: { flex: 1, minWidth: 160 },
  xpTopRow: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 },
  xpLabel: { fontFamily: "Rajdhani, sans-serif", fontSize: 11, color: "#6d28d9", letterSpacing: 2 },
  xpBigNum: { fontFamily: "Rajdhani, sans-serif", fontSize: 22, fontWeight: 700, color: "#e2e8f0" },
  xpBarBg: { background: "#0f0a1e", borderRadius: 99, height: 8, overflow: "visible", position: "relative", marginBottom: 6 },
  xpBarFill: { height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#4f46e5,#7c3aed,#a855f7)", transition: "width 1s ease", position: "relative", zIndex: 1 },
  xpBarGlow: { position: "absolute", top: -2, left: 0, height: 12, borderRadius: 99, background: "linear-gradient(90deg,#4f46e5,#7c3aed)", opacity: 0.3, filter: "blur(4px)", transition: "width 1s ease" },
  xpBottomRow: { display: "flex", justifyContent: "space-between" },
  xpSub: { fontSize: 11, color: "#334155", fontFamily: "Rajdhani, sans-serif" },
  xpRemain: { fontSize: 11, color: "#475569" },

  tokenWrap: {
    display: "flex", alignItems: "center", gap: 10,
    background: "rgba(120,53,15,0.2)", border: "1px solid rgba(120,53,15,0.4)",
    borderRadius: 12, padding: "10px 16px",
  },
  tokenCoin: { fontSize: 30, filter: "drop-shadow(0 0 6px #f59e0b)" },
  tokenNum: { fontFamily: "Rajdhani, sans-serif", fontSize: 26, fontWeight: 700, color: "#fbbf24" },
  tokenLabel: { fontFamily: "Rajdhani, sans-serif", fontSize: 10, color: "#78350f", letterSpacing: 2 },

  todayCard: {
    background: "linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(8,10,20,0.95) 100%)",
    border: "1px solid rgba(30,64,175,0.4)",
    borderRadius: 16, padding: "16px 20px", marginBottom: 10,
    boxShadow: "0 0 30px rgba(30,64,175,0.06), inset 0 1px 0 rgba(255,255,255,0.03)",
    position: "relative", zIndex: 1,
  },
  todayHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" },
  todayBadge: {
    fontFamily: "Rajdhani, sans-serif", fontSize: 13, fontWeight: 700,
    color: "#38bdf8", letterSpacing: 4,
    borderBottom: "2px solid #0ea5e9", paddingBottom: 2,
  },
  todayDateSmall: { fontSize: 11, color: "#334155" },
  allClearBadge: {
    fontFamily: "Rajdhani, sans-serif", fontSize: 11, letterSpacing: 2,
    color: "#10b981", background: "rgba(6,78,59,0.3)", border: "1px solid #065f46",
    borderRadius: 6, padding: "2px 10px",
  },

  statsRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  statCard: {
    flex: 1, minWidth: 100,
    background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,0.8)",
    borderRadius: 12, padding: "12px 14px",
  },
  statCardLabel: { fontSize: 11, color: "#475569", marginBottom: 6, fontFamily: "Rajdhani, sans-serif", letterSpacing: 1 },
  statCardVal: { display: "flex", alignItems: "baseline", marginBottom: 8 },
  statCardBig: { fontFamily: "Rajdhani, sans-serif", fontSize: 36, fontWeight: 700, lineHeight: 1 },
  statCardIcon: { fontSize: 22, marginTop: 4 },

  todoBarBg: { background: "#0f172a", borderRadius: 99, height: 6, overflow: "hidden", margin: "6px 0" },
  todoBarFill: { height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#0ea5e9,#22d3ee)", transition: "width 1s ease" },
  todoPct: { fontSize: 11, color: "#334155", textAlign: "right", fontFamily: "Rajdhani, sans-serif" },

  gaugeText: { marginTop: 12, fontSize: 13, color: "#64748b", textAlign: "center", fontFamily: "Rajdhani, sans-serif", letterSpacing: 2 },
  allClearMsg: {
    marginTop: 12, padding: "10px 16px",
    background: "linear-gradient(90deg, rgba(6,78,59,0.4), rgba(6,95,70,0.4))",
    border: "1px solid #10b981", borderRadius: 10,
    textAlign: "center", fontSize: 13, color: "#6ee7b7", fontWeight: 700,
  },

  footer: { fontSize: 11, color: "#1e293b", textAlign: "center", fontFamily: "Rajdhani, sans-serif", letterSpacing: 1, position: "relative", zIndex: 1 },
};

const globalCss = `
  * { box-sizing: border-box; }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @keyframes shimmer {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
  .pulse { animation: pulse 2s ease-in-out infinite; }
  .xpbar { animation: shimmer 3s ease-in-out infinite; }
  .todobar { animation: shimmer 2.5s ease-in-out infinite; }
`;
