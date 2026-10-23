package com.conflict.be.modules.zalo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZaloGroupMappingRequest {

    @NotNull(message = "ID môn học không được để trống")
    private UUID subjectId;

    @NotBlank(message = "ID nhóm Zalo không được để trống")
    @Size(max = 100, message = "ID nhóm Zalo không quá 100 ký tự")
    private String zaloGroupId;

    @NotBlank(message = "Tên nhóm Zalo không được để trống")
    @Size(max = 255, message = "Tên nhóm Zalo không quá 255 ký tự")
    private String zaloGroupName;

    @Builder.Default
    private Boolean active = true;
}
