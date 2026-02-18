package com.arthmatic.shumelahire.service.integration;

public interface EmailService {

    boolean sendEmail(String to, String subject, String htmlBody);

    boolean sendTemplatedEmail(String to, String template, java.util.Map<String, String> data);
}
