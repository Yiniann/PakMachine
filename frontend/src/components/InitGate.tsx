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
    return (
      <div className="modal modal-open">
        <div className="modal-box text-center">
          <div className="flex flex-col items-center gap-3">
            <span className="loading loading-spinner loading-lg" />
            <p className="text-base-content/80">正在加载，请稍候...</p>
          </div>
        </div>
      </div>
    );
  }
  if (status.error) {
    return (
      <div className="modal modal-open">
        <div className="modal-box text-center">
          <p className="text-error">加载失败，请稍后重试。</p>
        </div>
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
