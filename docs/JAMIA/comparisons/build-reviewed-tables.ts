// Build reviewed issue tables for TM_DFB and TM from the manual agent reviews

const BASE = "docs/JAMIA/comparisons/RPython-main";

// ── TM_DFB verdicts (from manual review of all 110 snippets) ──
// Format: id → [verdict, category, description, novelty]
const tmDfbVerdicts: Record<number, [string, string, string, string]> = {
  22481271: ["Yes", "cat-2", "Object dtype columns fail corr() — numeric aggregation on string-typed columns", "Existing"],
  12125364: ["No", "", "R median() returns int vs double inconsistently — TypeScript has only `number`", ""],
  20625982: ["No", "", "groupby.mean() silently drops timedelta column — API behavior", ""],
  7960798: ["Maybe", "cat-3", "R NA returns logical type instead of numeric across groups", "Existing"],
  12844529: ["Yes", "cat-2", "Object dtype columns fail groupby aggregate", "Existing"],
  29643820: ["No", "", "R data.table assigning double to integer column — int/double distinction", ""],
  24152509: ["No", "", "MultiIndex slicing with wrong type (string vs Timestamp) — API complexity", ""],
  26401116: ["No", "", "R median() int/double inconsistency in data.table groupby", ""],
  41493177: ["No", "", "MultiIndex DataFrame multiply fails on index alignment — runtime logic", ""],
  29224719: ["Maybe", "cat-3", "R ifelse with NA causes logical vs numeric type conflict", "Existing"],
  26347412: ["No", "", "Wrong API usage for drop (extra list wrapper)", ""],
  30063190: ["No", "", "R POSIXlt type incompatible with dplyr — R-specific date class", ""],
  15138973: ["Maybe", "cat-3", "NaN values cause value_counts aggregation failure", "Existing"],
  21714867: ["No", "", "R mean() returns double for integer column — int/double distinction", ""],
  19105976: ["No", "", "Calling .date() on Series instead of element — API misuse", ""],
  34186903: ["No", "", "R passing string column names to NSE functions — metaprogramming", ""],
  56079650: ["Yes", "cat-2", "Boolean column silently becomes object, ~ gives wrong results — silent type coercion", "Novel"],
  27828850: ["No", "", "R POSIXlt date column breaks dplyr group_by", ""],
  50916422: ["No", "", "numpy int64 not JSON serializable — numpy/JSON interop", ""],
  24619628: ["No", "", "R passing string to dplyr filter — NSE issue", ""],
  22487296: ["No", "", "multiprocessing.Value can't hold DataFrame — IPC issue", ""],
  48430882: ["No", "", "R select_if negated predicate syntax — API usage", ""],
  41654949: ["No", "", "Pandas style function signature — visualization/styling", ""],
  35839408: ["No", "", "R drop columns by name using string vector — API usage", ""],
  19392226: ["No", "", "value_counts() called on DataFrame instead of Series — API misuse", ""],
  45769987: ["Maybe", "cat-1", "R duplicate column names cause spread/join errors — schema validation", "Novel"],
  29150346: ["No", "", "FrozenList immutability on MultiIndex — API usage", ""],
  44893933: ["Maybe", "cat-3", "R case_when requires same types, NA is logical", "Existing"],
  30944577: ["No", "", "str.contains returns Series, used as scalar boolean — API misuse", ""],
  30196495: ["No", "", "R summarize with which() lookup — logic question", ""],
  39584118: ["No", "", "Dask to_datetime needs metadata — Dask-specific", ""],
  49328370: ["No", "", "R recode piped DataFrame instead of column — pipe misuse", ""],
  31269216: ["No", "", "str.upper() on Series needs .str accessor — API usage", ""],
  38514988: ["No", "", "R string concatenation in summarize — API usage", ""],
  30132282: ["No", "", ".str accessor on datetime Series — need .dt accessor", ""],
  28751023: ["No", "", "R mutate on subset of columns — API pattern", ""],
  12190874: ["No", "", "DataFrame sampling API version issue", ""],
  10805643: ["No", "", "R ggplot2 continuous value on discrete scale — visualization", ""],
  35587459: ["No", "", "groupby needs list argument not multiple args — API syntax", ""],
  29974535: ["No", "", "R ggplot2 character date on x-axis — visualization", ""],
  31745509: ["Maybe", "cat-3", "str.contains on nullable column returns NaN, ~ fails on NaN", "Novel"],
  20500706: ["No", "", "R saving multiple ggplots — visualization/IO", ""],
  26614465: ["No", "", "pd.notnull on list returns array, breaks if condition — API usage", ""],
  3039438: ["No", "", "R ggplot2 footnote/annotation — visualization", ""],
  32219350: ["No", "", "Saving pie plot returns array not figure — visualization", ""],
  45824409: ["No", "", "R ggplot2 + dplyr NSE function wrapper — metaprogramming", ""],
  13854476: ["No", "", "groupby transform semantics confusion — API behavior", ""],
  16569489: ["No", "", "R ggplot2 histogram fill needs factor — visualization", ""],
  39992411: ["No", "", "to_datetime on DataFrame instead of Series — API misuse", ""],
  10495898: ["No", "", "R ggplot2 geom_line with factor x-axis — visualization", ""],
  33221655: ["Maybe", "cat-2", "Setting list value in float64 column fails — type mismatch", "Novel"],
  23997475: ["No", "", "R ggplot2 geom_vline date as character — visualization", ""],
  26121009: ["No", "", "zip returns iterator in Python 3 — migration issue", ""],
  29278153: ["No", "", "R ggplot2 factor on continuous scale — visualization", ""],
  14431646: ["No", "", "DataFrame to SQLite index handling — IO/API", ""],
  44205731: ["No", "", "R purrr::map masks maps::map — namespace collision", ""],
  47333227: ["Yes", "cat-3", "NaN in column prevents astype(int) — nullable prevents integer cast", "Existing"],
  4835332: ["No", "", "R combining ggplot2 elements — visualization", ""],
  47328402: ["No", "", "pymysql cursor result to DataFrame — IO/API", ""],
  3695497: ["No", "", "R ggplot2 percentages — visualization", ""],
  47242845: ["No", "", "json_normalize on nested JSON — IO/API", ""],
  33826249: ["No", "", "R mixing base plot with grid graphics — visualization", ""],
  44616546: ["Yes", "cat-2", "groupby.mean() fails on timedelta — numeric aggregation on non-numeric type", "Existing"],
  35560433: ["No", "", "R geom_smooth on string dates — visualization", ""],
  11561932: ["No", "", "numpy int64 not JSON serializable — numpy/JSON interop", ""],
  36476751: ["No", "", "R ggplot2 color palette — visualization", ""],
  29318459: ["No", "", "Function handling scalar vs array — numpy API pattern", ""],
  26235825: ["No", "", "R ggplot2 lazy evaluation in loop — visualization", ""],
  22557322: ["No", "", "numpy savetxt float formatted as int — IO formatting", ""],
  34428440: ["No", "", "R stat_bin requires continuous x for factor — visualization", ""],
  47721635: ["No", "", "NaN identity vs equality in list — Python language semantics", ""],
  44548819: ["No", "", "R tidy evaluation with ggplot2 — NSE/visualization", ""],
  41859824: ["Yes", "cat-2", "String concatenation with numpy numeric types fails — arithmetic on wrong type", "Existing"],
  26327991: ["No", "", "R ts object date conversion — R date class", ""],
  23668509: ["No", "", "Dict keys/values to numpy arrays — numpy API usage", ""],
  25937000: ["No", "", "R ggplot2 discrete value on continuous scale — visualization", ""],
  48622281: ["No", "", "numpy savetxt format for mixed types — IO/numpy", ""],
  4904972: ["No", "", "R igraph to data.frame conversion — library conversion", ""],
  33144039: ["No", "", "Float index used for list slicing — Python indexing", ""],
  22906804: ["Maybe", "cat-2", "R matrix multiply on data.frame requires as.matrix — type for math ops", "Novel"],
  38673531: ["No", "", "numpy int16 *= float64 casting — numpy casting rules", ""],
  14023423: ["Yes", "cat-2", "R caret preProcess fails on factor columns — numeric function on non-numeric", "Existing"],
  27622834: ["No", "", "Image.fromarray fails with signed byte dtype — numpy/PIL interop", ""],
  30097730: ["No", "", "R predict fails due to factor encoding — ML model issue", ""],
  16621351: ["No", "", "numpy savetxt format for mixed string+float — IO/numpy", ""],
  22016847: ["No", "", "Complex number assignment to numpy array — numpy dtype", ""],
  3685265: ["No", "", "numpy savetxt for 3D array — IO/numpy", ""],
  14269164: ["No", "", "numpy casting rules differ between versions — version issue", ""],
  32120178: ["No", "", "ctypes ndpointer can't accept None — FFI issue", ""],
  26778079: ["No", "", "numpy array not C-contiguous for cython — memory layout", ""],
  27786868: ["No", "", "numpy savetxt needs binary mode in Python 3 — migration", ""],
  33747908: ["No", "", "numpy.where returns tuple not array — API return type", ""],
  44302946: ["No", "", "numpy int64 not recognized as int by itertools — numpy/Python interop", ""],
  45670487: ["Yes", "cat-2", "numpy.cov fails on object dtype array — numeric function on object type", "Existing"],
  34952651: ["No", "", "Float index where integer required — Python 3 division", ""],
  35328286: ["No", "", "np.array (function) used as type annotation — naming confusion", ""],
  16862459: ["No", "", "Iterating numpy scalar with tuple unpacking — API misuse", ""],
  35372829: ["No", "", "numpy savetxt format mismatch in Python 3 — migration IO", ""],
  51079543: ["No", "", "groupby transform vs apply semantics — API behavior", ""],
  33692532: ["Yes", "cat-3", ".str accessor on NaN column fails — string method on nullable column", "Existing"],
  37792999: ["No", "", "drop_duplicates on column with lists — runtime data content", ""],
  32742004: ["No", "", "Spark can't infer schema from flat RDD — Spark API", ""],
  20333435: ["No", "", "Operator precedence & vs == in boolean filter — language syntax", ""],
  11541123: ["No", "", "matplotlib 3D plot API usage — visualization", ""],
  48062499: ["Yes", "cat-2", "Y-axis data plotted as strings not sorted numerically — string vs numeric type", "Existing"],
  42013903: ["Yes", "cat-2", "raw_input returns string, multiplied with numpy array — string arithmetic", "Existing"],
  24706677: ["Maybe", "cat-2", "sklearn needs numeric input, got categorical — numeric function on categorical", "Existing"],
  17393989: ["No", "", "Float labels used as array indices — numpy indexing", ""],
  18401112: ["Yes", "cat-2", "String labels ('0','1') instead of int labels for roc_auc — wrong type at load", "Existing"],
  8501141: ["No", "", "Audio resample returns float32, pygame needs int16 — library interop", ""],
};

