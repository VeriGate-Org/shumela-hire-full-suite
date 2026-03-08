# Feature Specifications: HRMS Module Expansion

**Reference:** RFP HR2026-BID-007 — uThukela Water HRMS
**Date:** 2026-03-08
**Status:** Specification (pre-implementation)

This document details the specifications for every new module required to close the gaps identified in the GAP analysis against the uThukela Water RFP. Each module includes entities, API endpoints, UI pages, workflows, and integration points.

All modules are registered as `PlatformFeature` entries and are tenant-gated via the existing feature gating system.

---

## Table of Contents

1. [Leave Administration Module](#1-leave-administration-module)
2. [Time & Attendance Module](#2-time--attendance-module)
3. [Training & Development Module](#3-training--development-module)
4. [Employee Engagement Module](#4-employee-engagement-module)
5. [Employee Profiles Enhancement](#5-employee-profiles-enhancement)
6. [Performance Management Enhancements](#6-performance-management-enhancements)
7. [Compliance & Labour Relations Module](#7-compliance--labour-relations-module)
8. [Sage Integration Module](#8-sage-integration-module)
9. [Active Directory SSO Module](#9-active-directory-sso-module)
10. [Analytics & Reporting Enhancements](#10-analytics--reporting-enhancements)
11. [Feature Gating Registry](#11-feature-gating-registry)

---

## 1. Leave Administration Module

**Feature Code:** `LEAVE_MANAGEMENT`
**Category:** `hr_core`
**Plans:** STARTER, STANDARD, ENTERPRISE

### 1.1 Entities

#### `LeaveType`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `code` | String(20) | e.g. `ANNUAL`, `SICK`, `MATERNITY`, `FAMILY`, `STUDY` |
| `name` | String(100) | Display name |
| `defaultDaysPerYear` | BigDecimal | Default annual allocation |
| `maxCarryForward` | BigDecimal | Maximum days carried to next cycle |
| `allowEncashment` | boolean | Whether leave encashment is permitted |
| `encashmentRate` | BigDecimal | Encashment value per day (nullable) |
| `requiresMedicalCert` | boolean | Whether medical certificate is required (e.g. sick > 2 days) |
| `medicalCertThresholdDays` | int | Number of consecutive days before certificate required |
| `accrualMethod` | Enum | `ANNUAL_GRANT`, `MONTHLY_ACCRUAL`, `PROPORTIONAL` |
| `isActive` | boolean | Soft-deactivate |
| `createdAt` / `updatedAt` | Timestamp | Audit timestamps |

#### `LeavePolicy`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `name` | String(100) | Policy name (e.g. "Standard Municipal Policy") |
| `description` | String(500) | Policy description |
| `effectiveFrom` | LocalDate | Start date |
| `effectiveTo` | LocalDate | End date (nullable = open-ended) |
| `leaveTypeAllocations` | JSON/JSONB | Map of `leaveTypeId` -> `{ daysPerYear, carryForward, encashment }` |
| `applicableDepartments` | JSON/JSONB | Department IDs this policy applies to (null = all) |
| `isDefault` | boolean | Whether this is the tenant's default policy |

#### `LeaveBalance`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `employeeId` | Long (FK) | Link to Employee |
| `leaveTypeId` | Long (FK) | Link to LeaveType |
| `cycleYear` | int | Leave cycle year (e.g. 2026) |
| `entitled` | BigDecimal | Total days entitled |
| `taken` | BigDecimal | Days already taken |
| `pending` | BigDecimal | Days in pending requests |
| `carriedForward` | BigDecimal | Days carried from previous cycle |
| `encashed` | BigDecimal | Days encashed |
| `available` | BigDecimal | Computed: entitled + carriedForward - taken - pending - encashed |
| `lastCalculatedAt` | Timestamp | Last balance recalculation |

#### `LeaveRequest`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `employeeId` | Long (FK) | Requesting employee |
| `leaveTypeId` | Long (FK) | Type of leave |
| `startDate` | LocalDate | Leave start |
| `endDate` | LocalDate | Leave end |
| `totalDays` | BigDecimal | Calculated working days (exclude weekends/holidays) |
| `isHalfDay` | boolean | Half-day request |
| `halfDayPeriod` | Enum | `MORNING`, `AFTERNOON` (nullable) |
| `reason` | String(500) | Employee's reason |
| `status` | Enum | `DRAFT`, `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `RECALLED` |
| `attachmentUrl` | String | Medical certificate or supporting document URL |
| `appliedAt` | Timestamp | When request was submitted |
| `decidedAt` | Timestamp | When approved/rejected |
| `decidedBy` | Long (FK) | Manager who decided |
| `decisionComment` | String(500) | Manager's comment |

#### `PublicHoliday`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `name` | String(100) | Holiday name |
| `date` | LocalDate | Holiday date |
| `isRecurring` | boolean | Whether it repeats annually |

### 1.2 API Endpoints

| Method | Path | Gate | Description |
|---|---|---|---|
| GET | `/api/leave/types` | `LEAVE_MANAGEMENT` | List leave types |
| POST | `/api/leave/types` | `LEAVE_MANAGEMENT` | Create leave type |
| PUT | `/api/leave/types/{id}` | `LEAVE_MANAGEMENT` | Update leave type |
| GET | `/api/leave/policies` | `LEAVE_MANAGEMENT` | List leave policies |
| POST | `/api/leave/policies` | `LEAVE_MANAGEMENT` | Create leave policy |
| PUT | `/api/leave/policies/{id}` | `LEAVE_MANAGEMENT` | Update leave policy |
| GET | `/api/leave/balances` | `LEAVE_MANAGEMENT` | Get current user's balances |
| GET | `/api/leave/balances/employee/{id}` | `LEAVE_MANAGEMENT` | Get employee's balances (manager) |
| GET | `/api/leave/balances/department/{id}` | `LEAVE_MANAGEMENT` | Department leave overview |
| POST | `/api/leave/requests` | `LEAVE_MANAGEMENT` | Submit leave request |
| PUT | `/api/leave/requests/{id}/approve` | `LEAVE_MANAGEMENT` | Approve leave request |
| PUT | `/api/leave/requests/{id}/reject` | `LEAVE_MANAGEMENT` | Reject leave request |
| PUT | `/api/leave/requests/{id}/cancel` | `LEAVE_MANAGEMENT` | Cancel leave request |
| GET | `/api/leave/requests` | `LEAVE_MANAGEMENT` | List requests (filterable) |
| GET | `/api/leave/requests/pending` | `LEAVE_MANAGEMENT` | Pending requests for manager |
| GET | `/api/leave/calendar` | `LEAVE_MANAGEMENT` | Team leave calendar view |
| GET | `/api/leave/analytics` | `LEAVE_MANAGEMENT` | Leave analytics & trends |
| POST | `/api/leave/encashment` | `LEAVE_MANAGEMENT` | Request leave encashment |
| GET | `/api/leave/holidays` | `LEAVE_MANAGEMENT` | List public holidays |
| POST | `/api/leave/holidays` | `LEAVE_MANAGEMENT` | Manage public holidays |

### 1.3 UI Pages

| Route | Description |
|---|---|
| `/leave` | Leave dashboard — balance cards, recent requests, team calendar |
| `/leave/request` | New leave request form |
| `/leave/requests` | All leave requests (filterable by status, type, date) |
| `/leave/approvals` | Manager approval queue |
| `/leave/calendar` | Team/department leave calendar |
| `/leave/policies` | Leave policy configuration (admin) |
| `/leave/analytics` | Leave trends, absenteeism, utilisation reports |

### 1.4 Workflows

1. **Leave Request Approval Flow:**
   Employee submits → Manager notified → Manager approves/rejects → Balance updated → Employee notified
   - If configured, escalate to HR after X days without action
   - Supports delegation (acting manager)

2. **Leave Encashment Flow:**
   Employee requests encashment → HR reviews → Finance approves → Payroll integration → Balance adjusted

3. **Carry-Forward Processing:**
   Annual batch job at cycle end → Calculate unused days → Apply carry-forward cap → Create new cycle balances

---

## 2. Time & Attendance Module

**Feature Codes:** `TIME_ATTENDANCE`, `GEOFENCING`, `SHIFT_SCHEDULING`
**Category:** `hr_core`
**Plans:** STANDARD/ENTERPRISE

### 2.1 Entities

#### `AttendanceRecord`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `employeeId` | Long (FK) | Employee |
| `date` | LocalDate | Attendance date |
| `clockIn` | Timestamp | Clock-in time |
| `clockOut` | Timestamp | Clock-out time (nullable until clocked out) |
| `clockInLatitude` | Double | GPS latitude at clock-in |
| `clockInLongitude` | Double | GPS longitude at clock-in |
| `clockOutLatitude` | Double | GPS latitude at clock-out |
| `clockOutLongitude` | Double | GPS longitude at clock-out |
| `clockInMethod` | Enum | `WEB`, `MOBILE_APP`, `BIOMETRIC`, `MANUAL` |
| `clockOutMethod` | Enum | Same as above |
| `totalHours` | BigDecimal | Computed hours worked |
| `overtimeHours` | BigDecimal | Computed overtime |
| `status` | Enum | `PRESENT`, `ABSENT`, `LATE`, `HALF_DAY`, `ON_LEAVE`, `HOLIDAY` |
| `isGeofenceVerified` | boolean | Whether GPS was within an authorised geofence |
| `notes` | String(500) | Employee/manager notes |
| `approvedBy` | Long (FK) | Manager who approved (for manual entries) |

#### `Geofence`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `name` | String(100) | Site name (e.g. "Newcastle Head Office") |
| `latitude` | Double | Centre latitude |
| `longitude` | Double | Centre longitude |
| `radiusMeters` | int | Allowed radius in metres |
| `isActive` | boolean | Whether geofence is active |
| `address` | String(300) | Human-readable address |

#### `Shift`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `name` | String(100) | Shift name (e.g. "Day Shift", "Night Shift") |
| `startTime` | LocalTime | Shift start |
| `endTime` | LocalTime | Shift end |
| `breakDurationMinutes` | int | Break duration |
| `isOvernight` | boolean | Whether shift crosses midnight |
| `colour` | String(7) | Hex colour for calendar display |

#### `ShiftSchedule`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `employeeId` | Long (FK) | Employee |
| `shiftId` | Long (FK) | Assigned shift |
| `date` | LocalDate | Schedule date |
| `status` | Enum | `SCHEDULED`, `SWAP_REQUESTED`, `SWAPPED`, `CANCELLED` |
| `swapRequestedWith` | Long (FK) | Employee requested to swap with |

#### `OvertimeRecord`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `employeeId` | Long (FK) | Employee |
| `attendanceRecordId` | Long (FK) | Link to attendance |
| `date` | LocalDate | Date of overtime |
| `hours` | BigDecimal | Overtime hours |
| `rate` | BigDecimal | Overtime rate multiplier (e.g. 1.5, 2.0) |
| `reason` | String(300) | Reason for overtime |
| `status` | Enum | `PENDING`, `APPROVED`, `REJECTED` |
| `approvedBy` | Long (FK) | Manager who approved |

### 2.2 API Endpoints

| Method | Path | Gate | Description |
|---|---|---|---|
| POST | `/api/attendance/clock-in` | `TIME_ATTENDANCE` | Clock in (with GPS) |
| POST | `/api/attendance/clock-out` | `TIME_ATTENDANCE` | Clock out (with GPS) |
| GET | `/api/attendance/status` | `TIME_ATTENDANCE` | Current clock status |
| GET | `/api/attendance/records` | `TIME_ATTENDANCE` | Attendance history (filterable) |
| GET | `/api/attendance/records/department/{id}` | `TIME_ATTENDANCE` | Department attendance |
| POST | `/api/attendance/manual` | `TIME_ATTENDANCE` | Manual attendance entry |
| PUT | `/api/attendance/{id}/approve` | `TIME_ATTENDANCE` | Approve manual entry |
| GET | `/api/geofences` | `GEOFENCING` | List geofences |
| POST | `/api/geofences` | `GEOFENCING` | Create geofence |
| PUT | `/api/geofences/{id}` | `GEOFENCING` | Update geofence |
| DELETE | `/api/geofences/{id}` | `GEOFENCING` | Delete geofence |
| POST | `/api/geofences/verify` | `GEOFENCING` | Verify GPS against geofences |
| GET | `/api/shifts` | `SHIFT_SCHEDULING` | List shift definitions |
| POST | `/api/shifts` | `SHIFT_SCHEDULING` | Create shift |
| GET | `/api/shifts/schedule` | `SHIFT_SCHEDULING` | Get schedule (date range) |
| POST | `/api/shifts/schedule` | `SHIFT_SCHEDULING` | Assign shift schedule |
| POST | `/api/shifts/schedule/swap` | `SHIFT_SCHEDULING` | Request shift swap |
| GET | `/api/overtime` | `TIME_ATTENDANCE` | Overtime records |
| POST | `/api/overtime` | `TIME_ATTENDANCE` | Log overtime |
| PUT | `/api/overtime/{id}/approve` | `TIME_ATTENDANCE` | Approve overtime |
| GET | `/api/attendance/analytics` | `TIME_ATTENDANCE` | Attendance analytics |

### 2.3 UI Pages

| Route | Description |
|---|---|
| `/time-attendance` | Attendance dashboard — clock-in button, today's status, weekly summary |
| `/time-attendance/records` | Attendance history with filter/search |
| `/time-attendance/team` | Team attendance overview (manager) |
| `/shift-scheduling` | Shift schedule calendar view |
| `/shift-scheduling/manage` | Shift definition and roster management (admin) |
| `/time-attendance/geofences` | Geofence map configuration (admin) |
| `/time-attendance/overtime` | Overtime log and approval queue |

### 2.4 Key Behaviours

- **GPS Verification:** On clock-in/out, the mobile/web app captures GPS coordinates and sends to the backend. Backend checks against active geofences. If no geofence is matched, `isGeofenceVerified = false` and a warning is logged.
- **Low-Bandwidth Optimisation:** Attendance data should be cacheable offline (PWA service worker). Clock-in/out operations use minimal payload (lat, lng, timestamp) and queue when offline.
- **Payroll Sync:** Attendance hours and overtime feed into the payroll integration for salary calculation.

---

## 3. Training & Development Module

**Feature Codes:** `TRAINING_MANAGEMENT`, `LMS_INTEGRATION`, `SKILL_GAP_ANALYSIS`
**Category:** `talent_development`
**Plans:** STANDARD/ENTERPRISE

### 3.1 Entities

#### `TrainingCourse`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `title` | String(200) | Course title |
| `description` | String(2000) | Detailed description |
| `category` | String(50) | e.g. `TECHNICAL`, `COMPLIANCE`, `LEADERSHIP`, `SAFETY` |
| `deliveryMethod` | Enum | `IN_PERSON`, `VIRTUAL`, `ONLINE_SELF_PACED`, `BLENDED` |
| `provider` | String(200) | Training provider name |
| `durationHours` | BigDecimal | Expected duration |
| `maxParticipants` | int | Capacity (0 = unlimited) |
| `cost` | BigDecimal | Cost per participant |
| `currency` | String(3) | ISO currency code |
| `isMandatory` | boolean | Whether completion is required |
| `linkedSkillIds` | JSON | Skills developed by this course |
| `linkedCompetencyIds` | JSON | Competencies addressed |
| `isActive` | boolean | Whether course is currently offered |
| `externalLmsId` | String(100) | External LMS course identifier |
| `externalLmsUrl` | String(500) | Direct LMS course URL |

#### `TrainingSession`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `courseId` | Long (FK) | Link to TrainingCourse |
| `scheduledDate` | LocalDate | Session date |
| `startTime` | LocalTime | Start time |
| `endTime` | LocalTime | End time |
| `location` | String(200) | Venue or meeting link |
| `facilitator` | String(100) | Trainer/facilitator name |
| `status` | Enum | `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |

#### `TrainingEnrollment`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `employeeId` | Long (FK) | Employee |
| `courseId` | Long (FK) | Course |
| `sessionId` | Long (FK) | Specific session (nullable for self-paced) |
| `status` | Enum | `ENROLLED`, `IN_PROGRESS`, `COMPLETED`, `WITHDRAWN`, `FAILED` |
| `enrolledAt` | Timestamp | Enrollment date |
| `completedAt` | Timestamp | Completion date |
| `score` | BigDecimal | Assessment score (nullable) |
| `certificateUrl` | String | Completion certificate URL |
| `managerApproved` | boolean | Whether manager approved enrollment |
| `feedbackRating` | int | 1-5 post-training rating |
| `feedbackComments` | String(500) | Post-training feedback |

#### `Certification`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `employeeId` | Long (FK) | Employee |
| `name` | String(200) | Certification name |
| `issuingBody` | String(200) | Certifying organisation |
| `certificationNumber` | String(100) | Certificate/licence number |
| `issueDate` | LocalDate | Date issued |
| `expiryDate` | LocalDate | Expiry date (nullable if non-expiring) |
| `status` | Enum | `ACTIVE`, `EXPIRED`, `REVOKED`, `PENDING_RENEWAL` |
| `documentUrl` | String | Uploaded certificate scan |
| `linkedCourseId` | Long (FK) | Training course that led to this cert (nullable) |
| `renewalReminderDays` | int | Days before expiry to send reminder |

### 3.2 API Endpoints

| Method | Path | Gate | Description |
|---|---|---|---|
| GET | `/api/training/courses` | `TRAINING_MANAGEMENT` | List courses |
| POST | `/api/training/courses` | `TRAINING_MANAGEMENT` | Create course |
| PUT | `/api/training/courses/{id}` | `TRAINING_MANAGEMENT` | Update course |
| GET | `/api/training/sessions` | `TRAINING_MANAGEMENT` | List sessions |
| POST | `/api/training/sessions` | `TRAINING_MANAGEMENT` | Create session |
| POST | `/api/training/enroll` | `TRAINING_MANAGEMENT` | Enroll employee |
| PUT | `/api/training/enrollments/{id}/complete` | `TRAINING_MANAGEMENT` | Mark completed |
| PUT | `/api/training/enrollments/{id}/feedback` | `TRAINING_MANAGEMENT` | Submit feedback |
| GET | `/api/training/enrollments/employee/{id}` | `TRAINING_MANAGEMENT` | Employee's enrollments |
| GET | `/api/training/certifications` | `TRAINING_MANAGEMENT` | List certifications |
| POST | `/api/training/certifications` | `TRAINING_MANAGEMENT` | Add certification |
| GET | `/api/training/certifications/expiring` | `TRAINING_MANAGEMENT` | Expiring certifications |
| GET | `/api/training/analytics` | `TRAINING_MANAGEMENT` | Training effectiveness analytics |
| GET | `/api/training/skill-gaps` | `SKILL_GAP_ANALYSIS` | Skill gap analysis |
| GET | `/api/training/recommendations/{employeeId}` | `SKILL_GAP_ANALYSIS` | Personalised recommendations |

### 3.3 UI Pages

| Route | Description |
|---|---|
| `/training` | Training dashboard — upcoming sessions, my enrollments, certification status |
| `/training/courses` | Course catalogue with search and filter |
| `/training/courses/{id}` | Course detail with enrollment action |
| `/training/sessions` | Session calendar view |
| `/training/certifications` | Certification tracker with expiry alerts |
| `/training/skill-gaps` | Skill gap analysis dashboard |
| `/training/analytics` | Training effectiveness reporting |
| `/training/admin` | Course and session management (admin) |

---

## 4. Employee Engagement Module

**Feature Codes:** `EMPLOYEE_ENGAGEMENT`, `PULSE_SURVEYS`, `RECOGNITION_REWARDS`, `WELLNESS_PROGRAMS`
**Category:** `engagement`
**Plans:** STANDARD/ENTERPRISE

### 4.1 Entities

#### `Survey`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `title` | String(200) | Survey title |
| `description` | String(500) | Survey description |
| `type` | Enum | `PULSE`, `ANNUAL`, `EXIT`, `ONBOARDING`, `CUSTOM` |
| `status` | Enum | `DRAFT`, `ACTIVE`, `CLOSED`, `ARCHIVED` |
| `isAnonymous` | boolean | Whether responses are anonymous |
| `startDate` | LocalDate | Survey open date |
| `endDate` | LocalDate | Survey close date |
| `targetAudience` | JSON | Department IDs, role filters, or "ALL" |
| `createdBy` | Long (FK) | Creator |
| `responseCount` | int | Cached response count |

#### `SurveyQuestion`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `surveyId` | Long (FK) | Parent survey |
| `questionText` | String(500) | The question |
| `questionType` | Enum | `RATING_1_5`, `RATING_1_10`, `YES_NO`, `MULTIPLE_CHOICE`, `FREE_TEXT`, `NPS` |
| `options` | JSON | Answer options (for multiple choice) |
| `isRequired` | boolean | Whether answer is mandatory |
| `sortOrder` | int | Display order |

#### `SurveyResponse`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `surveyId` | Long (FK) | Parent survey |
| `respondentId` | Long (FK) | Employee (null if anonymous) |
| `submittedAt` | Timestamp | Submission time |
| `answers` | JSON | Map of questionId -> answer value |

#### `Recognition`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `fromEmployeeId` | Long (FK) | Giver |
| `toEmployeeId` | Long (FK) | Receiver |
| `category` | Enum | `TEAMWORK`, `INNOVATION`, `LEADERSHIP`, `SERVICE_EXCELLENCE`, `GOING_ABOVE`, `VALUES` |
| `message` | String(500) | Recognition message |
| `points` | int | Points awarded (if points system enabled) |
| `isPublic` | boolean | Visible on company feed |
| `createdAt` | Timestamp | When recognition was given |
| `reactionsCount` | int | Number of reactions from colleagues |

#### `WellnessProgram`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `name` | String(200) | Program name |
| `description` | String(1000) | Program description |
| `type` | Enum | `CHALLENGE`, `EAP_REFERRAL`, `HEALTH_SCREENING`, `WORKSHOP` |
| `startDate` | LocalDate | Program start |
| `endDate` | LocalDate | Program end |
| `isActive` | boolean | Active status |

### 4.2 API Endpoints

| Method | Path | Gate | Description |
|---|---|---|---|
| GET | `/api/surveys` | `PULSE_SURVEYS` | List surveys |
| POST | `/api/surveys` | `PULSE_SURVEYS` | Create survey |
| PUT | `/api/surveys/{id}` | `PULSE_SURVEYS` | Update survey |
| POST | `/api/surveys/{id}/publish` | `PULSE_SURVEYS` | Publish survey |
| GET | `/api/surveys/{id}/questions` | `PULSE_SURVEYS` | Get survey questions |
| POST | `/api/surveys/{id}/respond` | `PULSE_SURVEYS` | Submit response |
| GET | `/api/surveys/{id}/results` | `PULSE_SURVEYS` | Aggregated results |
| GET | `/api/surveys/{id}/analytics` | `PULSE_SURVEYS` | Sentiment analysis |
| GET | `/api/recognition` | `RECOGNITION_REWARDS` | Recognition feed |
| POST | `/api/recognition` | `RECOGNITION_REWARDS` | Give recognition |
| GET | `/api/recognition/leaderboard` | `RECOGNITION_REWARDS` | Points leaderboard |
| GET | `/api/recognition/employee/{id}` | `RECOGNITION_REWARDS` | Employee's recognitions |
| GET | `/api/wellness/programs` | `WELLNESS_PROGRAMS` | List wellness programs |
| POST | `/api/wellness/programs` | `WELLNESS_PROGRAMS` | Create program |
| POST | `/api/wellness/programs/{id}/enroll` | `WELLNESS_PROGRAMS` | Enroll in program |

### 4.3 UI Pages

| Route | Description |
|---|---|
| `/engagement` | Engagement dashboard — eNPS score, recent surveys, recognition feed |
| `/engagement/surveys` | Survey management and listing |
| `/engagement/surveys/{id}` | Survey detail / take survey |
| `/engagement/surveys/{id}/results` | Survey results and analytics |
| `/engagement/recognition` | Recognition wall / feed |
| `/engagement/recognition/give` | Give recognition form |
| `/engagement/wellness` | Wellness programs listing |

---

## 5. Employee Profiles Enhancement

**Feature Codes:** `EMPLOYEE_SELF_SERVICE`, `EMPLOYEE_DOCUMENTS`
**Category:** `hr_core`
**Plans:** STARTER, STANDARD, ENTERPRISE

### 5.1 Entity Enhancements to `Employee`

Add the following fields to the existing `Employee` entity:

| Field | Type | Description |
|---|---|---|
| `idNumber` | String(20) | SA ID or passport number (encrypted) |
| `idType` | Enum | `SA_ID`, `PASSPORT`, `WORK_PERMIT` |
| `taxNumber` | String(20) | Tax reference number (encrypted) |
| `bankName` | String(100) | Bank name |
| `bankAccountNumber` | String(20) | Account number (encrypted) |
| `bankBranchCode` | String(10) | Branch code |
| `emergencyContactName` | String(100) | Emergency contact |
| `emergencyContactPhone` | String(20) | Emergency phone |
| `emergencyContactRelation` | String(50) | Relationship |
| `physicalAddress` | String(500) | Residential address |
| `postalAddress` | String(500) | Postal address |
| `maritalStatus` | Enum | `SINGLE`, `MARRIED`, `DIVORCED`, `WIDOWED` |
| `numberOfDependants` | int | Number of dependants |
| `disability` | boolean | Disability status |
| `disabilityDetails` | String(300) | Disability description |
| `race` | String(30) | EE reporting (SA requirement) |
| `gender` | String(20) | EE reporting |
| `unionMembership` | String(100) | Union affiliation |
| `probationEndDate` | LocalDate | End of probation period |

### 5.2 New Entity: `EmployeeDocumentType`

| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `code` | String(30) | e.g. `SA_ID`, `PASSPORT`, `DRIVERS_LICENCE`, `QUALIFICATION`, `CONTRACT` |
| `name` | String(100) | Display name |
| `isMandatory` | boolean | Whether all employees must have this |
| `hasExpiry` | boolean | Whether document expires |
| `reminderDaysBefore` | int | Days before expiry to send reminder |

### 5.3 Enhancement to `EmployeeDocument`

Add:

| Field | Type | Description |
|---|---|---|
| `documentTypeId` | Long (FK) | Link to EmployeeDocumentType |
| `expiryDate` | LocalDate | Document expiry date |
| `isVerified` | boolean | HR-verified status |
| `verifiedBy` | Long (FK) | Verifier |
| `verifiedAt` | Timestamp | Verification date |
| `version` | int | Document version (for re-uploads) |

### 5.4 API Endpoints

| Method | Path | Gate | Description |
|---|---|---|---|
| GET | `/api/employee/profile` | `EMPLOYEE_SELF_SERVICE` | Get own profile |
| PUT | `/api/employee/profile` | `EMPLOYEE_SELF_SERVICE` | Update own personal details |
| PUT | `/api/employee/profile/banking` | `EMPLOYEE_SELF_SERVICE` | Update banking details |
| PUT | `/api/employee/profile/emergency-contact` | `EMPLOYEE_SELF_SERVICE` | Update emergency contact |
| GET | `/api/employee/documents` | `EMPLOYEE_DOCUMENTS` | List own documents |
| POST | `/api/employee/documents` | `EMPLOYEE_DOCUMENTS` | Upload document |
| GET | `/api/employee/documents/types` | `EMPLOYEE_DOCUMENTS` | List document types |
| GET | `/api/employee/documents/expiring` | `EMPLOYEE_DOCUMENTS` | Documents nearing expiry |
| PUT | `/api/employee/documents/{id}/verify` | `EMPLOYEE_DOCUMENTS` | Verify document (HR) |

### 5.5 UI Pages

| Route | Description |
|---|---|
| `/employee/portal` | Self-service portal — personal details, leave, payslips, documents |
| `/employee/documents` | Document management — upload, view, expiry tracking |
| `/employee/profile/edit` | Edit personal information form |

---

## 6. Performance Management Enhancements

**Feature Codes:** `PERFORMANCE_360_FEEDBACK`, `PERFORMANCE_PIP`, `COMPETENCY_MAPPING`
**Category:** `talent_development`
**Plans:** STANDARD/ENTERPRISE

### 6.1 New Entities

#### `FeedbackRequest` (360-Degree)
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `reviewId` | Long (FK) | Link to PerformanceReview |
| `revieweeId` | Long (FK) | Employee being reviewed |
| `reviewerId` | Long (FK) | Person providing feedback |
| `relationship` | Enum | `MANAGER`, `PEER`, `SUBORDINATE`, `SELF`, `EXTERNAL` |
| `status` | Enum | `PENDING`, `SUBMITTED`, `DECLINED` |
| `isAnonymous` | boolean | Whether feedback is anonymous |
| `dueDate` | LocalDate | Deadline for submission |
| `submittedAt` | Timestamp | When feedback was submitted |

#### `FeedbackResponse`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `feedbackRequestId` | Long (FK) | Link to FeedbackRequest |
| `competencyId` | Long (FK) | Competency being rated (nullable) |
| `rating` | int | 1-5 rating |
| `comment` | String(1000) | Qualitative feedback |

#### `PerformanceImprovementPlan`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `employeeId` | Long (FK) | Employee on PIP |
| `managerId` | Long (FK) | Supervising manager |
| `hrPartnerId` | Long (FK) | HR business partner |
| `reason` | String(1000) | Reason for PIP |
| `startDate` | LocalDate | PIP start |
| `endDate` | LocalDate | Expected PIP end |
| `status` | Enum | `ACTIVE`, `EXTENDED`, `COMPLETED_SUCCESS`, `COMPLETED_FAIL`, `CANCELLED` |
| `outcome` | String(500) | Final outcome description |

#### `PipMilestone`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `pipId` | Long (FK) | Parent PIP |
| `title` | String(200) | Milestone title |
| `description` | String(500) | What needs to be achieved |
| `targetDate` | LocalDate | Due date |
| `status` | Enum | `NOT_STARTED`, `IN_PROGRESS`, `MET`, `NOT_MET` |
| `evidence` | String(500) | Evidence of completion |
| `reviewedAt` | Timestamp | When reviewed |
| `reviewedBy` | Long (FK) | Reviewer |

#### `CompetencyFramework`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `name` | String(100) | Framework name |
| `description` | String(500) | Description |
| `isActive` | boolean | Active status |

#### `Competency`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `frameworkId` | Long (FK) | Parent framework |
| `name` | String(100) | Competency name |
| `description` | String(500) | Competency description |
| `category` | Enum | `CORE`, `FUNCTIONAL`, `LEADERSHIP`, `TECHNICAL` |
| `proficiencyLevels` | JSON | Array of `{ level: 1-5, label, description }` |

#### `EmployeeCompetency`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `employeeId` | Long (FK) | Employee |
| `competencyId` | Long (FK) | Competency |
| `currentLevel` | int | Current proficiency (1-5) |
| `targetLevel` | int | Target proficiency for role |
| `assessedAt` | Timestamp | Last assessment date |
| `assessedBy` | Long (FK) | Assessor |

### 6.2 API Endpoints

| Method | Path | Gate | Description |
|---|---|---|---|
| POST | `/api/performance/360/request` | `PERFORMANCE_360_FEEDBACK` | Request 360 feedback |
| GET | `/api/performance/360/pending` | `PERFORMANCE_360_FEEDBACK` | Pending feedback requests |
| POST | `/api/performance/360/{id}/submit` | `PERFORMANCE_360_FEEDBACK` | Submit 360 feedback |
| GET | `/api/performance/360/summary/{reviewId}` | `PERFORMANCE_360_FEEDBACK` | Aggregated 360 summary |
| GET | `/api/performance/pips` | `PERFORMANCE_PIP` | List PIPs |
| POST | `/api/performance/pips` | `PERFORMANCE_PIP` | Create PIP |
| PUT | `/api/performance/pips/{id}` | `PERFORMANCE_PIP` | Update PIP |
| POST | `/api/performance/pips/{id}/milestones` | `PERFORMANCE_PIP` | Add milestone |
| PUT | `/api/performance/pips/{id}/milestones/{mid}` | `PERFORMANCE_PIP` | Update milestone |
| GET | `/api/competencies/frameworks` | `COMPETENCY_MAPPING` | List frameworks |
| POST | `/api/competencies/frameworks` | `COMPETENCY_MAPPING` | Create framework |
| GET | `/api/competencies/frameworks/{id}` | `COMPETENCY_MAPPING` | Get framework with competencies |
| POST | `/api/competencies` | `COMPETENCY_MAPPING` | Create competency |
| GET | `/api/competencies/employee/{id}` | `COMPETENCY_MAPPING` | Employee competency profile |
| PUT | `/api/competencies/employee/{id}/assess` | `COMPETENCY_MAPPING` | Assess employee competency |
| GET | `/api/competencies/gaps/department/{id}` | `COMPETENCY_MAPPING` | Department competency gaps |

### 6.3 UI Pages

| Route | Description |
|---|---|
| `/performance/360` | 360-degree feedback management |
| `/performance/360/provide/{requestId}` | Submit 360 feedback form |
| `/performance/pips` | PIP listing and management |
| `/performance/pips/{id}` | PIP detail with milestones timeline |
| `/competencies` | Competency framework browser |
| `/competencies/profile` | My competency profile |
| `/competencies/gaps` | Competency gap analysis dashboard |

---

## 7. Compliance & Labour Relations Module

**Feature Codes:** `POPIA_COMPLIANCE`, `LABOUR_RELATIONS`, `COMPLIANCE_REMINDERS`
**Category:** `compliance`
**Plans:** STARTER/STANDARD/ENTERPRISE

### 7.1 Entities

#### `ConsentRecord`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `employeeId` | Long (FK) | Employee/data subject |
| `consentType` | Enum | `EMPLOYMENT_DATA`, `BACKGROUND_CHECK`, `MARKETING`, `ANALYTICS`, `THIRD_PARTY_SHARING` |
| `consentGiven` | boolean | Whether consent was granted |
| `consentDate` | Timestamp | When consent was given/revoked |
| `expiryDate` | LocalDate | Consent expiry (nullable) |
| `version` | String(20) | Policy version consented to |
| `ipAddress` | String(45) | IP from which consent was given |

#### `DataSubjectRequest`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `requestType` | Enum | `ACCESS`, `RECTIFICATION`, `ERASURE`, `RESTRICTION`, `PORTABILITY`, `OBJECTION` |
| `subjectId` | Long (FK) | Data subject (employee) |
| `requestedAt` | Timestamp | Request date |
| `status` | Enum | `RECEIVED`, `IN_PROGRESS`, `COMPLETED`, `REJECTED` |
| `dueDate` | LocalDate | Regulatory deadline (30 days from request per POPIA) |
| `completedAt` | Timestamp | Completion date |
| `handledBy` | Long (FK) | Information officer handling |
| `responseNotes` | String(1000) | Response details |

#### `DisciplinaryCase`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `employeeId` | Long (FK) | Employee |
| `caseNumber` | String(30) | Unique case reference |
| `offenceCategory` | Enum | `MISCONDUCT`, `GROSS_MISCONDUCT`, `POOR_PERFORMANCE`, `INCAPACITY`, `OPERATIONAL` |
| `description` | String(2000) | Offence description |
| `dateOfOffence` | LocalDate | When offence occurred |
| `status` | Enum | `INVESTIGATION`, `HEARING_SCHEDULED`, `HEARING_HELD`, `APPEAL`, `CLOSED` |
| `outcome` | Enum | `VERBAL_WARNING`, `WRITTEN_WARNING`, `FINAL_WARNING`, `SUSPENSION`, `DISMISSAL`, `NOT_GUILTY`, `COUNSELLING` |
| `warningExpiryDate` | LocalDate | When warning expires |
| `hearingDate` | LocalDate | Disciplinary hearing date |
| `hearingChairperson` | String(100) | Chairperson name |
| `employeeRepresentative` | String(100) | Union rep or colleague |
| `appealDeadline` | LocalDate | Appeal deadline |
| `ccmaReferral` | boolean | Whether referred to CCMA |
| `ccmaCaseNumber` | String(30) | CCMA case number |

#### `Grievance`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `employeeId` | Long (FK) | Complainant |
| `grievanceType` | Enum | `UNFAIR_TREATMENT`, `HARASSMENT`, `DISCRIMINATION`, `WORKING_CONDITIONS`, `POLICY_VIOLATION`, `OTHER` |
| `description` | String(2000) | Grievance description |
| `filedDate` | LocalDate | Date filed |
| `status` | Enum | `FILED`, `UNDER_INVESTIGATION`, `MEDIATION`, `RESOLVED`, `ESCALATED`, `WITHDRAWN` |
| `assignedTo` | Long (FK) | HR person handling |
| `resolution` | String(1000) | Resolution details |
| `resolvedDate` | LocalDate | Resolution date |

#### `ComplianceReminder`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `type` | Enum | `CERTIFICATION_EXPIRY`, `LICENCE_RENEWAL`, `MANDATORY_TRAINING`, `CONTRACT_RENEWAL`, `PROBATION_END`, `WARNING_EXPIRY` |
| `referenceId` | Long | ID of the related entity |
| `referenceType` | String(50) | Entity type (e.g. "Certification", "DisciplinaryCase") |
| `employeeId` | Long (FK) | Affected employee |
| `dueDate` | LocalDate | Deadline date |
| `reminderDate` | LocalDate | When to send reminder |
| `status` | Enum | `PENDING`, `SENT`, `ACKNOWLEDGED`, `ACTIONED`, `EXPIRED` |
| `notifiedAt` | Timestamp | When reminder was sent |

### 7.2 API Endpoints

| Method | Path | Gate | Description |
|---|---|---|---|
| GET | `/api/compliance/consents` | `POPIA_COMPLIANCE` | List consent records |
| POST | `/api/compliance/consents` | `POPIA_COMPLIANCE` | Record consent |
| PUT | `/api/compliance/consents/{id}/revoke` | `POPIA_COMPLIANCE` | Revoke consent |
| GET | `/api/compliance/dsar` | `POPIA_COMPLIANCE` | List DSARs |
| POST | `/api/compliance/dsar` | `POPIA_COMPLIANCE` | Submit DSAR |
| PUT | `/api/compliance/dsar/{id}` | `POPIA_COMPLIANCE` | Update DSAR status |
| GET | `/api/compliance/dsar/overdue` | `POPIA_COMPLIANCE` | Overdue DSARs |
| GET | `/api/labour/disciplinary` | `LABOUR_RELATIONS` | List disciplinary cases |
| POST | `/api/labour/disciplinary` | `LABOUR_RELATIONS` | Create disciplinary case |
| PUT | `/api/labour/disciplinary/{id}` | `LABOUR_RELATIONS` | Update case |
| GET | `/api/labour/grievances` | `LABOUR_RELATIONS` | List grievances |
| POST | `/api/labour/grievances` | `LABOUR_RELATIONS` | File grievance |
| PUT | `/api/labour/grievances/{id}` | `LABOUR_RELATIONS` | Update grievance |
| GET | `/api/compliance/reminders` | `COMPLIANCE_REMINDERS` | List reminders |
| GET | `/api/compliance/reminders/upcoming` | `COMPLIANCE_REMINDERS` | Upcoming reminders |
| POST | `/api/compliance/reminders/{id}/acknowledge` | `COMPLIANCE_REMINDERS` | Acknowledge reminder |
| GET | `/api/compliance/dashboard` | `POPIA_COMPLIANCE` | Compliance dashboard metrics |

### 7.3 UI Pages

| Route | Description |
|---|---|
| `/admin/compliance` | POPIA compliance dashboard — consent status, DSAR queue, data retention |
| `/admin/compliance/consents` | Consent management |
| `/admin/compliance/dsar` | DSAR workflow management |
| `/admin/labour-relations` | Labour relations dashboard |
| `/admin/labour-relations/disciplinary` | Disciplinary case management |
| `/admin/labour-relations/disciplinary/{id}` | Case detail with hearing notes, timeline |
| `/admin/labour-relations/grievances` | Grievance management |
| `/admin/labour-relations/grievances/{id}` | Grievance detail |
| `/admin/compliance/reminders` | Compliance reminders overview |

---

## 8. Sage Integration Module

**Feature Codes:** `SAGE_300_PEOPLE`, `SAGE_EVOLUTION`
**Category:** `integrations`
**Plans:** STANDARD, ENTERPRISE

### 8.1 Architecture

The Sage integration uses a **connector-based architecture** (similar to the existing job board connectors):

```
ShumelaHire <-> Integration Service <-> Sage SDK/API
                     |
              SageConnectorConfig (per-tenant)
              SyncSchedule
              SyncLog
```

### 8.2 Entities

#### `SageConnectorConfig`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `type` | Enum | `SAGE_300_PEOPLE`, `SAGE_EVOLUTION` |
| `apiEndpoint` | String(500) | Sage API/SDK endpoint URL |
| `authMethod` | Enum | `API_KEY`, `OAUTH2`, `BASIC` |
| `credentials` | String (encrypted) | Connection credentials |
| `companyId` | String(50) | Sage company identifier |
| `isActive` | boolean | Connection enabled |
| `lastTestedAt` | Timestamp | Last successful connection test |
| `syncFrequencyMinutes` | int | Sync interval |

#### `SageSyncSchedule`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `connectorId` | Long (FK) | Parent connector |
| `entityType` | Enum | `EMPLOYEE`, `LEAVE`, `PAYROLL`, `DEPARTMENT`, `POSITION` |
| `direction` | Enum | `INBOUND`, `OUTBOUND`, `BIDIRECTIONAL` |
| `frequency` | Enum | `REAL_TIME`, `HOURLY`, `DAILY`, `WEEKLY`, `ON_DEMAND` |
| `lastSyncAt` | Timestamp | Last sync timestamp |
| `nextSyncAt` | Timestamp | Next scheduled sync |
| `isActive` | boolean | Schedule enabled |

#### `SageSyncLog`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `connectorId` | Long (FK) | Connector used |
| `entityType` | String(50) | What was synced |
| `direction` | String(20) | INBOUND/OUTBOUND |
| `status` | Enum | `SUCCESS`, `PARTIAL`, `FAILED` |
| `recordsProcessed` | int | Records synced |
| `recordsFailed` | int | Records that failed |
| `errorDetails` | String(2000) | Error messages |
| `startedAt` | Timestamp | Sync start |
| `completedAt` | Timestamp | Sync end |
| `durationMs` | long | Duration in milliseconds |

### 8.3 Data Mapping (Sage 300 People)

| Sage 300 Entity | ShumelaHire Entity | Direction | Notes |
|---|---|---|---|
| Employee Master | Employee | Bidirectional | Employee number, personal details, position |
| Leave Transactions | LeaveRequest, LeaveBalance | Bidirectional | Leave taken, balances |
| Department | Department | Inbound | Org structure |
| Position | Job Posting / Requisition | Inbound | Position codes |
| Training Records | TrainingEnrollment | Outbound | Training completions |
| Qualifications | Certification | Bidirectional | Employee qualifications |

### 8.4 Data Mapping (Sage Evolution ERP)

| Sage Evolution Entity | ShumelaHire Entity | Direction | Notes |
|---|---|---|---|
| Payroll | Salary/Payslip data | Inbound | Salary info, payslips |
| Employee Costs | OvertimeRecord, LeaveEncashment | Outbound | Cost items |
| GL Journals | N/A | Outbound | Payroll cost journals |
| Tax Certificates | Employee documents | Inbound | IRP5/IT3a |

### 8.5 API Endpoints

| Method | Path | Gate | Description |
|---|---|---|---|
| GET | `/api/integrations/sage/config` | `SAGE_300_PEOPLE` | Get connector configs |
| POST | `/api/integrations/sage/config` | `SAGE_300_PEOPLE` | Create connector |
| PUT | `/api/integrations/sage/config/{id}` | `SAGE_300_PEOPLE` | Update connector |
| POST | `/api/integrations/sage/config/{id}/test` | `SAGE_300_PEOPLE` | Test connection |
| GET | `/api/integrations/sage/schedules` | `SAGE_300_PEOPLE` | Get sync schedules |
| POST | `/api/integrations/sage/schedules` | `SAGE_300_PEOPLE` | Create schedule |
| POST | `/api/integrations/sage/sync/{entityType}` | `SAGE_300_PEOPLE` | Trigger manual sync |
| GET | `/api/integrations/sage/logs` | `SAGE_300_PEOPLE` | Sync history logs |
| GET | `/api/integrations/sage/status` | `SAGE_300_PEOPLE` | Integration health dashboard |

### 8.6 UI Pages

| Route | Description |
|---|---|
| `/integrations/sage` | Sage integration dashboard — connection status, sync health |
| `/integrations/sage/config` | Connector configuration (credentials, endpoints) |
| `/integrations/sage/mappings` | Field mapping configuration |
| `/integrations/sage/schedules` | Sync schedule management |
| `/integrations/sage/logs` | Sync log viewer |

---

## 9. Active Directory SSO Module

**Feature Code:** `AD_SSO`
**Category:** `integrations`
**Plans:** STANDARD, ENTERPRISE

### 9.1 Architecture

Extend the existing Cognito auth to support AD as an identity provider:

```
User Browser -> Cognito Hosted UI -> AD Federation (SAML2/OIDC)
                     |
              AD Group -> Cognito Group -> ShumelaHire Role
```

### 9.2 Configuration Entity

#### `SsoConfiguration`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `provider` | Enum | `AZURE_AD`, `ON_PREM_AD`, `OKTA`, `CUSTOM_SAML` |
| `metadataUrl` | String(500) | Federation metadata URL |
| `clientId` | String(200) | OIDC client ID |
| `clientSecret` | String (encrypted) | OIDC client secret |
| `tenantAdId` | String(100) | Azure AD tenant ID |
| `domainHint` | String(100) | Domain hint for login |
| `groupMappings` | JSON | Map of AD group -> ShumelaHire role |
| `autoProvision` | boolean | Auto-create users on first login |
| `isActive` | boolean | SSO enabled |

### 9.3 API Endpoints

| Method | Path | Gate | Description |
|---|---|---|---|
| GET | `/api/sso/config` | `AD_SSO` | Get SSO configuration |
| POST | `/api/sso/config` | `AD_SSO` | Create/update SSO config |
| POST | `/api/sso/config/test` | `AD_SSO` | Test AD connectivity |
| GET | `/api/sso/groups` | `AD_SSO` | List AD groups for mapping |
| PUT | `/api/sso/group-mappings` | `AD_SSO` | Update group-to-role mappings |
| GET | `/api/sso/audit` | `AD_SSO` | SSO login audit log |

### 9.4 UI Pages

| Route | Description |
|---|---|
| `/integrations/sso` | SSO configuration page |
| `/integrations/sso/mappings` | AD group to role mapping UI |

---

## 10. Analytics & Reporting Enhancements

**Feature Codes:** `ADVANCED_ANALYTICS`, `PREDICTIVE_ANALYTICS`, `REPORT_EXPORT`
**Category:** `analytics`
**Plans:** STARTER/STANDARD/ENTERPRISE

### 10.1 New Analytics Dashboards

| Dashboard | Metrics | Gate |
|---|---|---|
| **HR Overview** | Headcount, turnover rate, new hires, exits, diversity breakdown | `ADVANCED_ANALYTICS` |
| **Leave Analytics** | Leave utilisation, absenteeism rate, leave trends by type/dept | `ADVANCED_ANALYTICS` |
| **Attendance Analytics** | Punctuality rates, overtime trends, attendance patterns | `ADVANCED_ANALYTICS` |
| **Training Analytics** | Training hours per employee, completion rates, budget utilisation | `ADVANCED_ANALYTICS` |
| **Engagement Analytics** | eNPS score, survey trends, recognition activity | `ADVANCED_ANALYTICS` |
| **Compliance Dashboard** | DSAR status, consent coverage, warning expiry, certification gaps | `ADVANCED_ANALYTICS` |
| **Workforce Planning** | Attrition prediction, succession readiness, talent pipeline health | `PREDICTIVE_ANALYTICS` |

### 10.2 Report Export

#### `ReportExportJob`
| Field | Type | Description |
|---|---|---|
| `id` | Long (PK) | Auto-generated |
| `tenantId` | String | Tenant scope |
| `reportType` | String(50) | Report identifier |
| `format` | Enum | `PDF`, `EXCEL`, `CSV` |
| `filters` | JSON | Applied filters |
| `status` | Enum | `QUEUED`, `GENERATING`, `COMPLETED`, `FAILED` |
| `requestedBy` | Long (FK) | User who requested |
| `requestedAt` | Timestamp | Request time |
| `completedAt` | Timestamp | Completion time |
| `fileUrl` | String | Download URL (S3 presigned) |
| `fileSizeBytes` | long | File size |

### 10.3 API Endpoints

| Method | Path | Gate | Description |
|---|---|---|---|
| GET | `/api/analytics/hr-overview` | `ADVANCED_ANALYTICS` | HR overview metrics |
| GET | `/api/analytics/leave` | `ADVANCED_ANALYTICS` | Leave analytics |
| GET | `/api/analytics/attendance` | `ADVANCED_ANALYTICS` | Attendance analytics |
| GET | `/api/analytics/training` | `ADVANCED_ANALYTICS` | Training analytics |
| GET | `/api/analytics/engagement` | `ADVANCED_ANALYTICS` | Engagement analytics |
| GET | `/api/analytics/compliance` | `ADVANCED_ANALYTICS` | Compliance dashboard |
| GET | `/api/analytics/workforce-planning` | `PREDICTIVE_ANALYTICS` | Predictive analytics |
| GET | `/api/analytics/attrition-risk` | `PREDICTIVE_ANALYTICS` | Attrition risk scores |
| POST | `/api/reports/export` | `REPORT_EXPORT` | Request report export |
| GET | `/api/reports/export/{id}` | `REPORT_EXPORT` | Get export status |
| GET | `/api/reports/export/{id}/download` | `REPORT_EXPORT` | Download exported file |
| GET | `/api/reports/exports` | `REPORT_EXPORT` | List export history |
| POST | `/api/reports/schedule` | `REPORT_EXPORT` | Schedule recurring export |

### 10.4 UI Enhancements

| Route | Description |
|---|---|
| `/analytics/hr-overview` | Comprehensive HR metrics dashboard |
| `/analytics/leave` | Leave analytics with charts |
| `/analytics/attendance` | Attendance analytics |
| `/analytics/training` | Training effectiveness |
| `/analytics/engagement` | Engagement metrics |
| `/analytics/compliance` | Compliance dashboard |
| `/analytics/workforce-planning` | Predictive workforce analytics |
| `/reports/export` | Report export UI with format selection |
| `/reports/scheduled` | Scheduled report management |

---

## 11. Feature Gating Registry

### Complete Feature Code Reference

| Code | Name | Category | Plans | Status |
|---|---|---|---|---|
| **HR Core** | | | | |
| `LEAVE_MANAGEMENT` | Leave Administration | hr_core | S,ST,E | New |
| `TIME_ATTENDANCE` | Time & Attendance | hr_core | ST,E | New |
| `GEOFENCING` | GPS Geofencing Attendance | hr_core | E | New |
| `SHIFT_SCHEDULING` | Shift Scheduling | hr_core | ST,E | New |
| `EMPLOYEE_SELF_SERVICE` | Employee Self-Service Portal | hr_core | S,ST,E | New |
| `EMPLOYEE_DOCUMENTS` | Employee Document Management | hr_core | S,ST,E | New |
| **Talent Development** | | | | |
| `TRAINING_MANAGEMENT` | Training & Development | talent_development | ST,E | New |
| `LMS_INTEGRATION` | LMS Integration | talent_development | E | New |
| `SKILL_GAP_ANALYSIS` | Skill Gap Analysis | talent_development | E | New |
| `PERFORMANCE_360_FEEDBACK` | 360-Degree Feedback | talent_development | E | New |
| `PERFORMANCE_PIP` | Performance Improvement Plans | talent_development | ST,E | New |
| `COMPETENCY_MAPPING` | Competency Framework Mapping | talent_development | E | New |
| **Engagement** | | | | |
| `EMPLOYEE_ENGAGEMENT` | Employee Engagement | engagement | ST,E | New |
| `PULSE_SURVEYS` | Pulse Surveys & Feedback | engagement | ST,E | New |
| `RECOGNITION_REWARDS` | Recognition & Rewards | engagement | E | New |
| `WELLNESS_PROGRAMS` | Wellness Programs | engagement | E | New |
| **Compliance** | | | | |
| `POPIA_COMPLIANCE` | POPIA Compliance Management | compliance | S,ST,E | New |
| `LABOUR_RELATIONS` | Labour Relations Management | compliance | ST,E | New |
| `COMPLIANCE_REMINDERS` | Automated Compliance Reminders | compliance | ST,E | New |
| **Integrations** | | | | |
| `SAGE_300_PEOPLE` | Sage 300 People Integration | integrations | ST,E | New |
| `SAGE_EVOLUTION` | Sage Evolution ERP Integration | integrations | ST,E | New |
| `AD_SSO` | Active Directory SSO | integrations | ST,E | New |
| `WORKFLOW_MANAGEMENT` | Workflow Management | automation | ST,E | New (was missing) |
| `SAP_PAYROLL` | SAP Payroll Integration | integrations | E | New (was missing) |
| **Analytics** | | | | |
| `ADVANCED_ANALYTICS` | Advanced HR Analytics | analytics | ST,E | New |
| `PREDICTIVE_ANALYTICS` | Predictive Workforce Analytics | analytics | E | New |
| `REPORT_EXPORT` | Report Export (PDF/Excel) | analytics | S,ST,E | New |

**Plan Key:** T=TRIAL, S=STARTER, ST=STANDARD, E=ENTERPRISE

### Per-Tenant Override Examples

Using the Platform Admin UI at `/platform/tenants/{id}`, an operator can:

1. **Enable a premium feature for a STARTER tenant:**
   - e.g. Grant `GEOFENCING` to a STARTER tenant who paid for it as an add-on
   - Set `reason: "Purchased as add-on"`, `grantedBy: "admin@arthmatic.co.za"`

2. **Disable a plan-included feature for a specific tenant:**
   - e.g. Disable `SAGE_300_PEOPLE` for a tenant using a different ERP
   - Set `enabled: false`, `reason: "Tenant uses SAP instead"`

3. **Time-limited feature trial:**
   - e.g. Give a STANDARD tenant 30-day access to `PREDICTIVE_ANALYTICS`
   - Set `enabled: true`, `expiresAt: "2026-04-08"`, `reason: "30-day trial"`

---

## Implementation Priority

### Phase 1 — Critical (Weeks 1-4)
1. Leave Administration Module
2. Sage 300 People Integration
3. Sage Evolution ERP Integration
4. Active Directory SSO

### Phase 2 — High Priority (Weeks 5-8)
5. Time & Attendance Module (with Geofencing)
6. Training & Development Module
7. Employee Profile Enhancement
8. Report Export

### Phase 3 — Competitive Advantage (Weeks 9-12)
9. Employee Engagement Module
10. Performance Management Enhancements (360, PIPs, Competencies)
11. POPIA Compliance & Labour Relations Module
12. Advanced Analytics Dashboards

### Phase 4 — Predictive & Mobile (Weeks 13-16)
13. Predictive Workforce Analytics
14. LMS Integration
15. Shift Scheduling
16. Native Mobile App wrapper (Capacitor)
