import React from 'react';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';

export const DeleteData: React.FC = () => {
  return (
    <LegalPageLayout title="Data Deletion Request" updated="March 2026">
      <p>Submit a request to delete specific user data, chat history, or media uploads.</p>
    </LegalPageLayout>
  );
};

export default DeleteData;
