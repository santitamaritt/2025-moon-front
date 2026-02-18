import Login from "@/pages/Login";
import PasswordRecovery from "@/pages/PasswordRecovery";
import Register from "@/pages/Register";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedResolver } from "./Resolvers/ProtectedResolver";
import { Home } from "@/pages/Home";
import { Reserve } from "@/pages/Reserve";
import { RoleResolver } from "./Resolvers/RoleResolver";
import { UserRoles } from "@/zustand/session/session.types";
import { Profile } from "@/pages/Profile";
import { Shifts } from "@/pages/Shifts";
import ChangePassword from "@/pages/ChangePassword";
import { AppointmentsReserved } from "@/pages/AppointmentsReserved";
import { SpareParts } from "@/pages/SpareParts";
import { Services } from "@/pages/Services";
import { Vehicles } from "@/pages/Vehicles";
import { MechanicDashboard } from "@/pages/MechanicDashboard";
import { UserDashboard } from "@/pages/UserDashboard";
import { ReviewMechanic } from "@/pages/ReviewMechanic";
import { MechanicGoals } from "@/pages/Goals";
import { Reminders } from "@/pages/Reminders";

export const Routing = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/password-recovery" element={<PasswordRecovery />} />
      <Route path="/change-password" element={<ChangePassword />} />

      <Route element={<ProtectedResolver redirectPath="/login" />}>
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route
          element={<RoleResolver role={UserRoles.USER} redirectPath="/login" />}
        >
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/reserve" element={<Reserve />} />
          <Route path="/appointments" element={<AppointmentsReserved />} />
          <Route path="/user-dashboard" element={<UserDashboard />} />
          <Route path="/review-mechanic" element={<ReviewMechanic />} />
          <Route path="/reminders" element={<Reminders />} />
        </Route>
        <Route
          element={
            <RoleResolver role={UserRoles.MECHANIC} redirectPath="/login" />
          }
        >
          <Route path="/shifts" element={<Shifts />} />
          <Route path="/spare-parts" element={<SpareParts />} />
          <Route path="/services" element={<Services />} />
          <Route path="/mechanic-dashboard" element={<MechanicDashboard />} />
          <Route path="/goals" element={<MechanicGoals />} />
        </Route>
      </Route>

      <Route path="*" element={<div>404 - Not Found</div>} />
    </Routes>
  );
};