// ── TM verdicts (from manual review of all 164 snippets) ──
const tmVerdicts: Record<number, [string, string, string, string]> = {
  29298577: ["No", "", "String dates with NaN fail to_datetime — data content", ""],
  12125364: ["Yes", "cat-2", "R median() returns int vs double inconsistently across groups", "Existing"],
  27413843: ["No", "", "read_table fails with wrong separator argument", ""],
  7920688: ["Maybe", "cat-4", "R data.table join key type mismatch", "Novel"],
  22137723: ["Yes", "cat-2", "String numbers with commas fail numeric operations — object dtype as numeric", "Novel"],
  10675182: ["No", "", "R passing string variable names to data.table — NSE", ""],
  22481271: ["Yes", "cat-2", "DataFrame.corr() returns empty on object dtype columns", "Existing"],
  7960798: ["Yes", "cat-3", "R data.table NA vs NA_real_ type mismatch across groups", "Existing"],
  20625982: ["Yes", "cat-2", "timedelta column silently dropped in groupby aggregation", "Novel"],
  29643820: ["Yes", "cat-2", "R data.table := fails assigning double to integer column", "Existing"],
  39534676: ["No", "", "pd.concat given DataFrame instead of list — API misuse", ""],
  26401116: ["Yes", "cat-2", "R median returns int vs double in data.table groupby", "Existing"],
  30519140: ["Yes", "cat-2", "Boolean mask on mixed dtype DataFrame fails", "Novel"],
  29224719: ["Yes", "cat-3", "R dplyr ifelse with NA causes logical vs numeric type conflict", "Existing"],
  12844529: ["Yes", "cat-2", "groupby aggregate fails on object dtype columns", "Existing"],
  30063190: ["Yes", "cat-2", "R POSIXlt incompatible with dplyr operations", "Existing"],
  24152509: ["Yes", "cat-2", "MultiIndex slicing with string vs Timestamp type mismatch", "Novel"],
  21714867: ["Yes", "cat-2", "R mean() returns double, can't assign to integer column", "Existing"],
  41493177: ["No", "", "MultiIndex DataFrame multiply fails on index alignment — runtime logic", ""],
  34186903: ["No", "", "R dplyr NSE: passing column names as strings — metaprogramming", ""],
  16067144: ["Yes", "cat-2", "fillna on float dtype column produces float instead of string", "Novel"],
  27828850: ["Yes", "cat-2", "R POSIXlt date column breaks dplyr group_by", "Existing"],
  36462257: ["Yes", "cat-2", "Empty DataFrame loses dtype specification — schema lost", "Novel"],
  24619628: ["No", "", "R passing string to dplyr filter — NSE issue", ""],
  26347412: ["No", "", "df.drop wrapping columns in extra list — API misuse", ""],
  48430882: ["No", "", "R select_if negated predicate syntax — API usage", ""],
  16988526: ["Yes", "cat-2", "read_csv infers numeric dtype for string '1234E5' — inference error", "Novel"],
  35839408: ["No", "", "R dplyr drop columns by name — API usage", ""],
  15138973: ["No", "", "value_counts on DataFrame instead of Series — API misuse", ""],
  45769987: ["Yes", "cat-5", "R duplicate column names cause dplyr error — schema validation", "Novel"],
  20455163: ["No", "", "round() on DataFrame fails in old pandas — API version", ""],
  44893933: ["Yes", "cat-3", "R case_when requires same types, NA is logical not numeric", "Existing"],
  19105976: ["No", "", "Timestamp to string conversion wrong accessor — API usage", ""],
  30196495: ["No", "", "R summarize with which() indexing — logic question", ""],
  18645401: ["No", "", "to_excel encoding mismatch — environment issue", ""],
  49328370: ["No", "", "R recode piped DataFrame instead of column — pipe misuse", ""],
  56079650: ["Yes", "cat-2", "Boolean negation ~ on object column instead of bool — silent coercion", "Novel"],
  38514988: ["No", "", "R string concatenation in summarize — API usage", ""],
  50916422: ["Yes", "cat-2", "numpy int64 not JSON serializable — numpy type vs native Python type", "Existing"],
  28751023: ["No", "", "R dplyr mutate on subset of columns — API pattern", ""],
  37703634: ["No", "", "Reading S3 file with boto3 returns bytes — IO issue", ""],
  41815365: ["Yes", "cat-2", "R ggplot2 date_trans requires Date class, not character", "Novel"],
  22487296: ["No", "", "multiprocessing Value doesn't accept DataFrame — IPC issue", ""],
  10805643: ["Yes", "cat-2", "R ggplot2 continuous value on discrete scale (numeric vs factor)", "Novel"],
  41654949: ["No", "", "Pandas style function wrong column types — API usage", ""],
  29953011: ["No", "", "R ggplot2 numeric vector instead of data.frame — API misuse", ""],
  19392226: ["No", "", "DataFrame attribute access for value_counts — API misuse", ""],
  29974535: ["Yes", "cat-2", "R ggplot2 x-axis character treated as discrete not date", "Novel"],
  33199193: ["Yes", "cat-3", "NaN in list column cannot be filled with empty list — type mismatch", "Novel"],
  20500706: ["No", "", "R saving ggplot objects from environment — IO", ""],
  29150346: ["No", "", "MultiIndex levels immutable — API usage", ""],
  3039438: ["No", "", "R ggplot2 footnote annotate — visualization", ""],
  30944577: ["No", "", "Boolean series used as scalar truth value — API misuse", ""],
  45824409: ["No", "", "R ggplot2 tidy eval syntax — NSE issue", ""],
  39584118: ["No", "", "Dask column datetime conversion — library-specific", ""],
  16569489: ["Yes", "cat-2", "R ggplot2 histogram fill needs factor, not numeric", "Novel"],
  39180873: ["Yes", "cat-2", "Histogram fails on object dtype array — numeric expected", "Existing"],
  4856849: ["No", "", "R ggplot2 loop variable lazy evaluation — closure bug", ""],
  31269216: ["Yes", "cat-2", "str.upper() on mixed-type column fails — string op on non-string", "Novel"],
  10495898: ["Yes", "cat-2", "R ggplot2 geom_line fails with factor x-axis", "Novel"],
  30132282: ["Yes", "cat-2", "Datetime series lacks .str accessor — wrong accessor type", "Novel"],
  28730083: ["Yes", "cat-2", "R ggplot2 geom_area fails with categorical x-axis", "Novel"],
  31521526: ["Yes", "cat-2", "Currency string to float conversion with parentheses", "Existing"],
  23997475: ["Yes", "cat-2", "R ggplot2 geom_vline date as character not Date class", "Existing"],
  17690738: ["Yes", "cat-2", "Assigning datetime to integer-indexed Series — type mismatch", "Novel"],
  29278153: ["Yes", "cat-2", "R ggplot2 discrete value on continuous scale: factor vs numeric", "Existing"],
  12190874: ["No", "", "DataFrame random sampling API version issue", ""],
  44205731: ["No", "", "R tidyverse purrr::map masks map — namespace collision", ""],
  35587459: ["No", "", "groupby passed tuple instead of list — API misuse", ""],
  4835332: ["No", "", "R ggplot2 combining layers — API usage", ""],
  31745509: ["Yes", "cat-3", "str.contains fails on column with NaN values", "Novel"],
  3695497: ["No", "", "R ggplot2 show percentages — API usage", ""],
  26614465: ["Yes", "cat-2", "pd.notnull on list returns array, breaks if condition — array ambiguity", "Novel"],
  33826249: ["No", "", "R grid.arrange mixing plot objects — API incompatibility", ""],
  32219350: ["No", "", "DataFrame.plot returns array of axes — API return type", ""],
  35560433: ["Yes", "cat-2", "R ggplot2 geom_smooth fails on factor/character date", "Existing"],
  13854476: ["No", "", "pandas transform semantics confusion — API behavior", ""],
  36476751: ["No", "", "R ggplot2 custom colors — visualization", ""],
  39992411: ["No", "", "to_datetime on DataFrame instead of Series — API misuse", ""],
  26235825: ["No", "", "R ggplot2 for-loop lazy evaluation — closure bug", ""],
  33221655: ["Yes", "cat-2", "Setting list value in float64 column fails — type mismatch", "Novel"],
  34428440: ["Yes", "cat-2", "R ggplot2 stat_bin requires continuous x, got factor", "Existing"],
  26121009: ["No", "", "zip returns iterator in Python 3 — migration issue", ""],
  44548819: ["No", "", "R ggplot2 tidy eval with ... — NSE issue", ""],
  14431646: ["No", "", "DataFrame to SQLite index handling — IO/API", ""],
  26327991: ["No", "", "R ts object date plotting — R class issue", ""],
  47333227: ["Yes", "cat-3", "NaN in integer column prevents int cast", "Existing"],
  25937000: ["No", "", "R ggplot2 different color aesthetics — visualization", ""],
  47328402: ["No", "", "pymysql cursor result to DataFrame — IO/API", ""],
  4904972: ["No", "", "R igraph to data.frame conversion — library conversion", ""],
  47242845: ["No", "", "json_normalize nested JSON — IO/API", ""],
  22906804: ["Yes", "cat-2", "R matrix multiply on data.frame requires as.matrix — type for math", "Novel"],
  44616546: ["Yes", "cat-2", "timedelta column mean fails 'no numeric types'", "Novel"],
  14023423: ["Yes", "cat-2", "R caret preProcess fails on factor columns — numeric on non-numeric", "Novel"],
  15799162: ["Yes", "cat-2", "Resampling MultiIndex requires DatetimeIndex — index type mismatch", "Novel"],
  30097730: ["Yes", "cat-5", "R caret predict schema mismatch — train vs predict factor encoding", "Novel"],
  4231190: ["Yes", "cat-2", "numpy array of tuples needs structured dtype — object vs structured", "Novel"],
  11561932: ["Yes", "cat-2", "numpy int64 not JSON serializable", "Existing"],
  29318459: ["Maybe", "cat-2", "Function handling scalar vs array input type", "Novel"],
  22557322: ["Yes", "cat-2", "numpy savetxt fmt='%i' on float array truncates — format mismatch", "Novel"],
  47721635: ["No", "", "NaN identity vs equality in containment — Python semantics", ""],
  21011777: ["Yes", "cat-2", "math.isnan fails on non-float elements in list — mixed types", "Existing"],
  22725043: ["No", "", "int64 array in 32-bit Python — platform issue", ""],
  18557337: ["Maybe", "cat-2", "np.exp fails when np.dot returns float instead of array", "Novel"],
  41859824: ["Yes", "cat-2", "numpy string array ufunc add fails (S32 dtype)", "Novel"],
  23668509: ["No", "", "Dict keys/values to numpy arrays — API usage", ""],
  48622281: ["Yes", "cat-2", "numpy savetxt structured array needs fmt — mixed dtype format", "Existing"],
  5957380: ["Yes", "cat-2", "Structured array to regular ndarray conversion — dtype conversion", "Novel"],
  33144039: ["Yes", "cat-2", "Python list indexed with numpy array — type incompatibility", "Novel"],
  38673531: ["Yes", "cat-2", "int16 *= float64 casting fails — inplace narrowing cast", "Existing"],
  27622834: ["Yes", "cat-2", "Signed byte array (int8) used for image (needs uint8)", "Novel"],
  16621351: ["Yes", "cat-2", "numpy savetxt format for mixed string+float — type mismatch", "Existing"],
  21088133: ["No", "", "Confusion between np.array and np.ndarray — naming", ""],
  29877508: ["No", "", "numpy dtype=object enables string ops but loses vectorization — docs", ""],
  17151210: ["Yes", "cat-2", "numpy loadtxt fails on comment/header rows — string vs float", "Novel"],
  12588986: ["Yes", "cat-2", "numpy inplace add: object dtype + float64 conflict", "Existing"],
  22016847: ["Yes", "cat-2", "numpy complex assignment to float64 zeros array fails", "Novel"],
  32743427: ["Yes", "cat-2", "numpy randint returns int64, needs uint8 — dtype too wide", "Existing"],
  14269164: ["No", "", "numpy casting rules differ between versions — version issue", ""],
  32120178: ["No", "", "ctypes ndpointer doesn't accept None — FFI issue", ""],
  26778079: ["No", "", "numpy array not C-contiguous — memory layout", ""],
  27786868: ["No", "", "numpy savetxt needs binary mode in Python 3 — migration", ""],
  33747908: ["No", "", "numpy.where returns tuple not array — API return type", ""],
  44302946: ["Yes", "cat-2", "numpy int64 not accepted by itertools — numpy/Python type", "Existing"],
  45670487: ["Yes", "cat-2", "numpy.cov fails on object dtype array — numeric on object", "Existing"],
  34952651: ["Yes", "cat-2", "Float from division used as array index — needs int", "Novel"],
  35328286: ["No", "", "np.array used in type hint instead of np.ndarray — naming", ""],
  16862459: ["No", "", "numpy scalar unpacking — API misuse", ""],
  35372829: ["No", "", "numpy savetxt Python 3 binary mode — migration", ""],
  18621513: ["No", "", "numpy array not accepted by sqlite3 BLOB — serialization", ""],
  51079543: ["No", "", "pandas groupby transform vs apply — API behavior", ""],
  14992644: ["Yes", "cat-2", "Histogram on string DataFrame columns fails", "Existing"],
  37513355: ["Yes", "cat-5", "Spark DataFrame schema inference fails on mixed types", "Novel"],
  38969267: ["No", "", "df[list] vs df[[list]] column selection — API syntax", ""],
  19169649: ["No", "", "str.contains with | operator — Python operator misuse", ""],
  25416955: ["Yes", "cat-2", "Matplotlib date axis from string column not parsed", "Existing"],
  41286569: ["Yes", "cat-2", "df.sum() on object dtype concatenates strings — numeric op on strings", "Novel"],
  33692532: ["Yes", "cat-3", "pandas str accessor fails on NaN-containing column", "Existing"],
  33695389: ["No", "", "PySpark filter by array length — API usage", ""],
  37792999: ["Yes", "cat-2", "drop_duplicates fails on list-type column — unhashable type", "Novel"],
  36115687: ["Maybe", "cat-2", "PySpark string date comparison without parsing", "Novel"],
  32742004: ["No", "", "Spark createDataFrame needs tuples not scalars — API misuse", ""],
  19864028: ["Yes", "cat-2", "String 'na' in CSV column prevents numeric operations", "Existing"],
  20333435: ["No", "", "Operator precedence & vs == — language syntax", ""],
  35368645: ["No", "", "Float64Index to string conversion — API usage", ""],
  11541123: ["No", "", "3D line plot needs explicit coordinate arrays — visualization", ""],
  48062499: ["Yes", "cat-2", "Matplotlib y-axis string values not sorted numerically", "Novel"],
  31162780: ["Yes", "cat-2", "Matplotlib Rectangle with datetime needs float conversion", "Novel"],
  42013903: ["Yes", "cat-2", "raw_input returns string, used in numpy multiply", "Novel"],
  21472243: ["Yes", "cat-2", "Histogram on string/object data fails reduce", "Existing"],
  24706677: ["Yes", "cat-2", "sklearn GradientBoosting doesn't handle string features", "Novel"],
  28393103: ["Yes", "cat-2", "sklearn Naive Bayes given string array instead of numeric", "Existing"],
  17393989: ["Yes", "cat-2", "sklearn labels as float instead of integer", "Novel"],
  18401112: ["No", "", "sklearn roc_auc_score given non-binary labels — data content", ""],
  8501141: ["Yes", "cat-2", "pygame expects int16 array, got float32 from resample", "Novel"],
  48719937: ["Yes", "cat-2", "pandas idxmax on object dtype column fails", "Existing"],
  30857680: ["Yes", "cat-2", "pandas resample requires DatetimeIndex, got int index", "Existing"],
  22218438: ["No", "", "rolling_apply can only return scalar — API limitation", ""],
  26788854: ["No", "", "Date-of-birth string needs datetime conversion — data content", ""],
  15884527: ["Yes", "cat-2", "Python list multi-dim slicing fails (not numpy array)", "Novel"],
  19953348: ["No", "", "plt.subplots returns axes not array when nrows=1 — API variant", ""],
  17950374: ["No", "", "Int to string column conversion — API usage", ""],
  6063876: ["Yes", "cat-2", "Matplotlib scatter colorbar needs float array, got tuple list", "Novel"],
};

