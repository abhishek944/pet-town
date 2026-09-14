use sha2::{Digest, Sha256};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

fn bundled_pet_ids() -> Vec<String> {
    let pets = Path::new("../src/pets");
    let mut ids: Vec<String> = fs::read_dir(pets)
        .expect("could not read bundled pet directory")
        .filter_map(Result::ok)
        .filter(|entry| entry.path().join("flow.json").is_file())
        .filter_map(|entry| entry.file_name().into_string().ok())
        .collect();
    ids.sort();
    assert!(!ids.is_empty(), "at least one bundled pet is required");
    ids
}

fn compile_wake_bridge() {
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() != Ok("macos") {
        return;
    }
    let output = PathBuf::from(std::env::var_os("OUT_DIR").expect("OUT_DIR is missing"));
    let library = output.join("libpet_village_wake.a");
    let rust_target = std::env::var("TARGET").expect("TARGET is missing");
    let target = if rust_target.starts_with("aarch64") {
        "arm64-apple-macosx11.0"
    } else {
        "x86_64-apple-macosx11.0"
    };
    let status = Command::new("xcrun")
        .args([
            "swiftc",
            "-parse-as-library",
            "-emit-library",
            "-static",
            "-target",
            &target,
            "src/orchestrator/wake_bridge.swift",
            "-o",
        ])
        .arg(&library)
        .status()
        .expect("could not start Swift compiler");
    assert!(status.success(), "could not compile local wake bridge");
    let swiftc = Command::new("xcrun")
        .args(["--find", "swiftc"])
        .output()
        .expect("could not locate Swift compiler");
    let compiler = PathBuf::from(String::from_utf8_lossy(&swiftc.stdout).trim());
    let swift_libs = compiler
        .parent()
        .and_then(Path::parent)
        .expect("invalid Swift compiler path")
        .join("lib/swift/macosx");
    println!("cargo:rustc-link-search=native={}", output.display());
    println!("cargo:rustc-link-search=native={}", swift_libs.display());
    println!("cargo:rustc-link-search=native=/usr/lib/swift");
    println!("cargo:rustc-link-lib=static=pet_village_wake");
    println!("cargo:rustc-link-lib=framework=Speech");
    println!("cargo:rustc-link-lib=framework=AVFoundation");
    println!("cargo:rustc-link-arg=-Wl,-rpath,/usr/lib/swift");
    let plist = Path::new("Info.plist")
        .canonicalize()
        .expect("Info.plist is missing");
    println!(
        "cargo:rustc-link-arg=-Wl,-sectcreate,__TEXT,__info_plist,{}",
        plist.display()
    );
    println!("cargo:rerun-if-changed=Info.plist");
    println!("cargo:rerun-if-changed=src/orchestrator/wake_bridge.swift");
}

fn runtime_hash() -> String {
    let path = Path::new("resources/pet-village-pi-runtime.tar.gz");
    println!("cargo:rerun-if-changed={}", path.display());
    fs::read(path)
        .ok()
        .map(|bytes| format!("{:x}", Sha256::digest(bytes)))
        .unwrap_or_default()
}

fn main() {
    println!("cargo:rerun-if-changed=../src/pets");
    println!(
        "cargo:rustc-env=PET_VILLAGE_PI_RUNTIME_SHA256={}",
        runtime_hash()
    );
    println!(
        "cargo:rustc-env=PET_VILLAGE_PET_IDS={}",
        bundled_pet_ids().join(",")
    );
    compile_wake_bridge();
    tauri_build::build()
}
