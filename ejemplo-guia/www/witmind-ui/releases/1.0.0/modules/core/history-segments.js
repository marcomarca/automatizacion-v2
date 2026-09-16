export function buildHistorySegments(group, startTime, endTime) {
    if (!Array.isArray(group) || group.length === 0 || endTime <= startTime) {
        return [];
    }
    const events = group
        .map((item) => ({
        state: item.state,
        time: new Date(item.last_changed ?? item.last_updated ?? "").getTime(),
    }))
        .filter((item) => Number.isFinite(item.time))
        .sort((a, b) => a.time - b.time);
    if (events.length === 0)
        return [];
    const segments = [];
    for (let index = 0; index < events.length; index += 1) {
        const current = events[index];
        if (!current)
            continue;
        const next = events[index + 1];
        const segmentStart = Math.max(startTime, current.time);
        const segmentEnd = Math.min(endTime, next?.time ?? endTime);
        if (segmentEnd <= segmentStart)
            continue;
        segments.push({
            state: current.state,
            left: ((segmentStart - startTime) / (endTime - startTime)) * 100,
            width: ((segmentEnd - segmentStart) / (endTime - startTime)) * 100,
        });
    }
    return segments;
}
