// This page is no longer used — the app routes through Landing, Auth, and AppPage.
// Kept as a redirect for backwards compatibility.
import { Navigate } from "react-router-dom";

const Index = () => <Navigate to="/" replace />;

export default Index;
