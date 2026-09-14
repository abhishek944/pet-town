use crate::labels::{space_tab_label, RawTabLabel};

#[test]
fn fallback_uses_space_name_and_visible_tab_label() {
    assert_eq!(
        space_tab_label(
            "bloom-turbo",
            &RawTabLabel {
                tab_id: "w8:t1D".to_string(),
                label: Some("1".to_string()),
                number: Some(45),
            },
        ),
        "bloom-turbo-1"
    );
}

#[test]
fn fallback_keeps_a_named_tab_identifiable() {
    assert_eq!(
        space_tab_label(
            "pet-village",
            &RawTabLabel {
                tab_id: "w7:t2".to_string(),
                label: Some("tests".to_string()),
                number: Some(2),
            },
        ),
        "pet-village-tests"
    );
}
