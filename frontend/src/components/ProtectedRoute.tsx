import { Navigate, Outlet, useLocation } from "react-router-dom";

const ProtectedRoute = () => {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
