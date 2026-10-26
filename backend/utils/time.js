export const timeToMinutes = (time) => {
    const normalizedTime = /^\d{2}:\d{2}$/.test(String(time))
        ? String(time)
        : String(time).match(/(?:T|\s)(\d{2}):(\d{2})(?::\d{2})?/)?.slice(1, 3).join(":");
    if (!normalizedTime) return Number.NaN;
    const [hours, minutes] = normalizedTime.split(":").map(Number);
    return hours * 60 + minutes;
};

export const minutesToTime = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}; 

export const isValidTimeRange = (startTime, endTime) => {
    return timeToMinutes(startTime) < timeToMinutes(endTime);
};

export const getDayOfWeek = (date) => {
    return new Date(`${date}T00:00:00`).getDay();
};