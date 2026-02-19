#!/usr/bin/env python3
"""
Comprehensive test runner for the Tracking App.
Runs backend, frontend, and E2E tests autonomously.

Usage:
    python run_tests.py [--backend] [--frontend] [--e2e] [--all]
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path

# Get project root directory
PROJECT_ROOT = Path(__file__).parent.absolute()
BACKEND_DIR = PROJECT_ROOT / "backend"
FRONTEND_DIR = PROJECT_ROOT / "frontend"
TESTS_DIR = PROJECT_ROOT / "tests"

def run_command(cmd, cwd=None, check=True):
    """Run a shell command and return the result."""
    print(f"\n{'='*80}")
    print(f"Running: {' '.join(cmd)}")
    print(f"Directory: {cwd or PROJECT_ROOT}")
    print(f"{'='*80}\n")
    
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            check=check,
            capture_output=False,
            text=True
        )
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"Error: Command failed with exit code {e.returncode}")
        return False
    except FileNotFoundError:
        print(f"Error: Command not found: {cmd[0]}")
        return False

def check_dependencies():
    """Check if required dependencies are available."""
    issues = []
    
    # Check Python
    try:
        python_version = subprocess.check_output(
            [sys.executable, "--version"],
            stderr=subprocess.STDOUT,
            text=True
        ).strip()
        print(f"[OK] Python: {python_version}")
    except:
        issues.append("Python not found")
    
    # Check Node.js
    try:
        node_version = subprocess.check_output(
            ["node", "--version"],
            stderr=subprocess.STDOUT,
            text=True
        ).strip()
        print(f"[OK] Node.js: {node_version}")
    except:
        issues.append("Node.js not found")
    
    # Check npm
    try:
        npm_version = subprocess.check_output(
            ["npm", "--version"],
            stderr=subprocess.STDOUT,
            text=True
        ).strip()
        print(f"[OK] npm: {npm_version}")
    except:
        issues.append("npm not found")
    
    if issues:
        print(f"\n[WARNING] Missing dependencies: {', '.join(issues)}")
        print("Some tests may fail. Please install missing dependencies.")
        return False
    
    return True

def run_backend_tests():
    """Run Django backend tests."""
    print("\n" + "="*80)
    print("RUNNING BACKEND TESTS")
    print("="*80 + "\n")
    
    # Check if we're in the right directory structure
    if not (BACKEND_DIR / "manage.py").exists():
        print(f"Error: manage.py not found in {BACKEND_DIR}")
        return False
    
    # Check for virtual environment
    venv_python = None
    if (BACKEND_DIR / "venv" / "Scripts" / "python.exe").exists():
        venv_python = str(BACKEND_DIR / "venv" / "Scripts" / "python.exe")
    elif (BACKEND_DIR / "venv" / "bin" / "python").exists():
        venv_python = str(BACKEND_DIR / "venv" / "bin" / "python")
    
    python_cmd = venv_python or sys.executable
    
    # Run Django tests
    # Django's test discovery will find tests in:
    # 1. apps/*/tests.py (standard location)
    # 2. tests/backend/ (if properly configured)
    
    # First, run tests from standard app locations
    test_paths = [
        "apps.authentication.tests",
        "apps.users.tests",
        "apps.foods.tests",
        "apps.workouts.tests",
        "apps.openai_service.tests",
    ]
    
    # Try running tests from backend directory
    success = True
    failures = []
    
    for test_path in test_paths:
        cmd = [python_cmd, "manage.py", "test", test_path, "--verbosity=1", "--keepdb"]
        if not run_command(cmd, cwd=BACKEND_DIR, check=False):
            failures.append(test_path)
            success = False
    
    # Try to run tests from tests/backend/ if they exist
    # These need to be run with proper Python path
    tests_backend_dir = TESTS_DIR / "backend"
    if tests_backend_dir.exists():
        # Add tests directory to Python path and run tests
        import subprocess
        env = os.environ.copy()
        env['PYTHONPATH'] = str(PROJECT_ROOT) + os.pathsep + env.get('PYTHONPATH', '')
        
        # Try running tests from tests/backend/ as modules
        test_files = list(tests_backend_dir.glob("test_*.py"))
        for test_file in test_files:
            module_name = f"tests.backend.{test_file.stem}"
            cmd = [python_cmd, "manage.py", "test", module_name, "--verbosity=1"]
            result = subprocess.run(
                cmd,
                cwd=BACKEND_DIR,
                env=env,
                capture_output=False,
                text=True
            )
            if result.returncode != 0:
                failures.append(module_name)
                success = False
    
    # Run all tests together as final check
    print("\nRunning all backend tests together...")
    cmd = [python_cmd, "manage.py", "test", "--verbosity=1"]
    final_result = run_command(cmd, cwd=BACKEND_DIR, check=False)
    
    if failures:
        print(f"\n[WARNING] Some test modules had failures: {', '.join(failures)}")
    
    return final_result and success

def run_frontend_tests():
    """Run React frontend tests."""
    print("\n" + "="*80)
    print("RUNNING FRONTEND TESTS")
    print("="*80 + "\n")
    
    if not (FRONTEND_DIR / "package.json").exists():
        print(f"Error: package.json not found in {FRONTEND_DIR}")
        return False
    
    # Install dependencies if node_modules doesn't exist
    if not (FRONTEND_DIR / "node_modules").exists():
        print("Installing frontend dependencies...")
        if not run_command(["npm", "install"], cwd=FRONTEND_DIR, check=False):
            print("Warning: npm install failed, continuing anyway...")
    
    # Run Jest tests in CI mode (non-interactive)
    cmd = ["npm", "test", "--", "--watchAll=false", "--ci"]
    return run_command(cmd, cwd=FRONTEND_DIR, check=False)

def run_e2e_tests():
    """Run Playwright E2E tests."""
    print("\n" + "="*80)
    print("RUNNING E2E TESTS")
    print("="*80 + "\n")
    
    # Check if Playwright is installed
    if not (PROJECT_ROOT / "node_modules" / "@playwright").exists():
        print("Installing Playwright...")
        if not run_command(["npm", "install"], cwd=PROJECT_ROOT, check=False):
            print("Warning: npm install failed")
        
        print("Installing Playwright browsers...")
        if not run_command(["npx", "playwright", "install"], cwd=PROJECT_ROOT, check=False):
            print("Warning: Playwright browser installation failed")
    
    # Run Playwright tests
    # Note: Playwright config should handle starting servers
    cmd = ["npx", "playwright", "test", "--reporter=list"]
    return run_command(cmd, cwd=PROJECT_ROOT, check=False)

def main():
    parser = argparse.ArgumentParser(description="Run tests for Tracking App")
    parser.add_argument("--backend", action="store_true", help="Run backend tests only")
    parser.add_argument("--frontend", action="store_true", help="Run frontend tests only")
    parser.add_argument("--e2e", action="store_true", help="Run E2E tests only")
    parser.add_argument("--all", action="store_true", help="Run all tests")
    parser.add_argument("--check-deps", action="store_true", help="Check dependencies only")
    
    args = parser.parse_args()
    
    # Check dependencies
    deps_ok = check_dependencies()
    if args.check_deps:
        sys.exit(0 if deps_ok else 1)
    
    if not deps_ok:
        print("\n[WARNING] Continuing despite missing dependencies...\n")
    
    # Determine what to run
    run_all = args.all or (not args.backend and not args.frontend and not args.e2e)
    
    results = {}
    
    if run_all or args.backend:
        results['backend'] = run_backend_tests()
    
    if run_all or args.frontend:
        results['frontend'] = run_frontend_tests()
    
    if run_all or args.e2e:
        results['e2e'] = run_e2e_tests()
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    for test_type, success in results.items():
        status = "[PASSED]" if success else "[FAILED]"
        print(f"{test_type.upper():15} {status}")
    print("="*80 + "\n")
    
    # Exit with appropriate code
    all_passed = all(results.values()) if results else False
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()


