package com.example.IT23234048.repository;

import com.example.IT23234048.model.Student;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface StudentRepository extends MongoRepository<Student, String> {
    boolean existsByStudentId(String studentId);
}
