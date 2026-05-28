package com.wendyapp.backend.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "deals")
public class Deal {

    public enum Type { TRADE, GIFT }
    public enum Status { ACCEPTED, COMPLETED_BY_A, COMPLETED_BY_B, COMPLETED, CANCELLED }

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID id;

    @OneToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "offer_id", nullable = false, unique = true)
    private Offer offer;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "deal_type", nullable = false, columnDefinition = "deal_type")
    private Type dealType;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "participant_a_id", nullable = false)
    private User participantA;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "participant_b_id", nullable = false)
    private User participantB;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "listing_a_id", nullable = false)
    private Listing listingA;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "listing_b_id")
    private Listing listingB;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(nullable = false, columnDefinition = "deal_status")
    private Status status;

    @Column(name = "accepted_at", nullable = false)
    private OffsetDateTime acceptedAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "cancelled_at")
    private OffsetDateTime cancelledAt;

    @Column(name = "cancelled_by_user_id", columnDefinition = "uuid")
    private UUID cancelledByUserId;

    protected Deal() {}

    public Deal(Offer offer, Type dealType, User participantA, User participantB,
                Listing listingA, Listing listingB) {
        this.offer = offer;
        this.dealType = dealType;
        this.participantA = participantA;
        this.participantB = participantB;
        this.listingA = listingA;
        this.listingB = listingB;
        this.status = Status.ACCEPTED;
        this.acceptedAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public Offer getOffer() { return offer; }
    public Type getDealType() { return dealType; }
    public User getParticipantA() { return participantA; }
    public User getParticipantB() { return participantB; }
    public Listing getListingA() { return listingA; }
    public Listing getListingB() { return listingB; }
    public Status getStatus() { return status; }
    public OffsetDateTime getAcceptedAt() { return acceptedAt; }
    public OffsetDateTime getCompletedAt() { return completedAt; }
    public OffsetDateTime getCancelledAt() { return cancelledAt; }
    public UUID getCancelledByUserId() { return cancelledByUserId; }

    public void setStatus(Status status) { this.status = status; }
    public void setCompletedAt(OffsetDateTime completedAt) { this.completedAt = completedAt; }
    public void setCancelledAt(OffsetDateTime cancelledAt) { this.cancelledAt = cancelledAt; }
    public void setCancelledByUserId(UUID cancelledByUserId) { this.cancelledByUserId = cancelledByUserId; }
}
