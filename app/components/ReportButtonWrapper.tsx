'use client';

import { useAuth } from './AuthProvider';
import ReportButton from './ReportButton';

export default function ReportButtonWrapper() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  return <ReportButton user={user} />;
}
