from pathlib import Path

content = Path('gym-tracker.html').read_text(encoding='utf-8')

# Find position
target = 'document.addEventListener("DOMContentLoaded", init);'
pos = content.find(target)

if pos > 0:
    insert_pos = pos + len(target)
    new_code = '''

// Sync timers when returning from background
function syncForegroundTimers() {
    syncTimerState();
    syncRestTimer();
}

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        syncForegroundTimers();
    }
});

window.addEventListener("focus", syncForegroundTimers);
'''
    new_content = content[:insert_pos] + new_code + content[insert_pos:]
    Path('gym-tracker.html').write_text(new_content, encoding='utf-8')
    print('✅ Visibility change handlers added')
else:
    print('❌ Could not find DOMContentLoaded')
