import { AuthProvider } from "@/components/auth-provider";
import { RouterProvider, usePathname } from "@/lib/router";

import AdminPage from "@/app/admin/page";
import AuthorityPage from "@/app/authority/page";
import DashboardPage from "@/app/dashboard/page";
import ForgotPasswordPage from "@/app/forgot-password/page";
import HistoryPage from "@/app/history/page";
import IssuesPage from "@/app/issues/page";
import LoginPage from "@/app/login/page";
import MapPage from "@/app/map/page";
import RegisterPage from "@/app/register/page";

function RouteSwitch() {
  const pathname = usePathname();

  if (pathname === "/" || pathname === "/login") return <LoginPage />;
  if (pathname === "/register") return <RegisterPage />;
  if (pathname === "/forgot-password") return <ForgotPasswordPage />;
  if (pathname === "/dashboard") return <DashboardPage />;
  if (pathname === "/issues") return <IssuesPage />;
  if (pathname === "/history") return <HistoryPage />;
  if (pathname === "/map") return <MapPage />;
  if (pathname === "/authority") return <AuthorityPage />;
  if (pathname === "/admin") return <AdminPage />;

  return <LoginPage />;
}

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <RouteSwitch />
      </AuthProvider>
    </RouterProvider>
  );
}
