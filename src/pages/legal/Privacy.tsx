import React from 'react';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';

export const Privacy: React.FC = () => {
  return (
    <LegalPageLayout title="Privacy Policy" updated="March 2026">
      <h2>1. Overview</h2>
      <p>SHA-VERSE values your privacy. We collect minimal information necessary to deliver our services.</p>
      <h2>2. Data Collection & Use</h2>
      <p>We process account data to enable social interaction, chat, and publishing features.</p>
    </LegalPageLayout>
  );
};

export default Privacy;
