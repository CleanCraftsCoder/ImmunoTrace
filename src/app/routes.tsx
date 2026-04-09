import { createBrowserRouter } from 'react-router';
import { Dashboard } from './pages/Dashboard';
import { DetailView } from './pages/DetailView';
import { SmartQuery } from './pages/SmartQuery';
import { Activity } from './pages/Activity';
import { CalendarPage } from './pages/CalendarPage';
import { Records } from './pages/Records';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { PrescriptionUpload } from './pages/PrescriptionUpload';
import { DietPlan } from './pages/DietPlan';
import { Schedule } from './pages/Schedule';
import { ProtectedRoute } from './components/ProtectedRoute';

function Root({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#F4F7F6] font-sans overflow-hidden">
      {/* Soft background ambient glows */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-[#2EC4B6]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#0F3D3E]/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <Sidebar />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Root>{children}</Root>
    </ProtectedRoute>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/dashboard',
    element: <Protected><Dashboard /></Protected>,
  },
  {
    path: '/detail/:partId',
    element: <Protected><DetailView /></Protected>,
  },
  {
    path: '/query',
    element: <Protected><SmartQuery /></Protected>,
  },
  {
    path: '/activity',
    element: <Protected><Activity /></Protected>,
  },
  {
    path: '/calendar',
    element: <Protected><CalendarPage /></Protected>,
  },
  {
    path: '/records',
    element: <Protected><Records /></Protected>,
  },
  {
    path: '/profile',
    element: <Protected><Profile /></Protected>,
  },
  {
    path: '/settings',
    element: <Protected><Settings /></Protected>,
  },
  {
    path: '/upload',
    element: <Protected><PrescriptionUpload /></Protected>,
  },
  {
    path: '/diet',
    element: <Protected><DietPlan /></Protected>,
  },
  {
    path: '/schedule',
    element: <Protected><Schedule /></Protected>,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);