package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.dto.JwtResponse;
import com.arthmatic.shumelahire.dto.LoginRequest;
import com.arthmatic.shumelahire.dto.SignupRequest;
import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.repository.UserRepository;
import com.arthmatic.shumelahire.security.JwtUtil;
import com.arthmatic.shumelahire.service.AuthenticationService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Authentication controller for login, signup, and token management
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuthenticationService authenticationService;

    /**
     * User login endpoint
     */
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            // Determine if login is with username or email
            String username = loginRequest.getUsernameOrEmail();
            User user = userRepository.findByUsername(username)
                    .orElse(userRepository.findByEmail(username).orElse(null));

            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Error: Invalid credentials!"));
            }

            // Check if account is locked
            if (!user.isAccountNonLocked()) {
                return ResponseEntity.status(HttpStatus.LOCKED)
                    .body(new MessageResponse("Error: Account is locked. Please try again later."));
            }

            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            user.getUsername(),
                            loginRequest.getPassword()
                    )
            );

            // Generate JWT token
            String jwt = jwtUtil.generateJwtToken(authentication);
            String refreshToken = jwtUtil.generateRefreshToken(user.getUsername());

            // Get user authorities
            List<String> authorities = authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());

            // Update last login time and reset failed attempts
            user.setLastLogin(LocalDateTime.now());
            user.resetFailedLoginAttempts();
            userRepository.save(user);

            // Log successful authentication
            authenticationService.logAuthenticationEvent(
                user.getId(), 
                user.getUsername(), 
                "LOGIN_SUCCESS", 
                getClientIpAddress()
            );

            return ResponseEntity.ok(new JwtResponse(
                    jwt,
                    refreshToken,
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getFirstName(),
                    user.getLastName(),
                    user.getRole().name(),
                    authorities,
                    user.isTwoFactorEnabled(),
                    user.isEmailVerified(),
                    jwtUtil.getRemainingTime(jwt)
            ));

        } catch (BadCredentialsException e) {
            // Handle failed login attempt
            User user = userRepository.findByUsername(loginRequest.getUsernameOrEmail())
                    .orElse(userRepository.findByEmail(loginRequest.getUsernameOrEmail()).orElse(null));
            
            if (user != null) {
                user.incrementFailedLoginAttempts();
                userRepository.save(user);
                
                authenticationService.logAuthenticationEvent(
                    user.getId(), 
                    user.getUsername(), 
                    "LOGIN_FAILED", 
                    getClientIpAddress()
                );
            }

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Error: Invalid credentials!"));
        } catch (AuthenticationException e) {
            logger.error("Authentication failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Error: Authentication failed!"));
        }
    }

    /**
     * User registration endpoint
     */
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        try {
            // Check if username exists
            if (userRepository.existsByUsername(signUpRequest.getUsername())) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Error: Username is already taken!"));
            }

            // Check if email exists
            if (userRepository.existsByEmail(signUpRequest.getEmail())) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Error: Email is already in use!"));
            }

            // Validate password strength
            if (!authenticationService.isPasswordValid(signUpRequest.getPassword())) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Error: Password does not meet security requirements!"));
            }

            // Create new user account
            User user = new User(
                    signUpRequest.getUsername(),
                    signUpRequest.getEmail(),
                    passwordEncoder.encode(signUpRequest.getPassword()),
                    signUpRequest.getFirstName(),
                    signUpRequest.getLastName(),
                    signUpRequest.getRole()
            );

            // Generate email verification token
            String verificationToken = jwtUtil.generateEmailVerificationToken(user.getUsername());
            user.setEmailVerificationToken(verificationToken);

            User savedUser = userRepository.save(user);

            // Log user registration
            authenticationService.logAuthenticationEvent(
                savedUser.getId(), 
                savedUser.getUsername(), 
                "REGISTER_SUCCESS", 
                getClientIpAddress()
            );

            return ResponseEntity.ok(new MessageResponse("User registered successfully!"));

        } catch (Exception e) {
            logger.error("Registration failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error: Registration failed!"));
        }
    }

    /**
     * Refresh token endpoint
     */
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> request) {
        try {
            String refreshToken = request.get("refreshToken");
            
            if (refreshToken == null || !jwtUtil.validateJwtToken(refreshToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new MessageResponse("Error: Invalid refresh token!"));
            }

            String username = jwtUtil.getUsernameFromJwtToken(refreshToken);
            User user = userRepository.findByUsername(username).orElse(null);

            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new MessageResponse("Error: User not found!"));
            }

            // Generate new access token
            String newAccessToken = jwtUtil.generateTokenFromUsername(username);
            String newRefreshToken = jwtUtil.generateRefreshToken(username);

            return ResponseEntity.ok(Map.of(
                    "accessToken", newAccessToken,
                    "refreshToken", newRefreshToken,
                    "expiresIn", jwtUtil.getRemainingTime(newAccessToken)
            ));

        } catch (Exception e) {
            logger.error("Token refresh failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Error: Token refresh failed!"));
        }
    }

    /**
     * Logout endpoint
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser(@RequestHeader("Authorization") String token) {
        try {
            // Extract username from token for logging
            if (token != null && token.startsWith("Bearer ")) {
                String jwt = token.substring(7);
                String username = jwtUtil.getUsernameFromJwtToken(jwt);
                User user = userRepository.findByUsername(username).orElse(null);
                
                if (user != null) {
                    authenticationService.logAuthenticationEvent(
                        user.getId(), 
                        user.getUsername(), 
                        "LOGOUT_SUCCESS", 
                        getClientIpAddress()
                    );
                }
            }

            return ResponseEntity.ok(new MessageResponse("Logged out successfully!"));
        } catch (Exception e) {
            logger.error("Logout error: {}", e.getMessage());
            return ResponseEntity.ok(new MessageResponse("Logged out successfully!"));
        }
    }

    /**
     * Get current user info
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        // This will be implemented with security context
        return ResponseEntity.ok(new MessageResponse("Current user endpoint"));
    }

    /**
     * Get client IP address
     */
    private String getClientIpAddress() {
        // This would normally extract from HttpServletRequest
        return "127.0.0.1"; // Placeholder
    }

    /**
     * Message response class
     */
    public static class MessageResponse {
        private String message;

        public MessageResponse(String message) {
            this.message = message;
        }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}
