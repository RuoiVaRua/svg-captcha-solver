from setuptools import setup, find_packages

setup(
    name="svg-captcha-solver",
    version="1.0.0",
    description="High-performance SVG CAPTCHA solver using vector path analysis",
    author="hungvp",
    packages=find_packages(),
    python_requires=">=3.8",
    entry_points={
        "console_scripts": [
            "svg-captcha-solver=cli:main",
        ],
    },
)
