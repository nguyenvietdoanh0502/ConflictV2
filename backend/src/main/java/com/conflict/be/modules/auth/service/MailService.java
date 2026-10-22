package com.conflict.be.modules.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:conflict@example.com}")
    private String fromEmail;

    @Async
    public void sendOtpEmail(String toEmail, String otpCode) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("UniSync - Xác thực Đăng ký tài khoản");
            message.setText("Chào mừng bạn đến với UniSync! Mã OTP xác thực đăng ký tài khoản của bạn là: " + otpCode + "\n\nMã này có hiệu lực trong 5 phút.");

            mailSender.send(message);
            log.info("OTP email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}", toEmail, e);
        }
    }
    @Async
    public void sendOtpEmailForResetPassword(String toEmail, String otpCode) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("UniSync - Đặt lại Mật khẩu");
            message.setText("Mã OTP đặt lại mật khẩu UniSync của bạn là: " + otpCode + "\n\nMã này có hiệu lực trong 5 phút.");

            mailSender.send(message);
            log.info("OTP email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}", toEmail, e);
        }
    }
}
