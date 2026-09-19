use crate::preferences_model::{
    AppearancePreferences, LabelPreferences, LabelVisibility, MotionLevel, MotionPreferences,
    PetPreferences,
};

impl Default for PetPreferences {
    fn default() -> Self {
        Self {
            included_in_random_cast: true,
            appearance: AppearancePreferences {
                scale_percent: 100,
                opacity_percent: 100,
            },
            labels: LabelPreferences {
                visibility: LabelVisibility::Always,
                text_scale_percent: 100,
            },
            motion: MotionPreferences {
                level: MotionLevel::Standard,
                reduced: false,
                pause_on_hover: false,
            },
        }
    }
}
