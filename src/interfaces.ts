interface RawAtcoderSchedule {
    startTime: string
    contestName: string
    contestURL: string
    duration: string
    ratedRange: string
}

interface GoogleCalendarOptions {
    description: string
    location: string
    guests: string
    sendInvites: boolean
}

interface GoogleCalendarParameters {
    title: string
    startTime: Date
    endTime: Date
    options: GoogleCalendarOptions
}
