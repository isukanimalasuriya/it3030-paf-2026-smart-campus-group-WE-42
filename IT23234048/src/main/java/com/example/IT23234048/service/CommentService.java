package com.example.IT23234048.service;

import com.example.IT23234048.dto.CommentCreateDTO;
import com.example.IT23234048.dto.CommentUpdateDTO;
import com.example.IT23234048.exception.CommentNotFoundException;
import com.example.IT23234048.model.Comment;
import com.example.IT23234048.model.UserRole;
import com.example.IT23234048.repository.CommentRepository;
import java.time.Instant;
import java.util.UUID;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class CommentService {
    private final CommentRepository commentRepository;

    public CommentService(CommentRepository commentRepository) {
        this.commentRepository = commentRepository;
    }

    public Comment addComment(String ticketId, CommentCreateDTO dto, String authorId, UserRole authorRole) {
        Comment comment = new Comment();
        comment.setCommentId(UUID.randomUUID().toString());
        comment.setTicketId(ticketId);
        comment.setContent(dto.getContent());
        comment.setParentCommentId(dto.getParentCommentId());
        comment.setAuthorId(authorId);
        comment.setAuthorRole(authorRole);
        comment.setCreatedAt(Instant.now());
        comment.setEdited(false);

        return commentRepository.save(comment);
    }

    public Comment editComment(String commentId, CommentUpdateDTO dto, String userId, UserRole userRole) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new CommentNotFoundException(commentId));

        if (userRole != UserRole.ADMIN && !comment.getAuthorId().equals(userId)) {
            throw new AccessDeniedException("You can only edit your own comments");
        }

        comment.setContent(dto.getContent());
        comment.setEdited(true);
        return commentRepository.save(comment);
    }

    public void deleteComment(String commentId, String userId, UserRole userRole) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new CommentNotFoundException(commentId));

        if (userRole != UserRole.ADMIN && !comment.getAuthorId().equals(userId)) {
            throw new AccessDeniedException("You can only delete your own comments");
        }

        commentRepository.delete(comment);
    }
}
