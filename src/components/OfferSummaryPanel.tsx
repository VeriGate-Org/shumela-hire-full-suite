'use client';

import React, { useState } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import { formatEnumValue } from '@/utils/enumLabels';
import { eSignatureService } from '@/services/eSignatureService';
import ApprovalTimeline, { ApprovalStep } from '@/components/ApprovalTimeline';
import StatusPill from '@/components/StatusPill';
import {
  DocumentTextIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

interface OfferSummaryPanelProps {
  offer: any;
  applicationId: string;
  readOnly?: boolean;
  onAction?: () => void;
}

export default function OfferSummaryPanel({
  offer,
  applicationId,
  readOnly = false,
  onAction,
}: OfferSummaryPanelProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [negotiationResponse, setNegotiationResponse] = useState('');
  const [showNegotiateForm, setShowNegotiateForm] = useState(false);

  if (!offer) {
    return (
      <div className="border border-dashed border-gray-300 rounded-sm p-6 text-center">
        <DocumentTextIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500 mb-4">No offer has been created for this application yet.</p>
        {!readOnly && (
          <a
            href={`/offers?create=true&applicationId=${applicationId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cta text-cta-foreground text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
          >
            <PlusIcon className="w-4 h-4" />
            Create Offer
          </a>
        )}
      </div>
    );
  }

  const doAction = async (label: string, url: string, method = 'POST', body?: any) => {
    setActionLoading(label);
    setError(null);
    try {
      const response = await apiFetch(url, {
        method,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }
      onAction?.();
    } catch (err: any) {
      setError(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendForSignature = async () => {
    setActionLoading('esign');
    setError(null);
    try {
      await eSignatureService.sendForSignature(offer.id, {
        signerEmail: offer.application?.applicant?.email || '',
        signerName: offer.application?.applicant?.name || offer.application?.applicant?.firstName || '',
      });
      onAction?.();
    } catch (err: any) {
      setError(err.message || 'Failed to send for signature');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadSigned = async () => {
    try {
      await eSignatureService.downloadSignedDocument(offer.id);
    } catch (err: any) {
      setError(err.message || 'Failed to download');
    }
  };

  const handleNegotiateRespond = async () => {
    if (!negotiationResponse.trim()) return;
    await doAction('negotiate', `/api/offers/${offer.id}/negotiate/respond`, 'POST', {
      companyResponse: negotiationResponse,
      negotiationStatus: 'COMPANY_RESPONDING',
    });
    setNegotiationResponse('');
    setShowNegotiateForm(false);
  };

  const status = offer.status || '';
  const approvalSteps: ApprovalStep[] = [];

  if (offer.requiresApproval) {
    approvalSteps.push({
      role: offer.approvalLevelRequired ? `Level ${offer.approvalLevelRequired} Approval` : 'Approval Required',
      approverName: offer.approvedBy ? `Approved by ID: ${offer.approvedBy}` : offer.rejectedBy ? `Rejected by ID: ${offer.rejectedBy}` : 'Pending',
      status: offer.approvedAt ? 'approved' : offer.rejectedAt ? 'rejected' : 'pending',
      timestamp: offer.approvedAt || offer.rejectedAt || undefined,
      comment: offer.approvalNotes || offer.rejectionReason || undefined,
    });
  }

  const isNegotiating = status === 'UNDER_NEGOTIATION' || status === 'NEGOTIATING';
  const canSign = ['SENT', 'AWAITING_SIGNATURE', 'APPROVED'].includes(status);
  const isSigned = status === 'SIGNED' || offer.eSignatureStatus === 'SIGNED';

  return (
    <div className="border border-border rounded-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <DocumentTextIcon className="w-5 h-5 text-muted-foreground" />
          <div>
            <span className="text-sm font-semibold text-foreground">
              {offer.offerNumber || `Offer #${offer.id}`}
            </span>
            {offer.version > 1 && (
              <span className="ml-2 text-xs text-muted-foreground">v{offer.version}</span>
            )}
          </div>
        </div>
        <StatusPill value={status} domain="offerStatus" size="sm" />
      </div>

      {error && (
        <div className="px-5 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Key Terms */}
      <div className="px-5 py-4">
        <h4 className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground mb-3">Key Terms</h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Job Title</span>
            <p className="font-medium text-foreground">{offer.jobTitle || '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Start Date</span>
            <p className="font-medium text-foreground">
              {offer.startDate ? new Date(offer.startDate).toLocaleDateString('en-ZA') : '-'}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Employment Type</span>
            <p className="font-medium text-foreground">{offer.offerType ? formatEnumValue(offer.offerType) : '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Base Salary</span>
            <p className="font-medium text-foreground">
              {offer.baseSalary ? `${offer.currency || 'ZAR'} ${Number(offer.baseSalary).toLocaleString()}` : '-'}
            </p>
          </div>
          {offer.signingBonus > 0 && (
            <div>
              <span className="text-muted-foreground">Signing Bonus</span>
              <p className="font-medium text-foreground">
                {offer.currency || 'ZAR'} {Number(offer.signingBonus).toLocaleString()}
              </p>
            </div>
          )}
          {offer.probationaryPeriodDays > 0 && (
            <div>
              <span className="text-muted-foreground">Probation Period</span>
              <p className="font-medium text-foreground">{offer.probationaryPeriodDays} days</p>
            </div>
          )}
        </div>
      </div>

      {/* Approval Workflow */}
      {offer.requiresApproval && approvalSteps.length > 0 && (
        <div className="px-5 py-4 border-t border-border">
          <h4 className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground mb-3">Approval Workflow</h4>
          <ApprovalTimeline steps={approvalSteps} />
          {!readOnly && status === 'DRAFT' && (
            <button
              onClick={() => doAction('submit-approval', `/api/offers/${offer.id}/submit-for-approval`)}
              disabled={actionLoading !== null}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-cta text-cta-foreground text-xs font-medium rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <PaperAirplaneIcon className="w-3.5 h-3.5" />
              {actionLoading === 'submit-approval' ? 'Submitting...' : 'Submit for Approval'}
            </button>
          )}
          {!readOnly && status === 'PENDING_APPROVAL' && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => doAction('approve', `/api/offers/${offer.id}/approve`, 'POST', { approvalNotes: 'Approved' })}
                disabled={actionLoading !== null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-full hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircleIcon className="w-3.5 h-3.5" />
                {actionLoading === 'approve' ? 'Approving...' : 'Approve'}
              </button>
              <button
                onClick={() => doAction('reject', `/api/offers/${offer.id}/reject`, 'POST', { rejectionReason: 'Rejected' })}
                disabled={actionLoading !== null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-full hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading === 'reject' ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* E-Signature */}
      {(canSign || isSigned || offer.eSignatureStatus) && (
        <div className="px-5 py-4 border-t border-border">
          <h4 className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground mb-3">E-Signature</h4>
          <div className="flex items-center gap-3 text-sm">
            <StatusPill
              value={offer.eSignatureStatus || (isSigned ? 'SIGNED' : 'PENDING')}
              label={offer.eSignatureStatus ? formatEnumValue(offer.eSignatureStatus) : isSigned ? 'Signed' : 'Pending'}
              color={isSigned ? 'green' : 'yellow'}
              size="sm"
            />
            {offer.eSignatureSentAt && (
              <span className="text-xs text-muted-foreground">
                Sent {new Date(offer.eSignatureSentAt).toLocaleDateString('en-ZA')}
              </span>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            {!readOnly && canSign && !isSigned && (
              <button
                onClick={handleSendForSignature}
                disabled={actionLoading !== null}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cta text-cta-foreground text-xs font-medium rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <PaperAirplaneIcon className="w-3.5 h-3.5" />
                {actionLoading === 'esign' ? 'Sending...' : 'Send for Signature'}
              </button>
            )}
            {isSigned && (
              <button
                onClick={handleDownloadSigned}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-foreground text-xs font-medium rounded-full hover:bg-gray-50 transition-colors"
              >
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                Download Signed Document
              </button>
            )}
          </div>
        </div>
      )}

      {/* Negotiation */}
      {isNegotiating && (
        <div className="px-5 py-4 border-t border-border">
          <h4 className="text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground mb-3">Negotiation</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">Round {offer.negotiationRounds || 1}</span>
              {offer.lastNegotiationAt && (
                <span className="text-xs text-muted-foreground">
                  Last: {new Date(offer.lastNegotiationAt).toLocaleDateString('en-ZA')}
                </span>
              )}
            </div>
            {offer.candidateCounterOffer && (
              <div className="bg-gray-50 rounded-sm p-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-[0.05em]">Candidate Counter-Offer</span>
                <p className="text-foreground mt-1">{offer.candidateCounterOffer}</p>
              </div>
            )}
            {offer.companyResponse && (
              <div className="bg-blue-50 rounded-sm p-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-[0.05em]">Company Response</span>
                <p className="text-foreground mt-1">{offer.companyResponse}</p>
              </div>
            )}
            {!readOnly && (
              <>
                {!showNegotiateForm ? (
                  <button
                    onClick={() => setShowNegotiateForm(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cta text-cta-foreground text-xs font-medium rounded-full hover:opacity-90 transition-opacity"
                  >
                    Respond to Negotiation
                  </button>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={negotiationResponse}
                      onChange={(e) => setNegotiationResponse(e.target.value)}
                      placeholder="Enter company response..."
                      className="w-full px-3 py-2 border border-border rounded-sm text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-primary"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleNegotiateRespond}
                        disabled={actionLoading !== null || !negotiationResponse.trim()}
                        className="px-3 py-1.5 bg-cta text-cta-foreground text-xs font-medium rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        {actionLoading === 'negotiate' ? 'Sending...' : 'Send Response'}
                      </button>
                      <button
                        onClick={() => { setShowNegotiateForm(false); setNegotiationResponse(''); }}
                        className="px-3 py-1.5 border border-border text-foreground text-xs font-medium rounded-full hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Dates & Documents Row */}
      <div className="px-5 py-3 border-t border-border bg-gray-50/50 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          {offer.offerExpiryDate && (
            <span className="flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5" />
              Expires {new Date(offer.offerExpiryDate).toLocaleDateString('en-ZA')}
            </span>
          )}
          {offer.acceptedAt && (
            <span>Accepted {new Date(offer.acceptedAt).toLocaleDateString('en-ZA')}</span>
          )}
        </div>
      </div>
    </div>
  );
}
