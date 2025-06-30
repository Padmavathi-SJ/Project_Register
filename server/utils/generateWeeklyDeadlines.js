const generateWeeklyDeadlines = (startDate,weeks = 12) => {
    const deadlines = [];
    for(let i=1;i<=weeks;i++)
    {
        const nextDate = new Date(startDate);
        nextDate.setDate(startDate.getDate() + i * 7);
        const formatted = nextDate.toISOString().split('T')[0]; // YYYY-MM-DD
        deadlines.push(formatted);
    }
    return deadlines;
}

module.exports = generateWeeklyDeadlines;