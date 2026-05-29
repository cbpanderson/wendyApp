package com.wendyapp.backend.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false, unique = true)
    private String handle;

    @Column
    private String bio;

    @Column(name = "zip_code", nullable = false, length = 5)
    private String zipCode;

    @Column(name = "confirmed_adult", nullable = false)
    private boolean confirmedAdult;

    @Column(name = "average_stars")
    private Double averageStars;

    @Column(name = "rating_count", nullable = false)
    private int ratingCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected User() {}

    public User(String email, String passwordHash, String handle, String zipCode, boolean confirmedAdult) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.handle = handle;
        this.zipCode = zipCode;
        this.confirmedAdult = confirmedAdult;
    }

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public String getHandle() { return handle; }
    public String getBio() { return bio; }
    public String getZipCode() { return zipCode; }
    public boolean isConfirmedAdult() { return confirmedAdult; }
    public Double getAverageStars() { return averageStars; }
    public int getRatingCount() { return ratingCount; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }

    public void setBio(String bio) { this.bio = bio; }
    public void setAverageStars(Double averageStars) { this.averageStars = averageStars; }
    public void setRatingCount(int ratingCount) { this.ratingCount = ratingCount; }
}
