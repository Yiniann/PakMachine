import { Artifact, useArtifacts } from "../../features/builds/artifacts";
import api from "../../api/client";

const TemplateDownloadsPage = () => {
  const artifacts = useArtifacts();

  const onDownload = async (item: Artifact) => {
    try {
      const res = await api.get(`/build/download/${item.id}`, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = item.sourceFilename;
      a.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.error ||
        (status === 401
          ? "请先登录后再下载"
          : status === 403
            ? "无权下载此文件"
            : status === 404
              ? "文件不存在或已被清理"
              : "下载失败，请稍后再试");
      alert(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">构建历史</h2>
        <p className="text-base-content/70 mt-1">查看并下载您生成的站点前端产物。</p>
      </div>

      <div className="card bg-base-100 shadow-xl border border-base-200">
        <div className="card-body">
          <div className="flex items-center justify-between mb-2">
            <h3 className="card-title text-lg">历史记录</h3>
          </div>

          {artifacts.isLoading && (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          )}

          {artifacts.error && (
            <div role="alert" className="alert alert-error">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>加载失败，请稍后重试</span>
            </div>
          )}

          {!artifacts.isLoading && artifacts.data && artifacts.data.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-base-content/50">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 opacity-20"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
              <p>暂无构建记录</p>
            </div>
          )}

          {!artifacts.isLoading && artifacts.data && artifacts.data.length > 0 && (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th className="w-20">ID</th>
                    <th>模板文件</th>
                    <th>构建时间</th>
                    <th className="w-24 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {artifacts.data.map((item) => (
                    <tr key={item.id} className="hover">
                      <td className="font-mono text-xs opacity-70">#{item.id}</td>
                      <td className="font-medium whitespace-pre-wrap break-all">{item.sourceFilename}</td>
                      <td className="text-sm text-base-content/70">{new Date(item.createdAt).toLocaleString()}</td>
                      <td className="text-right">
                        <button className="btn btn-sm btn-primary btn-outline gap-2" onClick={() => onDownload(item)}>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                          下载
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateDownloadsPage;
