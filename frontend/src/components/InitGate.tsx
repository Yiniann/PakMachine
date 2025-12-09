import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useInitStatus } from "../features/init/init";

type Props = {
  children: ReactNode;
};

const InitGate = ({ children }: Props) => {
  const location = useLocation();
  const status = useInitStatus();

  if (status.isLoading) {
    return <div className="p-6 text-center">正在检查系统状态...</div>;
  }
  if (status.error) {
    return (
      <div className="p-6 text-center text-error">
        检查系统状态失败，请稍后重试。
        <div className="text-sm text-base-content/70 mt-2">错误可能是后端未启动</div>
      </div>
    );
  }

  const initialized = status.data?.initialized;
  const isInitPage = location.pathname === "/init";

  if (!initialized && !isInitPage) {
    return <Navigate to="/init" replace />;
  }
  if (initialized && isInitPage) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default InitGate;
