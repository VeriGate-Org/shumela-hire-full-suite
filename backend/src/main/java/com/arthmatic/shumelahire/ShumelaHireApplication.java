package com.arthmatic.shumelahire;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = {"com.arthmatic.shumelahire", "com.example.recruitment"})
@EntityScan(basePackages = {"com.arthmatic.shumelahire", "com.example.recruitment"})
@EnableJpaRepositories(basePackages = {"com.arthmatic.shumelahire", "com.example.recruitment"})
public class ShumelaHireApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShumelaHireApplication.class, args);
    }
}
