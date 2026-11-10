# SVG CAPTCHA Solver

Thư viện Python hiệu năng cao giúp phân tích toạ độ vector và giải mã tự động các mã CAPTCHA dạng SVG (đặc biệt là CAPTCHA được tạo bởi các thư viện Node.js như `svg-captcha`, `@depup/svg-captcha` v.v.).

## 🚀 Đặc điểm nổi bật

- **Tốc độ cực nhanh**: ~0.9ms cho mỗi ảnh CAPTCHA (hơn 1.000 ảnh/giây).
- **Zero-Dependency**: Chỉ sử dụng thư viện chuẩn của Python (`xml.etree`, `re`, `json`, `difflib`), không cần cài C-libraries, Tesseract, OpenCV hay PyTorch.
- **Độ chính xác cao (100% với font chuẩn)**: Nhận dạng chính xác toàn bộ 62 ký tự (`0-9`, `a-z`, `A-Z`) dựa trên "vân tay" của chuỗi lệnh SVG path (`M`, `L`, `Q`, `Z`).
- **Tự động lọc nhiễu**: Nhận biết và loại bỏ các đường gạch nhiễu (`noise lines`) và thẻ hình nền (`rect`).
- **Tính toán Bounding Box chính xác**: Tự động sắp xếp các ký tự theo trục X từ trái qua phải, khắc phục triệt để lỗi khi các thẻ `<path>` bị tráo đổi thứ tự trong file SVG.
- **Hỗ trợ CLI**: Có sẵn công cụ dòng lệnh tiện lợi cho việc xử lý đơn lẻ hoặc hàng loạt.

---

## 🛠 Cài đặt & Yêu cầu

Yêu cầu Python >= 3.8.

```bash
cd /Users/hungvp/code/analysis-svg
pip install -e .
```

---

## 💡 Hướng dẫn sử dụng

### 1. Dùng như thư viện Python

#### Giải nhanh chuỗi SVG hoặc file:
```python
from svg_captcha_solver import solve, solve_file

# Cách 1: Giải từ file
text = solve_file("sample.svg")
print("Kết quả:", text)  # Output: GFB4P5

# Cách 2: Giải từ chuỗi SVG
svg_xml = '<svg xmlns="http://www.w3.org/2000/svg">...</svg>'
text = solve(svg_xml)
print("Kết quả:", text)
```

#### Phân tích chi tiết (tọa độ, tỉ lệ, độ tin cậy từng ký tự):
```python
from svg_captcha_solver import SvgCaptchaSolver

solver = SvgCaptchaSolver()
result = solver.analyze(svg_xml)

print(f"Toàn bộ văn bản: {result.text}")
for idx, char_info in enumerate(result.characters):
    print(f"Ký tự {idx + 1}: {char_info.char}")
    print(f"  Độ tin cậy: {char_info.confidence}")
    print(f"  Tọa độ [min_x, max_x, min_y, max_y]: {char_info.bbox}")
    print(f"  Độ dài chuỗi lệnh vector: {len(char_info.pattern)}")
```

---

### 2. Sử dụng qua dòng lệnh (CLI)

#### Giải một file đơn lẻ:
```bash
python3 cli.py sample.svg
# Output:
# Captcha Result: GFB4P5
```

#### Hiển thị thông tin phân tích chi tiết:
```bash
python3 cli.py sample.svg --detail
```
Output:
```text
Captcha Result: GFB4P5
--------------------------------------------------
  Character 1: 'G' (Confidence: 100.0%)
    Bounding Box: X=[14.13, 38.90], Y=[11.10, 37.90]
    Path Pattern: MLLQLLQLLQLLLQLLQLLQLLQLLLQLLQLLQLL... (length=209)
  Character 2: 'F' (Confidence: 100.0%)
    Bounding Box: X=[45.20, 65.15], Y=[8.44, 39.09]
    Path Pattern: MLLQLLQLLQLLLQLLQLLQLLQLLQLLQLLQLLQ... (length=113)
  Character 3: 'B' (Confidence: 100.0%)
    Bounding Box: X=[72.81, 93.41], Y=[8.45, 39.13]
    Path Pattern: MLLQLLQLLQLLQLLQLLQLLQLLQLLQZMLLQLL... (length=200)
  Character 4: '4' (Confidence: 100.0%)
    Bounding Box: X=[102.02, 120.88], Y=[10.65, 38.61]
    Path Pattern: MLLQLLQLLQLLQZMLLQLLQLLQLLQLLQLLQLL... (length=140)
  Character 5: 'P' (Confidence: 100.0%)
    Bounding Box: X=[130.18, 149.23], Y=[8.47, 39.11]
    Path Pattern: MLLQLLQLLLQLLQLLQLLQZMLLQLLQLLQLLQL... (length=128)
  Character 6: '5' (Confidence: 100.0%)
    Bounding Box: X=[158.63, 177.72], Y=[10.46, 37.69]
    Path Pattern: MLLQLLQLLQLLQLLQLLQLLQLLLLQLLQLLQLL... (length=168)
--------------------------------------------------
```

#### Xuất kết quả dưới định dạng JSON:
```bash
python3 cli.py sample.svg --json
```

#### Giải toàn bộ thư mục chứa các file `.svg`:
```bash
python3 cli.py tests/generated/
```

---

## 🧪 Chạy Kiểm thử (Tests)

Chạy toàn bộ test suites (bao gồm test mẫu của bạn và 50 captcha ngẫu nhiên):
```bash
python3 -m unittest discover -s tests
```

---

## 🔬 Nguyên lý hoạt động

1. **Phân tích Path**:
   `svg-captcha` sử dụng thư viện `opentype.js` để render các ký tự từ font `Comismsh.ttf`. Font này định nghĩa mỗi nét vẽ bằng chuỗi đường cong Bézier bậc 2 (Quadratic Bezier `Q`) và đoạn thẳng (`L`). Dù thư viện thêm rung lắc ngẫu nhiên ($\pm 0.1$ px) vào tọa độ số, **dãy lệnh (ví dụ `MLLQLLQ...Z`) của mỗi ký tự là bất biến và duy nhất**.
2. **Lọc nhiễu**:
   Các đường nhiễu (noise lines) được sinh bằng đường cong Bézier bậc 3 (`C`), có `stroke` nhưng `fill="none"` và không chứa lệnh đóng nét `Z`. Bộ lọc sẽ tự động phát hiện và bỏ qua chúng.
3. **Phân biệt `I` và `l`**:
   Trong font `Comismsh.ttf`, ký tự `I` (chữ i hoa) và `l` (chữ l thường) có cùng chuỗi lệnh. Bộ giải tính toán tỷ lệ khung hình (Aspect Ratio = Width / Height): tỷ lệ của `I` (~0.231) lớn hơn `l` (~0.220) để tự động phân biệt chuẩn xác.
4. **Fuzzy Matching**:
   Nếu gặp một biến thể đường cong chưa từng xuất hiện (do font khác hoặc điều chỉnh nhẹ), giải thuật so khớp chuỗi Levenshtein/Ratcliff-Obershelp sẽ tìm ký tự có độ tương đồng cấu trúc cao nhất.
