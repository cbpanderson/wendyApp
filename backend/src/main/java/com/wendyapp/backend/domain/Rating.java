package com.wendyapp.backend.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ratings")
public class Rating {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "deal_id", nullable = false)
    private Deal deal;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "rater_id", nullable = false)
    private User rater;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "ratee_id", nullable = false)
    private User ratee;

    @Column(nullable = false)
    private short stars;

    @Column
    private String review;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected Rating() {}

    public Rating(Deal deal, User rater, User ratee, int stars, String review) {
        this.deal = deal;
        this.rater = rater;
        this.ratee = ratee;
        this.stars = (short) stars;
        this.review = review;
    }

    public UUID getId() { return id; }
    public Deal getDeal() { return deal; }
    public User getRater() { return rater; }
    public User getRatee() { return ratee; }
    public int getStars() { return stars; }
    public String getReview() { return review; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
