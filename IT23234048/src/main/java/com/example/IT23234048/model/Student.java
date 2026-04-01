package com.example.IT23234048.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "students")
public class Student {

    @Id
    private String id;

    @Indexed(unique = true)
    private String studentId;
    private String username;
    private String email;
    private String password;

    public Student() {
    }

    public Student(String studentId, String username, String email, String password) {
        this.studentId = studentId;
        this.username = username;
        this.email = email;
        this.password = password;
    }

    public String getId() {
        return id;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
