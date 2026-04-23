package com.example.IT23234048.controller;

import com.example.IT23234048.dto.CommentUpdateDTO;
import com.example.IT23234048.model.Comment;
import com.example.IT23234048.model.UserRole;
import com.example.IT23234048.service.CommentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/comments")
public class CommentController {
    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PutMapping("/{commentId}")
    @PreAuthorize("hasAnyRole('USER', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<Comment> updateComment(
            @PathVariable String commentId,
            @Valid @RequestBody CommentUpdateDTO dto,
            @RequestHeader(value = "X-User-Id", defaultValue = "user@example.com") String userId,
            @RequestHeader(value = "X-User-Role", defaultValue = "USER") String roleStr
    ) {
        UserRole userRole = UserRole.valueOf(roleStr);
        return ResponseEntity.ok(commentService.editComment(commentId, dto, userId, userRole));
    }

    @DeleteMapping("/{commentId}")
    @PreAuthorize("hasAnyRole('USER', 'TECHNICIAN', 'ADMIN')")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String commentId,
            @RequestHeader(value = "X-User-Id", defaultValue = "user@example.com") String userId,
            @RequestHeader(value = "X-User-Role", defaultValue = "USER") String roleStr
    ) {
        UserRole userRole = UserRole.valueOf(roleStr);
        commentService.deleteComment(commentId, userId, userRole);
        return ResponseEntity.noContent().build();
    }
}
