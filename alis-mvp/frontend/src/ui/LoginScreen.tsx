import { useEffect, useRef, useState } from "react";
import { login, ApiError, type Me } from "../api/client";

// 登录门（管理员/促进者两级）。账号由管理员后台统一建号发放，不开放自助注册。
// 本屏为唯一身份门（Phase B 已摘除 nginx 外层 BasicAuth）；应用层认证，数据按账号归集。
//
// v3.11 事故 2 修复（部分设备登录失败）：
// 1. 输入法防护：用户名/密码框加 autoCapitalize/autoCorrect/spellCheck（防 iOS 首字母大写）
// 2. 显示密码按钮：用户可自查全角字符/多余空格/联想残留（田野排障最高效路径）
// 3. 429 倒计时：读 Retry-After 头显示剩余秒数 + 按钮禁用（不误导为"密码错"）
// 4. 全角/半角提示：401 文案说明自查路径；空格检测（提示不自动 trim）
export function LoginScreen({ onAuthed }: { onAuthed: (me: Me) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [visible, setVisible] = useState(false); // 显示密码
  const [cooldown, setCooldown] = useState(0); // 429 倒计时秒数
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // 429 倒计时：每秒递减，归零清除（卸载 cleanup 防泄漏）
  useEffect(() => {
    if (cooldown <= 0) return;
    cooldownTimer.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (cooldownTimer.current) clearInterval(cooldownTimer.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    };
  }, [cooldown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSubmit =
    username.trim().length > 0 && password.length > 0 && !busy && cooldown <= 0;

  async function handleLogin() {
    if (!canSubmit) return;
    // v3.11: 密码首尾空格检测（提示不自动 trim——避免误改真实密码）
    if (password !== password.trim()) {
      setErr("密码包含首尾空格。若这是密码的一部分请忽略，否则请删除空格后重试。");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const me = await login(username.trim(), password);
      setVisible(false); // 提交成功复位显示密码
      onAuthed(me);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setErr("账号或密码不正确。请确认账号为英文半角、密码区分大小写（全角Ａ≠A、中文键盘的。≠.）。");
      } else if (e instanceof ApiError && e.status === 429) {
        // v3.11: 读 Retry-After 头显示倒计时（不误导为密码错）
        const secs = e.retryAfter ?? 60;
        setCooldown(secs);
        setErr(`登录太频繁了，请等待 ${secs} 秒后再试。若多台设备共用网络，可能是他人连续输错导致，换个 WiFi 更保险。`);
      } else {
        setErr(`无法登录（${String(e)}）。请确认服务已启动。`);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-viewport">
      <div className="auth-shell">
        {/* 品牌区：卡片之上的 ALIS 字标 + 中文副标 */}
        <div className="auth-brand">
          <div className="auth-wordmark">ALIS</div>
          <div className="auth-subtitle">AI 素养情境化访谈</div>
        </div>

        {/* 登录卡片 */}
        <div className="auth-card">
          <h1 className="auth-heading">登录</h1>

          <div className="auth-field">
            <label className="auth-label" htmlFor="username">
              账号
            </label>
            <input
              id="username"
              className="auth-input"
              type="text"
              autoComplete="username"
              autoCapitalize="none" // v3.11: 防 iOS 首字母大写（fac01 → Fac01 登录失败）
              autoCorrect="off"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canSubmit && handleLogin()}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">
              密码
            </label>
            <div className="auth-password-wrap">
              <input
                id="password"
                className="auth-input auth-input-password"
                type={visible ? "text" : "password"}
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="请输入管理员发放的密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canSubmit && handleLogin()}
              />
              {/* v3.11: 显示密码按钮（自查全角/空格/联想残留）——
                  原生 button 保持 tab 序；aria-label 随状态动态；onMouseDown 防抢焦点 */}
              <button
                type="button"
                className="auth-toggle"
                aria-label={visible ? "隐藏密码" : "显示密码"}
                aria-pressed={visible}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setVisible((v) => !v)}
              >
                {visible ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            className="auth-submit"
            disabled={!canSubmit}
            onClick={handleLogin}
          >
            {busy ? "正在登录…" : cooldown > 0 ? `请等待 ${cooldown} 秒后重试` : "登录"}
          </button>

          {/* 错误提示区：常驻 DOM，供读屏软件播报 */}
          <div className="auth-alert" aria-live="polite">
            {err && <div className="auth-error">{err}</div>}
            {cooldown > 0 && (
              <div className="auth-hint">尝试次数较多，稍等会自动恢复。多台设备共用网络时，可能是他人连续输错导致。</div>
            )}
          </div>
        </div>

        {/* 卡片下方脚注 */}
        <p className="auth-footer">账号由管理员统一分配 · 内部灰度测试</p>
      </div>
    </div>
  );
}
