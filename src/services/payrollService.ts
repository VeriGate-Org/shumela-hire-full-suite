import { apiFetch } from '@/lib/api-fetch';

export interface StatutoryDeduction {
  category: string;
  description: string;
  employeeContribution: number;
  employerContribution: number;
  total: number;
  rate: string;
  basis: string;
}

export interface PayrollSummary {
  month: string;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  paye: number;
  uif: number;
  sdl: number;
  pension: number;
  medical: number;
  headcount: number;
}

export interface IRP5Certificate {
  id: string;
  employeeId: string;
  employeeName: string;
  taxNumber: string;
  taxYear: string;
  grossIncome: number;
  totalPAYE: number;
  totalUIF: number;
  status: 'GENERATED' | 'SUBMITTED' | 'ACCEPTED';
  generatedDate: string;
}

export interface SARSSubmission {
  id: string;
  submissionType: string;
  period: string;
  status: 'PENDING' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';
  submittedDate: string | null;
  referenceNumber: string | null;
  employeeCount: number;
  totalAmount: number;
}

export const payrollService = {
  async getStatutoryOverview(): Promise<{
    deductions: StatutoryDeduction[];
    monthlySummary: PayrollSummary[];
    irp5Certificates: IRP5Certificate[];
    sarsSubmissions: SARSSubmission[];
    taxYear: string;
    companyTaxNumber: string;
    sdlNumber: string;
    uifReferenceNumber: string;
    payeNumber: string;
  }> {
    try {
      const response = await apiFetch('/api/payroll/statutory-overview');
      if (response.ok) return await response.json();
    } catch {
      // Fall through to demo data
    }

    // Demo data for uThukela Water presentation
    return {
      taxYear: '2025/2026',
      companyTaxNumber: '9123456789',
      sdlNumber: 'L920000001',
      uifReferenceNumber: 'U920000001',
      payeNumber: '7920000001',
      deductions: [
        { category: 'PAYE', description: 'Pay-As-You-Earn Income Tax', employeeContribution: 487250, employerContribution: 0, total: 487250, rate: 'Progressive (18%–45%)', basis: 'Taxable income per SARS tax tables' },
        { category: 'UIF', description: 'Unemployment Insurance Fund', employeeContribution: 24362, employerContribution: 24362, total: 48724, rate: '1% employee + 1% employer', basis: 'Gross remuneration (max R17,712/month)' },
        { category: 'SDL', description: 'Skills Development Levy', employeeContribution: 0, employerContribution: 24362, total: 24362, rate: '1% employer', basis: 'Total employee remuneration' },
        { category: 'Pension', description: 'Pension/Provident Fund', employeeContribution: 182344, employerContribution: 182344, total: 364688, rate: '7.5% employee + 7.5% employer', basis: 'Pensionable salary' },
        { category: 'Medical Aid', description: 'Medical Aid Contributions', employeeContribution: 89400, employerContribution: 133200, total: 222600, rate: 'Scheme-dependent', basis: 'Per medical aid scheme rates' },
      ],
      monthlySummary: [
        { month: 'Apr 2025', grossPay: 2436200, totalDeductions: 783050, netPay: 1653150, paye: 487250, uif: 24362, sdl: 24362, pension: 182344, medical: 89400, headcount: 142 },
        { month: 'May 2025', grossPay: 2436200, totalDeductions: 783050, netPay: 1653150, paye: 487250, uif: 24362, sdl: 24362, pension: 182344, medical: 89400, headcount: 142 },
        { month: 'Jun 2025', grossPay: 2451800, totalDeductions: 788120, netPay: 1663680, paye: 490360, uif: 24518, sdl: 24518, pension: 183885, medical: 89400, headcount: 143 },
        { month: 'Jul 2025', grossPay: 2451800, totalDeductions: 788120, netPay: 1663680, paye: 490360, uif: 24518, sdl: 24518, pension: 183885, medical: 89400, headcount: 143 },
        { month: 'Aug 2025', grossPay: 2467400, totalDeductions: 793190, netPay: 1674210, paye: 493480, uif: 24674, sdl: 24674, pension: 185055, medical: 89400, headcount: 144 },
        { month: 'Sep 2025', grossPay: 2467400, totalDeductions: 793190, netPay: 1674210, paye: 493480, uif: 24674, sdl: 24674, pension: 185055, medical: 89400, headcount: 144 },
        { month: 'Oct 2025', grossPay: 2483000, totalDeductions: 798260, netPay: 1684740, paye: 496600, uif: 24830, sdl: 24830, pension: 186225, medical: 89400, headcount: 145 },
        { month: 'Nov 2025', grossPay: 2498600, totalDeductions: 803330, netPay: 1695270, paye: 499720, uif: 24986, sdl: 24986, pension: 187395, medical: 89400, headcount: 146 },
        { month: 'Dec 2025', grossPay: 2498600, totalDeductions: 803330, netPay: 1695270, paye: 499720, uif: 24986, sdl: 24986, pension: 187395, medical: 89400, headcount: 146 },
        { month: 'Jan 2026', grossPay: 2514200, totalDeductions: 808400, netPay: 1705800, paye: 502840, uif: 25142, sdl: 25142, pension: 188565, medical: 89400, headcount: 147 },
        { month: 'Feb 2026', grossPay: 2529800, totalDeductions: 813470, netPay: 1716330, paye: 505960, uif: 25298, sdl: 25298, pension: 189735, medical: 89400, headcount: 148 },
        { month: 'Mar 2026', grossPay: 2529800, totalDeductions: 813470, netPay: 1716330, paye: 505960, uif: 25298, sdl: 25298, pension: 189735, medical: 89400, headcount: 148 },
      ],
      irp5Certificates: [
        { id: 'IRP5-001', employeeId: 'UTH-001', employeeName: 'Sipho Nkosi', taxNumber: '9201015800089', taxYear: '2025/2026', grossIncome: 420000, totalPAYE: 89460, totalUIF: 4200, status: 'GENERATED', generatedDate: '2026-03-15' },
        { id: 'IRP5-002', employeeId: 'UTH-003', employeeName: 'Thandiwe Dlamini', taxNumber: '8805120800066', taxYear: '2025/2026', grossIncome: 380000, totalPAYE: 76380, totalUIF: 3800, status: 'GENERATED', generatedDate: '2026-03-15' },
        { id: 'IRP5-003', employeeId: 'UTH-005', employeeName: 'Mandla Mthembu', taxNumber: '9107230800043', taxYear: '2025/2026', grossIncome: 295000, totalPAYE: 52620, totalUIF: 2950, status: 'SUBMITTED', generatedDate: '2026-03-15' },
        { id: 'IRP5-004', employeeId: 'UTH-008', employeeName: 'Nomvula Zulu', taxNumber: '8503280800021', taxYear: '2025/2026', grossIncome: 340000, totalPAYE: 65240, totalUIF: 3400, status: 'ACCEPTED', generatedDate: '2026-03-15' },
        { id: 'IRP5-005', employeeId: 'UTH-010', employeeName: 'Bongani Shabalala', taxNumber: '9410050800098', taxYear: '2025/2026', grossIncome: 260000, totalPAYE: 43560, totalUIF: 2600, status: 'GENERATED', generatedDate: '2026-03-15' },
      ],
      sarsSubmissions: [
        { id: 'SUB-001', submissionType: 'EMP201 - Monthly PAYE Return', period: 'March 2026', status: 'SUBMITTED', submittedDate: '2026-04-07', referenceNumber: 'SARS-2026-03-4821', employeeCount: 148, totalAmount: 556556 },
        { id: 'SUB-002', submissionType: 'EMP201 - Monthly PAYE Return', period: 'February 2026', status: 'ACCEPTED', submittedDate: '2026-03-07', referenceNumber: 'SARS-2026-02-3917', employeeCount: 148, totalAmount: 556556 },
        { id: 'SUB-003', submissionType: 'EMP201 - Monthly PAYE Return', period: 'January 2026', status: 'ACCEPTED', submittedDate: '2026-02-07', referenceNumber: 'SARS-2026-01-2843', employeeCount: 147, totalAmount: 553124 },
        { id: 'SUB-004', submissionType: 'EMP501 - Bi-Annual Reconciliation', period: 'Aug 2025 – Feb 2026', status: 'PENDING', submittedDate: null, referenceNumber: null, employeeCount: 148, totalAmount: 3460012 },
        { id: 'SUB-005', submissionType: 'UIF Declaration', period: 'Q4 2025', status: 'ACCEPTED', submittedDate: '2026-01-15', referenceNumber: 'UIF-2025-Q4-1129', employeeCount: 146, totalAmount: 149612 },
        { id: 'SUB-006', submissionType: 'SDL Return', period: 'Q4 2025', status: 'ACCEPTED', submittedDate: '2026-01-15', referenceNumber: 'SDL-2025-Q4-0887', employeeCount: 146, totalAmount: 74806 },
      ],
    };
  },
};
