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

    @org.springframework.beans.factory.annotation.Autowired
    private com.arthmatic.shumelahire.security.ActorResolver actorResolver;

    @GetMapping
    public ResponseEntity<?> getPreferences(Authentication authentication) {
        Optional<String> userIdOpt = actorResolver.userId(authentication);
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
        Optional<String> userIdOpt = actorResolver.userId(authentication);
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

}
