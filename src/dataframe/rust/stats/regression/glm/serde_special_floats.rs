//! Custom serde serialization/deserialization for special float values (NaN, Infinity, -Infinity)
//!
//! This allows proper round-tripping of NaN and Infinity values through JSON,
//! which is essential for GLM results that may contain these values in diagnostic fields.

use serde::{Deserialize, Deserializer, Serializer};

/// Serialize f64 with special handling for NaN and Infinity
pub fn serialize_f64<S>(x: &f64, s: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    if x.is_nan() {
        s.serialize_str("NaN")
    } else if *x == f64::INFINITY {
        s.serialize_str("Infinity")
    } else if *x == f64::NEG_INFINITY {
        s.serialize_str("-Infinity")
    } else {
        s.serialize_f64(*x)
    }
}

/// Deserialize f64 with special handling for NaN and Infinity
pub fn deserialize_f64<'de, D>(d: D) -> Result<f64, D::Error>
where
    D: Deserializer<'de>,
{
    let val = serde_json::Value::deserialize(d)?;
    match val {
        serde_json::Value::String(s) => match s.as_str() {
            "NaN" => Ok(f64::NAN),
            "Infinity" => Ok(f64::INFINITY),
            "-Infinity" => Ok(f64::NEG_INFINITY),
            _ => Err(serde::de::Error::custom(format!(
                "invalid float string: {}",
                s
            ))),
        },
        serde_json::Value::Number(n) => n
            .as_f64()
            .ok_or_else(|| serde::de::Error::custom("invalid number")),
        serde_json::Value::Null => Ok(f64::NAN), // Handle null as NaN for backwards compatibility
        _ => Err(serde::de::Error::custom("invalid value type")),
    }
}

/// Serialize Vec<f64> with special float handling
pub fn serialize_vec_f64<S>(x: &Vec<f64>, s: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    use serde::ser::SerializeSeq;
    let mut seq = s.serialize_seq(Some(x.len()))?;
    for value in x {
        if value.is_nan() {
            seq.serialize_element("NaN")?;
        } else if *value == f64::INFINITY {
            seq.serialize_element("Infinity")?;
        } else if *value == f64::NEG_INFINITY {
            seq.serialize_element("-Infinity")?;
        } else {
            seq.serialize_element(value)?;
        }
    }
    seq.end()
}

/// Deserialize Vec<f64> with special float handling
pub fn deserialize_vec_f64<'de, D>(d: D) -> Result<Vec<f64>, D::Error>
where
    D: Deserializer<'de>,
{
    let values: Vec<serde_json::Value> = Vec::deserialize(d)?;
    values
        .into_iter()
        .map(|val| match val {
            serde_json::Value::String(s) => match s.as_str() {
                "NaN" => Ok(f64::NAN),
                "Infinity" => Ok(f64::INFINITY),
                "-Infinity" => Ok(f64::NEG_INFINITY),
                _ => Err(serde::de::Error::custom(format!(
                    "invalid float string: {}",
                    s
                ))),
            },
            serde_json::Value::Number(n) => n
                .as_f64()
                .ok_or_else(|| serde::de::Error::custom("invalid number")),
            serde_json::Value::Null => Ok(f64::NAN),
            _ => Err(serde::de::Error::custom("invalid value type")),
        })
        .collect()
}
