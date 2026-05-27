package com.wendyapp.backend.domain;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "listing_photos")
public class ListingPhoto {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private short position;

    protected ListingPhoto() {}

    public ListingPhoto(Listing listing, String url, int position) {
        this.listing = listing;
        this.url = url;
        this.position = (short) position;
    }

    public UUID getId() { return id; }
    public Listing getListing() { return listing; }
    public String getUrl() { return url; }
    public int getPosition() { return position; }
}
