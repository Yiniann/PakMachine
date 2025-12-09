import { FormEvent, useRef, useState } from "react";
import { useUploadTemplate, useDeleteTemplate, useRenameTemplate, useCreateGithubTemplate, useDeleteGithubTemplate } from "../../features/builds/mutations";
import { useGithubTemplates, useTemplateFiles } from "../../features/builds/queries";

const allowed = [".zip", ".tar.gz", ".tgz", ".tar", ".gz"];

const TemplateManagePage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [ghName, setGhName] = useState("");
  const [ghRepo, setGhRepo] = useState("");
  const [ghBranch, setGhBranch] = useState("main");
  const [ghWorkdir, setGhWorkdir] = useState("");
  const [ghDescription, setGhDescription] = useState("");
  const [ghMessage, setGhMessage] = useState<string | null>(null);
  const [ghError, setGhError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const mutation = useUploadTemplate();
  const deleteMutation = useDeleteTemplate();
  const renameMutation = useRenameTemplate();
  const createGithubTemplate = useCreateGithubTemplate();
  const deleteGithubTemplate = useDeleteGithubTemplate();
  const templates = useTemplateFiles();
  const githubTemplates = useGithubTemplates();
  const uploadTemplates = templates.data?.filter((t) => (t.type ?? "upload") === "upload");

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
    if (description.trim()) {
      form.append("description", description.trim());
    }
    mutation.mutate(form, {
      onSuccess: (data) => {
        setMessage(`上传成功：${data.originalName || data.filename} (${(data.size / 1024 / 1024).toFixed(1)} MB)`);
        setFile(null);
        setDescription("");
        if (inputRef.current) inputRef.current.value = "";
        templates.refetch();
      },
      onError: (err: any) => setError(err?.response?.data?.error || "上传失败，请稍后再试"),
    });
  };

  const onSubmitGithub = (e: FormEvent) => {
    e.preventDefault();
    setGhMessage(null);
    setGhError(null);
    const payload = {
      name: ghName.trim(),
      repo: ghRepo.trim(),
      branch: ghBranch.trim() || "main",
      workdir: ghWorkdir.trim(),
      description: ghDescription.trim(),
    };
    if (!payload.name || !payload.repo) {
      setGhError("名称和仓库地址不能为空");
      return;
    }
    createGithubTemplate.mutate(payload, {
      onSuccess: () => {
        setGhMessage("已添加 GitHub 模板");
        setGhName("");
        setGhRepo("");
        setGhBranch("main");
        setGhWorkdir("");
        setGhDescription("");
        githubTemplates.refetch();
      },
      onError: (err: any) => setGhError(err?.response?.data?.error || "添加失败，请稍后再试"),
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
              <label className="form-control">
                <span className="label-text">模板描述（可选）</span>
                <textarea
                  className="textarea textarea-bordered"
                  placeholder="用一句话说明这个模板的用途或特点"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </label>
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
            {!templates.isLoading && uploadTemplates && uploadTemplates.length === 0 && <p>暂无文件</p>}
            {!templates.isLoading && uploadTemplates && uploadTemplates.length > 0 && (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>来源</th>
                      <th>文件名</th>
                      <th>描述</th>
                      <th>修改时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadTemplates.map((item) => (
                      <tr key={item.filename}>
                        <td className="text-sm">本地上传</td>
                        <td className="whitespace-pre-wrap break-all">{item.filename}</td>
                        <td className="max-w-xs whitespace-pre-wrap break-words text-sm text-base-content/80">{item.description || "-"}</td>
                        <td>{item.modifiedAt ? new Date(item.modifiedAt).toLocaleString() : "-"}</td>
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

    <div className="card bg-base-100 shadow-xl">
      <div className="card-body space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="card-title">GitHub 模板（私有仓库）</h2>
          <div className="text-sm text-base-content/70">仅管理员可配置，用户端不会看到仓库信息</div>
        </div>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={onSubmitGithub}>
          <label className="form-control">
            <span className="label-text">模板名称*</span>
            <input className="input input-bordered" value={ghName} onChange={(e) => setGhName(e.target.value)} placeholder="示例：dashboard-template" />
          </label>
          <label className="form-control">
            <span className="label-text">仓库（owner/repo）*</span>
            <input className="input input-bordered" value={ghRepo} onChange={(e) => setGhRepo(e.target.value)} placeholder="org/project" />
          </label>
          <label className="form-control">
            <span className="label-text">分支/Tag</span>
            <input className="input input-bordered" value={ghBranch} onChange={(e) => setGhBranch(e.target.value)} placeholder="main" />
          </label>
          <label className="form-control">
            <span className="label-text">子目录（可选）</span>
            <input className="input input-bordered" value={ghWorkdir} onChange={(e) => setGhWorkdir(e.target.value)} placeholder="packages/webapp" />
          </label>
          <label className="form-control md:col-span-2">
            <span className="label-text">描述（可选）</span>
            <textarea
              className="textarea textarea-bordered"
              rows={2}
              value={ghDescription}
              onChange={(e) => setGhDescription(e.target.value)}
              placeholder="用一句话介绍模板"
            />
          </label>
          <div className="md:col-span-2 flex flex-wrap gap-2">
            <button className="btn btn-primary" type="submit" disabled={createGithubTemplate.status === "pending"}>
              {createGithubTemplate.status === "pending" ? "提交中..." : "添加 GitHub 模板"}
            </button>
            {ghMessage && <span className="text-success">{ghMessage}</span>}
            {ghError && <span className="text-error">{ghError}</span>}
          </div>
        </form>

        <div className="divider" />

        {githubTemplates.isLoading && <p>加载中...</p>}
        {githubTemplates.error && <p className="text-error">加载失败</p>}
        {!githubTemplates.isLoading && githubTemplates.data && githubTemplates.data.length === 0 && <p>暂无 GitHub 模板</p>}
        {!githubTemplates.isLoading && githubTemplates.data && githubTemplates.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>名称</th>
                  <th>仓库</th>
                  <th>分支</th>
                  <th>子目录</th>
                  <th>描述</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {githubTemplates.data.map((item) => (
                  <tr key={item.name}>
                    <td className="whitespace-pre-wrap break-all font-semibold">{item.name}</td>
                    <td className="whitespace-pre-wrap break-all text-sm text-base-content/80">{item.repo}</td>
                    <td className="text-sm">{item.branch || "main"}</td>
                    <td className="text-sm whitespace-pre-wrap break-all">{item.workdir || "-"}</td>
                    <td className="max-w-xs whitespace-pre-wrap break-words text-sm text-base-content/80">{item.description || "-"}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-error text-white"
                        disabled={deleteGithubTemplate.status === "pending"}
                        onClick={() =>
                          deleteGithubTemplate.mutate(item.name, {
                            onError: (err: any) => setGhError(err?.response?.data?.error || "删除失败"),
                            onSuccess: () => githubTemplates.refetch(),
                          })
                        }
                      >
                        删除
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
