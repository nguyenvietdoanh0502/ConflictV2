package com.conflict.be.modules.schedule.repository;

import com.conflict.be.modules.schedule.entity.ScheduleEvent;
import com.conflict.be.modules.schedule.enums.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ScheduleEventRepository extends JpaRepository<ScheduleEvent, UUID> {

    @Query("""
            SELECT e FROM ScheduleEvent e
            LEFT JOIN FETCH e.subject
            WHERE e.user.id = :userId
              AND e.startDatetime < :to
              AND e.endDatetime > :from
            ORDER BY e.startDatetime ASC
            """)
    List<ScheduleEvent> findByUserIdAndDateRange(
            @Param("userId") UUID userId,
            @Param("from") Instant from,
            @Param("to") Instant to
    );

    @Query("""
            SELECT e FROM ScheduleEvent e
            LEFT JOIN FETCH e.subject
            WHERE e.user.id = :userId
              AND e.subject.id = :subjectId
              AND e.startDatetime < :to
              AND e.endDatetime > :from
            ORDER BY e.startDatetime ASC
            """)
    List<ScheduleEvent> findByUserIdAndSubjectIdAndDateRange(
            @Param("userId") UUID userId,
            @Param("subjectId") UUID subjectId,
            @Param("from") Instant from,
            @Param("to") Instant to
    );

    @Query("SELECT e FROM ScheduleEvent e LEFT JOIN FETCH e.subject WHERE e.id = :id AND e.user.id = :userId")
    Optional<ScheduleEvent> findByIdAndUserIdWithSubject(@Param("id") UUID id, @Param("userId") UUID userId);

    Optional<ScheduleEvent> findByIdAndUserId(UUID id, UUID userId);

    List<ScheduleEvent> findByUserIdOrderByStartDatetimeAsc(UUID userId);

    List<ScheduleEvent> findBySubjectId(UUID subjectId);

    boolean existsByUserIdAndSourceMessageId(UUID userId, String sourceMessageId);

    long countByUserIdAndStatus(UUID userId, EventStatus status);
}
