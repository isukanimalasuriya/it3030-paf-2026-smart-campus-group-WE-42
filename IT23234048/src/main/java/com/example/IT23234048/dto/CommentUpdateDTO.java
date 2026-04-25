package com.example.IT23234048.dto;

import jakarta.validation.constraints.NotBlank;

public class CommentUpdateDTO {
    @NotBlank(message = "Content is required")
    private String content;

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
