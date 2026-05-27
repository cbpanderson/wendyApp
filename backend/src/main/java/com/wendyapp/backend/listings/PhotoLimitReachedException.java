package com.wendyapp.backend.listings;

public class PhotoLimitReachedException extends RuntimeException {
    public PhotoLimitReachedException(String message) { super(message); }
}
