package com.conflict.be.modules.chat.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class MessagePageDTO {
    private List<ChatMessageDTO> items;
    private int page;
    private int size;
    private boolean hasMore;
}
