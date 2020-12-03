//! # WASM Encrypt/Decrypt Functions
//!
//! The library contains the `encrypt` and `decrypt` functions that are
//! exported for use in javascript via the WebAssembly interface (wasm).
//!
//! # Example Javascript Import
//! ```js
//! // Import the encrypt and decrypt functions.
//! // Must be in a module.
//! import { encrypt, decrypt, default as init } from './qspm.js';
//! async function load_wasm() {
//!     await init('./qspm_bg.wasm');
//!     window.encrypt = encrypt;
//!     window.decrypt = decrypt;
//! }
//! ```
//!
//! # Example Javascript Encrypt Usage
//! ```js
//! function encrypt(password, plaintext) {
//!    var result = window.encrypt("qspm-aes-256-gcm", pass, plaintext);
//!    return result;
//! }
//! ```
//!
//! # Example Javascript Decrypt Usage
//! ```js
//! function decrypt(password, ciphertext) {
//!    var result = window.decrypt("qspm-aes-256-gcm", pass, ciphertext);
//!    return result;
//! }
//! ```
extern crate wasm_bindgen;

use wasm_bindgen::prelude::*;
use aes_gcm::Aes256Gcm; // Or `Aes128Gcm`
use aes_gcm::aead::{Aead, NewAead, generic_array::GenericArray};
use aes_gcm_siv::Aes256GcmSiv; // Or `Aes128Gcm`
//use aes_gcm_siv::aead::{Aead, NewAead, generic_array::GenericArray};

/// The size of a MIME encrypted line.
const CHUNK_SIZE: usize = 72;

/// The available algorithms.
const ALGORITHMS: &'static[&'static str] = &["qspm-aes-256-gcm",
                                             "qspm-aes-256-gcm-siv"];


/// Return the number of algorithms available.
#[wasm_bindgen]
pub fn get_num_algorithms() -> usize {
    ALGORITHMS.len()
}

/// Returns the n-th algorithm, zero based index.
#[wasm_bindgen]
pub fn get_algorithm(i: usize) -> String {
    if i < ALGORITHMS.len() {
        return ALGORITHMS[i].to_string();
    }
    format!("error:algorithms:invalid-index:{}", i).to_string()
}

/// Is this a valid algorithm id?
///
/// Although this is an O(N) search, that is okay because
/// the number of algorithms is very small.
///
/// # Arguments
/// * `provisional`: The provisional algorithm identifier.
///
/// # Returns
/// True if it is valid or false otherwise.
pub fn is_valid_algorithm(provisional: String) -> bool {
    for algorithm in ALGORITHMS {
        if algorithm.to_string() == provisional {
            return true
        }
    }
    false
}

/// Create the header subject for the prefix and suffix.
///
/// # Arguments
/// * `algorithm`: The algorithm identifier.
/// * `kind`: Which kind of title: prefix or suffix?
///
/// # Returns
/// The header subject string.
fn header_subject(algorithm: String, kind: String) -> String {
    if !is_valid_algorithm(algorithm.to_string()) {
        return "error:header:invalid-algorithm".to_string();
    }
    let title = format!("{} {}", algorithm, kind);
    let len = title.len();
    let iw = len + 2; // include the surrounding spaces
    let rw = (CHUNK_SIZE - iw) / 2;
    let mut lw = rw;
    if (len % 2) == 1 {
        lw += 1;
    }
    let lws = format!("{:-<width$}", "", width=lw);
    let rws = format!("{:->width$}", "", width=rw);
    let header = format!("{} {} {}", lws, title, rws);
    header
}

/// Return the header prefix.
///
/// # Arguments
/// * `algorithm`: The algorithm identifier.
///
/// # Returns
/// The header prefix.
#[wasm_bindgen]
pub fn header_prefix(algorithm: String) -> String {
    header_subject(algorithm, "prefix".to_string())
}

/// Return the header suffix.
///
/// # Arguments
/// * `algorithm`: The algorithm identifier.
///
/// # Returns
/// The header suffix.
#[wasm_bindgen]
pub fn header_suffix(algorithm: String) -> String {
    header_subject(algorithm, "suffix".to_string())
}

