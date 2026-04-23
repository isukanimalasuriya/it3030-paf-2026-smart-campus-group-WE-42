package com.example.IT23234048.dto;

import com.example.IT23234048.model.TicketStatus;
import jakarta.validation.constraints.NotNull;

public class TicketStatusUpdateDTO {
    @NotNull(message = "Status is required")
    private TicketStatus status;
    private String rejectedReason;
    private String resolutionNotes;

    public TicketStatus getStatus() { return status; }
    public void setStatus(TicketStatus status) { this.status = status; }

    public String getRejectedReason() { return rejectedReason; }
    public void setRejectedReason(String rejectedReason) { this.rejectedReason = rejectedReason; }

    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }
}
