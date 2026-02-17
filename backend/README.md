# ShumelaHire Backend API

A Spring Boot REST API for the ShumelaHire platform with audit logging capabilities.

## Features

- **Audit Log Service**: Track all user actions and entity changes
- **H2 In-Memory Database**: Quick setup for development and testing
- **RESTful API**: Clean endpoints for audit log management
- **Cross-Origin Support**: Configured for frontend integration

## Quick Start

### Prerequisites
- Java 17 or higher
- Maven 3.6 or higher

### Running the Application

```bash
# Navigate to backend directory
cd backend

# Run the application
mvn spring-boot:run
```

The application will start on `http://localhost:8080`

### H2 Database Console

Access the H2 database console at: `http://localhost:8080/h2-console`

- **JDBC URL**: `jdbc:h2:mem:shumelahire`
- **Username**: `sa`
- **Password**: (leave empty)

## API Endpoints

### Audit Log Endpoints

#### Create Audit Log
```http
POST /api/audit
Content-Type: application/json

{
  "userId": "user123",
  "action": "CREATE",
  "entityType": "REQUISITION",
  "entityId": "req456",
  "details": "Created new job requisition for Software Engineer position"
}
```

#### Get Audit Logs by User
```http
GET /api/audit/user/{userId}
```

#### Get Audit Logs by Entity
```http
GET /api/audit/entity/{entityType}/{entityId}
```

#### Get All Audit Logs
```http
GET /api/audit/all
```

#### Health Check
```http
GET /api/audit/health
```

## Entity Schema

### AuditLog
- `id` (Long) - Primary key
- `timestamp` (LocalDateTime) - When the action occurred
- `userId` (String) - ID of the user who performed the action
- `action` (String) - Type of action (CREATE, UPDATE, DELETE, etc.)
- `entityType` (String) - Type of entity (REQUISITION, APPLICATION, etc.)
- `entityId` (String) - ID of the specific entity instance
- `details` (String) - Additional details about the action

## Usage in Demo

This backend is designed to work with the React frontend for recording requisition create/update actions:

```javascript
// Example frontend integration
const logAuditEvent = async (action, entityId, details) => {
  await fetch('http://localhost:8080/api/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: currentUser.id,
      action: action,
      entityType: 'REQUISITION',
      entityId: entityId,
      details: details
    })
  });
};
```

## Development

### Build
```bash
mvn clean compile
```

### Test
```bash
mvn test
```

### Package
```bash
mvn clean package
```
