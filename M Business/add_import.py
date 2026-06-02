import re
with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

if "DashboardModern.css" not in text:
    text = text.replace('import { CSSTransition, TransitionGroup } from "react-transition-group";', 
                        'import { CSSTransition, TransitionGroup } from "react-transition-group";\nimport "./DashboardModern.css";')
    with open(r"C:\M Business\M Business\src\components\SubAdminDashboard.jsx", "w", encoding="utf-8") as f:
        f.write(text)
    print("Added import")
