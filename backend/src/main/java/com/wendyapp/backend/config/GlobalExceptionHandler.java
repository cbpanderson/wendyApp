package com.wendyapp.backend.config;

import com.wendyapp.backend.auth.EmailAlreadyInUseException;
import com.wendyapp.backend.auth.HandleAlreadyInUseException;
import com.wendyapp.backend.auth.InvalidZipException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

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

    private ResponseEntity<Map<String, Object>> error(HttpStatus status, String code, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        Map<String, Object> error = new LinkedHashMap<>();
        error.put("code", code);
        error.put("message", message);
        body.put("error", error);
        return ResponseEntity.status(status).body(body);
    }
}
