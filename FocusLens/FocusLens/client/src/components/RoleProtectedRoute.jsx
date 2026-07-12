import { Navigate } from "react-router-dom";

function RoleProtectedRoute({ children, role }) {

    const token = localStorage.getItem("token");

    const user = JSON.parse(localStorage.getItem("user"));

    if (!token) {
        return <Navigate to="/" replace />;
    }

    if (!user || user.role !== role) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default RoleProtectedRoute;