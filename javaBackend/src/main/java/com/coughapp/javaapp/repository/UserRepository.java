package com.coughapp.javaapp.repository;

import com.coughapp.javaapp.models.UserModel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<UserModel,String> {
    Optional<UserModel> findByEmail(String email);
    boolean existsByEmail(String email);
}