/// Encrypts a string coming from Javascript using the specified algorithm.
///
/// It accepts a plaintext string and converts it a MIME encoded block
/// with a prefix and suffix.
///
/// # Arguments
/// * `algorithm`: The algorithm identifier.
/// * `password`: Used to encrypt the plaintext.
/// * `plaintext`: The string to encrypt.
///
/// # Returns
/// The encrypted, mime encoded ciphertext.
#[wasm_bindgen]
pub fn encrypt(algorithm: String, password: String, plaintext: String) -> String {
    if !is_valid_algorithm(algorithm.to_string()) {
        return format!("error:encrypt:invalid:{}", algorithm).to_string()
    }
    if algorithm.to_string() == "qspm-aes-256-gcm" {
        return encrypt_aes_256_gcm(password, plaintext);
    }
    if algorithm.to_string() == "qspm-aes-256-gcm-siv" {
        return encrypt_aes_256_gcm_siv(password, plaintext);
    }
    format!("error:encrypt:not-implemented:{}", algorithm)
}

/// Decrypt a string.
///
/// It accepts a ciphertext string created by the `encrypt` function
/// and converts it back to a plaintext string.
///
/// # Arguments
/// * `algorithm`: The algorithm identifier.
/// * `password`: Used to encrypt the plaintext.
/// * `ciphertext`: he encrypted, mime encoded plaintext.
///
/// # Returns
/// The unencrypted plaintext to the caller.
#[wasm_bindgen]
pub fn decrypt(algorithm: String, password: String, ciphertext: String) -> String {
    if !is_valid_algorithm(algorithm.to_string()) {
        return format!("error:decrypt:invalid:{}", algorithm).to_string()
    }
    if algorithm.to_string() == "qspm-aes-256-gcm" {
        return decrypt_aes_256_gcm(password, ciphertext);
    }
    if algorithm.to_string() == "qspm-aes-256-gcm-siv" {
        return decrypt_aes_256_gcm_siv(password, ciphertext);
    }
    format!("error:decrypt:not-implemented:{}", algorithm)
}

/// Encrypts a string coming from Javascript using the AES-256-GCM algorithm.
///
/// It accepts a plaintext string and converts it a MIME encoded block
/// with a prefix and suffix.
///
/// # Arguments
/// * `password`: Used to encrypt the plaintext.
/// * `plaintext`: The string to encrypt.
///
/// # Returns
/// The encrypted, mime encoded ciphertext.
fn encrypt_aes_256_gcm(password: String, plaintext: String) -> String {
    let algorithm = "qspm-aes-256-gcm";

    // Define the key.
    let bytes = pkcs7_pad32(password.as_bytes()); // must be 32 bytes
    let key = GenericArray::from_slice(&bytes);

    // Define the nonce
    // Using the first N bytes of the key up to 12.
    let len = std::cmp::min(bytes.len(), 12);
    let nonce = GenericArray::from_slice(&bytes[0..len]);

    // Define the cipher.
    let cipher = Aes256Gcm::new(key);

    // Encrypt.
    //let ciphertext = cipher.encrypt(nonce, plaintext.as_ref())
    //    .expect("encryption failure!");
    let ciphertext;
    match cipher.encrypt(nonce, plaintext.as_ref()) {
        Ok(v) => ciphertext = v,
        Err(e) => {
            let err = format!("error:encrypt: invalid encrypt \"{}\"", e);
            return err
        }
    }

    // Convert to base64.
    let ctb64 = base64::encode(ciphertext);

    // Convert the base64 string to 72 chars per line.
    // Honor the UTF-8 character boundaries.
    // CITATION: https://users.rust-lang.org/t/solved-how-to-split-string-into-multiple-sub-strings-with-given-length/10542/8
    let mut subs = Vec::with_capacity((CHUNK_SIZE - 1 + ctb64.len()) / CHUNK_SIZE);
    let mut pos = 0;
    let mut itr = ctb64.chars();
    while pos < ctb64.len() {
        let mut len = 0;
        for ch in itr.by_ref().take(CHUNK_SIZE) {
            len += ch.len_utf8();  // for multi-byte strings.
        }
        subs.push(&ctb64[pos..pos + len]);
        subs.push("\n");
        pos += len;
    }

    // Format the cipher text.
    let body = subs.join(&"".to_string());
    let prefix = header_prefix(algorithm.to_string());
    let suffix = header_suffix(algorithm.to_string());
    let mut result = prefix;
    result.push_str("\n");
    result.push_str(&body);
    result.push_str(&suffix);
    result.push_str("\n");
    result
}

