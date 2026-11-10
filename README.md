# SVG CAPTCHA Solver

Thư viện hiệu năng cao (hỗ trợ cả **Python** và **Node.js/npm**) giúp phân tích toạ độ vector và giải mã tự động các mã CAPTCHA dạng SVG (đặc biệt là CAPTCHA được tạo bởi các thư viện như `svg-captcha`, `@depup/svg-captcha` v.v.).

## 🚀 Đặc điểm nổi bật

- **Tốc độ cực nhanh**: ~0.26ms trên Node.js và ~0.8ms trên Python cho mỗi ảnh CAPTCHA (> 1.200 - 3.800 ảnh/giây).
- **Zero-Dependency**: 
  - Python: Chỉ dùng thư viện chuẩn (`xml.etree`, `re`, `difflib`).
  - Node.js: Chỉ dùng thư viện chuẩn (`fs`, `path`).
  - Không cần cài Tesseract, OpenCV, canvas hay PyTorch.
- **Độ chính xác tuyệt đối (100% với font chuẩn)**: Nhận dạng toàn bộ 62 ký tự (`0-9`, `a-z`, `A-Z`) dựa trên "vân tay" của chuỗi lệnh SVG path (`M`, `L`, `Q`, `Z`).
- **Tự động lọc nhiễu**: Nhận biết và loại bỏ các đường gạch nhiễu (`noise lines`) và các thẻ phụ (`rect`, `circle`).
- **Phân biệt chuẩn xác `I` và `l`**: Tự động phân tích tỉ lệ khung hình (aspect ratio) để phân biệt giữa chữ `I` in hoa và chữ `l` thường.
- **Tính toán Bounding Box chính xác**: Tự động sắp xếp các ký tự theo trục X từ trái qua phải, giải quyết triệt để vấn đề các thẻ `<path>` bị tráo đổi thứ tự trong file SVG.
- **Hỗ trợ đầy đủ TypeScript, ESM & CommonJS**: Có sẵn file định nghĩa kiểu `.d.ts`.
- **Hỗ trợ CLI**: Có sẵn công cụ dòng lệnh tiện lợi cho cả Python (`svg-captcha-solver` / `python3 cli.py`) và Node.js (`npx svg-captcha-solver`).

---

## 📦 Cài đặt

### Python
Cài đặt trực tiếp từ thư mục mã nguồn:
```bash
pip install .
```
Hoặc cài ở chế độ editable (dành cho phát triển):
```bash
pip install -e .
```

### Node.js / NPM
Cài đặt từ thư mục mã nguồn hoặc thông qua git/npm:
```bash
npm install .
# Hoặc liên kết cục bộ:
npm link
```

---

## 💡 Hướng dẫn sử dụng

### 1. Dùng trong Python

#### Giải nhanh chuỗi SVG hoặc file:
```python
from svg_captcha_solver import solve, solve_file

# Cách 1: Giải từ file
text = solve_file("sample.svg")
print("Kết quả:", text)  # Output: GFB4P5

# Cách 2: Giải từ chuỗi SVG
with open("sample.svg", "r", encoding="utf-8") as f:
    svg_content = f.read()

text = solve(svg_content)
print("Kết quả:", text)
```

#### Phân tích chi tiết (tọa độ, tỉ lệ, độ tin cậy từng ký tự):
```python
from svg_captcha_solver import SvgCaptchaSolver

solver = SvgCaptchaSolver()
result = solver.analyze(svg_content)

print(f"Văn bản nhận diện: {result.text}")
for idx, char_info in enumerate(result.characters):
    print(f"Ký tự {idx + 1}: '{char_info.char}' (Độ tin cậy: {char_info.confidence * 100:.1f}%)")
    print(f"  Tọa độ [min_x, max_x, min_y, max_y]: {char_info.bbox}")
```

---

### 2. Dùng trong Node.js (CommonJS, ESM & TypeScript)

#### CommonJS:
```javascript
const { solve, solveFile, analyze } = require('svg-captcha-solver');

// Giải từ file:
const text = solveFile('sample.svg');
console.log('Kết quả:', text); // GFB4P5

// Giải từ chuỗi SVG:
const fs = require('fs');
const svg = fs.readFileSync('sample.svg', 'utf8');
console.log('Kết quả:', solve(svg));
```

#### ES Module / TypeScript:
```typescript
import { solve, solveFile, analyze, SvgCaptchaSolver } from 'svg-captcha-solver';

const text = solveFile('sample.svg');
console.log('Captcha:', text);

// Lấy thông tin phân tích chi tiết
const result = analyze(svgContent);
console.log(result.characters);
```

---

### 3. Sử dụng qua dòng lệnh (CLI)

#### Python CLI:
```bash
# Giải 1 file
python3 cli.py sample.svg

# Xem chi tiết tọa độ và pattern
python3 cli.py sample.svg --detail

# Xuất dạng JSON
python3 cli.py sample.svg --json

# Giải toàn bộ thư mục
python3 cli.py tests/generated/
```

#### Node.js CLI:
```bash
# Sử dụng trực tiếp với npx hoặc node
node bin/cli.js sample.svg

# Nếu đã cài global hoặc link qua npm:
svg-captcha-solver sample.svg --detail
svg-captcha-solver sample.svg --json
svg-captcha-solver tests/generated/
```

---

## 🧪 Chạy Kiểm thử (Tests)

### Python Tests:
```bash
python3 -m unittest discover -s tests
```

### Node.js Tests:
```bash
npm test
# hoặc
node tests/test.js
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

## 📄 License

MIT
