package com.wendyapp.backend.auth;

public class HandleAlreadyInUseException extends RuntimeException {
    public HandleAlreadyInUseException() {
        super("Handle is already in use");
    }
}
