package com.arthmatic.shumelahire.security;

import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.service.SsoService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@ConditionalOnProperty(name = "sso.enabled", havingValue = "true")
public class SsoAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private static final Logger logger = LoggerFactory.getLogger(SsoAuthenticationSuccessHandler.class);

    private final SsoService ssoService;

    public SsoAuthenticationSuccessHandler(SsoService ssoService) {
        this.ssoService = ssoService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                         Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String sub = oAuth2User.getAttribute("sub");

        if (email == null) {
            email = oAuth2User.getAttribute("preferred_username");
        }

        if (email == null) {
            logger.error("SSO authentication succeeded but no email found in attributes");
            response.sendRedirect("/login?error=sso_no_email");
            return;
        }

        try {
            User user = ssoService.getOrCreateUserFromSsoProfile(email, name, "AZURE_AD", sub);
            String token = ssoService.generateSsoJwtToken(user);
            response.sendRedirect("/login/callback?token=" + token);
        } catch (Exception e) {
            logger.error("Failed to process SSO authentication for {}", email, e);
            response.sendRedirect("/login?error=sso_failed");
        }
    }
}
