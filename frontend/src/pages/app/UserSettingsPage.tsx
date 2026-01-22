import { FormEvent, useState } from "react";
import api from "../../api/client";

const UserSettingsPage = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (newPassword !== confirm) {
      setError("两次输入的新密码不一致");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/auth/change-password", { currentPassword, newPassword });
      setMessage(res.data?.message || "密码已更新");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err: any) {
      setError(err?.response?.data?.error || "修改失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">账户设置</h2>
        <p className="text-base-content/70 mt-1">管理您的个人账户信息与安全设置。</p>
      </div>

      <div className="card bg-base-100 shadow-xl border border-base-200 max-w-2xl">
        <div className="card-body">
          <div className="flex items-center gap-2 border-b border-base-200 pb-3 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            <h3 className="font-bold text-lg">修改密码</h3>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <label className="form-control">
              <span className="label-text">当前密码</span>
              <input
                type="password"
                className="input input-bordered"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="请输入当前使用的密码"
              />
            </label>
            <label className="form-control">
              <span className="label-text">新密码</span>
              <input
                type="password"
                className="input input-bordered"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="请输入新密码（至少 8 位）"
              />
            </label>
            <label className="form-control">
              <span className="label-text">确认新密码</span>
              <input
                type="password"
                className="input input-bordered"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="请再次输入新密码"
              />
            </label>

            {message && (
              <div role="alert" className="alert alert-success bg-success/10 text-success-content border-success/20 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{message}</span>
              </div>
            )}
            {error && (
              <div role="alert" className="alert alert-error bg-error/10 text-error-content border-error/20 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button className="btn btn-primary min-w-[120px] shadow-lg shadow-primary/30" type="submit" disabled={submitting}>
                {submitting ? "提交中..." : "保存"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsPage;
