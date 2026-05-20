package com.finance.tracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * ============================================================
 * MAIN APPLICATION CLASS — The Entry Point
 * ============================================================
 *
 * WHAT IS @SpringBootApplication?
 * It's actually 3 annotations combined into 1:
 *
 *   1. @Configuration    — This class can define beans (objects managed by Spring)
 *   2. @EnableAutoConfiguration — Spring Boot auto-configures based on dependencies
 *      Example: Since we have spring-boot-starter-web, it auto-configures Tomcat
 *      Since we have spring-boot-starter-data-jpa, it auto-configures Hibernate
 *   3. @ComponentScan    — Scans this package and sub-packages for Spring components
 *      (Controllers, Services, Repositories, etc.)
 *
 * WHAT HAPPENS WHEN YOU RUN THIS?
 *   1. Spring creates an ApplicationContext (a container for all your objects)
 *   2. It scans for components (@Controller, @Service, @Repository, @Component)
 *   3. It creates instances of those components and wires them together (Dependency Injection)
 *   4. It starts the embedded Tomcat server on port 8080
 *   5. Your REST API is now live and ready to accept HTTP requests!
 *
 * HOW TO RUN:
 *   From terminal: mvn spring-boot:run
 *   Or run this main() method from your IDE
 */
@SpringBootApplication
public class FinanceTrackerApplication {

    public static void main(String[] args) {
        // SpringApplication.run() bootstraps the entire application
        // It returns the ApplicationContext, but we don't need to store it
        SpringApplication.run(FinanceTrackerApplication.class, args);
    }
}
