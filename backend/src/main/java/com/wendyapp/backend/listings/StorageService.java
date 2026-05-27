package com.wendyapp.backend.listings;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Stores listing photo files on the local filesystem in dev. Production storage
 * is a future swap (S3, Cloudinary). Each file is written as {photoId}.{ext}
 * under {@code app.uploads.dir} and served back via {@code /uploads/{filename}}.
 */
@Service
public class StorageService {

    private final Path root;

    public StorageService(@Value("${app.uploads.dir:./uploads}") String dir) throws IOException {
        this.root = Paths.get(dir).toAbsolutePath().normalize();
        Files.createDirectories(this.root);
    }

    /** Saves bytes and returns the public URL path (relative, suitable for storing in DB). */
    public String save(UUID photoId, String extension, byte[] bytes) throws IOException {
        String filename = photoId + "." + extension;
        Path target = root.resolve(filename);
        Files.write(target, bytes);
        return "/uploads/" + filename;
    }

    public void delete(String url) {
        if (url == null || !url.startsWith("/uploads/")) return;
        String filename = url.substring("/uploads/".length());
        try {
            Files.deleteIfExists(root.resolve(filename));
        } catch (IOException ignored) {
            // best-effort cleanup
        }
    }

    public Path getRoot() {
        return root;
    }
}
