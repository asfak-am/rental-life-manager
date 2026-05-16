import { Route } from 'react-router-dom'

import Login from '../pages/Login'
import Register from '../pages/Register'
import VerifyOtp from '../pages/VerifyOtp'
import ForgotPassword from '../pages/ForgotPassword'
import ResetPassword from '../pages/ResetPassword'
import InviteHouse from '../pages/InviteHouse'
import OnboardingStep1 from '../pages/OnboardingStep1'
import OnboardingStep2 from '../pages/OnboardingStep2'
import OnboardingSuccess from '../pages/OnboardingSuccess'

export const publicRouteElements = [
  <Route key="login" path="/login" element={<Login />} />,
  <Route key="register" path="/register" element={<Register />} />,
  <Route key="verify-otp" path="/verify-otp" element={<VerifyOtp />} />,
  <Route key="forgot-password" path="/forgot-password" element={<ForgotPassword />} />,
  <Route key="reset-password" path="/reset-password" element={<ResetPassword />} />,
  <Route key="invite-house" path="/invite/:code" element={<InviteHouse />} />,
  <Route key="onboarding-step1" path="/onboarding/step1" element={<OnboardingStep1 />} />,
  <Route key="onboarding-step2" path="/onboarding/step2" element={<OnboardingStep2 />} />,
  <Route key="onboarding-success" path="/onboarding/success" element={<OnboardingSuccess />} />,
]
