# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]: SOME TESTS FAILED
  - generic [ref=e3]:
    - heading "Test Details:" [level=3] [ref=e4]
    - list [ref=e5]:
      - listitem [ref=e6]:
        - strong [ref=e7]: "Basic Import:"
        - text: âœ… PASS - createDataFrame and stats imported
      - listitem [ref=e8]:
        - strong [ref=e9]: "DataFrame Creation:"
        - text: âœ… PASS - DataFrame with 2 rows created
      - listitem [ref=e10]:
        - strong [ref=e11]: "Basic Stats:"
        - text: âœ… PASS - sum(df.a) = 4
      - listitem [ref=e12]:
        - strong [ref=e13]: "Normal Distribution Data:"
        - text: "â\x9dŒ FAIL - Error: The URL must be of scheme file"
```