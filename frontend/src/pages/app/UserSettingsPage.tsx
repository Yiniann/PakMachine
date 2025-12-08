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
    <div className="max-w-xl space-y-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body space-y-3">
          <h2 className="card-title">账户设置</h2>
          <p className="text-sm text-base-content/70">修改登录密码，保障账户安全。</p>
          <form className="space-y-3" onSubmit={onSubmit}>
            <label className="form-control">
              <span className="label-text">当前密码</span>
              <input
                type="password"
                className="input input-bordered"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
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
              />
            </label>
            <div className="flex gap-2">
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? "提交中..." : "保存"}
              </button>
            </div>
            {message && <p className="text-success">{message}</p>}
            {error && <p className="text-error">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsPage;
