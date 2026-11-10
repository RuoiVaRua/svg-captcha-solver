import json
import unittest
from pathlib import Path
from svg_captcha_solver import SvgCaptchaSolver

class TestGeneratedCaptchas(unittest.TestCase):
    def setUp(self):
        self.test_dir = Path(__file__).parent / "generated"
        self.solver = SvgCaptchaSolver()

    def test_solve_generated_captchas(self):
        manifest_file = self.test_dir / "manifest.json"
        if not manifest_file.exists():
            self.skipTest("No generated captchas found")

        with open(manifest_file, "r") as f:
            cases = json.load(f)

        correct = 0
        total = len(cases)

        for case in cases:
            file_path = self.test_dir / case["file"]
            expected = case["text"]
            actual = self.solver.solve_file(file_path)
            self.assertEqual(
                actual,
                expected,
                f"Failed for {case['file']}: expected '{expected}', got '{actual}'"
            )
            correct += 1

        print(f"\nTested {total} generated captchas. Accuracy: {correct / total * 100:.1f}%")

if __name__ == "__main__":
    unittest.main()