/// Encrypts a string coming from Javascript using the AES-256-GCM-SIV algorithm.
///
/// It accepts a plaintext string and converts it a MIME encoded block
/// with a prefix and suffix.
///
/// # Arguments
/// * `password`: Used to encrypt the plaintext.
/// * `plaintext`: The string to encrypt.
///
/// # Returns
/// The encrypted, mime encoded ciphertext.
fn encrypt_aes_256_gcm_siv(password: String, plaintext: String) -> String {
    let algorithm = "qspm-aes-256-gcm-siv";

    // Define the key.
    let bytes = pkcs7_pad32(password.as_bytes()); // must be 32 bytes
    let key = GenericArray::from_slice(&bytes);

    // Define the nonce
    // Using the first N bytes of the key up to 12.
    let len = std::cmp::min(bytes.len(), 12);
    let nonce = GenericArray::from_slice(&bytes[0..len]);

    // Define the cipher.
    let cipher = Aes256GcmSiv::new(key);

    // Encrypt.
    //let ciphertext = cipher.encrypt(nonce, plaintext.as_ref())
    //    .expect("encryption failure!");
    let ciphertext;
    match cipher.encrypt(nonce, plaintext.as_ref()) {
        Ok(v) => ciphertext = v,
        Err(e) => {
            let err = format!("error:encrypt: invalid encrypt \"{}\"", e);
            return err
        }
    }

    // Convert to base64.
    let ctb64 = base64::encode(ciphertext);

    // Convert the base64 string to 72 chars per line.
    // Honor the UTF-8 character boundaries.
    // CITATION: https://users.rust-lang.org/t/solved-how-to-split-string-into-multiple-sub-strings-with-given-length/10542/8
    let mut subs = Vec::with_capacity((CHUNK_SIZE - 1 + ctb64.len()) / CHUNK_SIZE);
    let mut pos = 0;
    let mut itr = ctb64.chars();
    while pos < ctb64.len() {
        let mut len = 0;
        for ch in itr.by_ref().take(CHUNK_SIZE) {
            len += ch.len_utf8();  // for multi-byte strings.
        }
        subs.push(&ctb64[pos..pos + len]);
        subs.push("\n");
        pos += len;
    }

    // Format the cipher text.
    let body = subs.join(&"".to_string());
    let prefix = header_prefix(algorithm.to_string());
    let suffix = header_suffix(algorithm.to_string());
    let mut result = prefix;
    result.push_str("\n");
    result.push_str(&body);
    result.push_str(&suffix);
    result.push_str("\n");
    result
}

