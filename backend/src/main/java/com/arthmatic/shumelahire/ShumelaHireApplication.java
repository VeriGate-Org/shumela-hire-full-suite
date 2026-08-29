package com.arthmatic.shumelahire;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
// @EnableScheduling lives on SchedulingConfig, which is @Profile("!lambda"). It was here too,
// unconditionally, which is why in-container @Scheduled tasks kept firing in Lambda — visible in
// the production log as SageSyncEngine failing every five minutes on a missing tenant context.
// In Lambda, EventBridge is the only trigger; a warm container is not a scheduler.
public class ShumelaHireApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShumelaHireApplication.class, args);
    }
}
