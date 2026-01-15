import os
import re

directory = r'c:\Users\Asus\Desktop\AgriGo\Frontend\js'
skip_files = ['toast.js', 'farmer-dashboard.js', 'charts.js']

def replace_alert_match(match):
    full_match = match.group(0) # e.g. alert("Hello")
    args = match.group(1)       # e.g. "Hello"
    
    # Simple heuristic to determine type
    lower_args = args.lower()
    
    # Check for Error keywords
    if any(x in lower_args for x in ['error', 'fail', 'wrong', 'invalid', 'denied', 'required', 'please enter', 'not found']):
        return f'Toast.error({args})'
    
    # Check for Success keywords
    elif any(x in lower_args for x in ['success', 'done', 'completed', 'saved', 'added', 'cart']):
        return f'Toast.success({args})'
        
    # Default to Info
    else:
        return f'Toast.info({args})'

for filename in os.listdir(directory):
    if filename.endswith(".js") and filename not in skip_files:
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Regex to find alert(...) calls. 
        # Handles simple cases. balancing parentheses is hard with regex, 
        # but for simple strings it works.
        # We look for alert followed by ( then anything non-greedy then )
        # We also handle window.alert
        
        # Pattern: (window\.)?alert\s*\((.*?)\)
        # Using DOTALL to handle multiline alerts if any
        new_content = re.sub(r'(?:window\.)?alert\s*\((.*?)\)', replace_alert_match, content, flags=re.DOTALL)
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filename}")
        else:
            print(f"No alerts found in {filename}")
