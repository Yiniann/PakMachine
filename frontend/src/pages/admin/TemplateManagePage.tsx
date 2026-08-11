import { FormEvent, useMemo, useState } from "react";
import { useCreateGithubTemplate, useDeleteGithubTemplate } from "../../features/builds/mutations";
import { useGithubTemplates } from "../../features/builds/queries";

type TemplatePurpose = "web" | "client";

const purposeLabels: Record<TemplatePurpose, string> = {
  web: "Web 模板",
  client: "客户端模板",
};

const defaultWorkflowFiles: Record<TemplatePurpose, string> = {
  web: "package.yml",
  client: "package-client.yml",
};

const TemplateManagePage = () => {
  const [purpose, setPurpose] = useState<TemplatePurpose>("web");
  const [ghName, setGhName] = useState("");
  const [ghRepo, setGhRepo] = useState("");
  const [ghBranch, setGhBranch] = useState("main");
  const [ghWorkdir, setGhWorkdir] = useState("");
  const [ghWorkflowFile, setGhWorkflowFile] = useState(defaultWorkflowFiles.web);
  const [ghDescription, setGhDescription] = useState("");
  const [ghMessage, setGhMessage] = useState<string | null>(null);
  const [ghError, setGhError] = useState<string | null>(null);

  const createGithubTemplate = useCreateGithubTemplate();
  const deleteGithubTemplate = useDeleteGithubTemplate();
  const githubTemplates = useGithubTemplates();
  const visibleTemplates = useMemo(
    () => (githubTemplates.data ?? []).filter((item) => item.purpose === purpose),
    [githubTemplates.data, purpose],
  );
  const hasPurposeTemplate = (githubTemplates.data ?? []).some((item) => item.purpose === purpose);

  const selectPurpose = (nextPurpose: TemplatePurpose) => {
    setPurpose(nextPurpose);
    setGhWorkflowFile(defaultWorkflowFiles[nextPurpose]);
    setGhMessage(null);
    setGhError(null);
  };

  const onSubmitGithub = (e: FormEvent) => {
    e.preventDefault();
    setGhMessage(null);
    setGhError(null);
    const payload = {
      name: ghName.trim(),
      purpose,
      repo: ghRepo.trim(),
      branch: ghBranch.trim() || "main",
      workdir: purpose === "web" ? ghWorkdir.trim() : "",
      workflowFile: ghWorkflowFile.trim() || defaultWorkflowFiles[purpose],
      description: ghDescription.trim(),
    };
    if (!payload.name || !payload.repo) {
      setGhError("名称和仓库地址不能为空");
      return;
    }
    createGithubTemplate.mutate(payload, {
      onSuccess: () => {
        setGhMessage(`已添加${purposeLabels[purpose]}`);
        setGhName("");
        setGhRepo("");
        setGhBranch("main");
        setGhWorkdir("");
        setGhWorkflowFile(defaultWorkflowFiles[purpose]);
        setGhDescription("");
        githubTemplates.refetch();
      },
      onError: (err: any) => setGhError(err?.response?.data?.error || "添加失败，请稍后再试"),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="workspace-kicker">Templates</p>
        <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-900">模板管理</h2>
        <p className="mt-2 text-[15px] text-slate-500">分别配置 Web 与客户端的 GitHub 构建模板。</p>
      </div>

      <div className="inline-flex w-full max-w-md rounded-lg bg-slate-100 p-1" role="tablist" aria-label="模板类型">
        {(["web", "client"] as TemplatePurpose[]).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={purpose === item}
            className={`min-h-10 flex-1 rounded-md px-4 text-sm font-semibold transition ${
              purpose === item ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
            onClick={() => selectPurpose(item)}
          >
            {purposeLabels[item]}
          </button>
        ))}
      </div>

      <div className="workspace-card p-6">
        <div className="space-y-4">
          <h3 className="text-xl font-bold tracking-[-0.03em] text-slate-900">添加{purposeLabels[purpose]}</h3>
          {hasPurposeTemplate && (
            <div role="status" className="workspace-alert border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
              当前已有{purposeLabels[purpose]}，请先删除后再添加新模板。
            </div>
          )}
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={onSubmitGithub}>
            <label className="form-control">
              <span className="label-text">模板名称*</span>
              <input className="workspace-input input input-bordered" value={ghName} onChange={(e) => setGhName(e.target.value)} placeholder={purpose === "web" ? "web-production" : "client-production"} />
            </label>
            <label className="form-control">
              <span className="label-text">仓库（owner/repo）*</span>
              <input className="workspace-input input input-bordered" value={ghRepo} onChange={(e) => setGhRepo(e.target.value)} placeholder="ShuttleITS/MAShuttle" />
            </label>
            <label className="form-control">
              <span className="label-text">分支/Tag</span>
              <input className="workspace-input input input-bordered" value={ghBranch} onChange={(e) => setGhBranch(e.target.value)} placeholder="main" />
            </label>
            <label className="form-control">
              <span className="label-text">Workflow 文件名</span>
              <input className="workspace-input input input-bordered" value={ghWorkflowFile} onChange={(e) => setGhWorkflowFile(e.target.value)} placeholder={defaultWorkflowFiles[purpose]} />
            </label>
            {purpose === "web" && (
              <label className="form-control md:col-span-2">
                <span className="label-text">子目录（可选）</span>
                <input className="workspace-input input input-bordered" value={ghWorkdir} onChange={(e) => setGhWorkdir(e.target.value)} placeholder="apps/web" />
              </label>
            )}
            <label className="form-control md:col-span-2">
              <span className="label-text">描述（可选）</span>
              <textarea
                className="workspace-textarea textarea textarea-bordered"
                rows={2}
                value={ghDescription}
                onChange={(e) => setGhDescription(e.target.value)}
                placeholder="模板说明"
              />
            </label>
            <div className="flex flex-wrap items-center gap-3 md:col-span-2">
              <button
                className="landing-button-primary rounded-lg px-5 py-3 text-sm"
                type="submit"
                disabled={createGithubTemplate.status === "pending" || hasPurposeTemplate}
              >
                {createGithubTemplate.status === "pending" ? "提交中..." : `添加${purposeLabels[purpose]}`}
              </button>
              {ghMessage && <span className="text-success">{ghMessage}</span>}
              {ghError && <span className="text-error">{ghError}</span>}
            </div>
          </form>

          <div className="divider my-4" />

          <h3 className="text-xl font-bold tracking-[-0.03em] text-slate-900">{purposeLabels[purpose]}列表</h3>
          {githubTemplates.isLoading && <div className="flex justify-center"><span className="loading loading-spinner" /></div>}
          {githubTemplates.error && <div role="alert" className="workspace-alert border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700"><span>加载失败</span></div>}
          {!githubTemplates.isLoading && !githubTemplates.error && visibleTemplates.length === 0 && <p>暂无{purposeLabels[purpose]}</p>}
          {!githubTemplates.isLoading && visibleTemplates.length > 0 && (
            <div className="workspace-table-shell overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>名称</th>
                    <th>仓库</th>
                    <th>分支</th>
                    <th>Workflow</th>
                    {purpose === "web" && <th>子目录</th>}
                    <th>描述</th>
                    <th>创建时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTemplates.map((item) => (
                    <tr key={item.name}>
                      <td className="whitespace-pre-wrap break-all font-semibold">{item.name}</td>
                      <td className="whitespace-pre-wrap break-all text-sm text-base-content/80">{item.repo}</td>
                      <td className="text-sm">{item.branch || "main"}</td>
                      <td className="whitespace-nowrap text-sm">{item.workflowFile || defaultWorkflowFiles[item.purpose]}</td>
                      {purpose === "web" && <td className="whitespace-pre-wrap break-all text-sm">{item.workdir || "-"}</td>}
                      <td className="max-w-xs whitespace-pre-wrap break-words text-sm text-base-content/80">{item.description || "-"}</td>
                      <td className="text-sm">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}</td>
                      <td>
                        <button
                          className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white"
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
