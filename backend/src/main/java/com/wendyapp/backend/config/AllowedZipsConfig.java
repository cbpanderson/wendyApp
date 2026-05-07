package com.wendyapp.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Configuration
@ConfigurationProperties(prefix = "sequim")
public class AllowedZipsConfig {

    private List<String> allowedZips = List.of();

    public List<String> getAllowedZips() {
        return allowedZips;
    }

    public void setAllowedZips(List<String> allowedZips) {
        this.allowedZips = allowedZips;
    }

    public Set<String> asSet() {
        return new HashSet<>(allowedZips);
    }
}