/// Decrypt a string using AES-256-GCM.
///
/// It accepts a ciphertext string created by the `encrypt` function
/// and converts it back to a plaintext string.
///
/// # Arguments
/// * `password`: Used to encrypt the plaintext.
/// * `ciphertext`: he encrypted, mime encoded plaintext.
///
/// # Returns
/// The unencrypted plaintext to the caller.
fn decrypt_aes_256_gcm(password: String, ciphertext: String) -> String {
    let algorithm = "qspm-aes-256-gcm";

    // Define the key.
    let bytes = pkcs7_pad32(password.as_bytes()); // must be 32 bytes
    let key = GenericArray::from_slice(&bytes);

    // Define the nonce
    // Using the first N bytes of the key up to 12.
    let len = std::cmp::min(bytes.len(), 12);
    let nonce = GenericArray::from_slice(&bytes[0..len]);

    // Define the cipher.
    let cipher = Aes256Gcm::new(key);

    // Get the base64 and decode it.
    // The string is formatted like this:
    //    <PREFIX>
    //    <base64>
    //    <SUFFIX>
    // If it is not in this format, it is rejected.
    let split = ciphertext.split("\n");
    let vec = split.collect::<Vec<&str>>();
    let prefix = vec[0].to_string();
    if prefix != header_prefix(algorithm.to_string()) {
        let err = format!("error:decrypt: invalid prefix \"{}\"", prefix);
        return err
    }

    // Try to be a little resilient by allowing a new line at the end.
    let mut max = vec.len() - 1;
    let mut suffix = vec[max].to_string();
    let good_suffix = header_suffix(algorithm.to_string());
    if suffix != good_suffix {
        max -= 1;
        suffix = vec[max].to_string();
        if suffix != good_suffix {
            let err = format!("error:decrypt: invalid suffix \"{}\"", suffix);
            return err
        }
    }

    // Get the body, this is the base64 data.
    let subs = &vec[1..max];
    let mut ctb64 = String::from("");
    for sub in subs {
       ctb64.push_str(sub);
    }
    let bytes;
    match base64::decode(ctb64.as_bytes()) {
        Ok(v) => bytes = v,
        Err(e) => {
            let err = format!("error:decrypt: invalid base64 conversion \"{}\"", e);
            return err
        }
    }

    // Decrypt.
    let plaintext;
    match cipher.decrypt(nonce, bytes.as_ref()) {
        Ok(v) => plaintext = v,
        Err(e) => {
            let err = format!("error:decrypt: invalid decrypt \"{}\"", e);
            return err
        }
    }
    //let plaintext = cipher.decrypt(nonce, bytes.as_ref())
    //    .expect("decryption failure!");
    std::str::from_utf8(&plaintext).unwrap().to_string()
}

/// Decrypt a string using AES-256-GCM-SIV.
///
/// It accepts a ciphertext string created by the `encrypt` function
/// and converts it back to a plaintext string.
///
/// # Arguments
/// * `password`: Used to encrypt the plaintext.
/// * `ciphertext`: he encrypted, mime encoded plaintext.
///
/// # Returns
/// The unencrypted plaintext to the caller.
fn decrypt_aes_256_gcm_siv(password: String, ciphertext: String) -> String {
    let algorithm = "qspm-aes-256-gcm-siv";

    // Define the key.
    let bytes = pkcs7_pad32(password.as_bytes()); // must be 32 bytes
    let key = GenericArray::from_slice(&bytes);

    // Define the nonce
    // Using the first N bytes of the key up to 12.
    let len = std::cmp::min(bytes.len(), 12);
    let nonce = GenericArray::from_slice(&bytes[0..len]);

    // Define the cipher.
    let cipher = Aes256GcmSiv::new(key);

    // Get the base64 and decode it.
    // The string is formatted like this:
    //    <PREFIX>
    //    <base64>
    //    <SUFFIX>
    // If it is not in this format, it is rejected.
    let split = ciphertext.split("\n");
    let vec = split.collect::<Vec<&str>>();
    let prefix = vec[0].to_string();
    if prefix != header_prefix(algorithm.to_string()) {
        let err = format!("error:decrypt: invalid prefix \"{}\"", prefix);
        return err
    }

    // Try to be a little resilient by allowing a new line at the end.
    let mut max = vec.len() - 1;
    let mut suffix = vec[max].to_string();
    let good_suffix = header_suffix(algorithm.to_string());
    if suffix != good_suffix {
        max -= 1;
        suffix = vec[max].to_string();
        if suffix != good_suffix {
            let err = format!("error:decrypt: invalid suffix \"{}\"", suffix);
            return err
        }
    }

    // Get the body, this is the base64 data.
    let subs = &vec[1..max];
    let mut ctb64 = String::from("");
    for sub in subs {
       ctb64.push_str(sub);
    }
    let bytes;
    match base64::decode(ctb64.as_bytes()) {
        Ok(v) => bytes = v,
        Err(e) => {
            let err = format!("error:decrypt: invalid base64 conversion \"{}\"", e);
            return err
        }
    }

    // Decrypt.
    let plaintext;
    match cipher.decrypt(nonce, bytes.as_ref()) {
        Ok(v) => plaintext = v,
        Err(e) => {
            let err = format!("error:decrypt: invalid decrypt \"{}\"", e);
            return err
        }
    }
    //let plaintext = cipher.decrypt(nonce, bytes.as_ref())
    //    .expect("decryption failure!");
    std::str::from_utf8(&plaintext).unwrap().to_string()
}

