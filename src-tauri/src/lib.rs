use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct VideoInfo {
    pub duration: f64,
    pub size: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SplitProgress {
    pub current_clip: u32,
    pub total_clips: u32,
    pub percentage: f64,
}

/// Get video information using ffprobe
#[tauri::command]
fn get_video_info(path: String) -> Result<VideoInfo, String> {
    // Get duration using ffprobe
    let output = Command::new("ffprobe")
        .args([
            "-v",
            "quiet",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            &path,
        ])
        .output()
        .map_err(|e| format!("Failed to run ffprobe: {}. Is FFmpeg installed?", e))?;

    if !output.status.success() {
        return Err(format!(
            "ffprobe failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    let duration_str = String::from_utf8_lossy(&output.stdout);
    let duration: f64 = duration_str
        .trim()
        .parse()
        .map_err(|_| "Failed to parse duration")?;

    // Get file size
    let metadata = std::fs::metadata(&path).map_err(|e| format!("Failed to get file info: {}", e))?;
    let size = metadata.len();

    Ok(VideoInfo { duration, size })
}

/// Split video into segments
#[tauri::command]
async fn split_video(
    input_path: String,
    output_dir: String,
    prefix: String,
    suffix: String,
    duration_seconds: f64,
) -> Result<u32, String> {
    // Get video duration first
    let info = get_video_info(input_path.clone())?;
    let total_duration = info.duration;

    // Calculate number of clips
    let total_clips = (total_duration / duration_seconds).ceil() as u32;

    // Get the file extension from input
    let extension = std::path::Path::new(&input_path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("mp4");

    // Create output directory if it doesn't exist
    std::fs::create_dir_all(&output_dir)
        .map_err(|e| format!("Failed to create output directory: {}", e))?;

    // Split the video
    for i in 0..total_clips {
        let start_time = i as f64 * duration_seconds;
        let output_filename = format!(
            "{}{:03}{}.{}",
            prefix,
            i + 1,
            suffix,
            extension
        );
        let output_path = std::path::Path::new(&output_dir).join(&output_filename);

        let output = Command::new("ffmpeg")
            .args([
                "-y", // Overwrite output files
                "-ss",
                &start_time.to_string(),
                "-i",
                &input_path,
                "-t",
                &duration_seconds.to_string(),
                "-c",
                "copy", // Copy without re-encoding for speed
                "-avoid_negative_ts",
                "make_zero",
                output_path.to_str().unwrap(),
            ])
            .output()
            .map_err(|e| format!("Failed to run ffmpeg: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            // Ignore "Output file is empty" errors for last clip
            if !stderr.contains("Output file is empty") {
                return Err(format!("ffmpeg failed for clip {}: {}", i + 1, stderr));
            }
        }
    }

    Ok(total_clips)
}

/// Check if ffmpeg is installed
#[tauri::command]
fn check_ffmpeg() -> Result<bool, String> {
    match Command::new("ffmpeg").arg("-version").output() {
        Ok(output) => Ok(output.status.success()),
        Err(_) => Ok(false),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_video_info,
            split_video,
            check_ffmpeg
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
