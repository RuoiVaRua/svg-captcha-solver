import unittest
from pathlib import Path
from svg_captcha_solver import SvgCaptchaSolver, solve_file

class TestSampleSvg(unittest.TestCase):
    def setUp(self):
        self.sample_path = Path(__file__).parent.parent / "sample.svg"
        self.solver = SvgCaptchaSolver()

    def test_solve_sample(self):
        result = self.solver.solve_file(self.sample_path)
        self.assertEqual(result, "GFB4P5")

    def test_analyze_sample(self):
        with open(self.sample_path, "r", encoding="utf-8") as f:
            content = f.read()
        res = self.solver.analyze(content)
        self.assertEqual(res.text, "GFB4P5")
        self.assertEqual(len(res.characters), 6)
        
        # Verify characters are sorted left-to-right
        for i in range(len(res.characters) - 1):
            self.assertLess(res.characters[i].bbox[0], res.characters[i+1].bbox[0])

    def test_convenience_function(self):
        result = solve_file(self.sample_path)
        self.assertEqual(result, "GFB4P5")

    def test_solve_demo(self):
        demo_path = Path(__file__).parent.parent / "demo.svg"
        if demo_path.exists():
            result = solve_file(demo_path)
            self.assertEqual(result, "W7GAHQ")

if __name__ == "__main__":
    unittest.main()
