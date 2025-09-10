#!/usr/bin/env python3
# Simple favicon.ico creator
# This creates a minimal ICO file structure

import struct
import base64

# Create a simple 16x16 favicon data (simplified approach)
def create_favicon():
    # ICO file header
    ico_header = struct.pack('<HHH', 0, 1, 1)  # reserved, type, count
    
    # ICO directory entry for 16x16
    dir_entry = struct.pack('<BBBBHHII', 
        16, 16,     # width, height
        0, 0,       # colors, reserved  
        1, 32,      # planes, bits per pixel
        0,          # size (will be calculated)
        22          # offset to image data
    )
    
    # Simple bitmap data for 16x16 (blue circle with white mouse)
    # This is a very simplified approach - for production use PIL or similar
    bitmap_data = b'\x42\x4d\x40\x01\x00\x00\x00\x00\x00\x00\x36\x00\x00\x00\x28\x00\x00\x00\x10\x00\x00\x00\x10\x00\x00\x00\x01\x00\x18\x00\x00\x00\x00\x00\x0a\x01\x00\x00\x13\x0b\x00\x00\x13\x0b\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
    
    # Update size in directory entry
    dir_entry_with_size = struct.pack('<BBBBHHII', 
        16, 16, 0, 0, 1, 32, 
        len(bitmap_data), 22
    )
    
    return ico_header + dir_entry_with_size + bitmap_data

# Write favicon.ico
with open('favicon.ico', 'wb') as f:
    f.write(create_favicon())

print("favicon.ico created")