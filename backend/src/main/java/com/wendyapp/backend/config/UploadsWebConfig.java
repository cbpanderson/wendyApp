package com.wendyapp.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * Serves uploaded listing photos from the local filesystem at /uploads/**.
 * Storage path is controlled by {@code app.uploads.dir} (default ./uploads).
 */
@Configuration
public class UploadsWebConfig implements WebMvcConfigurer {

    private final String uploadsDir;

    public UploadsWebConfig(@Value("${app.uploads.dir:./uploads}") String uploadsDir) {
        this.uploadsDir = uploadsDir;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String absolute = Paths.get(uploadsDir).toAbsolutePath().normalize().toString();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + absolute + "/");
    }
}
