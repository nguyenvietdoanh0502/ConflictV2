package com.conflict.be.modules.zalo.dto.ai;

import com.conflict.be.modules.schedule.enums.EventType;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiDetectedEvent {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @JsonProperty("event_type")
    private EventType eventType;

    @JsonProperty("title")
    private String title;

    @JsonProperty("start_datetime")
    @JsonDeserialize(using = FlexibleVnInstantDeserializer.class)
    private Instant startDatetime;

    @JsonProperty("end_datetime")
    @JsonDeserialize(using = FlexibleVnInstantDeserializer.class)
    private Instant endDatetime;

    @JsonProperty("room")
    private String room;

    @JsonProperty("note")
    private String note;

    public static class FlexibleVnInstantDeserializer extends JsonDeserializer<Instant> {
        @Override
        public Instant deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
            String raw = p.getValueAsString();
            if (raw == null || raw.isBlank()) {
                return null;
            }
            String s = raw.trim();
            if (s.contains(" ") && !s.contains("T")) {
                s = s.replaceFirst(" ", "T");
            }
            try {
                return OffsetDateTime.parse(s).toInstant();
            } catch (Exception ignored) {
            }
            try {
                return Instant.parse(s);
            } catch (Exception ignored) {
            }
            try {
                return LocalDateTime.parse(s).atZone(VN_ZONE).toInstant();
            } catch (Exception ignored) {
            }
            try {
                return LocalDate.parse(s).atTime(7, 0).atZone(VN_ZONE).toInstant();
            } catch (Exception ignored) {
            }
            return (Instant) ctxt.handleWeirdStringValue(Instant.class, raw, "Không thể phân tích chuỗi thời gian ISO-8601: " + raw);
        }
    }
}
