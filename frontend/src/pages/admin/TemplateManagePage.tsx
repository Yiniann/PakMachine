import { FormEvent, useState } from "react";
import { useCreateGithubTemplate, useDeleteGithubTemplate } from "../../features/builds/mutations";
import { useGithubTemplates } from "../../features/builds/queries";

const TemplateManagePage = () => {
  const [ghName, setGhName] = useState("");
  const [ghRepo, setGhRepo] = useState("");
  const [ghBranch, setGhBranch] = useState("main");
  const [ghWorkdir, setGhWorkdir] = useState("");
  const [ghDescription, setGhDescription] = useState("");
  const [ghMessage, setGhMessage] = useState<string | null>(null);
  const [ghError, setGhError] = useState<string | null>(null);

  const createGithubTemplate = useCreateGithubTemplate();
  const deleteGithubTemplate = useDeleteGithubTemplate();
  const githubTemplates = useGithubTemplates();

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
      <div>
        <h2 className="text-3xl font-bold">模板管理</h2>
        <p className="text-base-content/70 mt-1">配置 GitHub 私有仓库作为构建模板</p>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body space-y-4">
          <h3 className="card-title text-lg">添加新模板</h3>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onSubmitGithub}>
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

        <div className="divider my-4" />

        <h3 className="card-title text-lg">模板列表</h3>
        {githubTemplates.isLoading && <div className="flex justify-center"><span className="loading loading-spinner" /></div>}
        {githubTemplates.error && <div role="alert" className="alert alert-error"><span>加载失败</span></div>}
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
                  <th>创建时间</th>
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
                    <td className="text-sm">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}</td>
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
    </div>
  );
};

export default TemplateManagePage;
