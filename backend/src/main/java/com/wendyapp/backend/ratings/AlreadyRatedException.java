package com.wendyapp.backend.ratings;

public class AlreadyRatedException extends RuntimeException {
    public AlreadyRatedException() {
        super("You have already submitted a rating for this deal");
    }
}
