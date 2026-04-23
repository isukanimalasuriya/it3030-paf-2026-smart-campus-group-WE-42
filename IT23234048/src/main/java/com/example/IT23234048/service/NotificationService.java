package com.example.IT23234048.service;

import com.example.IT23234048.model.Comment;
import com.example.IT23234048.model.Ticket;
import com.example.IT23234048.model.TicketStatus;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    public void notifyNewTicket(Ticket ticket) {
        System.out.println("Mock Notification: New ticket created - " + ticket.getTicketId());
    }

    public void notifyTicketAssigned(Ticket ticket, String technicianEmail) {
        System.out.println("Mock Notification: Ticket " + ticket.getTicketId() + " assigned to " + technicianEmail);
    }

    public void notifyTicketResolved(Ticket ticket) {
        System.out.println("Mock Notification: Ticket resolved - " + ticket.getTicketId());
    }

    public void notifyStatusChange(Ticket ticket, TicketStatus oldStatus, TicketStatus newStatus) {
        System.out.println("Mock Notification: Ticket " + ticket.getTicketId() + " status changed from " + oldStatus + " to " + newStatus);
    }

    public void notifyNewComment(Ticket ticket, Comment comment) {
        System.out.println("Mock Notification: New comment on ticket " + ticket.getTicketId());
    }
}
