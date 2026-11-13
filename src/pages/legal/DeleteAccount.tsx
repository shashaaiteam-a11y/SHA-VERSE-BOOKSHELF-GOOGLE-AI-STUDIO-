import React from 'react';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';
import DeleteAccountDialog from '@/components/settings/DeleteAccountDialog';
import { Button } from '@/components/ui/button';

export const DeleteAccount: React.FC = () => {
  return (
    <LegalPageLayout title="Delete Account" updated="March 2026">
      <p>Request account deletion and remove all associated data from SHA-VERSE.</p>
      <div className="mt-6">
        <DeleteAccountDialog trigger={<Button variant="destructive">Delete My Account</Button>} />
      </div>
    </LegalPageLayout>
  );
};

export default DeleteAccount;
