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

// deno-lint-ignore no-inferrable-types
const getPage = async (targetDate:string , events:arr, pageCount:number = 1) => {
  const DAY = `day-${targetDate}`;

  //EX: https://labola.jp/reserve/events/search/personal/area-13/day-20230910/?page=5
  const BASE_URL = `https://${DOMAIN}/reserve/events/search/personal/${AREA}/${DAY}/?page=${pageCount}`;
  const json = fetch(BASE_URL);
  const html = await (await json).text();

  //とりあえずFetch
  console.log(`${targetDate}: page ${pageCount} Fetch...`);
  const eventsParts = parseEvent(html);
  events = [...events, ...eventsParts];
  
  if(hasNextPage(html)){
    //次のページへ
    return getPage(targetDate, events,  ++pageCount);
  }else{
    console.log(`done`);
    // console.log(events);

    const result = {
      url: BASE_URL,
      lastUpdated: datetime().toZonedTime("Asia/Tokyo").format("YYYY/MM/dd HH:mm:ss"),
      date: targetDate,
      eventCount: events.length,
      events: events,
    }
    //ファイル書き込み
    return Deno.writeTextFile(`docs/${targetDate}.json`, JSON.stringify(result, null, 2));
    //ファイル削除
    // oldFilesDel(targetDate);
  }
}


/*
現在時を取得し、その時間(H)に対してH + (H + 1)とH + (H + 2)を計算し、N日後として取得してデータをスクレイピング

例えば
- 現在時刻が0時なら、1日後と2日後のデータを取得する
- 現在時刻が1時なら、3日後と4日後のデータを取得する
- 現在時刻が23時なら、47日後と48日後のデータを取得する
*/
const main = async () => {
  
  const currenDate = datetime().toZonedTime("Asia/Tokyo");
  const currentHour = currenDate.hour;
  console.log('現在:'+ currentHour +'時です。') //現在時
  
  // N days later
  const n1 = currentHour + (currentHour+1); //t1 = H + (H + 1)
  const n2 = currentHour + (currentHour+2); //t2 = H + (H + 2)

  const targetDate1 = currenDate.add({day: n1}).format("YYYYMMdd");
  const targetDate2 = currenDate.add({day: n2}).format("YYYYMMdd");
  console.log('今日の日付:' + currenDate.format("YYYYMMdd"));
  console.log(`対象日1(${n1}日後の日付): ${targetDate1}です。`);
  console.log(`対象日2(${n2}日後の日付): ${targetDate2}です。`);
  console.log(`--------`);

  let events: any[] = [];
  await getPage(currenDate.format("YYYYMMdd"), events); //今日のデータ

  events = []; //初期化
  await getPage(targetDate1, events); //H + (H + 1)日後のデータ

  events = []; //初期化
  await getPage(targetDate2, events); //H + (H + 2)日後のデータ

  // await getPage('20230910', events); //N日後のデータ
}

main();



// console.log(Deno.readDir(`docs`))