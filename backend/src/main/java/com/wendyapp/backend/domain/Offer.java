package com.wendyapp.backend.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "offers")
public class Offer {

    public enum Type { TRADE, GIFT_REQUEST }
    public enum Status { PENDING, ACCEPTED, DECLINED, WITHDRAWN }

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "from_user_id", nullable = false)
    private User fromUser;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "to_user_id", nullable = false)
    private User toUser;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "offer_type", nullable = false, columnDefinition = "offer_type")
    private Type offerType;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "offered_listing_id")
    private Listing offeredListing;

    @Column
    private String message;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(nullable = false, columnDefinition = "offer_status")
    private Status status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "responded_at")
    private OffsetDateTime respondedAt;

    protected Offer() {}

    public Offer(Listing listing, User fromUser, User toUser, Type offerType,
                 Listing offeredListing, String message) {
        this.listing = listing;
        this.fromUser = fromUser;
        this.toUser = toUser;
        this.offerType = offerType;
        this.offeredListing = offeredListing;
        this.message = message;
        this.status = Status.PENDING;
    }

    public UUID getId() { return id; }
    public Listing getListing() { return listing; }
    public User getFromUser() { return fromUser; }
    public User getToUser() { return toUser; }
    public Type getOfferType() { return offerType; }
    public Listing getOfferedListing() { return offeredListing; }
    public String getMessage() { return message; }
    public Status getStatus() { return status; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getRespondedAt() { return respondedAt; }

    public void setStatus(Status status) { this.status = status; }
    public void setRespondedAt(OffsetDateTime respondedAt) { this.respondedAt = respondedAt; }
}
