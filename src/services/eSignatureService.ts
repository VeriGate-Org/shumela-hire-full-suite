import { apiFetch } from '@/lib/api-fetch';

export interface ESignatureStatus {
  status: string;
  offerId: number;
  envelopeId?: string;
}

export interface SendForSignatureRequest {
  signerEmail: string;
  signerName: string;
}

export interface SendForSignatureResponse {
  envelopeId: string;
  status: string;
  offerId: number;
}

export interface DocumentSignatureStatus {
  status: string;
  documentId: string;
  envelopeId?: string;
}

export interface DocumentSignatureResponse {
  envelopeId: string;
  status: string;
  documentId: string;
}

export const eSignatureService = {
  async sendForSignature(offerId: number, request: SendForSignatureRequest): Promise<SendForSignatureResponse> {
    const response = await apiFetch(`/api/esignature/offers/${offerId}/send`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to send offer for signature');
    return response.json();
  },

  async getStatus(offerId: number): Promise<ESignatureStatus> {
    const response = await apiFetch(`/api/esignature/offers/${offerId}/status`);
    if (!response.ok) throw new Error('Failed to get e-signature status');
    return response.json();
  },

  async downloadSignedDocument(offerId: number): Promise<void> {
    const response = await apiFetch(`/api/esignature/offers/${offerId}/document`);
    if (!response.ok) throw new Error('Failed to download signed document');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signed-offer-${offerId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  },

  async voidEnvelope(offerId: number, reason: string): Promise<void> {
    const response = await apiFetch(`/api/esignature/offers/${offerId}/void`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error('Failed to void envelope');
  },

  // ── Employee Document E-Signature ──

  async sendDocumentForSignature(documentId: string, signerEmail: string, signerName: string): Promise<DocumentSignatureResponse> {
    const response = await apiFetch(`/api/esignature/documents/${documentId}/send`, {
      method: 'POST',
      body: JSON.stringify({ signerEmail, signerName }),
    });
    if (!response.ok) throw new Error('Failed to send document for signature');
    return response.json();
  },

  async getDocumentSignatureStatus(documentId: string): Promise<DocumentSignatureStatus> {
    const response = await apiFetch(`/api/esignature/documents/${documentId}/status`);
    if (!response.ok) throw new Error('Failed to get document signature status');
    return response.json();
  },

  async downloadSignedEmployeeDocument(documentId: string): Promise<void> {
    const response = await apiFetch(`/api/esignature/documents/${documentId}/signed-document`);
    if (!response.ok) throw new Error('Failed to download signed document');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signed-document-${documentId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  },
};
