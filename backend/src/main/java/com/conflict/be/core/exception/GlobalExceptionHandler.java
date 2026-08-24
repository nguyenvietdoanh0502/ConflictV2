package com.conflict.be.core.exception;

import com.conflict.be.core.common.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.nio.file.AccessDeniedException;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(value = Exception.class)
    ResponseEntity<ApiResponse<Void>> handlingRuntimeException(RuntimeException exception) {
        log.error("Exception: ", exception);
        ErrorCode errorCode = ErrorCode.UNCATEGORIZED_EXCEPTION;
        ApiResponse<Void> apiResponse = ApiResponse.error(
                errorCode.getHttpStatus(),
                errorCode.getMessage(),
                errorCode.getCode());

        return ResponseEntity.status(errorCode.getHttpStatus()).body(apiResponse);
    }

    @ExceptionHandler(value = DataIntegrityViolationException.class)
    ResponseEntity<ApiResponse<Void>> handlingDataIntegrityViolationException(DataIntegrityViolationException exception) {
        log.error("DataIntegrityViolationException: ", exception);
        ErrorCode errorCode = ErrorCode.USER_EXISTED;
        ApiResponse<Void> apiResponse = ApiResponse.error(
                errorCode.getHttpStatus(),
                errorCode.getMessage(),
                errorCode.getCode());

        return ResponseEntity.status(errorCode.getHttpStatus()).body(apiResponse);
    }

    @ExceptionHandler(value = AppException.class)
    ResponseEntity<ApiResponse<Void>> handlingAppException(AppException exception) {
        ErrorCode errorCode = exception.getErrorCode();
        ApiResponse<Void> apiResponse = ApiResponse.error(
                errorCode.getHttpStatus(),
                errorCode.getMessage(),
                errorCode.getCode());

        return ResponseEntity.status(errorCode.getHttpStatus()).body(apiResponse);
    }

    @ExceptionHandler(value = AccessDeniedException.class)
    ResponseEntity<ApiResponse<Void>> handlingAccessDeniedException(AccessDeniedException exception) {
        ErrorCode errorCode = ErrorCode.UNAUTHORIZED;
        ApiResponse<Void> apiResponse = ApiResponse.error(
                errorCode.getHttpStatus(),
                errorCode.getMessage(),
                errorCode.getCode());

        return ResponseEntity.status(errorCode.getHttpStatus()).body(apiResponse);
    }

    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse<Void>> handlingValidation(MethodArgumentNotValidException exception) {
        FieldError fieldError = exception.getFieldError();
        String enumKey = fieldError != null
                ? resolveValidationErrorKey(fieldError)
                : exception.getGlobalError().getDefaultMessage();

        ErrorCode errorCode = ErrorCode.INVALID_KEY;

        try {
            if (enumKey != null) {
                errorCode = ErrorCode.valueOf(enumKey);
            }
        } catch (IllegalArgumentException e) {
            log.error("Invalid ErrorCode key: {}", enumKey);
        }

        ApiResponse<Void> apiResponse = ApiResponse.error(
                errorCode.getHttpStatus(),
                errorCode.getMessage(),
                errorCode.getCode());

        return ResponseEntity.status(errorCode.getHttpStatus()).body(apiResponse);
    }

    private String resolveValidationErrorKey(FieldError fieldError) {
        if (fieldError.isBindingFailure()) {
            return switch (fieldError.getField()) {
                case "dateOfBirth" -> ErrorCode.INVALID_DATE_OF_BIRTH.name();
                case "gender" -> ErrorCode.INVALID_GENDER.name();
                default -> fieldError.getDefaultMessage();
            };
        }

        return fieldError.getDefaultMessage();
    }
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<ApiResponse<Void>> handlingMaxUploadSizeExceededException(
            MaxUploadSizeExceededException exception
    ){
        ErrorCode errorCode = ErrorCode.AVATAR_TOO_LARGE;
        ApiResponse<Void> response = ApiResponse.error(
                errorCode.getHttpStatus(),
                errorCode.getMessage(),
                errorCode.getCode()
        );
        return ResponseEntity.status(errorCode.getHttpStatus()).body(response);
    }

}
