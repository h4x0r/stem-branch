#!/usr/bin/env python3
"""
Restructure the LaTeX paper for progressive disclosure.

Major moves:
1. SYSTEMS (§5, L728-1718) → new §2 (before errors)
2. DST (L2334-2483) → appended to ERRORS block
3. VALIDATION (§4, L410-727) → moved after COMP_AUTH
4. Section headers updated for new numbering

Preserves all content, \label{}, \ref{}, \cite{} references.
LaTeX auto-renumbers sections; \label/\ref resolve automatically.
"""

import sys

INPUT = "/Users/4n6h4x0r/src/stem-branch/docs/research/why-your-chinese-metaphysics-app-gives-wrong-results.tex"
OUTPUT = INPUT  # overwrite in place

with open(INPUT, "r") as f:
    lines = f.readlines()

# Define blocks by 1-indexed line ranges (inclusive)
# Convert to 0-indexed for slicing
def block(start, end):
    return lines[start-1:end]

PREAMBLE      = block(1, 59)      # packages, macros
TITLE          = block(60, 64)     # \title{...} — will be replaced
AUTHOR_DATE    = block(66, 69)     # \author, \affil, \date
DOC_START      = block(71, 123)    # \begin{document} through footnote
# L124 is just a separator comment

INTRO          = block(125, 186)   # §1 Introduction
BACKGROUND     = block(188, 223)   # §2 Background
ERRORS_HEADER  = block(224, 228)   # §3 header + intro text
ERROR_1        = block(229, 243)   # Year Boundary
ERROR_2        = block(244, 251)   # Apparent vs Geometric
ERROR_3        = block(252, 324)   # Ephemeris Truncation
ERROR_4        = block(325, 346)   # True Solar Time
ERROR_5        = block(347, 370)   # ΔT
ERROR_6        = block(371, 387)   # 2033 Intercalary
ERROR_7        = block(388, 409)   # Day Boundary
VALIDATION     = block(410, 727)   # §4 Statistical Validation (full)
SYSTEMS        = block(728, 1718)  # §5 Astronomical Dependencies (full)
HIST_UNCERT    = block(1719, 1797) # §6 Historical Uncertainty
REF_LONG       = block(1798, 2333) # §7 Reference Longitude (without DST)
DST            = block(2334, 2483) # DST subsection from §7
COMP_AUTH      = block(2484, 2692) # §8 Competing Calendar Authorities
DISCUSSION     = block(2693, 2722) # §9 Discussion
CONCLUSION     = block(2723, 2792) # §10 Conclusion + Data Avail + Ack
BIBLIOGRAPHY   = block(2793, 3323) # \begin{sloppypar} + Bibliography + \end{document}

# Separator
SEP = ["% =============================================================================\n"]

# Assemble in new order:
# §1 Introduction (rewrite later via Edit)
# §2 The Five Systems (old §5)
# §3 Computational Errors (old §3 errors + DST from §7)
# §4 Reference Frames (old §7 minus DST)
# §5 Historical Uncertainty (old §6)
# §6 Competing Calendar Authorities (old §8)
# §7 Computational Precision (old §2 Background — pipeline details)
# §8 Statistical Validation (old §4)
# §9 Discussion (old §9)
# §10 Conclusion (old §10)

output = []
output.extend(PREAMBLE)
output.append("\n")
output.extend(TITLE)  # will be replaced via Edit
output.append("\n")
output.extend(AUTHOR_DATE)
output.append("\n")
output.extend(DOC_START)
output.append("\n")
output.extend(SEP)
output.extend(INTRO)  # §1 — will be rewritten via Edit
output.append("\n")
output.extend(SEP)
# §2: The Five Systems (was §5)
output.extend(SYSTEMS)
output.append("\n")
output.extend(SEP)
# §3: Errors + DST
output.extend(ERRORS_HEADER)
# Reorder errors: DST first (most accessible), then solar time, day boundary, year boundary
output.extend(DST)       # DST first
output.extend(ERROR_4)   # True Solar Time
output.extend(ERROR_7)   # Day Boundary
output.extend(ERROR_1)   # Year Boundary
output.extend(ERROR_6)   # 2033 Intercalary
output.extend(ERROR_2)   # Apparent vs Geometric
output.extend(ERROR_3)   # Ephemeris Truncation
output.extend(ERROR_5)   # ΔT
output.append("\n")
output.extend(SEP)
# §4: Reference Frames (was §7 minus DST)
output.extend(REF_LONG)
output.append("\n")
output.extend(SEP)
# §5: Historical Uncertainty (was §6)
output.extend(HIST_UNCERT)
output.append("\n")
output.extend(SEP)
# §6: Competing Calendar Authorities (was §8)
output.extend(COMP_AUTH)
output.append("\n")
output.extend(SEP)
# §7: Background/Pipeline (was §2 — technical details)
output.extend(BACKGROUND)
output.append("\n")
output.extend(SEP)
# §8: Statistical Validation (was §4)
output.extend(VALIDATION)
output.append("\n")
output.extend(SEP)
# §9: Discussion
output.extend(DISCUSSION)
output.append("\n")
output.extend(SEP)
# §10: Conclusion
output.extend(CONCLUSION)
output.append("\n")
output.extend(SEP)
output.extend(BIBLIOGRAPHY)

with open(OUTPUT, "w") as f:
    f.writelines(output)

# Verify line counts
original_content_lines = len(lines)
new_content_lines = len(output)
print(f"Original: {original_content_lines} lines")
print(f"New:      {new_content_lines} lines")
print(f"Diff:     {new_content_lines - original_content_lines} (separators added)")
print("Restructure complete.")
