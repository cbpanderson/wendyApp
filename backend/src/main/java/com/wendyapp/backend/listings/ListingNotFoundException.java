package com.wendyapp.backend.listings;

public class ListingNotFoundException extends RuntimeException {
    public ListingNotFoundException() { super("Listing not found"); }
}
