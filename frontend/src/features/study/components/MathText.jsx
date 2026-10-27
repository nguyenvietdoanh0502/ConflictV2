import React, { useMemo } from "react";
import katex from "katex";

function renderMathSegment(mathStr, isBlock = false) {
  try {
    return katex.renderToString(mathStr, {
      throwOnError: false,
      displayMode: isBlock,
    });
  } catch (err) {
    return mathStr;
  }
}

// Bộ regex kiểm tra xem chuỗi có chứa từ ngữ tiếng Việt có dấu hay không
const VIETNAMESE_ACCENT_REGEX =
  /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

/**
 * Làm sạch các ký tự markdown chưa đóng như ` hoặc ** trong text
 */
export function sanitizeMarkdownDecorators(str) {
  if (!str || typeof str !== "string") return "";
  let s = str;

  // Nếu số lượng dấu backtick ` là lẻ, xóa backtick mồ côi
  if ((s.match(/`/g) || []).length % 2 !== 0) {
    s = s.replace(/`/g, "");
  }

  // Nếu số lượng dấu bold ** là lẻ, xóa dấu ** mồ côi
  if ((s.match(/\*\*/g) || []).length % 2 !== 0) {
    s = s.replace(/\*\*/g, "");
  }

  return s;
}

/**
 * Chuyển đổi chuỗi văn bản chứa công thức toán LaTeX ($...$, $$...$$, hoặc raw LaTeX commands)
 * thành chuỗi HTML với định dạng KaTeX chuẩn toán học, bảo toàn nguyên vẹn tiếng Việt.
 */
export function formatMathInHtml(text) {
  if (!text || typeof text !== "string") return "";

  // 1. Chuẩn hóa ký tự xuống dòng và khôi phục ký tự LaTeX bị nuốt bởi carriage return JSON
  let cleaned = sanitizeMarkdownDecorators(text)
    .replace(/\r\n/g, "\n")
    .replace(/\r(?=[a-zA-Z])/g, "\\")
    .replace(/\r/g, "");

  // 2. Xử lý dấu đô la mồ côi (odd number of '$')
  const dollarCount = (cleaned.match(/(?<!\\)\$/g) || []).length;
  if (dollarCount % 2 !== 0) {
    const firstDollarIdx = cleaned.indexOf("$");
    const prefix = cleaned.slice(0, firstDollarIdx).trim();

    // Nếu tiền tố trước $ đầu tiên trông giống biểu thức toán học (e.g. e^{-1} \pmod{\phi(n)}$ hoặc (p-1)(q-1)$)
    if (
      prefix &&
      (prefix.includes("\\") || /^[a-zA-Z0-9_\^()+-\s/]+$/.test(prefix)) &&
      !VIETNAMESE_ACCENT_REGEX.test(prefix)
    ) {
      cleaned = "$" + cleaned;
    } else {
      // Ngược lại, dấu $ bị thiếu nằm ở cuối biểu thức (e.g. $\phi(n) hoặc $d)
      const lastDollarIdx = cleaned.lastIndexOf("$");
      const suffix = cleaned.slice(lastDollarIdx + 1).trim();
      if (!VIETNAMESE_ACCENT_REGEX.test(suffix)) {
        cleaned = cleaned + "$";
      }
    }
  }

  const tokens = [];

  // 3. Trích xuất khối công thức toán dạng block: $$ ... $$
  cleaned = cleaned.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
    const id = `___MATH_BLOCK_${tokens.length}___`;
    tokens.push({ id, html: renderMathSegment(math.trim(), true) });
    return id;
  });

  // 4. Trích xuất công thức toán nội dòng dạng inline: $ ... $
  // Quy chuẩn: Không chứa ký tự $ bên trong, không có khoảng trắng sát viền $, không phải câu văn tiếng Việt
  cleaned = cleaned.replace(
    /(?<!\\)\$([^\s$](?:[^$\n]*?[^\s$])?)\$(?!\d)/g,
    (match, math) => {
      if (VIETNAMESE_ACCENT_REGEX.test(math)) {
        return match;
      }
      const id = `___MATH_INLINE_${tokens.length}___`;
      tokens.push({ id, html: renderMathSegment(math.trim(), false) });
      return id;
    }
  );

  // 5. Trích xuất các lệnh LaTeX đứng đơn lẻ ngoài dấu $ (ví dụ: \oplus, \pmod{...}, \equiv, \rightarrow)
  const standaloneLatexRegex =
    /(\\[a-zA-Z]+(?:\{[^}]*\}|\[[^\]]*\])*(?:\([^)]*\)|[a-zA-Z0-9_\^()+-]+)*)/g;
  cleaned = cleaned.replace(standaloneLatexRegex, (m) => {
    const id = `___MATH_STANDALONE_${tokens.length}___`;
    tokens.push({ id, html: renderMathSegment(m.trim(), false) });
    return id;
  });

  // 6. Hoàn nguyên tất cả các token toán học bằng mã KaTeX HTML
  for (const token of tokens) {
    cleaned = cleaned.replace(token.id, token.html);
  }

  return cleaned;
}

export default function MathText({ text, className = "", as = "span" }) {
  const htmlContent = useMemo(() => formatMathInHtml(text), [text]);
  const Component = as;

  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
