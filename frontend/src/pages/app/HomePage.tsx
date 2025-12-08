import { FormEvent, useState } from "react";
import { useSiteName, useSetSiteName } from "../../features/uploads/siteName";

const HomePage = () => {
  const siteNameQuery = useSiteName();
  const setSiteNameMutation = useSetSiteName();
  const [input, setInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const siteName = siteNameQuery.data?.siteName || null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSiteNameMutation.mutate(
      { siteName: input },
      {
        onSuccess: (data) => {
          setMessage(`站点名称已设置为：${data.siteName}`);
          siteNameQuery.refetch();
        },
        onError: (err: any) => setMessage(err?.response?.data?.error || "设置失败"),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body space-y-3">
          <h2 className="card-title">主题打包机</h2>
          <p className="text-base-content/70">
            欢迎使用主题打包机！这是一个帮助您轻松打包和管理网站主题的工具。请首先设置您的站点名称，以便我们为您提供个性化的服务。
          </p>

          {siteNameQuery.isLoading && <p>加载站点名称...</p>}
          {siteName ? (
            <>
              <div className="alert flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-semibold">站点名称</span>
                <span className="badge badge-lg badge-outline">{siteName}</span>
              </div>
              <p className="text-xs text-base-content/70">如需更改站点名请联系管理员</p>
            </>
          ) : (
            <div className="space-y-2">
              <div className="alert">
                <span>在前端构建前输入你的站点名，用于打包后主题的站点名称和标题，后续无法修改。如需更改请联系管理员。</span>
              </div>
              <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 items-start">
                <input
                  className="input input-bordered w-full sm:w-auto flex-1"
                  placeholder="站点名称"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={setSiteNameMutation.status === "pending"}
                />
                <button className="btn btn-primary" type="submit" disabled={!input.trim() || setSiteNameMutation.status === "pending"}>
                  {setSiteNameMutation.status === "pending" ? "提交中..." : "设置"}
                </button>
              </form>
               <p className="text-sm text-base-content/70">
                确认无误后提交，一旦保存不可修改。
              </p>
            </div>
          )}
          {message && <p className="text-info">{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
