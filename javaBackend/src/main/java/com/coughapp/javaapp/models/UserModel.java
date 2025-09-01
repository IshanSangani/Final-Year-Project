package com.coughapp.javaapp.models;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserModel {

    @Id
    private String id;

    @NotBlank
    private String username;

    @Email
    private String email;

    @NotBlank
    private String password;

    private String role; // e.g., ROLE_USER, ROLE_ADMIN
}
