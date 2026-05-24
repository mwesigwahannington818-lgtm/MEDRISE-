import { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/lib/auth";
import { Spinner } from "@/components/ui/spinner";

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo: string;
  allowedRoles?: string[];
  requirePatient?: boolean;
}

export function ProtectedRoute({
  children,
  redirectTo,
  allowedRoles,
  requirePatient = false,
}: ProtectedRouteProps) {
  const { adminUser, isAdminLoading, patientSession } = useAuth();

  if (requirePatient) {
    if (!patientSession) {
      return <Redirect to={redirectTo} />;
    }
    return <>{children}</>;
  }

  if (isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!adminUser) {
    return <Redirect to={redirectTo} />;
  }

  if (allowedRoles && !allowedRoles.includes(adminUser.role ?? "")) {
    return <Redirect to={redirectTo} />;
  }

  return <>{children}</>;
}
