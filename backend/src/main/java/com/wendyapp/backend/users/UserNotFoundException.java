package com.wendyapp.backend.users;

public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String handle) {
        super("User not found: " + handle);
    }
}
