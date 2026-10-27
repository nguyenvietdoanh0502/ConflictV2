package com.conflict.be.modules.subject.dto;

import com.conflict.be.modules.subject.entity.Subject;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectResponse {

    private UUID id;
    private UUID userId;
    private String name;
    private String code;
    private String lecturer;
    private String defaultRoom;
    private String colorHex;
    private Integer dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private String semester;
    private LocalDate semesterStartDate;
    private LocalDate semesterEndDate;
    private Instant createdAt;
    private Instant updatedAt;

    public static SubjectResponse fromEntity(Subject subject) {
        if (subject == null) {
            return null;
        }
        return SubjectResponse.builder()
                .id(subject.getId())
                .userId(subject.getUser() != null ? subject.getUser().getId() : null)
                .name(subject.getName())
                .code(subject.getCode())
                .lecturer(subject.getLecturer())
                .defaultRoom(subject.getDefaultRoom())
                .colorHex(subject.getColorHex())
                .dayOfWeek(subject.getDayOfWeek())
                .startTime(subject.getStartTime())
                .endTime(subject.getEndTime())
                .semester(subject.getSemester())
                .semesterStartDate(subject.getSemesterStartDate())
                .semesterEndDate(subject.getSemesterEndDate())
                .createdAt(subject.getCreatedAt())
                .updatedAt(subject.getUpdatedAt())
                .build();
    }
}
