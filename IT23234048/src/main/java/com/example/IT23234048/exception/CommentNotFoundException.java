package com.example.IT23234048.exception;

public class CommentNotFoundException extends RuntimeException {
    public CommentNotFoundException(String commentId) {
        super("Comment not found: " + commentId);
    }
}
