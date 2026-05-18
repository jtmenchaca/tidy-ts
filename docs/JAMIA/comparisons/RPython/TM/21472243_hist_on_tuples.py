# ID: SO#21472243
# Language: Python
# Bug class: Value type
# Runtime consequence: Crash
# In study: Yes
# Inclusion rationale: plt.hist on object-dtype data fails reduce. Numeric operation on string/object data.
# Reproduction status: Fixed (matplotlib 3.x handles tuple arrays in hist)
# Type system catch: `number[]` required for histogram; `tuple[]` rejected

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

top_words_10 = [
    (" whitefield", 65299),
    (" bellandur", 57061),
    (" kundalahalli", 51769),
    (" marathahalli", 50639),
    (" electronic city", 44041),
    (" sarjapur road junction", 34164),
    (" indiranagar 2nd stage", 32459),
    (" malleswaram", 32171),
    (" yelahanka main road", 28901),
    (" domlur", 28869),
]

plt.hist(top_words_10, label="True")
