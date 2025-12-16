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
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body space-y-3">
        <h2 className="card-title">我的构建</h2>
        {artifacts.isLoading && <p>构建中，请稍等...</p>}
        {artifacts.error && <p className="text-error">加载失败</p>}
        {!artifacts.isLoading && artifacts.data && artifacts.data.length === 0 && <p>暂无构建记录</p>}
        {!artifacts.isLoading && artifacts.data && artifacts.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>模板文件</th>
                  <th>时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {artifacts.data.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td className="whitespace-pre-wrap break-all">{item.sourceFilename}</td>
                    <td>{new Date(item.createdAt).toLocaleString()}</td>
                    <td>
                      <button className="btn btn-sm" onClick={() => onDownload(item)}>
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
  );
};

export default TemplateDownloadsPage;