function decodeHtml(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/\|/g, "\\|");
}

async function buildTable(
  label: string,
  snippetsPath: string,
  verdicts: Record<number, [string, string, string, string]>,
  outPath: string,
) {
  const raw: Record<string, unknown>[] = JSON.parse(await Deno.readTextFile(snippetsPath));

  // Sort: Yes first, then Maybe, then No. Within each: Python first, then R. Within each: score desc.
  const order = { Yes: 0, Maybe: 1, No: 2 };
  raw.sort((a, b) => {
    const va = verdicts[a.id as number];
    const vb = verdicts[b.id as number];
    const oa = order[(va?.[0] ?? "No") as keyof typeof order] ?? 2;
    const ob = order[(vb?.[0] ?? "No") as keyof typeof order] ?? 2;
    if (oa !== ob) return oa - ob;
    if (a.lang !== b.lang) return a.lang === "Python" ? -1 : 1;
    return (b.score as number) - (a.score as number);
  });

  const yesCount = raw.filter(s => verdicts[s.id as number]?.[0] === "Yes").length;
  const maybeCount = raw.filter(s => verdicts[s.id as number]?.[0] === "Maybe").length;
  const noCount = raw.filter(s => verdicts[s.id as number]?.[0] === "No").length;
  const novelCount = raw.filter(s => verdicts[s.id as number]?.[3] === "Novel").length;

  const lines: string[] = [];
  lines.push(`# ${label} — Reviewed Issue Catalog`);
  lines.push("");
  lines.push(`Source: RPython dataset (ESEC/FSE 2023) — ${raw.length} StackOverflow bugs`);
  lines.push("");
  lines.push(`**Probe candidates:** ${yesCount} Yes, ${maybeCount} Maybe, ${noCount} No — ${novelCount} novel (not covered by existing probes)`);
  lines.push("");
  lines.push("| # | Lang | Score | Bug | Effect | Title | Problem | Cat | Probe? | Novel? | Done? |");
  lines.push("|---|------|-------|-----|--------|-------|---------|-----|--------|--------|-------|");

  raw.forEach((s, i) => {
    const v = verdicts[s.id as number];
    const verdict = v?.[0] ?? "No";
    const cat = v?.[1] ?? "";
    const problem = (v?.[2] ?? "").replace(/\|/g, "\\|");
    const novel = v?.[3] ?? "";

    const title = decodeHtml(String(s.title));
    const url = String(s.url);
    const titleLink = `[${title.slice(0, 55)}${title.length > 55 ? "..." : ""}](${url})`;

    lines.push(
      `| ${i + 1} | ${s.lang} | ${s.score} | ${s.bug} | ${s.effect} | ${titleLink} | ${problem} | ${cat} | ${verdict} | ${novel} | |`
    );
  });

  await Deno.mkdir(outPath.replace(/\/[^/]+$/, ""), { recursive: true });
  await Deno.writeTextFile(outPath, lines.join("\n") + "\n");
  console.log(`Wrote ${outPath} (${raw.length} rows, ${yesCount} Yes, ${maybeCount} Maybe, ${noCount} No, ${novelCount} novel)`);
}

await buildTable("TM_DFB", `${BASE}/TM_DFB_snippets.json`, tmDfbVerdicts, "docs/JAMIA/comparisons/TM_DFB/issues.md");
await buildTable("TM", `${BASE}/TM_snippets.json`, tmVerdicts, "docs/JAMIA/comparisons/TM/issues.md");
