package com.conflict.be.modules.subject.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectRequest {

    @NotBlank(message = "Tên môn học không được để trống")
    @Size(max = 255, message = "Tên môn học không quá 255 ký tự")
    private String name;

    @Size(max = 50, message = "Mã môn học không quá 50 ký tự")
    private String code;

    @Size(max = 100, message = "Tên giảng viên không quá 100 ký tự")
    private String lecturer;

    @Size(max = 100, message = "Phòng học mặc định không quá 100 ký tự")
    private String defaultRoom;

    @Size(max = 20, message = "Mã màu không quá 20 ký tự")
    private String colorHex;

    @Min(value = 1, message = "Thứ trong tuần từ 1 (Thứ 2) đến 7 (Chủ nhật)")
    @Max(value = 7, message = "Thứ trong tuần từ 1 (Thứ 2) đến 7 (Chủ nhật)")
    private Integer dayOfWeek;

    private LocalTime startTime;

    private LocalTime endTime;

    @Size(max = 50, message = "Học kỳ không quá 50 ký tự")
    private String semester;

    private LocalDate semesterStartDate;

    private LocalDate semesterEndDate;
}
