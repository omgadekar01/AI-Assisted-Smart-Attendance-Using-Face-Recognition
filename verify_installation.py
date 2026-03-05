#!/usr/bin/env python3
"""
Quick verification script for the Smart Attendance System
Run this to check all files are in place
"""

import os
import sys

def verify_installation():
    """Verify all required files are present"""
    
    required_files = {
        'index.html': 'Main HTML UI',
        'main.js': 'Core attendance system',
        'ai-attendance.js': 'AI engine and assistant',
        'style.css': 'Styling and layout',
        'README.md': 'Complete documentation',
        'QUICK_START.md': 'Quick launch guide',
        'TECHNICAL_DOCS.md': 'Technical documentation',
        'IMPLEMENTATION_SUMMARY.md': 'Implementation summary'
    }
    
    print("=" * 60)
    print("🎯 SMART ATTENDANCE SYSTEM - VERIFICATION")
    print("=" * 60)
    print()
    
    all_present = True
    total_size = 0
    
    for filename, description in required_files.items():
        filepath = os.path.join(os.path.dirname(__file__), filename)
        
        if os.path.exists(filepath):
            size = os.path.getsize(filepath)
            total_size += size
            size_kb = size / 1024
            status = "✅"
            print(f"{status} {filename:30} ({size_kb:7.1f}KB) - {description}")
        else:
            status = "❌"
            print(f"{status} {filename:30} {'':11} - MISSING!")
            all_present = False
    
    print()
    print("=" * 60)
    print(f"Total Size: {total_size / (1024*1024):.2f}MB")
    print(f"Files: {len([f for f in required_files if os.path.exists(os.path.join(os.path.dirname(__file__), f))])}/{len(required_files)}")
    
    if all_present:
        print("Status: ✅ ALL FILES PRESENT - READY TO USE!")
    else:
        print("Status: ❌ SOME FILES MISSING - CHECK ABOVE")
    
    print("=" * 60)
    print()
    print("🚀 TO LAUNCH:")
    print("  Option 1: Open index.html in your browser")
    print("  Option 2: python -m http.server 8000 (then http://localhost:8000)")
    print("  Option 3: Use any web server to serve these files")
    print()
    print("📚 DOCUMENTATION:")
    print("  - README.md - Full feature guide")
    print("  - QUICK_START.md - Quick setup guide")
    print("  - TECHNICAL_DOCS.md - Technical details")
    print("  - IMPLEMENTATION_SUMMARY.md - What's new")
    print()
    print("=" * 60)
    
    return all_present

if __name__ == '__main__':
    result = verify_installation()
    sys.exit(0 if result else 1)
