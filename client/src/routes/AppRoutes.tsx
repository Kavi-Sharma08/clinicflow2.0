import { Route, Routes } from "react-router-dom";
import {
  UNPROTECTED_ROUTES,
  PATIENT_DASHBOARD_ROUTE,
  ONBOARDING_ROUTES,
  ADMIN_ROUTES,
  DOCTOR_ROUTES,
  NotFound,
  AuthenticatedNotFound,
} from "./routes.config";
import RouteWrapper from "./RoutesWrapper";
import ProtectedRoute from "./ProtectedRoute";
import OnboardingRoute from "./onBoardingRoute";
import AdminRoute from "./AdminRoutes";

const AppRoutes = () => {
  return (
    <Routes>
      {/* ─── Public Unprotected Routes ──────────────────────────────── */}
      {UNPROTECTED_ROUTES.map(({ path, title, component }) => (
        <Route
          key={path}
          path={path}
          element={<RouteWrapper component={component} title={title} />}
        />
      ))}

      {/* ─── Onboarding Routes ───────────────────────────────────────── */}
      {ONBOARDING_ROUTES.map(({ path, title, component, destination }) => (
        <Route
          key={path}
          path={path}
          element={
            <OnboardingRoute destination={destination}>
              <RouteWrapper component={component} title={title} />
            </OnboardingRoute>
          }
        />
      ))}

      {/* ─── Doctor Protected Routes ─────────────────────────────────── */}
      <Route
        path={DOCTOR_ROUTES.path}
        element={
          <ProtectedRoute allowedRoles={["DOCTOR"]}>
            <RouteWrapper
              component={DOCTOR_ROUTES.component}
              title={DOCTOR_ROUTES.title}
            />
          </ProtectedRoute>
        }
      >
        {DOCTOR_ROUTES.children.map((subLayout) => (
          <Route
            key={subLayout.id}
            path={subLayout.path}
            element={
              <RouteWrapper
                component={subLayout.component}
                title={subLayout.title}
              />
            }
          >
            {subLayout.children?.map((page) => (
              <Route
                key={page.id}
                path={page.path}
                element={
                  <RouteWrapper
                    component={page.component}
                    title={page.title}
                  />
                }
              />
            ))}
          </Route>
        ))}
        {/* Doctor In-Shell Catch-all */}
        <Route
          path="*"
          element={<RouteWrapper component={AuthenticatedNotFound} title="Page Not Found | ClinicFlow" />}
        />
      </Route>

      {/* ─── Patient Protected Routes ────────────────────────────────── */}
      <Route
        path={PATIENT_DASHBOARD_ROUTE.path}
        element={
          <ProtectedRoute allowedRoles={["PATIENT"]}>
            <RouteWrapper
              component={PATIENT_DASHBOARD_ROUTE.component}
              title={PATIENT_DASHBOARD_ROUTE.title}
            />
          </ProtectedRoute>
        }
      >
        {PATIENT_DASHBOARD_ROUTE.children.map(({ path, title, component }) => (
          <Route
            key={path}
            path={path}
            element={<RouteWrapper component={component} title={title} />}
          />
        ))}
        {/* Patient In-Shell Catch-all */}
        <Route
          path="*"
          element={<RouteWrapper component={AuthenticatedNotFound} title="Page Not Found | ClinicFlow" />}
        />
      </Route>

      {/* ─── Admin Protected Routes ──────────────────────────────────── */}
      <Route
        path={ADMIN_ROUTES.path}
        element={
          <AdminRoute>
            <RouteWrapper
              component={ADMIN_ROUTES.component}
              title={ADMIN_ROUTES.title}
            />
          </AdminRoute>
        }
      >
        {ADMIN_ROUTES.children.map(({ path, title, component }) => (
          <Route
            key={path}
            path={path}
            element={<RouteWrapper component={component} title={title} />}
          />
        ))}
        {/* Admin In-Shell Catch-all */}
        <Route
          path="*"
          element={<RouteWrapper component={AuthenticatedNotFound} title="Page Not Found | ClinicFlow" />}
        />
      </Route>

      {/* ─── Top-level Global Public Catch-all ───────────────────────── */}
      <Route
        path="*"
        element={<RouteWrapper component={NotFound} title="Page Not Found | ClinicFlow" />}
      />
    </Routes>
  );
};

export default AppRoutes;