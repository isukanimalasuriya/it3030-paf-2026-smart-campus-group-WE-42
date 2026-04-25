package com.example.IT23234048.dto;

import jakarta.validation.constraints.NotBlank;

public class CommentCreateDTO {
    @NotBlank(message = "Content is required")
    private String content;
    private String parentCommentId;

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getParentCommentId() { return parentCommentId; }
    public void setParentCommentId(String parentCommentId) { this.parentCommentId = parentCommentId; }
}
