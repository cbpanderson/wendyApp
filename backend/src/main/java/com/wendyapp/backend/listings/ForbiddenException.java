package com.wendyapp.backend.listings;

public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) { super(message); }
}
