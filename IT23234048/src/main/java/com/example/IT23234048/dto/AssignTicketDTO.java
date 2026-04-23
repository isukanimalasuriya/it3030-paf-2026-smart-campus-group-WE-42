package com.example.IT23234048.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class AssignTicketDTO {
    @NotBlank(message = "Assigned to email is required")
    @Email(message = "Must be a valid email")
    private String assignedToEmail;

    public String getAssignedToEmail() { return assignedToEmail; }
    public void setAssignedToEmail(String assignedToEmail) { this.assignedToEmail = assignedToEmail; }
}
