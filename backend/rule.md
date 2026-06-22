# BASE PROJECT RULES — AI Agent Guide

> Dự án Spring Boot 3.5.x với JWT Authentication, JPA + MySQL, Swagger/OpenAPI.
> File này mô tả toàn bộ design pattern, cấu trúc, quy tắc code để AI Agent hiểu và mở rộng.

---

## 1. TỔNG QUAN KIẾN TRÚC

```
base/
├── BaseApplication.java                    # Entry point + CommandLineRunner init admin
├── base/                                   # Response wrapper utilities
│   ├── RestApiV1.java                      # Custom annotation: @RestController + @RequestMapping("/api/v1")
│   ├── RestData.java                       # Unified API response wrapper
│   ├── RestStatus.java                     # Enum: SUCCESS, ERROR
│   └── VsResponseUtil.java                 # Helper: success() / error()
├── config/                                 # Spring configuration
│   ├── EnvConfig.java                      # Load .env file via Dotenv
│   ├── OpenApiConfig.java                  # Swagger/OpenAPI + Bearer token scheme
│   ├── SecurityConfig.java                 # Spring Security filter chain
│   ├── UserInfoProperties.java             # @ConfigurationProperties("app.admin")
│   └── WebMvcConfig.java                   # CORS configuration
├── constant/                               # Constants (no enum, just classes)
│   ├── CommonConstant.java                 # BEARER_TOKEN, BCRYPT_STRENGTH, etc.
│   ├── ErrorMessage.java                   # Nested static classes: Auth, User, Admin
│   ├── RoleConstant.java                   # "ROLE_ADMIN", "ROLE_USER"
│   ├── SuccessMessage.java                 # Nested static classes: Auth
│   └── UrlConstant.java                    # Nested: Auth, User, Admin - each with PRE_FIX
├── controller/                             # REST controllers
│   ├── AuthController.java                 # Login, Logout
│   └── UserController.java                 # Profile, Admin CRUD
├── domain/
│   ├── dto/
│   │   ├── request/                        # LoginRequestDto, LogoutRequestDto, CreateUserRequestDto
│   │   └── response/                       # LoginResponseDto, UserResponseDto, CommonResponseDto
│   ├── entity/                             # User, Role(enum), InvalidatedToken
│   └── mapper/                             # AuthMapper, UserMapper (MapStruct)
├── exception/
│   ├── GlobalExceptionHandler.java         # @RestControllerAdvice
│   ├── VsException.java                    # Business exception
│   └── InternalServerException.java        # System exception
├── repository/                             # Spring Data JPA repositories
│   ├── UserRepository.java
│   └── InvalidatedTokenRepository.java
├── security/
│   ├── CustomUserDetails.java             # UserDetails wrapper for User entity
│   ├── JwtAuthenticationFilter.java       # OncePerRequestFilter: token validation
│   ├── JwtProvider.java                   # Token generation & parsing
│   ├── RequestLogFilter.java              # Log incoming requests
│   ├── RestAuthenticationEntryPoint.java  # 401 JSON response
│   └── SecurityUtils.java                 # getCurrentUserId(), getCurrentUsername()
└── service/
    ├── AuthService.java                   # Interface
    ├── UserDetailsService.java            # Interface extends Spring Security's UserDetailsService
    ├── UserService.java                   # Interface
    └── impl/
        ├── AuthServiceImpl.java           # @Service implements AuthService
        ├── UserDetailsServiceImpl.java    # @Service implements UserDetailsService
        └── UserServiceImpl.java           # @Service implements UserService
```

---

## 2. DESIGN PATTERN CHÍNH

### 2.1. Service Layer — Interface + Impl Pattern

Giống hệt pattern `AuthService → AuthServiceImpl`:

