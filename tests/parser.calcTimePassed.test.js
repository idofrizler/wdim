const { JSDOM } = require('jsdom');
const { calcTimePassed, parseHTMLRows } = require('../content/parser.js');  // add this line

describe("calcTimePassed tests", () => {
    
    let originalDate;

    beforeEach(() => {
        // Backup the original Date class.
        originalDate = global.Date;
      
        // Mock the Date constructor to always return a fixed date.
        global.Date = class extends originalDate {
            constructor(date) {
                if (date) {
                    return super(date);
                }
                return new originalDate('2023-08-05T23:44:00.000');
            }
        };
    });

    it("Happy flow", () => {
        const dom = new JSDOM(`<div class="" role="row"><div tabindex="-1" class="CzM4m" data-id="false_972503235812-1352922145@g.us_3F0A0AF900ECF58E8CF5ABF5329A274D_972503235812@c.us" data-testid="conv-msg-false_972503235812-1352922145@g.us_3F0A0AF900ECF58E8CF5ABF5329A274D_972503235812@c.us"><div class="_3sxvM message-in focusable-list-item _1AOLJ _1jHIY"><span></span><div data-testid="msg-container" class="UzMP7 _1uv-a _3m5cz"><span data-testid="tail-in" data-icon="tail-in" class="p0s8B"><svg viewBox="0 0 8 13" height="13" width="8" preserveAspectRatio="xMidYMid meet" class="" version="1.1" x="0px" y="0px" enable-background="new 0 0 8 13" xml:space="preserve"><path opacity="0.13" fill="#0000000" d="M1.533,3.568L8,12.193V1H2.812 C1.042,1,0.474,2.156,1.533,3.568z"></path><path fill="currentColor" d="M1.533,2.568L8,11.193V0L2.812,0C1.042,0,0.474,1.156,1.533,2.568z"></path></svg></span><div data-testid="group-chat-profile-picture" tabindex="0" role="button" aria-label="Open chat details for Shay Haim" class="lhggkp7q g9p5wyxn i0tg5vk9 aoogvgrq o2zu3hjb hj486dpu a2hqsskl stnyektq" style="cursor: pointer;"><img src="https://pps.whatsapp.net/v/t61.24694-24/56122107_825782801116962_4025791318918692864_n.jpg?stp=dst-jpg_s96x96&amp;ccb=11-4&amp;oh=01_AdTFFjqGjiF4HNE2e7rGM_JJheTYlcyPkaiX6eqNtxP0EA&amp;oe=64E75FF2" alt="" draggable="false" class="csshhazd g0rxnol2 f804f6gw ln8gz9je ppled2lx gfz4du6o r7fjleex g9p5wyxn i0tg5vk9 aoogvgrq o2zu3hjb bs7a17vp _11JPr" tabindex="-1" style="visibility: visible;"></div><div class="_1BOF7 _2AOIt"><div><div class="cm280p3y to2l77zo n1yiu2zv ft2m32mm oq31bsqd e1yunedv"><div class="_3IzYj color-1 _6rIWC p357zi0d" role=""><span data-testid="author" dir="auto" aria-label="" class="_3FuDI ajgl1lbb edeob0r2 _11JPr">Shay Haim</span></div><div class="_1DETJ copyable-text" data-pre-plain-text="[22:16, 03/08/2023] Shay Haim: "><div class="_21Ahp"><span dir="rtl" aria-label="" class="_11JPr selectable-text copyable-text"><span class="f804f6gw ln8gz9je">באופן מוזר אני בפתח תקווה במחר ב9:00 לפנות בוקר</span></span><span class=""><span class="o38k74y6 i86elurf neme6l2y kojwoqec bbl9m3t3 i5tg98hk jfqm35v0 przvwfww bdbt56hn cr2cog7z" aria-hidden="true"><span class="tvf2evcx oq44ahr5">22:16</span></span></span></div></div><div class="g0rxnol2 g2bpp9au ivui8b66 aja0i6dq jnwc1y2a bn7x0pqn qnz2jpws"><div class="gq1t1y46 o38k74y6 e4p1bexh cr2cog7z le5p0ye3 p357zi0d gndfcl4n" data-testid="msg-meta"><span class="l7jjieqr fewfhwl7" dir="auto">22:16</span></div></div></div></div><span></span><div class="_1OdBf"></div></div><div class="tvf2evcx m0h2a7mj lb5m6g5c j7l1k36l ktfrpxia nu7pwgvd p357zi0d dnb887gk gjuq5ydh i2cterl7 fhf7t426 sap93d0t gndfcl4n FxqSn"><div class="tvf2evcx m0h2a7mj lb5m6g5c j7l1k36l ktfrpxia nu7pwgvd dnb887gk gjuq5ydh i2cterl7 rqm6ogl5 i5tg98hk folpon7g przvwfww snweb893"><div></div></div></div></div></div></div></div>`);
        const rowElements = dom.window.document.querySelectorAll('div[role="row"]');

        const messageJson = parseHTMLRows(rowElements);
        const result = calcTimePassed(messageJson.messageText);
        expect(result).toBe("2 days and 1 hours ago");
    });

    it("First message doesn't contain a date; needs to return gracefully", () => {
        const dom = new JSDOM(`<div class="" role="row"><div tabindex="-1" class="CzM4m" data-id="false_972503235812-1352922145@g.us_0479A3DB1994731B3851D1CABAA187CC_972503235812@c.us" data-testid="conv-msg-false_972503235812-1352922145@g.us_0479A3DB1994731B3851D1CABAA187CC_972503235812@c.us"><div class="message-in focusable-list-item _1AOLJ _1jHIY"><span></span><div data-testid="msg-container" class="UzMP7 _27hEJ _3m5cz"><span data-testid="tail-in" data-icon="tail-in" class="p0s8B"><svg viewBox="0 0 8 13" height="13" width="8" preserveAspectRatio="xMidYMid meet" class="" version="1.1" x="0px" y="0px" enable-background="new 0 0 8 13" xml:space="preserve"><path opacity="0.13" fill="#0000000" d="M1.533,3.568L8,12.193V1H2.812 C1.042,1,0.474,2.156,1.533,3.568z"></path><path fill="currentColor" d="M1.533,2.568L8,11.193V0L2.812,0C1.042,0,0.474,1.156,1.533,2.568z"></path></svg></span><div data-testid="group-chat-profile-picture" tabindex="0" role="button" aria-label="Open chat details for Shay Haim" class="lhggkp7q g9p5wyxn i0tg5vk9 aoogvgrq o2zu3hjb hj486dpu a2hqsskl stnyektq" style="cursor: pointer;"><img src="https://pps.whatsapp.net/v/t61.24694-24/56122107_825782801116962_4025791318918692864_n.jpg?stp=dst-jpg_s96x96&amp;ccb=11-4&amp;oh=01_AdTFFjqGjiF4HNE2e7rGM_JJheTYlcyPkaiX6eqNtxP0EA&amp;oe=64E75FF2" alt="" draggable="false" class="csshhazd g0rxnol2 f804f6gw ln8gz9je ppled2lx gfz4du6o r7fjleex g9p5wyxn i0tg5vk9 aoogvgrq o2zu3hjb bs7a17vp _11JPr" tabindex="-1" style="visibility: visible;"></div><div class="_1BOF7 _2AOIt"><div class="cm280p3y eu4mztcy ocd2b0bc folpon7g aa0kojfi snweb893 g0rxnol2 jnl3jror"><div><div class="bxcbqipq mhcwslh8 ocd2b0bc jfqm35v0"><div class="_3IzYj color-1 _6rIWC p357zi0d" role=""><span data-testid="author" dir="auto" aria-label="" class="_3FuDI ajgl1lbb edeob0r2 _11JPr">Shay Haim</span></div></div><div role="button" tabindex="0" data-testid="image-thumb" aria-label="Open Picture" class="gndfcl4n l8fojup5 paxyh2gw sfeitywo cqsf3vkf p357zi0d ac2vgrno laorhtua gfz4du6o r7fjleex g0rxnol2" style="width: 240px; height: 269.111px;"><span><div class="gndfcl4n k17s6i4e p357zi0d ppled2lx ac2vgrno tkdu00h0 lhggkp7q qq0sjtgm ln8gz9je mb8var44" data-testid="media-state-download"><button tabindex="0" class="gndfcl4n g8xmoczg a9yjteo0 pox2cllw pi22tx4b oov82czi k17s6i4e i86elurf ovllcyds qmp0wt83 i5tg98hk tcyu26xv przvwfww rn41jex5 g0rxnol2 fewfhwl7 ajgl1lbb"><span data-testid="media-download" data-icon="media-download" class="tvf2evcx oq44ahr5 q471nw87"><svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" class="" version="1.1"><path d="M19.4725963,12.2 L15.1725963,12.2 L15.1725963,2.9 C15.1725963,2.4 14.7725963,2 14.2725963,2 L9.97259631,2 C9.47259631,2 9.07259631,2.4 9.07259631,2.9 L9.07259631,12.2 L4.77259631,12.2 C3.97259631,12.2 3.77259631,12.7 4.27259631,13.3 L11.0725963,20.6 C11.7725963,21.5 12.4725963,21.3 13.1725963,20.6 L19.9725963,13.3 C20.4725963,12.7 20.2725963,12.2 19.4725963,12.2 Z" fill="currentColor"></path></svg></span><span>90 kB</span></button></div></span><img class="jciay5ix tvf2evcx oq44ahr5 lb5m6g5c fsmudgz7" style="width: 100%;"><div class="lhggkp7q jxacihee tkdu00h0 b9fczbqn ln8gz9je he7yjufn e1lnay39"></div></div><div class="dpkuihx7 lhggkp7q j2mzdvlq b9fczbqn"><div class="pp8r7oc8 o38k74y6 e4p1bexh cr2cog7z le5p0ye3 p357zi0d gndfcl4n" data-testid="msg-meta"><span class="l7jjieqr fewfhwl7" dir="auto">17:43</span></div></div></div></div><span></span><div class="_1OdBf"></div></div><div class="tvf2evcx m0h2a7mj lb5m6g5c j7l1k36l ktfrpxia nu7pwgvd p357zi0d dnb887gk gjuq5ydh i2cterl7 fhf7t426 sap93d0t gndfcl4n FxqSn"><div class="tvf2evcx m0h2a7mj lb5m6g5c j7l1k36l ktfrpxia nu7pwgvd dnb887gk gjuq5ydh i2cterl7 rqm6ogl5 i5tg98hk folpon7g przvwfww snweb893"><div></div></div></div></div></div></div></div>`);
        const rowElements = dom.window.document.querySelectorAll('div[role="row"]');
  
        const messageJson = parseHTMLRows(rowElements);
        const result = calcTimePassed(messageJson.messageText);
        expect(result).toBe(null);
    });

    afterEach(() => {
        // Restore the original Date class after each test.
        global.Date = originalDate;
    });
});