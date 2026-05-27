package com.wendyapp.backend.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcType;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "listings")
public class Listing {

    public enum OfferType { TRADE_ONLY, GIFT_ONLY, EITHER }
    public enum Status    { ACTIVE, PAUSED, DELETED }

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "offer_type", nullable = false, columnDefinition = "listing_offer_type")
    private OfferType offerType;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(nullable = false, columnDefinition = "listing_status")
    private Status status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "listing", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("position ASC")
    private List<ListingPhoto> photos = new ArrayList<>();

    protected Listing() {}

    public Listing(User owner, Category category, String title, String description, OfferType offerType) {
        this.owner = owner;
        this.category = category;
        this.title = title;
        this.description = description;
        this.offerType = offerType;
        this.status = Status.ACTIVE;
    }

    public UUID getId() { return id; }
    public User getOwner() { return owner; }
    public Category getCategory() { return category; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public OfferType getOfferType() { return offerType; }
    public Status getStatus() { return status; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public List<ListingPhoto> getPhotos() { return photos; }

    public void setCategory(Category category) { this.category = category; }
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setOfferType(OfferType offerType) { this.offerType = offerType; }
    public void setStatus(Status status) { this.status = status; }
}