```java
// service/AuthService.java — Interface
public interface AuthService {
    LoginResponseDto authentication(LoginRequestDto request);
    CommonResponseDto logout(LogoutRequestDto request);
}

// service/impl/AuthServiceImpl.java — Implementation
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthServiceImpl implements AuthService {
    // DI via constructor (final fields)
    UserRepository userRepository;
    InvalidatedTokenRepository invalidatedTokenRepository;
    JwtProvider jwtProvider;
    UserDetailsService userDetailsService;
    PasswordEncoder passwordEncoder;
    
    // Non-final field for @Value injection
    @NonFinal
    @Value("${jwt.access.expiration_time}")
    long ACCESS_TOKEN_EXPIRATION;

    @Override
    public LoginResponseDto authentication(LoginRequestDto request) { ... }
}
```

**Quy tắc:** Mỗi service business đều có Interface ở `service/` và implementation ở `service/impl/`.

### 2.2. UserDetailsService Pattern

```java
// service/UserDetailsService.java
public interface UserDetailsService extends org.springframework.security.core.userdetails.UserDetailsService {
    // Kế thừa: loadUserByUsername(String username)
}

// service/impl/UserDetailsServiceImpl.java
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserDetailsServiceImpl implements UserDetailsService {
    UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
            .map(CustomUserDetails::new)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }
}
```

### 2.3. Dependency Injection — Constructor Injection

Luôn dùng `@RequiredArgsConstructor` + `final` fields. KHÔNG dùng `@Autowired` field injection.

```java
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SomeClass {
    SomeDependency someDependency;   // final, auto-injected via constructor
}
```

### 2.4. Lombok Convention

| Annotation | Vị trí | Mục đích |
|---|---|---|
| `@Getter @Setter` | Entity, DTO | Getter/setter tự động |
| `@Builder` | Entity, complex DTO | Builder pattern |
| `@AllArgsConstructor` | DTO, Entity | Constructor đầy đủ |
| `@NoArgsConstructor` | DTO, Entity | Constructor rỗng (JPA cần) |
| `@Slf4j` / `@Log4j2` | Service, Filter | Logger |
| `@FieldDefaults(level = AccessLevel.PRIVATE)` | Hầu hết class | `private` mặc định cho fields |
| `@RequiredArgsConstructor` | Controller, Service | Constructor DI |
| `@NonFinal` | Field nhận `@Value` | Cho phép field không final |

---

## 3. API RESPONSE — Unified Format

### 3.1. RestData<T> — Response Wrapper

Mọi API response đều bọc trong `ResponseEntity<RestData<T>>`:

```json
// SUCCESS:
{ "status": "SUCCESS", "data": { ... }, "message": null }

// ERROR:
{ "status": "ERROR", "data": null, "message": "error message here" }
```

### 3.2. VsResponseUtil — Helper

```java
// Success (HTTP 200)
VsResponseUtil.success(data);
// → ResponseEntity<RestData<T>> with status=SUCCESS, data=data

VsResponseUtil.success(HttpStatus.CREATED, data);

// Error
VsResponseUtil.error(HttpStatus.BAD_REQUEST, "message");
// → ResponseEntity<RestData<T>> with status=ERROR, message="message"
```

### 3.3. Controller Convention

```java
@RestApiV1                           // = @RestController + @RequestMapping("/api/v1")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class XxxController {
    XxxService xxxService;

    @Operation(summary = "...", description = "...")
    @PostMapping(UrlConstant.Xxx.ENDPOINT)
    public ResponseEntity<RestData<ResponseDto>> someMethod(@Valid @RequestBody RequestDto request) {
        ResponseDto response = xxxService.someMethod(request);
        return VsResponseUtil.success(response);
    }
}
```

Quy tắc controller:
- Dùng `@RestApiV1` custom annotation (không dùng `@RestController` trực tiếp)
- Luôn return `ResponseEntity<RestData<T>>`
- Gọi `VsResponseUtil.success()` hoặc `VsResponseUtil.error()`
- Validation: `@Valid` trên request body
- Swagger: `@Operation(summary=, description=)`, thêm `security = @SecurityRequirement(name = "Bearer Token")` nếu cần auth

### 3.4. Custom Annotation `@RestApiV1`

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@RestController
@RequestMapping("/api/v1")
public @interface RestApiV1 {}
```

---

## 4. SECURITY ARCHITECTURE

### 4.1. Flow

```
Request → RequestLogFilter (log) → JwtAuthenticationFilter → Controller
                                    ↑
                              Nếu không có token → RestAuthenticationEntryPoint (401 JSON)
