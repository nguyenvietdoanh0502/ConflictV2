package com.conflict.be.modules.zalo.filter;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ZaloKeywordFilterTest {

    private ZaloKeywordFilter filter;

    @BeforeEach
    void setUp() {
        filter = new ZaloKeywordFilter();
    }

    @Test
    @DisplayName("Nên bỏ qua tin nhắn null hoặc độ dài < 10 ký tự")
    void shouldDropNullOrShortMessages() {
        assertFalse(filter.isLikelyAcademic(null));
        assertFalse(filter.isLikelyAcademic(""));
        assertFalse(filter.isLikelyAcademic("   "));
        assertFalse(filter.isLikelyAcademic("alo"));
        assertFalse(filter.isLikelyAcademic("ok nhe"));
    }

    @Test
    @DisplayName("Nên bỏ qua tin nhắn tán gẫu sinh viên không liên quan học vụ")
    void shouldDropConversationalMessages() {
        assertFalse(filter.isLikelyAcademic("Trưa nay tan học có ai đi ăn cơm tấm không ae ơi?"));
        assertFalse(filter.isLikelyAcademic("Ai cầm nhầm cây dù của tui ở căn tin không?"));
        assertFalse(filter.isLikelyAcademic("Game tối nay có ai kéo rank với tui không nào?"));
    }

    @Test
    @DisplayName("Nên nhận diện tin nhắn báo nghỉ và học bù")
    void shouldDetectCancelAndMakeupMessages() {
        assertTrue(filter.isLikelyAcademic("Ae chú ý t7 tuần này thầy bận nên nghỉ nhé, học bù sang thứ 2 tiết 1-3."));
        assertTrue(filter.isLikelyAcademic("Chiều thứ 4 tuần sau lớp mình học bù tiết 7-9 phòng 502-A1 nhé."));
        assertTrue(filter.isLikelyAcademic("Lớp off sáng mai nha mọi người."));
    }

    @Test
    @DisplayName("Nên nhận diện tin nhắn kiểm tra hoặc thi")
    void shouldDetectExamMessages() {
        assertTrue(filter.isLikelyAcademic("Thứ 6 tuần sau kiểm tra giữa kỳ 45 phút luôn nhé."));
        assertTrue(filter.isLikelyAcademic("Lịch thi cuối kỳ môn này là ngày 15/12 tại phòng 301."));
        assertTrue(filter.isLikelyAcademic("Tuần tới có bài ktra 15 phút đầu giờ."));
    }

    @Test
    @DisplayName("Nên nhận diện tin nhắn deadline nộp bài tập lớn")
    void shouldDetectDeadlineMessages() {
        assertTrue(filter.isLikelyAcademic("Hạn chót nộp bài tập lớn BTL là 23h59 chủ nhật tuần sau."));
        assertTrue(filter.isLikelyAcademic("Nhắc cả lớp deadline nộp báo cáo thuyết trình là tối mai."));
    }
}
