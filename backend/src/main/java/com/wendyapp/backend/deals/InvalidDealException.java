package com.wendyapp.backend.deals;

public class InvalidDealException extends RuntimeException {
    public InvalidDealException(String message) { super(message); }
}