```

### 4.2. JWT Token

- **Generate:** Nimbus JOSE (`MACSigner` + `JWSAlgorithm.HS512`)
- **Parse:** JJWT (`Jwts.parserBuilder()`)
- **Claims:** subject=username, custom: userId, email, authorities
- **Invalidation:** Lưu JWT ID vào `InvalidatedTokenRepository` khi logout
- **Secret:** Từ biến môi trường `JWT_SECRET`

### 4.3. SecurityConfig — Endpoint Authorization

```properties
security.public-endpoints = api/v1/auth/**,/swagger-ui/**,/v3/api-docs/**,/swagger-ui.html
security.user-endpoints = api/v1/user/**,/swagger-ui/**,/v3/api-docs/**,/swagger-ui.html
security.admin-endpoints = api/v1/admin/**,/swagger-ui/**,/v3/api-docs/**,/swagger-ui.html
```

Roles: `ROLE_USER` và `ROLE_ADMIN` (định nghĩa trong `RoleConstant`).

### 4.4. SecurityUtils

```java
SecurityUtils.getCurrentUserId()    // Lấy userId từ SecurityContext
SecurityUtils.getCurrentUsername()  // Lấy username từ SecurityContext
```

---

## 5. DTO & ENTITY CONVENTIONS

### 5.1. Entity

```java
@Entity
@Table(name = "table_name")
@AllArgsConstructor @NoArgsConstructor
@Getter @Setter @Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SomeEntity {
    @Id
    @UuidGenerator(style = UuidGenerator.Style.TIME)
    @Column(nullable = false)
    String id;
    // ...
}
```

- **ID:** `String` với `@UuidGenerator` (auto-generate UUID)
- **Vietnamese text:** `@Nationalized`
- **Password field:** `@JsonIgnore`
- **Enum:** `@Enumerated(EnumType.STRING)`

### 5.2. Request DTO

```java
@AllArgsConstructor @NoArgsConstructor
@Getter @Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class XxxRequestDto {
    @Schema(description = "...", example = "...")
    @NotBlank(message = ErrorMessage.NOT_BLANK_FIELD)
    String field;
}
```

Validation annotations:
- `@NotBlank` cho String
- `@NotNull` cho enum/objects
- `@Email` cho email
- `@Pattern` cho format validation (password, etc.)

### 5.3. Response DTO

```java
@AllArgsConstructor @NoArgsConstructor
@Getter @Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class XxxResponseDto {
    String id;
    String username;
    // ...
}
```

### 5.4. MapStruct Mapper

```java
@Mapper(componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
        nullValueCheckStrategy = NullValueCheckStrategy.ALWAYS)
public interface XxxMapper {
    XxxResponseDto entityToResponseDto(Entity entity);
    Entity requestDtoToEntity(CreateXxxRequestDto request);
}
```

---

## 6. EXCEPTION HANDLING

### 6.1. Business Exception — VsException

```java
throw new VsException(HttpStatus.BAD_REQUEST, ErrorMessage.User.ERR_USER_NOT_EXISTED);
// → HTTP status + message, bắt bởi GlobalExceptionHandler
```

### 6.2. GlobalExceptionHandler

Xử lý các exception:
| Exception | HTTP Status | Ghi chú |
|---|---|---|
| `VsException` | Custom status | Business error |
| `MethodArgumentNotValidException` | 400 | Validation error |
| `BindException` | 400 | Binding error |
| `AccessDeniedException` | 403 | "Bạn không có quyền truy cập tài nguyên này" |
| `Exception` | 500 | Internal server error |

---

## 7. URL CONSTANT PATTERN

```java
public class UrlConstant {
    public static class Auth {
        private static final String PRE_FIX = "/auth";
        public static final String LOGIN = PRE_FIX + "/login";       // → /auth/login
        public static final String LOGOUT = PRE_FIX + "/logout";     // → /auth/logout
        private Auth() {}
    }

    public static class User {
        private static final String PRE_FIX = "/user";
        public static final String GET_PROFILE = PRE_FIX + "/profile"; // → /user/profile
        private User() {}
    }

    public static class Admin {
        private static final String PRE_FIX = "/admin";
        public static final String GET_USER = PRE_FIX + "/user/{userId}";
        private Admin() {}
    }
}
```

Kết hợp với `@RestApiV1` prefix `/api/v1` → full path: `/api/v1/auth/login`

---

## 8. APPLICATION CONFIG

### 8.1. application.properties

- `.env` file ở thư mục gốc (load bởi `EnvConfig` + `spring.config.import`)
- Database: MySQL (có thể config qua env vars)
- JPA: `ddl-auto=update`
- JWT: Secret + expiration time từ env

### 8.2. .env file

Cần tạo file `.env` ở thư mục gốc:
```
MYSQL_ROOT_PASSWORD=your_password
JWT_SECRET=your_secret_key_256_bits_minimum
JWT_ACCESS_EXPIRATION_TIME=3600000
JWT_REFRESH_EXPIRATION_TIME=259200000
ADMIN_PASSWORD=admin_password
```

### 8.3. Build (pom.xml)

- Java: 17 (source + target). Đồng bộ `<java.version>` với `<source>`/`<target>` của maven-compiler-plugin
- Spring Boot parent: 3.5.14
- MapStruct + Lombok với annotation processor binding
- JJWT 0.11.5 + Nimbus JOSE 10.2

---

## 9. QUI TẮC MỞ RỘNG (CHO AI AGENT)

Khi thêm feature mới, làm theo các bước:

### Step 1: Entity + Enum (nếu cần)
```java
// domain/entity/NewEntity.java
@Entity @Table(name = "new_entity")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class NewEntity {
    @Id @UuidGenerator @Column(nullable = false) String id;
    // fields...
}
```

### Step 2: Repository
```java
// repository/NewEntityRepository.java
@Repository
public interface NewEntityRepository extends JpaRepository<NewEntity, String> {
    // custom queries...
}
```

### Step 3: DTOs
```java
// domain/dto/request/CreateNewEntityRequestDto.java
// domain/dto/response/NewEntityResponseDto.java
```

### Step 4: Mapper (nếu cần)
```java
// domain/mapper/NewEntityMapper.java
@Mapper(componentModel = "spring", ...)
public interface NewEntityMapper { ... }
```

### Step 5: Service Interface + Impl
```java
// service/NewEntityService.java — Interface
// service/impl/NewEntityServiceImpl.java — @Service implements NewEntityService
```

### Step 6: Controller
```java
// controller/NewEntityController.java
@RestApiV1
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NewEntityController {
    NewEntityService newEntityService;
    // endpoints...
}
```

### Step 7: URL Constants + Error Messages + Security Rules
```java
// Thêm vào UrlConstant, ErrorMessage
// Thêm endpoint pattern vào SecurityConfig (qua application.properties)
```

---

## 10. LƯU Ý CHO AI AGENT

1. **Import tường minh:** Dùng full class path cho các class trùng tên (vd: `org.springframework.security.core.userdetails.UserDetailsService`)
2. **Không dùng `@Autowired`:** Chỉ dùng constructor injection với `@RequiredArgsConstructor`
3. **Response luôn qua `VsResponseUtil`:** Không tự tạo `ResponseEntity` thủ công
4. **URL constants:** Luôn dùng `UrlConstant`, không hardcode string trong controller
5. **Exception:** Dùng `VsException` cho business error, `InternalServerException` cho system error
6. **Validation message:** Luôn dùng hằng số từ `ErrorMessage`
7. **Controller method visibility:** `public`
8. **Package scan gốc:** `com.example.base` (cấu hình trong `@SpringBootApplication`)
9. **MapStruct + Lombok:** Luôn có cả 2 trong annotation processor paths của maven-compiler-plugin
10. **JWT filter path:** Filter áp dụng cho mọi request, phân quyền theo endpoint pattern trong SecurityConfig

---

*Generated from project analysis — update this file when adding new patterns or dependencies.*