// PKCS7 padding for a 32 byte array.
fn pkcs7_pad32(bytes: &[u8]) -> [u8; 32] {
    let mut n = bytes.len();
    let mut m = n;
    if n > 31 {
        m = 0;
        n = 31;
    }
    let mut arr = [m as u8; 32];
    for i in 0..n {
        arr[i] = bytes[i];
    }
    arr
}

#[cfg(test)]
mod tests {
    // cargo test -- --nocapture
    extern crate wasm_bindgen;
    use crate::{header_prefix, get_num_algorithms, get_algorithm, encrypt, decrypt};

    #[test]
    pub fn test01() {
        // Verify that bad algorithms are caught.
        println!("test01: start");
        let algorithm = "bad-bad-bad";
        println!("test01: algorithm: {}", algorithm.to_string());

        let prefix = header_prefix(algorithm.to_string());
        println!("test02: prefix: {}", prefix.to_string());
        assert!(prefix.starts_with("error:header:invalid-algorithm"));

        let password = "secret";
        let plaintext = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
        println!("test01: encrypting");
        let ciphertext = encrypt(algorithm.to_string(), password.to_string(), plaintext.to_string());
        println!("test01: ciphertext={}", ciphertext.to_string());
        assert!(ciphertext.starts_with("error:encrypt:invalid:"));
        println!("test01: done");
    }

    #[test]
    pub fn test02() {
        // Verify the algorithms interface.
        println!("test02: start");
        let num = get_num_algorithms();
        println!("test02: num={}", num);
        assert!(num > 0);

        let al0 = get_algorithm(0);
        println!("test02: al0={}", al0);
        assert!(!al0.starts_with("error:"));

        let aln = get_algorithm(num+1);
        println!("test02: aln={}", aln);
        assert!(aln.starts_with("error:"));

        println!("test02: done");
    }

    #[test]
    pub fn test03() {
        // Verify that the aes-256-gcm encryption works.
        println!("test03: start");
        let algorithm = "qspm-aes-256-gcm";
        println!("test03: algorithm: {}", algorithm.to_string());

        let prefix = header_prefix(algorithm.to_string());
        println!("test03: prefix: {}", prefix.to_string());

        let password = "secret";
        let plaintext = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
        println!("test03: encrypting");
        let ciphertext = encrypt(algorithm.to_string(), password.to_string(), plaintext.to_string());
        println!("test03: decrypting");
        let testtext = decrypt(algorithm.to_string(), password.to_string(), ciphertext.to_string());
        println!("test03: '{}' ==? {}", &plaintext, &testtext);
        assert_eq!(&plaintext, &testtext);
        println!("test03: done");
    }

    #[test]
    pub fn test04() {
        // Verify that the aes-256-gcm-siv encryption works.
        println!("test04: start");
        let algorithm = "qspm-aes-256-gcm-siv";
        println!("test04: algorithm: {}", algorithm.to_string());

        let prefix = header_prefix(algorithm.to_string());
        println!("test04: prefix: {}", prefix.to_string());

        let password = "secret";
        let plaintext = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
        println!("test04: encrypting");
        let ciphertext = encrypt(algorithm.to_string(), password.to_string(), plaintext.to_string());
        println!("test04: decrypting");
        let testtext = decrypt(algorithm.to_string(), password.to_string(), ciphertext.to_string());
        println!("test04: '{}' ==? {}", &plaintext, &testtext);
        assert_eq!(&plaintext, &testtext);
        println!("test04: done");
    }
}
