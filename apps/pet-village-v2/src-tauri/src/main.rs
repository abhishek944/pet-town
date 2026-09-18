#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    if std::env::args().any(|argument| argument == "--snapshot") {
        println!("{}", pet_village_v2_lib::snapshot_json());
        return;
    }
    pet_village_v2_lib::run();
}
