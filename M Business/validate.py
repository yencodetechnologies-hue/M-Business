def validate_jsx(text):
    stack = []
    lines = text.split('\n')
    for i, line in enumerate(lines):
        idx = 0
        while idx < len(line):
            if line[idx:idx+2] == '</':
                end = line.find('>', idx)
                tag = line[idx+2:end].strip()
                if tag in ['div', 'span', '>', 'button', 'h1', 'h2', 'h3', 'p', 'tr', 'td', 'th', 'tbody', 'thead', 'table', 'i', 'a', 'h4']:
                    if stack and stack[-1][0] == tag:
                        stack.pop()
                    elif tag == '>': # </>
                        if stack and stack[-1][0] == '<>':
                            stack.pop()
                        else:
                            print(f"Error at {i+1}: expected {stack[-1][0]} but found </>")
                    else:
                        print(f"Error at {i+1}: expected {stack[-1][0]} but found </{tag}>")
                idx = end + 1
            elif line[idx:idx+1] == '<':
                if line[idx:idx+2] == '<>':
                    stack.append(('<>', i+1))
                    idx += 2
                    continue
                end = line.find('>', idx)
                space = line.find(' ', idx)
                end_tag = end if space == -1 else min(end, space)
                tag = line[idx+1:end_tag].strip()
                if tag in ['div', 'span', 'button', 'h1', 'h2', 'h3', 'p', 'tr', 'td', 'th', 'tbody', 'thead', 'table', 'i', 'a', 'h4']:
                    if line[end-1] != '/': # self closing
                        stack.append((tag, i+1))
                idx = end + 1
            else:
                idx += 1
    if stack:
        print("Unclosed tags:", stack)

with open('C:\\M Business\\M Business\\src\\components\\MySubscriptions.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Just a very simple heuristic to find unclosed div. It might be fooled by strings.
validate_jsx(text)
