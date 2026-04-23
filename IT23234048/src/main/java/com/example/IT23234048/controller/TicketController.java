package com.example.IT23234048.controller;

import com.example.IT23234048.dto.AssignTicketDTO;
import com.example.IT23234048.dto.CommentCreateDTO;
import com.example.IT23234048.dto.ResolutionDTO;
import com.example.IT23234048.dto.TicketRequestDTO;
import com.example.IT23234048.dto.TicketStatusUpdateDTO;
import com.example.IT23234048.model.Comment;
import com.example.IT23234048.model.Ticket;
import com.example.IT23234048.model.UserRole;
import com.example.IT23234048.service.ImageUploadService;
import com.example.IT23234048.service.TicketService;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/tickets")
public class TicketController {
    
    private final TicketService ticketService;
    private final ImageUploadService imageUploadService;

    public TicketController(TicketService ticketService, ImageUploadService imageUploadService) {
        this.ticketService = ticketService;
        this.imageUploadService = imageUploadService;
    }

    @PostMapping
    public ResponseEntity<Ticket> createTicket(
            @Valid @RequestBody TicketRequestDTO dto,
            @RequestHeader(value = "X-User-Id", defaultValue = "user@campus.lk") String userId
    ) {
        return new ResponseEntity<>(ticketService.createTicket(dto, userId), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Ticket>> getTickets() {
        return ResponseEntity.ok(ticketService.getTickets());
    }

    @GetMapping("/{ticketId}")
    public ResponseEntity<Ticket> getTicketById(@PathVariable String ticketId) {
        return ResponseEntity.ok(ticketService.getTicketById(ticketId));
    }

    @PutMapping("/{ticketId}/status")
    public ResponseEntity<Ticket> updateTicketStatus(
            @PathVariable String ticketId,
            @Valid @RequestBody TicketStatusUpdateDTO dto
    ) {
        return ResponseEntity.ok(ticketService.updateTicketStatus(ticketId, dto));
    }

    @PatchMapping("/{ticketId}/assign")
    public ResponseEntity<Ticket> assignTicket(
            @PathVariable String ticketId,
            @Valid @RequestBody AssignTicketDTO dto,
            @RequestHeader(value = "X-User-Id", defaultValue = "tech@example.com") String userId,
            @RequestHeader(value = "X-User-Role", defaultValue = "TECHNICIAN") String roleStr
    ) {
        UserRole role = UserRole.valueOf(roleStr);
        return ResponseEntity.ok(ticketService.assignTicket(ticketId, dto, userId, role));
    }

    @PutMapping("/{ticketId}/resolution")
    public ResponseEntity<Ticket> resolveTicket(
            @PathVariable String ticketId,
            @Valid @RequestBody ResolutionDTO dto
    ) {
        return ResponseEntity.ok(ticketService.resolveTicket(ticketId, dto));
    }

    @DeleteMapping("/{ticketId}")
    public ResponseEntity<Void> deleteTicket(
            @PathVariable String ticketId,
            @RequestHeader(value = "X-User-Role", defaultValue = "USER") String roleStr
    ) {
        UserRole role = UserRole.valueOf(roleStr);
        ticketService.deleteTicket(ticketId, role);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{ticketId}/comments")
    public ResponseEntity<Comment> addComment(
            @PathVariable String ticketId,
            @Valid @RequestBody CommentCreateDTO dto,
            @RequestHeader(value = "X-User-Id", defaultValue = "user@example.com") String userId,
            @RequestHeader(value = "X-User-Role", defaultValue = "USER") String roleStr
    ) {
        UserRole role = UserRole.valueOf(roleStr);
        return new ResponseEntity<>(ticketService.addComment(ticketId, dto, userId, role), HttpStatus.CREATED);
    }

    @PostMapping("/{ticketId}/images")
    public ResponseEntity<List<String>> uploadImages(
            @PathVariable String ticketId,
            @RequestParam("files") List<MultipartFile> files
    ) throws IOException {
        if (files.size() > 3) {
            return ResponseEntity.badRequest().build();
        }
        List<String> uploadedUrls = imageUploadService.uploadImages(files);
        ticketService.addImageUrls(ticketId, uploadedUrls);
        return ResponseEntity.ok(uploadedUrls);
    }
}
