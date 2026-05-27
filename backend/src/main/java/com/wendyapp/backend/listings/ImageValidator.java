package com.wendyapp.backend.listings;

/**
 * Validates image uploads by checking content type AND magic bytes.
 * Accepts JPEG and PNG only.
 */
public final class ImageValidator {

    public static final long MAX_BYTES = 2L * 1024 * 1024; // 2 MB

    private ImageValidator() {}

    public enum Kind { JPEG, PNG }

    public static Kind detect(String contentType, byte[] bytes) {
        if (bytes == null || bytes.length < 4) {
            throw new InvalidListingException("File is empty or too small");
        }
        boolean jpeg = isJpeg(bytes);
        boolean png = isPng(bytes);

        if (jpeg && ("image/jpeg".equalsIgnoreCase(contentType) || "image/jpg".equalsIgnoreCase(contentType))) {
            return Kind.JPEG;
        }
        if (png && "image/png".equalsIgnoreCase(contentType)) {
            return Kind.PNG;
        }
        throw new InvalidListingException("Only JPEG or PNG images are allowed");
    }

    public static String extensionFor(Kind kind) {
        return switch (kind) {
            case JPEG -> "jpg";
            case PNG  -> "png";
        };
    }

    private static boolean isJpeg(byte[] b) {
        return (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF;
    }

    private static boolean isPng(byte[] b) {
        return b.length >= 8
                && (b[0] & 0xFF) == 0x89
                && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                && (b[4] & 0xFF) == 0x0D && (b[5] & 0xFF) == 0x0A
                && (b[6] & 0xFF) == 0x1A && (b[7] & 0xFF) == 0x0A;
    }
}
