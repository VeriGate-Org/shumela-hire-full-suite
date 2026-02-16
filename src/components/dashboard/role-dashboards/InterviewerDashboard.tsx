'use client';

import React from 'react';

interface InterviewerDashboardProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

const InterviewerDashboard: React.FC<InterviewerDashboardProps> = ({
  selectedTimeframe,
  onTimeframeChange,
}) => {
  // Mock data
  const upcomingInterviews = [
    { id: 1, candidate: 'Alice Mokoena', position: 'Senior Developer', date: '2026-02-17', time: '10:00', type: 'Technical' },
    { id: 2, candidate: 'Bongani Dlamini', position: 'Product Designer', date: '2026-02-18', time: '14:00', type: 'Behavioral' },
    { id: 3, candidate: 'Chloe van der Merwe', position: 'Data Analyst', date: '2026-02-19', time: '11:00', type: 'Technical' },
  ];

  const pendingFeedback = [
    { id: 4, candidate: 'David Nkosi', position: 'DevOps Engineer', interviewDate: '2026-02-14', type: 'Technical' },
    { id: 5, candidate: 'Erin Pillay', position: 'Marketing Lead', interviewDate: '2026-02-13', type: 'Behavioral' },
  ];

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-sm border border-gray-200 p-5">
          <h4 className="text-sm font-medium text-gray-500">Upcoming Interviews</h4>
          <p className="text-2xl font-bold text-gold-600 mt-1">{upcomingInterviews.length}</p>
        </div>
        <div className="bg-white rounded-sm border border-gray-200 p-5">
          <h4 className="text-sm font-medium text-gray-500">Pending Feedback</h4>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingFeedback.length}</p>
        </div>
        <div className="bg-white rounded-sm border border-gray-200 p-5">
          <h4 className="text-sm font-medium text-gray-500">Completed This Month</h4>
          <p className="text-2xl font-bold text-green-600 mt-1">12</p>
        </div>
        <div className="bg-white rounded-sm border border-gray-200 p-5">
          <h4 className="text-sm font-medium text-gray-500">Average Rating Given</h4>
          <p className="text-2xl font-bold text-purple-600 mt-1">4.2</p>
        </div>
      </div>

      {/* Upcoming Interviews */}
      <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-gold-500 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Interviews</h3>
        {upcomingInterviews.length === 0 ? (
          <p className="text-gray-500">No upcoming interviews scheduled.</p>
        ) : (
          <div className="space-y-3">
            {upcomingInterviews.map((interview) => (
              <div key={interview.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-sm">
                <div>
                  <p className="font-medium text-gray-900">{interview.candidate}</p>
                  <p className="text-sm text-gray-500">{interview.position}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{new Date(interview.date).toLocaleDateString()} at {interview.time}</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gold-100 text-gold-800">
                    {interview.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Feedback */}
      <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-gold-500 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Feedback</h3>
        {pendingFeedback.length === 0 ? (
          <p className="text-gray-500">All feedback has been submitted.</p>
        ) : (
          <div className="space-y-3">
            {pendingFeedback.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-sm border border-yellow-200">
                <div>
                  <p className="font-medium text-gray-900">{item.candidate}</p>
                  <p className="text-sm text-gray-500">{item.position} — {item.type} Interview</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Interviewed {new Date(item.interviewDate).toLocaleDateString()}</p>
                  <button className="mt-1 text-sm font-medium text-gold-600 hover:text-gold-800">
                    Submit Feedback
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewerDashboard;
