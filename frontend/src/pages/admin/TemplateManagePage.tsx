import { FormEvent, useMemo, useRef, useState } from "react";
import { useUploadTemplate, useDeleteTemplate, useRenameTemplate } from "../../features/uploads/mutations";
import { useTemplateFiles } from "../../features/uploads/queries";

const allowed = [".zip", ".tar.gz", ".tgz", ".tar", ".gz"];

const TemplateManagePage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const mutation = useUploadTemplate();
  const deleteMutation = useDeleteTemplate();
  const renameMutation = useRenameTemplate();
  const templates = useTemplateFiles();

  const tooBig = false;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!file) {
      setError("请选择要上传的压缩包");
      return;
    }
    if (tooBig) {
      setError("文件过大，限制 50MB");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    mutation.mutate(form, {
      onSuccess: (data) => {
        setMessage(`上传成功：${data.originalName || data.filename} (${(data.size / 1024 / 1024).toFixed(1)} MB)`);
        setFile(null);
        if (inputRef.current) inputRef.current.value = "";
        templates.refetch();
      },
      onError: (err: any) => setError(err?.response?.data?.error || "上传失败，请稍后再试"),
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card bg-base-100 shadow-xl lg:col-span-1">
          <div className="card-body space-y-3">
            <h2 className="card-title">上传模板</h2>
            <p className="text-sm text-base-content/70">支持 zip / tar.gz / tgz。</p>
            <form onSubmit={onSubmit} className="space-y-3">
              <input
                type="file"
                accept={allowed.join(",")}
                className="file-input file-input-bordered w-full"
                ref={inputRef}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file && (
                <div className="text-sm text-base-content/70">
                  选择了：{file.name}（{(file.size / 1024 / 1024).toFixed(1)} MB）
                </div>
              )}
              {tooBig && <p className="text-error text-sm">文件超过限制</p>}
              <button type="submit" className="btn btn-primary w-full" disabled={mutation.status === "pending"}>
                {mutation.status === "pending" ? "上传中..." : "开始上传"}
              </button>
            </form>
            {message && <p className="text-success">{message}</p>}
            {error && <p className="text-error">{error}</p>}
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl lg:col-span-2">
          <div className="card-body space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="card-title">模板列表</h2>
              <div className="text-sm text-base-content/70">点击行内操作可重命名或删除</div>
            </div>

            {templates.isLoading && <p>加载中...</p>}
            {templates.error && <p className="text-error">加载失败</p>}
            {!templates.isLoading && templates.data && templates.data.length === 0 && <p>暂无文件</p>}
            {!templates.isLoading && templates.data && templates.data.length > 0 && (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>文件名</th>
                      <th>大小</th>
                      <th>修改时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.data.map((item) => (
                      <tr key={item.filename}>
                        <td className="whitespace-pre-wrap break-all">{item.filename}</td>
                        <td>{(item.size / 1024 / 1024).toFixed(2)} MB</td>
                        <td>{new Date(item.modifiedAt).toLocaleString()}</td>
                        <td className="space-y-2">
                          <div className="flex flex-wrap gap-2 items-center">
                            <button
                              className="btn btn-sm"
                              onClick={() => {
                                setRenameTarget(item.filename);
                                setRenameValue(item.filename);
                              }}
                            >
                              重命名
                            </button>
                            <button className="btn btn-sm btn-error text-white" onClick={() => setDeleteTarget(item.filename)}>
                              删除
                            </button>
                          </div>
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

    {/* Rename modal */}
    {renameTarget && (
      <div className="modal modal-open">
        <div className="modal-box">
          <h3 className="font-bold text-lg">重命名文件</h3>
          <p className="py-2 text-sm text-base-content/70 break-all">当前文件：{renameTarget}</p>
            <input
              className="input input-bordered w-full"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="输入新文件名"
            />
            <div className="modal-action">
              <button className="btn" onClick={() => setRenameTarget(null)}>
                取消
              </button>
              <button
                className="btn btn-primary"
                disabled={renameMutation.status === "pending"}
                onClick={() => {
                  const newName = renameValue.trim();
                  if (!newName) return setError("新文件名不能为空");
                  renameMutation.mutate(
                    { filename: renameTarget, newName },
                    {
                      onSuccess: () => {
                        setRenameTarget(null);
                        setRenameValue("");
                        templates.refetch();
                      },
                      onError: (err: any) => setError(err?.response?.data?.error || "重命名失败"),
                    },
                  );
                }}
              >
                {renameMutation.status === "pending" ? "提交中..." : "确认"}
              </button>
          </div>
        </div>
      </div>
    )}

    {/* Delete modal */}
    {deleteTarget && (
      <div className="modal modal-open">
        <div className="modal-box">
            <h3 className="font-bold text-lg">删除文件</h3>
            <p className="py-2 text-sm text-base-content/70 break-all">确认删除：{deleteTarget}？该操作不可恢复。</p>
            <div className="modal-action">
              <button className="btn" onClick={() => setDeleteTarget(null)}>
                取消
              </button>
              <button
                className="btn btn-error text-white"
                disabled={deleteMutation.status === "pending"}
                onClick={() =>
                  deleteMutation.mutate(deleteTarget, {
                    onSuccess: () => setDeleteTarget(null),
                    onError: (err: any) => setError(err?.response?.data?.error || "删除失败"),
                  })
                }
              >
                {deleteMutation.status === "pending" ? "删除中..." : "确认删除"}
              </button>
            </div>
        </div>
      </div>
    )}

    </div>
  );
};

export default TemplateManagePage;
