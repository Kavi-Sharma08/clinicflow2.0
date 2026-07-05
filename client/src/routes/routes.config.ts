import {type ComponentType, lazy, type LazyExoticComponent } from "react";
import { AdminDashboard } from "../components/protected/admin/dashboard/AdminDashboard";

const Signup = lazy(() => import("../components/unprotected/Signup"));
const Login = lazy(() => import("../components/unprotected/Login"));
const Home = lazy(() => import("../components/unprotected/Home"));
const VerifyEmail = lazy(() => import("../components/unprotected/VerifyEmail"));

const DoctorRootLayout = lazy(() => import("../components/protected/doctor/Index"));
const DashboardIndex = lazy(() => import("../components/protected/doctor/dashboard/Index"));
const ProfileIndex = lazy(() => import("../components/protected/doctor/profile/Index"));
const DoctorProfileForm = lazy(() => import("../components/protected/doctor/profile/ProfileForm"));
const ChangePasswordForm = lazy(() => import("../components/protected/doctor/profile/ChangePassword"));
const DoctorDashboardIndex = lazy(() => import("../components/protected/doctor/dashboard/DoctorDashboard"));
const DoctorAvailability = lazy(() => import("../components/protected/doctor/availability/DoctorAvailability"));
const DoctorAppointments = lazy(() => import("../components/protected/doctor/appointments/DoctorAppointments"));
const DoctorVerificationForm = lazy(() => import("../components/unprotected/onboarding/DoctorVerificationForm"));
const VerificationStatus = lazy(() => import("../components/unprotected/onboarding/VerificationStatus"));


const AdminIndex = lazy(() => import("../components/protected/admin/Index"));
const AdminUsersList = lazy(() => import("../components/protected/admin/UsersList"));
const AdminDoctorManagement = lazy(() => import("../components/protected/admin/doctor-management/DoctorManagement"));
const AdminDoctorDetail = lazy(() => import("../components/protected/admin/DoctorDetail"));
const AdminAppointmentsPlaceholder = lazy(() => import("../components/protected/admin/AdminAppointmentsPlaceholder"));
const AdminAnalyticsPlaceholder = lazy(() => import("../components/protected/admin/AdminAnalyticsPlaceholder"));
const AdminSettingsPlaceholder = lazy(() => import("../components/protected/admin/AdminSettingsPlaceholder"));
const PatientDashboardIndex = lazy(() => import("../components/protected/patient/Index"));
const PatientDashboardHome = lazy(() => import("../components/protected/patient/PatientDashboard"));
const PatientProfile = lazy(() => import("../components/protected/patient/PatientProfile"));
const MyAppointments = lazy(() => import("../components/protected/patient/MyAppointments"));
const BookAppointment = lazy(() => import("../components/protected/patient/BookAppointment"));


export interface AppRoute {
  id: string;
  path: string;
  title: string;
  component: ComponentType | LazyExoticComponent<ComponentType>;
}

export const UNPROTECTED_ROUTES: AppRoute[] = [
  {
    id: "Signup",
    path: "/signup",
    title: "Sign Up | ClinicFlow",
    component: Signup,
  },
  {
    id: "Login",
    path: "/login",
    title: "Login | ClinicFlow",
    component: Login,
  },
  {
    id: "Home",
    path: "/",
    title: "ClinicFlow - Smart Queue Management",
    component: Home,
  },
  {
    id: "VerifyEmail",
    path: "/verify-email",
    title: "Verify Your Email | ClinicFlow",
    component: VerifyEmail,
   },
];

export const ONBOARDING_ROUTES: (AppRoute & { destination: "verification" | "status" })[] = [
  {
    id: "DoctorVerificationForm",
    path: "/onboarding/verification",
    title: "Verify Your Credentials | ClinicFlow",
    component: DoctorVerificationForm,
    destination: "verification",
  },
  {
    id: "VerificationStatus",
    path: "/onboarding/status",
    title: "Verification Status | ClinicFlow",
    component: VerificationStatus,
    destination: "status",
  },
];

export const PATIENT_DASHBOARD_ROUTE = {
  id: "PatientDashboard",
  path: "/patient/dashboard/:id",
  title: "Dashboard | ClinicFlow",
  component: PatientDashboardIndex,
  children: [
    {
      id: "PatientDashboardHome",
      path: "",
      title: "Patient Dashboard | ClinicFlow",
      component: PatientDashboardHome,
    },
    {
      id: "MyAppointments",
      path: "appointments",
      title: "My Appointments | ClinicFlow",
      component: MyAppointments,
    },
    {
      id: "BookAppointment",
      path: "book",
      title: "Book Appointment | ClinicFlow",
      component: BookAppointment,
    },
    {
      id: "PatientProfile",
      path: "profile",
      title: "My Profile | ClinicFlow",
      component: PatientProfile,
    },
  ],
};

export const DOCTOR_ROUTES = {
  id: "DoctorRoot",
  path: "/doctor",
  title: "ClinicFlow",
  component: DoctorRootLayout, 
  children: [
    {
      id: "DoctorDashboardGroup",
      path: "dashboard/:id",
      title: "Dashboard | ClinicFlow",
      component: DashboardIndex, 
      children: [
        {
          id: "DashboardIndex",
          path: "", 
          title: "Dashboard | ClinicFlow",
          component: DoctorDashboardIndex,
        },
        {
          id: "DoctorAvailability",
          path: "availability", 
          title: "Availability | ClinicFlow",
          component: DoctorAvailability,
        },
        {
          id: "DoctorAppointments",
          path: "appointments", 
          title: "Appointments | ClinicFlow",
          component: DoctorAppointments,
        },
      ],
    },
    {
      id: "DoctorProfileGroup",
      path: "profile",
      title: "Settings | ClinicFlow",
      component: ProfileIndex, 
      children: [
        {
          id: "DoctorProfileEdit",
          path: "", 
          title: "My Profile | ClinicFlow",
          component: DoctorProfileForm,
        },
        {
          id: "DoctorPasswordEdit",
          path: "change-password", 
          title: "Change Password | ClinicFlow",
          component: ChangePasswordForm,
        },
      ],
    },
  ],
};
export const ADMIN_ROUTES = {
  id: "AdminDashboard",
  path: "/admin",
  title: "Admin | ClinicFlow",
  component: AdminIndex,
  children: [
    {
      id: "AdminDashboard",
      path: "",
      title: "Dashboard | ClinicFlow",
      component: AdminDashboard,
    },
    {
      id: "AdminDoctors",
      path: "doctors",
      title: "Doctor Management | ClinicFlow",
      component: AdminDoctorManagement,
    },
    {
      id: "AdminUsersList",
      path: "users",
      title: "Users | ClinicFlow",
      component: AdminUsersList,
    },

    {
      id: "AdminAppointments",
      path: "appointments",
      title: "Appointments | ClinicFlow",
      component: AdminAppointmentsPlaceholder,
    },
    {
      id: "AdminAnalytics",
      path: "analytics",
      title: "Analytics | ClinicFlow",
      component: AdminAnalyticsPlaceholder,
    },
    {
      id: "AdminSettings",
      path: "settings",
      title: "Settings | ClinicFlow",
      component: AdminSettingsPlaceholder,
    },
    {
      id: "AdminDoctorDetail",
      path: "doctors/:id",
      title: "Doctor Detail | ClinicFlow",
      component: AdminDoctorDetail,
    },
  ],
}