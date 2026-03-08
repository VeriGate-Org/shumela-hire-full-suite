import { tryApi } from '@/services/aiService';
import { AttendanceAnomalyRequest, AttendanceAnomalyResult } from '@/types/ai';

export const aiAttendanceService = {
  async detectAnomalies(request: AttendanceAnomalyRequest): Promise<AttendanceAnomalyResult> {
    const data = await tryApi<AttendanceAnomalyResult>('/api/ai/attendance/detect-anomalies', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!data) throw new Error('AI service unavailable');
    return data;
  },
};
