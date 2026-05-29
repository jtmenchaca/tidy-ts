# Why 78 of 164 Bugs Were Included

The external validation in this study draws from a published collection of 164 real-world data-analysis bugs from StackOverflow, curated by an independent research group ([RPython, ESEC/FSE 2023](https://arxiv.org/abs/2306.08632)). Each bug was originally labeled by that group as a "Type Mismatch" — its root cause involved one data type being used where another was expected.

Of those 164 bugs, **78 were included** in this study and **86 were excluded**. This document explains why.

## Inclusion criteria

A bug was included if all four of the following were true:

1. It arose during tabular data work — loading, joining, summarizing, filtering, mutating, or otherwise transforming a dataset.
2. The original failure was either silent (produced wrong output with no error) or stopped the program with an error whose root cause was non-obvious.
3. It was systematic — the kind of bug that would recur on any dataset meeting the condition, not a one-off tied to a specific library version, file encoding, or operating system.
4. The underlying operation has a direct equivalent in all three of the compared languages (TypeScript, Python/pandas, R/tidyverse). A bug specific to NumPy memory layout, R metaprogramming, or a particular cloud library has no equivalent operation to translate.

These four criteria were defined before any bug was tested in Tidy-TS. Each bug was classified once against the criteria; classification did not change based on whether or how Tidy-TS handled the bug.

## Why bugs were excluded

The 86 excluded bugs fell into five categories. Each category reflects a property of the *original* bug, such as what library it occurred in, what operation failed, or what kind of code surrounded it, and not a property of how Tidy-TS would have responded. Exclusion decisions were based on whether the original bug could be represented as an equivalent tabular data analysis operation in Tidy-TS, pandas, and tidyverse, not on whether Tidy-TS detected the bug. The categories are mutually exclusive. Each bug was assigned a single primary exclusion reason.

| Category | n (%) | What this category means | Example |
|---|---:|---|---|
| Not a tabular data operation | 29 (34%) | The bug did not occur while working with a table of data. It involved raw numerical arrays, list indexing, or similar low-level operations that sit underneath a data analysis but are not part of one. | A program passes a list of paired values to a function that expects a flat list of numbers, and the conversion fails. |
| Wrong function or wrong arguments | 17 (20%) | The user called the wrong function or passed arguments in the wrong shape. The data itself was fine, the instruction to the library was not. | The user asks for value counts on an entire table when the function only accepts a single column. |
| Outside a tabular data library | 16 (19%) | The bug occurred inside a specialized library, such as one for parallel computing, audio, machine learning, or low-level numerical work. None of these operations exist in a data analysis library like Tidy-TS. | A function for saving raw numerical data to a file expects binary mode and fails when given text mode. |
| Visualization-specific | 12 (14%) | The bug occurred while drawing a chart, in code that controls how the chart looks rather than what the chart shows. | A chart styling function rejects a particular color palette name. |
| Language-specific behavior | 12 (14%) | The bug was caused by a quirk of the programming language itself, such as how names are looked up, how the language changed between versions, or how delayed evaluation works inside loops. | A function call breaks because a column name is given as a quoted string when the language expects it written without quotes. |
| **Total excluded** | **86 (100%)** | | |

The 86 excluded bugs sum to 52% of the corpus. That a majority of "type mismatch" bugs in a real-world bug collection fall outside the scope of a typed DataFrame library is itself informative — it shows the practical boundary of what compile-time type checking in this domain addresses.

## How the 78 included bugs break down

The 78 included bugs were each placed into one of the comparison suite's six error categories.

| Category | n |
|---|---:|
| Value type | 60 |
| Missing value | 9 |
| Data loading | 4 |
| Column reference | 4 |
| Join | 1 |
| **Total included** | **78** |

The distribution is skewed toward Value type because the RPython curators specifically selected bugs whose root cause they had labeled as "Type Mismatch." A more general bug corpus would be expected to produce a more even distribution across the six categories.
