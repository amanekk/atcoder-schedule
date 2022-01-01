/**
 * AtCoderのサイトからコンテストの予定を取得して、google calendarに予定を登録する。
 */
function main(): void {
    const configFileName: string = "config_json.html"
    const config: object = getConfig(configFileName)

    const rawSchedules: RawAtcoderSchedule[] = getAtcoderSchedule();
    
    const googleCalendarParamsArray: GoogleCalendarParameters[] = new Array(rawSchedules.length);
    rawSchedules.map((rawSchedule, index) => {
        googleCalendarParamsArray[index] = convertRawAtcoderSchedule(rawSchedule);
    });

    const targetGoogleCalendarParamsArray = removeExistingEvents(config["calendar_id"], googleCalendarParamsArray);

    targetGoogleCalendarParamsArray.map((params, index) => {
        let event = createGoogleCalendarEvent(config["calendar_id"], params);
    })
}

/**
 * google calendarのID等を記載しているHTMLファイルを読み込む関数。
 * ここでのHTMLファイルは拡張子は.htmlだが、内容はjsonで記述する。
 * @param {string} configFileName 読み込むHTMLファイル名
 * @return {object}               読み込んだHTMLファイルの情報をもつobject
 */
function getConfig(configFileName: string): object {
    const config: object = JSON.parse(HtmlService.createHtmlOutputFromFile(configFileName).getContent());

    return config;
}

/**
 * スクレイピングしたAtCoderの予定をgoogle calendarに登録できる形式に変換する。
 * 加えて、長期間すぎるイベントは6時間まで期間を狭める。
 * @param  {RawAtcoderSchedule} rawSchedule 
 * @return {GoogleCalendarParameters}       返り値の説明
 */
function convertRawAtcoderSchedule(rawSchedule: RawAtcoderSchedule): GoogleCalendarParameters {
    const description = `URL: ${rawSchedule["contestURL"]} \nRated Range: ${rawSchedule["ratedRange"]}`
    const options: GoogleCalendarOptions = {
        description: description,
        location: "",
        guests: "",
        sendInvites: false
    }
    const durationArray = rawSchedule["duration"].split(":");
    let minutes: number = Number(durationArray[0]) * 60 + Number(durationArray[1]);
    let title = rawSchedule["contestName"];
    if (minutes > 360) {
        minutes = 360
        title = "(長期間)" + title
    }
    const startTime = new Date(rawSchedule["startTime"]);
    let endTime = new Date(rawSchedule["startTime"]);
    endTime.setMinutes(endTime.getMinutes() + minutes);

    const googleParams: GoogleCalendarParameters = {
        title: title,
        startTime: startTime,
        endTime: endTime,
        options: options,
    }

    return googleParams;
}

/**
 * AtCoderのサイトから今後のコンテストの開催予定を取得
 * @return {RawAtcoderSchedule[]} 今後開催予定のコンテストの情報をもつArray
 */
function getAtcoderSchedule(): RawAtcoderSchedule[] {
    const atcoderScheduleURL: string = "https://atcoder.jp/contests"
    const responce = UrlFetchApp.fetch(atcoderScheduleURL).getContentText();

    let rawSchedules: RawAtcoderSchedule[] = new Array();

    const $ = Cheerio.load(responce);
    const $trs = $('#contest-table-upcoming > div > div > table > tbody > tr');
    
    $trs.map((_index, element) => {
        let rawSchedule: RawAtcoderSchedule = {
            startTime: "",
            contestName: "",
            contestURL: "",
            duration: "",
            ratedRange: "",
        };
        const $tds = $(element).find('td');
        $tds.map((index2, element2) => {
            if (index2 === 0) {
                rawSchedule["startTime"] = $(element2).find('time').text();
            } else if (index2 === 1) {
                rawSchedule["contestName"] = $(element2).find('a').text();
                rawSchedule["contestURL"] = atcoderScheduleURL + $(element2).find('a').attr('href');
            } else if (index2 === 2) {
                rawSchedule["duration"] = $(element2).text();
            } else {
                rawSchedule["ratedRange"] = $(element2).text();
            }
        });
        rawSchedules.push(rawSchedule);
    });

    return rawSchedules;
}

/**
 * google calendar上に予定を登録する
 * @param  {string} calendarId                       google calendarのID
 * @param  {GoogleCalendarParameters} calendarParams google calendarに登録する予定の内容
 * @return {GoogleAppsScript.Calendar.CalendarEvent} 
 */
function createGoogleCalendarEvent(calendarId: string, calendarParams: GoogleCalendarParameters): GoogleAppsScript.Calendar.CalendarEvent {
    const calendar = CalendarApp.getCalendarById(calendarId)
    const event = calendar.createEvent(
        calendarParams["title"],
        calendarParams["startTime"],
        calendarParams["endTime"],
        calendarParams["options"]
    );

    return event;
}

/**
 * すでにgoogle calendarに登録してある予定は登録しないようにする
 * @param  {string} calendarId                       google calendarのID
 * @param  {GoogleCalendarParameters[]} newEvents    AtCoderのサイトから取得したコンテストの開催予定情報
 * @return {GoogleCalendarParameters[]}              google calendarに追加するコンテストの開催予定情報
 */
function removeExistingEvents(calendarId: string, newEvents: GoogleCalendarParameters[]): GoogleCalendarParameters[] {
    let addEvents: GoogleCalendarParameters[] = new Array();
    const calendar = CalendarApp.getCalendarById(calendarId);
    newEvents.map((newEvent, index) => {
        const existingEvents = calendar.getEvents(newEvent["startTime"], newEvent["endTime"]);
        let isExisting = false;
        for (let i=0;i<existingEvents.length;i++) {
            let event = existingEvents[i];
            if (event.getTitle() === newEvent['title']) {
                isExisting = true;
                break;
            }
        }

        if (!isExisting) {
            addEvents.push(newEvent);
        }
    })

    return addEvents;
}
