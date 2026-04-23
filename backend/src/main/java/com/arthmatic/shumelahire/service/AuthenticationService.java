package com.arthmatic.shumelahire.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.regex.Pattern;

/**
 * Authentication service for security-related operations
 */
@Service
public class AuthenticationService {

    private static final Logger logger = LoggerFactory.getLogger(AuthenticationService.class);

    // Password validation patterns
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile(".*[A-Z].*");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile(".*[a-z].*");
    private static final Pattern DIGIT_PATTERN = Pattern.compile(".*[0-9].*");
    private static final Pattern SPECIAL_CHAR_PATTERN = Pattern.compile(".*[^a-zA-Z0-9].*");
    private static final Pattern WHITESPACE_PATTERN = Pattern.compile(".*\\s.*");

    /**
     * Validate password against security rules
     */
    public boolean isPasswordValid(String password) {
        if (password == null || password.length() < 8 || password.length() > 128) {
            return false;
        }

        // Check for required character types
        if (!UPPERCASE_PATTERN.matcher(password).matches()) return false;
        if (!LOWERCASE_PATTERN.matcher(password).matches()) return false;
        if (!DIGIT_PATTERN.matcher(password).matches()) return false;
        if (!SPECIAL_CHAR_PATTERN.matcher(password).matches()) return false;

        // Check for whitespace (not allowed)
        if (WHITESPACE_PATTERN.matcher(password).matches()) return false;

        // Check for common passwords
        if (isPasswordCompromised(password)) return false;

        return true;
    }

    /**
     * Get password validation messages
     */
    public String getPasswordValidationMessages(String password) {
        StringBuilder messages = new StringBuilder();

        if (password == null || password.isEmpty()) {
            return "Password is required";
        }

        if (password.length() < 8) {
            messages.append("Password must be at least 8 characters long. ");
        }

        if (password.length() > 128) {
            messages.append("Password must not exceed 128 characters. ");
        }

        if (!UPPERCASE_PATTERN.matcher(password).matches()) {
            messages.append("Password must contain at least one uppercase letter. ");
        }

        if (!LOWERCASE_PATTERN.matcher(password).matches()) {
            messages.append("Password must contain at least one lowercase letter. ");
        }

        if (!DIGIT_PATTERN.matcher(password).matches()) {
            messages.append("Password must contain at least one digit. ");
        }

        if (!SPECIAL_CHAR_PATTERN.matcher(password).matches()) {
            messages.append("Password must contain at least one special character. ");
        }

        if (WHITESPACE_PATTERN.matcher(password).matches()) {
            messages.append("Password must not contain whitespace characters. ");
        }

        if (isPasswordCompromised(password)) {
            messages.append("Password contains common patterns or words. ");
        }

        return messages.length() == 0 ? "Password is valid" : messages.toString().trim();
    }

    /**
     * Log authentication events
     */
    public void logAuthenticationEvent(String userId, String username, String action, String ipAddress) {
        try {
            logger.info("AUTH_EVENT - User ID: {}, Username: {}, Action: {}, IP: {}, Timestamp: {}", 
                       userId, username, action, ipAddress, LocalDateTime.now());
        } catch (Exception e) {
            logger.error("Failed to log authentication event: {}", e.getMessage());
        }
    }

    /**
     * Generate secure random password
     */
    public String generateSecurePassword(int length) {
        if (length < 8) length = 8;
        
        String upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        String lowerCase = "abcdefghijklmnopqrstuvwxyz";
        String digits = "0123456789";
        String specials = "!@#$%^&*()_+-=[]{}|;:,.<>?";
        
        StringBuilder password = new StringBuilder();
        java.util.Random random = new java.util.Random();
        
        // Ensure at least one character from each required type
        password.append(upperCase.charAt(random.nextInt(upperCase.length())));
        password.append(lowerCase.charAt(random.nextInt(lowerCase.length())));
        password.append(digits.charAt(random.nextInt(digits.length())));
        password.append(specials.charAt(random.nextInt(specials.length())));
        
        // Fill the rest randomly
        String allChars = upperCase + lowerCase + digits + specials;
        for (int i = 4; i < length; i++) {
            password.append(allChars.charAt(random.nextInt(allChars.length())));
        }
        
        // Shuffle the password
        char[] chars = password.toString().toCharArray();
        for (int i = 0; i < chars.length; i++) {
            int j = random.nextInt(chars.length);
            char temp = chars[i];
            chars[i] = chars[j];
            chars[j] = temp;
        }
        
        return new String(chars);
    }

    /**
     * Check if password has been compromised (simplified version)
     */
    public boolean isPasswordCompromised(String password) {
        // In production, this would check against known compromised password databases
        String[] commonPasswords = {
                "password", "123456", "password123", "admin", "qwerty",
                "letmein", "welcome", "monkey", "dragon", "master"
        };
        
        String lowercasePassword = password.toLowerCase();
        for (String common : commonPasswords) {
            if (lowercasePassword.contains(common)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Calculate password strength score (0-100)
     */
    public int calculatePasswordStrength(String password) {
        if (password == null || password.isEmpty()) {
            return 0;
        }

        int score = 0;
        
        // Length scoring
        if (password.length() >= 8) score += 25;
        if (password.length() >= 12) score += 10;
        if (password.length() >= 16) score += 10;

        // Character variety scoring
        if (password.matches(".*[a-z].*")) score += 15;
        if (password.matches(".*[A-Z].*")) score += 15;
        if (password.matches(".*[0-9].*")) score += 15;
        if (password.matches(".*[^a-zA-Z0-9].*")) score += 15;

        // Complexity bonus
        if (password.matches(".*[a-z].*[A-Z].*[0-9].*[^a-zA-Z0-9].*")) {
            score += 10;
        }

        // Penalty for common patterns
        if (password.matches(".*123.*") || password.matches(".*abc.*")) {
            score -= 10;
        }

        // Penalty for repeated characters
        if (password.matches(".*(.)\\1{2,}.*")) {
            score -= 10;
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Get password strength description
     */
    public String getPasswordStrengthDescription(String password) {
        int strength = calculatePasswordStrength(password);
        
        if (strength < 30) return "Very Weak";
        if (strength < 50) return "Weak";
        if (strength < 70) return "Fair";
        if (strength < 85) return "Good";
        return "Strong";
    }
}
