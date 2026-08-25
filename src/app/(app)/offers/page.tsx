'use client';

import React from 'react';
import PageWrapper from '@/components/PageWrapper';
import OfferManagement from '@/components/OfferManagement';
import AiAssistPanel from '@/components/ai/AiAssistPanel';
import AiEmailDrafter from '@/components/ai/AiEmailDrafter';

export default function OffersPage() {
  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Offer and regret correspondence is written here, so the drafter belongs here.
            Offer prediction is not at page level — it needs a specific application, so it
            sits inside the offer detail where one is selected. */}
        <AiAssistPanel
          title="AI Email Drafter"
          feature="AI_EMAIL_DRAFTER"
          description="Draft offer, negotiation and regret correspondence for a candidate"
        >
          <AiEmailDrafter />
        </AiAssistPanel>

        <OfferManagement />
      </div>
    </PageWrapper>
  );
}