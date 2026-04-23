package com.arthmatic.shumelahire.controller;

import com.arthmatic.shumelahire.entity.User;
import com.arthmatic.shumelahire.entity.UserPreference;
import com.arthmatic.shumelahire.repository.UserPreferenceDataRepository;
import com.arthmatic.shumelahire.repository.UserDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/user/preferences")
public class UserPreferenceController {

    @Autowired
    private UserPreferenceDataRepository preferenceRepository;

    @Autowired
    private UserDataRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getPreferences(Authentication authentication) {
        Optional<String> userIdOpt = resolveUserId(authentication);
        if (userIdOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        Optional<UserPreference> pref = preferenceRepository.findByUserId(userIdOpt.get());
        if (pref.isPresent()) {
            return ResponseEntity.ok(pref.get().getPreferences());
        }
        return ResponseEntity.ok("{}");
    }

    @PutMapping
    public ResponseEntity<?> savePreferences(Authentication authentication, @RequestBody String preferences) {
        Optional<String> userIdOpt = resolveUserId(authentication);
        if (userIdOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        String userId = userIdOpt.get();
        UserPreference pref = preferenceRepository.findByUserId(userId).orElseGet(() -> {
            UserPreference newPref = new UserPreference();
            newPref.setUserId(userId);
            return newPref;
        });

        pref.setPreferences(preferences);
        preferenceRepository.save(pref);
        return ResponseEntity.ok(Map.of("message", "Preferences saved"));
    }

    private Optional<String> resolveUserId(Authentication authentication) {
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            String email = jwt.getClaimAsString("email");
            if (email != null) {
                return userRepository.findByEmail(email).map(User::getId);
            }
        } else if (authentication.getPrincipal() instanceof User user) {
            return Optional.of(user.getId());
        }
        return Optional.empty();
    }
}
