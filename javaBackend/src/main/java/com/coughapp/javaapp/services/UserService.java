package com.coughapp.javaapp.services;

import com.coughapp.javaapp.models.UserModel;
import com.coughapp.javaapp.repository.UserRepository;
import com.coughapp.javaapp.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private PasswordEncoder passwordEncoder;


    public ResponseEntity<String> register(UserModel user){
        if(userRepository.existsByEmail(user.getEmail())){
            return ResponseEntity.status(400).body("Email already in use");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole("ROLE_USER");
        userRepository.save(user);
        return ResponseEntity.status(201).body("User registered successfully");
    }


public ResponseEntity<String> login(UserModel user){
    var existingUser = userRepository.findByEmail(user.getEmail());
    if(existingUser.isEmpty()){
        return ResponseEntity.status(401).body("Invalid email or password");
    }
    if(!passwordEncoder.matches(user.getPassword(), existingUser.get().getPassword())){
        return ResponseEntity.status(401).body("Invalid email or password");
    }
    String token = jwtUtil.generateToken(existingUser.get().getEmail());
    return ResponseEntity.ok(token);
}


}
