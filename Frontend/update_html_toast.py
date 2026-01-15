import os

directory = r'c:\Users\Asus\Desktop\AgriGo\Frontend'
css_link = '<link rel="stylesheet" href="css/toast.css">'
js_script = '<script src="js/toast.js"></script>'

for filename in os.listdir(directory):
    if filename.endswith(".html") and filename != "farmer-dashboard.html":
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        updated = False
        
        # Inject CSS
        if 'css/toast.css' not in content:
            if 'css/style.css"' in content:
                content = content.replace('css/style.css">', 'css/style.css">\n    ' + css_link)
                updated = True
            elif '</head>' in content:
                content = content.replace('</head>', '    ' + css_link + '\n</head>')
                updated = True
                
        # Inject JS
        if 'js/toast.js' not in content:
            if '</body>' in content:
                content = content.replace('</body>', '    ' + js_script + '\n</body>')
                updated = True
                
        if updated:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {filename}")
        else:
            print(f"Skipped {filename} (already updated or pattern not found)")
