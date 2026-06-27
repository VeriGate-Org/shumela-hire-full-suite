export interface TenantBranding {
  logoKey?: string;
  logoUrl?: string;       // transient — resolved signed URL
  logoText?: string;      // text displayed next to logo (e.g. "Applicant Tracking System")
  primaryColor?: string;  // hex
  secondaryColor?: string;
  accentColor?: string;   // maps to --cta
}

export interface TenantCompanyInfo {
  description?: string;
  industry?: string;
  address?: string;
  website?: string;
}

export interface TenantSettings {
  branding?: TenantBranding;
  companyInfo?: TenantCompanyInfo;
}
