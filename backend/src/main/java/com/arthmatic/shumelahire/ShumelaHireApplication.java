package com.arthmatic.shumelahire;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ShumelaHireApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShumelaHireApplication.class, args);
    }
}
