package com.wendyapp.backend.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wendyapp.backend.domain.User;
import com.wendyapp.backend.domain.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Reads `Authorization: Bearer <jwt>`, validates the token via {@link JwtService},
 * loads the user, and sets the SecurityContext with the {@link User} as principal.
 *
 * If the header is missing the request continues unauthenticated (Spring Security
 * will 401 protected endpoints via its AuthenticationEntryPoint).
 * If the header is present but invalid/expired, we write a 401 directly with the
 * standard error envelope from spec-docs/03-api.yaml.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository users;
    private final ObjectMapper objectMapper;

    public JwtAuthFilter(JwtService jwtService, UserRepository users, ObjectMapper objectMapper) {
        this.jwtService = jwtService;
        this.users = users;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring("Bearer ".length()).trim();
            UUID userId;
            try {
                userId = jwtService.parseUserId(token);
            } catch (Exception ex) {
                writeUnauthorized(response, "Invalid or expired token");
                return;
            }
            Optional<User> user = users.findById(userId);
            if (user.isEmpty()) {
                writeUnauthorized(response, "Token subject no longer exists");
                return;
            }
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(user.get(), null, List.of());
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        chain.doFilter(request, response);
    }

    private void writeUnauthorized(HttpServletResponse response, String message) throws IOException {
        Map<String, Object> error = new LinkedHashMap<>();
        error.put("code", "UNAUTHORIZED");
        error.put("message", message);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", error);

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), body);
    }
}
