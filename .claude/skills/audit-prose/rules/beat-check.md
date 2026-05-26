# Beat check

A beat is one unit of argument or narrative — the smallest piece of content that does its own distinct work. Counting beats and checking each one against the reader is the central tool of the audit.

## The three axes

Each beat has three properties the audit checks:

### Axis 1: Distinct work

The beat says something the prior sentence did not say. If two sentences carry the same beat with different words, one is padding. This is the count axis.

A paragraph with three sentences should be making three beats. If it is making two beats across three sentences, one sentence is restatement.

### Axis 2: Concept reachability

Each beat introduces or relies on a concept (e.g. "downstream analysis", "side effects of a halted program", "non-standard evaluation", "type tracking"). The audit asks:

- Is the concept already established earlier in the document?
- If introduced here, is it defined plainly enough that the target reader can hold it?

"Partial output" looks like a single noun phrase but assumes the reader knows what kinds of partial output a halted program can leave — a value written to a file, some rows committed but not others, an alert sent before the next step rolls it back. The writer is on the hook for making the concept reachable, either by tying it to something the reader already knows or by defining it inline.

A beat that introduces a new concept without defining it plainly fails axis 2 even if it does distinct work.

### Axis 3: Concrete enough to ground

If the concept is abstract, the beat needs at least one concrete instance the reader can attach to.

"A workflow that writes to a database" is a concrete anchor for "side effects". "Hours of computation" is a concrete anchor for "wasted runtime". Abstract beats without an anchor float past the reader and produce later confusion.

A beat that asserts a general claim and gives no instance fails axis 3.

## When to expand vs. cut

The default move under the rules is to cut. But a beat that fails axes 2 or 3 is **not** a candidate for cutting — it is a candidate for expanding or anchoring.

- Fails axis 1 only (the beat repeats a prior sentence) → cut.
- Fails axis 2 (concept is unreachable) → expand with definition or tie to a known concept.
- Fails axis 3 (no concrete instance) → add at least one concrete anchor.

A beat that fails axes 2 AND 3 needs both: a definition and an anchor.

## When a triplet IS justified

The general triplet-as-padding rule (see `style.md`) does not apply when each example is serving a different beat's concept-reachability or grounding need.

If "the program does not write to a file, commit a row to a database, or send a clinical alert" lists three concrete kinds of side effects of a halted program, and "side effects" is an abstract beat that needs grounding (axis 3), the triplet earns its place. Three categories of side effect, one beat.

If "no data is written, no records are changed, no alerts are sent" lists three near-synonymous outcomes of the same axis-3 beat, the triplet is padding. One outcome, three words.

The rule is: count what each item in the list is doing. Three distinct concrete instances of one abstract concept = justified. Three near-synonymous restatements of the same point = padding.

## How to audit a paragraph

1. List the paragraph's beats out loud (or on paper).
2. For each beat, mark axis 1 / 2 / 3 status. Note what is missing.
3. Decide per beat: keep / expand / anchor / cut.
4. Re-read the paragraph against the marked-up list.

If a paragraph has four beats and three are clean and one fails axis 2, the audit does not cut the paragraph. It expands the one beat that fails.

## Worked example

Original (3 sentences, 2 beats):

> "Errors caught at compile time prevent the code from being run. The program produces no output. So no incorrect result enters a later step of the analysis."

Beat 1: code does not run.
Beat 2: no incorrect result downstream.
Sentence 2 ("The program produces no output") is a near-restatement of beat 1.

Axis 1: sentence 2 repeats beat 1.
Cut sentence 2.

Revised:
> "Errors caught at compile time prevent the code from being run, so no incorrect result enters a later step of the analysis."

Two beats, one sentence, no padding.

## The "wave past" trap

When you are tempted to mark a beat as "OK, moving on", stop. Often the beat IS OK, but sometimes the impulse to wave past is hiding a real problem. Ask: would the next draft of this document keep this beat exactly as it is? If not, the beat has work to do — expand it, anchor it, or cut it.

See `posture.md` for more on this.
