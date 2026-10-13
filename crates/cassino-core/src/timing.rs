//! How long a piece of work took, for the tests that bound it.

/// What `f` returns, and the seconds it took on this thread's CPU: the
/// work itself, not the wait for a core while other tests run beside it
/// (the engine is single-threaded). Wall time where the thread's CPU time
/// cannot be read (outside Linux).
pub fn cpu_seconds<T>(f: impl FnOnce() -> T) -> (T, f64) {
    let (cpu, wall) = (thread_cpu(), std::time::Instant::now());
    let out = f();
    let took = match (cpu, thread_cpu()) {
        (Some(a), Some(b)) => b - a,
        _ => wall.elapsed().as_secs_f64(),
    };
    (out, took)
}

/// This thread's user and system time so far, from
/// `/proc/thread-self/stat` (fields 14 and 15, in ticks of 1/100 s).
fn thread_cpu() -> Option<f64> {
    let stat = std::fs::read_to_string("/proc/thread-self/stat").ok()?;
    // The command name, field 2, may hold spaces: count from its ")".
    let rest = &stat[stat.rfind(')')? + 2..];
    let fields: Vec<&str> = rest.split_whitespace().collect();
    let ticks = |i: usize| fields.get(i)?.parse::<u64>().ok();
    // `rest` begins at field 3.
    Some((ticks(11)? + ticks(12)?) as f64 / 100.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[cfg(target_os = "linux")]
    fn work_counts_and_waiting_does_not() {
        let ((), slept) = cpu_seconds(|| std::thread::sleep(std::time::Duration::from_millis(300)));
        assert!(slept < 0.1, "{slept}");
        let (_, busy) = cpu_seconds(|| {
            let started = std::time::Instant::now();
            let mut x = 0u64;
            while started.elapsed().as_secs_f64() < 0.3 {
                x = std::hint::black_box(x.wrapping_add(1));
            }
            x
        });
        assert!(busy > 0.1, "{busy}");
    }
}
