import { datetime } from "https://deno.land/x/ptera@v1.0.2/mod.ts";
// timezone
// datetime().toZonedTime("Asia/Tokyo");
const targetDate = datetime().toZonedTime("Asia/Tokyo").format("YYYYMMdd");
// datetime("2021-06-30T21:15:30.200");

const DOMAIN = 'labola.jp';
const AREA = 'area-13';

// let pageCount = 1;

//イベント情報のパース
const parseEvent = (html:string) => {
  const regex = /<a href=(\/r\/event\/show\/\d+\/)>([\s\S]*?)<\/a>/g;

  let match;
  const events = [];

  while ((match = regex.exec(html)) !== null) {
    const url = `https://${DOMAIN}${match[1]}`;
    const eventHtml = match[2];

    const title = /<h2>(.*?)<\/h2>/s.exec(eventHtml)?.[1];
    const dateTimeMatch = /<div class="date">(.*?)<\/div>/s.exec(eventHtml);
    const dateTimeRaw = dateTimeMatch ? dateTimeMatch[1].split('<span')[0] : '';  // '｜'より前の文字列を取得
  
    const dateRegex = /(\d{4}\/\d{2}\/\d{2})/; 
    const date = dateRegex.exec(dateTimeRaw)?.[1];  // 日付を抽出
  
    const dayOfWeekRegex = /（(.*?)）/;
    const dayOfWeek = dayOfWeekRegex.exec(dateTimeRaw)?.[1];  // 曜日を抽出
  
    const timeRegex = /（.*?）(\d{2}:\d{2}〜\d{2}:\d{2})/;
    const time = timeRegex.exec(dateTimeRaw)?.[1];  // 時間を抽出
  
    // const place = /<div class="date">.*?｜.*?｜(.*?)<\/div>/s.exec(eventHtml)?.[1];
    const place = /<div class="date">.*?｜.*?｜<\/span>(.*?)<\/div>/s.exec(eventHtml)?.[1];
    let address = /<div class="address">.*?Event<\/i>(.*?)<\/div>/s.exec(eventHtml)?.[1];
    if (address) {
      address = address.trim();
    }

    let price = /<div class="price">.*?Event<\/i>(.*?)<\/div>/s.exec(eventHtml)?.[1];
    if (price) {
      price = price.replace(/<\/?span[^>]*>/g, '');
    }

    let levelText = /<div class="level">.*?<\/i><span class="ccc">｜<\/span>(.*?)<\/div>/s.exec(eventHtml)?.[1];
    if (levelText) {
      levelText = levelText.replace(/<\/?span[^>]*>/g, '');
    }

    const level = {
      mix: levelText?.includes('ミックス'),
      enjoy: levelText?.includes('エンジョイ'),
    };

    let timeRemaining = /<div class="sub">受付終了まで残り(.*?)<\/div>/s.exec(eventHtml)?.[1];
    if (timeRemaining) {
      timeRemaining = timeRemaining.replace(/<\/?span[^>]*>/g, '');
    }
  
    events.push({ url, title, date, dayOfWeek, time, place, address, price, level, levelText, timeRemaining });
  }
  
  return events;
}

//次のページはあるかどうか
const hasNextPage = (html:string) => {
  const hasNextPage = !html.includes('<li><span><i class="i14 next m0">次へ</i></span></li>');
  // console.log(hasNextPage);
  return hasNextPage;
}

//過去のファイルを削除
const oldFilesDel = async (targetDate: string) => {
  for await (const file of Deno.readDir(`./docs`)) {
    const [fileDate,fileEx] = file.name.split('.');
    if(fileEx !== 'json') continue;

    const targetDateNum = Number(targetDate) - 7; //7日前のファイルを消す
    
    console.log(fileDate,fileEx,targetDate, targetDateNum)

    if(Number(fileDate) < targetDateNum){
      console.log(`file.name`)
      Deno.removeSync(`docs/${file.name}`);
    }
  }
}

let events: any[] = [];

// deno-lint-ignore no-inferrable-types
const getPage = async (pageCount:number = 1, targetDate:string) => {
  const DAY = `day-${targetDate}`;
  const BASE_URL = `https://${DOMAIN}/reserve/events/search/personal/${AREA}/${DAY}/?page=${pageCount}`;
  const json = fetch(BASE_URL);
  const html = await (await json).text();

  if(hasNextPage(html)){
    console.log(`page ${pageCount}`);
    const eventsParts = parseEvent(html);
    events = [...events, ...eventsParts];
    getPage(++pageCount, targetDate);
  }else{
    console.log(`done`);
    // console.log(events);

    const result = {
      lastUpdated: datetime().toZonedTime("Asia/Tokyo").format("YYYY/MM/dd HH:mm:ss"),
      date: targetDate,
      eventCount: events.length,
      events: events,
    }
    //ファイル書き込み
    await Deno.writeTextFile(`docs/${targetDate}.json`, JSON.stringify(result, null, 2));

    //ファイル削除
    // oldFilesDel(targetDate);
  }
}

const main = () => {
  const currenDate = datetime().toZonedTime("Asia/Tokyo");
  const currentHour = currenDate.hour;
  console.log(currentHour) //現在時
  
  const targetDate = currenDate.add({day: currentHour+1}).format("YYYYMMdd");
  console.log(currenDate.format("YYYYMMdd"), targetDate)

  getPage(1, targetDate);
}

main();



// console.log(Deno.readDir(`docs`))