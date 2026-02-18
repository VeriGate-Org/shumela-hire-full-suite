package com.arthmatic.shumelahire.service.integration;

import com.microsoft.graph.models.Attendee;
import com.microsoft.graph.models.AttendeeType;
import com.microsoft.graph.models.BodyType;
import com.microsoft.graph.models.DateTimeTimeZone;
import com.microsoft.graph.models.EmailAddress;
import com.microsoft.graph.models.Event;
import com.microsoft.graph.models.ItemBody;
import com.microsoft.graph.models.Location;
import com.microsoft.graph.serviceclient.GraphServiceClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@ConditionalOnProperty(name = "microsoft.enabled", havingValue = "true")
public class OutlookCalendarService {

    private static final Logger logger = LoggerFactory.getLogger(OutlookCalendarService.class);
    private static final DateTimeFormatter ISO_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private final GraphServiceClient graphClient;

    @Value("${microsoft.outlook.calendar-user:}")
    private String calendarUser;

    public OutlookCalendarService(GraphServiceClient graphClient) {
        this.graphClient = graphClient;
    }

    public String createInterviewEvent(String subject, String body, LocalDateTime start,
                                        int durationMinutes, String location,
                                        String interviewerEmail, String candidateEmail) {
        if (calendarUser == null || calendarUser.isBlank()) {
            logger.warn("Outlook calendar user not configured");
            return null;
        }

        try {
            Event event = new Event();
            event.setSubject(subject);

            ItemBody eventBody = new ItemBody();
            eventBody.setContentType(BodyType.Html);
            eventBody.setContent(body);
            event.setBody(eventBody);

            DateTimeTimeZone startTime = new DateTimeTimeZone();
            startTime.setDateTime(start.format(ISO_FORMAT));
            startTime.setTimeZone("Africa/Johannesburg");
            event.setStart(startTime);

            DateTimeTimeZone endTime = new DateTimeTimeZone();
            endTime.setDateTime(start.plusMinutes(durationMinutes).format(ISO_FORMAT));
            endTime.setTimeZone("Africa/Johannesburg");
            event.setEnd(endTime);

            if (location != null) {
                Location loc = new Location();
                loc.setDisplayName(location);
                event.setLocation(loc);
            }

            Attendee interviewer = createAttendee(interviewerEmail, AttendeeType.Required);
            Attendee candidate = createAttendee(candidateEmail, AttendeeType.Required);
            event.setAttendees(List.of(interviewer, candidate));

            Event created = graphClient.users().byUserId(calendarUser).events().post(event);

            String eventId = created.getId();
            logger.info("Outlook calendar event created: {}", eventId);
            return eventId;
        } catch (Exception e) {
            logger.error("Failed to create Outlook calendar event: {}", e.getMessage());
            return null;
        }
    }

    public boolean cancelEvent(String eventId) {
        if (calendarUser == null || calendarUser.isBlank()) return false;

        try {
            graphClient.users().byUserId(calendarUser).events().byEventId(eventId).delete();
            logger.info("Outlook calendar event cancelled: {}", eventId);
            return true;
        } catch (Exception e) {
            logger.error("Failed to cancel Outlook calendar event {}: {}", eventId, e.getMessage());
            return false;
        }
    }

    public boolean updateEvent(String eventId, String subject, LocalDateTime newStart, int durationMinutes) {
        if (calendarUser == null || calendarUser.isBlank()) return false;

        try {
            Event event = new Event();
            event.setSubject(subject);

            DateTimeTimeZone startTime = new DateTimeTimeZone();
            startTime.setDateTime(newStart.format(ISO_FORMAT));
            startTime.setTimeZone("Africa/Johannesburg");
            event.setStart(startTime);

            DateTimeTimeZone endTime = new DateTimeTimeZone();
            endTime.setDateTime(newStart.plusMinutes(durationMinutes).format(ISO_FORMAT));
            endTime.setTimeZone("Africa/Johannesburg");
            event.setEnd(endTime);

            graphClient.users().byUserId(calendarUser).events().byEventId(eventId).patch(event);
            logger.info("Outlook calendar event updated: {}", eventId);
            return true;
        } catch (Exception e) {
            logger.error("Failed to update Outlook calendar event {}: {}", eventId, e.getMessage());
            return false;
        }
    }

    private Attendee createAttendee(String email, AttendeeType type) {
        Attendee attendee = new Attendee();
        EmailAddress emailAddress = new EmailAddress();
        emailAddress.setAddress(email);
        attendee.setEmailAddress(emailAddress);
        attendee.setType(type);
        return attendee;
    }
}
