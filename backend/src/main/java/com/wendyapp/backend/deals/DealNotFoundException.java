package com.wendyapp.backend.deals;

public class DealNotFoundException extends RuntimeException {
    public DealNotFoundException() { super("Deal not found"); }
}
