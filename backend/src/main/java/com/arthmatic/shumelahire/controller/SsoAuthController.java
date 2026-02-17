package com.arthmatic.shumelahire.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/sso")
@CrossOrigin(origins = "*", maxAge = 3600)
@ConditionalOnProperty(name = "sso.enabled", havingValue = "true")
public class SsoAuthController {

    @Value("${sso.enabled:false}")
    private boolean ssoEnabled;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getSsoStatus() {
        return ResponseEntity.ok(Map.of(
                "enabled", ssoEnabled,
                "providers", ssoEnabled ? List.of(
                        Map.of("id", "azure", "name", "Microsoft", "type", "OIDC"),
                        Map.of("id", "idc-saml", "name", "IDC SAML", "type", "SAML2")
                ) : List.of()
        ));
    }

    @GetMapping("/initiate")
    public ResponseEntity<Map<String, String>> initiateSso(@RequestParam(defaultValue = "azure") String provider) {
        // Spring Security handles the actual redirect via /oauth2/authorization/{provider}
        String redirectUrl = "/oauth2/authorization/" + provider;
        return ResponseEntity.ok(Map.of("redirectUrl", redirectUrl));
    }
}
