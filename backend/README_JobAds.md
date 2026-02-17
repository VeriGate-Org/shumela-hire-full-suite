# Job Ads Service Documentation

This document describes the Job Ads service implementation for the ShumelaHire platform.

## Overview

The Job Ads service allows creating, managing, and publishing job advertisements to internal and/or external channels with automatic expiration handling.

## Database Schema

### JobAd Entity
```sql
CREATE TABLE job_ads (
    id BIGSERIAL PRIMARY KEY,
    requisition_id BIGINT,
    title VARCHAR(500) NOT NULL,
    html_body TEXT NOT NULL,
    channel_internal BOOLEAN NOT NULL DEFAULT FALSE,
    channel_external BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    closing_date DATE,
    slug VARCHAR(200) UNIQUE,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### JobAdHistory Entity
```sql
CREATE TABLE job_ad_history (
    id BIGSERIAL PRIMARY KEY,
    job_ad_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    actor_user_id VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    details TEXT
);
```

## API Endpoints

### 1. Create Job Ad
**POST /ads**

Create a new job ad (draft or published).

```json
{
  "requisitionId": 123,
  "title": "Senior Software Engineer",
  "htmlBody": "<p>We are looking for a senior software engineer...</p>",
  "channelInternal": true,
  "channelExternal": true,
  "closingDate": "2024-03-31",
  "slug": "senior-software-engineer",
  "createdBy": "user@example.com",
  "publishImmediately": false
}
```

### 2. Update Job Ad
**PUT /ads/{id}**

Update an existing job ad (only drafts and unpublished ads).

```json
{
  "title": "Senior Software Engineer - Updated",
  "htmlBody": "<p>Updated job description...</p>",
  "channelInternal": true,
  "channelExternal": false,
  "closingDate": "2024-04-15"
}
```

### 3. Publish Job Ad
**POST /ads/{id}/publish**

Publish a job ad to specified channels.

```json
{
  "channelInternal": true,
  "channelExternal": true,
  "closingDate": "2024-03-31",
  "slug": "senior-software-engineer",
  "actorUserId": "user@example.com"
}
```

### 4. Unpublish Job Ad
**POST /ads/{id}/unpublish**

Unpublish a job ad.

Headers:
- `X-User-ID: user@example.com`

### 5. List/Filter Job Ads
**GET /ads**

Parameters:
- `status`: DRAFT, PUBLISHED, UNPUBLISHED, EXPIRED
- `channel`: internal, external
- `q`: search query
- `page`, `size`, `sort`: pagination

Example: `GET /ads?status=PUBLISHED&channel=external&q=software&page=0&size=10`

### 6. Get Job Ad by Slug/ID
**GET /ads/{slug}**

Public endpoint for fetching job ads by slug or ID.

### 7. Get Job Ad History
**GET /ads/{id}/history**

Retrieve the history/audit trail for a job ad.

## Business Rules

### Publishing Rules
1. At least one channel (internal or external) must be selected
2. External ads require a unique slug
3. Only DRAFT or UNPUBLISHED ads can be published
4. Published ads cannot be updated directly (must unpublish first)

### Expiration Rules
1. Ads with `closingDate` in the past are automatically expired nightly
2. Expired ads cannot be updated or republished
3. Public access to expired ads is denied

### Slug Rules
1. Slugs are auto-generated from title if not provided
2. Slugs must be unique across all job ads
3. Only external channel ads require slugs

## Scheduled Jobs

### Nightly Expiration Job
- **Schedule**: Daily at 2:00 AM UTC
- **Function**: Automatically expire published ads past their closing date
- **Configuration**: `job-ad.scheduler.enabled=true` (default)

## Integration Points

### Audit Logging
The service integrates with the existing audit log system:

```java
// AuditLogService interface for integration
public interface AuditLogService {
    void logJobAdAction(Long jobAdId, String action, String userId, String details);
}
```

Update the `AuditLogServiceImpl` to integrate with your Day 1 audit system.

### Requisition Integration
Job ads can be linked to requisitions via `requisitionId` field.

## Configuration

Add to your `application.properties`:

```properties
# Enable job ad scheduler
job-ad.scheduler.enabled=true

# Logging
logging.level.com.example.recruitment.service.JobAdService=INFO
logging.level.com.example.recruitment.scheduler=INFO

# Database
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

## Usage Examples

### Creating and Publishing a Job Ad
```java
// 1. Create draft
JobAdCreateRequest createRequest = new JobAdCreateRequest();
createRequest.setTitle("Software Engineer");
createRequest.setHtmlBody("<p>Job description...</p>");
createRequest.setChannelInternal(true);
createRequest.setChannelExternal(true);
createRequest.setCreatedBy("hr@company.com");

JobAdResponse jobAd = jobAdService.createJobAd(createRequest);

// 2. Publish
JobAdPublishRequest publishRequest = new JobAdPublishRequest();
publishRequest.setChannelInternal(true);
publishRequest.setChannelExternal(true);
publishRequest.setClosingDate(LocalDate.now().plusDays(30));
publishRequest.setActorUserId("hr@company.com");

JobAdResponse published = jobAdService.publishJobAd(jobAd.getId(), publishRequest);
```

### Searching Job Ads
```java
// Search published external jobs
Pageable pageable = PageRequest.of(0, 10, Sort.by("createdAt").descending());
Page<JobAdResponse> results = jobAdService.searchJobAds(
    JobAdStatus.PUBLISHED, 
    "external", 
    "software engineer", 
    pageable
);
```

## Testing

### Manual Expiration Testing
For testing purposes, you can manually trigger expiration:

```bash
POST /ads/expire
X-User-ID: test@example.com
```

Or uncomment the test scheduler in `JobAdExpirationScheduler.java` for 5-minute intervals.

## Security Considerations

1. **Authentication**: Add authentication to endpoints based on your security setup
2. **Authorization**: Implement role-based access (e.g., only HR can create/publish ads)
3. **Input Validation**: HTML content should be sanitized to prevent XSS
4. **Rate Limiting**: Consider rate limiting for public slug endpoint

## Migration from Existing System

If migrating from an existing job ads system:

1. Run the database migration: `V003__create_job_ads_tables.sql`
2. Import existing data with appropriate status mapping
3. Generate slugs for external ads: `slugGeneratorService.generateSlug(title)`
4. Create initial history entries for audit trail

## Monitoring

Monitor the following metrics:
- Job ad creation/publication rates
- Expiration job execution
- API response times
- Database query performance
- Failed publications/errors

## Future Enhancements

1. **Application Tracking**: Link to job applications
2. **Email Notifications**: Notify on status changes
3. **Analytics**: Track views, applications per ad
4. **Templates**: Job ad templates for consistency
5. **Approval Workflow**: Multi-step approval before publishing
6. **SEO Optimization**: Meta tags, structured data for external ads