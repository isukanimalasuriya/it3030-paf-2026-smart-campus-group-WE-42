package com.example.IT23234048.dto;

import jakarta.validation.constraints.NotBlank;

public class ResolutionDTO {
    @NotBlank(message = "Resolution notes are required")
    private String resolutionNotes;

    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }
}
