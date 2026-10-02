import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth, RequireRole } from './auth/guards';
import { AppShell } from './layout/AppShell';
import { Login } from './pages/Login';
import { AcceptInvite } from './pages/AcceptInvite';
import { ExternalSign } from './pages/ExternalSign';
import { Verify } from './pages/Verify';
import { Dashboard } from './pages/Dashboard';
import { CasesList } from './pages/CasesList';
import { NewCase } from './pages/NewCase';
import { CaseDetail } from './pages/CaseDetail';
import { DocumentPage } from './pages/DocumentPage';
import { StandaloneList } from './pages/StandaloneList';
import { StandaloneNew } from './pages/StandaloneNew';
import { Notifications } from './pages/Notifications';
import { Audit } from './pages/Audit';
import { Reports } from './pages/Reports';
import { Profile } from './pages/Profile';
import { NotFound } from './pages/NotFound';
import { AdminLayout } from './pages/admin/AdminLayout';
import { UsersAdmin } from './pages/admin/UsersAdmin';
import { DepartmentsAdmin, BudgetLinesAdmin, SuppliersAdmin } from './pages/admin/LookupAdmin';
import { TemplatesAdmin } from './pages/admin/TemplatesAdmin';
import { AUDIT_ROLES, REPORT_ROLES } from './auth/permissions';

export function App() {
  return (
    <Routes>
      {/* public */}
      <Route path="/login" element={<Login />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />
      <Route path="/sign/:token" element={<ExternalSign />} />
      <Route path="/verify/:documentId" element={<Verify />} />

      {/* signed in */}
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="cases" element={<CasesList />} />
          <Route path="cases/new" element={<NewCase />} />
          <Route path="cases/:id" element={<CaseDetail />} />
          <Route path="documents/:id" element={<DocumentPage />} />
          <Route path="requests" element={<StandaloneList docType="GR-06" title="Requests (GR-06)" basePath="/requests" />} />
          <Route path="requests/new" element={<StandaloneNew docType="GR-06" title="New request (GR-06)" />} />
          <Route path="memos" element={<StandaloneList docType="IM-08" title="Memos (IM-08)" basePath="/memos" />} />
          <Route path="memos/new" element={<StandaloneNew docType="IM-08" title="New memo (IM-08)" />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="audit" element={<RequireRole roles={AUDIT_ROLES}><Audit /></RequireRole>} />
          <Route path="reports" element={<RequireRole roles={REPORT_ROLES}><Reports /></RequireRole>} />
          <Route path="admin" element={<RequireRole roles={['admin']}><AdminLayout /></RequireRole>}>
            <Route index element={<Navigate to="users" replace />} />
            <Route path="users" element={<UsersAdmin />} />
            <Route path="departments" element={<DepartmentsAdmin />} />
            <Route path="budget-lines" element={<BudgetLinesAdmin />} />
            <Route path="suppliers" element={<SuppliersAdmin />} />
            <Route path="templates" element={<TemplatesAdmin />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
