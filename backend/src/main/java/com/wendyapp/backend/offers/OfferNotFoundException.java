package com.wendyapp.backend.offers;

public class OfferNotFoundException extends RuntimeException {
    public OfferNotFoundException() { super("Offer not found"); }
}
