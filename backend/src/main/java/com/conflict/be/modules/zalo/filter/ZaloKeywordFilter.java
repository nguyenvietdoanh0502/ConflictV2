package com.conflict.be.modules.zalo.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Slf4j
@Component
public class ZaloKeywordFilter {

    /**
     * Độ dài tối thiểu của một tin nhắn thông báo học vụ.
     * Tránh tốn quota AI cho các câu ngắn như "ok", "hi", "alo".
     */
    public static final int MIN_MESSAGE_LENGTH = 10;

    /**
     * Regex phát hiện từ khóa học vụ tiếng Việt (Ngày, tiết, nghỉ/bù, thi cử, hạn nộp, phòng học).
     * Sử dụng delimiter boundaries an toàn cho Unicode tiếng Việt.
     */
    private static final Pattern ACADEMIC_KEYWORD_PATTERN = Pattern.compile(
            "(?iu)(?:^|[\\s,.;:!?()\\[\\]\"'-])(" +
                    "thứ\\s*[2-7]|t[2-7]|cn|chủ\\s*nhật|" +
                    "mai|mốt|hôm\\s*nay|tuần\\s*(?:này|sau|tới)|" +
                    "tiết\\s*\\d+|tiết|ca\\s*(?:sáng|chiều|tối)|" +
                    "nghỉ|học\\s*bù|bù|off|báo\\s*nghỉ|đổi\\s*lịch|dời\\s*lịch|lịch\\s*học|" +
                    "phòng\\s*[a-zA-Z0-9_-]+|" +
                    "thi|kiểm\\s*tra|ktra|test|giữa\\s*kỳ|cuối\\s*kỳ|" +
                    "deadline|hạn\\s*nộp|hạn\\s*chót|btl|bài\\s*tập\\s*lớn|báo\\s*cáo|thuyết\\s*trình" +
            ")(?:$|[\\s,.;:!?()\\[\\]\"'-])"
    );

    /**
     * Kiểm tra nhanh xem tin nhắn có khả năng là thông báo học vụ hay không.
     *
     * @param text Nội dung tin nhắn
     * @return true nếu tin nhắn đạt điều kiện độ dài và chứa ít nhất 1 từ khóa học vụ
     */
    public boolean isLikelyAcademic(String text) {
        if (text == null) {
            return false;
        }

        String trimmed = text.trim();
        if (trimmed.length() < MIN_MESSAGE_LENGTH) {
            log.debug("Tin nhắn bị bỏ qua do độ dài < {}: '{}'", MIN_MESSAGE_LENGTH, trimmed);
            return false;
        }

        boolean matched = ACADEMIC_KEYWORD_PATTERN.matcher(trimmed).find();
        if (!matched) {
            log.debug("Tin nhắn không khớp từ khóa học vụ: '{}'", trimmed);
        }
        return matched;
    }
}
