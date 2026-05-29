package com.wendyapp.backend.config;

import com.wendyapp.backend.auth.EmailAlreadyInUseException;
import com.wendyapp.backend.auth.HandleAlreadyInUseException;
import com.wendyapp.backend.auth.InvalidCredentialsException;
import com.wendyapp.backend.auth.InvalidZipException;
import com.wendyapp.backend.listings.ForbiddenException;
import com.wendyapp.backend.listings.InvalidListingException;
import com.wendyapp.backend.listings.ListingNotFoundException;
import com.wendyapp.backend.listings.PhotoLimitReachedException;
import com.wendyapp.backend.deals.DealNotFoundException;
import com.wendyapp.backend.deals.InvalidDealException;
import com.wendyapp.backend.ratings.AlreadyRatedException;
import com.wendyapp.backend.offers.InvalidOfferException;
import com.wendyapp.backend.offers.OfferConflictException;
import com.wendyapp.backend.offers.OfferNotFoundException;
import com.wendyapp.backend.users.UserNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Maps thrown exceptions to the standard error envelope from spec-docs/03-api.yaml:
 * { "error": { "code": "...", "message": "..." } }
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .orElse("Validation failed");
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", message);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadable(HttpMessageNotReadableException ex) {
        return error(HttpStatus.BAD_REQUEST, "MALFORMED_REQUEST", "Request body could not be parsed");
    }

    @ExceptionHandler(EmailAlreadyInUseException.class)
    public ResponseEntity<Map<String, Object>> handleEmailDup(EmailAlreadyInUseException ex) {
        return error(HttpStatus.CONFLICT, "EMAIL_IN_USE", ex.getMessage());
    }

    @ExceptionHandler(HandleAlreadyInUseException.class)
    public ResponseEntity<Map<String, Object>> handleHandleDup(HandleAlreadyInUseException ex) {
        return error(HttpStatus.CONFLICT, "HANDLE_IN_USE", ex.getMessage());
    }

    @ExceptionHandler(InvalidZipException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidZip(InvalidZipException ex) {
        return error(HttpStatus.BAD_REQUEST, "INVALID_ZIP", ex.getMessage());
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCreds(InvalidCredentialsException ex) {
        return error(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", ex.getMessage());
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleUserNotFound(UserNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(ListingNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleListingNotFound(ListingNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<Map<String, Object>> handleForbidden(ForbiddenException ex) {
        return error(HttpStatus.FORBIDDEN, "FORBIDDEN", ex.getMessage());
    }

    @ExceptionHandler(InvalidListingException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidListing(InvalidListingException ex) {
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", ex.getMessage());
    }

    @ExceptionHandler(PhotoLimitReachedException.class)
    public ResponseEntity<Map<String, Object>> handlePhotoLimit(PhotoLimitReachedException ex) {
        return error(HttpStatus.CONFLICT, "PHOTO_LIMIT", ex.getMessage());
    }

    @ExceptionHandler(OfferNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleOfferNotFound(OfferNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(InvalidOfferException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidOffer(InvalidOfferException ex) {
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", ex.getMessage());
    }

    @ExceptionHandler(OfferConflictException.class)
    public ResponseEntity<Map<String, Object>> handleOfferConflict(OfferConflictException ex) {
        return error(HttpStatus.CONFLICT, "OFFER_CONFLICT", ex.getMessage());
    }

    @ExceptionHandler(DealNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleDealNotFound(DealNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, "DEAL_NOT_FOUND", ex.getMessage());
    }

    @ExceptionHandler(InvalidDealException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidDeal(InvalidDealException ex) {
        return error(HttpStatus.BAD_REQUEST, "INVALID_DEAL_STATE", ex.getMessage());
    }

    @ExceptionHandler(AlreadyRatedException.class)
    public ResponseEntity<Map<String, Object>> handleAlreadyRated(AlreadyRatedException ex) {
        return error(HttpStatus.CONFLICT, "ALREADY_RATED", ex.getMessage());
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxUpload(MaxUploadSizeExceededException ex) {
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "File exceeds 2 MB limit");
    }

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String code, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        Map<String, Object> error = new LinkedHashMap<>();
        error.put("code", code);
        error.put("message", message);
        body.put("error", error);
        return ResponseEntity.status(status).body(body);
    }
}
