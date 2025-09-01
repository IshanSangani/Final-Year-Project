package com.coughapp.javaapp.controller;

import com.coughapp.javaapp.models.UserModel;
import com.coughapp.javaapp.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody UserModel user) {
       return userService.login(user);
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody UserModel user) {
        return userService.register(user);
    }

}
