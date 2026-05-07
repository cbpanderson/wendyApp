package com.wendyapp.backend.auth;

public class InvalidZipException extends RuntimeException {
    public InvalidZipException() {
        super("ZIP code is not allowed in this version");
    }
}
